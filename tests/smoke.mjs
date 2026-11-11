// End-to-end smoke test. Start the worker with: npx wrangler dev --port 8787   then run: node tests/smoke.mjs  (Node 22+)
const S=Math.random().toString(36).slice(2,8);const B="http://localhost:8787"; let fails=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":"  -> "+JSON.stringify(x)));if(!c)fails++};
const j=async(p,o)=>{const r=await fetch(B+p,o);const t=await r.text();return{r,t}};
// static + cors
let a=await j("/"); ok("static index", a.r.status==200 && a.t.includes("<html"),a.r.status);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"OPTIONS"}); ok("OPTIONS 204+cors",a.r.status==204&&a.r.headers.get("access-control-allow-origin")=="*",a.r.status);
a=await j("/db/bogus"); ok("bad db path 404",a.r.status==404,a.r.status);
// storage
a=await j(`/db/rooms/t1${S}/stamp.json`); ok("stamp empty",a.t=='{"m":0,"g":0,"t":0}',a.t);
a=await j(`/db/rooms/t1${S}/m.json`); ok("list empty null",a.t=="null",a.t);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:JSON.stringify({zeta:{up:{".sv":"timestamp"},d:"QUJD"},alpha:{d:"REVG"}})}); ok("patch ok",a.t=="{}"&&a.r.status==200,a.t);
a=await j(`/db/rooms/t1${S}/m.json`); let o=JSON.parse(a.t); const ks=Object.keys(o);
ok("list order = insertion order",ks.join()=="zeta,alpha",ks); ok("up strictly increasing",o.zeta.up<o.alpha.up,o); ok("d kept",o.zeta.d=="QUJD");
a=await j(`/db/rooms/t1${S}/stamp.json`); const st=JSON.parse(a.t); ok("stamp m = newest up",st.m==o.alpha.up,[st,o]);
a=await j(`/db/rooms/t1${S}/m.json?orderBy="up"&startAt=${o.alpha.up}`); ok("startAt filters",Object.keys(JSON.parse(a.t)).join()=="alpha",a.t);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:JSON.stringify({zeta:null})}); a=await j(`/db/rooms/t1${S}/m.json`); ok("delete via null",Object.keys(JSON.parse(a.t)).join()=="alpha",a.t);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:JSON.stringify({x:{d:"A"},y:{d:5}})}); ok("invalid batch rejected 400",a.r.status==400,a.t);
a=await j(`/db/rooms/t1${S}/m.json`); ok("all-or-nothing",!("x" in JSON.parse(a.t)),a.t);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:"not json"}); ok("garbage body 400",a.r.status==400,a.t);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:JSON.stringify({big:{d:"x".repeat(700000)}})}); ok("700k record rejected",a.r.status==400,a.r.status);
a=await j(`/db/rooms/t1${S}/m.json`,{method:"PATCH",body:JSON.stringify({q:{d:'a"b'}})}); a=await j(`/db/rooms/t1${S}/m.json`); ok("quote in d stays valid JSON",(()=>{try{return JSON.parse(a.t).q.d=='a"b'}catch{return false}})(),a.t);
// gc
a=await j(`/db/rooms/t1${S}/gc/game%201.json`,{method:"PUT",body:JSON.stringify({d:"R0FNRQ=="})}); ok("gc put",a.t=="null"&&a.r.status==200,a.t);
a=await j(`/db/rooms/t1${S}/gc/game%201.json`); ok("gc get",JSON.parse(a.t).d=="R0FNRQ==",a.t);
a=await j(`/db/rooms/t1${S}/gc/game%201.json`,{method:"DELETE"}); a=await j(`/db/rooms/t1${S}/gc/game%201.json`); ok("gc delete",a.t=="null",a.t);
// import
a=await j(`/db/rooms/t2${S}.json`,{method:"PUT",body:JSON.stringify({m:{b:{up:2000,d:"Qg=="},a:{up:1000,d:"QQ=="}},g:{k:{up:"5",d:"Rw=="}},gc:{z:{up:1,d:"Wg=="}},t:{bad:{d:3}}})}); ok("import count 4",a.t=='{"imported":4}',a.t);
a=await j(`/db/rooms/t2${S}/m.json`); o=JSON.parse(a.t); ok("import keeps order",Object.keys(o).join()=="a,b"&&o.a.up==1000,a.t);
// rooms isolated
a=await j(`/db/rooms/t3${S}/m.json`); ok("rooms isolated",a.t=="null",a.t);
// websocket
a=await j("/ws"); ok("ws w/o upgrade 426",a.r.status==426,a.r.status);
const open=(room)=>new Promise((res,rej)=>{const w=new WebSocket(`ws://localhost:8787/ws?room=${room}`);const m=[];w.onmessage=e=>m.push(e.data);w.onopen=()=>res({w,m});w.onerror=rej});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const H=await open("r1"+S); await wait(300);
ok("first = host hello",H.m[0]&&H.m[0].startsWith("c")&&JSON.parse(H.m[0].slice(1)).host===true,H.m);
const hcid=JSON.parse(H.m[0].slice(1)).cid; ok("cid 10 hex",/^[0-9a-f]{10}$/.test(hcid),hcid);
const C=await open("r1"+S); await wait(300);
const cc=JSON.parse(C.m[0].slice(1)); ok("second = client",cc.host===false,C.m);
ok("host told 'o<cid>'",H.m.includes("o"+cc.cid),H.m);
C.w.send("hello host"); await wait(300); ok("client->host 'd<cid>\\n'",H.m.includes(`d${cc.cid}\nhello host`),H.m);
H.w.send(`d${cc.cid}\nreply`); await wait(300); ok("host->client 'd<payload>'",C.m.includes("dreply"),C.m);
H.w.send(`d\nnoone`); H.w.send(`dnotacid\nx`); await wait(200);
const R=await open("r2"+S); await wait(300); ok("rooms separate (new host)",JSON.parse(R.m[0].slice(1)).host===true,R.m); R.w.close();
H.w.send("k"+cc.cid); await wait(400); ok("kick: host gets 'x<cid>'",H.m.includes("x"+cc.cid),H.m);
ok("kick: client closed",C.w.readyState===3,C.w.readyState);
const C2=await open("r1"+S); await wait(300); ok("rejoin as client",JSON.parse(C2.m[0].slice(1)).host===false);
let closed=null; C2.w.onclose=e=>closed=e.code; H.w.close(); await wait(500);
ok("host leaves -> others dropped",C2.w.readyState>=2,C2.w.readyState);
const N=await open("r1"+S); await wait(300); ok("first back becomes host",JSON.parse(N.m[0].slice(1)).host===true,N.m);
N.w.send("ping"); await wait(200);
console.log(fails?`\n${fails} FAILED`:"\nALL PASSED"); process.exit(fails?1:0);
