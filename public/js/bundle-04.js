/* ===== 08-addon-js.js ===== */
(function(){
  /* =============== crypto helpers (pure JS, works on http too) =============== */
  function sha256(str){
    const b=new TextEncoder().encode(str), l=b.length, K=[], H=[], pr=[];
    for(let n=2;pr.length<64;n++){let ok=true;for(const p of pr){if(p*p>n)break;if(n%p===0){ok=false;break;}}if(ok)pr.push(n);}
    const fr=x=>((x-Math.floor(x))*4294967296)>>>0;
    for(let i=0;i<64;i++)K[i]=fr(Math.cbrt(pr[i]));
    for(let i=0;i<8;i++)H[i]=fr(Math.sqrt(pr[i]));
    const total=((l+8)>>6)+1, words=new Uint32Array(total*16);
    for(let i=0;i<l;i++)words[i>>2]|=b[i]<<(24-(i&3)*8);
    words[l>>2]|=0x80<<(24-(l&3)*8);
    words[total*16-1]=l*8;
    const W=new Uint32Array(64);
    for(let j=0;j<total;j++){
      for(let t=0;t<16;t++)W[t]=words[j*16+t];
      for(let t=16;t<64;t++){
        const a=W[t-15],c=W[t-2];
        const s0=((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3);
        const s1=((c>>>17)|(c<<15))^((c>>>19)|(c<<13))^(c>>>10);
        W[t]=(W[t-16]+s0+W[t-7]+s1)>>>0;
      }
      let [a,b2,c,d,e,f,g,h]=H;
      for(let t=0;t<64;t++){
        const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7));
        const ch=(e&f)^(~e&g), t1=(h+S1+ch+K[t]+W[t])>>>0;
        const S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10));
        const mj=(a&b2)^(a&c)^(b2&c), t2=(S0+mj)>>>0;
        h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b2;b2=a;a=(t1+t2)>>>0;
      }
      [a,b2,c,d,e,f,g,h].forEach((v,i)=>{H[i]=(H[i]+v)>>>0;});
    }
    return H.map(v=>v.toString(16).padStart(8,"0")).join("");
  }
  // sha256("pbadmin:1214")  — the admin password is checked against this hash, never stored in plain text
  const ADMIN_KEY="f567d48a1a4eabaf3e4cb51f66f52ccd718b9e763cbd4e194debbb7734f13c6f";
  const hCred=p=>sha256("pb1:"+p);            // what a user's browser remembers + sends to log in
  const hVer=h=>sha256("pbv:"+h);             // what the room stores (can't be replayed as a login)
  const HEX=/^[0-9a-f]{64}$/;
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:"";

  /* =============== custom tags: anyone can make their own, but never one that looks like admin / mod / owner =============== */
  const TAG_COLORS=["#5865f2","#a855f7","#ec4899","#f59e0b","#eab308","#14b8a6","#06b6d4","#9ca3af"];      // no red / green: those belong to the ADMIN and MOD tags
  const TAG_MAP={"0":"o","1":"i","!":"i","|":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","8":"b","€":"e","£":"l","¡":"i",
    "а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","і":"i","ј":"j","ѕ":"s","ԁ":"d","ɑ":"a","ο":"o","ν":"v","α":"a","ρ":"p","ι":"i","ε":"e","μ":"m","κ":"k","ʀ":"r","ɴ":"n","ᴍ":"m","ᴅ":"d","ᴀ":"a","ᴏ":"o","ᴡ":"w","ᴇ":"e","ɪ":"i"};
  function tagClean(x){ return String(x==null?"":x).normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u115f\u1160\u17b4\u17b5\u180b-\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0d\ufeff\uffa0\ufff9-\ufffb<>]/g,"").replace(/\s+/g," ").trim().slice(0,16); }
  function tagBlocked(x){                       // true when the text is, or could be read as, admin / mod / owner (spaced out, l33t, look-alike letters...)
    let t=String(x).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    t=[...t].map(c=>TAG_MAP[c]||c).join("");
    const flat=t.replace(/[^a-z]/g,""), sq=flat.replace(/(.)\1+/g,"$1");
    const bad=w=>/admin|owner|moderat|^mods?$/.test(w);
    if(bad(flat)||bad(sq)) return true;
    return t.split(/[^a-z0-9]+/).filter(Boolean).some(w=>/^mods?$/.test(w.replace(/(.)\1+/g,"$1")));
  }
  const tagOk=x=>{ x=tagClean(x); return x.length>=1&&!tagBlocked(x); };

  /* =============== shared registry: protected names, bans, last chat-clear =============== */
  const okCImg=x=>typeof x==="string"&&x.length<=4000000&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(x);   // custom emoji / sticker pictures
  const okTImg=x=>typeof x==="string"&&x.length<=4600000&&/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(x);   // room icons: small png/jpeg/webp pictures only
  function cleanTT(t){
    if(!t||typeof t!=="object") return null;
    const KR=/^[A-Za-z0-9_:.-]{1,48}$/, bad=k=>k==="home"||k==="__proto__"||k==="constructor"||k==="prototype";
    const o=[], p={};
    if(Array.isArray(t.o)) t.o.slice(0,80).forEach(k=>{ k=String(k); if(KR.test(k)&&!bad(k)&&!o.includes(k)) o.push(k); });
    if(t.p&&typeof t.p==="object") Object.keys(t.p).slice(0,80).forEach(k=>{ const v=String(t.p[k]); if(KR.test(k)&&KR.test(v)&&!bad(k)&&(v==="home"||!bad(v))&&k!==v) p[k]=v; });
    Object.keys(p).forEach(k=>{                      // no loops, and never deeper than 4 levels
      let d=1,c=p[k]; const seen=[k];
      while(c&&p[c]!==undefined&&d<8){ if(seen.includes(c)){ delete p[k]; return; } seen.push(c); c=p[c]; d++; }
      if(d>4) delete p[k];
    });
    return (o.length||Object.keys(p).length)?{o,p}:null;
  }
  function cleanReg(r){
    const o={acc:{},bans:[],mutes:[],mods:[],adms:[],hid:[],tg:{},mto:false,mao:false,tn:{},hm:null,tt:null,ce:{},cls:0,clr:0,clg:0,clp:0,muteAll:false,v:0}; if(!r||typeof r!=="object") return o;
    if(r.acc&&typeof r.acc==="object") Object.keys(r.acc).slice(0,500).forEach(k=>{ if(k&&k.length<=12&&k!=="__proto__"&&HEX.test(String(r.acc[k]))) o.acc[k]=r.acc[k]; });
    if(Array.isArray(r.bans)) o.bans=[...new Set(r.bans.map(x=>String(x).slice(0,12).toLowerCase()).filter(Boolean))].slice(0,500);
    if(Array.isArray(r.mutes)) o.mutes=[...new Set(r.mutes.map(x=>String(x).slice(0,12).toLowerCase()).filter(Boolean))].slice(0,500);
    if(Array.isArray(r.mods)) o.mods=[...new Set(r.mods.map(x=>String(x).slice(0,12).toLowerCase()).filter(Boolean))].slice(0,50);
    if(Array.isArray(r.adms)) o.adms=[...new Set(r.adms.map(x=>String(x).slice(0,12).toLowerCase()).filter(Boolean))].slice(0,50);
    if(Array.isArray(r.hid)) o.hid=[...new Set(r.hid.map(x=>String(x).slice(0,12).toLowerCase()).filter(Boolean))].slice(0,100);
    if(r.tg&&typeof r.tg==="object") Object.keys(r.tg).slice(0,400).forEach(k=>{ const x=r.tg[k]; if(!k||k.length>12||k==="__proto__"||!x||typeof x!=="object") return; const t=tagClean(x.t); if(tagOk(t)) o.tg[k.toLowerCase()]={t,c:TAG_COLORS.includes(x.c)?x.c:TAG_COLORS[0]}; });
    o.mto=!!r.mto; o.mao=!!r.mao;
    if(r.tn&&typeof r.tn==="object"){
      let tot=0;
      Object.keys(r.tn).filter(k=>k==="app"||/^[a-z][a-z0-9_]{0,15}$/.test(k)).slice(0,60).forEach(k=>{      // any tab key is fine: new hard-coded tabs show up in Tab names & icons by themselves
        const x=r.tn[k];
        if(x&&typeof x==="object"){
          const n=String(x.n||"").trim().slice(0,24), i=String(x.i||"").trim().slice(0,8);
          let im=okTImg(x.im)?x.im:""; if(im&&tot+im.length>20000000) im=""; tot+=im.length;
          if(n||i||im) o.tn[k]={n,i,im};
        }
      });
    }
    o.tt=cleanTT(r.tt);                              // Google Docs theme: which tabs sit inside other tabs (same for everyone)
    if(Array.isArray(r.hm)){                       // homepage tiles the owners made (null = the built-in default tiles)
      const seen=new Set(), HB=["games","chat","media","draw","shame","polls","gal","tier"]; o.hm=[];
      r.hm.slice(0,24).forEach(x=>{
        if(!x||typeof x!=="object") return;
        let k=String(x.k||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,12); if(!k||seen.has(k)) return; seen.add(k);
        const t=String(x.t||"").trim(); if(!/^(?:[a-z][a-z0-9_]{0,15}|ct:[A-Za-z0-9_-]{1,40})$/.test(t)||t==="app"||t==="dm"||t==="grp") return;
        const n=String(x.n||"").trim().slice(0,24), i=String(x.i||"").trim().slice(0,8), s2=String(x.s||"").trim().slice(0,24);
        const ic=HB.includes(x.ic)?x.ic:"", im=(okTImg(x.im)&&x.im.length<=40000)?x.im:"";
        o.hm.push({k,n:n||"Tab",i,ic,im,t,s:s2});
      });
    }
    if(r.ce&&typeof r.ce==="object"){
      let tot=0;
      Object.keys(r.ce).slice(0,150).forEach(k=>{
        const x=r.ce[k]; if(!/^[a-z0-9_]{2,20}$/.test(k)||!x||typeof x!=="object"||!okCImg(x.im)||tot+x.im.length>20000000) return;
        tot+=x.im.length; o.ce[k]={k:x.k==="s"?"s":"e",im:x.im,by:String(x.by||"").slice(0,12).toLowerCase()};
      });
    }
    o.cls=+r.cls||0; o.clr=+r.clr||0; o.clg=+r.clg||0; o.clp=+r.clp||0; o.muteAll=!!r.muteAll; o.v=+r.v||0; return o;
  }
  let reg=cleanReg((()=>{try{return JSON.parse(load("pb_reg","{}"));}catch(e){return {};}})());
  const saveReg=()=>save("pb_reg",JSON.stringify(reg));
  function setUserTag(from,d){                  // HOST: a person sets / clears their own tag; owners + mods can only REMOVE somebody else's
    if(!from||!from.ok2&&!from.local) return;
    const me=low(from.userName); if(!me) return;
    let target=me;
    if(d.f&&low(d.f)!==me){ if(!(from.admin||reg.mods.includes(me))||d.g) return; target=low(String(d.f).slice(0,12)); }
    const now=Date.now(); if(from.tgAt&&now-from.tgAt<1500) return; from.tgAt=now;
    const text=tagClean(d.g);
    if(!text){ if(reg.tg[target]){ delete reg.tg[target]; commit(); } return; }
    if(!tagOk(text)) return;
    const c=TAG_COLORS.includes(d.c)?d.c:TAG_COLORS[0], cur=reg.tg[me];
    if(cur&&cur.t===text&&cur.c===c) return;
    if(!cur&&Object.keys(reg.tg).length>=400) return;
    reg.tg[me]={t:text,c}; commit();
  }

  /* =============== word blacklist (owners manage it; the host enforces it; only owners ever receive the list) =============== */
  const blFold=s=>String(s==null?"":s).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const blTokens=s=>blFold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const blEntry=s=>{ const star=/\*\s*$/.test(String(s==null?"":s)); const t=blTokens(s).join(" ").slice(0,40); return t?(star?t+"*":t):""; };   // "word", "two words", or "pref*" (anything starting with pref)
  let blw=[]; try{ blw=JSON.parse(load("pb_blw","[]")).map(blEntry).filter(Boolean).slice(0,200); }catch(e){ blw=[]; }
  const saveBL=()=>save("pb_blw",JSON.stringify(blw));
  const BL_RACIST_BLACK=["nigger","niggers","nigga","niggas","niggaz","niggah","niggahs","nigguh","nigguhs","niggur","niggurs","nigg","niggs","nigra","nigras","nigr","nig","nigs","nignog","nignogs","nig nog","nig nogs",
    "jigaboo","jigaboos","jiggaboo","jiggaboos","jigg","coon","coons","darkie","darkies","darky","sambo","sambos","pickaninny","pickaninnies","piccaninny","porch monkey","porch monkeys",
    "jungle bunny","jungle bunnies","junglebunny","junglebunnies","tar baby","tarbaby","cotton picker","cotton pickers","spearchucker","spearchuckers","spear chucker","spear chuckers",
    "bluegum","bluegums","blue gum","blue gums","moolie","moolies","mulignan","mulignans","burrhead","burrheads","burr head","burr heads","bootlip","bootlips","boot lip","boot lips",
    "dindu","dindus","kaffir","kaffirs","kaffer","kaffers","gator bait","alligator bait"];
  try{ if(load("pb_blw_seed1","")!=="1"){                       // one-time: add the built-in list; owners can still remove words later
    blw=[...new Set([...blw,...BL_RACIST_BLACK.map(blEntry).filter(Boolean)])].slice(0,200); saveBL(); save("pb_blw_seed1","1"); } }catch(e){}
  const blLeet=t=>String(t).replace(/[@$!|]/g,c=>({"@":"a","$":"s","!":"i","|":"i"})[c]).replace(/[013457]/g,c=>({"0":"o","1":"i","3":"e","4":"a","5":"s","7":"t"})[c]);   // n1gger, n!gger → nigger
  const blJoin=toks=>{ const o=[]; let run=""; toks.forEach(t=>{ if(t.length===1) run+=t; else { if(run){ o.push(run); run=""; } o.push(t); } }); if(run) o.push(run); return o; };   // n i g g e r → nigger
  function blHit(text){
    if(!blw.length||typeof text!=="string") return false;
    const test=toks=>{ if(!toks.length) return false; const joined=" "+toks.join(" ");
      return blw.some(w=>w.endsWith("*")?joined.includes(" "+w.slice(0,-1)):(joined+" ").includes(" "+w+" ")); };
    const a=blTokens(text), b=blTokens(blLeet(text));
    return test(a)||test(blJoin(a))||test(b)||test(blJoin(b));
  }
  function blPush(){ conns.forEach(c=>{ if(c.ok2&&c.admin&&c.open){ try{ c.send({t:"BL",i:newId(),w:blw}); }catch(e){} } }); try{ renderBL(); }catch(e){} }
  const BL_MSG="🚫 Your message wasn't sent: it contains a word that isn't allowed here.";
  function blFilter(d,from){        // host side: drop blocked text from a client's message batch; true = nothing left to relay
    if(!blw.length) return false;
    const gone=[]; let hit=false, first="";
    d.e=d.e.filter(e=>{
      if(e&&e.aud&&typeof e.tx==="string"&&blHit(e.tx)) delete e.tx;
      if(!e||typeof e!=="object"||e.del||e.img||e.aud||e.fl||e.poll||typeof e.b!=="string") return true;
      const cur=logs.find(l=>l.i===e.i);
      if(cur&&cur.b===e.b) return true;                  // text unchanged (reactions etc.)
      if(!blHit(e.b)) return true;
      hit=true;
      if(cur){ try{ from.send({t:"Y",i:newId(),e:[Object.assign({},cur,{v:Math.max(Date.now(),(+cur.v||0)+1)})]}); }catch(x){} }   // blocked edit: put their old text back
      else { gone.push(e.i); if(!first) first=e.b; }
      return false;
    });
    if(hit){ try{ from.send({t:"E",i:newId(),msg:BL_MSG}); }catch(e){} }
    if(gone.length){ try{ from.send({t:"BLK",i:newId(),ids:gone.slice(0,50),x:first.slice(0,2000)}); }catch(e){} }
    return !d.e.length;
  }
  const areg=()=>({t:"A",i:newId(),acc:reg.acc,bans:reg.bans,mutes:reg.mutes,mods:reg.mods,adms:adminNames(),hid:reg.hid,tg:reg.tg,mto:reg.mto,mao:reg.mao,tn:reg.tn,hm:reg.hm,tt:reg.tt,ce:reg.ce,cls:reg.cls,clr:reg.clr,clg:reg.clg,clp:reg.clp,muteAll:reg.muteAll,v:reg.v});
  function adminNames(){ const a=conns.filter(c=>c.ok2&&c.admin&&c.userName).map(c=>low(c.userName)); if(adminMode&&usr) a.push(low(usr)); return [...new Set(a)]; }
  reg.muteAll=false;
  let myPwH="", adminMode=false, pendW=null;
  const low=n=>String(n||"").trim().slice(0,12).toLowerCase();
  const amMod=()=>!adminMode&&reg.mods.includes(low(usr));        // approved by an owner as a moderator
  window.__pbMuted=(n,conn)=>{ if(conn?conn.admin:adminMode) return false; return reg.muteAll||reg.mutes.includes(low(n)); };   // lets the drawing board respect owner mutes

  const clT=l=>l.ch==="gal"?reg.clg:l.ch==="shame"?reg.cls:l.ch==="polls"?reg.clp:reg.clr, clMin=()=>Math.min(reg.clr,reg.clg,reg.cls,reg.clp);
  function commit(){ reg.v=Math.max(Date.now(),reg.v+1); saveReg(); if(isHost) send(areg()); refreshUI(); }
  function applyClear(){
    // main chat and image gallery are cleared separately; private chats are never touched
    logs=logs.filter(l=>l.to||l.g||(l.ts||0)>(l.del?clMin():clT(l)));
    persist(); rerender();
  }
  const _cleanEntry=cleanEntry;
  cleanEntry=function(e){ const o=_cleanEntry(e); if(o&&!o.to&&!o.g&&(o.ts||0)<=(o.del?clMin():clT(o))) return null; return o; };
  window.addEventListener("load",()=>{ if(reg.clr||reg.clg||reg.cls||reg.clp) applyClear(); refreshUI(); });

  /* =============== sending my login (hash + owner key) with every "P" message =============== */
  const _addConn=addConn;
  addConn=function(c){
    const os=c.send.bind(c);
    c.send=function(d){ if(d&&d.t==="P"){ d.h=myPwH; if(adminMode) d.k=ADMIN_KEY; } return os(d); };
    _addConn(c);
  };

  /* =============== host-side rules =============== */
  function deny(conn,why){
    conn.denied=true;
    try{ conn.send({t:"X",i:newId(),why}); }catch(e){}
    setTimeout(()=>{ try{ conn.close(); }catch(e){} },400);
  }
  function nameBlocked(nm,conn,hh){          // true when a non-owner may not use this name
    if(conn.admin) return "";
    const l=low(nm); if(conn.allow===l) return "";
    if(reg.bans.includes(l)) return "banned";
    const v=own(reg.acc,l); if(v&&hVer(String(hh||""))!==v) return "password";
    if(!v){                                     // no password on this name yet: they must create one now
      if(!HEX.test(String(hh||""))) return "setpw";
      reg.acc[l]=hVer(String(hh)); commit();
    }
    return "";
  }
  function kickConn(conn,why){ deny(conn,why); }

  function procW(m,f){                          // change / remove / move a password
    const reply=(ok,msg)=>f.reply&&f.reply({t:"WA",i:newId(),ok,msg:msg||""});
    const l=low(m.n); if(!l) return reply(false,"Missing name.");
    if(!f.admin && l!==low(f.name)) return reply(false,"You can only change your own password.");
    if(m.mv){                                   // account follows a rename
      const from=low(m.mv), c0=own(reg.acc,from);
      if(!c0) return reply(true,"");
      if(!f.admin && hVer(String(m.a||""))!==c0) return reply(false,"Wrong password.");
      if(from!==l && own(reg.acc,l)) return reply(false,"That name already has a password.");
      delete reg.acc[from]; reg.acc[l]=c0; moveName(from,l); commit(); return reply(true,"");
    }
    const cur=own(reg.acc,l);
    if(cur && !f.admin && hVer(String(m.a||""))!==cur) return reply(false,"Wrong current password.");
    if(!f.admin && reg.bans.includes(l)) return reply(false,"That name is banned.");
    if(m.v===""){ return reply(false,"Every name needs a password — set a new one instead of removing it."); }
    else if(HEX.test(String(m.v||""))){ reg.acc[l]=m.v; }
    else return reply(false,"Invalid password.");
    commit(); reply(true,m.v===""?"Password removed.":"Password saved.");
  }

  function procM(m,f){                          // owner actions
    if(m.k!==ADMIN_KEY) return;
    const say=t=>f.reply&&f.reply({t:"E",i:newId(),msg:t});
    const conn=u=>conns.find(c=>c.uid===u&&c.ok2);
    if(m.a==="kick"){
      if(m.u===uid) return say("You can't kick the host's own browser — close it instead.");
      const c=conn(m.u); if(!c) return say("They're not connected."); kickConn(c,"kicked"); say("Kicked "+(c.userName||"user")+".");
    }
    else if(m.a==="ban"){
      const l=low(m.name); if(!l) return;
      if(!reg.bans.includes(l)) reg.bans.push(l);
      conns.filter(c=>c.ok2&&low(c.userName)===l).forEach(c=>kickConn(c,"banned"));
      commit(); say('Banned the name "'+l+'"'+(low(usr)===l?" (the host itself can't be removed).":"."));
    }
    else if(m.a==="mute"){
      const l=low(m.name); if(!l) return;
      if(low(usr)===l) return say("You can't mute the host's own browser.");
      if(!reg.mutes.includes(l)) reg.mutes.push(l);
      conns.filter(c=>c.ok2&&low(c.userName)===l).forEach(c=>{ try{ c.send({t:"E",i:newId(),msg:"You were muted by an owner."}); }catch(e){} });
      commit(); say('Muted "'+l+'".');
    }
    else if(m.a==="unmute"){ const l=low(m.name); reg.mutes=reg.mutes.filter(x=>x!==l); commit(); say('Unmuted "'+l+'".');
      conns.filter(c=>c.ok2&&low(c.userName)===l).forEach(c=>{ try{ c.send({t:"E",i:newId(),msg:"You were unmuted."}); }catch(e){} }); }
    else if(m.a==="unban"){ const l=low(m.name); reg.bans=reg.bans.filter(x=>x!==l); commit(); say('Unbanned "'+l+'".'); }
    else if(m.a==="clear"){
      if(m.ch==="tier"){ if(window.__pbTierClear) window.__pbTierClear(); say("All tier lists cleared for everyone."); return; }
      if(m.ch==="gal") reg.clg=Date.now(); else if(m.ch==="shame") reg.cls=Date.now(); else if(m.ch==="polls") reg.clp=Date.now(); else reg.clr=Date.now();
      applyClear(); commit(); say(m.ch==="gal"?"Image gallery cleared for everyone.":m.ch==="shame"?"Hall of Shame cleared for everyone.":m.ch==="polls"?"Polls cleared for everyone.":"Main chat cleared for everyone.");
    }
    else if(m.a==="muteall"||m.a==="unmuteall"){
      reg.muteAll=m.a==="muteall"; commit();
      const t=reg.muteAll?"An owner muted everyone.":"An owner unmuted everyone.";
      conns.forEach(c=>{ if(c.ok2&&!c.admin){ try{ c.send({t:"E",i:newId(),msg:t}); }catch(e){} } });
      if(!adminMode) sys(t);
      say(reg.muteAll?"Everyone except owners is muted.":"Everyone can chat again.");
    }
    else if(m.a==="rename"){
      const nn=String(m.n||"").trim().slice(0,12); if(!nn) return say("Name can't be empty.");
      if(reg.bans.includes(low(nn))) return say("That name is banned.");
      const old=m.u===uid?usr:(conn(m.u)||{}).userName; if(!old) return say("They're not connected.");
      const ol=low(old), nl=low(nn), c0=own(reg.acc,ol);
      if(c0&&ol!==nl){ if(own(reg.acc,nl)) return say("That name already belongs to someone with a password."); delete reg.acc[ol]; reg.acc[nl]=c0; moveName(ol,nl); commit(); }
      if(m.u===uid) applyRename(nn); else { const c=conn(m.u); c.allow=nl; c.send({t:"Z",i:newId(),n:nn}); }
      say(old+" is now "+nn+".");
    }
    else if(m.a==="addmod"){
      const l=low(m.name); if(!l) return say("Type a name first.");
      if(!reg.mods.includes(l)){ if(reg.mods.length>=50) return say("That's the maximum number of mods (50)."); reg.mods.push(l); }
      commit();
      conns.filter(c=>c.ok2&&low(c.userName)===l).forEach(c=>{ try{ c.send({t:"E",i:newId(),msg:"You're now a moderator. Open ⚙ settings → 🛡 Mod panel."}); }catch(e){} });
      if(!adminMode&&low(usr)===l) sys("You're now a moderator. Open ⚙ settings → 🛡 Mod panel.");
      say('"'+l+'" is now a mod'+(own(reg.acc,l)?".":" (nobody has registered that name yet — whoever registers it first becomes the mod)."));
    }
    else if(m.a==="delmod"){
      const l=low(m.name); reg.mods=reg.mods.filter(x=>x!==l); commit();
      conns.filter(c=>c.ok2&&low(c.userName)===l).forEach(c=>{ try{ c.send({t:"E",i:newId(),msg:"You're no longer a moderator."}); }catch(e){} });
      if(!adminMode&&low(usr)===l) sys("You're no longer a moderator.");
      say('"'+l+'" is no longer a mod.');
    }
    else if(m.a==="annmod"){
      reg.mao=!!m.off; commit();
      say(reg.mao?"⛔ Mod announcements are OFF. Mods can't announce.":"✅ Mod announcements are ON.");
    }
    else if(m.a==="announce"){
      const text=String(m.text||"").trim().slice(0,300), by=String(m.n||"Owner").slice(0,12), dur=annDur(m.dur), col=annCol(m.col);
      if(!text) return say("Type an announcement first.");
      conns.forEach(c=>{ if(c.ok2){ try{ c.send({t:"AN",i:newId(),n:by,msg:text,dur,col}); }catch(e){} } });
      showAnnounce(by,text,dur,col);
      say("📢 Announcement sent to everyone.");
    }
    else if(m.a==="scare"){
      const sim=jsImgOk(m.img);
      if(m.u==="all"){                         // everyone except owners (the host scares itself only if it isn't an owner)
        let n=0;
        conns.forEach(c=>{ if(c.ok2&&!c.admin){ try{ c.send({t:"JS",i:newId(),img:sim}); n++; }catch(e){} } });
        if(!adminMode){ jumpscare(sim); n++; }
        say("👻 Jumpscared "+n+(n===1?" person.":" people."));
      }
      else if(m.u===uid){ jumpscare(sim); say("👻 Jumpscare played on your screen."); }
      else {
        const c=conn(m.u); if(!c) return say("They're not connected.");
        try{ c.send({t:"JS",i:newId(),img:sim}); say("👻 Jumpscared "+(c.userName||"user")+"."); }catch(e){ say("Couldn't reach them."); }
      }
    }
    else if(m.a==="crash"){
      if(m.u===uid) return say("You can't crash the host's own browser — close the tab yourself instead.");
      const c=conn(m.u); if(!c) return say("They're not connected.");
      try{ c.send({t:"CR",i:newId()}); }catch(e){}
      setTimeout(()=>{ try{ kickConn(c,"crashed"); }catch(e){} },2500);
      say("💥 Crashed "+(c.userName||"user")+"'s screen.");
    }
    else if(m.a==="tabs"){
      reg.tn=cleanReg({tn:m.tn}).tn; commit();
      say(Object.keys(reg.tn).length?"🏷 Tab names and icons updated for everyone.":"🏷 Tab names and icons reset to default.");
    }
    else if(m.a==="home"){
      reg.hm=cleanReg({hm:m.hm}).hm; commit();
      say(reg.hm?"🏠 Homepage icons updated for everyone.":"🏠 Homepage icons reset to default.");
    }
    else if(m.a==="ce") ceOp(m,f,true,say,f.conn?f.conn.userName:usr);
    else if(m.a==="troll") runTroll(m,f,true,say,f.conn?f.conn.userName:usr);
    else if(m.a==="modtroll"){
      reg.mto=!!m.off; commit();
      say(reg.mto?"⛔ Mod trolls are OFF. Mods can't use trolls.":"✅ Mod trolls are ON (30-second cooldown for mods).");
    }
    else if(m.a==="bladd"){
      const w=blEntry(m.w); if(!w) return say("Type a word or phrase first.");
      if(blw.includes(w)) return say("That's already on the blacklist.");
      if(blw.length>=200) return say("The blacklist is full (200 entries).");
      blw.push(w); saveBL(); blPush(); say("🚫 Added to the blacklist.");
    }
    else if(m.a==="bldel"){
      const w=blEntry(m.w); blw=blw.filter(x=>x!==w); saveBL(); blPush(); say("Removed from the blacklist.");
    }
    else if(m.a==="setpw"){
      procW({n:m.name,v:m.v},{admin:true,reply:r=>say(r.ok?("Password "+(m.v===""?"removed":"set")+" for "+m.name+"."):r.msg)});
    }
  }

  const modSelf={};
  function procMod(m,f){                          // actions a moderator may do (announce); deleting goes through the normal delete path
    const say=t=>f.reply&&f.reply({t:"E",i:newId(),msg:t});
    const name=f.conn?f.conn.userName:usr;
    if(f.conn&&(!f.conn.ok2||f.conn.denied)) return;
    if(!reg.mods.includes(low(name))){ if(m.a==="ce"&&m.op==="del") return ceOp(m,f,false,say,name); return say("You're not a moderator."); }   // ex-mods can still remove stickers they made
    if(m.a==="announce"){
      if(reg.mao) return say("Owners have turned mod announcements off");
      const text=String(m.text||"").trim().slice(0,300), dur=annDur(m.dur), col=annCol(m.col); if(!text) return say("Type an announcement first.");
      const h=f.conn||modSelf, now=Date.now();
      if(now-(h.anAt||0)<5000) return say("Wait a few seconds between announcements.");
      h.anAt=now;
      const by=String(name).slice(0,12);
      conns.forEach(c=>{ if(c.ok2){ try{ c.send({t:"AN",i:newId(),n:by,msg:text,dur,col}); }catch(e){} } });
      showAnnounce(by,text,dur,col);
      say("📢 Announcement sent to everyone.");
    }
    else if(m.a==="ce") ceOp(m,f,false,say,name);
    else if(m.a==="troll") runTroll(m,f,false,say,name);
  }

  /* =============== 😈 trolls (admins: no cooldown · mods: 30s cooldown, enforced here on the host) =============== */
  const TROLLS={fall:"UI falls",flip:"Screen flip",shake:"Screen shake",rainbow:"Rainbow colors",spin:"Screen spin",blur:"Blurry vision"};
  const TR_CD=30000, trAt={}; let trCd=0, fxT=0;     // trAt: when each mod last trolled (host memory) · trCd: my own cooldown end (mods)
  const trLeft=n=>Math.max(0,Math.ceil(((trAt[low(n)]||0)+TR_CD-Date.now())/1000));
  function runFx(k,secs){
    const sd=Math.min(120,Math.max(1,Math.round(+secs)||8));
    if(!TROLLS[k]) return;
    const b=document.body; Object.keys(TROLLS).forEach(x=>b.classList.remove("tr-"+x));
    clearTimeout(fxT);
    sys("😈 You got trolled: "+TROLLS[k]);
    if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // message only
    b.style.setProperty("--trd",sd+"s"); void b.offsetWidth; b.classList.add("tr-"+k); document.documentElement.classList.add("tr-on");
    fxT=setTimeout(()=>{ Object.keys(TROLLS).forEach(x=>b.classList.remove("tr-"+x)); document.documentElement.classList.remove("tr-on"); b.style.removeProperty("--trd"); },sd*1000);
  }
  function runTroll(m,f,isAdm,say,name){
    const k=String(m.tk||""); if(!TROLLS[k]) return say("Unknown troll.");
    const l=low(name);
    const dur=isAdm?Math.min(120,Math.max(1,Math.round(+m.ds)||8)):8;      // only owners can pick how long it lasts; mods always get 8s
    if(!isAdm){
      if(reg.mto) return say("Owners have turned mod trolls off");
      const left=trLeft(name);
      if(left>0){ if(f.conn) try{ f.conn.send({t:"TC",i:newId(),s:left}); }catch(e){} else trCd=Date.now()+left*1000; return say("Cooldown: wait "+left+"s before the next troll."); }
    }
    const targets=[]; let hitSelf=false;
    const mayHit=(n,isAd)=>{ if(isAd) return false; return isAdm||!reg.mods.includes(low(n)); };   // "Everyone" skips owners (and other mods, for mods)
    if(m.u==="all"){
      conns.forEach(c=>{ if(c.ok2&&c.userName&&c!==f.conn&&!c.admin&&mayHit(c.userName,false)) targets.push(c); });
      if(f.conn&&!adminMode&&mayHit(usr,false)) hitSelf=true;       // the host's own screen, when a guest is trolling
    } else if(m.u===uid){
      if(!f.conn) return say("You can't troll yourself.");
      if(!isAdm&&(adminMode||reg.mods.includes(low(usr)))) return say("Mods can't troll owners or other mods.");
      hitSelf=true;
    } else {
      const c=conns.find(x=>x.uid===m.u&&x.ok2); if(!c) return say("They're not connected.");
      if(c===f.conn) return say("You can't troll yourself.");
      if(!isAdm&&(c.admin||reg.mods.includes(low(c.userName)))) return say("Mods can't troll owners or other mods.");
      targets.push(c);
    }
    if(!targets.length&&!hitSelf) return say("Nobody to troll.");
    targets.forEach(c=>{ try{ c.send({t:"TR",i:newId(),k,s:dur}); }catch(e){} });
    if(hitSelf) runFx(k,dur);
    if(!isAdm){
      trAt[l]=Date.now();
      if(f.conn) try{ f.conn.send({t:"TC",i:newId(),s:TR_CD/1000}); }catch(e){} else trCd=Date.now()+TR_CD;
    }
    const n=targets.length+(hitSelf?1:0);
    say("😈 "+TROLLS[k]+" → "+(m.u==="all"?n+(n===1?" person":" people"):((targets[0]||{}).userName||"you"))+".");
  }

  /* =============== 🔄 theme / wallpaper / look sync between your devices (kept by the host, per name) =============== */
  /* identity: every device that joins with the same name shares one id, so private DMs and group chats follow you */
  let uidMap={}; try{ uidMap=JSON.parse(load("pb_uidmap","{}"))||{}; }catch(e){ uidMap={}; }
  const saveUidMap=()=>{ const ks=Object.keys(uidMap); if(ks.length>300) ks.slice(0,ks.length-300).forEach(k=>delete uidMap[k]); save("pb_uidmap",JSON.stringify(uidMap)); };
  function moveUid(ol,nl){ if(ol&&nl&&ol!==nl&&uidMap[ol]){ uidMap[nl]=uidMap[ol]; delete uidMap[ol]; saveUidMap(); } }   // the renamed person keeps their id (tier lists, DMs, groups)
  function moveName(ol,nl){                    // a rename carries EVERYTHING keyed by the old name: mod role, hidden badge, emojis they made, synced look, id
    if(!ol||!nl||ol===nl) return;
    const mv=a=>{ if(!a.includes(ol)) return a; const r=a.filter(x=>x!==ol); if(!r.includes(nl)) r.push(nl); return r; };
    reg.mods=mv(reg.mods); reg.hid=mv(reg.hid);
    if(reg.tg&&reg.tg[ol]){ if(!reg.tg[nl]) reg.tg[nl]=reg.tg[ol]; delete reg.tg[ol]; }
    Object.keys(reg.ce||{}).forEach(k=>{ if(reg.ce[k]&&reg.ce[k].by===ol) reg.ce[k].by=nl; });
    if(prefsDB[ol]&&!prefsDB[nl]){ prefsDB[nl]=prefsDB[ol]; delete prefsDB[ol]; try{ persistPrefs(); }catch(e){} }
    moveUid(ol,nl);
  }
  window.__pbCanonUid=function(from,name){
    const l=low(name); if(!l||!from||!from.ok2||!from.uid) return;
    const c=uidMap[l];
    if(c&&okUid(c)){ if(c!==from.uid){ from.uid=c; try{ from.send({t:"UD",i:newId(),u:c}); }catch(e){} } }
    else{ uidMap[l]=from.uid; saveUidMap(); }
  };
  setInterval(()=>{                            // the host's own device follows the same rule
    if(!isHost||!peer||!usr||$("gate").style.display!=="none") return;
    const l=low(usr), c=uidMap[l];
    if(!c){ uidMap[l]=uid; saveUidMap(); }
    else if(c!==uid&&okUid(c)){ uid=c; save("chat_uid",uid); rerender(); }
  },2500);

  let prefsDB={}; try{ prefsDB=JSON.parse(load("pb_prefs","{}"))||{}; }catch(e){ prefsDB={}; }
  const okImg=(v,max)=>typeof v==="string"&&v.length<=max&&/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(v);
  function cleanPrefs(p,ts){
    if(!p||typeof p!=="object") return null;
    const S=(v,n)=>typeof v==="string"?v.slice(0,n):"", hex=v=>typeof v==="string"&&/^#[0-9a-f]{6}$/i.test(v);
    const wd=isFinite(+p.wd)?Math.max(0,Math.min(90,+p.wd)):30;
    return {th:S(p.th,12),wk:["none","color","image"].includes(p.wk)?p.wk:"none",wc:hex(p.wc)?p.wc:"#000000",wd:String(wd),
      wi:okImg(p.wi,900000)?p.wi:"",wic:hex(p.wic)?p.wic:"",hh:!!p.hh,hs:!!p.hs,ft:S(p.ft,30),bc:S(p.bc,20),
      bi:okImg(p.bi,3000000)?p.bi:"",av:okImg(p.av,4600000)?p.av:"",ts};
  }
  function persistPrefs(){
    const ks=Object.keys(prefsDB); if(ks.length>40) ks.sort((a,b)=>prefsDB[a].ts-prefsDB[b].ts).slice(0,ks.length-40).forEach(k=>delete prefsDB[k]);
    try{ localStorage.setItem("pb_prefs",JSON.stringify(prefsDB)); }
    catch(e){ Object.keys(prefsDB).forEach(k=>{ prefsDB[k].wi=""; }); try{ localStorage.setItem("pb_prefs",JSON.stringify(prefsDB)); }catch(e2){ Object.keys(prefsDB).forEach(k=>{ if((prefsDB[k].av||"").length>30000) prefsDB[k].av=""; if((prefsDB[k].bi||"").length>60000) prefsDB[k].bi=""; }); try{ localStorage.setItem("pb_prefs",JSON.stringify(prefsDB)); }catch(e3){} } }
  }
  function savePrefs(from,d){                  // host: remember the newest look for this name
    const l=low(from.userName); if(!l) return;
    const ts=Math.min(+d.ts||0,Date.now()+60000), cur=prefsDB[l]; if(cur&&cur.ts>=ts) return;
    const o=cleanPrefs(d.p,ts); if(!o) return; prefsDB[l]=o; persistPrefs();
  }
  let pts=+load("pb_pts","0")||0, lastJSON=null;
  const collectPrefs=()=>({th:load("chat_theme","gdocs"),wk:load("wall_kind","none"),wc:load("wall_color","#000000"),wd:load("wall_dim","30"),
    wi:load("wall_kind","none")==="image"&&/^data:/.test(load("wall_img",""))?load("wall_img",""):"",wic:load("wall_img_col",""),hh:load("hide_hdr","0")==="1",hs:load("hide_sb","1")==="1",
    ft:myFont||"",bc:myBc||"",bi:myBi||"",av:myAvatar||""});
  const sigStr=v=>v?(v.length+":"+v.slice(0,48)+v.slice(-48)):"";
  const prefsSig=()=>{                          // cheap "did my look change?" fingerprint (no multi-MB JSON every 2 s)
    const wk=load("wall_kind","none"), wi=wk==="image"?load("wall_img",""):"";
    return [load("chat_theme","gdocs"),wk,load("wall_color","#000000"),load("wall_dim","30"),/^data:/.test(wi)?sigStr(wi):"",load("wall_img_col",""),
      load("hide_hdr","0"),load("hide_sb","1"),myFont||"",myBc||"",sigStr(myBi),sigStr(myAvatar)].join("|");
  };
  function pushPrefs(){
    const m={t:"PS",i:newId(),ts:pts,p:collectPrefs()};
    try{ if(JSON.stringify(m).length>850000) m.p.wi=""; }catch(e){}      // never let the wallpaper make the whole message too big to send
    if(isHost) savePrefs({userName:usr},m); else send(m);
  }
  function applyPrefs(d){                      // a newer look came from another device
    const p=d&&d.p; if(!p||typeof p!=="object") return; const ts=+p.ts||0; if(ts<=pts) return;
    let wk=["none","color","image"].includes(p.wk)?p.wk:"none";
    try{
      if(wk==="image"&&p.wi) localStorage.setItem("wall_img",p.wi);
      else if(wk==="image"&&load("wall_img","")){ /* too big to sync (a big GIF): keep this device's own wallpaper */ }
      else { localStorage.removeItem("wall_img"); if(wk==="image") wk="none"; }
    }catch(e){ if(wk==="image") wk="none"; }
    save("wall_kind",wk); save("wall_color",p.wc||"#000000"); save("wall_dim",String(p.wd||30)); save("wall_img_col",p.wic||"");
    save("hide_hdr",p.hh?"1":"0"); save("hide_sb",p.hs?"1":"0");
    myFont=okFont(p.ft); save("chat_font",myFont); $("inp").style.fontFamily=FONT_MAP[myFont]||"";
    const oldAv=myAvatar; myAvatar=okAv(p.av); save("chat_pfp",myAvatar); if(myAvatar) avatars[usr]=myAvatar; else delete avatars[usr]; cacheAvatars();
    const bch=(p.bc||"")!==myBc||(p.bi||"")!==myBi; myBc=p.bc||""; myBi=okBi(p.bi)?p.bi:""; save("chat_bc",myBc); save("chat_bi",myBi);
    setTheme(p.th); applyBars(); rerender(); refreshAvatars(); if(bch) setMyStyle(); if(myAvatar!==oldAv) announce();
    pts=ts; save("pb_pts",String(ts)); lastJSON=prefsSig();
    sys("🔄 Your theme & wallpaper were synced from your other device.");
  }
  setInterval(()=>{                            // watch for changes on this device and share them
    if(document.hidden||$("gate").style.display!=="none"||window.__entering||!peer) return;
    if(window.__pbResync){ if(!isHost&&!conns.some(c=>c.open)) return; window.__pbResync=false; lastJSON=null; }   // new host: share my look again
    const cur=prefsSig();
    if(lastJSON===null){                       // first look after joining: upload what this device already had
      lastJSON=cur;
      if(!pts){ const c=collectPrefs(); if(c.wk!=="none"||c.th!=="imessage"||c.hh||c.hs||c.ft||c.bc||c.bi||c.av) pts=1; }
      if(pts) pushPrefs(); return;
    }
    if(cur!==lastJSON){ lastJSON=cur; pts=Date.now(); save("pb_pts",String(pts)); pushPrefs(); }
  },2000);

  /* custom emojis & stickers: mods + owners add them, everyone uses them */
  function ceOp(m,f,isAdm,say,name){
    const l=low(name), nm=String(m.nm||"").toLowerCase().trim();
    if(!/^[a-z0-9_]{2,20}$/.test(nm)) return say("Names are 2–20 letters, numbers or _.");
    if(m.op==="del"){
      const c=reg.ce[nm]; if(!c) return say("There's no :"+nm+": to remove.");
      if(!isAdm&&c.by!==l) return say("Only the person who made :"+nm+": (or an owner) can remove it.");
      delete reg.ce[nm]; commit(); return say("🗑 Removed :"+nm+":.");
    }
    if(EMOJI_MAP[nm]) return say("That name is already used by a normal emoji — pick another.");
    if(reg.ce[nm]) return say(":"+nm+": already exists.");
    if(Object.keys(reg.ce).length>=150) return say("The limit is 150 custom emojis + stickers.");
    if(Object.values(reg.ce).reduce((a,c)=>a+c.im.length,0)+String(m.im||"").length>2000000) return say("Out of space for pictures — remove a few big stickers first.");
    if(!isAdm){ const h=f.conn||modSelf, now=Date.now(); if(now-(h.ceAt||0)<3000) return say("Slow down a little."); h.ceAt=now; }
    const c=cleanReg({ce:{[nm]:{k:m.ty,im:m.im,by:l}}}).ce[nm];
    if(!c) return say("That picture is too big or isn't a valid image.");
    reg.ce[nm]=c; commit(); say("✅ Added "+(c.k==="s"?"sticker ":"emoji ")+":"+nm+":.");
  }

  function onWA(d){
    if(d.ok&&pendW!==null){ myPwH=pendW; save("chat_pwh",myPwH); }
    const had=pendW!==null; pendW=null;
    if(!had&&d.ok) return;                       // silent: account followed a rename
    refreshUI();
    const msg=d.ok?(d.msg||"Done."):(d.msg||"Couldn't change password.");
    $("pwst").textContent=msg; sys(msg);
  }

  function applyRename(n){
    const old=usr; usr=String(n).slice(0,12); save("chat_usr",usr); updateYou();
    if(myAvatar) avatars[usr]=myAvatar; $("hi").value=usr;
    rerender(); refreshAvatars();
    sys("An owner changed your name to "+usr+".");
    send({t:"N",u:old,b:usr,i:newId()});
    if(isHost) pushRoster(); else announce();
  }

  let leaving=false;
  function leaveRoom(msg){
    if(leaving) return; leaving=true;
    window.__entering=false; clearTimeout(window.__enterT); $("g-go").disabled=false;
    document.querySelectorAll("#box .msg.sys").forEach(e=>e.remove());
    try{ peer&&peer.destroy(); }catch(e){}
    peer=null; conns=[]; isHost=false;
    $("inp").disabled=true; $("fi").disabled=true; setStatus("Disconnected");
    setStg(false); $("admbtn").style.display="none";
    const g=$("gate"); g.classList.remove("leaving"); g.style.display="flex"; $("gerr").textContent=msg||"";
    // the join screen's own hide-timer may still be pending; make sure the gate stays visible
    setTimeout(()=>{ if(!peer){ g.classList.remove("leaving"); g.style.display="flex"; } },500);
  }

  /* =============== message routing (wraps the existing handler) =============== */
  const _postMsg=postMsg;
  postMsg=function(b,img,aud,extra){ if(!adminMode&&(reg.muteAll||reg.mutes.includes(low(usr)))){ sys("You're muted by an owner."); return; }
    if(isHost&&!adminMode&&!img&&!aud&&!(extra&&(extra.fl||extra.poll))&&blHit(b)){ sys(BL_MSG); return; }
    if(aud&&window.__pbTx&&isHost&&!adminMode&&blHit(window.__pbTx)) window.__pbTx="";
    return _postMsg.apply(this,arguments); };
  const _sendText=sendText;
  sendText=function(){
    if(!adminMode&&(reg.muteAll||reg.mutes.includes(low(usr)))){ sys("You're muted by an owner."); return; }
    if(isHost&&!adminMode&&blHit($("inp").value)){ sys(BL_MSG); return; }   // keep what they typed so they can edit it
    /* ---- anti-spam: 5 identical messages in a row => 10 second cooldown ---- */
    if(adminMode) return _sendText();
    const now=Date.now();
    if(now<spamUntil){
      if(now-spamWarned>1500){ spamWarned=now; sys("Slow down — you can send messages again in "+Math.ceil((spamUntil-now)/1000)+"s."); }
      return;   // keep what they typed
    }
    const el=$("inp"), raw=el.value.trim(), key=raw.toLowerCase().replace(/\s+/g," ");
    const r=_sendText();
    if(raw && el.value===""){   // it actually went out
      if(key===spamLast) spamCount++; else { spamLast=key; spamCount=1; }
      if(spamCount>=SPAM_MAX){
        spamUntil=Date.now()+SPAM_CD; spamWarned=Date.now(); spamCount=0; spamLast="";
        sys("Stop spamming — you're on a "+(SPAM_CD/1000)+" second cooldown.");
      }
    }
    return r;
  };
  const SPAM_MAX=5, SPAM_CD=10000;
  let spamLast="", spamCount=0, spamUntil=0, spamWarned=0;
  window.__leave=leaveRoom;
  window.addEventListener("offline",()=>{ if(peer) leaveRoom("You went offline. Rejoin when you're back."); });
  const _reveal=window.revealChat;
  window.revealChat=function(){
    if(isHost&&!adminMode){
      const l=low(usr), v=own(reg.acc,l);
      if(v){ if(hVer(myPwH)!==v){ leaveRoom("That name is protected — enter its password."); return; } }
      else if(!myPwH){ leaveRoom("Every name needs a password. Type one in the password box (at least 4 characters) to create it."); return; }
      else { reg.acc[l]=hVer(myPwH); commit(); }
    }
    _reveal();
  };
  const _handle=handle;
  handle=function(d,from){
    if(!d||typeof d!=="object"||!validId(d.i)) return;
    if(isHost){
      if(from.denied) return;
      if(d.t==="Y"&&Array.isArray(d.e)&&from.ok2&&!from.admin){      // only owners and mods may delete other people's public messages
        const isMod=reg.mods.includes(low(from.userName)); let blocked=false, shameBlocked=false, stkBlocked=false;
        d.e.forEach(e=>{ if(!e) return; const cur=logs.find(l=>l.i===e.i); if(cur&&cur.pn) e.pn=cur.pn; else delete e.pn; });   // pins: owners only
        d.e=d.e.filter(e=>{                      // Hall of Shame: mods post, owners delete
          if(!e) return true; const cur=logs.find(l=>l.i===e.i);
          if(!(e.ch==="shame"||(cur&&cur.ch==="shame"))) return true;
          let ok; if(e.del) ok=false; else if(!cur) ok=isMod; else if(typeof e.b==="string"&&e.b!==cur.b) ok=isMod&&cur.c===from.uid; else ok=true;
          if(!ok) shameBlocked=true; return ok;
        });
        if(shameBlocked){ try{ from.send({t:"E",i:newId(),msg:"Hall of Shame: only mods and owners can post there, and only owners can delete."}); }catch(e){} }
        d.e=d.e.filter(e=>{ if(!e||!e.del||e.to||e.g) return true; const cur=logs.find(l=>l.i===e.i); if(cur&&cur.stk&&cur.c&&cur.c!==from.uid){ stkBlocked=true; return false; } if(!cur||!cur.c||cur.c===from.uid||isMod) return true; blocked=true; return false; });
        if(blocked){ try{ from.send({t:"E",i:newId(),msg:"Only mods and owners can delete other people's messages."}); }catch(e){} }
        if(stkBlocked){ try{ from.send({t:"E",i:newId(),msg:"Stickers can only be deleted by the person who sent them (or an owner)."}); }catch(e){} }
      }
      if(d.t==="P"){
        const nm=String(d.u||"").slice(0,12), first=!from.ok2;
        const changed=first||(from.userName&&low(nm)!==low(from.userName));
        if(d.k===ADMIN_KEY) from.admin=true;
        if(changed){ const why=nameBlocked(nm,from,d.h); if(why) return deny(from,why); }
        if(first){ from.ok2=true; from.pwh=String(d.h||""); from.send(areg()); { const tl=trLeft(nm); if(tl>0) from.send({t:"TC",i:newId(),s:tl}); const pr=prefsDB[low(nm)]; if(pr) from.send({t:"PV",i:newId(),p:pr}); } if(from.admin){ from.send({t:"AR",i:newId(),list:[...archive.values()]}); from.send({t:"BL",i:newId(),w:blw}); } }
      }
      else if(!from.ok2) return;
      else if(!from.admin&&from.userName&&!own(reg.acc,low(from.userName))) return deny(from,"setpw");
      else if(d.t==="Y"&&!from.admin&&(reg.muteAll||reg.mutes.includes(low(from.userName)))){
        try{ from.send({t:"E",i:newId(),msg:"You're muted by an owner."}); }catch(e){} return;
      }
      else if(d.t==="Y"&&!from.admin&&Array.isArray(d.e)&&blFilter(d,from)){ return; }
      else if(d.t==="N"){
        if(!from.admin&&reg.mutes.includes(low(from.userName))){ const nl=low(String(d.b||"")); if(nl&&!reg.mutes.includes(nl)){ reg.mutes.push(nl); commit(); } }
        if(!from.admin){                        // renaming: the password moves to the new name
          const ol=low(from.userName), nl=low(String(d.b||"").slice(0,12)), c0=own(reg.acc,ol);
          if(c0&&ol!==nl&&!own(reg.acc,nl)&&!reg.bans.includes(nl)&&hVer(String(from.pwh||""))===c0){ delete reg.acc[ol]; reg.acc[nl]=c0; moveName(ol,nl); commit(); }
        }
        const why=nameBlocked(String(d.b||"").slice(0,12),from,from.pwh); if(why) return deny(from,why);
      }
      else if(d.t==="W"){ procW(d,{admin:from.admin||d.k===ADMIN_KEY,name:from.userName,reply:r=>{try{from.send(r);}catch(e){}}}); return; }
      else if(d.t==="M"){ procM(d,{conn:from,reply:r=>{try{from.send(r);}catch(e){}}}); return; }
      else if(d.t==="PS"){ savePrefs(from,d); return; }
      else if(d.t==="TT"){ const now=Date.now(); if(now-(from.ttAt||0)<400) return; from.ttAt=now; reg.tt=cleanTT(d.tt); commit(); return; }
      else if(d.t==="TG"){ setUserTag(from,d); return; }
      else if(d.t==="TH"){ const l=low(from.userName); if(l&&(from.admin||reg.mods.includes(l))) setHidden(l,!!d.h); return; }
      else if(d.t==="MD"){ procMod(d,{conn:from,reply:r=>{try{from.send(r);}catch(e){}}}); return; }
      else if(d.t==="SS"){ send(d,from); return; }
    }
    else {
      if(d.t==="A"){
        const n=cleanReg(d); if(d.ce===undefined&&reg.ce) n.ce=reg.ce; if(d.hm===undefined&&reg.hm) n.hm=reg.hm; if(d.tt===undefined&&reg.tt) n.tt=reg.tt;
        if(window.revealChat) window.revealChat();       // the host accepted us: now show the chat
        if(reg.v&&n.v&&n.v<reg.v){ console.warn("[reg] ignored an older registry from the host"); return; }   // a host with stale data must not demote mods / drop accounts
        const grew=n.clr>reg.clr||n.clg>reg.clg||n.cls>reg.cls||n.clp>reg.clp; reg=n; saveReg(); if(grew) applyClear(); refreshUI(); return;
      }
      if(d.t==="X"){
        const why=d.why; if(why==="password"){ myPwH=""; save("chat_pwh",""); save("pb_pwh",""); $("g-pw").placeholder="At least 4 characters"; }
        leaveRoom(why==="full"?"The room is full (11 people max).":why==="banned"?"That name is banned.":why==="kicked"?"You were removed by an owner.":why==="crashed"?"You were removed by an owner.":why==="setpw"?"Every name needs a password. Type one in the password box (at least 4 characters) to create it.":"That name is protected — enter its password."); return;
      }
      if(d.t==="Z"){ if(typeof d.n==="string") applyRename(d.n); return; }
      if(d.t==="E"){ note(String(d.msg||"").slice(0,200)); sys(String(d.msg||"").slice(0,200)); return; }
      if(d.t==="WA"){ onWA(d); return; }
      if(d.t==="JS"){ jumpscare(jsImgOk(d.img)); return; }
      if(d.t==="CR"){ crashScreen(); return; }
      if(d.t==="AN"){ showAnnounce(d.n,d.msg,annDur(d.dur),annCol(d.col)); return; }
      if(d.t==="PV"){ applyPrefs(d); return; }
      if(d.t==="UD"){ if(okUid(d.u)&&d.u!==uid){ uid=d.u; save("chat_uid",uid); rerender(); announce(); } return; }
      if(d.t==="TR"){ runFx(d.k,d.s); return; }
      if(d.t==="TC"){ trCd=Date.now()+Math.min(60,Math.max(0,+d.s||0))*1000; return; }
      if(d.t==="SS") return;
      if(d.t==="BL"){ if(adminMode&&Array.isArray(d.w)){ blw=d.w.map(blEntry).filter(Boolean).slice(0,200); try{ renderBL(); }catch(e){} } return; }
      if(d.t==="BLK"){
        const ids=new Set((Array.isArray(d.ids)?d.ids:[]).filter(validId));
        const n=logs.length; logs=logs.filter(l=>!(ids.has(l.i)&&l.c===uid));
        if(logs.length!==n){ persist(); rerender(); }
        const inp=$("inp"); if(inp&&!inp.value&&typeof d.x==="string") inp.value=d.x.slice(0,2000);
        return;
      }
      if(d.t==="AR"){
        if(adminMode&&Array.isArray(d.list)) d.list.slice(0,400).forEach(raw=>{
          const o=_cleanEntry(raw); if(!o||o.to||o.g||o.del||o.b==null) return;
          archive.set(o.i,o); const l=logs.find(x=>x.i===o.i); if(l&&l.del) ghost(o.i);
        });
        return;
      }
    }
    if(d.t==="AR"||d.t==="A"||d.t==="X"||d.t==="Z"||d.t==="E"||d.t==="WA"||d.t==="W"||d.t==="M"||d.t==="SS"||d.t==="JS"||d.t==="AN"||d.t==="MD"||d.t==="TH"||d.t==="TG"||d.t==="TR"||d.t==="TC"||d.t==="PS"||d.t==="TT"||d.t==="PV"||d.t==="UD") return;
    _handle(d,from);
  };

  /* =============== owner mode: deleted messages stay visible (public channels only) =============== */
  const archive=new Map();
  function keepCopy(l){
    if(!l||l.del||l.to||l.g||l.b==null||!(isHost||adminMode)) return;
    archive.set(l.i,JSON.parse(JSON.stringify(l)));
    let tot=0; archive.forEach(a=>{ tot+=String(a.b).length; });
    while(archive.size>1&&(archive.size>400||tot>6e6)){ const k=archive.keys().next().value; tot-=String(archive.get(k).b).length; archive.delete(k); }
  }
  const _mergeEntry=mergeEntry;
  mergeEntry=function(o){ if(o&&o.del&&!o.to&&!o.g){ const c=logs.find(l=>l.i===o.i); if(c&&!c.del) keepCopy(c); } return _mergeEntry(o); };
  const _deleteMsg=deleteMsg;
  deleteMsg=function(id){ const l=logs.find(x=>x.i===id); if(l&&l.ch==="shame"&&!adminMode){ sys("Only owners can delete things from the Hall of Shame."); return; } if(l&&!l.del) keepCopy(l); return _deleteMsg(id); };
  function ghost(id){
    if(!adminMode) return; const a=archive.get(id); if(!a) return;
    if((a.ts||0)<=clT(a)) return;
    let e=$(id);
    if(!e){ renderRow(Object.assign({},a),false); e=$(id); }
    if(!e||e.classList.contains("ghost")) return;
    e.classList.add("ghost"); e.querySelectorAll(".act").forEach(x=>x.remove());
    const col=e.querySelector(".col"), tag=document.createElement("div");
    tag.className="ghost-tag"; tag.textContent="🗑 deleted — only owners can see this";
    col.insertBefore(tag,col.querySelector(".bwrap")); queueRegroup();
  }
  const _applyToDom=applyToDom;
  applyToDom=function(l){ if(adminMode&&l&&l.del&&archive.has(l.i)){ ghost(l.i); return; } _applyToDom(l); };
  const _rerender=rerender;
  rerender=function(){ _rerender(); if(adminMode) archive.forEach((a,id)=>{ const l=logs.find(x=>x.i===id); if(l&&l.del) ghost(id); }); };

  /* =============== gate: password field, secret owner button =============== */
  const lab=document.createElement("label"); lab.className="fld";
  lab.innerHTML='<span>Password <i style="text-transform:none;font-weight:400;opacity:.7">(required — a new name uses it to create its password)</i></span><input id="g-pw" type="password" autocomplete="current-password" placeholder="At least 4 characters">';
  $("gerr").before(lab);
  $("g-pw").addEventListener("keydown",e=>{ if(e.key==="Enter") $("g-go").click(); });

  /* owner access: press Ctrl + I, type the password, and owner mode stays on for good on this device */
  const ownBox=document.createElement("div"); ownBox.id="ownmod"; ownBox.setAttribute("role","dialog"); ownBox.setAttribute("aria-label","Owner access");
  ownBox.innerHTML='<div class="own-card"><b>Owner access</b><input id="ownpw" type="password" inputmode="numeric" placeholder="Password" autocomplete="off"><button type="button" id="ownok">Unlock</button><button type="button" id="ownoff" class="alt">Turn off on this device</button><div class="own-msg" id="ownmsg"></div></div>';
  document.body.appendChild(ownBox);
  const ownCss=document.createElement("style");
  ownCss.textContent="#ownmod{display:none;position:fixed;inset:0;z-index:2147483300;background:rgba(0,0,0,.55);align-items:center;justify-content:center}#ownmod.open{display:flex}"
   +"#ownmod .own-card{width:min(300px,86vw);background:var(--side,#222);color:var(--text,#fff);border:1px solid var(--line,#444);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 12px 40px rgba(0,0,0,.5)}"
   +"#ownmod b{font-size:16px}#ownmod input{padding:10px 12px;border-radius:10px;border:1px solid var(--line,#444);background:var(--input,#111);color:var(--text,#fff);font-size:16px;outline:none;width:100%;box-sizing:border-box}"
   +"#ownmod button{padding:10px;border:none;border-radius:10px;background:var(--accent,#0a84ff);color:var(--on-accent,#fff);font-weight:700;cursor:pointer}#ownmod button.alt{background:var(--row,#333);color:var(--text,#fff)}#ownmod .own-msg{font-size:12px;color:var(--muted,#aaa);min-height:15px}";
  document.head.appendChild(ownCss);
  const inRoomNow=()=>!!peer&&$("gate").style.display==="none";
  let ownBad=0, ownLock=0;
  const ownMsg=t=>{ $("ownmsg").textContent=t; };
  function ownShow(){
    ownBox.classList.add("open"); $("ownpw").value="";
    $("ownpw").style.display=$("ownok").style.display=adminMode?"none":""; $("ownoff").style.display=adminMode?"":"none";
    ownMsg(adminMode?"Owner mode is on (saved on this device).":""); if(!adminMode) $("ownpw").focus();
  }
  const ownHide=()=>ownBox.classList.remove("open");
  function tryAdmin(){
    if(Date.now()<ownLock){ ownMsg("Too many tries. Wait a few seconds."); return; }
    if(sha256("pbadmin:"+$("ownpw").value)===ADMIN_KEY){
      adminMode=true; save("pb_admin",ADMIN_KEY); ownBad=0; ownShow(); ownMsg("Owner mode unlocked ✓ Saved on this device for good.");
      if(inRoomNow()) setTimeout(()=>location.reload(),1200);                 // reconnect so the room sees you as the owner
      else { $("gerr").style.color="#ffd60a"; $("gerr").textContent="👑 Owner mode on — join as usual."; setTimeout(()=>{$("gerr").style.color="";},4000); }
    } else { if(++ownBad>=5){ ownBad=0; ownLock=Date.now()+30000; } ownMsg("Wrong password."); $("ownpw").select(); }
  }
  $("ownok").onclick=tryAdmin;
  $("ownoff").onclick=()=>{ adminMode=false; save("pb_admin",""); ownMsg("Owner mode turned off on this device."); $("ownoff").style.display="none"; if(inRoomNow()) setTimeout(()=>location.reload(),900); };
  $("ownpw").addEventListener("keydown",e=>{ if(e.key==="Enter") tryAdmin(); });
  ownBox.addEventListener("mousedown",e=>{ if(e.target===ownBox) ownHide(); });
  document.addEventListener("keydown",e=>{
    if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey&&(e.key==="i"||e.key==="I")){ e.preventDefault(); e.stopPropagation(); ownBox.classList.contains("open")?ownHide():ownShow(); }
    else if(e.key==="Escape"&&ownBox.classList.contains("open")){ e.stopPropagation(); ownHide(); }
  },true);
  /* phones have no Ctrl+I: tap the title / logo 5 times quickly to open the same owner box */
  (function(){
    let taps=0, last=0;
    document.addEventListener("click",e=>{
      const t=e.target&&e.target.closest&&e.target.closest("#gate h1, #home .hm-top, #home .hm-mascot, #topbanner");
      if(!t){ return; }
      const now=Date.now(); taps=(now-last<900)?taps+1:1; last=now;
      if(taps>=5){ taps=0; ownShow(); }
    });
  })();
  if(load("pb_admin","")===ADMIN_KEY) adminMode=true;          // stays owner on this device

  // the host never gets an "A" message, so it remembers its own login hash here; clients do it when the host accepts them
  const origGo=$("g-go").onclick;
  // remember the room code + password on this device once you are in, so you only type them once
  if(load("pb_code","")===ROOM_CODE) $("g-code").value=ROOM_CODE;
  if(load("pb_pwh","")) $("g-pw").placeholder="Saved on this device — leave blank";
  setInterval(()=>{
    if($("gate").style.display!=="none"||window.__entering) return;      // only once the host has let us in
    if(load("pb_code","")!==ROOM_CODE) save("pb_code",ROOM_CODE);
    const h=myPwH||""; if(load("pb_pwh","")!==h) save("pb_pwh",h);       // also follows password changes / removal in Settings
  },1500);
  // Logging in as a DIFFERENT name: forget the previous account's look, id, password and sync clock,
  // so nothing of theirs is uploaded to (or shown on) the new account.
  function resetLocalAccount(){
    ["chat_pfp","chat_bc","chat_bi","chat_bv","chat_font","chat_theme","chat_tc","wall_kind","wall_color","wall_dim","wall_img","wall_img_col",
     "hide_hdr","hide_sb","pb_pts","pb_pwh","chat_pwh"].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
    try{ wallBigClear(); }catch(e){}
    uid="u"+Date.now().toString(36)+Math.random().toString(36).slice(2,10); save("chat_uid",uid);
    myFont=""; myAvatar=""; myBc=""; myBi=""; myPwH=""; pts=0; lastJSON=null; window.__pbResync=false;
    bstyle[uid]={bc:"",bi:"",v:0};
    try{ $("font").value=""; $("inp").style.fontFamily=""; $("bcol").value="#0a84ff"; }catch(e){}
    try{ setTheme("gdocs"); applyWall(); applyBars(); refreshAvatars(); }catch(e){}
  }
  $("g-go").onclick=()=>{
    if($("g-code").value.trim().toLowerCase()!==ROOM_CODE){ origGo(); return; }
    const nextN=low($("g-name").value);
    if(nextN && usr!=="User" && nextN!==low(usr)) resetLocalAccount();
    const typed=$("g-pw").value;
    // The host is the only one who knows the current passwords/bans, so it decides.
    // (Checking against this browser's cached copy rejected correct passwords after a reset.)
    if(typed&&typed.length<4&&!adminMode){ $("gerr").textContent="Password must be at least 4 characters."; return; }
    myPwH=typed?hCred(typed):(load("pb_pwh","")||"");   // what you type, otherwise the password remembered on this device
    save("chat_pwh","");
    $("g-pw").value=""; leaving=false;
    origGo();
    $("admbtn").style.display=adminMode?"":"none";
  };

  /* =============== settings: password card =============== */
  const card=document.createElement("div"); card.className="stg-card";
  card.innerHTML='<h3>🔑 Password</h3><div class="stg-note" id="pwst"></div><label>New password (at least 4 characters)</label><input type="password" id="pwnew" autocomplete="new-password"><div class="stg-row"><button id="pwset" type="button" class="btn">Set password</button><button id="pwrm" type="button" class="btn alt">Remove password</button></div><div class="stg-note">Protects your name so nobody else can use it. If you forget it, an owner can reset it.</div>';
  document.querySelector(".stg-scroll").appendChild(card);
  $("pwrm").style.display="none";
  const DURS=[[5,"5 seconds"],[10,"10 seconds"],[30,"30 seconds"],[60,"1 minute"],[300,"5 minutes"],[900,"15 minutes"],[3600,"1 hour"],[0,"Until dismissed"]];
  function annUI(){
    [["amant","amdur","amanb"],["mmant","mmdur","mmanb"]].forEach(([ta,id,btn])=>{
      const t=$(ta), b=$(btn); if(!t||!b) return;
      if(!$(id)){ const sel=document.createElement("select"); sel.id=id; sel.title="How long the announcement stays on screen"; sel.style.cssText="padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:var(--input);color:var(--text);font-size:13px";
        DURS.forEach(([v,l])=>{ const o=document.createElement("option"); o.value=v; o.textContent="⏱ "+l; sel.appendChild(o); }); b.before(sel);
        const ci=document.createElement("input"); ci.type="color"; ci.id=id.replace("dur","col"); ci.value="#ffd60a"; ci.title="Announcement color"; ci.style.cssText="width:38px;height:32px;padding:0;border:none;background:none;cursor:pointer"; b.before(ci); }
    });
    const ab=$("amanb");
    if(ab&&!$("amao")){ const sw=document.createElement("button"); sw.id="amao"; sw.type="button"; sw.className="abtn"; sw.style.marginTop="6px"; sw.onclick=()=>adminDo({a:"annmod",off:!reg.mao}); ab.parentNode.appendChild(sw); }
    if($("amao")) $("amao").textContent=reg.mao?"✅ Let mods announce again":"⛔ Stop mods from announcing";
    const mb=$("mmanb"), mt=$("mmant");
    if(mb&&mt){ mb.disabled=!!reg.mao; mt.disabled=!!reg.mao; if($("mmdur")) $("mmdur").disabled=!!reg.mao; if($("mmcol")) $("mmcol").disabled=!!reg.mao;
      mt.placeholder=reg.mao?"Owners have turned mod announcements off":"Message to show everyone…"; }
  }
  function refreshUI(){
    try{ annUI(); }catch(e){}
    const st=$("pwst"); if(st&&!pendW) st.textContent=own(reg.acc,low(usr))?"🔒 Your name “"+usr+"” is password-protected.":"No password yet — anyone could use the name “"+usr+"”.";
    renderAdminLists();
    if(window.__pbTabs) window.__pbTabs();
    if(window.__pbHomeRefresh) try{ window.__pbHomeRefresh(); }catch(e){}
  }
  new MutationObserver(refreshUI).observe($("stg"),{attributes:true,attributeFilter:["class"]});
  function sendW(m){
    m.t="W"; m.i=newId(); m.n=usr; m.a=myPwH;
    if(isHost) procW(m,{admin:adminMode,name:usr,reply:onWA}); else send(m);
  }
  $("pwset").onclick=()=>{
    const p=$("pwnew").value;
    if(p.length<4){ $("pwst").textContent="Use at least 4 characters."; return; }
    const h=hCred(p); pendW=h; $("pwnew").value=""; $("pwst").textContent="Saving…";
    sendW({v:hVer(h)});
  };
  $("pwrm").onclick=()=>{ pendW=""; $("pwst").textContent="Removing…"; sendW({v:""}); };

  // renaming: keep the password with the new name, and don't take a protected / banned name
  const origSave=$("save").onclick;
  $("save").onclick=()=>{
    const d=(typeof draft!=="undefined")?draft:null;
    const nn=d?String(d.name||"").trim().slice(0,12):"";
    const old=usr;
    if(nn&&low(nn)!==low(old)&&!adminMode){
      const l=low(nn);
      if(reg.bans.includes(l)){ $("stgerr").textContent="That name is banned."; return; }
      const v=own(reg.acc,l); if(v&&hVer(myPwH)!==v){ $("stgerr").textContent="That name belongs to someone with a password."; return; }
    }
    origSave();
    if(usr!==old&&own(reg.acc,low(old))){
      const m={t:"W",i:newId(),n:usr,mv:old,a:myPwH};
      if(isHost) procW(m,{admin:adminMode,name:usr}); else send(m);
    }
  };

  /* =============== 📢 public announcements =============== */
  let anTimer=null;
  function annDur(v){ v=+v; return v===0?0:(isFinite(v)&&v>=1?Math.min(3600,Math.round(v)):5); }   // seconds; 0 = stays until dismissed
  function annCol(c){ return /^#[0-9a-f]{6}$/i.test(c||"")?c:""; }
  function showAnnounce(by,msg,dur,col){
    msg=String(msg||"").slice(0,300); if(!msg) return;
    by=String(by||"Owner").slice(0,12);
    let b=document.getElementById("anb");
    if(!b){
      b=document.createElement("div"); b.id="anb"; b.setAttribute("role","alert");
      b.innerHTML='<div class="anic">📢</div><div class="anbd"><div class="anh"></div><div class="anm"></div></div><button type="button" title="Dismiss">✕</button>';
      b.querySelector("button").onclick=()=>{ b.classList.remove("on"); clearTimeout(anTimer); };
      document.body.appendChild(b);
    }
    col=annCol(col);
    if(col){ const n=parseInt(col.slice(1),16), L=(0.2126*(n>>16&255)+0.7152*(n>>8&255)+0.0722*(n&255))/255;
      b.style.background="linear-gradient(135deg,"+col+",color-mix(in srgb,"+col+" 70%,#000))"; b.style.color=L>0.6?"#000":"#fff"; }
    else { b.style.background=""; b.style.color=""; }
    b.querySelector(".anh").textContent="Announcement from "+by;
    b.querySelector(".anm").textContent=msg;
    b.classList.add("on"); clearTimeout(anTimer); dur=(dur===undefined)?5:annDur(dur); if(dur>0) anTimer=setTimeout(()=>b.classList.remove("on"),dur*1000);
    try{ sys("📢 Announcement from "+by+": "+msg); }catch(e){}
  }

  /* =============== 👻 jumpscare (5 seconds: image + sound) =============== */
  const JS_IMG="assets/jumpscare/jumpscare.webp";
  const JS_SND="assets/jumpscare/jumpscare.mp3";
  const JS_MS=5000;
  let jsAudio=null, jsTimer=null, jsUnlocked=false;
  function jsPrep(){ if(jsAudio) return jsAudio; jsAudio=new Audio(JS_SND); jsAudio.preload="auto"; jsAudio.volume=1; return jsAudio; }
  function jsUnlock(){                        // browsers only allow sound after a tap/click: do a silent play on the first one
    if(jsUnlocked) return; jsUnlocked=true;
    try{ const a=jsPrep(); a.muted=true; const p=a.play(); const done=()=>{ try{ a.pause(); a.currentTime=0; a.muted=false; }catch(e){} };
      if(p&&p.then) p.then(done).catch(()=>{ a.muted=false; jsUnlocked=false; }); else done(); }catch(e){ jsUnlocked=false; }
  }
  ["pointerdown","keydown","touchstart"].forEach(ev=>window.addEventListener(ev,jsUnlock,{passive:true}));
  function crashScreen(){
    if($("pbcrash")) return;
    const d=document.createElement("div"); d.id="pbcrash";
    d.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#0078d7;color:#fff;font-family:'Segoe UI',system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 20px";
    d.innerHTML='<div style="font-size:90px;line-height:1;margin-bottom:18px">:(</div><div style="font-size:22px;max-width:520px;line-height:1.5">Your PC ran into a problem and needs to restart.</div><div style="font-size:15px;opacity:.85;margin-top:14px">We\'re just collecting some error info, and then we\'ll restart for you.</div>';
    document.body.appendChild(d);
  }
  function jumpscare(img){
    if(jsTimer||window.__pbNoScare) return;                       // already scaring
    let ov=document.getElementById("jsov");
    if(!ov){
      ov=document.createElement("div"); ov.id="jsov";
      const im=document.createElement("img"); im.src=JS_IMG; im.alt=""; im.draggable=false; ov.appendChild(im);
      ["pointerdown","click","contextmenu","touchstart","keydown"].forEach(ev=>ov.addEventListener(ev,e=>{ e.preventDefault(); e.stopPropagation(); }));
      document.body.appendChild(ov);
    }
    try{ const im2=ov.querySelector("img"); if(im2) im2.src=jsImgOk(img)||JS_IMG; }catch(e){}
    ov.classList.add("on");
    try{ const a=jsPrep(); a.muted=false; a.loop=true; a.currentTime=0; const p=a.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
    try{ if(navigator.vibrate) navigator.vibrate([200,60,200,60,400]); }catch(e){}
    jsTimer=setTimeout(()=>{
      jsTimer=null; ov.classList.remove("on");
      try{ jsAudio.pause(); jsAudio.currentTime=0; jsAudio.loop=false; }catch(e){}
    },JS_MS);
  }
  const JS_IK="pb_jsimg";
  function jsImgOk(v){ return (typeof v==="string" && v.length<900000 && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(v)) ? v : ""; }
  let jsCustomImg=jsImgOk(load(JS_IK,""));
  function jsCustom(){ return jsCustomImg; }
  window.__pbJsCustom=jsCustom;
  window.__pbJumpscare=jumpscare;

  /* =============== owner panel =============== */
  const ab=document.createElement("button"); ab.id="admbtn"; ab.className="stg-btn"; ab.type="button"; ab.textContent="🛡 Owner panel"; ab.style.display="none";
  document.querySelector(".stg-sb").insertBefore(ab,$("stg-toggle"));
  const am=document.createElement("div"); am.id="amod";
  am.innerHTML='<div class="acard"><div class="ah"><b>🛡 Owner panel</b><button type="button" id="amx" title="Close">✕</button></div><div id="amsg"></div><div id="amb"><div><h4>Public announcement</h4><div class="aform"><textarea id="amant" rows="2" maxlength="300" placeholder="Message to show everyone…"></textarea><button class="abtn" type="button" id="amanb">📢 Announce</button></div></div><div><h4>Quick actions</h4><button class="abtn scare" type="button" id="amscall">👻 Jumpscare everyone</button> <button class="abtn" type="button" id="amscpv">Preview</button> <button class="abtn" type="button" id="amscimg">🖼 Custom image…</button> <button class="abtn" type="button" id="amscrst">Reset</button> <input type="file" id="amscfile" accept="image/*" hidden> <img id="amscthumb" alt="" style="display:none;height:34px;border-radius:6px;vertical-align:middle;margin-left:6px"><div id="amscinfo" style="font-size:12px;opacity:.7;margin-top:4px"></div> <button class="abtn red" type="button" id="ammall">🔇 Mute everyone (except owners)</button></div><div><h4>Chat log → Google Doc</h4><div class="aform"><input id="amlgu" type="text" placeholder="Paste your Apps Script web app URL (ends in /exec)" autocomplete="off"><button class="abtn" type="button" id="amlgsv">Save</button></div><div class="aform" style="margin-top:6px"><button class="abtn" type="button" id="amlgt">Send test line</button><button class="abtn" type="button" id="amlgo">⏸ Pause logging</button></div><div class="none" id="amlgst"></div></div><div><h4>Moderators</h4><div class="aform"><input id="ammodn" type="text" maxlength="12" placeholder="Name to make a mod" autocomplete="off"><button class="abtn" type="button" id="ammodb">➕ Add mod</button></div><div class="none">Mods can delete other people’s messages and make announcements. Names are protected by their owner’s password (🔒), so only that person can be the mod.</div><div id="ammods" style="margin-top:6px"></div></div><div><h4>🏷 Tab names &amp; icons</h4><div id=\"amtn\"></div></div><div><h4>⭐ Custom emojis &amp; stickers</h4><div id=\"amce\"></div></div><div><h4>😈 Trolls</h4><div id=\"amtr\"></div></div><div><h4>Online now</h4><div id="amon"></div></div><div><h4>Muted names</h4><div id="ammu"></div></div><div><h4>Banned names</h4><div id="ambn"></div><div class="aform" style="margin-top:6px"><input id="amban" type="text" maxlength="12" placeholder="Name to ban"><button class="abtn red" type="button" id="ambanb">Ban name</button></div></div><div><h4>Set or reset a password for any name</h4><div class="aform"><input id="ampn" type="text" maxlength="12" placeholder="Name"><input id="ampp" type="text" placeholder="New password (min 4 characters)" autocomplete="off"><button class="abtn" type="button" id="ampb">Apply</button></div></div><div><h4>Clear a channel for everyone</h4><div class="aform"><select id="amch"><option value="main">💬 Main chat</option><option value="gal">🖼️ Image gallery</option><option value="shame">🚨 Hall of Shame</option><option value="draw">🎨 Drawing board</option><option value="polls">📊 Polls</option><option value="tier">🏆 Tier lists</option></select><button class="abtn red" type="button" id="amclr">🗑 Clear this channel</button></div><div class="none">Only the selected channel is cleared. Private chats are never touched.</div></div></div></div>';
  document.body.appendChild(am);
  function note(t){ const e=$("amsg"); if(e) e.textContent=t; const m=$("mmsg"); if(m) m.textContent=t; }
  function adminDo(m){
    m.k=ADMIN_KEY;
    if(isHost) procM(m,{reply:r=>{ note(r.msg); }});
    else { m.t="M"; m.i=newId(); send(m); }
  }
  function mk(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function renderAdminLists(){
    if(!$("amod")||!$("amod").classList.contains("open")) return;
    renderMods(); try{ renderBL(); }catch(e){}
    $("ammall").textContent=reg.muteAll?"🔊 Unmute everyone":"🔇 Mute everyone (except owners)";
    const on=$("amon"); on.replaceChildren();
    (lastRoster||[]).forEach(e=>{
      const r=mk("div","arow"), av=mk("div","pav"); paintAv(av,e.n);
      r.append(av,mk("span","an",e.n+(e.c===uid?" (you)":"")+(own(reg.acc,low(e.n))?" 🔒":"")+(reg.mutes.includes(low(e.n))?" 🔇":"")));
      if(e.c&&e.c!==uid){
        const b1=mk("button","","Rename"); b1.onclick=()=>{ const n=prompt("New name for "+e.n+" (max 12 characters):",e.n); if(n&&n.trim()) adminDo({a:"rename",u:e.c,n:n.trim().slice(0,12)}); };
        const b2=mk("button","","Password"); b2.onclick=()=>{ const p=prompt("New password for "+e.n+" (at least 4 characters).\nLeave empty to remove their password:"); if(p===null) return; if(!p||p.length<4){ note("Use at least 4 characters."); return; } adminDo({a:"setpw",name:e.n,v:hVer(hCred(p))}); };
        const bm=mk("button","",reg.mutes.includes(low(e.n))?"Unmute":"Mute"); bm.onclick=()=>adminDo({a:reg.mutes.includes(low(e.n))?"unmute":"mute",name:e.n});
        const b3=mk("button","red","Kick"); b3.onclick=()=>adminDo({a:"kick",u:e.c});
        const b4=mk("button","red","Ban"); b4.onclick=()=>{ if(confirm('Ban the name "'+e.n+'" and remove them?')) adminDo({a:"ban",name:e.n}); };
        const bs=mk("button","scare","👻 Scare"); bs.title="Jumpscare "+e.n+" (5 seconds)"; bs.onclick=()=>adminDo({a:"scare",u:e.c,img:jsCustom()});
        const bx=mk("button","red","💥 Crash"); bx.title="Show "+e.n+" a fake crash screen and close the site for them"; bx.onclick=()=>{ if(confirm("Crash "+e.n+"'s screen and close the site for them? They can rejoin afterwards.")) adminDo({a:"crash",u:e.c}); };
        r.append(bs,b1,b2,bm,b3,b4,bx);
      }
      on.appendChild(r);
    });
    const mu=$("ammu"); mu.replaceChildren();
    if(!reg.mutes.length) mu.appendChild(mk("div","none","Nobody is muted."));
    reg.mutes.forEach(n=>{ const r=mk("div","arow"); r.append(mk("span","an",n)); const b=mk("button","","Unmute"); b.onclick=()=>adminDo({a:"unmute",name:n}); r.appendChild(b); mu.appendChild(r); });
    const bn=$("ambn"); bn.replaceChildren();
    if(!reg.bans.length) bn.appendChild(mk("div","none","No banned names."));
    reg.bans.forEach(n=>{ const r=mk("div","arow"); r.append(mk("span","an",n)); const b=mk("button","","Unban"); b.onclick=()=>adminDo({a:"unban",name:n}); r.appendChild(b); bn.appendChild(r); });
  }
  /* ---- 🚫 word blacklist: tucked away in a collapsed submenu ---- */
  { const st=document.createElement("style"); st.textContent="#ambl>summary{cursor:pointer;font-weight:700;font-size:14px;padding:4px 0;user-select:none}#ambl[open]>summary{margin-bottom:6px}#ambl .bl-note{font-size:12px;opacity:.7;margin-top:6px}"; document.head.appendChild(st);
    const sec=document.createElement("div");
    sec.innerHTML='<details id="ambl"><summary>🚫 Word blacklist</summary><div class="aform"><input id="amblw" type="text" maxlength="40" placeholder="Word or phrase to block" autocomplete="off"><button class="abtn red" type="button" id="amblb">Add</button></div><div class="bl-note">Messages containing a listed word are blocked for everyone except owners, and the sender is told it wasn\u2019t sent (never which word). Matches whole words, case and accents ignored. Add <b>*</b> at the end to match anything starting with it (e.g. <b>spam*</b>). Only owners can see this list.</div><div id="amblist" style="margin-top:8px"></div></details>';
    $("amb").appendChild(sec);
    const addBL=()=>{ const v=$("amblw").value; if(!blEntry(v)){ note("Type a word or phrase first."); return; } adminDo({a:"bladd",w:v}); $("amblw").value=""; };
    $("amblb").onclick=addBL; $("amblw").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); addBL(); } }); }
  function renderBL(){
    const l=$("amblist"); if(!l) return; l.replaceChildren();
    if(!blw.length) l.appendChild(mk("div","none","No blocked words yet."));
    blw.forEach(w=>{ const r=mk("div","arow"); r.append(mk("span","an",w)); const b=mk("button","","Remove"); b.onclick=()=>adminDo({a:"bldel",w}); r.appendChild(b); l.appendChild(r); });
    const sm=$("ambl")&&$("ambl").querySelector("summary"); if(sm) sm.textContent="🚫 Word blacklist"+(blw.length?" ("+blw.length+")":"");
  }
  ab.onclick=()=>{ am.classList.add("open"); note(""); $("amch").value=curCh==="gal"?"gal":curCh==="shame"?"shame":curCh==="draw"?"draw":curCh==="polls"?"polls":curCh==="tier"?"tier":"main"; renderAdminLists(); };
  $("amx").onclick=()=>am.classList.remove("open");
  am.addEventListener("mousedown",e=>{ if(e.target===am) am.classList.remove("open"); });
  $("ambanb").onclick=()=>{ const n=$("amban").value.trim(); if(n){ adminDo({a:"ban",name:n}); $("amban").value=""; } };
  $("ampb").onclick=()=>{
    const n=$("ampn").value.trim(), p=$("ampp").value;
    if(!n){ note("Type a name first."); return; }
    if(!p||p.length<4){ note("Use at least 4 characters."); return; }
    adminDo({a:"setpw",name:n,v:hVer(hCred(p))}); $("ampp").value="";
  };
  $("amclr").onclick=()=>{
    const ch=$("amch").value, nm=ch==="gal"?"the image gallery":ch==="shame"?"the Hall of Shame":ch==="draw"?"the drawing board":ch==="polls"?"the Polls tab":ch==="tier"?"ALL tier lists":"the main chat";
    if(!confirm("Clear "+nm+" for everyone? Other channels and private chats aren't touched.")) return;
    if(ch==="draw"){ if(window.__pbBoardClear){ window.__pbBoardClear(); note("Drawing board cleared."); } }
    else adminDo({a:"clear",ch});
  };
  $("ammall").onclick=()=>adminDo({a:reg.muteAll?"unmuteall":"muteall"});
  $("amanb").onclick=()=>{ const t=$("amant").value.trim(); if(!t){ note("Type an announcement first."); return; } adminDo({a:"announce",text:t,n:usr,dur:+(($("amdur")||{}).value||5),col:($("amcol")||{}).value}); $("amant").value=""; };
  $("amant").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); $("amanb").click(); } });
  $("amscall").onclick=()=>{ if(confirm("Jumpscare everyone (except owners) for 5 seconds?")) adminDo({a:"scare",u:"all",img:jsCustom()}); };
  $("amscpv").onclick=()=>{ note("Previewing on your screen…"); jumpscare(jsCustom()); };
  function jsShowInfo(){ const t=$("amscthumb"), i=$("amscinfo"); if(!t||!i) return;
    if(jsCustomImg){ t.src=jsCustomImg; t.style.display=""; i.textContent="Your custom image is used for every jumpscare you send."; }
    else { t.style.display="none"; i.textContent="Using the default jumpscare image."; } }
  $("amscimg").onclick=()=>$("amscfile").click();
  $("amscfile").onchange=()=>{
    const f=$("amscfile").files&&$("amscfile").files[0]; $("amscfile").value=""; if(!f) return;
    if(!/^image\//.test(f.type)){ note("That isn't an image."); return; }
    const url=URL.createObjectURL(f), im=new Image();
    im.onload=()=>{ try{
      const k=Math.min(1,1000/Math.max(im.width,im.height)), c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(im.width*k)); c.height=Math.max(1,Math.round(im.height*k));
      const x=c.getContext("2d"); x.fillStyle="#000"; x.fillRect(0,0,c.width,c.height); x.drawImage(im,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      let d=c.toDataURL("image/jpeg",.82); if(d.length>600000) d=c.toDataURL("image/jpeg",.6);
      if(!jsImgOk(d)){ note("That image is too big."); return; }
      jsCustomImg=d; save(JS_IK,d); jsShowInfo(); note("Custom jumpscare image set. Hit Preview to see it.");
    }catch(e){ note("Couldn't read that image."); } };
    im.onerror=()=>{ URL.revokeObjectURL(url); note("Couldn't read that image."); }; im.src=url;
  };
  $("amscrst").onclick=()=>{ jsCustomImg=""; save(JS_IK,""); jsShowInfo(); note("Back to the default jumpscare image."); };
  jsShowInfo();
  /* =============== 📝 main-chat log → Google Doc (through an Apps Script web app) =============== */
  const LG_URL="pb_logurl", LG_ON="pb_logon";
  const lgUrl=()=>String(load(LG_URL,"")||"");
  const lgOn=()=>load(LG_ON,"1")==="1";
  const lgActive=()=>adminMode&&!!lgUrl()&&lgOn();
  let lgQ=[], lgSeen=new Set(), lgSentN=0, lgLast="", lgErr="";
  const lgBody=o=>o.fl?"[sent a file]":o.poll?"[created a poll]":o.img?"[sent an image]":o.aud?"[sent a voice message]":String(o.b||"");
  function lgAdd(k,ts,line){
    if(lgSeen.has(k)) return; lgSeen.add(k);
    if(lgSeen.size>3000){ const it=lgSeen.values(); for(let n=0;n<1000;n++) lgSeen.delete(it.next().value); }
    if(lgQ.length<500) lgQ.push({k,ts,line:String(line).slice(0,2000)});
  }
  function lgEntry(o){                          // only public main-chat messages; DMs, groups and the gallery are never logged
    if(!lgActive()||!o||o.to||o.g) return;
    const now=Date.now();
    if(o.del){
      if(now-(o.v||0)>120000) return;
      const a=archive.get(o.i); if(!a||a.ch==="gal"||a.ch==="shame"||a.to||a.g) return;
      lgAdd(o.i+":d",o.v||now,"🗑 "+a.u+"'s message was deleted: "+lgBody(a)); return;
    }
    if(o.ch==="gal"||o.ch==="shame"||typeof o.b!=="string"||!o.u) return;
    if(o.edited){ if(now-(o.v||0)>120000) return; lgAdd(o.i+":e:"+(o.v||0),o.v||now,o.u+" (edited): "+lgBody(o)); return; }
    if(now-(o.ts||0)>120000) return;            // skip old history that is re-synced when someone joins
    lgAdd(o.i+":n",o.ts||now,o.u+": "+lgBody(o));
  }
  function lgFlush(){
    if(!lgActive()||!lgQ.length) return;
    const batch=lgQ.splice(0,50);
    fetch(lgUrl(),{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({entries:batch})})
      .then(()=>{ lgSentN+=batch.length; lgLast=new Date().toLocaleTimeString(); lgErr=""; })
      .catch(()=>{ lgQ=batch.concat(lgQ).slice(0,500); lgErr="Couldn't reach Google — will retry."; });
  }
  setInterval(lgFlush,3000);
  const _mgLog=mergeEntry;
  mergeEntry=function(o){ const r=_mgLog(o); try{ if(r) lgEntry(o); }catch(e){} return r; };
  const _seLog=sendEntry;
  sendEntry=function(o,from){ const r=_seLog.apply(this,arguments); try{ if(!from) lgEntry(o); }catch(e){} return r; };
  function lgStatus(){
    const st=$("amlgst"); if(!st) return;
    $("amlgo").textContent=lgOn()?"⏸ Pause logging":"▶ Resume logging";
    st.textContent=!lgUrl()?"Not set up yet — paste the web app URL above and press Save.":
      !adminMode?"Owner mode is off — press Ctrl+I to unlock it before joining.":
      !lgOn()?"⏸ Paused.":
      "✅ Logging on · "+lgSentN+" sent"+(lgLast?" · last at "+lgLast:"")+(lgQ.length?" · "+lgQ.length+" waiting":"")+(lgErr?" · "+lgErr:"");
  }
  tick(lgStatus,1000);
  $("amlgsv").onclick=()=>{
    const u=$("amlgu").value.trim();
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)){ note("That doesn't look like an Apps Script web app URL (it should end in /exec)."); return; }
    save(LG_URL,u); save(LG_ON,"1"); note("Saved. Press “Send test line” to check it works."); lgStatus();
  };
  $("amlgt").onclick=()=>{
    if(!lgUrl()){ note("Save the web app URL first."); return; }
    if(!adminMode){ note("Owner mode is off — press Ctrl+I to unlock it first."); return; }
    if(!lgOn()){ note("Logging is paused — resume it first."); return; }
    lgAdd("t:"+Date.now(),Date.now(),"✅ Logging test from "+usr); lgFlush(); note("Test line sent — check the Google Doc in a few seconds.");
  };
  $("amlgo").onclick=()=>{ save(LG_ON,lgOn()?"0":"1"); lgStatus(); };
  ab.addEventListener("click",()=>{ $("amlgu").value=lgUrl(); lgStatus(); });

  /* =============== 🛡 mod panel (for names an owner approved) =============== */
  function renderMods(){
    const el=$("ammods"); if(!el) return; el.replaceChildren();
    if(!reg.mods.length){ el.appendChild(mk("div","none","No mods yet.")); return; }
    reg.mods.forEach(n=>{
      const r=mk("div","arow"); r.append(mk("span","an",n+(own(reg.acc,n)?" 🔒":" ⚠ not registered yet")));
      const b=mk("button","red","Remove"); b.onclick=()=>adminDo({a:"delmod",name:n}); r.appendChild(b); el.appendChild(r);
    });
  }
  const addModNow=()=>{ const n=$("ammodn").value.trim(); if(!n){ note("Type a name first."); return; } adminDo({a:"addmod",name:n}); $("ammodn").value=""; };
  $("ammodb").onclick=addModNow;
  $("ammodn").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); addModNow(); } });

  const mm=document.createElement("div"); mm.id="mmod";
  mm.innerHTML='<div class="acard"><div class="ah"><b>🛡 Mod panel</b><button type="button" id="mmx" title="Close">✕</button></div><div id="mmsg"></div><div id="mmb"><div><h4>Public announcement</h4><div class="aform"><textarea id="mmant" rows="2" maxlength="300" placeholder="Message to show everyone…"></textarea><button class="abtn" type="button" id="mmanb">📢 Announce</button></div></div><div><h4>⭐ Custom emojis &amp; stickers</h4><div id=\"mmce\"></div></div><div><h4>😈 Trolls</h4><div id=\"mmtr\"></div></div><div><h4>Deleting messages</h4><div class="none">Hover over any message (or tap it on a phone) and press the 🗑 button to delete it for everyone.</div></div></div></div>';
  document.body.appendChild(mm);
  function modDo(m){
    if(isHost) procMod(m,{reply:r=>note(r.msg)});
    else { m.t="MD"; m.i=newId(); send(m); }
  }
  $("mmanb").onclick=()=>{ const t=$("mmant").value.trim(); if(!t){ note("Type an announcement first."); return; } if(reg.mao){ note("Owners have turned mod announcements off"); return; } modDo({a:"announce",text:t,dur:+(($("mmdur")||{}).value||5),col:($("mmcol")||{}).value}); $("mmant").value=""; };
  $("mmx").onclick=()=>mm.classList.remove("open");
  mm.addEventListener("mousedown",e=>{ if(e.target===mm) mm.classList.remove("open"); });
  const mbt=document.createElement("button"); mbt.id="modbtn"; mbt.className="stg-btn"; mbt.type="button"; mbt.textContent="🛡 Mod panel"; mbt.style.display="none";
  document.querySelector(".stg-sb").insertBefore(mbt,$("stg-toggle"));
  mbt.onclick=()=>{ mm.classList.add("open"); note(""); };
  setInterval(()=>{
    const inRoom=!!peer&&$("gate").style.display==="none";
    mbt.style.display=(inRoom&&amMod())?"":"none";
    if(!amMod()) mm.classList.remove("open");
  },800);

  /* =============== OWNER / MOD tags (+ hide in settings) =============== */
  (function(){
    const css=document.createElement("style");
    css.textContent=".rtag{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.4px;padding:1px 5px;margin-left:6px;border-radius:4px;vertical-align:middle;line-height:1.3;color:#fff}"
      +".rtag.admin{background:#ff453a}.rtag.mod{background:#30d158;color:#06260f}";
    document.head.appendChild(css);
    const isAdminName=n=>{ const l=low(n); if(!l) return false; if(adminMode&&l===low(usr)) return true;
      return isHost?conns.some(c=>c.ok2&&c.admin&&low(c.userName)===l):reg.adms.includes(l); };
    window.__pbIsAdmin=isAdminName;
    const roleOf=n=>{ const l=low(n); if(reg.hid.includes(l)) return ""; return isAdminName(n)?"admin":(reg.mods.includes(l)?"mod":""); };
    function tagAll(){
      document.querySelectorAll("#box .lbl[data-nm]").forEach(lb=>{
        const r=roleOf(lb.dataset.nm); if((lb.dataset.tg||"")===r) return;
        lb.dataset.tg=r; const old=lb.querySelector(".rtag"); if(old) old.remove();
        if(r){ const t=document.createElement("span"); t.className="rtag "+r; t.textContent=r==="admin"?"OWNER":"MOD"; lb.appendChild(t); }
      });
    }
    let tgq=0; new MutationObserver(()=>{ if(tgq) return; tgq=requestAnimationFrame(()=>{ tgq=0; tagAll(); }); }).observe($("box"),{childList:true,subtree:true});
    const _pr=pushRoster; pushRoster=function(){ _pr.apply(this,arguments); if(isHost) try{ send(areg()); }catch(e){} };

    window.setHidden=function(l,h){
      const has=reg.hid.includes(l);
      if(h&&!has){ if(reg.hid.length>=100) return; reg.hid.push(l); }
      else if(!h&&has) reg.hid=reg.hid.filter(x=>x!==l);
      else return;
      commit();
    };
    const hc=document.createElement("div"); hc.className="stg-card"; hc.style.display="none";
    hc.innerHTML='<h3>Role tag</h3><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="hidetag" style="width:auto;margin:0"> Hide my OWNER / MOD tag</label><div class="stg-note">Everyone else stops seeing the tag next to your name. You keep all your powers.</div>';
    document.querySelector(".stg-scroll").appendChild(hc);
    $("hidetag").checked=load("pb_hidetag","0")==="1";
    let lastTH=0;
    $("hidetag").onchange=()=>{ save("pb_hidetag",$("hidetag").checked?"1":"0"); lastTH=0; syncTag(); };
    function syncTag(){
      const role=adminMode||amMod(), inRoom=!!peer&&$("gate").style.display==="none";
      hc.style.display=role?"":"none";
      if(!role||!inRoom) return;
      const want=load("pb_hidetag","0")==="1", l=low(usr);
      if(want===reg.hid.includes(l)) return;
      if(isHost) setHidden(l,want);
      else if(Date.now()-lastTH>3000){ lastTH=Date.now(); send({t:"TH",i:newId(),h:want}); }
    }
    tick(()=>{ syncTag(); tagAll(); },800);
  })();

  /* =============== custom tags: the settings card + showing them next to names =============== */
  (function(){
    const css=document.createElement("style");
    css.textContent=".ctag{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0;text-transform:none;padding:1px 7px;margin-left:6px;border-radius:999px;vertical-align:middle;line-height:1.35;white-space:nowrap;color:color-mix(in srgb,var(--tc,#5865f2) 72%,var(--text,#888));background:color-mix(in srgb,var(--tc,#5865f2) 16%,transparent);border:1px solid color-mix(in srgb,var(--tc,#5865f2) 55%,transparent)}"
      +"#ctg-sw{display:flex;gap:8px;flex-wrap:wrap;padding:4px 0}#ctg-sw button{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0}#ctg-sw button.on{border-color:var(--text,#fff);box-shadow:0 0 0 2px var(--bg,#000) inset}"
      +"";
    document.head.appendChild(css);
    window.__pbTagOk=tagOk;
    window.__pbTagOf=n=>{ const t=reg.tg&&reg.tg[low(n)]; return t&&tagOk(t.t)?t:null; };
    window.__pbTagRemove=n=>{ if(isHost) setUserTag({userName:usr,admin:adminMode,local:1},{f:n,g:""}); else send({t:"TG",i:newId(),f:n,g:""}); };
    const card=document.createElement("div"); card.className="stg-card";
    card.innerHTML='<h3>Custom tag</h3><div class="stg-note">Add your own little tag next to your name, like "Gamer" or "Cat dad". You can\'t use admin, mod or owner.</div>'
      +'<label>Tag text</label><input type="text" id="ctg-t" maxlength="16" placeholder="e.g. Gamer" autocomplete="off">'
      +'<label>Color</label><div id="ctg-sw"></div>'
      +'<div class="stg-note">Preview: <span id="ctg-prev" class="ctag" style="margin-left:0"></span></div>'
      +'<div class="stg-row"><button type="button" class="btn" id="ctg-save">Save tag</button><button type="button" class="btn alt" id="ctg-rm">Remove tag</button></div><div class="stg-note" id="ctg-err"></div>';
    document.querySelector(".stg-scroll").appendChild(card);
    let col=TAG_COLORS[0];
    const mine=()=>{ try{ return JSON.parse(load("pb_mytag","null")); }catch(e){ return null; } };
    const sw=$("ctg-sw");
    TAG_COLORS.forEach(c=>{ const b=document.createElement("button"); b.type="button"; b.style.background=c; b.dataset.c=c; b.setAttribute("aria-label","Tag color "+c); b.onclick=()=>{ col=c; paint(); }; sw.appendChild(b); });
    function paint(){ [...sw.children].forEach(b=>b.classList.toggle("on",b.dataset.c===col)); const p=$("ctg-prev"), t=tagClean($("ctg-t").value); p.textContent=t||"your tag"; p.style.setProperty("--tc",col); p.style.opacity=t?1:.5; }
    const m=mine(); if(m&&m.t){ $("ctg-t").value=m.t; if(TAG_COLORS.includes(m.c)) col=m.c; }
    paint(); $("ctg-t").addEventListener("input",()=>{ $("ctg-err").textContent=""; paint(); });
    const say=(t,ok)=>{ const e=$("ctg-err"); e.textContent=t; e.style.color=ok?"#30d158":"#ff453a"; };
    $("ctg-save").onclick=()=>{
      const t=tagClean($("ctg-t").value); $("ctg-t").value=t;
      if(!t){ say("Type a tag first."); return; }
      if(!tagOk(t)){ say("That tag isn't allowed. Tags can't say (or look like) admin, mod or owner."); return; }
      save("pb_mytag",JSON.stringify({t,c:col})); say("Saved ✓ — it shows next to your name once you're in the room.",1); lastSend=0; syncMy();
    };
    $("ctg-rm").onclick=()=>{ save("pb_mytag",JSON.stringify({t:"",c:""})); $("ctg-t").value=""; $("ctg-err").textContent=""; paint(); lastSend=0; syncMy(); };
    let lastSend=0;
    function syncMy(){                            // keep the room's copy of my tag equal to what I chose (once I'm in the room)
      const want=mine(), inRoom=!!peer&&$("gate").style.display==="none"; if(!want||!inRoom) return;
      const l=low(usr), cur=reg.tg[l];
      if(!want.t&&!cur) return;
      if(want.t&&cur&&cur.t===want.t&&cur.c===want.c) return;
      if(want.t&&!tagOk(want.t)) return;
      if(isHost) setUserTag({userName:usr,admin:adminMode,local:1,tgAt:0},{g:want.t,c:want.c});
      else if(Date.now()-lastSend>3000){ lastSend=Date.now(); send({t:"TG",i:newId(),g:want.t,c:want.c}); }
    }
    function tagLabels(){
      document.querySelectorAll("#box .lbl[data-nm]").forEach(lb=>{
        const ct=window.__pbTagOf(lb.dataset.nm), key=ct?ct.t+"|"+ct.c:"";
        if((lb.dataset.ct||"")===key) return;
        lb.dataset.ct=key; const old=lb.querySelector(".ctag"); if(old) old.remove();
        if(ct){ const sp=document.createElement("span"); sp.className="ctag"; sp.textContent=ct.t; sp.style.setProperty("--tc",ct.c); lb.appendChild(sp); }
      });
    }
    let q=0; new MutationObserver(()=>{ if(q) return; q=requestAnimationFrame(()=>{ q=0; tagLabels(); }); }).observe($("box"),{childList:true,subtree:true});
    tick(()=>{ syncMy(); tagLabels(); },800);
  })();

  /* =============== Hall of Shame: typing is for mods + owners only =============== */
  (function(){
    window.__pbAdm=()=>adminMode;
    window.__pbIsMod=function(conn){ if(!conn) return adminMode||amMod(); return !!conn.admin||reg.mods.includes(low(conn.userName)); };   // owner or approved mod (tier lists use this)
    const canPost=()=>adminMode||amMod();
    function updShame(){
      const inp=$("inp"); if(!inp) return;
      if(curCh==="shame"){
        const ok=canPost(); inp.disabled=!ok; inp.dataset.shl="1";
        inp.placeholder=ok?"Post in the Hall of Shame…":"🔒 Only mods and owners can post here";
      } else if(inp.dataset.shl){ inp.disabled=false; delete inp.dataset.shl; }
    }
    const _sc=setChannel; setChannel=function(){ const r=_sc.apply(this,arguments); updShame(); return r; };
    const _pm=postMsg;
    postMsg=function(b,img,aud){
      if(curCh==="shame"){
        if(!canPost()){ sys("Only mods and owners can post in the Hall of Shame."); return; }
        if(aud){ sys("Voice messages can't be posted in the Hall of Shame."); return; }
      }
      return _pm.apply(this,arguments);
    };
    tick(updShame,800);
  })();

  /* =============== 🏷 admin-editable tab names + icons (synced to everyone) =============== */
  (function(){
    const TD={app:{i:"",n:"Los Purebreds"},main:{i:"💬",n:"Chat"},gal:{i:"🖼️",n:"Image Gallery"},shame:{i:"🚨",n:"Hall of Shame"},draw:{i:"🎨",n:"Draw"},polls:{i:"📊",n:"Polls"},tier:{i:"🏆",n:"Tiers"},games:{i:"🎮",n:"Games & Media"},home:{i:"🏠",n:"Home"}};
    /* Any OTHER hard-coded tab button (#chtabs button[data-ch=…]) is picked up automatically below — you never have to list it here.
       (Add a line to TD/LBL only if you want a nicer label than the tab's own name.) */
    const LBL={app:"App name + logo",main:"Chat tab",gal:"Gallery",shame:"Hall of Shame",draw:"Drawing board",polls:"Polls",tier:"Tier lists",games:"Games & Media",home:"Home"};
    const set=(el,t)=>{ if(el&&el.textContent!==t) el.textContent=t; };
    const avImg=(el,im,t)=>{
      if(!el) return;
      if(im){ if(el.dataset.im!==im){ el.dataset.im=im; el.style.setProperty("background","url("+im+") center/cover no-repeat","important"); } el.classList.add("hasimg"); if(el.textContent) el.textContent=""; }
      else { if(el.dataset.im){ delete el.dataset.im; el.style.removeProperty("background"); } el.classList.remove("hasimg"); if(t!==undefined) set(el,t); }
    };
    const SKIPTAB=new Set(["app","dm","grp"]);
    function discover(){                       // find tabs nobody listed yet; remember their current icon + name as the defaults
      let added=false;
      document.querySelectorAll('#chtabs button[data-ch]:not([data-ctid])').forEach(b=>{
        const k=b.dataset.ch;
        if(!k||SKIPTAB.has(k)||TD[k]||!/^[a-z][a-z0-9_]{0,15}$/.test(k)) return;
        const t=(b.textContent||"").trim(), m=t.match(/^(\S+)\s+(.+)$/);
        TD[k]={i:m?m[1]:"",n:(m?m[2]:t||k).slice(0,24)}; LBL[k]=TD[k].n; added=true;
      });
      return added;
    }
    window.__pbTabs=function(){
      const tn=reg.tn||{};
      if(discover()&&window.__pbTabRows) window.__pbTabRows();
      Object.keys(TD).filter(k=>k!=="app").forEach(k=>{
        const o=tn[k]||{}, d=TD[k], n=o.n||d.n, i=o.i||d.i, im=o.im||"";
        const b=document.querySelector('#chtabs button[data-ch="'+k+'"]');
        if(b){
          const hi=(window.__pbHomeIcons||{})[k]||"", bim=im||(o.i?"":hi);   // default = same picture as the homescreen tile (until an owner sets their own emoji / image)
          const sig=bim+"|"+i+"|"+n, want=bim?n:i+" "+n;
          if(b.dataset.sig!==sig||b.textContent!==want){
            b.dataset.sig=sig; b.replaceChildren();
            if(bim){ const g=new Image(); g.className="tabimg"+(im?"":" hm"); g.alt=""; g.src=bim; b.append(g,document.createTextNode(n)); } else b.textContent=want;
          }
        }
        if(k==="main") return;
        const row=$("ch-"+k); if(!row) return;
        set(row.querySelector("b"),o.n||(k==="draw"?"Drawing Board":k==="tier"?"Tier Lists":d.n)); avImg(row.querySelector(".av-sb"),im,i);
      });
      const an=(tn.app&&tn.app.n)||TD.app.n;
      set(document.querySelector("#gate h1"),an); set(document.querySelector("#ch-main b"),an);
      avImg(document.querySelector("#ch-main .av-sb"),(tn.app&&tn.app.im)||"");
      window.__pbTitle=(tn.app&&tn.app.n)||null;
    };
    tick(window.__pbTabs,1500); window.__pbTabs();

    const host=$("amtn"), inp={}, imgs={};
    function showImg(k){ const d=imgs[k]||""; const p=inp[k]&&inp[k].pv; if(!p) return; if(d){ p.src=d; p.style.display=""; inp[k].xb.style.display=""; } else { p.removeAttribute("src"); p.style.display="none"; inp[k].xb.style.display="none"; } }
    function gifKeep(f,cb,ok){ if(!(f&&(f.type==="image/gif"||/\.gif$/i.test(f.name||"")))) return false; const r=new FileReader(); r.onload=e=>{ const d=String(e.target.result); cb(ok(d)?d:""); }; r.readAsDataURL(f); return true; }
    function tabImgFrom(f,cb){                       // crop to a small square, keep transparency, stay under the size limit
      if(gifKeep(f,cb,okTImg)) return;               // GIFs stay as they are so they keep moving
      const url=URL.createObjectURL(f), im=new Image();
      im.onload=()=>{
        URL.revokeObjectURL(url);
        const side=Math.min(im.width,im.height)||1, sx=(im.width-side)/2, sy=(im.height-side)/2;
        for(const size of [96,72,56,40]){
          const c=document.createElement("canvas"); c.width=c.height=size; c.getContext("2d").drawImage(im,sx,sy,side,side,0,0,size,size);
          let d=c.toDataURL("image/webp",0.9); if(!d.startsWith("data:image/webp")) d=c.toDataURL("image/png");
          if(okTImg(d)&&d.length<=36000){ cb(d); return; }
        }
        cb("");
      };
      im.onerror=()=>{ URL.revokeObjectURL(url); cb(""); };
      im.src=url;
    }
    const rowsBox=document.createElement("div"); host.appendChild(rowsBox);
    const built=new Set();
    function mkRow(k){
      const r=document.createElement("div"); r.className="aform"; r.style.marginBottom="6px";
      const l=document.createElement("span"); l.className="none"; l.style.cssText="width:96px;align-self:center"; l.textContent=LBL[k];
      r.appendChild(l); inp[k]={};
      if(k!=="app"){ const i=document.createElement("input"); i.type="text"; i.maxLength=8; i.placeholder="icon"; i.style.cssText="flex:none;min-width:0;width:60px;text-align:center"; r.appendChild(i); inp[k].i=i; }
      const n=document.createElement("input"); n.type="text"; n.maxLength=24; n.placeholder="name"; r.appendChild(n); inp[k].n=n;
      const pv=document.createElement("img"); pv.className="tabimg big"; pv.alt=""; pv.style.display="none"; pv.title="Current image";
      const ib=document.createElement("button"); ib.type="button"; ib.className="abtn"; ib.textContent="🖼 Image"; ib.title="Use a picture (PNG, JPG or WebP) as this icon";
      const xb=document.createElement("button"); xb.type="button"; xb.className="abtn"; xb.textContent="✕"; xb.title="Remove the image"; xb.style.display="none";
      const fi=document.createElement("input"); fi.type="file"; fi.accept="image/png,image/jpeg,image/webp,image/gif,image/*"; fi.hidden=true;
      ib.onclick=()=>fi.click();
      xb.onclick=()=>{ imgs[k]=""; showImg(k); };
      fi.onchange=()=>{ const f=fi.files&&fi.files[0]; fi.value=""; if(f) tabImgFrom(f,d=>{ if(d){ imgs[k]=d; showImg(k); } else note("Couldn't use that picture — try a different one."); }); };
      r.append(pv,ib,xb,fi); inp[k].pv=pv; inp[k].xb=xb;
      rowsBox.appendChild(r); built.add(k);
    }
    function syncRows(){ discover(); Object.keys(TD).forEach(k=>{ if(!built.has(k)) mkRow(k); }); }
    window.__pbTabRows=syncRows; syncRows();
    const btns=document.createElement("div"); btns.className="aform";
    const sv=document.createElement("button"); sv.type="button"; sv.className="abtn"; sv.textContent="💾 Save for everyone";
    const rs=document.createElement("button"); rs.type="button"; rs.className="abtn red"; rs.textContent="Reset to default";
    btns.append(sv,rs); host.appendChild(btns);
    function fill(){
      syncRows();
      Object.keys(TD).forEach(k=>{ if(!inp[k]) return; const o=(reg.tn||{})[k]||{}; inp[k].n.value=o.n||TD[k].n; if(inp[k].i) inp[k].i.value=o.i||TD[k].i; imgs[k]=o.im||""; showImg(k); });
    }
    sv.onclick=()=>{
      const tn={};
      Object.keys(TD).forEach(k=>{
        if(!inp[k]) return;
        const n=inp[k].n.value.trim(), i=inp[k].i?inp[k].i.value.trim():"";
        const nn=n===TD[k].n?"":n, ii=i===TD[k].i?"":i;
        if(nn||ii||imgs[k]) tn[k]={n:nn,i:ii,im:imgs[k]||""};
      });
      adminDo({a:"tabs",tn});
    };
    rs.onclick=()=>{ adminDo({a:"tabs",tn:{}}); setTimeout(fill,400); };
    fill();
    new MutationObserver(()=>{ if($("amod").classList.contains("open")) fill(); }).observe($("amod"),{attributes:true,attributeFilter:["class"]});
  })();

  /* =============== 🏠 homepage icons: owners add / edit / remove them, everyone sees them =============== */
  window.__pbTT={ get:()=>reg.tt, set:tt=>{ tt=cleanTT(tt); reg.tt=tt; if(isHost){ commit(); } else { saveReg(); try{ send({t:"TT",i:newId(),tt}); }catch(e){} } } };   // tab nesting (Docs theme): the host shares it with everyone
  window.__pbHomeGet=()=>reg.hm;                                   // null = default tiles
  window.__pbHomeSave=hm=>adminDo({a:"home",hm:hm});
  window.__pbHomeRefresh=()=>{ if(window.__pbHomeRender) window.__pbHomeRender(); };

  /* =============== ⭐ custom emojis + stickers: show them, pick them, make them =============== */
  (function(){
    const css=document.createElement("style");
    css.textContent=".cemo{width:1.45em;height:1.45em;vertical-align:-.32em;object-fit:contain;margin:0 1px}"
      +".bubble.jumbo .cemo{width:46px;height:46px;vertical-align:middle}"
      +".img.stk{max-width:150px;max-height:150px;cursor:default;background:none;border-radius:0}"
      +".stpick{position:relative}.cedel{position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(0,0,0,.7);color:#fff;font-size:11px;line-height:20px;padding:0;cursor:pointer;display:none}.stpick:hover .cedel{display:block}@media(hover:none){.cedel{display:block}}"
      +"#emo-grid span.cepick{width:40px;height:40px}#emo-grid span.cepick img{width:28px;height:28px;object-fit:contain;pointer-events:none}"
      +"#emo-grid span.stpick{width:78px;height:78px}#emo-grid span.stpick img{width:68px;height:68px;object-fit:contain;pointer-events:none}"
      +"#emo-grid .sech{width:100%;font-size:11px;font-weight:700;color:#5f6368;padding:6px 6px 2px;text-transform:uppercase;letter-spacing:.5px}"
      +".cebox .cerow{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:13px}"
      +".cebox .cerow img{width:30px;height:30px;object-fit:contain;border-radius:6px;background:rgba(127,127,127,.15);flex:none}"
      +".cebox .cerow b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
      +".cebox .cepv{width:34px;height:34px;object-fit:contain;border-radius:6px;background:rgba(127,127,127,.15)}";
    document.head.appendChild(css);

    const RE=/:([a-z0-9_]{2,20}):/g;
    function paint(bub){
      const text=bub._raw==null?bub.textContent:bub._raw, ce=reg.ce||{};
      let used=0, last=0, m, frag=null;
      if(text.indexOf(":")>=0&&Object.keys(ce).length){
        frag=document.createDocumentFragment(); RE.lastIndex=0;
        while((m=RE.exec(text))){
          const c=ce[m[1]]; if(!c||c.k!=="e") continue;
          if(m.index>last) frag.append(text.slice(last,m.index));
          const im=document.createElement("img"); im.className="cemo"; im.src=c.im; im.alt=":"+m[1]+":"; im.title=":"+m[1]+":"; frag.appendChild(im);
          last=RE.lastIndex; used++;
        }
        if(last<text.length) frag.append(text.slice(last));
      }
      if(!used){ if(bub.childElementCount||bub.textContent!==text) bub.textContent=text; bub.classList.remove("jumbo"); return; }
      bub.replaceChildren(frag);
      const only=text.replace(RE,(x,n)=>(ce[n]&&ce[n].k==="e")?"":x).trim()==="";
      bub.classList.toggle("jumbo",only&&used<=5);
    }
    window.fillBubble=(bub,text)=>{ bub._raw=text; paint(bub); };
    window.__ceNames=()=>Object.keys(reg.ce||{}).filter(n=>reg.ce[n].k==="e").sort();
    window.__ceImg=n=>(reg.ce&&reg.ce[n]&&reg.ce[n].im)||"";

    const tabs=$("emo-tabs"), grid=$("emo-grid"), title=$("emo-title"), foot=$("emo-foot");
    const ct=document.createElement("span"); ct.textContent="⭐"; ct.dataset.g="ce"; ct.title="Custom emojis & stickers"; tabs.appendChild(ct);
    function fillCE(){
      grid.replaceChildren();
      const ce=reg.ce||{}, names=Object.keys(ce).sort(), em=names.filter(n=>ce[n].k==="e"), st=names.filter(n=>ce[n].k==="s");
      const sec=t=>{ const d=document.createElement("div"); d.className="sech"; d.textContent=t; grid.appendChild(d); };
      if(!names.length){ const n=document.createElement("div"); n.className="none"; n.textContent="No custom emojis or stickers yet. Mods and owners can add them from their panel."; grid.appendChild(n); return; }
      if(em.length){ sec("Emojis");
        em.forEach(n=>{ const sp=document.createElement("span"); sp.className="cepick"; const im=document.createElement("img"); im.src=ce[n].im; im.alt=":"+n+":"; sp.appendChild(im);
          sp.onmouseenter=()=>{ foot.textContent=":"+n+":"; };
          sp.onclick=()=>{ if(window.__rxPick){ sys("Custom emojis can only go in messages, not reactions."); return; } insertAtCursor(":"+n+": "); };
          grid.appendChild(sp); }); }
      if(st.length){ sec("Stickers");
        st.forEach(n=>{ const sp=document.createElement("span"); sp.className="stpick"; const im=document.createElement("img"); im.src=ce[n].im; im.alt=":"+n+":"; sp.appendChild(im);
          sp.onmouseenter=()=>{ foot.textContent="Sticker :"+n+":"; };
          sp.onclick=()=>{ if(window.__rxPick) return; setShown($("emo-panel"),false,"flex"); postMsg(ce[n].im,1,0,{stk:1}); };
          if(adminMode||ce[n].by===low(usr)){        // only the maker (or an owner) sees the remove button
            const x=document.createElement("button"); x.type="button"; x.className="cedel"; x.textContent="✕"; x.title="Remove this sticker (only you or an owner can)";
            x.onclick=ev=>{ ev.stopPropagation(); if(!confirm("Remove the sticker :"+n+": for everyone?")) return; const m={a:"ce",op:"del",nm:n}; if(adminMode) adminDo(m); else modDo(m); };
            sp.appendChild(x);
          }
          grid.appendChild(sp); }); }
    }
    ct.onclick=()=>{ [...tabs.children].forEach(t=>t.classList.toggle("on",t===ct)); $("emo-q").value=""; title.textContent="Custom"; fillCE(); grid.scrollTop=0; foot.textContent=Object.keys(reg.ce||{}).length+" custom"; };

    /* the emoji library finishing its download used to snap the picker off the ⭐ tab */
    const _rfp=window.refreshEmojiPicker;
    window.refreshEmojiPicker=function(){
      if(ct.classList.contains("on")&&!window.__rxPick&&!$("emo-q").value.trim()){ fillCE(); foot.textContent=Object.keys(reg.ce||{}).length+" custom"; return; }
      if(_rfp) _rfp.apply(this,arguments);
    };

    function gifKeep(f,cb,ok){ if(!(f&&(f.type==="image/gif"||/\.gif$/i.test(f.name||"")))) return false; const r=new FileReader(); r.onload=e=>{ const d=String(e.target.result); cb(ok(d)?d:""); }; r.onerror=()=>cb(""); r.readAsDataURL(f); return true; }   // GIFs stay as they are so they keep moving
    function ceImg(f,type,cb){
      if(gifKeep(f,cb,okCImg)) return;
      const url=URL.createObjectURL(f), im=new Image();
      im.onload=()=>{
        URL.revokeObjectURL(url);
        const side=Math.min(im.width,im.height)||1, sx=(im.width-side)/2, sy=(im.height-side)/2;
        for(const size of (type==="s"?[160,128,96,64]:[64,48,32])){
          const c=document.createElement("canvas"); c.width=c.height=size; c.getContext("2d").drawImage(im,sx,sy,side,side,0,0,size,size);
          let d=c.toDataURL("image/webp",0.9); if(!d.startsWith("data:image/webp")) d=c.toDataURL("image/png");
          if(okCImg(d)){ cb(d); return; }
        }
        cb("");
      };
      im.onerror=()=>{ URL.revokeObjectURL(url); cb(""); };
      im.src=url;
    }

    const lists=[];
    function buildCE(host,isAdm){
      host.classList.add("cebox");
      const send=m=>{ if(isAdm) adminDo(m); else modDo(m); };
      const top=document.createElement("div"); top.className="aform"; top.style.marginBottom="6px";
      const nm=document.createElement("input"); nm.type="text"; nm.maxLength=20; nm.placeholder="name (a-z, 0-9, _)";
      nm.oninput=()=>{ nm.value=nm.value.toLowerCase().replace(/[^a-z0-9_]/g,"_"); };
      const ty=document.createElement("select"); ty.innerHTML='<option value="e">😀 Emoji (inline)</option><option value="s">🖼 Sticker (sent alone)</option>';
      top.append(nm,ty);
      const mid=document.createElement("div"); mid.className="aform"; mid.style.marginBottom="6px";
      const pick=document.createElement("button"); pick.type="button"; pick.className="abtn"; pick.textContent="🖼 Choose picture";
      const pv=document.createElement("img"); pv.className="cepv"; pv.style.display="none"; pv.alt="";
      const add=document.createElement("button"); add.type="button"; add.className="abtn"; add.textContent="➕ Add";
      const fi=document.createElement("input"); fi.type="file"; fi.accept="image/*"; fi.style.display="none";
      mid.append(pick,pv,add);
      host.appendChild(fi);   // must live in the page or Safari / iOS ignore .click()
      const st=document.createElement("div"); st.className="none"; st.style.margin="2px 0 6px";
      st.textContent="Emojis are used by typing :name: (or the ⭐ tab). Stickers are sent as big pictures from the ⭐ tab.";
      const list=document.createElement("div");
      host.append(top,mid,st,list);
      let im="", file=null;
      const crop=()=>{ if(!file) return; ceImg(file,ty.value,d=>{ im=d; if(d){ pv.src=d; pv.style.display=""; st.textContent=""; } else { pv.style.display="none"; st.textContent="Couldn't use that picture — try another."; } }); };
      pick.onclick=()=>fi.click();
      fi.onchange=()=>{ file=fi.files&&fi.files[0]||null; fi.value=""; crop(); };
      ty.onchange=crop;
      add.onclick=()=>{
        const n=nm.value.trim();
        if(!/^[a-z0-9_]{2,20}$/.test(n)){ st.textContent="Give it a name: 2–20 letters, numbers or _."; return; }
        if(!im){ st.textContent="Choose a picture first."; return; }
        send({a:"ce",op:"add",nm:n,ty:ty.value,im}); nm.value=""; im=""; file=null; pv.style.display="none"; st.textContent="Sending…";
      };
      function render(){
        const ce=reg.ce||{}, me=low(usr), names=Object.keys(ce).sort();
        list.replaceChildren();
        if(!names.length){ const d=document.createElement("div"); d.className="none"; d.textContent="None yet."; list.appendChild(d); return; }
        names.forEach(n=>{
          const c=ce[n], r=document.createElement("div"); r.className="cerow";
          const i=document.createElement("img"); i.src=c.im; i.alt="";
          const b=document.createElement("b"); b.textContent=":"+n+":"+(c.k==="s"?" · sticker":"");
          r.append(i,b);
          if(isAdm||c.by===me){ const x=document.createElement("button"); x.type="button"; x.className="abtn red"; x.textContent="✕"; x.title="Remove"; x.onclick=()=>send({a:"ce",op:"del",nm:n}); r.appendChild(x); }
          list.appendChild(r);
        });
      }
      lists.push(render); render();
    }
    buildCE($("amce"),true); buildCE($("mmce"),false);

    let sig=null;
    setInterval(()=>{
      const ce=reg.ce||{}, s=Object.keys(ce).sort().map(k=>k+ce[k].k+ce[k].by+ce[k].im.length).join("|");
      if(s===sig) return; sig=s;
      document.querySelectorAll("#box .bubble[data-bubble]").forEach(b=>{ if(b._raw!=null) paint(b); });
      lists.forEach(f=>f()); if(ct.classList.contains("on")) fillCE();
    },800);
  })();

  /* =============== 😈 troll buttons (owner panel + mod panel) =============== */
  (function(){
    const css=document.createElement("style");
    css.textContent="@keyframes trfall{0%,8%{transform:none}38%,76%{transform:translateY(125vh) rotate(var(--r,12deg))}100%{transform:none}}"
      +"@keyframes trflip{0%{transform:none}10%,90%{transform:rotate(180deg)}100%{transform:none}}"
      +"@keyframes trspin{0%{transform:none}100%{transform:rotate(720deg)}}"
      +"@keyframes trshake{0%,100%{transform:translate(0,0)}25%{transform:translate(-7px,3px) rotate(-.4deg)}50%{transform:translate(6px,-4px) rotate(.4deg)}75%{transform:translate(-5px,-3px)}}"
      +"@keyframes trrb{to{filter:hue-rotate(360deg)}}"
      +"html.tr-on{overflow:hidden}"
      +"body.tr-fall>*:not(script):not(style):not(link){animation:trfall var(--trd,8s) ease-in both}"
      +"body.tr-fall>*:nth-child(3n){--r:-38deg}body.tr-fall>*:nth-child(3n+1){--r:27deg}"
      +"body.tr-flip{animation:trflip var(--trd,8s) ease-in-out both}body.tr-spin{animation:trspin var(--trd,8s) ease-in-out both}"
      +"body.tr-shake{animation:trshake .14s linear infinite}body.tr-rainbow{animation:trrb 3s linear infinite}"
      +"body.tr-blur{filter:blur(3.5px)}"
      +".trsel{width:100%;margin-bottom:6px}.trrow{display:flex;flex-wrap:wrap;gap:6px}"
      +".trrow .abtn[disabled]{opacity:.4;cursor:not-allowed}.trsw{margin-bottom:8px}";
    document.head.appendChild(css);
    const ICON={fall:"⬇️",flip:"🙃",shake:"📳",rainbow:"🌈",spin:"🌀",blur:"🫥"};
    const isAdn=n=>!!(window.__pbIsAdmin&&window.__pbIsAdmin(n));
    function build(host,isAdm){
      const sw=document.createElement("button"); sw.type="button"; sw.className="abtn trsw";
      if(isAdm){ sw.onclick=()=>adminDo({a:"modtroll",off:!reg.mto}); host.appendChild(sw); }
      const sel=document.createElement("select"); sel.className="trsel"; host.appendChild(sel);
      let dsel=null;
      if(isAdm){ dsel=document.createElement("select"); dsel.className="trsel trdur"; dsel.title="How long trolls last (owners only)";
        [[3,"3 seconds"],[5,"5 seconds"],[8,"8 seconds (default)"],[15,"15 seconds"],[30,"30 seconds"],[60,"1 minute"],[120,"2 minutes"]].forEach(([v,l])=>dsel.appendChild(new Option("⏱ Lasts "+l,v)));
        let sv="8"; try{ sv=localStorage.getItem("pb_trdur")||"8"; }catch(e){} dsel.value=sv; if(dsel.value!==sv) dsel.value="8";
        dsel.onchange=()=>{ try{ localStorage.setItem("pb_trdur",dsel.value); }catch(e){} };
        host.appendChild(dsel); }
      const row=document.createElement("div"); row.className="trrow"; host.appendChild(row);
      const st=document.createElement("div"); st.className="none"; st.style.marginTop="6px"; host.appendChild(st);
      const bs={};
      Object.keys(TROLLS).forEach(k=>{
        const b=document.createElement("button"); b.type="button"; b.className="abtn"; b.dataset.k=k;
        b.onclick=()=>{ const m={a:"troll",tk:k,u:sel.value}; if(isAdm){ m.ds=+dsel.value; adminDo(m); } else modDo(m); };
        row.appendChild(b); bs[k]=b;
      });
      function refresh(){
        const opts=[["all","👥 Everyone"]];
        (lastRoster||[]).forEach(e=>{
          if(!e.c||e.c===uid) return;
          const ad=isAdn(e.n), md=reg.mods.includes(low(e.n));
          if(!isAdm&&(ad||md)) return;                         // mods can't pick owners or other mods
          opts.push([e.c,e.n+(ad?" (owner)":md?" (mod)":"")]);
        });
        const key=JSON.stringify(opts);
        if(sel.dataset.key!==key){
          const keep=sel.value; sel.replaceChildren(...opts.map(o=>new Option(o[1],o[0]))); sel.dataset.key=key;
          sel.value=opts.some(o=>o[0]===keep)?keep:"all";
        }
        let lock=false, msg="";
        if(isAdm){
          sw.textContent=reg.mto?"✅ Turn mod trolls ON":"⛔ Turn mod trolls OFF";
          msg=reg.mto?"Mod trolls are off — mods see “Owners have turned mod trolls off”.":"“Everyone” skips other owners. No cooldown for you.";
        } else if(reg.mto){ lock=true; msg="Owners have turned mod trolls off"; }
        else msg="“Everyone” skips owners and other mods. 30-second cooldown.";
        const left=isAdm?0:Math.max(0,Math.ceil((trCd-Date.now())/1000));
        Object.keys(bs).forEach(k=>{ bs[k].textContent=ICON[k]+" "+TROLLS[k]+(left>0?" ("+left+"s)":""); bs[k].disabled=lock||left>0; });
        st.textContent=msg;
      }
      refresh(); tick(refresh,500);
    }
    build($("amtr"),true); build($("mmtr"),false);
  })();

  /* =============== one-click "Mute all" in the top bar (owners only) =============== */
  const hm=document.createElement("button"); hm.id="hmute"; hm.type="button"; hm.style.display="none";
  hm.title="Mute / unmute everyone except owners";
  $("hdr").insertBefore(hm,$("online"));
  hm.onclick=()=>adminDo({a:reg.muteAll?"unmuteall":"muteall"});
  tick(()=>{
    const inRoom=adminMode&&!!peer&&$("gate").style.display==="none";
    hm.style.display=inRoom?"":"none";
    hm.textContent=reg.muteAll?"🔊 Unmute all":"🔇 Mute all";
    hm.classList.toggle("on",!!reg.muteAll);
  },400);
  tick(renderAdminLists,1500);

  /* =============== admin: 🗑 delete (any public message) / 🦵 kick / 🔇 mute / 🔨 ban buttons next to reply / edit / delete =============== */
  function addAdminBtns(w){
    if(!(adminMode||amMod())||!w.classList||!w.classList.contains("msg")||w.classList.contains("sys")||w.dataset.admx) return;
    const u=w.dataset.uid, name=w.dataset.user;
    if(w.classList.contains("me")||u===uid||!name) return;
    const wrap=w.querySelector(".bwrap"); if(!wrap) return;
    w.dataset.admx="1";
    let act=wrap.querySelector(":scope > .act");
    if(!act){ act=document.createElement("div"); act.className="act"; wrap.appendChild(act); }
    const mkb=(txt,title,fn)=>{ const b=document.createElement("button"); b.type="button"; b.className="adm"; b.title=title; b.setAttribute("aria-label",title); b.textContent=txt; b.style.fontSize="13px"; b.onclick=ev=>{ ev.stopPropagation(); fn(); }; return b; };
    const inPriv=!!w.dataset.dm;                                   // a DM or group chat message
    if((!inPriv||adminMode)&&!(w.dataset.ch==="shame"&&!adminMode)) act.appendChild(mkb("🗑","Delete this message from "+name+" (owner)",()=>{ if(confirm("Delete this message from "+name+(inPriv?" for everyone in this chat?":" for everyone?"))) deleteMsg(w.id); }));
    if(!u||!adminMode){ return; }
    act.appendChild(mkb("🦵","Kick "+name+" (they can rejoin)",()=>{ if(confirm("Kick "+name+"? They can rejoin.")) adminDo({a:"kick",u}); }));
    act.appendChild(mkb("🔇","Mute / unmute "+name,()=>adminDo({a:reg.mutes.includes(low(name))?"unmute":"mute",name})));
    act.appendChild(mkb("🔨","Ban the name “"+name+"”",()=>{ if(confirm('Ban the name "'+name+'" and remove them?')) adminDo({a:"ban",name}); }));
    act.appendChild(mkb("💥","Crash "+name+"'s screen and close the site for them",()=>{ if(confirm("Crash "+name+"'s screen and close the site for them? They can rejoin afterwards.")) adminDo({a:"crash",u}); }));
  }
  new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(addAdminBtns))).observe($("box"),{childList:true});
  tick(()=>{ if(adminMode||amMod()) document.querySelectorAll("#box .msg[data-uid]:not([data-admx])").forEach(addAdminBtns); },1500);

})();

;
/* ===== 09-voice-js.js ===== */
(function(){
  const $$=id=>document.getElementById(id);
  const vb=document.createElement("span"); vb.id="vbtn"; vb.title="Record a voice message"; vb.textContent="🎤";
  const vt=document.createElement("span"); vt.id="vtime"; vt.textContent="0:00";
  const vc=document.createElement("button"); vc.id="vcancel"; vc.type="button"; vc.textContent="✕ Cancel";
  const vl=document.createElement("span"); vl.id="vlive";
  $$("emo-btn").after(vb); vb.after(vt); vt.after(vl); vl.after(vc);
  const MAX=60;                       // seconds
  let rec=null, chunks=[], stream=null, timer=0, t0=0, cancelled=false;
  const mimes=["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus"];
  const pick=()=>{ if(!window.MediaRecorder) return ""; return mimes.find(m=>MediaRecorder.isTypeSupported(m))||""; };
  function ui(on){ $$("tray").classList.toggle("recording",on); vb.classList.toggle("rec",on); vb.textContent=on?"⏹":"🎤"; vb.title=on?"Stop and send":"Record a voice message"; }
  /* transcript: the browser's speech recognition listens while you record (Chrome / Edge / Safari); no support = voice message sends as before */
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let sr=null, acc="", cur="", srWait=null;
  const full=()=>(acc+" "+cur).replace(/\s+/g," ").trim();
  const live=()=>{ const l=$$("vlive"); if(l) l.textContent=full().slice(-90); };
  function srStart(){
    acc=""; cur=""; live(); if(!SR) return;
    try{
      const s=new SR(); sr=s; s.continuous=true; s.interimResults=true; s.lang=navigator.language||"en-US";
      s.onresult=e=>{ let t=""; for(let k=0;k<e.results.length;k++) t+=e.results[k][0].transcript+" "; cur=t; live(); };
      s.onerror=()=>{};
      s.onend=()=>{ acc=full(); cur=""; if(sr===s&&rec&&rec.state==="recording"){ try{ s.start(); }catch(e){} } else if(srWait) srWait(); };   // Chrome stops after a pause: keep listening while recording
      s.start();
    }catch(e){ sr=null; }
  }
  function srStop(){                                  // resolves once the last words are in (max 1 second)
    return new Promise(res=>{
      if(!sr){ res(); return; }
      const s=sr; sr=null; let done=false;
      const fin=()=>{ if(done) return; done=true; srWait=null; res(); };
      srWait=fin; setTimeout(fin,1000); try{ s.stop(); }catch(e){ fin(); }
    });
  }
  function cleanup(){ clearInterval(timer); if(stream){ stream.getTracks().forEach(t=>t.stop()); stream=null; } rec=null; ui(false); }
  async function start(){
    if($$("inp").disabled) return;
    if(!window.isSecureContext||!navigator.mediaDevices||!window.MediaRecorder){ sys("Voice messages need https and a browser that supports recording."); return; }
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:window.PBM?window.PBM.audio():{echoCancellation:true,noiseSuppression:true}}); }
    catch(e){ sys("Microphone blocked or not found."); return; }
    chunks=[]; cancelled=false;
    const mt=pick(); let r0;
    try{ r0=new MediaRecorder(stream,Object.assign({audioBitsPerSecond:24000},mt?{mimeType:mt}:{})); }catch(e){ cleanup(); sys("Couldn't start recording."); return; }
    rec=r0;
    const ctx=curCh, dm=dmWith;
    r0.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
    r0.onstop=()=>{
      const type=r0.mimeType||mt||"audio/webm", secs=(Date.now()-t0)/1000;
      const tp=srStop();
      cleanup();
      if(cancelled||secs<0.6||!chunks.length) return;
      const r=new FileReader();
      r.onload=ev=>{
        const url=String(ev.target.result).replace(/^data:[^;,]*/,"data:"+type.split(";")[0]);
        if(url.length>1800000){ sys("That voice message is too long."); return; }
        if(curCh!==ctx||dmWith!==dm){ sys("Voice message not sent — you switched chats."); return; }
        tp.then(()=>{ window.__pbTx=full(); try{ postMsg(url,0,1); }finally{ window.__pbTx=""; acc=""; cur=""; live(); } });
      };
      r.readAsDataURL(new Blob(chunks,{type}));
    };
    t0=Date.now(); r0.start(250); ui(true); $$("vtime").textContent="0:00"; srStart();
    timer=setInterval(()=>{
      const s=Math.floor((Date.now()-t0)/1000); $$("vtime").textContent=Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
      if(s>=MAX) stop();
    },250);
  }
  function stop(){ if(rec&&rec.state!=="inactive") rec.stop(); }
  vb.onclick=()=>{ if(rec) stop(); else start(); };
  vc.onclick=()=>{ cancelled=true; stop(); };
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&rec){ cancelled=true; stop(); } });
})();
