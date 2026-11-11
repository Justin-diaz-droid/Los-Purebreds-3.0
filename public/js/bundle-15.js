/* ===== 41-main.js ===== */
/* ---------- panic key: one press jumps to a site you chose ---------- */
(function(){
  var K={on:"pb_pk_on",site:"pb_pk_site",url:"pb_pk_url",key:"pb_pk_key"};
  var DEF_SITE="https://www.google.com/", DEF_KEY={key:"Escape",ctrl:false,alt:false,shift:false,meta:false};
  function g(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function p(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function $(i){return document.getElementById(i)}
  function readKey(){try{var o=JSON.parse(g(K.key));if(o&&o.key)return o}catch(e){}return DEF_KEY}
  function label(o){var a=[];if(o.ctrl)a.push("Ctrl");if(o.alt)a.push("Alt");if(o.shift)a.push("Shift");if(o.meta)a.push("Meta");var k=o.key==="Escape"?"Esc":(o.key.length===1?o.key.toUpperCase():o.key);a.push(k);return a.join(" + ")}
  function target(){
    var site=g(K.site)||DEF_SITE,u=site==="custom"?(g(K.url)||""):site;
    u=String(u).trim(); if(!u)return "";
    if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u="https://"+u;
    try{var x=new URL(u);return(x.protocol==="https:"||x.protocol==="http:")?x.href:""}catch(e){return ""}
  }
  function go(){var u=target();if(!u)return;try{location.replace(u)}catch(e){location.href=u}}
  var capturing=false, cur=readKey();
  /* runs in the capture phase, before the chat's own Escape handlers */
  window.addEventListener("keydown",function(e){
    if(capturing||g(K.on)!=="1")return;
    var st=$("stg"); if(st&&st.classList.contains("open"))return;   /* leave it alone while Settings is open */
    var o=readKey();
    if(e.key!==o.key&&!(o.key.length===1&&e.key.toLowerCase()===o.key.toLowerCase()))return;
    if(!!e.ctrlKey!==!!o.ctrl||!!e.altKey!==!!o.alt||!!e.metaKey!==!!o.meta)return;
    if(o.key.length===1&&!!e.shiftKey!==!!o.shift)return;
    if(e.repeat)return;
    var u=target(); if(!u)return;
    e.preventDefault();e.stopImmediatePropagation();go();
  },true);

  function fill(){
    cur=readKey();
    var on=$("pk-on"),site=$("pk-site"),url=$("pk-url"),kb=$("pk-key");
    if(!on||!site)return;
    on.checked=g(K.on)==="1";
    var s=g(K.site)||DEF_SITE; if(![].some.call(site.options,function(o){return o.value===s}))s="custom";
    site.value=s; url.value=g(K.url)||""; url.style.display=s==="custom"?"":"none";
    kb.textContent=label(cur);
    msg("");
  }
  function msg(t,bad){var m=$("pk-msg");if(!m)return;if(!t){m.textContent="Press the key once and this tab jumps straight to the site. Click the key button to pick a different one (Esc, F-keys, or Ctrl/Alt + a key).";m.style.color="var(--muted)";return}m.textContent=t;m.style.color=bad?"#ff453a":"var(--muted)"}
  var pending=null;
  function stage(){ /* settings are held until the main "Save changes" button is pressed, like the rest of Settings */
    pending={on:$("pk-on").checked,site:$("pk-site").value,url:$("pk-url").value.trim(),key:cur};
  }
  function persist(){
    var on=$("pk-on"); if(!on)return;
    var site=$("pk-site").value,url=$("pk-url").value.trim();
    p(K.on,on.checked?"1":"0");p(K.site,site);p(K.url,url);p(K.key,JSON.stringify(cur));
  }
  function init(){
    var site=$("pk-site"); if(!site)return;
    site.addEventListener("change",function(){$("pk-url").style.display=site.value==="custom"?"":"none";if(site.value==="custom")$("pk-url").focus()});
    $("pk-test").addEventListener("click",function(){
      var s=site.value,u=s==="custom"?$("pk-url").value.trim():s;
      if(!u){msg("Type a link first.",true);return}
      if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u="https://"+u;
      try{var x=new URL(u);if(x.protocol!=="https:"&&x.protocol!=="http:")throw 0;location.assign(x.href)}catch(e){msg("That doesn't look like a valid link.",true)}
    });
    $("pk-key").addEventListener("click",function(){
      var b=this; capturing=true; b.textContent="Press a key…"; msg("");
      function done(){capturing=false;window.removeEventListener("keydown",h,true);b.textContent=label(cur)}
      function h(e){
        e.preventDefault();e.stopImmediatePropagation();
        if(["Control","Alt","Shift","Meta"].indexOf(e.key)>=0)return;      /* wait for the real key */
        var printable=e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey;
        if(printable||e.key==="Enter"||e.key==="Tab"){msg("Pick Esc, an F-key, or hold Ctrl/Alt with a key so typing doesn't trigger it.",true);return}
        cur={key:e.key,ctrl:e.ctrlKey,alt:e.altKey,shift:e.shiftKey,meta:e.metaKey};
        done();
      }
      window.addEventListener("keydown",h,true);
    });
    var sv=$("save"); if(sv)sv.addEventListener("click",function(){persist();cur=readKey()},true);
    var st=$("stg");
    if(st)new MutationObserver(function(){if(st.classList.contains("open"))fill()}).observe(st,{attributes:true,attributeFilter:["class"]});
    fill();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

;
/* ===== 42-a11y-js.js ===== */
(function(){
"use strict";
var KEY="pb_a11y";
var D={bold:0,ts:100,shapes:0,onoff:0,transp:0,contrast:0,nocolor:0,invert:"off",cf:"off",cfk:100,tint:200,wp:0,
 rm:0,noscare:0,ptr:"normal",ptrc:"#ffffff",
 sp_new:0,sp_sel:0,sp_typ:0,sp_voice:"",sp_rate:1,
 a11y_mon:0,cam:"",mic:"",spk:"",res:"480",fps:"24",echo:1,noise:1,agc:1,mirror:1};
var S=Object.assign({},D);
try{ Object.assign(S,JSON.parse(localStorage.getItem(KEY)||"{}")); }catch(e){}
function persist(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
var root=document.documentElement;

/* ---- used by the call code (mic / camera choices) ---- */
var FPS_OPTS=[["auto","Auto (let the camera decide)"],["10","10 fps (saves data)"],["12","12 fps"],["15","15 fps"],["20","20 fps"],["24","24 fps (default, cinema)"],["25","25 fps (PAL)"],["30","30 fps (smooth)"],["48","48 fps"],["50","50 fps"],["60","60 fps (very smooth)"],["90","90 fps"],["120","120 fps (needs a high-speed camera)"]];
window.PBM={
  audio:function(){ var o={echoCancellation:!!S.echo,noiseSuppression:!!S.noise,autoGainControl:!!S.agc}; if(S.mic) o.deviceId={ideal:S.mic}; return o; },
  video:function(){
    var h=+S.res||480, w=h>=720?Math.round(h*16/9):640;
    var o={width:{ideal:w},height:{ideal:h}}; if(S.fps!=="auto") o.frameRate={ideal:+S.fps||24};
    if(S.cam) o.deviceId={ideal:S.cam}; else o.facingMode="user";
    return o;
  }
};

/* ---- opening a camera reliably (front camera: black picture / "couldn't open") ----
   What went wrong before: the video element was never told to play or to be muted for sure (a muted attribute written through innerHTML is ignored
   by some phones, so autoplay silently refused = black picture); the first request asked for 1920x1080 + a frame rate, which many front cameras
   reject; a switch from rear to front started before the rear camera had been released (NotReadableError); a slow earlier request could land after
   a newer one and leave the preview black with the camera light still on; and any failure fell back to the phone's REAR-camera picker. */
(function(){
  function stopS(s){ try{ s && s.getTracks().forEach(function(t){ t.stop(); }); }catch(e){} }
  function wait(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function attach(v,st){
    try{ v.muted=true; v.defaultMuted=true; v.autoplay=true; v.playsInline=true; v.setAttribute("playsinline",""); v.setAttribute("muted",""); }catch(e){}
    try{ v.srcObject=null; }catch(e){}
    v.srcObject=st;
    var pr; try{ pr=v.play(); }catch(e){} if(pr&&pr.catch) pr.catch(function(){});
  }
  function frames(v,st,ms){
    return new Promise(function(res){
      var t0=Date.now(), tr=st.getVideoTracks()[0];
      (function chk(){
        var live=tr&&tr.readyState==="live";
        if(v.videoWidth>0&&v.readyState>=2&&live&&!tr.muted) return res(true);
        if(!live) return res(false);
        if(Date.now()-t0>ms) return res(v.videoWidth>0&&v.readyState>=2&&live);   /* a track that still says muted but shows frames is fine */
        if(v.paused){ try{ var p=v.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} }
        setTimeout(chk,100);
      })();
    });
  }
  function relaxed(want){
    var r={}; if(want&&want.deviceId) r.deviceId=want.deviceId;
    if(want&&want.facingMode){ var f=want.facingMode; r.facingMode={ideal:(typeof f==="string"?f:(f.ideal||f.exact||"user"))}; }
    return r;
  }
  /* want = video constraints, v = the <video> to show it in, live() = false once the caller has moved on (closed / newer request) */
  window.PBM.openCam=function(want,v,live){
    var md=navigator.mediaDevices; live=live||function(){return true;};
    var tries=[want||{}]; var rl=relaxed(want); if(Object.keys(rl).length) tries.push(rl); tries.push(true);
    var i=0, lastErr=null;
    function next(){
      if(!live()) return Promise.reject(new Error("cancelled"));
      if(i>=tries.length) return Promise.reject(lastErr||new Error("no camera"));
      var t=tries[i++], last=i>=tries.length;
      return md.getUserMedia({video:t}).then(function(st){
        if(!live()){ stopS(st); throw new Error("cancelled"); }
        attach(v,st);
        return frames(v,st,last?4000:2500).then(function(ok){
          if(!live()){ stopS(st); throw new Error("cancelled"); }
          if(ok||last) return st;                         /* the last try is never second-guessed: better a slow picture than none */
          stopS(st); try{ v.srcObject=null; }catch(e){} lastErr=new Error("black"); return wait(250).then(next);
        });
      },function(err){
        lastErr=err;
        if(err&&(err.name==="NotAllowedError"||err.name==="SecurityError")) throw err;    /* permission: retrying can't help */
        var delay=(err&&(err.name==="NotReadableError"||err.name==="AbortError"))?500:0;   /* the other camera is still being released */
        return wait(delay).then(next);
      });
    }
    return next();
  };
})();

/* ---- colour filters (SVG matrix) ---- */
var svgNS="http://www.w3.org/2000/svg";
var sv=document.createElementNS(svgNS,"svg"); sv.setAttribute("width","0"); sv.setAttribute("height","0"); sv.setAttribute("aria-hidden","true"); sv.style.cssText="position:absolute;pointer-events:none";
sv.innerHTML='<filter id="pb-cf" color-interpolation-filters="sRGB"><feColorMatrix id="pb-cm" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>';
document.body.appendChild(sv);
var SIM={prot:[.567,.433,0,.558,.442,0,0,.242,.758],deut:[.625,.375,0,.7,.3,0,0,.3,.7],trit:[.95,.05,0,0,.433,.567,0,.475,.525]};
var SHIFT={prot:[0,0,0,.7,1,0,.7,0,1],deut:[0,0,0,.7,1,0,.7,0,1],trit:[1,0,.7,0,1,.7,0,0,0]};
function hue2rgb(h){ h=((h%360)+360)%360/60; var x=1-Math.abs(h%2-1), r=0,g=0,b=0;
  if(h<1){r=1;g=x;}else if(h<2){r=x;g=1;}else if(h<3){g=1;b=x;}else if(h<4){g=x;b=1;}else if(h<5){r=x;b=1;}else{r=1;b=x;} return [r,g,b]; }
function matrix(){
  var k=S.cfk/100, m=[1,0,0,0,1,0,0,0,1], f=S.cf;
  if(f==="tint"){ var t=hue2rgb(+S.tint); m=[1-k*.6*(1-t[0]),0,0,0,1-k*.6*(1-t[1]),0,0,0,1-k*.6*(1-t[2])]; }
  else if(SIM[f]){
    var s=SIM[f], M=SHIFT[f], I=[1,0,0,0,1,0,0,0,1], E=I.map(function(v,i){return v-s[i];}), C=[];
    for(var r=0;r<3;r++)for(var c=0;c<3;c++){ var a=0; for(var j=0;j<3;j++) a+=M[r*3+j]*E[j*3+c]; C.push(I[r*3+c]+k*a); }
    m=C;
  }
  return m[0]+" "+m[1]+" "+m[2]+" 0 0 "+m[3]+" "+m[4]+" "+m[5]+" 0 0 "+m[6]+" "+m[7]+" "+m[8]+" 0 0 0 0 0 1 0";
}

/* ---- pointer ---- */
var ptrStyle=document.createElement("style"); ptrStyle.id="a11y-ptr"; document.head.appendChild(ptrStyle);
function pointer(){
  var px={large:36,xlarge:56}[S.ptr]; if(!px){ ptrStyle.textContent=""; return; }
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+Math.round(px*1.1)+'" viewBox="0 0 24 26"><path d="M2 2 L2 21 L7 16.5 L10.5 24.5 L14 23 L10.6 15.2 L17 15 Z" fill="'+S.ptrc+'" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  ptrStyle.textContent='html,html *{cursor:url("data:image/svg+xml,'+encodeURIComponent(svg)+'") 3 3,auto !important}';
}

/* ---- apply everything ---- */
function tog(c,on){ root.classList.toggle(c,!!on); }
function apply(){
  tog("a11y-bold",S.bold); tog("a11y-shapes",S.shapes); tog("a11y-onoff",S.onoff); tog("a11y-transp",S.transp);
  tog("a11y-contrast",S.contrast); tog("a11y-nocolor",S.nocolor); tog("a11y-rm",S.rm); tog("a11y-nomirror",!S.mirror);
  tog("a11y-ts",S.ts!==100); root.style.setProperty("--a11y-ts",S.ts/100);
  tog("a11y-smart",S.invert==="smart");
  window.__pbNoScare=!!S.noscare;
  var f=[];
  if(S.invert==="smart") f.push("invert(1) hue-rotate(180deg)"); else if(S.invert==="classic") f.push("invert(1)");
  if(S.cf==="gray") f.push("grayscale("+S.cfk/100+")");
  else if(S.cf!=="off"){ var cm=document.getElementById("pb-cm"); if(cm) cm.setAttribute("values",matrix()); f.push("url(#pb-cf)"); }
  if(S.wp>0) f.push("brightness("+(1-S.wp/100)+")");
  root.style.filter=f.join(" ");
  pointer();
}
apply();

/* ---- spoken content ---- */
var syn=window.speechSynthesis;
function speak(t,now){ if(!syn||!t) return; if(now) syn.cancel(); var u=new SpeechSynthesisUtterance(String(t).slice(0,600)); u.rate=+S.sp_rate||1;
  var v=syn.getVoices().filter(function(x){return x.voiceURI===S.sp_voice;})[0]; if(v) u.voice=v; syn.speak(u); }
var t0=Date.now(), burst=0, burstT=0;
function watchBox(){
  var box=document.getElementById("box"); if(!box) return;
  new MutationObserver(function(list){
    if(!S.sp_new||Date.now()-t0<4000) return;
    list.forEach(function(m){ m.addedNodes.forEach(function(n){
      if(!n.classList||!n.classList.contains("msg")||n.classList.contains("me")) return;
      clearTimeout(burstT); burst++; burstT=setTimeout(function(){burst=0;},400);
      if(burst>3) return;                       /* history loading, not a new message */
      var l=n.querySelector(".lbl"), b=n.querySelector(".bubble")||n;
      var txt=((l?l.textContent.replace(/[<>]/g,"")+" says ":"")+b.textContent).trim(); if(txt) speak(txt,false);
    }); });
  }).observe(box,{childList:true});
}
var spk=document.createElement("button"); spk.id="a11y-spk"; spk.type="button"; spk.textContent="🔊 Speak"; document.body.appendChild(spk);
spk.addEventListener("mousedown",function(e){e.preventDefault();});
spk.addEventListener("click",function(){ var s=String(window.getSelection()); if(s.trim()) speak(s,true); spk.style.display="none"; });
document.addEventListener("selectionchange",function(){
  if(!S.sp_sel){ spk.style.display="none"; return; }
  var sel=window.getSelection(); if(!sel||sel.isCollapsed||!String(sel).trim()){ spk.style.display="none"; return; }
  try{ var r=sel.getRangeAt(0).getBoundingClientRect(); spk.style.left=Math.max(6,Math.min(innerWidth-90,r.left))+"px"; spk.style.top=Math.max(6,r.top-38)+"px"; spk.style.display="block"; }catch(e){}
});
document.addEventListener("input",function(e){
  if(!S.sp_typ||!e.target||e.target.id!=="inp") return;
  if(e.data===" "){ var w=(e.target.value||e.target.textContent||"").trim().split(/\s+/).pop(); speak(w,true); }
  else if(e.data&&e.data.length===1) speak(e.data,true);
},true);

/* ---- magnifier (uses the camera) ---- */
function magnifier(){
  if(document.getElementById("a11y-mag")) return;
  if(!window.isSecureContext||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ alert("The magnifier needs the site opened over https (or localhost)."); return; }
  var ov=document.createElement("div"); ov.id="a11y-mag"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-label","Magnifier");
  ov.innerHTML='<div class="am-view"><video autoplay playsinline muted></video></div><div class="am-msg"></div>'+
   '<div class="am-bar"><button class="am-x" type="button">✕ Close</button>'+
   '<label>🔍 <input type="range" class="am-z" min="1" max="8" step="0.1" value="2"><b class="am-zv">2.0×</b></label>'+
   '<label>☀ <input type="range" class="am-b" min="50" max="200" value="100"></label>'+
   '<label>◐ <input type="range" class="am-c" min="50" max="300" value="100"></label>'+
   '<select class="am-f"><option value="">Normal</option><option value="invert(1)">Invert</option><option value="grayscale(1) contrast(1.6)">Grayscale</option><option value="grayscale(1) contrast(3) brightness(1.1)">High contrast</option><option value="grayscale(1) contrast(3) invert(1)">White on black</option><option value="sepia(1) saturate(4) hue-rotate(-20deg) contrast(1.6)">Yellow</option></select>'+
   '<button class="am-fz" type="button">⏸ Freeze</button><button class="am-t" type="button" hidden>🔦 Light</button></div>';
  document.body.appendChild(ov);
  var q=function(s){return ov.querySelector(s);}, v=q("video"), msg=q(".am-msg"), stream=null, track=null, hw=false, torch=false;
  function paint(){ var z=+q(".am-z").value; q(".am-zv").textContent=z.toFixed(1)+"×";
    var capZ=hw&&track.getCapabilities().zoom; if(capZ){ try{ track.applyConstraints({advanced:[{zoom:Math.min(capZ.max,Math.max(capZ.min,z))}]}); }catch(e){} v.style.transform=""; } else v.style.transform="scale("+z+")";
    v.style.filter=(q(".am-f").value+" brightness("+q(".am-b").value/100+") contrast("+q(".am-c").value/100+")").trim(); }
  ["input","change"].forEach(function(ev){ ov.addEventListener(ev,paint); });
  function close(){ if(stream) stream.getTracks().forEach(function(t){t.stop();}); ov.remove(); document.removeEventListener("keydown",esc); }
  function esc(e){ if(e.key==="Escape") close(); }
  document.addEventListener("keydown",esc); q(".am-x").onclick=close;
  q(".am-fz").onclick=function(){ if(v.paused){ v.play(); this.textContent="⏸ Freeze"; } else { v.pause(); this.textContent="▶ Resume"; } };
  q(".am-t").onclick=function(){ torch=!torch; try{ track.applyConstraints({advanced:[{torch:torch}]}); }catch(e){} };
  var vid={width:{ideal:1920},height:{ideal:1080}}; if(S.cam) vid.deviceId={ideal:S.cam}; else vid.facingMode={ideal:"environment"};
  window.PBM.openCam(vid,v,function(){ return !!ov.isConnected; }).then(function(s){
    stream=s; track=s.getVideoTracks()[0];
    var cap=track.getCapabilities?track.getCapabilities():{}; hw=!!cap.zoom; if(cap.torch) q(".am-t").hidden=false; paint();
  }).catch(function(){ msg.textContent="Couldn't open the camera. Check that it is allowed for this site."; });
}

/* ---- settings cards ---- */
function card(title,html){ var c=document.createElement("div"); c.className="stg-card"; c.dataset.a11y="1"; c.innerHTML="<h3>"+title+"</h3>"+html; return c; }
function chk(k,t){ return '<label class="chk"><input type="checkbox" data-k="'+k+'">'+t+'</label>'; }
function rng(k,t,min,max,step,u){ return '<label>'+t+' <b data-v="'+k+'" data-u="'+u+'"></b></label><input type="range" data-k="'+k+'" min="'+min+'" max="'+max+'" step="'+step+'">'; }
function sel(k,t,opts){ return '<label>'+t+'</label><select data-k="'+k+'">'+opts.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>';}).join("")+'</select>'; }
var scroll=document.querySelector(".stg-scroll"); if(!scroll) return;
var cards=[
 card("♿ Accessibility",'<div class="stg-note">Vision, spoken content, motion, pointer, magnifier, camera and microphone. These apply right away and are saved on this device (no need to press Save changes).</div><div class="stg-row"><button type="button" class="btn alt" id="a11y-reset">Reset accessibility settings</button></div>'),
 card("🗣 Spoken Content",
   chk("sp_new","Speak new messages aloud")+chk("sp_sel","Speak Selection (shows a Speak button when you select text)")+chk("sp_typ","Speak Typing (letters and words as you type)")+
   '<label>Voice</label><select data-k="sp_voice" id="a11y-voice"><option value="">Default</option></select>'+rng("sp_rate","Speaking rate",0.5,2,0.1,"×")+
   '<div class="stg-row"><button type="button" class="btn" id="a11y-say">Test voice</button><button type="button" class="btn alt" id="a11y-hush">Stop speaking</button></div>'),
 card("🔠 Display &amp; Text Size",
   chk("bold","Bold Text")+rng("ts","Larger Text (messages)",100,250,10,"%")+chk("shapes","Button Shapes")+chk("onoff","On/Off Labels")+
   chk("transp","Reduce Transparency")+chk("contrast","Increase Contrast")+chk("nocolor","Differentiate Without Color")+
   sel("invert","Invert Colors",[["off","Off"],["smart","Smart Invert (keeps photos normal)"],["classic","Classic Invert"]])+
   sel("cf","Color Filters",[["off","Off"],["gray","Grayscale"],["prot","Red/Green Filter (Protanopia)"],["deut","Green/Red Filter (Deuteranopia)"],["trit","Blue/Yellow Filter (Tritanopia)"],["tint","Color Tint"]])+
   rng("cfk","Filter intensity",0,100,5,"%")+rng("tint","Tint hue",0,360,5,"°")+rng("wp","Reduce White Point",0,75,5,"%")),
 card("🏃 Motion",chk("rm","Reduce Motion (stops slides, bounces and other animations)")+chk("noscare","Block jumpscares and flashing screens")),
 card("🖱 Pointer",sel("ptr","Pointer size",[["normal","Normal"],["large","Large"],["xlarge","Extra large"]])+'<label>Pointer color</label><input type="color" data-k="ptrc">'),
 (function(){ var c=card("🎞 Frame Rate",'<div class="stg-note">How many frames per second your camera sends (calls, camera tests). Higher is smoother but uses more data and battery. If your camera can\'t do the rate you pick, it uses the closest one it supports.</div>'+sel("fps","Camera frame rate",FPS_OPTS)); delete c.dataset.a11y; c.dataset.pbcat="appearance"; c.dataset.fpscard="1"; return c; })(),
 card("🔍 Magnifier",'<div class="stg-note">Use your camera as a magnifying glass: zoom, freeze, brightness, contrast, color filters and the light if your phone has one.</div><div class="stg-row"><button type="button" class="btn" id="a11y-mag-open">Open Magnifier</button></div>'),
 card("🎥 Camera &amp; Microphone",
   '<div class="stg-note" id="a11y-perm">Checking permissions…</div><div class="stg-row"><button type="button" class="btn" id="a11y-allow">Allow camera &amp; microphone</button></div>'+
   '<label>Camera</label><select data-k="cam" id="a11y-cam"><option value="">Default</option></select>'+
   sel("res","Video quality",[["360","360p"],["480","480p (default)"],["720","720p HD"],["1080","1080p Full HD"]])+
   chk("mirror","Mirror my own video (like a selfie)")+
   '<label>Microphone</label><select data-k="mic" id="a11y-mic"><option value="">Default</option></select>'+
   chk("echo","Echo cancellation")+chk("noise","Noise suppression")+chk("agc","Automatic volume (auto gain)")+
   '<label id="a11y-spk-l">Speaker</label><select data-k="spk" id="a11y-spk-s"><option value="">Default</option></select>'+
   '<label>Test</label><div class="stg-row"><button type="button" class="btn" id="a11y-tcam">Test camera</button><button type="button" class="btn" id="a11y-tmic">Test microphone</button><button type="button" class="btn" id="a11y-tspk">Test speaker</button></div>'+
   '<video id="a11y-cprev" autoplay playsinline muted></video><div class="stg-note" id="a11y-cinfo"></div><div class="a11y-meter"><i id="a11y-lvl"></i></div>'+
   chk("a11y_mon","Hear myself while testing the microphone (use headphones!)")+
   '<div class="stg-note">Calls use these choices the next time you start or join one. Inside a call you can still switch microphone from the top bar.</div>')
];
cards.forEach(function(c){ scroll.appendChild(c); });
var $=function(i){return document.getElementById(i);};

function refreshUI(){
  document.querySelectorAll("[data-k]").forEach(function(el){
    var k=el.dataset.k; if(!(k in S)) return;
    if(el.type==="checkbox") el.checked=!!S[k]; else el.value=S[k];
  });
  document.querySelectorAll("[data-v]").forEach(function(b){ b.textContent=S[b.dataset.v]+b.dataset.u; });
}
refreshUI();
document.addEventListener("input",function(e){
  var el=e.target; if(!el||!el.dataset||!el.dataset.k||!(el.dataset.k in S)) return;
  var k=el.dataset.k, v=el.type==="checkbox"?(el.checked?1:0):(typeof D[k]==="number"&&el.type==="range"?+el.value:el.value);
  if(typeof D[k]==="number"&&el.type!=="range"&&el.type!=="checkbox") v=+el.value;
  S[k]=v; persist(); apply(); refreshUI();
  if(k==="spk") applySink();
});
document.addEventListener("change",function(e){ if(e.target&&e.target.dataset&&e.target.dataset.k) e.target.dispatchEvent(new Event("input",{bubbles:true})); });
$("a11y-reset").onclick=function(){ if(!confirm("Reset all accessibility settings?")) return; S=Object.assign({},D); persist(); apply(); refreshUI(); };
$("a11y-mag-open").onclick=magnifier;
$("a11y-say").onclick=function(){ speak("This is how I will sound when I read your messages.",true); };
$("a11y-hush").onclick=function(){ if(syn) syn.cancel(); };

/* voices */
function fillVoices(){
  if(!syn) return; var s=$("a11y-voice"), vs=syn.getVoices(); if(!s||!vs.length) return;
  s.innerHTML='<option value="">Default</option>'+vs.map(function(v){return '<option value="'+v.voiceURI.replace(/"/g,"&quot;")+'">'+v.name+" ("+v.lang+")</option>";}).join("");
  s.value=S.sp_voice;
}
if(syn){ fillVoices(); syn.onvoiceschanged=fillVoices; } else { $("a11y-voice").disabled=true; }

/* devices */
var MD=navigator.mediaDevices;
function fillDevices(){
  if(!MD||!MD.enumerateDevices) return;
  MD.enumerateDevices().then(function(devs){
    function fill(id,kind,label){ var s=$(id); if(!s) return; var n=0;
      s.innerHTML='<option value="">Default</option>'+devs.filter(function(d){return d.kind===kind;}).map(function(d){ n++; return '<option value="'+d.deviceId+'">'+(d.label||label+" "+n)+"</option>"; }).join("");
      s.value=S[s.dataset.k]; if(s.value!==S[s.dataset.k]){ s.value=""; } }
    fill("a11y-cam","videoinput","Camera"); fill("a11y-mic","audioinput","Microphone"); fill("a11y-spk-s","audiooutput","Speaker");
    var hasSink=("setSinkId" in HTMLMediaElement.prototype); $("a11y-spk-s").hidden=!hasSink; $("a11y-spk-l").hidden=!hasSink; $("a11y-tspk").hidden=false;
  }).catch(function(){});
}
function perms(){
  var el=$("a11y-perm"), out=[]; if(!navigator.permissions||!navigator.permissions.query){ el.textContent="Press the button below to let the site use your camera and microphone."; return; }
  Promise.all(["camera","microphone"].map(function(n){ return navigator.permissions.query({name:n}).then(function(p){ p.onchange=perms; return n+": "+({granted:"allowed",denied:"blocked",prompt:"not asked yet"}[p.state]||p.state); }).catch(function(){ return null; }); }))
   .then(function(r){ r=r.filter(Boolean); el.textContent=r.length?"Permissions — "+r.join(" · ")+(r.join().indexOf("blocked")>-1?". Blocked? Click the lock icon in the address bar to allow it.":""):"Press the button below to let the site use your camera and microphone."; });
}
$("a11y-allow").onclick=function(){
  if(!MD){ alert("This browser can't use the camera or microphone here (needs https)."); return; }
  MD.getUserMedia({audio:true,video:true}).then(function(s){ s.getTracks().forEach(function(t){t.stop();}); }).catch(function(){
    return MD.getUserMedia({audio:true}).then(function(s){s.getTracks().forEach(function(t){t.stop();});}).catch(function(){});
  }).then(function(){ fillDevices(); perms(); });
};
if(MD&&MD.addEventListener) MD.addEventListener("devicechange",fillDevices);
fillDevices(); perms();

/* speaker routing for calls */
function applySink(){
}

/* tests */
var camTok=0, camS=null, micS=null, micCtx=null, raf=0;
function stopCam(){ camTok++; if(camS){ camS.getTracks().forEach(function(t){t.stop();}); camS=null; } var p=$("a11y-cprev"); p.classList.remove("on"); p.srcObject=null; $("a11y-cinfo").textContent=""; $("a11y-tcam").textContent="Test camera"; }
function stopMic(){ cancelAnimationFrame(raf); if(micS){ micS.getTracks().forEach(function(t){t.stop();}); micS=null; } if(micCtx){ try{micCtx.close();}catch(e){} micCtx=null; } $("a11y-lvl").style.width="0"; $("a11y-tmic").textContent="Test microphone"; }
$("a11y-tcam").onclick=function(){
  if(camS){ stopCam(); return; }
  if(!MD){ alert("Needs https."); return; }
  var ct=++camTok;
  window.PBM.openCam(window.PBM.video(),$("a11y-cprev"),function(){ return ct===camTok; }).then(function(s){
    camS=s; var p=$("a11y-cprev"); p.classList.add("on"); $("a11y-tcam").textContent="Stop camera test";
    var st=s.getVideoTracks()[0].getSettings(); $("a11y-cinfo").textContent=(s.getVideoTracks()[0].label||"Camera")+" — "+(st.width||"?")+"×"+(st.height||"?")+" @ "+Math.round(st.frameRate||0)+" fps";
    fillDevices(); perms();
  }).catch(function(e){ if(e&&e.message==="cancelled") return; $("a11y-cinfo").textContent="Couldn't open that camera. Is it allowed and not used by another app?"; });
};
$("a11y-tmic").onclick=function(){
  if(micS){ stopMic(); return; }
  if(!MD){ alert("Needs https."); return; }
  MD.getUserMedia({audio:window.PBM.audio()}).then(function(s){
    micS=s; var AC=window.AudioContext||window.webkitAudioContext; micCtx=new AC(); var src=micCtx.createMediaStreamSource(s), an=micCtx.createAnalyser(); an.fftSize=512; src.connect(an);
    if(S.a11y_mon) src.connect(micCtx.destination);
    var buf=new Uint8Array(an.fftSize); $("a11y-tmic").textContent="Stop microphone test";
    (function tick(){ an.getByteTimeDomainData(buf); var m=0; for(var i=0;i<buf.length;i++){ var x=Math.abs(buf[i]-128)/128; if(x>m)m=x; } $("a11y-lvl").style.width=Math.min(100,m*140)+"%"; raf=requestAnimationFrame(tick); })();
    $("a11y-cinfo").textContent="Listening to: "+(s.getAudioTracks()[0].label||"microphone")+" — speak and watch the bar."; fillDevices(); perms();
  }).catch(function(){ $("a11y-cinfo").textContent="Couldn't open that microphone."; });
};
$("a11y-tspk").onclick=function(){
  var sr=22050, n=Math.floor(sr*.7), b=new DataView(new ArrayBuffer(44+n*2)), w=function(o,s){for(var i=0;i<s.length;i++)b.setUint8(o+i,s.charCodeAt(i));};
  w(0,"RIFF"); b.setUint32(4,36+n*2,true); w(8,"WAVEfmt "); b.setUint32(16,16,true); b.setUint16(20,1,true); b.setUint16(22,1,true); b.setUint32(24,sr,true); b.setUint32(28,sr*2,true); b.setUint16(32,2,true); b.setUint16(34,16,true); w(36,"data"); b.setUint32(40,n*2,true);
  for(var i=0;i<n;i++){ var f=i<n/2?523:659, env=Math.min(1,i/400,(n-i)/400); b.setInt16(44+i*2,Math.sin(2*Math.PI*f*i/sr)*9000*env,true); }
  var a=new Audio(URL.createObjectURL(new Blob([b.buffer],{type:"audio/wav"})));
  var go=function(){ a.play().catch(function(){}); };
  if(a.setSinkId) a.setSinkId(S.spk||"").then(go,go); else go();
};
new MutationObserver(function(){ var st=$("stg"); if(st&&!st.classList.contains("open")){ stopCam(); stopMic(); } }).observe($("stg"),{attributes:true,attributeFilter:["class"]});

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",watchBox); else watchBox();
})();

;
/* ===== 43-games-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const LS = "pb_games", LSM = "pb_games_mode", MAX = 300, MAX_HTML = 900000;   // uploaded HTML games: up to ~900 KB of code each

  /* ---------------- 1. Settings: chats & people (mirrors the hidden sidebar) + the options that used to be in it ---------------- */
  const closeSettings = () => { try{ if(typeof setStg === "function") setStg(false); }catch(e){} };
  document.querySelectorAll(".mir[data-src]").forEach(dst => {
    const src = $$(dst.dataset.src); if(!src) return;
    let t = 0;
    const copy = () => { t = 0; if(document.body.classList.contains("hide-sb")) dst.innerHTML = src.innerHTML; };
    const sched = () => { if(!t) t = setTimeout(copy, 120); };
    new MutationObserver(sched).observe(src, { childList: true, subtree: true, attributes: true, characterData: true });
    new MutationObserver(sched).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    copy();
    /* a click on the copy is replayed on the real row (same position in the tree) */
    dst.addEventListener("click", e => {
      const path = []; let n = e.target;
      while(n && n !== dst){ const p = n.parentNode; if(!p) return; path.unshift(Array.prototype.indexOf.call(p.children, n)); n = p; }
      if(n !== dst) return;
      let el = src; for(const i of path){ el = el && el.children[i]; }
      if(!el || el === src) return;
      const row = e.target.closest(".prow"), isBtn = !!e.target.closest("button");
      el.click();
      if(row && !isBtn) closeSettings();
      else if(e.target.closest(".sbh button")) closeSettings();     // “＋ Group” opens its own window
    });
  });
  const slot = $$("tools-slot"), sbx = document.querySelector(".stg-sb");
  if(slot && sbx){
    const pull = () => Array.prototype.slice.call(sbx.children).forEach(el => {
      if(el.id === "stg-toggle" || el.id === "opts-btn") return;
      if(el.id === "admbtn" || el.id === "modbtn"){ const st = $$("hdr-staff"); if(st) st.appendChild(el); return; }
      if(el.matches(".stg-btn,.goback,#youare")) slot.appendChild(el);
    });
    new MutationObserver(pull).observe(sbx, { childList: true });
    const st = document.createElement("span"); st.id = "hdr-staff"; const gear = $$("hdr-set"); if(gear) gear.before(st); else $$("hdr").appendChild(st);
    pull();
    slot.addEventListener("click", e => { if(e.target.closest("#cl-open")) setTimeout(closeSettings, 0); });
  }

  /* ---------------- 2. Games tab ---------------- */
  const CATS = ["Action","Racing","Strategy","Sports","Skill","Shooting","2 Player","Io","Puzzle","Arcade"];
  let catSel = "";        // "" = All (rows); otherwise one category as a grid
  let games = [];
  try{ const a = JSON.parse(localStorage.getItem(LS) || "[]"); if(Array.isArray(a)) games = a.filter(g => g && typeof g.id === "string" && typeof g.name === "string" && typeof g.url === "string").slice(0, MAX); }catch(e){}
  let mode = "default"; try{ const m = localStorage.getItem(LSM); if(["default","az","fav","plays"].includes(m)) mode = m; }catch(e){}
  let q = "", editId = null, draftIcon = "";
  let tombs = {}; try{ const t = JSON.parse(localStorage.getItem("pb_games_del") || "{}"); if(t && typeof t === "object") tombs = t; }catch(e){}
  games.forEach(g => { if(!g.v) g.v = g.added || 1; });
  const persist = () => {
    let ok = false;
    ok = window.__pbSet(LS, JSON.stringify(games));
    try{ localStorage.setItem("pb_games_del", JSON.stringify(tombs)); }catch(e){}
    try{ if(window.__gmChanged) window.__gmChanged(); }catch(e){}
    return ok;
  };
  const newId = () => "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  const cleanUrl = s => {
    s = String(s || "").trim(); if(!s) return "";
    if(!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    try{ const u = new URL(s); return (u.protocol === "https:" || u.protocol === "http:") ? u.href : ""; }catch(e){ return ""; }
  };
  const okIcon = s => typeof s === "string" && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(s) && s.length < 400000;
  const siteIcon = url => "https://www.google.com/s2/favicons?sz=128&domain_url=" + encodeURIComponent(url);
  const tileColor = n => { try{ if(typeof colorFor === "function") return colorFor(n); }catch(e){} return "#6d5bd0"; };

  /* tab, sidebar row and view */
  const row = document.createElement("div"); row.className = "row-ch"; row.id = "ch-games";
  row.innerHTML = '<div class="av-sb" style="font-size:18px">🎮</div><div><b style="font-size:15px">Games &amp; Media</b><br><span class="csub">Games, proxies, media &amp; music</span></div>';
  const oldRow = $$("ch-games"); if(oldRow) oldRow.replaceWith(row); else (($$("ch-polls") || $$("ch-gal")).after(row));
  row.onclick = () => setChannel("games");
  const tab = document.createElement("button"); tab.type = "button"; tab.dataset.ch = "games"; tab.textContent = "🎮 Games & Media"; tab.onclick = () => setChannel("games");
  $$("chtabs").appendChild(tab);

  const view = document.createElement("div"); view.id = "games";
  view.innerHTML =
    '<div class="gm-bar">' +
      '<button type="button" class="gm-title gm-sub on" data-sub="games" title="Games">🎮 Games <small id="gm-count"></small></button><button type="button" class="gm-title gm-sub" data-sub="proxy" title="Proxy links">🌐 Proxy</button><button type="button" class="gm-title gm-sub" data-sub="media" title="Movies, shows &amp; websites">🎬 Media</button><button type="button" class="gm-title gm-sub" data-sub="music" title="Music websites">🎵 Music</button>' +
      '<div class="gm-sw"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="gm-search" id="gm-q" type="search" placeholder="Search games" autocomplete="off" aria-label="Search games"></div>' +
      '<div class="gm-chips" id="gm-chips"><button type="button" class="gm-chip" data-m="default">Default</button><button type="button" class="gm-chip" data-m="az">A–Z</button><button type="button" class="gm-chip" data-m="fav">★ Favorites</button><button type="button" class="gm-chip" data-m="plays">Played</button></div>' +
      '<button type="button" class="gm-plus" id="gm-add" title="Add a game" aria-label="Add a game">+</button>' +
      '<div class="gm-cats" id="gm-cats"></div>' +
    '</div>' +
    '<div class="gm-scroll"><div class="gm-grid" id="gm-grid"></div></div>';
  $$("box").after(view);

  const grid = $$("gm-grid");
  function visible(){
    let l = games.slice(); const s = q.trim().toLowerCase();
    if(s) l = l.filter(g => g.name.toLowerCase().includes(s));
    if(catSel) l = l.filter(g => g.cat === catSel);
    if(mode === "fav") l = l.filter(g => g.fav);
    if(mode === "az") l.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    else if(mode === "plays") l = l.filter(g => g.plays).sort((a, b) => (b.plays || 0) - (a.plays || 0));
    return l;
  }
  function iconNode(g, big){
    const box = document.createElement("div"); box.className = big ? "gm-prev" : "gm-ic";
    const name = g.name || "?", url = g.url || "";
    const letter = () => { box.querySelectorAll("img").forEach(i => i.remove()); box.classList.add("gm-lt"); box.style.background = tileColor(name); box.insertBefore(document.createTextNode((name.trim()[0] || "?").toUpperCase()), box.firstChild); };   // keeps the ★ / ✎ buttons and badges that were added to the tile
    if(okIcon(g.icon)){ const im = new Image(); im.alt = ""; im.src = g.icon; box.appendChild(im); }
    else if(url){
      const im = new Image(); im.alt = ""; im.className = "site"; im.referrerPolicy = "no-referrer"; im.src = siteIcon(url);
      im.onerror = letter; box.appendChild(im);
    } else letter();
    return box;
  }
  /* uploaded HTML games: nothing is downloaded until someone presses play, and the frame is destroyed when they leave */
  const canManage = g => g.k !== "h" || (typeof uid !== "undefined" && g.by === uid) || !!(window.__pbIsMod && window.__pbIsMod());
  let playEl = null, playTok = 0;
  const SHIM = '<script>(function(){function m(){var d={};return{getItem:function(k){return k in d?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].getItem("x")}catch(e){try{Object.defineProperty(window,n,{value:m(),configurable:true})}catch(e2){}}})})();<\/script>';
  function withShim(h){
    if(/<head[^>]*>/i.test(h)) return h.replace(/<head[^>]*>/i, m => m + SHIM);
    if(/<html[^>]*>/i.test(h)) return h.replace(/<html[^>]*>/i, m => m + SHIM);
    return SHIM + h;
  }
  function closePlay(){
    playTok++;
    if(!playEl) return;
    const f = playEl.querySelector("iframe"); if(f){ f.srcdoc = ""; f.remove(); }   // frees the game's memory and stops it running
    playEl.classList.remove("on");
    document.removeEventListener("keydown", playKey, true);
  }
  function playKey(e){ if(e.key === "Escape" && !document.fullscreenElement){ e.stopPropagation(); closePlay(); } }
  async function playHtml(g){
    if(!playEl){
      playEl = document.createElement("div"); playEl.id = "gm-play";
      playEl.innerHTML = '<div class="gp-bar"><button type="button" class="gp-x">← Back</button><b class="gp-t"></b><button type="button" class="gp-fs" title="Fullscreen">⛶</button></div><div class="gp-msg"></div>';
      document.body.appendChild(playEl);
      playEl.querySelector(".gp-x").onclick = closePlay;
      playEl.querySelector(".gp-fs").onclick = () => { const f = playEl.querySelector("iframe"); if(f && f.requestFullscreen) f.requestFullscreen().catch(() => {}); };
    }
    const old = playEl.querySelector("iframe"); if(old) old.remove();
    const msg = playEl.querySelector(".gp-msg"); msg.style.display = ""; msg.textContent = "Loading " + g.name + "…";
    playEl.querySelector(".gp-t").textContent = g.name;
    playEl.classList.add("on"); document.addEventListener("keydown", playKey, true);
    const tok = ++playTok;
    try{
      if(!window.__gmCode) throw new Error("no cloud");
      const html = await window.__gmCode.get(g.id, g.cv);
      if(tok !== playTok) return;
      const f = document.createElement("iframe");
      f.setAttribute("sandbox", "allow-scripts allow-pointer-lock allow-forms allow-modals");   // no same-origin: the game can't touch the chat, logins or storage
      f.setAttribute("allow", "fullscreen; autoplay; gamepad"); f.referrerPolicy = "no-referrer";
      f.srcdoc = withShim(html);
      playEl.appendChild(f); msg.style.display = "none"; f.focus();
    }catch(e){ if(tok === playTok) msg.textContent = "Couldn't load this game. Check your connection and try again."; }
  }
  function openGame(g){
    if(g.k === "h"){ g.plays = (g.plays || 0) + 1; g.last = Date.now(); persist(); playHtml(g); return; }
    window.open(g.url, "_blank", "noopener,noreferrer");
    g.plays = (g.plays || 0) + 1; g.last = Date.now(); persist();
    render();
  }
  function cardFor(g){
    const c = document.createElement("div"); c.className = "gm-card"; c.tabIndex = 0; c.setAttribute("role", "link"); c.setAttribute("aria-label", "Open " + g.name); c.title = g.name;
    const ic = iconNode(g, false);
    const star = document.createElement("button"); star.type = "button"; star.className = "gm-star";
    const paint = () => { star.textContent = g.fav ? "★" : "☆"; star.setAttribute("aria-pressed", g.fav ? "true" : "false"); star.title = g.fav ? "Remove from favorites" : "Add to favorites"; };
    paint();
    star.onclick = e => { e.stopPropagation(); g.fav = g.fav ? 0 : 1; persist(); render(); };
    const ed = document.createElement("button"); ed.type = "button"; ed.className = "gm-edit"; ed.textContent = "✎"; ed.title = "Edit or delete this game"; ed.setAttribute("aria-label", "Edit " + g.name);
    ed.onclick = e => { e.stopPropagation(); openModal(g); };
    if(canManage(g)) ic.append(ed, star); else ic.append(star);
    if(g.k === "h"){ const hb = document.createElement("span"); hb.className = "gm-hb"; hb.textContent = "📄 HTML"; ic.appendChild(hb); }
    const nm = document.createElement("div"); nm.className = "gm-nm"; nm.textContent = g.name;
    c.append(ic, nm);
    c.onclick = () => openGame(g);
    c.onkeydown = e => { if(e.target === c && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); openGame(g); } };
    return c;
  }
  function renderCats(){
    const box = $$("gm-cats"), have = {};
    games.forEach(g => { if(g.cat) have[g.cat] = 1; });
    const names = ["All"].concat(CATS.filter(c => have[c]));
    if(catSel && !have[catSel]) catSel = "";
    box.replaceChildren.apply(box, names.map(n => {
      const b = document.createElement("button"); b.type = "button"; b.className = "gm-chip" + ((n === "All" ? "" : n) === catSel ? " on" : ""); b.dataset.c = n === "All" ? "" : n; b.textContent = n; return b;
    }));
    box.style.display = names.length > 1 ? "" : "none";
  }
  function render(){
    $$("gm-count").textContent = games.length ? "· " + games.length : "";
    renderCats();
    document.querySelectorAll("#gm-chips .gm-chip").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
    const s = q.trim();
    grid.style.display = "";
    if(!games.length){
      const n = document.createElement("div"); n.className = "gm-none gm-empty";
      n.innerHTML = '<div style="font-size:54px">🎮</div><div>No games yet</div><button type="button" class="gm-b pri">+ Add a game link</button>';
      n.querySelector("button").onclick = () => openModal(null);
      grid.replaceChildren(n); return;
    }
    const l = visible(), kids = l.map(cardFor);                    // every game in one grid, several per row
    if(!l.length){
      const n = document.createElement("div"); n.className = "gm-none";
      n.textContent = s ? "No games match your search." : mode === "fav" ? "No favorites yet. Tap the ☆ on a game." : mode === "plays" ? "No games played yet." : "Nothing in this category yet.";
      kids.push(n);
    }
    grid.replaceChildren.apply(grid, kids);
  }
  $$("gm-q").addEventListener("input", e => { q = e.target.value; render(); });
  $$("gm-chips").addEventListener("click", e => {
    const b = e.target.closest(".gm-chip"); if(!b) return;
    mode = b.dataset.m; try{ localStorage.setItem(LSM, mode); }catch(err){} render();
  });
  $$("gm-add").onclick = () => openModal(null);
  $$("gm-cats").addEventListener("click", e => {
    const b = e.target.closest(".gm-chip"); if(!b) return;
    catSel = b.dataset.c || ""; render();
  });

  /* add / edit window */
  const modal = document.createElement("div"); modal.id = "gm-modal";
  modal.innerHTML =
    '<div class="gm-box" role="dialog" aria-modal="true" aria-labelledby="gm-mt"><h3 id="gm-mt">Add a game</h3>' +
      '<label>Game name<input id="gm-name" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Slope"></label>' +
      '<label>Category<select id="gm-cat"><option value="">None</option>' + CATS.map(c => '<option value="' + c + '">' + c + '</option>').join("") + '</select></label>' +
      '<div class="gm-kind" id="gm-kind"><button type="button" data-k="l" class="on">🔗 Link</button><button type="button" data-k="h">📄 HTML game</button></div>' +
      '<label id="gm-linkrow">Game link<input id="gm-url" type="text" inputmode="url" maxlength="600" autocomplete="off" spellcheck="false" placeholder="https://…"></label>' +
      '<div id="gm-htmlrow" style="display:none"><label>Game code<textarea id="gm-html" spellcheck="false" autocomplete="off" placeholder="Paste your game\'s HTML here…"></textarea></label><div class="gm-icbtns" style="margin-top:8px"><button type="button" id="gm-hpick" class="gm-b alt">📂 Choose .html file</button></div><div id="gm-hinfo" class="gm-note"></div><input id="gm-hfile" type="file" accept=".html,.htm,text/html" hidden></div>' +
      '<div class="gm-icrow"><div id="gm-prevwrap"></div><div class="gm-icbtns"><button type="button" id="gm-pick" class="gm-b alt">Choose icon</button><button type="button" id="gm-rm" class="gm-b alt">Use the site’s icon</button></div><input id="gm-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div>' +
      '<div id="gm-err" role="alert"></div>' +
      '<div class="gm-foot"><button type="button" id="gm-del" class="gm-b red">Delete</button><span class="gm-spacer"></span><button type="button" id="gm-cancel" class="gm-b alt">Cancel</button><button type="button" id="gm-save" class="gm-b pri">Save</button></div>' +
    '</div>';
  document.body.appendChild(modal);
  const err = t => { $$("gm-err").textContent = t || ""; };
  function paintPrev(){
    const url = cleanUrl($$("gm-url").value), name = cleanName($$("gm-name").value) || "?";
    $$("gm-prevwrap").replaceChildren(iconNode({ name, url, icon: draftIcon }, true));
    $$("gm-rm").style.display = draftIcon ? "" : "none";
  }
  let delArmed = 0, kind = "l";
  function setKind(k, locked){
    kind = k;
    document.querySelectorAll("#gm-kind button").forEach(b => b.classList.toggle("on", b.dataset.k === k));
    $$("gm-kind").style.display = locked ? "none" : "";
    $$("gm-linkrow").style.display = k === "l" ? "" : "none";
    $$("gm-htmlrow").style.display = k === "h" ? "" : "none";
  }
  $$("gm-kind").addEventListener("click", e => { const b = e.target.closest("button"); if(b) setKind(b.dataset.k, false); });
  const htmlInfo = () => { const n = $$("gm-html").value.length; $$("gm-hinfo").textContent = n ? Math.round(n / 1024) + " KB of code" + (n > MAX_HTML ? " — too big (max " + Math.round(MAX_HTML / 1024) + " KB)" : "") : (editId ? "Leave this empty to keep the current game code." : "Paste code or choose a file. It only loads when someone plays it."); };
  $$("gm-html").addEventListener("input", htmlInfo);
  $$("gm-hpick").onclick = () => $$("gm-hfile").click();
  $$("gm-hfile").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if(!f) return;
    if(f.size > MAX_HTML){ err("That file is too big (max " + Math.round(MAX_HTML / 1024) + " KB)."); return; }
    const fr = new FileReader(); fr.onerror = () => err("Couldn’t read that file.");
    fr.onload = () => { $$("gm-html").value = String(fr.result || ""); if(!$$("gm-name").value.trim()) $$("gm-name").value = cleanName(f.name.replace(/\.html?$/i, "")); err(""); htmlInfo(); paintPrev(); };
    fr.readAsText(f);
  });
  function openModal(g){
    editId = g ? g.id : null; draftIcon = g && okIcon(g.icon) ? g.icon : ""; delArmed = 0;
    $$("gm-html").value = ""; setKind(g && g.k === "h" ? "h" : "l", !!g); htmlInfo();
    $$("gm-mt").textContent = g ? "Edit game" : "Add a game";
    $$("gm-name").value = g ? g.name : ""; $$("gm-cat").value = g && CATS.includes(g.cat) ? g.cat : ""; $$("gm-url").value = g && g.k !== "h" ? g.url : "";
    $$("gm-del").style.display = g ? "" : "none"; $$("gm-del").textContent = "Delete";
    err(""); paintPrev(); modal.classList.add("on");
    setTimeout(() => $$("gm-name").focus(), 30);
  }
  const closeModal = () => modal.classList.remove("on");
  $$("gm-name").addEventListener("input", paintPrev);
  $$("gm-url").addEventListener("input", paintPrev);
  $$("gm-pick").onclick = () => $$("gm-file").click();
  $$("gm-rm").onclick = () => { draftIcon = ""; paintPrev(); };
  $$("gm-file").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if(!f) return;
    if(!/^image\/(png|jpe?g|webp|gif)$/i.test(f.type)){ err("Pick a PNG, JPG, WEBP or GIF picture."); return; }
    const fr = new FileReader();
    fr.onerror = () => err("Couldn’t read that picture.");
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => err("Couldn’t read that picture.");
      im.onload = () => {
        const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, S, S);
        const r = Math.max(S / im.width, S / im.height), w = im.width * r, h = im.height * r;
        x.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
        try{ draftIcon = c.toDataURL("image/jpeg", .85); err(""); paintPrev(); }catch(ex){ err("Couldn’t use that picture."); }
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(f);
  });
  $$("gm-cancel").onclick = closeModal;
  modal.addEventListener("mousedown", e => { if(e.target === modal) closeModal(); });
  $$("gm-del").onclick = () => {
    if(!delArmed){ delArmed = 1; $$("gm-del").textContent = "Really delete?"; return; }
    const dg = games.find(g => g.id === editId);
    if(dg && !canManage(dg)){ closeModal(); return; }
    if(dg && dg.k === "h" && window.__gmCode) window.__gmCode.del(dg.id);
    tombs[editId] = Date.now(); games = games.filter(g => g.id !== editId); persist(); closeModal(); render();
  };
  async function saveHtml(){
    const name = cleanName($$("gm-name").value), html = $$("gm-html").value;
    const old = editId && games.find(g => g.id === editId);
    if(!name){ err("Give the game a name."); $$("gm-name").focus(); return; }
    if(old && !canManage(old)){ err("Only the person who added this game (or a mod) can change it."); return; }
    if(!old && !html.trim()){ err("Paste your game code or choose an .html file."); return; }
    if(html.length > MAX_HTML){ err("That game is too big (max " + Math.round(MAX_HTML / 1024) + " KB)."); return; }
    if(!old && games.length >= MAX){ err("You can keep up to " + MAX + " games."); return; }
    if(!window.__gmCode){ err("Sharing games needs the cloud sync, which isn't available right now."); return; }
    const id = old ? old.id : newId(), v = Date.now(), btn = $$("gm-save");
    let cv = old ? old.cv : 0;
    if(html.trim()){
      btn.disabled = true; btn.textContent = "Uploading…";
      const ok = await window.__gmCode.put(id, v, html);
      btn.disabled = false; btn.textContent = "Save";
      if(!ok){ err("Couldn’t upload the game. Check your connection and try again."); return; }
      cv = v;
    }
    const sz = html.trim() ? html.length : (old ? old.sz : 0);
    if(old){ old.name = name; old.icon = draftIcon; old.cat = $$("gm-cat").value; old.cv = cv; old.sz = sz; old.v = v; delete tombs[old.id]; }
    else games.push({ id, k: "h", name, url: "", icon: draftIcon, cat: $$("gm-cat").value, cv, sz, by: typeof uid !== "undefined" ? uid : "", fav: 0, plays: 0, last: 0, added: v, v });
    if(!persist()){ err("This device is out of storage space. Remove a game or use a smaller icon."); return; }
    closeModal(); render();
  }
  function save(){
    if(kind === "h"){ saveHtml(); return; }
    const name = cleanName($$("gm-name").value), url = cleanUrl($$("gm-url").value);
    if(!name){ err("Give the game a name."); $$("gm-name").focus(); return; }
    if(!url){ err("Paste a working link (it has to start with https://)."); $$("gm-url").focus(); return; }
    const old = editId && games.find(g => g.id === editId);
    if(old){ old.name = name; old.url = url; old.icon = draftIcon; old.cat = $$("gm-cat").value; old.v = Date.now(); delete tombs[old.id]; }
    else {
      if(games.length >= MAX){ err("You can keep up to " + MAX + " games."); return; }
      games.push({ id: newId(), name, url, icon: draftIcon, cat: $$("gm-cat").value, fav: 0, plays: 0, last: 0, added: Date.now(), v: Date.now() });
    }
    if(!persist()){ err("This device is out of storage space. Remove a game or use a smaller icon."); if(!old) games.pop(); return; }
    closeModal(); render();
  }
  $$("gm-save").onclick = save;
  modal.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.stopPropagation(); closeModal(); }
    else if(e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type === "text"){ e.preventDefault(); save(); }
  });

  /* hook into the tab switcher */
  const _sc = setChannel;
  setChannel = function(c){
    _sc(c);
    document.body.classList.toggle("in-games", c === "games");
    const r = $$("ch-games"); if(r) r.classList.toggle("active", c === "games");
    if(c === "games"){ render(); try{ if(window.__gmPull) window.__gmPull(); }catch(e){} }
  };
  /* ---- community sync hooks (used by the cloud mailbox script) ---- */
  window.__gm = {
    out(){
      const o = [], have = new Set();
      games.forEach(g => { have.add(g.id); const r = { id: g.id, name: g.name, url: g.url, icon: g.icon || "", added: g.added || 0, v: g.v || g.added || 1 }; if(g.cat) r.cat = g.cat; if(g.k === "h"){ r.k = "h"; r.cv = g.cv || 0; r.sz = g.sz || 0; r.by = g.by || ""; r.url = ""; } o.push(r); });
      Object.keys(tombs).forEach(id => { if(!have.has(id)) o.push({ id, del: 1, v: tombs[id] }); });
      return o;
    },
    apply(list){
      let ch = false;
      list.forEach(r => {
        if(!r || typeof r.id !== "string" || !r.id || r.id.length > 40) return;
        const v = +r.v || 0; if(v <= 0) return;
        const i = games.findIndex(g => g.id === r.id), loc = games[i];
        if(r.del){
          if(loc && (loc.v || 0) > v) return;                      // my copy was edited after that delete
          if(loc){ games.splice(i, 1); ch = true; }
          if((tombs[r.id] || 0) < v){ tombs[r.id] = v; ch = true; }
          return;
        }
        if((tombs[r.id] || 0) >= v) return;                         // deleted after this version
        const isH = r.k === "h", name = cleanName(r.name), url = isH ? "" : cleanUrl(r.url); if(!name || (!isH && !url)) return;
        const icon = okIcon(r.icon) ? r.icon : "";
        const ex = isH ? { k: "h", cv: +r.cv || 0, sz: Math.max(0, Math.min(MAX_HTML, +r.sz || 0)), by: String(r.by || "").slice(0, 40) } : {};
        ex.cat = CATS.includes(r.cat) ? r.cat : "";
        if(!loc){
          if(games.length >= MAX) return;
          games.push(Object.assign({ id: r.id, name, url, icon, fav: 0, plays: 0, last: 0, added: +r.added || Date.now(), v }, ex)); delete tombs[r.id]; ch = true;
        } else if(v > (loc.v || 0)){
          if(loc.k === "h" && isH && loc.by && ex.by !== loc.by && false){ return; }
          loc.name = name; loc.url = url; loc.icon = icon; loc.added = +r.added || loc.added; loc.v = v; Object.assign(loc, ex); delete tombs[r.id]; ch = true;
        }
      });
      if(ch){ persist(); render(); }
      return ch;
    }
  };
  render();
})();

;
/* ===== 44-home-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  try{ const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Itim&display=swap"; document.head.appendChild(l); }catch(e){}
  const ICONS = {"games": "assets/icons/games.png", "chat": "assets/icons/chat.png", "media": "assets/icons/media.png", "draw": "assets/icons/draw.png", "shame": "assets/icons/shame.png", "polls": "assets/icons/polls.png", "gal": "assets/icons/gallery.png", "tier": "assets/icons/tier.png"};
  const ITEMS = [
    ["games","Games","games"],["chat","Main chat room","main"],["media","Media","media"],["draw","drawing board","draw"],["shame","Hall of shame","shame"],
    ["polls","Polls Tab","polls"],["gal","Image Gallery","gal"],["tier","Tier List","tier"]
  ];
  window.__pbHomeIcons = {}; ITEMS.forEach(([ic, label, ch]) => { if(ch && ICONS[ic]) window.__pbHomeIcons[ch] = ICONS[ic]; });
  window.__pbHomeIcons.home = "assets/icons/home.png";   // the Home tab in the top bar   // the top bar tabs use these by default
  if(window.__pbTabs) try{ window.__pbTabs(); }catch(e){}
  const view = document.createElement("div"); view.id = "home";
  view.innerHTML =
    '<div class="hm-page">' +
    '<div class="hm-deco hm-curve"></div><div class="hm-deco hm-curve2"></div>' +
    '<svg class="hm-deco hm-tri" viewBox="0 0 100 100" aria-hidden="true"><polygon points="14,14 88,50 14,86" fill="currentColor" stroke="currentColor" stroke-width="16" stroke-linejoin="round"/></svg>' +
    '<svg class="hm-deco hm-scal" viewBox="0 0 100 100" aria-hidden="true"><path id="hm-scalp" fill="currentColor"/></svg>' +
    '<div class="hm-wrap"><div class="hm-top">Los PureBreds 3.0</div>' +
    '<img class="hm-mascot" alt="" draggable="false">' +
    '<div class="hm-banner">- Unification Initiation -</div>' +
    '<div class="hm-hint">Owner edit mode: tap an icon to change it, ◀ ▶ to move, ✕ to remove, or add a new one.</div>' +
    '<div class="hm-grid"></div></div></div><div class="hm-toast" id="hm-toast"></div>' +
    '<div class="hm-ed" id="hm-ed"><button type="button" id="hm-reset" style="display:none">↺ Reset</button><button type="button" id="hm-edit">✏️ Edit home</button></div>';
  $$("box").after(view);
  /* scalloped circle */
  let d = ""; for(let i = 0; i <= 120; i++){ const a = i / 120 * Math.PI * 2, r = 40 + 5 * Math.sin(a * 11); d += (i ? "L" : "M") + (50 + r * Math.cos(a)).toFixed(1) + " " + (50 + r * Math.sin(a)).toFixed(1); }
  $$("hm-scalp").setAttribute("d", d + "Z");
  try{ view.querySelector(".hm-mascot").src = LOGO; }catch(e){ view.querySelector(".hm-mascot").style.display = "none"; }
  const toast = t => { const m = $$("hm-toast"); m.textContent = t; m.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => m.classList.remove("on"), 2200); };
  const grid = view.querySelector(".hm-grid");
  const AUTHOR = window.__pbHomeIcons;
  const DEFAULTS = () => ITEMS.map(([ic, label, ch], n) => ({ k: "d" + n, n: label, i: "", ic: ic === "gal" ? "gal" : ic, im: "", t: ch, s: "" }));
  const isOwner = () => { try{ return !!(window.__pbAdm && window.__pbAdm()); }catch(e){ return false; } };
  let editing = false, working = null, override = null, overrideUntil = 0, lastSig = "";
  const sameTiles = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const current = () => {
    if(editing && working) return working;
    let hm = null; try{ hm = window.__pbHomeGet ? window.__pbHomeGet() : null; }catch(e){}
    if(override){ if(Date.now() > overrideUntil || sameTiles(hm || DEFAULTS(), override)) override = null; else return override; }
    return hm || DEFAULTS();
  };
  /* ---- go to a tab, then (optionally) press a sub-tab button inside it ---- */
  const norm = x => String(x || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const vis = e => !!(e.offsetParent || e.getClientRects().length);
  function subButtons(){ return Array.from(document.querySelectorAll(".gm-sub, .dchip:not(.add)")).filter(vis); }
  function openSub(sub, tries){
    const want = norm(sub); if(!want) return;
    const bs = subButtons();
    const hit = bs.find(b => norm(b.textContent) === want) || bs.find(b => norm(b.textContent).startsWith(want)) || bs.find(b => norm(b.textContent).includes(want));
    if(hit){ hit.click(); return; }
    if((tries || 0) < 25) setTimeout(() => openSub(sub, (tries || 0) + 1), 120);
    else toast("Couldn't find the sub-tab “" + sub + "”");
  }
  function go(t){
    if(t.t !== "home" && t.t !== "media" && !document.querySelector('#chtabs button[data-ch="' + t.t + '"]') && t.t !== "main"){ toast("That tab isn't available right now"); return; }
    if(t.t === "media"){ t = Object.assign({}, t, { t: "games", s: (!t.s || /^watch$/i.test(t.s)) ? "Media" : t.s }); }   // Media is a sub-tab of Games & Media now
    setChannel(t.t);
    if(t.s) setTimeout(() => openSub(t.s, 0), 80);
  }
  function tabOptions(){
    const out = [], seen = new Set();
    document.querySelectorAll("#chtabs button[data-ch]").forEach(b => {
      const k = b.dataset.ch; if(!k || k === "home" || k === "app" || k === "dm" || k === "grp" || seen.has(k)) return; seen.add(k);
      out.push([k, (b.textContent || "").trim() || k]);
    });
    ["main", "gal", "polls", "shame", "draw", "tier", "games"].forEach(k => { if(!seen.has(k)) out.push([k, k]); });
    return out;
  }
  function iconNode(t){
    const i = document.createElement("span"); i.className = "hm-ic";
    const src = t.im || (t.ic && ICONS[t.ic]) || "";
    if(src){ const im = new Image(); im.alt = ""; im.draggable = false; im.src = src; i.appendChild(im); }
    else { i.classList.add("emo"); if(!t.i) i.classList.add("def"); i.textContent = t.i || "⭐"; }
    return i;
  }
  function render(){
    const list = current(), sig = JSON.stringify(list) + "|" + editing;
    const own = isOwner(); $$("hm-ed").classList.toggle("on", own);
    if(!own && editing){ editing = false; working = null; }
    if(sig === lastSig && !(grid.dataset.own !== String(own))) return;
    lastSig = sig; grid.dataset.own = String(own);
    view.classList.toggle("editing", editing);
    $$("hm-edit").textContent = editing ? "✅ Done" : "✏️ Edit home";
    $$("hm-edit").classList.toggle("go", editing);
    $$("hm-reset").style.display = editing ? "" : "none";
    grid.replaceChildren();
    list.forEach((t, n) => {
      const cell = document.createElement("div"); cell.className = "hm-cell";
      const b = document.createElement("button"); b.type = "button"; b.className = "hm-it";
      const lb = document.createElement("span"); lb.textContent = t.n;
      b.append(iconNode(t), lb);
      b.onclick = () => { if(editing) openEditor(n); else go(t); };
      cell.appendChild(b);
      if(editing){
        const tools = document.createElement("div"); tools.className = "hm-tools";
        const mk = (txt, title, fn, cls, dis) => { const x = document.createElement("button"); x.type = "button"; x.textContent = txt; x.title = title; if(cls) x.className = cls; x.disabled = !!dis; x.onclick = e => { e.stopPropagation(); fn(); }; return x; };
        tools.append(mk("◀", "Move earlier", () => move(n, -1), "", n === 0), mk("✕", "Remove this icon", () => remove(n), "x"), mk("▶", "Move later", () => move(n, 1), "", n === list.length - 1));
        cell.appendChild(tools);
      }
      grid.appendChild(cell);
    });
    if(editing && list.length < 24){
      const cell = document.createElement("div"); cell.className = "hm-cell hm-add";
      const b = document.createElement("button"); b.type = "button"; b.className = "hm-it";
      const i = document.createElement("span"); i.className = "hm-ic"; i.textContent = "+";
      const lb = document.createElement("span"); lb.textContent = "Add icon";
      b.append(i, lb); b.onclick = () => openEditor(-1); cell.appendChild(b); grid.appendChild(cell);
    }
  }
  window.__pbHomeRender = render;
  /* ---- saving (the host shares it with everybody) ---- */
  function commit(list){
    working = list; override = list.map(x => Object.assign({}, x)); overrideUntil = Date.now() + 5000;
    try{ window.__pbHomeSave(list); }catch(e){ toast("Couldn't save — are you connected?"); }
    render();
  }
  function move(n, d){ const l = working.slice(), m = n + d; if(m < 0 || m >= l.length) return; [l[n], l[m]] = [l[m], l[n]]; commit(l); }
  function remove(n){ const l = working.slice(); if(!confirm("Remove “" + l[n].n + "” from the homepage?")) return; l.splice(n, 1); commit(l); }
  $$("hm-edit").onclick = () => {
    if(!isOwner()) return;
    if(!editing){ editing = true; working = current().map(x => Object.assign({}, x)); }
    else { editing = false; working = null; }
    lastSig = ""; render();
  };
  $$("hm-reset").onclick = () => {
    if(!confirm("Reset the homepage icons back to the original ones for everyone?")) return;
    override = DEFAULTS(); overrideUntil = Date.now() + 5000; working = DEFAULTS();
    try{ window.__pbHomeSave(null); }catch(e){ toast("Couldn't save — are you connected?"); }
    lastSig = ""; render();
  };
  /* ---- the add / edit box ---- */
  const modal = document.createElement("div"); modal.id = "hm-modal";
  modal.innerHTML = '<div class="hm-card" role="dialog" aria-label="Homepage icon"><h3 id="hm-mt">Add icon</h3>' +
    '<label>Name under the icon</label><input type="text" id="hm-n" maxlength="24" placeholder="e.g. Movie night">' +
    '<label>Picture or emoji</label><div class="hm-r"><span class="hm-pv sm" id="hm-pv"></span><input type="text" id="hm-i" maxlength="8" placeholder="emoji" style="max-width:90px"><button type="button" id="hm-up" class="sm">🖼 Upload</button><button type="button" id="hm-ux" class="sm" title="Remove the picture">✕</button></div>' +
    '<input type="file" id="hm-file" accept="image/*" hidden>' +
    '<label>Or use one of the built-in pictures</label><select id="hm-ic"></select>' +
    '<label>Opens this tab</label><select id="hm-t"></select>' +
    '<label>Sub-tab (optional)</label><input type="text" id="hm-s" maxlength="24" list="hm-sl" placeholder="leave empty to just open the tab"><datalist id="hm-sl"></datalist>' +
    '<div class="hm-note">Sub-tab = a button inside that tab, like Proxy or Music in Games & Media. Type its name.</div>' +
    '<div class="hm-btns"><button type="button" id="hm-cx">Cancel</button><button type="button" class="go" id="hm-ok">Save</button></div></div>';
  document.body.appendChild(modal);
  let editIdx = -1, pic = "";
  const BUILT = [["", "(none)"], ["games", "Games & Media"], ["chat", "Chat"], ["draw", "Drawing"], ["shame", "Hall of Shame"], ["polls", "Polls"], ["gal", "Gallery"], ["tier", "Tier list"]];
  $$("hm-ic").innerHTML = BUILT.map(([k, l]) => '<option value="' + k + '">' + l + '</option>').join("");
  const SUBHINT = { games: ["Games", "Proxy", "Media", "Music"], draw: ["Public"] };
  function fillSubHints(){
    const t = $$("hm-t").value, set = new Set(SUBHINT[t] || []);
    if(t === "draw") document.querySelectorAll(".dchip:not(.add)").forEach(c => { const x = c.textContent.replace(/[📌🌐●]/gu, "").trim(); if(x) set.add(x); });
    $$("hm-sl").innerHTML = ""; set.forEach(x => { const o = document.createElement("option"); o.value = x; $$("hm-sl").appendChild(o); });
  }
  function showPv(){
    const pv = $$("hm-pv"); pv.replaceChildren();
    const bi = $$("hm-ic").value;
    const src = pic || (bi && ICONS[bi]) || "";
    if(src){ const im = new Image(); im.alt = ""; im.src = src; pv.appendChild(im); } else pv.textContent = $$("hm-i").value.trim() || "⭐";
    $$("hm-ux").style.display = pic ? "" : "none";
  }
  function squarePic(f, cb){
    if(f.type === "image/gif" || /\.gif$/i.test(f.name || "")){ const r = new FileReader(); r.onload = e => { const d = String(e.target.result); cb(d.length <= 40000 ? d : ""); }; r.readAsDataURL(f); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(im.width, im.height) || 1, sx = (im.width - side) / 2, sy = (im.height - side) / 2;
      for(const size of [128, 96, 72, 56]){
        const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(im, sx, sy, side, side, 0, 0, size, size);
        let d = c.toDataURL("image/webp", 0.85); if(!d.startsWith("data:image/webp")) d = c.toDataURL("image/png");
        if(d.length <= 40000){ cb(d); return; }
      }
      cb("");
    };
    im.onerror = () => { URL.revokeObjectURL(url); cb(""); };
    im.src = url;
  }
  function openEditor(n){
    editIdx = n; const t = n >= 0 ? working[n] : { n: "", i: "", ic: "", im: "", t: "main", s: "" };
    $$("hm-mt").textContent = n >= 0 ? "Edit icon" : "Add icon";
    $$("hm-n").value = t.n; $$("hm-i").value = t.i; pic = t.im || ""; $$("hm-ic").value = t.ic || "";
    $$("hm-t").innerHTML = tabOptions().map(([k, l]) => '<option value="' + k + '">' + l.replace(/[<>&"]/g, "") + '</option>').join("");
    if(!Array.from($$("hm-t").options).some(o => o.value === t.t)){ const o = document.createElement("option"); o.value = t.t; o.textContent = t.t; $$("hm-t").appendChild(o); }
    $$("hm-t").value = t.t; $$("hm-s").value = t.s || "";
    fillSubHints(); showPv(); modal.classList.add("on"); setTimeout(() => $$("hm-n").focus(), 30);
  }
  const closeEditor = () => modal.classList.remove("on");
  $$("hm-cx").onclick = closeEditor;
  modal.addEventListener("mousedown", e => { if(e.target === modal) closeEditor(); });
  $$("hm-t").onchange = fillSubHints;
  $$("hm-i").oninput = showPv;
  $$("hm-ic").onchange = () => { if($$("hm-ic").value) pic = ""; showPv(); };
  $$("hm-up").onclick = () => $$("hm-file").click();
  $$("hm-ux").onclick = () => { pic = ""; showPv(); };
  $$("hm-file").onchange = () => { const f = $$("hm-file").files && $$("hm-file").files[0]; $$("hm-file").value = ""; if(!f) return; squarePic(f, d => { if(d){ pic = d; $$("hm-ic").value = ""; showPv(); } else toast("That picture is too big — try a simpler one"); }); };
  $$("hm-ok").onclick = () => {
    const name = $$("hm-n").value.trim();
    if(!name){ $$("hm-n").focus(); return; }
    const t = { k: editIdx >= 0 ? working[editIdx].k : "x" + Math.random().toString(36).slice(2, 9), n: name, i: $$("hm-i").value.trim(), ic: pic ? "" : $$("hm-ic").value, im: pic, t: $$("hm-t").value, s: $$("hm-s").value.trim() };
    const l = working.slice(); if(editIdx >= 0) l[editIdx] = t; else l.push(t);
    closeEditor(); commit(l);
  };
  render(); setInterval(() => { if(!document.hidden) render(); }, 1500);
  const tab = document.createElement("button"); tab.type = "button"; tab.dataset.ch = "home";
  { const hi = (window.__pbHomeIcons||{}).home;   // house picture instead of the 🏠 emoji, from the very first paint
    if(hi){ const g = new Image(); g.className = "tabimg hm"; g.alt = ""; g.src = hi; tab.append(g, document.createTextNode("Home")); tab.dataset.sig = hi + "|🏠|Home"; }
    else tab.textContent = "🏠 Home"; } tab.style.order = "-1"; tab.onclick = () => setChannel("home");
  $$("chtabs").appendChild(tab);
  const _sc = setChannel;
  setChannel = function(c){ _sc(c); document.body.classList.toggle("in-home", c === "home"); };
  /* land on the homepage when the app opens */
  setTimeout(() => { try{ if(curCh === "main") setChannel("home"); }catch(e){} }, 0);
})();

;
/* ===== 45-gm-proxy-js.js ===== */
(function(){
  /* Proxy is now a sub-tab inside Games (wired up in the proxy script below). An old single link set here (or saved earlier with Shift+click) becomes the first card there. */
  const PROXY_URL = "";
  const LS = "pb_proxy_url";
  const norm = s => { s = String(s || "").trim(); if(!s) return ""; if(!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s; try{ const u = new URL(s); return (u.protocol === "https:" || u.protocol === "http:") ? u.href : ""; }catch(e){ return ""; } };
  const saved = () => { try{ return norm(localStorage.getItem(LS)); }catch(e){ return ""; } };
  window.__pxLegacy = norm(PROXY_URL) || saved();
})();

;
/* ===== 46-media-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const LSD = "pb_media_del", LSM = "pb_media_my", LSH = "pb_media_has", MAXITEMS = 120;
  const KINDS = { movie: "MOVIE", show: "SERIES", site: "WEBSITE", music: "MUSIC" };
  let mode = "watch", items = [], tombs = {}, my = [], selId = "", q = "", ready = false, needFull = false, lastLocalEdit = 0, db = null;
  try{ const d = JSON.parse(localStorage.getItem(LSD) || "{}"); if(d && typeof d === "object") tombs = d; }catch(e){}
  try{ const m = JSON.parse(localStorage.getItem(LSM) || "[]"); if(Array.isArray(m)) my = m.filter(x => typeof x === "string").slice(0, 200); }catch(e){}

  const isMod = () => { try{ return !!(window.__pbIsMod && window.__pbIsMod()); }catch(e){ return false; } };
  const isOwner = () => { try{ return !!(window.__pbAdm && window.__pbAdm()); }catch(e){ return false; } };
  const meName = () => String(typeof usr === "string" ? usr : "").trim().toLowerCase();
  const canManage = it => !!it && (isOwner() || (!!it.by && String(it.by).trim().toLowerCase() === meName()));
  const okId = s => typeof s === "string" && /^m[a-z0-9]{3,30}$/.test(s);
  const txt = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
  const okImg = s => typeof s === "string" && (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(s) ? s.length < 160000 : /^https:\/\/[^\s"'<>()\\]{4,580}$/.test(s));
  const normUrl = s => {
    s = String(s || "").trim(); if(!s) return "";
    if(!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    try{ const u = new URL(s); return ((u.protocol === "https:" || u.protocol === "http:") && u.href.length < 600) ? u.href : ""; }catch(e){ return ""; }
  };
  const defRow = ty => ty === "music" ? "Music websites" : ty === "site" ? "Websites" : "Movies & shows";
  const hue = n => { let h = 0; for(const c of String(n)) h = (h * 31 + c.charCodeAt(0)) % 360; return "hsl(" + h + " 38% 30%)"; };
  const cmp = (a, b) => ((a.o || 0) - (b.o || 0)) || ((a.v || 0) - (b.v || 0));
  const bump = it => { it.v = Math.max(Date.now(), (it.v || 0) + 1); };
  const byId = id => items.find(i => i.id === id);
  function cleanItem(r){
    if(!r || r.k !== "md" || !okId(r.id)) return null;
    const v = +r.v || 0; if(v <= 0) return null;
    const name = txt(r.name, 60); if(!name) return null;
    const ty = KINDS[r.ty] ? r.ty : "movie";
    return { k: "md", id: r.id, ty, name, desc: txt(r.desc, 500), url: normUrl(r.url), poster: okImg(r.poster) ? r.poster : "", banner: okImg(r.banner) ? r.banner : "",
      row: txt(r.row, 30) || defRow(ty), rt: txt(r.rt, 10), o: isFinite(+r.o) ? +r.o : 0, by: txt(r.by, 12), v };
  }

  /* ---------- storage: pictures can be big, so items live in IndexedDB (not localStorage) ---------- */
  const idb = {
    open(){ return new Promise(res => { setTimeout(() => res(null), 3000); try{ const rq = indexedDB.open("pb_media_db", 1); rq.onupgradeneeded = () => rq.result.createObjectStore("items", { keyPath: "id" }); rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null); }catch(e){ res(null); } }); },
    all(){ return new Promise(res => { try{ const rq = db.transaction("items").objectStore("items").getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => res([]); }catch(e){ res([]); } }); },
    put(list){ if(!db || !list.length) return; try{ const st = db.transaction("items", "readwrite").objectStore("items"); list.forEach(x => st.put(x)); }catch(e){} },
    del(ids){ if(!db || !ids.length) return; try{ const st = db.transaction("items", "readwrite").objectStore("items"); ids.forEach(x => st.delete(x)); }catch(e){} }
  };
  function persist(put, del){
    idb.put(put || []); idb.del(del || []);
    try{ localStorage.setItem(LSD, JSON.stringify(tombs)); localStorage.setItem(LSM, JSON.stringify(my)); localStorage.setItem(LSH, items.length ? "1" : ""); }catch(e){}
    try{ if(window.__tbChanged) window.__tbChanged(); }catch(e){}
  }

  /* Media + Music are sub-tabs of the "Games & Media" tab now (no separate top tab / sidebar row) */

  /* ---------- the page ---------- */
  const view = document.createElement("div"); view.id = "mdview";
  view.innerHTML =
    '<div class="md-top gm-bar"><button type="button" class="gm-title gm-sub" data-sub="games" title="Games">🎮 Games</button><button type="button" class="gm-title gm-sub" data-sub="proxy" title="Proxy links">🌐 Proxy</button><button type="button" class="gm-title gm-sub" data-sub="media" title="Movies, shows &amp; websites">🎬 Media</button><button type="button" class="gm-title gm-sub" data-sub="music" title="Music websites">🎵 Music</button><button type="button" class="md-plus" id="md-add" hidden title="Add a movie, show or website" aria-label="Add a movie, show or website">+</button>' +
      '<span class="md-sp"></span><input id="md-q" type="search" placeholder="Search" autocomplete="off" aria-label="Search media"></div>' +
    '<div class="md-hero" id="md-hero"><img class="md-himg" id="md-himg" alt="" referrerpolicy="no-referrer" hidden><div class="md-hfade"></div>' +
      '<div class="md-hbody" id="md-hbody"><div class="md-kind" id="md-kind"></div><h2 id="md-title"></h2><div id="md-desc"></div>' +
        '<div class="md-btns"><a class="md-b md-white" id="md-play" target="_blank" rel="noopener noreferrer" hidden>▶ Play</a>' +
          '<button type="button" class="md-b md-grey" id="md-list">+ My List</button>' +
          '<button type="button" class="md-b md-grey" id="md-edit" hidden>✎ Edit</button></div></div>' +
      '<div class="md-empty" id="md-empty" hidden></div><div class="md-rt" id="md-rt"></div></div>' +
    '<div id="md-rows"></div>' +
    '<div id="md-music"><div class="mu-panel"><div class="mu-head"><button type="button" class="md-plus" id="mu-add" hidden title="Add a music website" aria-label="Add a music website">+</button></div><div id="mu-body"></div></div></div>' +
    '<div class="md-foot"></div>';
  $$("box").after(view);
  const hero = $$("md-hero"), himg = $$("md-himg");

  function showHero(it){
    $$("md-hbody").hidden = !it; $$("md-empty").hidden = !!it;
    if(!it){
      himg.hidden = true; $$("md-rt").textContent = "";
      const e = $$("md-empty");
      e.textContent = items.some(i => i.ty !== "music") ? "Nothing matches your search." : (isMod() ? "Nothing here yet. Tap the + button to add a movie, show or website." : "Nothing here yet. Mods can add movies, shows and websites.");
      hero.style.background = "var(--row)"; return;
    }
    const pic = it.banner || it.poster;
    if(pic){ himg.onerror = () => { himg.hidden = true; }; himg.src = pic; himg.hidden = false; hero.style.background = "var(--row)"; }
    else { himg.hidden = true; hero.style.background = "linear-gradient(135deg," + hue(it.name) + ",#141415)"; }
    $$("md-kind").innerHTML = ""; const n = document.createElement("b"); n.textContent = "▮"; $$("md-kind").append(n, KINDS[it.ty] || "");
    $$("md-title").textContent = it.name; $$("md-desc").textContent = it.desc || ""; $$("md-desc").style.display = it.desc ? "" : "none";
    $$("md-rt").textContent = it.rt || "";
    const pl = $$("md-play"); if(it.url){ pl.href = it.url; pl.textContent = it.ty === "site" ? "🌐 Visit" : "▶ Play"; pl.hidden = false; } else { pl.removeAttribute("href"); pl.hidden = true; }
    $$("md-list").textContent = my.includes(it.id) ? "✓ In My List" : "+ My List";
    $$("md-edit").hidden = !canManage(it);
  }
  function select(id, scroll){
    selId = id; const it = byId(id);
    view.querySelectorAll(".md-card").forEach(c => c.classList.toggle("sel", c.dataset.id === id));
    showHero(it);
    if(scroll && view.scrollTop > 60) view.scrollTo({ top: 0, behavior: "smooth" });
  }
  function card(it){
    const b = document.createElement("button"); b.type = "button"; b.className = "md-card"; b.dataset.id = it.id; b.setAttribute("aria-label", it.name);
    if(it.id === selId) b.classList.add("sel");
    b.style.setProperty("--tc", hue(it.name));
    if(it.poster){
      const im = new Image(); im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.referrerPolicy = "no-referrer"; im.draggable = false; im.src = it.poster;
      im.onerror = () => { im.remove(); b.classList.add("noimg"); }; b.appendChild(im);
    } else b.classList.add("noimg");
    const t = document.createElement("span"); t.className = "md-ct"; t.textContent = it.name; b.appendChild(t);
    b.onclick = () => select(it.id, true);
    b.ondblclick = () => { if(it.url) window.open(it.url, "_blank", "noopener,noreferrer"); };
    return b;
  }
  function addRow(host, title, list){
    const h = document.createElement("div"); h.className = "md-rowtitle"; h.textContent = title;
    const w = document.createElement("div"); w.className = "md-rw"; const r = document.createElement("div"); r.className = "md-row";
    list.forEach(it => r.appendChild(card(it)));
    const mk = (cls, ch, dir) => { const a = document.createElement("button"); a.type = "button"; a.className = "md-arrow " + cls; a.textContent = ch; a.setAttribute("aria-label", dir < 0 ? "Scroll left" : "Scroll right"); a.onclick = () => r.scrollBy({ left: dir * r.clientWidth * .8, behavior: "smooth" }); return a; };
    w.append(r, mk("l", "◀", -1), mk("r", "▶", 1)); host.append(h, w);
  }
  function renderAll(){
    const host = $$("md-rows"); host.replaceChildren();
    const needle = q.trim().toLowerCase(), watch = items.filter(i => i.ty !== "music");
    let shown;
    if(needle){
      shown = watch.filter(i => i.name.toLowerCase().includes(needle)).sort(cmp);
      if(shown.length) addRow(host, "Results", shown);
    } else {
      shown = watch.slice();
      const mine = my.map(byId).filter(Boolean); if(mine.length) addRow(host, "My List", mine);
      const m = new Map(); watch.slice().sort(cmp).forEach(i => { if(!m.has(i.row)) m.set(i.row, []); m.get(i.row).push(i); });
      [...m.entries()].forEach(([name, arr]) => addRow(host, name, arr));
    }
    const first = (shown.slice().sort(cmp))[0];
    if(!shown.some(i => i.id === selId)) selId = first ? first.id : "";
    view.querySelectorAll(".md-card").forEach(c => c.classList.toggle("sel", c.dataset.id === selId));
    showHero(byId(selId));
    renderMusic(); refreshMod();
  }
  function refreshMod(){ $$("md-add").hidden = !isMod() || mode === "music"; $$("mu-add").hidden = !isMod(); const it = byId(selId); $$("md-edit").hidden = !canManage(it); }
  function musicCard(it){
    const c = document.createElement("div"); c.className = "mu-card";
    const a = document.createElement("a"); a.className = "mu-a"; a.href = it.url || "#"; a.target = "_blank"; a.rel = "noopener noreferrer";
    const art = document.createElement("div"); art.className = "mu-art"; art.style.setProperty("--tc", hue(it.name));
    const pl = document.createElement("span"); pl.className = "mu-play"; pl.textContent = "▶";
    const fallback = () => { art.replaceChildren(); const l = document.createElement("span"); l.className = "mu-l"; l.textContent = Array.from(it.name)[0] || "♪"; art.append(l, pl); };
    const im = new Image(); im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.referrerPolicy = "no-referrer"; im.draggable = false;
    if(it.poster){ im.className = "art"; im.src = it.poster; } else if(it.url){ im.className = "fav"; im.src = "https://www.google.com/s2/favicons?sz=128&domain_url=" + encodeURIComponent(it.url); } else { fallback(); }
    if(im.className){ im.onerror = fallback; art.append(im, pl); }
    const nm = document.createElement("div"); nm.className = "mu-name"; nm.textContent = it.name;
    const sb = document.createElement("div"); sb.className = "mu-sub"; let host = ""; try{ host = new URL(it.url).hostname.replace(/^www\./, ""); }catch(e){}
    sb.textContent = it.desc || host;
    a.append(art, nm, sb); c.appendChild(a);
    if(canManage(it)){ const e = document.createElement("button"); e.type = "button"; e.className = "mu-edit"; e.textContent = "✎"; e.title = "Edit"; e.setAttribute("aria-label", "Edit " + it.name); e.onclick = () => openModal(it); c.appendChild(e); }
    return c;
  }
  function renderMusic(){
    const host = $$("mu-body"); host.replaceChildren();
    const needle = q.trim().toLowerCase(), all = items.filter(i => i.ty === "music");
    const list = all.filter(i => !needle || i.name.toLowerCase().includes(needle)).sort(cmp);
    if(!list.length){ const e = document.createElement("div"); e.className = "mu-empty"; e.textContent = all.length ? "Nothing matches your search." : (isMod() ? "No music websites yet. Tap the + button to add one." : "No music websites yet. Mods can add some."); host.appendChild(e); return; }
    const m = new Map(); list.forEach(i => { if(!m.has(i.row)) m.set(i.row, []); m.get(i.row).push(i); });
    m.forEach((arr, name) => {
      const t = document.createElement("div"); t.className = "mu-title"; t.textContent = name;
      const g = document.createElement("div"); g.className = "mu-grid"; arr.forEach(it => g.appendChild(musicCard(it))); host.append(t, g);
    });
  }
  function setMode(m){
    mode = m; view.classList.toggle("is-music", m === "music");
    $$("md-q").placeholder = m === "music" ? "Search music" : "Search"; renderAll();
  }
  window.__mdSetMode = setMode;   // the Games & Media sub-tab buttons call this (Media = "watch", Music = "music")
  let qt = 0; $$("md-q").addEventListener("input", e => { q = e.target.value; clearTimeout(qt); qt = setTimeout(renderAll, 180); });
  $$("md-list").onclick = () => {
    const it = byId(selId); if(!it) return;
    my = my.includes(it.id) ? my.filter(x => x !== it.id) : my.concat(it.id);
    persist([], []); renderAll();
  };
  $$("md-edit").onclick = () => { const it = byId(selId); if(it && canManage(it)) openModal(it); };
  $$("md-add").onclick = () => openModal(null, ""); $$("mu-add").onclick = () => openModal(null, "music");

  /* ---------- add / edit window ---------- */
  const modal = document.createElement("div"); modal.id = "md-modal";
  modal.innerHTML =
    '<div class="gm-box" role="dialog" aria-modal="true" aria-labelledby="mdm-t"><h3 id="mdm-t">Add to Media</h3>' +
      '<label>Type<select id="mdm-ty"><option value="movie">Movie</option><option value="show">Show / series</option><option value="site">Website</option><option value="music">Music website</option></select></label>' +
      '<label>Title<input id="mdm-name" type="text" maxlength="60" autocomplete="off" placeholder="e.g. South Park"></label>' +
      '<label>Link (opens when you press Play)<input id="mdm-url" type="text" maxlength="600" autocomplete="off" placeholder="https://…"></label>' +
      '<label>Row<input id="mdm-row" type="text" maxlength="30" autocomplete="off" list="mdm-rows" placeholder="Movies &amp; shows"><datalist id="mdm-rows"></datalist></label>' +
      '<label>Description<textarea id="mdm-desc" maxlength="500" placeholder="A short blurb shown on the banner"></textarea></label>' +
      '<label id="mdm-tl">Tag (optional, e.g. TV-14)<input id="mdm-rt" type="text" maxlength="10" autocomplete="off"></label>' +
      '<label id="mdm-pl">Poster (the small picture)</label><div class="md-img" id="mdm-pd"><img id="mdm-pi" alt="" hidden referrerpolicy="no-referrer"><input id="mdm-pu" type="text" maxlength="580" autocomplete="off" placeholder="Picture link (https://…)"><label class="md-up">Upload<input id="mdm-pf" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>' +
      '<label id="mdm-bl">Banner (the big picture)</label><div class="md-img wide" id="mdm-bd"><img id="mdm-bi" alt="" hidden referrerpolicy="no-referrer"><input id="mdm-bu" type="text" maxlength="580" autocomplete="off" placeholder="Picture link (https://…)"><label class="md-up">Upload<input id="mdm-bf" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label></div>' +
      '<div class="gm-foot"><div id="md-err" role="alert"></div></div>' +
      '<div class="gm-foot"><button type="button" id="mdm-del" class="gm-b red">Delete</button><span class="gm-spacer"></span><button type="button" id="mdm-cancel" class="gm-b alt">Cancel</button><button type="button" id="mdm-save" class="gm-b pri">Save</button></div>' +
    '</div>';
  document.body.appendChild(modal);
  let editId = null, delArmed = 0, fPoster = "", fBanner = "";
  const err = m => { $$("md-err").textContent = m || ""; };
  function preview(){ [["mdm-pi", fPoster], ["mdm-bi", fBanner]].forEach(([id, v]) => { const i = $$(id); if(okImg(v)){ i.src = v; i.hidden = false; } else { i.removeAttribute("src"); i.hidden = true; } }); }
  function applyType(){
    const mu = $$("mdm-ty").value === "music";
    $$("mdm-tl").style.display = $$("mdm-bl").style.display = $$("mdm-bd").style.display = mu ? "none" : "";
    $$("mdm-pl").textContent = mu ? "Cover (square picture, optional)" : "Poster (the small picture)";
    $$("mdm-pd").classList.toggle("sq", mu); $$("mdm-row").placeholder = mu ? "Music websites" : "Movies & shows";
  }
  $$("mdm-ty").addEventListener("change", applyType);
  function openModal(it, preset){
    if(it ? !canManage(it) : !isMod()) return;
    editId = it ? it.id : null; delArmed = 0; err("");
    $$("mdm-t").textContent = it ? "Edit" : "Add to Media";
    $$("mdm-ty").value = it ? it.ty : (preset || "movie"); $$("mdm-name").value = it ? it.name : ""; $$("mdm-url").value = it ? it.url : "";
    $$("mdm-row").value = it ? it.row : ""; $$("mdm-desc").value = it ? it.desc : ""; $$("mdm-rt").value = it ? it.rt : "";
    fPoster = it ? it.poster : ""; fBanner = it ? it.banner : "";
    $$("mdm-pu").value = /^https:/.test(fPoster) ? fPoster : ""; $$("mdm-bu").value = /^https:/.test(fBanner) ? fBanner : "";
    $$("mdm-rows").replaceChildren(); [...new Set(items.map(i => i.row).concat(["Movies & shows", "Websites"]))].forEach(r => { const o = document.createElement("option"); o.value = r; $$("mdm-rows").appendChild(o); });
    $$("mdm-del").style.display = it ? "" : "none"; $$("mdm-del").textContent = "Delete";
    applyType(); preview(); modal.classList.add("on"); setTimeout(() => $$("mdm-name").focus(), 30);
  }
  const closeModal = () => modal.classList.remove("on");
  $$("mdm-cancel").onclick = closeModal;
  modal.addEventListener("mousedown", e => { if(e.target === modal) closeModal(); });
  modal.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.stopPropagation(); closeModal(); }
    else if(e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type === "text"){ e.preventDefault(); $$("mdm-save").click(); }
  });
  $$("mdm-pu").addEventListener("input", e => { const v = e.target.value.trim(); fPoster = okImg(v) ? v : ""; preview(); });
  $$("mdm-bu").addEventListener("input", e => { const v = e.target.value.trim(); fBanner = okImg(v) ? v : ""; preview(); });
  function cover(file, W, H, limit){
    return new Promise((res, rej) => {
      if(!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return rej("Pick a PNG, JPG, WEBP or GIF picture.");
      const fr = new FileReader(); fr.onerror = () => rej("Couldn’t read that picture.");
      fr.onload = () => {
        const im = new Image(); im.onerror = () => rej("Couldn’t read that picture.");
        im.onload = () => {
          for(const [k, qa] of [[1, .8], [.8, .7], [.65, .6], [.5, .5]]){
            const w = Math.round(W * k), h = Math.round(H * k), c = document.createElement("canvas"); c.width = w; c.height = h;
            const x = c.getContext("2d"), sc = Math.max(w / im.width, h / im.height), dw = im.width * sc, dh = im.height * sc;
            x.fillStyle = "#111"; x.fillRect(0, 0, w, h); x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
            let out = ""; try{ out = c.toDataURL("image/jpeg", qa); }catch(e){ return rej("Couldn’t process that picture."); }
            if(out.length < limit) return res(out);
          }
          rej("That picture is too big to store. Try a smaller one.");
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  const pick = (inp, urlInp, W, H, limit, set) => inp.addEventListener("change", async () => {
    const f = inp.files && inp.files[0]; inp.value = ""; if(!f) return; err("");
    try{ const d = typeof W === "function" ? W() : [W, H]; set(await cover(f, d[0], d[1], limit)); urlInp.value = ""; preview(); }catch(e){ err(typeof e === "string" ? e : "Couldn’t use that picture."); }
  });
  pick($$("mdm-pf"), $$("mdm-pu"), () => $$("mdm-ty").value === "music" ? [300, 300] : [240, 360], 0, 60000, v => { fPoster = v; });
  pick($$("mdm-bf"), $$("mdm-bu"), 1000, 430, 150000, v => { fBanner = v; });

  $$("mdm-save").onclick = () => {
    const ex = editId && byId(editId);
    if(ex ? !canManage(ex) : !isMod()){ err("You don’t have permission to do that."); return; }
    const ty = KINDS[$$("mdm-ty").value] ? $$("mdm-ty").value : "movie", name = txt($$("mdm-name").value, 60);
    if(!name){ err("Give it a title."); return; }
    const rawUrl = $$("mdm-url").value.trim(), url = normUrl(rawUrl);
    if(rawUrl && !url){ err("That link doesn’t look right."); return; }
    if((ty === "site" || ty === "music") && !url){ err(ty === "music" ? "A music website needs a link." : "A website needs a link."); return; }
    const rowName = txt($$("mdm-row").value, 30) || defRow(ty);
    const f = { ty, name, url, desc: txt($$("mdm-desc").value, 500), rt: ty === "music" ? "" : txt($$("mdm-rt").value, 10), row: rowName, poster: okImg(fPoster) ? fPoster : "", banner: (ty !== "music" && okImg(fBanner)) ? fBanner : "" };
    let it = ex;
    if(it){
      const rowChanged = it.row !== rowName; Object.assign(it, f);
      if(rowChanged) it.o = items.reduce((m, x) => Math.max(m, (x.o || 0) + 1), 0);
      bump(it); delete tombs[it.id];
    } else {
      if(items.length >= MAXITEMS){ err("The library is full (" + MAXITEMS + " items)."); return; }
      it = Object.assign({ k: "md", id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), o: items.reduce((m, x) => Math.max(m, (x.o || 0) + 1), 0), by: txt(typeof usr === "string" ? usr : "", 12), v: Date.now() }, f);
      items.push(it);
    }
    lastLocalEdit = Date.now(); persist([it], []); closeModal(); if(it.ty === "music"){ renderAll(); } else { selId = it.id; if(mode !== "watch") setMode("watch"); renderAll(); select(it.id, true); }
  };
  $$("mdm-del").onclick = () => {
    const it = editId && byId(editId); if(!it || !canManage(it)) return;
    if(!delArmed){ delArmed = 1; $$("mdm-del").textContent = "Really delete for everyone?"; return; }
    tombs[it.id] = Math.max(Date.now(), (it.v || 0) + 1); items = items.filter(x => x.id !== it.id); my = my.filter(x => x !== it.id);
    lastLocalEdit = Date.now(); persist([], [it.id]); closeModal(); renderAll();
  };

  const inMediaNow = () => { const g = document.getElementById("games"); return !!(g && g.classList.contains("sub-media")); };
  setInterval(() => { if(!document.hidden && inMediaNow()) refreshMod(); }, 3000);

  /* ---------- cloud sync hooks (used by the mailbox script) ---------- */
  window.__md = {
    get ready(){ return ready; },
    get needFull(){ return needFull; },
    fullDone(){ needFull = false; },
    canPush: () => isMod() || Date.now() - lastLocalEdit < 120000 || items.some(canManage),
    out(){
      const o = items.map(i => ({ k: "md", id: i.id, ty: i.ty, name: i.name, desc: i.desc, url: i.url, poster: i.poster, banner: i.banner, row: i.row, rt: i.rt, o: i.o || 0, by: i.by || "", v: i.v || 1 }));
      const have = new Set(items.map(i => i.id));
      Object.keys(tombs).forEach(id => { if(!have.has(id)) o.push({ k: "md", id, del: 1, v: tombs[id] }); });
      return o;
    },
    apply(list){
      const put = [], del = []; let ch = false;
      list.forEach(r => {
        if(!r || r.k !== "md" || !okId(r.id)) return;
        const v = +r.v || 0; if(v <= 0) return;
        const i = items.findIndex(x => x.id === r.id), loc = items[i];
        if(r.del){
          if(loc && (loc.v || 0) > v) return;
          if(loc){ items.splice(i, 1); del.push(r.id); ch = true; }
          if((tombs[r.id] || 0) < v){ tombs[r.id] = v; ch = true; }
          return;
        }
        if((tombs[r.id] || 0) >= v) return;
        if(loc && (loc.v || 0) >= v) return;
        const nt = cleanItem(r); if(!nt) return;
        if(loc) items[i] = nt; else { if(items.length >= MAXITEMS) return; items.push(nt); }
        delete tombs[r.id]; put.push(nt); ch = true;
      });
      if(ch){ persist(put, del); if(inMediaNow() || items.length) renderAll(); }
      return ch;
    }
  };

  /* ---------- load what this device already has ---------- */
  (async () => {
    db = await idb.open();
    if(!db){ needFull = true; ready = true; return; }                  // no storage here: re-download once per visit
    const all = await idb.all();
    items = all.map(cleanItem).filter(Boolean).slice(0, MAXITEMS);
    let had = false; try{ had = localStorage.getItem(LSH) === "1"; }catch(e){}
    if(had && !items.length) needFull = true;                          // the browser cleared our pictures: fetch everything again
    ready = true; renderAll();
  })();
})();

;
/* ===== 47-proxy-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  /* true  = only mods/owners can add, edit or delete proxy links (everybody can still open them)
     false = anybody can add links, exactly like the Games tab */
  const MODS_ONLY = true;
  const LS = "pb_proxies", LSM = "pb_proxies_mode", LSD = "pb_proxies_del", MAX = 200;
  const isMod = () => { try{ return !!(window.__pbIsMod && window.__pbIsMod()); }catch(e){ return false; } };
  const canEdit = () => !MODS_ONLY || isMod();

  /* ---------------- data ---------------- */
  let list = [];
  try{ const a = JSON.parse(localStorage.getItem(LS) || "[]"); if(Array.isArray(a)) list = a.filter(g => g && typeof g.id === "string" && typeof g.name === "string" && typeof g.url === "string").slice(0, MAX); }catch(e){}
  let mode = "default"; try{ const m = localStorage.getItem(LSM); if(["default","az","fav","recent"].includes(m)) mode = m; }catch(e){}
  let tombs = {}; try{ const t = JSON.parse(localStorage.getItem(LSD) || "{}"); if(t && typeof t === "object") tombs = t; }catch(e){}
  let q = "", editId = null, draftIcon = "";
  list.forEach(g => { if(!g.v) g.v = g.added || 1; });

  const save = () => {                                   // this device only
    let ok = false;
    ok = window.__pbSet(LS, JSON.stringify(list));
    try{ localStorage.setItem(LSD, JSON.stringify(tombs)); }catch(e){}
    return ok;
  };
  const persist = () => { const ok = save(); try{ if(window.__gmChanged) window.__gmChanged(); }catch(e){} return ok; };   // + tell everyone
  const newId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  const cleanUrl = s => {
    s = String(s || "").trim(); if(!s) return "";
    if(!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = "https://" + s;
    try{ const u = new URL(s); return (u.protocol === "https:" || u.protocol === "http:") ? u.href : ""; }catch(e){ return ""; }
  };
  const okIcon = s => typeof s === "string" && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(s) && s.length < 400000;
  const siteIcon = url => "https://www.google.com/s2/favicons?sz=128&domain_url=" + encodeURIComponent(url);
  const tileColor = n => { try{ if(typeof colorFor === "function") return colorFor(n); }catch(e){} return "#6d5bd0"; };

  /* a link that was set up with the old single "Proxy" button becomes the first card */
  try{ const lg = window.__pxLegacy; if(lg && !list.length && !tombs.p_legacy){ list.push({ id: "p_legacy", name: "Proxy", url: lg, icon: "", fav: 0, last: 0, added: 1, v: 1 }); save(); } }catch(e){}

  /* ---------------- page (a sub-tab of Games — no separate top tab or sidebar row) ---------------- */
  const view = document.createElement("div"); view.id = "proxyview";
  view.innerHTML =
    '<div class="gm-bar">' +
      '<button type="button" class="gm-title gm-sub" data-sub="games" title="Games">🎮 Games</button><button type="button" class="gm-title gm-sub on" data-sub="proxy" title="Proxy links">🌐 Proxy <small id="px-count"></small></button><button type="button" class="gm-title gm-sub" data-sub="media" title="Movies, shows &amp; websites">🎬 Media</button><button type="button" class="gm-title gm-sub" data-sub="music" title="Music websites">🎵 Music</button><span class="gm-spacer"></span>' +
      '<input class="gm-search" id="px-q" type="search" placeholder="Search proxies" autocomplete="off" aria-label="Search proxies">' +
      '<div class="gm-chips" id="px-chips">' +
        '<button type="button" class="gm-chip" data-m="default">Default</button>' +
        '<button type="button" class="gm-chip" data-m="az">A–Z</button>' +
        '<button type="button" class="gm-chip" data-m="fav">★ Favorites</button>' +
        '<button type="button" class="gm-chip" data-m="recent">Recent</button>' +
      '</div>' +
    '</div>' +
    '<div class="gm-scroll"><div class="gm-grid" id="px-grid"></div></div>';
  $$("games").appendChild(view);
  const grid = $$("px-grid");

  function visible(){
    let l = list.slice(); const s = q.trim().toLowerCase();
    if(s) l = l.filter(g => g.name.toLowerCase().includes(s));
    if(mode === "fav") l = l.filter(g => g.fav);
    if(mode === "az") l.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    else if(mode === "recent") l = l.filter(g => g.last).sort((a, b) => b.last - a.last);
    return l;
  }
  function iconNode(g, big){
    const box = document.createElement("div"); box.className = big ? "gm-prev" : "gm-ic";
    const name = g.name || "?", url = g.url || "";
    const letter = () => { box.replaceChildren(); box.style.background = tileColor(name); box.textContent = (name.trim()[0] || "?").toUpperCase(); };
    if(okIcon(g.icon)){ const im = new Image(); im.alt = ""; im.src = g.icon; box.appendChild(im); }
    else if(url){
      const im = new Image(); im.alt = ""; im.className = "site"; im.referrerPolicy = "no-referrer"; im.src = siteIcon(url);
      im.onerror = letter; box.appendChild(im);
    } else letter();
    return box;
  }
  function openProxy(g){                                  // click the icon → straight to the website
    window.open(g.url, "_blank", "noopener,noreferrer");
    g.last = Date.now(); save();
    if(mode === "recent") render();
  }
  function cardFor(g){
    const c = document.createElement("div"); c.className = "gm-card"; c.tabIndex = 0; c.setAttribute("role", "link"); c.setAttribute("aria-label", "Open " + g.name);
    const ic = iconNode(g, false);
    const star = document.createElement("button"); star.type = "button"; star.className = "gm-star";
    const paint = () => { star.textContent = g.fav ? "★" : "☆"; star.setAttribute("aria-pressed", g.fav ? "true" : "false"); star.title = g.fav ? "Remove from favorites" : "Add to favorites"; };
    paint();
    star.onclick = e => { e.stopPropagation(); g.fav = g.fav ? 0 : 1; save(); if(mode === "fav") render(); else paint(); };
    if(canEdit()){
      const ed = document.createElement("button"); ed.type = "button"; ed.className = "gm-edit"; ed.textContent = "✎"; ed.title = "Edit or delete this link"; ed.setAttribute("aria-label", "Edit " + g.name);
      ed.onclick = e => { e.stopPropagation(); openModal(g); };
      ic.append(ed);
    }
    ic.append(star);
    const nm = document.createElement("div"); nm.className = "gm-nm"; nm.textContent = g.name;
    c.append(ic, nm);
    c.onclick = () => openProxy(g);
    c.onkeydown = e => { if(e.target === c && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); openProxy(g); } };
    return c;
  }
  function addTile(){
    const c = document.createElement("div"); c.className = "gm-card gm-add"; c.tabIndex = 0; c.setAttribute("role", "button"); c.setAttribute("aria-label", "Add a proxy link");
    const ic = document.createElement("div"); ic.className = "gm-ic"; ic.textContent = "+";
    const nm = document.createElement("div"); nm.className = "gm-nm"; nm.textContent = "Click the + to add proxy links";
    c.append(ic, nm);
    c.onclick = () => openModal(null);
    c.onkeydown = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openModal(null); } };
    return c;
  }
  function render(){
    const l = visible(), ed = canEdit();
    $$("px-count").textContent = list.length ? "· " + list.length : "";
    document.querySelectorAll("#px-chips .gm-chip").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
    const kids = (ed ? [addTile()] : []).concat(l.map(cardFor));
    if(!l.length){
      const t = q.trim() ? "No proxies match your search." : mode === "fav" ? "No favorites yet. Tap the ☆ on a proxy." : mode === "recent" ? "Nothing opened yet." : (!list.length && !ed) ? "No proxy links have been added yet." : "";
      if(t){ const n = document.createElement("div"); n.className = "gm-none"; n.textContent = t; kids.push(n); }
    }
    grid.replaceChildren.apply(grid, kids);
  }
  $$("px-q").addEventListener("input", e => { q = e.target.value; render(); });
  $$("px-chips").addEventListener("click", e => {
    const b = e.target.closest(".gm-chip"); if(!b) return;
    mode = b.dataset.m; try{ localStorage.setItem(LSM, mode); }catch(err){} render();
  });

  /* ---------------- add / edit window ---------------- */
  const modal = document.createElement("div"); modal.id = "px-modal";
  modal.innerHTML =
    '<div class="gm-box" role="dialog" aria-modal="true" aria-labelledby="px-mt"><h3 id="px-mt">Add a proxy link</h3>' +
      '<label>Name<input id="px-name" type="text" maxlength="40" autocomplete="off" placeholder="e.g. Proxy 1"></label>' +
      '<label>Proxy link<input id="px-url" type="text" inputmode="url" maxlength="600" autocomplete="off" spellcheck="false" placeholder="https://…"></label>' +
      '<div class="gm-icrow"><div id="px-prevwrap"></div><div class="gm-icbtns"><button type="button" id="px-pick" class="gm-b alt">Choose icon</button><button type="button" id="px-rm" class="gm-b alt">Use the site’s icon</button></div><input id="px-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></div>' +
      '<div id="px-err" role="alert"></div>' +
      '<div class="gm-foot"><button type="button" id="px-del" class="gm-b red">Delete</button><span class="gm-spacer"></span><button type="button" id="px-cancel" class="gm-b alt">Cancel</button><button type="button" id="px-save" class="gm-b pri">Save</button></div>' +
    '</div>';
  document.body.appendChild(modal);
  const err = t => { $$("px-err").textContent = t || ""; };
  function paintPrev(){
    const url = cleanUrl($$("px-url").value), name = cleanName($$("px-name").value) || "?";
    $$("px-prevwrap").replaceChildren(iconNode({ name, url, icon: draftIcon }, true));
    $$("px-rm").style.display = draftIcon ? "" : "none";
  }
  let delArmed = 0;
  function openModal(g){
    if(!canEdit()) return;
    editId = g ? g.id : null; draftIcon = g && okIcon(g.icon) ? g.icon : ""; delArmed = 0;
    $$("px-mt").textContent = g ? "Edit proxy link" : "Add a proxy link";
    $$("px-name").value = g ? g.name : ""; $$("px-url").value = g ? g.url : "";
    $$("px-del").style.display = g ? "" : "none"; $$("px-del").textContent = "Delete";
    err(""); paintPrev(); modal.classList.add("on");
    setTimeout(() => $$("px-name").focus(), 30);
  }
  const closeModal = () => modal.classList.remove("on");
  $$("px-name").addEventListener("input", paintPrev);
  $$("px-url").addEventListener("input", paintPrev);
  $$("px-pick").onclick = () => $$("px-file").click();
  $$("px-rm").onclick = () => { draftIcon = ""; paintPrev(); };
  $$("px-file").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if(!f) return;
    if(!/^image\/(png|jpe?g|webp|gif)$/i.test(f.type)){ err("Pick a PNG, JPG, WEBP or GIF picture."); return; }
    const fr = new FileReader();
    fr.onerror = () => err("Couldn’t read that picture.");
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => err("Couldn’t read that picture.");
      im.onload = () => {
        const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, S, S);
        const r = Math.max(S / im.width, S / im.height), w = im.width * r, h = im.height * r;
        x.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
        try{ draftIcon = c.toDataURL("image/jpeg", .85); err(""); paintPrev(); }catch(ex){ err("Couldn’t use that picture."); }
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(f);
  });
  $$("px-cancel").onclick = closeModal;
  modal.addEventListener("mousedown", e => { if(e.target === modal) closeModal(); });
  $$("px-del").onclick = () => {
    if(!canEdit()) return;
    if(!delArmed){ delArmed = 1; $$("px-del").textContent = "Really delete?"; return; }
    tombs[editId] = Date.now(); list = list.filter(g => g.id !== editId); persist(); closeModal(); render();
  };
  function saveLink(){
    if(!canEdit()) return;
    const name = cleanName($$("px-name").value), url = cleanUrl($$("px-url").value);
    if(!name){ err("Give the link a name."); $$("px-name").focus(); return; }
    if(!url){ err("Paste a working link (it has to start with https://)."); $$("px-url").focus(); return; }
    const old = editId && list.find(g => g.id === editId);
    if(old){ old.name = name; old.url = url; old.icon = draftIcon; old.v = Date.now(); delete tombs[old.id]; }
    else {
      if(list.length >= MAX){ err("You can keep up to " + MAX + " proxy links."); return; }
      list.push({ id: newId(), name, url, icon: draftIcon, fav: 0, last: 0, added: Date.now(), v: Date.now() });
    }
    if(!persist()){ err("This device is out of storage space. Remove a link or use a smaller icon."); if(!old) list.pop(); return; }
    closeModal(); render();
  }
  $$("px-save").onclick = saveLink;
  modal.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.stopPropagation(); closeModal(); }
    else if(e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type === "text"){ e.preventDefault(); saveLink(); }
  });

  /* ---------------- sub-tab switch (Games | Proxy | Media | Music) ---------------- */
  const gv = $$("games");
  const mdv = $$("mdview"); if(mdv && mdv.parentNode !== gv) gv.appendChild(mdv);
  const SUBS = ["games", "proxy", "media", "music"];
  let sub = "games";
  function setSub(x){
    sub = SUBS.indexOf(x) >= 0 ? x : "games";
    const inMedia = sub === "media" || sub === "music";
    gv.classList.toggle("sub-proxy", sub === "proxy");
    gv.classList.toggle("sub-media", inMedia);
    gv.querySelectorAll(".gm-sub").forEach(b => b.classList.toggle("on", b.dataset.sub === sub));
    if(sub === "proxy"){ render(); try{ if(window.__gmPull) window.__gmPull(); }catch(e){} }
    if(inMedia){ try{ if(window.__mdSetMode) window.__mdSetMode(sub === "music" ? "music" : "watch"); }catch(e){} try{ if(window.__tbPull) window.__tbPull(); }catch(e){} }
  }
  gv.addEventListener("click", e => { const b = e.target.closest(".gm-sub"); if(b) setSub(b.dataset.sub); });
  const _sc = setChannel;
  setChannel = function(c){
    if(c === "proxy"){ c = "games"; setSub("proxy"); }      // anything that still asks for the old Proxy / Media tabs lands on the matching sub-tab
    else if(c === "media"){ c = "games"; if(sub !== "media" && sub !== "music") setSub("media"); }
    _sc(c);
    if(c === "games" && sub === "proxy") render();
  };

  /* ---------------- sync: the links ride on the same cloud list as Games (records tagged k:"p"), so everybody gets them ---------------- */
  const px = {
    out(){
      const o = [], have = new Set();
      list.forEach(g => { have.add(g.id); o.push({ k: "p", id: g.id, name: g.name, url: g.url, icon: g.icon || "", added: g.added || 0, v: g.v || g.added || 1 }); });
      Object.keys(tombs).forEach(id => { if(!have.has(id)) o.push({ k: "p", id, del: 1, v: tombs[id] }); });
      return o;
    },
    apply(items){
      let ch = false;
      items.forEach(r => {
        if(!r || typeof r.id !== "string" || !r.id || r.id.length > 40) return;
        const v = +r.v || 0; if(v <= 0) return;
        const i = list.findIndex(g => g.id === r.id), loc = list[i];
        if(r.del){
          if(loc && (loc.v || 0) > v) return;
          if(loc){ list.splice(i, 1); ch = true; }
          if((tombs[r.id] || 0) < v){ tombs[r.id] = v; ch = true; }
          return;
        }
        if((tombs[r.id] || 0) >= v) return;
        const name = cleanName(r.name), url = cleanUrl(r.url); if(!name || !url) return;
        const icon = okIcon(r.icon) ? r.icon : "";
        if(!loc){
          if(list.length >= MAX) return;
          list.push({ id: r.id, name, url, icon, fav: 0, last: 0, added: +r.added || Date.now(), v }); delete tombs[r.id]; ch = true;
        } else if(v > (loc.v || 0)){
          loc.name = name; loc.url = url; loc.icon = icon; loc.added = +r.added || loc.added; loc.v = v; delete tombs[r.id]; ch = true;
        }
      });
      if(ch){ save(); render(); }
      return ch;
    }
  };
  window.__px = px;
  const gm = window.__gm;
  if(gm && !gm.__px){
    const _out = gm.out, _apply = gm.apply;
    gm.out = function(){ return _out.apply(gm, arguments).concat(px.out()); };
    gm.apply = function(items){
      const mine = [], rest = [];
      (items || []).forEach(r => (r && r.k === "p" ? mine : rest).push(r));
      const a = _apply.call(gm, rest), b = px.apply(mine);
      return a || b;
    };
    gm.__px = 1;
  }
  render();
})();

;
/* ===== 48-changelog-js.js ===== */
/* Top-bar Changelog button: opens the same GitHub-synced "What's new" window as the sidebar button (#cl-open),
   so it works even while the sidebar is hidden. A red dot shows when there are commits you haven't opened yet. */
(function(){
  const $$ = id => document.getElementById(id);
  const hdr = $$("hdr"); if(!hdr || $$("hdr-log")) return;
  const btn = document.createElement("button"); btn.type = "button"; btn.id = "hdr-log"; btn.title = "Changelog \u2014 what's new";
  btn.setAttribute("aria-haspopup", "dialog");
  btn.innerHTML = '\ud83d\udcdd<span class="lbl">Changelog</span><span class="dot"></span>';
  hdr.appendChild(btn);
  btn.addEventListener("click", () => { btn.classList.remove("new"); const o = $$("cl-open"); if(o) o.click(); });
  async function check(){
    try{
      if(typeof window.__pbClLoad !== "function") return;
      const list = await window.__pbClLoad(), seen = localStorage.getItem("cl_seen");
      btn.classList.toggle("new", !!(list[0] && seen && list[0].sha !== seen));
    }catch(e){}
  }
  window.addEventListener("load", () => setTimeout(check, 4000));
})();

;
/* ===== 49-theme-guard.js ===== */
/* =============== Theme guard: if a theme ever renders text you can't read (same colour as its background, fully transparent,
   a colour the phone's browser doesn't understand…), repair just those elements so the text always shows =============== */
(function(){
  const num = x => /%$/.test(x) ? parseFloat(x) / 100 : parseFloat(x);
  function parseColor(str){
    if(!str) return null; str = String(str).trim();
    let m = str.match(/^rgba?\(\s*([^)]+)\)$/i), p;
    if(m){ p = m[1].split(/[\s,\/]+/).filter(Boolean); if(p.length < 3) return null; const v = p.map(num); if(v.some(isNaN)) return null; return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; }
    m = str.match(/^color\(\s*srgb\s+([^)]+)\)$/i);
    if(m){ p = m[1].split(/[\s\/]+/).filter(Boolean); if(p.length < 3) return null; const v = p.map(num); if(v.some(isNaN)) return null; return { r: v[0] * 255, g: v[1] * 255, b: v[2] * 255, a: v.length > 3 ? v[3] : 1 }; }
    return null;
  }
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const chan = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  const lum = c => .2126 * chan(c.r) + .7152 * chan(c.g) + .0722 * chan(c.b);
  const contrast = (a, b) => { let x = lum(a), y = lum(b); if(x < y){ const t = x; x = y; y = t; } return (x + .05) / (y + .05); };
  window.__pbContrast = { parseColor, over, lum, contrast };

  /* the colour actually painted behind an element (null = can't tell, e.g. a gradient or picture) */
  function effBg(el){
    const layers = [];
    for(let a = el; a && a.nodeType === 1; a = a.parentElement){
      const cs = getComputedStyle(a);
      if(cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parseColor(cs.backgroundColor);
      if(c && c.a > 0){ layers.push(c); if(c.a >= .97) break; }
    }
    if(!layers.length || layers[layers.length - 1].a < .97) return null;
    let base = layers[layers.length - 1];
    for(let i = layers.length - 2; i >= 0; i--) base = over(layers[i], base);
    return base;
  }

  const SEL = ["#hdr #status", "#chtabs button", "#sb .row-ch b", "#sb .prow", "#inp", "#box .bubble", "#home .hm-it", "#home .hm-banner", "#gate .card", "#gate label", "#ctview .ct-title", "#games .gm-title", "#proxyview .gm-title", ".stg-btn"];
  let fixed = [];
  function restore(){ fixed.forEach(el => { try{ el.style.removeProperty("color"); }catch(e){} }); fixed = []; }
  function check(){
    if(!document.body) return;
    restore();
    const bad = [];
    SEL.forEach(sel => {
      let n = 0;
      document.querySelectorAll(sel).forEach(el => {
        if(n >= 6 || !el.getClientRects().length) return;
        if(el.tagName !== "INPUT" && !(el.textContent || "").trim()) return;
        n++;
        const cs = getComputedStyle(el);
        if(cs.visibility === "hidden" || +cs.opacity < .5 || el.disabled) return;
        const fg = parseColor(cs.color), bg = effBg(el);
        if(!fg) return;
        if(fg.a < .15){ bad.push([el, bg]); return; }                                  // fully see-through text
        if(!bg) return;
        if(contrast(over(fg, bg), bg) < 1.8) bad.push([el, bg]);                       // same colour as what's behind it
      });
    });
    const dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
    bad.forEach(([el, bg]) => {
      const useWhite = bg ? lum(bg) < .4 : dark;
      el.style.setProperty("color", useWhite ? "#ffffff" : "#111111", "important"); fixed.push(el);
    });
    if(bad.length) console.info("[theme-guard] repaired unreadable text on " + bad.length + " element(s) in theme “" + (document.body.dataset.theme || "default") + "”");
  }
  let t = 0;
  const later = ms => { clearTimeout(t); t = setTimeout(() => { (window.requestIdleCallback || (f => f()))(check); }, ms); };
  window.__pbThemeGuard = check;
  [1500, 4500, 10000].forEach(ms => setTimeout(check, ms));
  if(document.body) new MutationObserver(() => later(250)).observe(document.body, { attributes: true, attributeFilter: ["data-theme", "style"] });
  try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => later(250)); }catch(e){}
  window.addEventListener("orientationchange", () => later(400));
  window.addEventListener("resize", () => later(600));
  const _sc = setChannel;
  setChannel = function(c){ const r = _sc.apply(this, arguments); later(300); return r; };
})();

;
/* ===== 50-ctabs-js.js ===== */
/* =============== Custom tabs: mods/owners make pages (like Google Docs tabs); everyone sees them.
   Stored only on this device as a cache + in the cloud mailbox (/t) — nothing is hardcoded in this file. =============== */
(function(){
  const $$ = id => document.getElementById(id);
  const LS = "pb_ctabs", LSD = "pb_ctabs_del", MAX = 40, MAXMINE = 3, MAXSUB = 20, MAXALL = 200, MAXHTML = 350000;
  const BUILTIN = ["main","home","gal","polls","shame","draw","tier","games","media","proxy","dm","grp"];   // built-in tabs: never touched by custom tabs
  let tabs = [], tombs = {};
  try{ const a = JSON.parse(localStorage.getItem(LS) || "[]"); if(Array.isArray(a)) tabs = a.filter(t => t && typeof t.id === "string" && typeof t.name === "string").slice(0, MAXALL); }catch(e){}
  try{ const d = JSON.parse(localStorage.getItem(LSD) || "{}"); if(d && typeof d === "object") tombs = d; }catch(e){}
  const isMod = () => { try{ return !!(window.__pbIsMod && window.__pbIsMod()); }catch(e){ return false; } };
  const inRoom = () => { const g = $$("gate"); return !g || getComputedStyle(g).display === "none"; };
  const okId = s => typeof s === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(s) && !BUILTIN.includes(s);
  const cleanName = s => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
  const _seg = (typeof Intl !== "undefined" && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const cleanIc = s => { s = String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, "").trim(); const g = _seg ? Array.from(_seg.segment(s), x => x.segment) : Array.from(s); return g.slice(0, 3).join("").slice(0, 24) || "📄"; };
  const okIm = x => typeof x === "string" && x.length <= 40000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(x);   // custom picture instead of an emoji
  const cleanIm = x => okIm(x) ? x : "";
  const imSig = x => x ? x.length + x.slice(-10) : "";
  /* wallpaper for a tab or subtab: a small picture (data URL) or a plain colour */
  const okWp = x => typeof x === "string" && ((x.length <= 120000 && /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(x)) || /^#[0-9a-fA-F]{6}$/.test(x));
  const cleanWp = x => okWp(x) ? x : "";
  function wpPic(f, cb){
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      for(const [mw, q] of [[900, .72], [720, .6], [560, .5], [420, .45], [300, .4]]){
        const k = Math.min(1, mw / (im.width || 1), (mw * 1.4) / (im.height || 1)), w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
        const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(im, 0, 0, w, h);
        const d = c.toDataURL("image/jpeg", q); if(okWp(d)){ cb(d); return; }
      }
      cb("");
    };
    im.onerror = () => { URL.revokeObjectURL(url); cb(""); };
    im.src = url;
  }
  function squarePic(f, cb){                                   // crop to a small square, keep it under the size limit
    if(f.type === "image/gif" || /\.gif$/i.test(f.name || "")){ const r = new FileReader(); r.onload = e => { const d = String(e.target.result); cb(okIm(d) ? d : ""); }; r.readAsDataURL(f); return; }
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(im.width, im.height) || 1, sx = (im.width - side) / 2, sy = (im.height - side) / 2;
      for(const size of [96, 72, 56, 40]){
        const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(im, sx, sy, side, side, 0, 0, size, size);
        let d = c.toDataURL("image/webp", 0.85); if(!d.startsWith("data:image/webp")) d = c.toDataURL("image/png");
        if(okIm(d)){ cb(d); return; }
      }
      cb("");
    };
    im.onerror = () => { URL.revokeObjectURL(url); cb(""); };
    im.src = url;
  }
  const ACLM = ["mods", "me", "list", "all"];
  const cleanAcl = a => { const m = a && ACLM.includes(a.m) ? a.m : "mods"; const l = (a && Array.isArray(a.l) ? a.l : []).map(x => cleanName(x).slice(0, 12)).filter(Boolean).filter((x, i, arr) => arr.findIndex(y => y.toLowerCase() === x.toLowerCase()) === i).slice(0, 20); return { m, l: m === "list" ? l : [] }; };
  const newId = () => "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const bump = t => { t.v = Math.max(Date.now(), (t.v || 0) + 1); t.eb = ""; };   // eb = who last changed the page's text (set by the live editor, see commit())

  /* ---------- safe HTML: anything that comes from the cloud or a paste goes through this whitelist ---------- */
  const OKTAG = /^(P|BR|B|STRONG|I|EM|U|S|STRIKE|DEL|H1|H2|H3|UL|OL|LI|A|BLOCKQUOTE|HR|CODE|PRE|DIV|IMG|TABLE|THEAD|TBODY|TR|TD|TH|SUB|SUP)$/;
  const DROP = /^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|SVG|MATH|FORM|INPUT|TEXTAREA|SELECT|BUTTON|TEMPLATE|NOSCRIPT|AUDIO|VIDEO|CANVAS|HEAD|TITLE|BASE|FRAME|FRAMESET|APPLET)$/;
  const COLOR = /(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\))\s*(?:;|$)/i;
  const BGCOL = /(?:^|;)\s*background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\))\s*(?:;|$)/i;
  const FSIZE = /(?:^|;)\s*font-size\s*:\s*(\d{2,3})px\s*(?:;|$)/i;
  const ALIGN = /(?:^|;)\s*text-align\s*:\s*(left|center|right)\s*(?:;|$)/i;
  const IMGOK = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/;
  const hrefOk = h => { h = String(h || "").trim(); return /^(https?:\/\/|mailto:)/i.test(h) && h.length < 800 ? h : ""; };
  function clean(html){
    const doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    const out = document.createElement("div");
    (function walk(src, dst, depth){
      if(depth > 400) return;
      src.childNodes.forEach(n => {
        if(n.nodeType === 3){ dst.appendChild(document.createTextNode(n.nodeValue)); return; }
        if(n.nodeType !== 1) return;
        const t = n.tagName;
        if(DROP.test(t)) return;
        if(t === "MARK"){ const s = document.createElement("span"); s.style.backgroundColor = "#fff176"; s.style.color = "#000"; dst.appendChild(s); walk(n, s, depth + 1); return; }
        if(t === "SPAN" || t === "FONT"){
          let c = dst; let st = n.getAttribute("style") || "";
          let col = (st.match(COLOR) || [])[1] || "";
          if(!col && t === "FONT" && /^#[0-9a-f]{3,8}$/i.test(n.getAttribute("color") || "")) col = n.getAttribute("color");
          if(t === "FONT" && /^[1-7]$/.test(n.getAttribute("size") || "") && !/font-size/i.test(st)){ const px = [0, 10, 13, 16, 18, 24, 32, 48][+n.getAttribute("size")]; if(+n.getAttribute("size") !== 3) st = st + ";font-size:" + px + "px"; }
          const bgm = (st.match(BGCOL) || [])[1] || "", fsm = st.match(FSIZE), fsz = fsm ? Math.min(72, Math.max(10, +fsm[1])) : 0;
          if(col || bgm || fsz){ const s = document.createElement("span"); if(col) s.style.color = col; if(bgm) s.style.backgroundColor = bgm; if(fsz) s.style.fontSize = fsz + "px"; c.appendChild(s); c = s; }
          if(/vertical-align\s*:\s*super/i.test(st)){ const b = document.createElement("sup"); c.appendChild(b); c = b; }
          else if(/vertical-align\s*:\s*sub/i.test(st)){ const b = document.createElement("sub"); c.appendChild(b); c = b; }
          if(/font-weight\s*:\s*(bold|[6-9]00)/i.test(st)){ const b = document.createElement("b"); c.appendChild(b); c = b; }
          if(/font-style\s*:\s*italic/i.test(st)){ const b = document.createElement("i"); c.appendChild(b); c = b; }
          if(/text-decoration[^;]*underline/i.test(st)){ const b = document.createElement("u"); c.appendChild(b); c = b; }
          if(/text-decoration[^;]*line-through/i.test(st)){ const b = document.createElement("s"); c.appendChild(b); c = b; }
          walk(n, c, depth + 1); return;
        }
        if(!OKTAG.test(t)){ walk(n, dst, depth + 1); return; }      // unknown but harmless: keep its text
        if(t === "A"){
          const raw = String(n.getAttribute("href") || "").trim(), im = raw.match(/^#ct:([A-Za-z0-9_-]{1,40})$/);
          if(im && okId(im[1])){   // link to another tab / subtab
            const a = document.createElement("a"); a.setAttribute("href", "#ct:" + im[1]); a.setAttribute("data-ct", im[1]);
            { const lc = ((n.getAttribute("style") || "").match(COLOR) || [])[1]; if(lc) a.style.color = lc; }
            dst.appendChild(a); walk(n, a, depth + 1); return;
          }
          const bm = raw.match(/^#tab:(home|main|gal|polls|shame|draw|tier|games)(?::(games|proxy|media|music))?$/);
          if(bm && (!bm[2] || bm[1] === "games")){   // link to a built-in tab (or a Games & Media sub-tab)
            const a = document.createElement("a"); a.setAttribute("href", raw); a.setAttribute("data-tab", bm[1] + (bm[2] ? ":" + bm[2] : ""));
            { const lc = ((n.getAttribute("style") || "").match(COLOR) || [])[1]; if(lc) a.style.color = lc; }
            dst.appendChild(a); walk(n, a, depth + 1); return;
          }
          const h = hrefOk(n.getAttribute("href"));
          if(!h){ walk(n, dst, depth + 1); return; }
          const a = document.createElement("a"); a.href = h; a.target = "_blank"; a.rel = "noopener noreferrer nofollow";
          { const lc = ((n.getAttribute("style") || "").match(COLOR) || [])[1]; if(lc) a.style.color = lc; }
          dst.appendChild(a); walk(n, a, depth + 1); return;
        }
        if(t === "IMG"){
          const s = n.getAttribute("src") || "";
          if(IMGOK.test(s) && s.length < 300000){ const im = document.createElement("img"); im.src = s; im.alt = (n.getAttribute("alt") || "").slice(0, 100); im.loading = "lazy"; im.decoding = "async";
            const wm = String(n.style && n.style.width || "").match(/^(\d{1,3}(?:\.\d+)?)%$/);   // keep a resized width (percent of the page only)
            if(wm){ const w = Math.min(100, Math.max(5, parseFloat(wm[1]))); im.style.width = (Math.round(w * 10) / 10) + "%"; im.style.height = "auto"; }
            dst.appendChild(im); }
          return;
        }
        const e = document.createElement(t.toLowerCase());
        if(/^(P|DIV|H1|H2|H3|LI|BLOCKQUOTE|TD|TH)$/.test(t)){
          const m = (n.getAttribute("style") || "").match(ALIGN) || (/^(left|center|right)$/i.test(n.getAttribute("align") || "") ? [0, n.getAttribute("align").toLowerCase()] : null);
          if(m) e.style.textAlign = m[1].toLowerCase();
        }
        dst.appendChild(e);
        if(t !== "BR" && t !== "HR") walk(n, e, depth + 1);
      });
    })(doc.body, out, 0);
    out.querySelectorAll("a").forEach(a => {
      if(a.style.color) return;
      let x = a.parentElement, c = "";
      while(x && x !== out){ if(x.tagName === "SPAN" && x.style.color){ c = x.style.color; break; } x = x.parentElement; }
      if(!c && a.children.length === 1 && a.children[0].tagName === "SPAN" && a.children[0].style.color && a.textContent === a.children[0].textContent) c = a.children[0].style.color;
      if(c) a.style.color = c;
    });
    return out.innerHTML;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- storage + cloud hook ---------- */
  const persist = () => {
    let ok = false;
    ok = window.__pbSet(LS, JSON.stringify(tabs));
    try{ localStorage.setItem(LSD, JSON.stringify(tombs)); }catch(e){}
    try{ if(window.__tbChanged) window.__tbChanged(); }catch(e){}
    return ok;
  };
  const cmp = (a, b) => ((a.o || 0) - (b.o || 0)) || ((a.v || 0) - (b.v || 0));
  tabs = tabs.filter(t => okId(t.id)); tabs.forEach(t => { if(typeof t.p !== "string") t.p = ""; });
  const tops = () => tabs.filter(t => !t.p).sort(cmp);
  const subsOf = id => tabs.filter(t => t.p === id).sort(cmp);
  const byId = id => tabs.find(t => t.id === id);
  /* who may delete: the person who made it, or an owner/admin (mods can't delete each other's tabs) */
  const isOwner = () => { try{ return !!(window.__pbAdm && window.__pbAdm()); }catch(e){ return false; } };
  const meName = () => String(typeof usr === "string" ? usr : "").trim().toLowerCase();
  const madeByMe = t => !!t && !!t.by && String(t.by).trim().toLowerCase() === meName();
  /* manage (rename / reorder / delete / choose editors) = whoever made it, or an owner. Edit pages + add subtabs = what the creator chose. */
  const canManage = t => !!t && (isOwner() || madeByMe(t) || (!!t.p && madeByMe(byId(t.p))));
  const canDel = canManage;
  const aclOf = t => cleanAcl(t && t.acl);
  const canEdit = t => {
    if(!t) return false; const top = t.p ? byId(t.p) : t; if(!top) return false;
    if(canManage(top)) return true;
    const a = aclOf(top);
    return a.m === "all" ? true : a.m === "mods" ? isMod() : a.m === "list" ? a.l.some(n => n.toLowerCase() === meName()) : false;
  };

  /* ---------- the tab bar, sidebar rows and the + button ---------- */
  const strip = $$("chtabs");
  const plus = document.createElement("button"); plus.type = "button"; plus.className = "ct-plus"; plus.textContent = "＋"; plus.title = "Make a new tab";
  plus.style.order = "999"; strip.appendChild(plus);
  plus.onclick = () => openModal(null, "");
  function buildTabs(){
    const list = tops(), want = new Set(list.map(t => t.id));
    strip.querySelectorAll("button[data-ctid]").forEach(b => { if(!want.has(b.dataset.ctid)) b.remove(); });
    document.querySelectorAll('.row-ch[data-ctid]').forEach(r => { if(!want.has(r.dataset.ctid)) r.remove(); });
    const rows = [];
    list.forEach((t, i) => {
      const key = "ct:" + t.id; let b = strip.querySelector('button[data-ctid="' + t.id + '"]');
      if(!b){ b = document.createElement("button"); b.type = "button"; b.dataset.ctid = t.id; b.dataset.ch = key; b.onclick = () => setChannel(key); strip.insertBefore(b, plus); }
      const sig = imSig(t.im) + "|" + t.ic + "|" + t.name;
      if(b.dataset.sig !== sig){
        b.dataset.sig = sig; b.replaceChildren();
        if(t.im){ const g = new Image(); g.className = "tabimg"; g.alt = ""; g.src = t.im; b.append(g, document.createTextNode(t.name)); }
        else b.textContent = t.ic + " " + t.name;
      }
      if(!(document.body.dataset.theme === "gdocs" && document.body.dataset.hp === "left")){ const so = String(50 + i); if(b.style.order !== so) b.style.order = so; }   /* in the Docs side panel the nested-tab layout owns the order */
      const on = curCh === key; if(b.classList.contains("on") !== on) b.classList.toggle("on", on);
      let r = $$("ch-ct-" + t.id);
      if(!r){
        r = document.createElement("div"); r.className = "row-ch"; r.id = "ch-ct-" + t.id; r.dataset.ctid = t.id;
        const av = document.createElement("div"); av.className = "av-sb"; av.style.fontSize = "18px";
        const w = document.createElement("div"), nm = document.createElement("b"); nm.style.fontSize = "15px";
        const br = document.createElement("br"), sub = document.createElement("span"); sub.className = "csub"; sub.textContent = "Mod page";
        w.append(nm, br, sub); r.append(av, w); r.onclick = () => setChannel(key);
      }
      const av2 = r.firstChild;
      if(t.im){ if(av2.dataset.im !== t.im){ av2.dataset.im = t.im; av2.style.setProperty("background", "url(" + t.im + ") center/cover no-repeat", "important"); } av2.classList.add("hasimg"); if(av2.textContent) av2.textContent = ""; }
      else { if(av2.dataset.im){ delete av2.dataset.im; av2.style.removeProperty("background"); av2.classList.remove("hasimg"); } if(av2.textContent !== t.ic) av2.textContent = t.ic; }
      const rn = r.querySelector("b"); if(rn.textContent !== t.name) rn.textContent = t.name;
      if(r.classList.contains("active") !== on) r.classList.toggle("active", on);
      rows.push(r);
    });
    const anchor = $$("sbroster");
    if(anchor && anchor.parentNode && rows.length){
      let ok = true, n = anchor.previousElementSibling;
      for(let i = rows.length - 1; i >= 0; i--){ if(n !== rows[i]){ ok = false; break; } n = n && n.previousElementSibling; }
      if(!ok) rows.forEach(r => anchor.parentNode.insertBefore(r, anchor));
    }
    refreshMod(); renderSubs();
  }
  function refreshMod(){
    const m = isMod();
    plus.classList.toggle("on-mod", inRoom());
    if(editing && !canEdit(cur())) stopEdit();
    updateBar();
  }
  function updateBar(){
    const it = cur(), top = byId(curId);
    $$("ct-edit").hidden = !(it && canEdit(it));
    const mg = !!it && canManage(it);
    ["ct-set"].forEach(id => { $$(id).hidden = !mg; });
    const add = $$("ct-subs").querySelector(".sub-add"); if(add) add.hidden = !(top && canEdit(top));
    try{ if(window.__ctBarSync) window.__ctBarSync(); }catch(e){}
  }
  /* Docs layout top bar: Rename / Delete / Edit for the open tab (the bar itself is built by the Docs-layout script) */
  window.__ctTop = {
    state(){ const it = cur(), top = byId(curId); return { on: document.body.classList.contains("in-ctab") && !!it, edit: !!it && canEdit(it) && !editing, rename: !!top && canManage(top), del: !!top && canDel(top), sub: !!top && canEdit(top) && subsOf(curId).length < MAXSUB, add: inRoom() }; },
    rename(){ const t = byId(curId); if(!t || !canManage(t)) return; openModal(t, ""); setTimeout(() => { const n = $$("ctm-name"); if(n){ n.focus(); n.select(); } }, 40); },
    del(){ const t = byId(curId); if(!t || !canDel(t)) return; openModal(t, ""); const b = $$("ctm-del"); if(b) b.click(); },   // opens the tab's settings with "Really delete for everyone?" ready to confirm
    edit(){ startEdit(); },
    addSub(){ const t = byId(curId); if(t && canEdit(t)) openModal(null, curId); },
    newTab(){ openModal(null, ""); }
  };

  /* ---------- the page view ---------- */
  const view = document.createElement("div"); view.id = "ctview";
  view.innerHTML =
    '<div class="ct-bar"><div class="ct-title"><b id="ct-ic"></b><span id="ct-nm"></span></div><span class="ct-who" id="ct-who"></span><span class="ct-live" id="ct-live" hidden></span><span class="gm-spacer"></span>' +
      '<div class="ct-mod" id="ct-modbar">' +
        '<button type="button" class="gm-b alt" id="ct-set">⚙ Rename / delete</button>' +
        '<button type="button" class="gm-b pri" id="ct-edit">✎ Edit page</button>' +
      '</div></div>' +
    '<div class="ct-subs" id="ct-subs"></div>' +
    '<div class="ct-scroll"><div class="ct-doc" id="ct-doc"></div>' +
      '<div id="ct-editwrap"><div class="ct-tb" id="ct-tb"></div><div class="ct-ed" id="ct-ed" contenteditable="true" spellcheck="true"></div>' +
      '<div class="ct-efoot"><span class="ct-stat" id="ct-stat" aria-live="polite"></span><span class="ct-stat" id="ct-wc" title="Words · characters"></span><div id="ct-err" role="alert"></div><button type="button" class="gm-b pri" id="ct-save" title="Close the editor (your changes are already saved)">Done</button></div></div>' +
    '</div>';
  $$("box").after(view);
  const doc = $$("ct-doc"), ed = $$("ct-ed"), errEl = $$("ct-err");
  let curId = "", curSub = "", editing = false, subSig = "";
  /* live editing state */
  let liveId = "", knownV = 0, savedHtml = "", lastRemoteHtml = "", hist = new Map(), saveT = 0, firstDirty = 0, composing = false, patching = false, statT = 0, docKey = "", docBlocks = null;
  const liveBy = {};   // page id -> { by, at }: someone else changed this page a moment ago
  const cur = () => { const sb = curSub && byId(curSub); return (sb && sb.p === curId) ? sb : byId(curId); };   // the page being shown (a subtab, or the tab's own page)
  function renderSubs(force){
    const box = $$("ct-subs"), t = byId(curId);
    if(!t){ if(subSig){ box.replaceChildren(); subSig = ""; } return; }
    if(curSub && !(byId(curSub) && byId(curSub).p === curId)) curSub = "";
    const subs = subsOf(curId), sig = curId + "|" + curSub + "|" + subs.map(x => x.id + x.ic + imSig(x.im) + x.name).join(",");
    if(!force && sig === subSig) return; subSig = sig;
    const chip = (label, id, im) => {
      const b = document.createElement("button"); b.type = "button"; b.classList.toggle("on", curSub === id);
      if(im){ const g = new Image(); g.alt = ""; g.src = im; g.style.cssText = "width:18px;height:18px;border-radius:50%;object-fit:cover;vertical-align:-4px;margin-right:6px"; b.append(g, document.createTextNode(label)); } else b.textContent = label;
      b.dataset.sid = id || curId;
      b.onclick = () => { if(editing){ if(autosave() === false) return; stopEdit(); } curSub = id; renderSubs(true); renderPage(); };
      return b;
    };
    const kids = [];
    if(subs.length){ kids.push(chip("📄 Main page", "")); subs.forEach(x => kids.push(chip(x.im ? x.name : x.ic + " " + x.name, x.id, x.im))); }
    const add = document.createElement("button"); add.type = "button"; add.className = "sub-add"; add.textContent = "＋ Subtab"; add.title = "Add a subtab inside this tab";
    add.onclick = () => openModal(null, curId); kids.push(add);
    box.replaceChildren.apply(box, kids); updateBar();
  }
  function renderPage(){
    const top = byId(curId), t = cur(); if(!top || !t) return;
    const hic = $$("ct-ic"); hic.replaceChildren();
    if(top.im){ const g = new Image(); g.alt = ""; g.src = top.im; g.style.cssText = "width:24px;height:24px;border-radius:50%;object-fit:cover;display:block"; hic.appendChild(g); } else hic.textContent = top.ic;
    $$("ct-nm").textContent = top.name;
    { const v = $$("ctview"), w = cleanWp(t.wp) || cleanWp(top.wp);
      if(v){ v.classList.toggle("has-wp", !!w);
        if(!w){ v.style.removeProperty("background-image"); v.style.removeProperty("background-color"); }
        else if(w[0] === "#"){ v.style.backgroundImage = "none"; v.style.backgroundColor = w; }
        else { v.style.backgroundColor = "transparent"; v.style.backgroundImage = "url(" + w + ")"; v.style.backgroundSize = "cover"; v.style.backgroundPosition = "center"; v.style.backgroundRepeat = "no-repeat"; } } }
    const a = aclOf(top);
    $$("ct-who").textContent = a.m === "all" ? "Anyone can edit" : a.m === "mods" ? "Mods can edit" : a.m === "me" ? "Only " + (top.by || "owners") + " can edit" : "Editors: " + [top.by].concat(a.l).filter(Boolean).join(", ");
    const h = nz(t.html), pk = top.id + "/" + t.id;
    if(h.replace(/<[^>]*>/g, "").trim() || /<img|<hr|<table/i.test(h)){
      const nb = splitBlocks(h);
      if(docKey === pk && docBlocks && doc.childNodes.length === docBlocks.length) patchDom(doc, docBlocks, nb, true);   // same page, new text: only touch what changed (live view)
      else doc.innerHTML = h;
      docBlocks = doc.childNodes.length === nb.length ? nb : null; docKey = pk;
    }
    else { doc.innerHTML = '<div class="ct-empty">This page is empty.' + (canEdit(t) ? "<br>Tap “✎ Edit page” to add something." : "") + "</div>"; docBlocks = null; docKey = ""; }
    scheduleAdj(); renderPresence();
  }
  /* =====================================================================================================
     LIVE EDITING (like Google Docs)
       - what you type is saved by itself every few seconds (no Save button) and shared with everyone;
       - while you edit, other people's changes to the same page are merged into your editor as they arrive,
         without moving your cursor (it works paragraph by paragraph, and inside a paragraph when you're
         typing in different places);
       - people just looking at the page see the changes appear live.
     A page is still one record in the cloud (newest version wins), so every version also remembers which
     version it was built from (pv). That is what lets two people's edits be combined instead of one
     overwriting the other.
     ===================================================================================================== */
  const nz = h => clean(clean(h));      // "cleaned twice" = a stable form, so two browsers always agree on whether a page changed
  const blockOf = n => { if(n.nodeType === 1) return n.outerHTML; const w = document.createElement("div"); w.appendChild(n.cloneNode(true)); return w.innerHTML; };
  const splitBlocks = html => { const tp = document.createElement("template"); tp.innerHTML = html; return Array.from(tp.content.childNodes).map(blockOf); };   // the page as a list of top-level pieces (paragraphs, lists, pictures…)
  const meTag = () => String(typeof usr === "string" ? usr : "").slice(0, 12);
  const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  /* which pieces are the same in two lists: [[indexInA, indexInB], …] in order */
  function lcsPairs(a, b){
    const n = a.length, m = b.length; let s = 0;
    while(s < n && s < m && a[s] === b[s]) s++;
    let e = 0; while(e < n - s && e < m - s && a[n - 1 - e] === b[m - 1 - e]) e++;
    const out = []; for(let i = 0; i < s; i++) out.push([i, i]);
    const N = n - s - e, M = m - s - e;
    if(N > 0 && M > 0 && N * M <= 1500000){
      const w = M + 1, L = new Uint16Array((N + 1) * w);
      for(let i = N - 1; i >= 0; i--) for(let j = M - 1; j >= 0; j--) L[i * w + j] = a[s + i] === b[s + j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      let i = 0, j = 0;
      while(i < N && j < M){
        if(a[s + i] === b[s + j]){ out.push([s + i, s + j]); i++; j++; }
        else if(L[(i + 1) * w + j] >= L[i * w + j + 1]) i++; else j++;
      }
    }
    for(let k = 0; k < e; k++) out.push([n - e + k, m - e + k]);
    return out;
  }
  /* caret helpers: a position as "this many characters into the box", so it can be put back after the box is rebuilt */
  const offIn = (root, node, off) => { const r = document.createRange(); r.selectNodeContents(root); r.setEnd(node, off); return r.toString().length; };
  function caretAt(root, off){
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, left = off, last = null;
    while((n = w.nextNode())){ last = n; if(left <= n.nodeValue.length) return [n, left]; left -= n.nodeValue.length; }
    return last ? [last, last.nodeValue.length] : [root, 0];
  }
  function flashEl(n){ n.classList.add("ct-flash"); const off = () => n.classList.remove("ct-flash"); n.addEventListener("animationend", off, { once: true }); setTimeout(off, 2200); }
  /* change a box from the pieces it shows (liveB) to the pieces it should show (tgtB), touching only the pieces that differ,
     so the cursor, scroll position and pictures that didn't change are left alone */
  function patchDom(box, liveB, tgtB, flash){
    const kids = Array.from(box.childNodes), pairs = lcsPairs(liveB, tgtB), keep = new Set(pairs.map(p => p[0]));
    let rem = null;
    try{   // the caret sits in a piece that is about to be replaced: remember where in it
      const sl = getSelection();
      if(sl.rangeCount && box.contains(sl.anchorNode)){
        const ai = kids.findIndex(k => k === sl.anchorNode || k.contains(sl.anchorNode));
        if(ai >= 0 && !keep.has(ai)){ let prev = null; for(let i = ai - 1; i >= 0; i--) if(keep.has(i)){ prev = kids[i]; break; } rem = { prev, off: offIn(kids[ai], sl.anchorNode, sl.anchorOffset) }; }
      }
    }catch(e){}
    kids.forEach((k, i) => { if(!keep.has(i)) k.remove(); });
    const at = new Map(pairs.map(p => [p[1], kids[p[0]]])), made = new Set(); let ref = null;
    for(let j = tgtB.length - 1; j >= 0; j--){
      if(at.has(j)){ ref = at.get(j); continue; }
      const tp = document.createElement("template"); tp.innerHTML = tgtB[j];
      const ns = Array.from(tp.content.childNodes);
      ns.forEach(n => { box.insertBefore(n, ref); made.add(n); if(flash && n.nodeType === 1) flashEl(n); });
      if(ns.length) ref = ns[0];
    }
    if(rem){ try{
      const cand = rem.prev ? rem.prev.nextSibling : box.firstChild;
      if(cand && made.has(cand)){ const [n, o] = caretAt(cand, rem.off), r = document.createRange(); r.setStart(n, o); r.collapse(true); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(r); }
    }catch(e){} }
  }
  function fullReplace(html){   // fallback when the editor's pieces can't be matched one by one
    let a = null, f = null;
    try{ const sl = getSelection(); if(sl.rangeCount && ed.contains(sl.anchorNode) && ed.contains(sl.focusNode)){ a = offIn(ed, sl.anchorNode, sl.anchorOffset); f = offIn(ed, sl.focusNode, sl.focusOffset); } }catch(e){}
    ed.innerHTML = html;
    if(a != null){ try{ const x = caretAt(ed, a), y = caretAt(ed, f); getSelection().setBaseAndExtent(x[0], x[1], y[0], y[1]); }catch(e){} }
  }
  function edBlocks(){
    ed.normalize();
    const html = nz(ed.innerHTML), blocks = splitBlocks(html), kids = ed.childNodes;
    let ok = kids.length === blocks.length;
    for(let i = 0; ok && i < kids.length; i++){
      const k = kids[i], b = blocks[i];
      if(k.nodeType === 1){ const L = k.tagName.length; if(b.charAt(0) !== "<" || b.slice(1, L + 1).toLowerCase() !== k.tagName.toLowerCase() || !/[\s>\/]/.test(b.charAt(L + 1))) ok = false; }
      else if(k.nodeType !== 3 || b.charAt(0) === "<") ok = false;
    }
    return { html, blocks, ok };
  }

  /* ----- combining two people's edits ----- */
  const VOIDT = /^(br|hr|img)$/i;
  function balanced(f){   // a piece of html with every tag opened and closed inside it (so it can be cut out and moved safely)
    const st = [], re = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi; let m;
    while((m = re.exec(f))){ const tag = m[2].toLowerCase(); if(VOIDT.test(tag)) continue; if(m[1]){ if(st.pop() !== tag) return false; } else st.push(tag); }
    const rest = f.replace(re, ""); return st.length === 0 && rest.indexOf("<") < 0 && rest.indexOf(">") < 0;
  }
  function leftSafe(a, p){   // move a cut point left until it isn't inside a tag or an &entity;
    for(let g = 0; g < 4; g++){
      const lt = a.lastIndexOf("<", p - 1), gt = a.lastIndexOf(">", p - 1);
      if(p > 0 && lt > gt){ p = lt; continue; }
      const am = a.lastIndexOf("&", p - 1), sc = a.lastIndexOf(";", p - 1);
      if(p > 0 && am > sc && p - am <= 10){ p = am; continue; }
      break;
    }
    return p;
  }
  function rightSafe(a, e){
    for(let g = 0; g < 4; g++){
      const lt = a.lastIndexOf("<", e - 1), gt = a.lastIndexOf(">", e - 1);
      if(e > 0 && lt > gt){ const k = a.indexOf(">", e); e = k < 0 ? a.length : k + 1; continue; }
      const am = a.lastIndexOf("&", e - 1), sc = a.lastIndexOf(";", e - 1);
      if(e > 0 && am > sc && e - am <= 10){ const k = a.indexOf(";", e); if(k >= 0 && k - am <= 10){ e = k + 1; continue; } }
      break;
    }
    return e;
  }
  function diffRange(a, b){   // the one stretch of a that b replaced: { s, e, rep }
    const n = a.length, m = b.length, lim = Math.min(n, m); let p = 0, q = 0;
    while(p < lim && a.charCodeAt(p) === b.charCodeAt(p)) p++;
    while(q < lim - p && a.charCodeAt(n - 1 - q) === b.charCodeAt(m - 1 - q)) q++;
    p = leftSafe(a, p); const e = rightSafe(a, n - q); q = n - e;
    return { s: p, e, rep: b.slice(p, m - q) };
  }
  /* base = the text before; mine / theirs = two edits of it. Works when the two edits are in different places. null = they overlap */
  function mergeText(base, mine, theirs){
    const A = diffRange(base, mine), B = diffRange(base, theirs);
    if(!balanced(base.slice(A.s, A.e)) || !balanced(A.rep) || !balanced(base.slice(B.s, B.e)) || !balanced(B.rep)) return null;
    const before = (x, y) => x.e < y.s || (x.e === y.s && !(x.s === x.e && y.s === y.e));   // x ends before y starts
    if(before(A, B)) return base.slice(0, A.s) + A.rep + base.slice(A.e, B.s) + B.rep + base.slice(B.e);
    if(before(B, A)) return base.slice(0, B.s) + B.rep + base.slice(B.e, A.s) + A.rep + base.slice(A.e);
    return null;
  }
  function hunksOf(base, side, who){   // what `side` changed compared to `base`: replace base[s..e) with rep
    const out = []; let i = 0, j = 0;
    lcsPairs(base, side).concat([[base.length, side.length]]).forEach(p => { if(p[0] > i || p[1] > j) out.push({ s: i, e: p[0], rep: side.slice(j, p[1]), who }); i = p[0] + 1; j = p[1] + 1; });
    return out;
  }
  /* three-way merge of page pieces. base = common ancestor, mine = my editor, theirs = the newest cloud version.
     Where both of us changed the very same spot in a way that can't be combined, the cloud version wins (so everybody ends up with the same page). */
  function merge3(base, mine, theirs){
    let conflicts = 0;
    const all = hunksOf(base, mine, 0).concat(hunksOf(base, theirs, 1)).sort((x, y) => (x.s - y.s) || ((x.e - x.s) - (y.e - y.s)) || (x.who - y.who));
    const groups = []; let g = null;
    all.forEach(h => {
      if(g && (h.s < g.e || (h.s === g.s && g.s === g.e && h.e === h.s))){ g.items.push(h); g.e = Math.max(g.e, h.e); }
      else groups.push(g = { s: h.s, e: h.e, items: [h] });
    });
    const mergeSeg = (B0, M, T) => {
      if(B0.length && M.length === B0.length && T.length === B0.length){   // same number of pieces: typing in the same paragraph(s)
        const r = []; let ok = true;
        for(let i = 0; i < B0.length && ok; i++){
          const b = B0[i], m = M[i], t = T[i];
          if(m === t || t === b) r.push(m); else if(m === b) r.push(t);
          else { const x = mergeText(b, m, t); if(x == null) ok = false; else r.push(x); }
        }
        if(ok) return r;
      }
      const x = mergeText(B0.join(""), M.join(""), T.join(""));
      if(x != null) return splitBlocks(nz(x));
      if(!B0.length) return T.concat(M);        // both added something new in the same spot: keep both
      conflicts++; return T;
    };
    const out = []; let pos = 0;
    groups.forEach(gr => {
      for(let i = pos; i < gr.s; i++) out.push(base[i]);
      pos = gr.e;
      const seg = who => { let r = [], p = gr.s; gr.items.filter(h => h.who === who).forEach(h => { r = r.concat(base.slice(p, h.s), h.rep); p = h.e; }); return r.concat(base.slice(p, gr.e)); };
      const B0 = base.slice(gr.s, gr.e), M = seg(0), T = seg(1);
      const hasM = gr.items.some(h => h.who === 0), hasT = gr.items.some(h => h.who === 1);
      const res = !hasM ? T : !hasT ? M : sameList(M, T) ? M : sameList(M, B0) ? T : sameList(T, B0) ? M : mergeSeg(B0, M, T);
      res.forEach(x => out.push(x));
    });
    for(let i = pos; i < base.length; i++) out.push(base[i]);
    return { out, conflicts };
  }

  /* ----- saving and merging ----- */
  const remember = (v, h) => { hist.set(v, h); while(hist.size > 12) hist.delete(hist.keys().next().value); };   // pages as they were at recent versions (the "common ancestor" for merging)
  function setStatus(txt, hold){
    const el = $$("ct-stat"); if(!el) return; el.textContent = txt; clearTimeout(statT);
    if(hold) statT = setTimeout(() => { if(editing) el.textContent = "✓ Saved"; }, hold);
  }
  function commit(t, html){   // write my editor's text into the page record; it gets sent to everyone by the cloud sync
    const o = { html: t.html, pv: t.pv, v: t.v, eb: t.eb };
    t.pv = t.v || 0; t.html = html; bump(t); t.eb = meTag();
    if(!persist()){ Object.assign(t, o); return false; }
    remember(t.v, html); knownV = t.v; savedHtml = html;
    try{ if(window.__tbBoost) window.__tbBoost(); }catch(e){}
    return true;
  }
  function autosave(){
    clearTimeout(saveT); firstDirty = 0;
    if(!editing) return true;
    const t = cur(); if(!t || t.id !== liveId) return true;
    if(!canEdit(t)){ errEl.textContent = "You don’t have permission to edit this tab."; return false; }
    if(composing){ saveT = setTimeout(autosave, 500); return true; }
    const html = nz(ed.innerHTML);
    if(html === savedHtml){ setStatus("✓ Saved"); return true; }
    if(html.length > MAXHTML){ errEl.textContent = "This page is too big (" + Math.round(html.length / 1000) + " KB, max " + Math.round(MAXHTML / 1000) + " KB). Remove or shrink some pictures."; setStatus("Not saved"); return false; }
    if(!commit(t, html)){ errEl.textContent = "This device is out of storage space. Use smaller pictures."; setStatus("Not saved"); return false; }
    errEl.textContent = ""; setStatus("✓ Saved"); return true;
  }
  function markDirty(){   // something changed in the editor: save soon (after a short pause, and at the latest every ~4 seconds while typing)
    if(!editing) return;
    const now = Date.now(); if(!firstDirty) firstDirty = now;
    clearTimeout(saveT); saveT = setTimeout(autosave, Math.max(0, Math.min(1500, firstDirty + 4000 - now)));
    try{ if(window.__tbBoost) window.__tbBoost(); }catch(e){}
  }
  /* a newer version of the page I'm editing arrived from the cloud: fold it into my editor, then save the combined page */
  function liveMerge(){
    const t = cur(); if(!editing || !t || t.id !== liveId || t.v === knownV) return;
    if(composing){ setTimeout(liveMerge, 400); return; }
    const theirs = nz(t.html), E = edBlocks(), mine = E.html;
    const anc = hist.has(t.pv) ? hist.get(t.pv) : lastRemoteHtml;      // the version they built theirs from, if I know it
    remember(t.v, theirs); lastRemoteHtml = theirs; knownV = t.v;
    let merged, conflicts = 0;
    if(mine === theirs) merged = mine;
    else if(mine === anc) merged = theirs;                               // I hadn't changed anything: just take theirs
    else if(theirs === anc) merged = mine;                               // they only changed something else (name, picture…)
    else { const r = merge3(splitBlocks(anc), E.blocks, splitBlocks(theirs)); merged = nz(r.out.join("")); conflicts = r.conflicts; }
    if(merged !== mine){
      patching = true;
      try{ if(E.ok) patchDom(ed, E.blocks, splitBlocks(merged), true); else fullReplace(merged); }
      finally{ mo.takeRecords(); patching = false; }
      scheduleAdj();
    }
    savedHtml = theirs;
    if(merged !== theirs){ if(!commit(t, merged)){ errEl.textContent = "This device is out of storage space. Use smaller pictures."; } }
    if(conflicts) setStatus("Someone changed the same spot at the same time — their version was kept.", 6000);
    renderPresence();
  }
  const mo = new MutationObserver(recs => {
    if(patching || !editing) return;
    if(recs.some(r => r.type !== "attributes" || !(r.attributeName === "style" && r.target.nodeType === 1 && r.target.hasAttribute("data-adj") && r.target.tagName !== "IMG"))) markDirty();   // (colour fix-ups the page makes by itself don't count)
  });
  mo.observe(ed, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["style", "src", "href", "alt", "color", "width", "height"] });
  ed.addEventListener("input", () => { if(editing) setStatus("Editing…"); markDirty(); });
  ed.addEventListener("compositionstart", () => { composing = true; });
  ed.addEventListener("compositionend", () => { composing = false; markDirty(); });
  document.addEventListener("visibilitychange", () => { if(document.hidden && editing) autosave(); });
  window.addEventListener("pagehide", () => { if(editing) autosave(); });

  /* who is changing this page right now (shown as a green dot) */
  const isLive = id => { const r = liveBy[id]; return !!r && Date.now() - r.at < 12000; };
  function renderPresence(){
    const box = $$("ct-live"), t = cur();
    if(box){ const r = t && isLive(t.id) ? liveBy[t.id] : null; box.hidden = !r; if(r) box.textContent = (editing ? "Also editing: " : "✏️ ") + r.by + (editing ? "" : " is editing…"); }
    $$("ct-subs").querySelectorAll("button[data-sid]").forEach(b => b.classList.toggle("live", isLive(b.dataset.sid)));
    strip.querySelectorAll("button[data-ctid]").forEach(b => { const id = b.dataset.ctid; b.classList.toggle("live", isLive(id) || subsOf(id).some(s => isLive(s.id))); });
  }
  setInterval(renderPresence, 1000);

  function stopEdit(){
    editing = false; liveId = ""; clearTimeout(saveT); firstDirty = 0; composing = false; hist = new Map();
    $$("ct-editwrap").classList.remove("on"); doc.style.display = ""; $$("ct-edit").style.display = ""; errEl.textContent = ""; setStatus("");
    try{ if(window.__ctBarSync) window.__ctBarSync(); }catch(e){}
  }
  function startEdit(){
    const t = cur(); if(!t || !canEdit(t)) return;
    const h = nz(t.html);
    editing = true; liveId = t.id; hist = new Map(); remember(t.v || 0, h); lastRemoteHtml = savedHtml = h; knownV = t.v || 0;
    patching = true; ed.innerHTML = h; mo.takeRecords(); patching = false;
    errEl.textContent = ""; setStatus("✓ Saved"); scheduleAdj();
    doc.style.display = "none"; $$("ct-edit").style.display = "none"; $$("ct-editwrap").classList.add("on");
    try{ if(window.__ctBarSync) window.__ctBarSync(); }catch(e){}
    try{ if(window.__tbBoost) window.__tbBoost(); if(window.__tbPull) window.__tbPull(); }catch(e){}   // look for newer changes right away
    setTimeout(() => ed.focus(), 30);
  }
  function finishEdit(){ if(autosave() === false) return; stopEdit(); renderPage(); }
  $$("ct-edit").onclick = startEdit; $$("ct-save").onclick = finishEdit;


  /* ---------- auto contrast: text / pictures that vanish against this theme get brightened or inverted (display only, never saved) ---------- */
  const _cx = document.createElement("canvas").getContext("2d");
  function parseColor(str){
    if(!str) return null; _cx.fillStyle = "#000"; _cx.fillStyle = String(str); const v = String(_cx.fillStyle);
    let m = /^#([0-9a-f]{6})$/i.exec(v); if(m){ const n = parseInt(m[1], 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 }; }
    m = /^rgba?\(([^)]+)\)/.exec(v); if(m){ const q = m[1].split(",").map(parseFloat); return { r: q[0], g: q[1], b: q[2], a: q.length > 3 ? q[3] : 1 }; }
    m = /^color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?/i.exec(v); if(m) return { r: m[1] * 255, g: m[2] * 255, b: m[3] * 255, a: m[4] == null ? 1 : +m[4] };
    return null;
  }
  const relLum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const contrast = (a, b) => { const x = relLum(a), y = relLum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  function toHsl(c){ const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, sa = 0;
    if(mx !== mn){ const d = mx - mn; sa = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, sa, l]; }
  function fromHsl(h, sa, l){ const f = (p, q, t) => { if(t < 0) t += 1; if(t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    let r, g, b; if(!sa){ r = g = b = l; } else { const q = l < .5 ? l * (1 + sa) : l + sa - l * sa, pp = 2 * l - q; r = f(pp, q, h + 1 / 3); g = f(pp, q, h); b = f(pp, q, h - 1 / 3); }
    return { r: r * 255, g: g * 255, b: b * 255, a: 1 }; }
  const css = c => "rgb(" + Math.round(c.r) + "," + Math.round(c.g) + "," + Math.round(c.b) + ")";
  function bgOf(el){
    for(let x = el; x && x.nodeType === 1; x = x.parentElement){ const c = parseColor(getComputedStyle(x).backgroundColor); if(c && c.a >= .6) return c; }
    return parseColor(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  }
  function fixContrast(rgb, bg){
    if(contrast(rgb, bg) >= 3) return null;                       // readable already
    const hsl = toHsl(rgb), inv = fromHsl(hsl[0], hsl[1], 1 - hsl[2]);   // e.g. white on a light theme -> black
    if(contrast(inv, bg) >= 4.5) return css(inv);
    const dir = relLum(bg) < .5 ? 1 : -1; let l = 1 - hsl[2], c = inv;
    for(let i = 0; i < 30 && contrast(c, bg) < 4.5; i++){ l = Math.min(1, Math.max(0, l + dir * .04)); c = fromHsl(hsl[0], hsl[1], l); }
    return css(c);
  }
  const imgInfo = new Map();
  function analyse(src){
    if(imgInfo.has(src)) return imgInfo.get(src);
    const o = { ready: false }; imgInfo.set(src, o); const im = new Image();
    im.onload = () => { try{
      const S = 48, r = Math.min(1, S / Math.max(im.naturalWidth, im.naturalHeight, 1)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * r)); c.height = Math.max(1, Math.round(im.naturalHeight * r));
      const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0, lum = 0, sat = 0;
      for(let i = 0; i < d.length; i += 4){ if(d[i + 3] < 40) continue; n++; const R = d[i], G = d[i + 1], B = d[i + 2], mx = Math.max(R, G, B), mn = Math.min(R, G, B); lum += (.2126 * R + .7152 * G + .0722 * B) / 255; sat += mx ? (mx - mn) / mx : 0; }
      o.opaque = n / (c.width * c.height); o.lum = n ? lum / n : .5; o.sat = n ? sat / n : 0; o.ready = true; scheduleAdj();
    }catch(e){} };
    im.src = src; return o;
  }
  function imgFix(o, dark){
    const gray = o.sat < .15, clear = o.opaque < .75;
    if(dark){ if(gray){ if(clear && o.lum < .4) return "inv"; if(!clear && o.lum > .8) return "inv"; } else if(clear && o.lum < .3) return "bright"; }
    else { if(gray){ if(clear && o.lum > .6) return "inv"; if(!clear && o.lum < .2) return "inv"; } else if(clear && o.lum > .8) return "dim"; }
    return "";
  }
  function pbAdjust(root){
    if(!root) return;
    const dark = relLum(bgOf(root)) < .45;
    root.querySelectorAll('[style*="color"]').forEach(el => {
      const rgb = parseColor(el.style.color); if(!rgb || el.tagName === "IMG") return;
      const fx = fixContrast(rgb, bgOf(el));
      if(fx){ if(el.getAttribute("data-adj") !== "1") el.setAttribute("data-adj", "1"); if(el.style.getPropertyValue("--adj") !== fx) el.style.setProperty("--adj", fx); }
      else if(el.hasAttribute("data-adj")){ el.removeAttribute("data-adj"); el.style.removeProperty("--adj"); }
    });
    root.querySelectorAll("img").forEach(im => {
      const src = im.getAttribute("src") || ""; if(!/^data:image\//.test(src)) return;
      const o = analyse(src); const f = o.ready ? imgFix(o, dark) : "";
      if(f){ if(im.getAttribute("data-imf") !== f) im.setAttribute("data-imf", f); } else if(im.hasAttribute("data-imf")) im.removeAttribute("data-imf");
    });
  }
  let adjT = 0, adjSig = "";
  function scheduleAdj(){ clearTimeout(adjT); adjT = setTimeout(() => { try{ pbAdjust(doc); pbAdjust(ed); }catch(e){} }, 120); }
  setInterval(() => { if(document.hidden) return; try{ const sg = css(bgOf(doc)) + "|" + css(bgOf(ed)); if(sg !== adjSig){ adjSig = sg; scheduleAdj(); } }catch(e){} }, 1000);
  ed.addEventListener("input", scheduleAdj);

  /* ---------- text colour that also sticks on links: after the browser's own foreColor, fix anything it skipped ---------- */
  function authoredColor(node){
    for(let x = node.parentElement; x && x !== ed; x = x.parentElement){
      if(x.style && x.style.color){ return parseColor(x.style.color); }
      if(x.tagName === "FONT" && x.getAttribute("color")) return parseColor(x.getAttribute("color"));
    }
    return null;
  }
  const sameCol = (a, b) => !!a && !!b && Math.abs(a.r - b.r) < 2 && Math.abs(a.g - b.g) < 2 && Math.abs(a.b - b.b) < 2;
  function textNodesIn(range){
    const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode, out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while((n = w.nextNode())){
      if(!n.nodeValue.trim() || !range.intersectsNode(n)) continue;
      if(n === range.startContainer && range.startOffset >= n.length) continue;
      if(n === range.endContainer && range.endOffset === 0) continue;
      out.push(n);
    }
    return out;
  }
  function forceColor(range, color){
    const want = parseColor(color); if(!want || !range || range.collapsed) return;
    let sc = range.startContainer, so = range.startOffset, ec = range.endContainer, eo = range.endOffset;
    if(ec.nodeType === 3 && eo > 0 && eo < ec.length) ec.splitText(eo);                    // cut the end first, so offsets in a one-node selection stay right
    if(sc.nodeType === 3 && so > 0 && so < sc.length){ const t = sc.splitText(so); if(sc === ec) ec = t; sc = t; so = 0; }
    const r2 = document.createRange(); r2.setStart(sc, so); r2.setEnd(ec, ec.nodeType === 3 ? Math.min(ec.length, eo > ec.length ? ec.length : (ec === sc ? ec.length : eo)) : eo);
    const nodes = textNodesIn(r2.collapsed ? range : r2);
    nodes.forEach(n => {
      if(sameCol(authoredColor(n), want)) return;
      const sp = document.createElement("span"); sp.style.color = color; n.parentNode.insertBefore(sp, n); sp.appendChild(n);   // wrapped inside a link too, so it beats the link's own blue
    });
    ed.querySelectorAll("a").forEach(a => {                                              // whole link recoloured: colour its underline as well
      if(!range.intersectsNode(a)) return;
      const tn = []; const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT); let x; while((x = w.nextNode())) if(x.nodeValue.trim()) tn.push(x);
      if(!tn.length) return;
      if(tn.every(t => nodes.indexOf(t) >= 0)){                                    // the whole link was selected: one colour, on the link
        a.querySelectorAll("[style*='color'],font").forEach(el => {
          el.style.removeProperty("color"); el.removeAttribute("color");
          if(el.tagName === "FONT" || (el.tagName === "SPAN" && !el.getAttribute("style") && !el.attributes.length)){ while(el.firstChild) el.parentNode.insertBefore(el.firstChild, el); el.remove(); }
        });
        a.style.color = color;
      } else if(tn.every(t => sameCol(authoredColor(t), want))) a.style.color = color;
    });
    try{ const f = nodes[0], l = nodes[nodes.length - 1]; if(f && l){ const sl = getSelection(), nr = document.createRange(); nr.setStart(f, 0); nr.setEnd(l, l.length); sl.removeAllRanges(); sl.addRange(nr); } }catch(e){}
  }

  /* ---------- editor toolbar ---------- */
  const tb = $$("ct-tb");
  const cmd = (c, a) => { ed.focus(); try{ document.execCommand(c, false, a); }catch(e){} };
  const BTN = [
    ["B", "Bold", () => cmd("bold")], ["I", "Italic", () => cmd("italic")], ["U", "Underline", () => cmd("underline")], ["S", "Strikethrough", () => cmd("strikeThrough")], "|",
    ["H1", "Big heading", () => cmd("formatBlock", "<h1>")], ["H2", "Heading", () => cmd("formatBlock", "<h2>")], ["H3", "Small heading", () => cmd("formatBlock", "<h3>")], ["¶", "Normal text", () => cmd("formatBlock", "<p>")], ["❝", "Quote", () => cmd("formatBlock", "<blockquote>")], "|",
    ["• List", "Bulleted list", () => cmd("insertUnorderedList")], ["1. List", "Numbered list", () => cmd("insertOrderedList")], "|",
    ["⇤", "Align left", () => cmd("justifyLeft")], ["↔", "Center", () => cmd("justifyCenter")], ["⇥", "Align right", () => cmd("justifyRight")], "|",
    ["🔗", "Add link", addLink], ["Unlink", "Remove link", () => cmd("unlink")], ["―", "Divider line", () => cmd("insertHorizontalRule")], "|",
    ["x²", "Superscript", () => cmd("superscript")], ["x₂", "Subscript", () => cmd("subscript")], ["</>", "Code block", () => cmd("formatBlock", "<pre>")], ["☐", "Checklist item", () => cmd("insertText", "☐ ")], "|",
    ["▦", "Insert table", insTable], ["+Row", "Add a row to the table at the cursor", () => tblEdit("row")], ["+Col", "Add a column to the table at the cursor", () => tblEdit("col")], ["−Tbl", "Delete the table at the cursor", () => tblEdit("del")], "|",
    ["Aa", "Change case (UPPER → lower → Title)", cycleCase], ["📅", "Insert today's date", () => cmd("insertText", new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }))], ["Ω", "Insert a special character", insSym], ["🔍", "Find & replace", findRep], "|",
    ["Tx", "Clear formatting", () => cmd("removeFormat")], ["↶", "Undo", () => cmd("undo")], ["↷", "Redo", () => cmd("redo")]
  ];
  /* ---- advanced editing helpers ---- */
  function inTable(){ const s = getSelection(); if(!s.rangeCount) return null; let n = s.anchorNode; n = n && n.nodeType === 3 ? n.parentElement : n; const c = n && n.closest ? n.closest("td,th") : null; return c && ed.contains(c) ? c : null; }
  function insTable(){
    const r = parseInt(prompt("Rows (1-30)?", "3"), 10), c = parseInt(prompt("Columns (1-10)?", "3"), 10);
    if(!(r >= 1 && c >= 1)) return; const R = Math.min(30, r), C = Math.min(10, c);
    let h = "<table><tbody>"; for(let i = 0; i < R; i++){ h += "<tr>"; for(let j = 0; j < C; j++) h += "<td><br></td>"; h += "</tr>"; } h += "</tbody></table><p><br></p>";
    cmd("insertHTML", h); markDirty();
  }
  function tblEdit(kind){
    const td = inTable(); if(!td){ errEl.textContent = "Put the cursor inside a table first."; return; } errEl.textContent = "";
    const tr = td.parentElement, tbl = td.closest("table"), idx = Array.prototype.indexOf.call(tr.children, td);
    if(kind === "row"){ const nr = document.createElement("tr"); for(let i = 0; i < tr.children.length; i++){ const x = document.createElement("td"); x.innerHTML = "<br>"; nr.appendChild(x); } tr.after(nr); }
    else if(kind === "col"){ if(tr.children.length >= 10) return; tbl.querySelectorAll("tr").forEach(r => { const x = document.createElement("td"); x.innerHTML = "<br>"; const ref = r.children[idx]; if(ref) ref.after(x); else r.appendChild(x); }); }
    else if(kind === "del"){ tbl.remove(); }
    markDirty();
  }
  let caseStep = 0;
  function cycleCase(){
    const s = getSelection(); if(!s.rangeCount || s.isCollapsed || !ed.contains(s.getRangeAt(0).commonAncestorContainer)){ errEl.textContent = "Select some text first."; return; } errEl.textContent = "";
    const t = String(s), m = [x => x.toUpperCase(), x => x.toLowerCase(), x => x.toLowerCase().replace(/(^|[\s\-(])(\S)/g, (a, b, c) => b + c.toUpperCase())];
    cmd("insertText", m[caseStep++ % 3](t));
  }
  function insSym(){
    const set = "© ® ™ § ¶ † ‡ • … – — ± × ÷ ≠ ≈ ≤ ≥ ∞ √ ∑ π µ ° ′ ″ ← → ↑ ↓ ↔ ⇒ ✓ ✗ ★ ☆ ♥ ♦ ♣ ♠ € £ ¥ ¢";
    const pick = prompt("Type or paste a character, or pick a number 1-" + set.split(" ").length + ":\n" + set.split(" ").map((c, i) => (i + 1) + "=" + c).join("  "));
    if(pick == null || pick === "") return;
    const arr = set.split(" "), n = /^\d+$/.test(pick.trim()) ? arr[parseInt(pick, 10) - 1] : pick;
    if(n) cmd("insertText", n);
  }
  function findRep(){
    const f = prompt("Find what?"); if(!f) return; const r = prompt("Replace with? (leave empty to just count matches)", ""); if(r == null) return;
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT), nodes = []; let x, n = 0; while((x = w.nextNode())) nodes.push(x);
    const lf = f.toLowerCase();
    nodes.forEach(t => { const v = t.nodeValue, lv = v.toLowerCase(); let i = lv.indexOf(lf), out = "", last = 0, c = 0; if(i < 0) return;
      while(i >= 0){ out += v.slice(last, i) + (r === "" ? v.slice(i, i + f.length) : r); last = i + f.length; c++; i = lv.indexOf(lf, last); }
      n += c; if(r !== ""){ t.nodeValue = out + v.slice(last); } });
    errEl.textContent = n ? (r === "" ? n + " match" + (n > 1 ? "es" : "") + " found." : "Replaced " + n + ".") : "Nothing found.";
    if(n && r !== "") markDirty();
  }

  BTN.forEach(x => {
    if(x === "|"){ const s = document.createElement("span"); s.className = "ct-sep"; tb.appendChild(s); return; }
    const b = document.createElement("button"); b.type = "button"; b.textContent = x[0]; b.title = x[1]; b.setAttribute("aria-label", x[1]);
    b.onmousedown = e => e.preventDefault(); b.onclick = x[2]; tb.appendChild(b);
  });
  /* font size + highlight colour + paragraph spacing, remembering the selection */
  (function(){
    let saved = null;
    const grab = () => { const sl = getSelection(); if(sl.rangeCount && ed.contains(sl.getRangeAt(0).commonAncestorContainer)) saved = sl.getRangeAt(0).cloneRange(); };
    const back = () => { ed.focus(); if(saved){ const sl = getSelection(); sl.removeAllRanges(); sl.addRange(saved); } };
    const fs = document.createElement("select"); fs.title = "Text size"; fs.setAttribute("aria-label", "Text size");
    fs.innerHTML = '<option value="">Size</option>' + [12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map(n => '<option value="' + n + '">' + n + ' px</option>').join("") + '<option value="0">Reset size</option>';
    fs.onmousedown = grab; fs.addEventListener("touchstart", grab, { passive: true }); fs.addEventListener("focus", grab);
    fs.onchange = () => {
      const v = fs.value; fs.value = ""; if(v === "") return; back();
      if(v === "0"){ ed.querySelectorAll("span[style*='font-size']").forEach(sp => { const s2 = getSelection(); if(s2.rangeCount && s2.getRangeAt(0).intersectsNode(sp)){ sp.style.removeProperty("font-size"); if(!sp.getAttribute("style")){ while(sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); } } }); markDirty(); return; }
      try{ document.execCommand("styleWithCSS", false, false); document.execCommand("fontSize", false, "7"); }catch(e){}
      ed.querySelectorAll('font[size="7"]').forEach(f => { const sp = document.createElement("span"); sp.style.fontSize = v + "px"; while(f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); });
      grab(); markDirty();
    };
    tb.appendChild(fs);
    const lab = document.createElement("label"); lab.title = "Highlight colour"; lab.textContent = "🖍️";
    const ci = document.createElement("input"); ci.type = "color"; ci.value = "#fff176"; lab.appendChild(ci);
    lab.onmousedown = grab; lab.addEventListener("pointerdown", grab); lab.addEventListener("touchstart", grab, { passive: true });
    const paint = () => { back(); try{ document.execCommand("styleWithCSS", false, true); if(!document.execCommand("hiliteColor", false, ci.value)) document.execCommand("backColor", false, ci.value); document.execCommand("styleWithCSS", false, false); }catch(e){} grab(); scheduleAdj(); markDirty(); };
    ci.oninput = paint; ci.onchange = paint; tb.appendChild(lab);
    const nh = document.createElement("button"); nh.type = "button"; nh.textContent = "✕🖍"; nh.title = "Remove highlight"; nh.setAttribute("aria-label", "Remove highlight");
    nh.onmousedown = e => e.preventDefault();
    nh.onclick = () => { back(); try{ document.execCommand("styleWithCSS", false, true); document.execCommand("hiliteColor", false, "transparent"); document.execCommand("styleWithCSS", false, false); }catch(e){} grab(); markDirty(); };
    tb.appendChild(nh);
  })();
  /* live word / character count */
  (function(){
    const wc = $$("ct-wc");
    const upd = () => { if(!wc) return; const t = (ed.innerText || "").trim(), w = t ? t.split(/\s+/).length : 0; wc.textContent = w + " word" + (w === 1 ? "" : "s") + " · " + t.length + " chars"; };
    ed.addEventListener("input", upd); ed.addEventListener("keyup", upd); setInterval(() => { if(editing) upd(); }, 1500);
  })();
  /* ---------- pictures: shared by the 🖼️ button and drag & drop ---------- */
  const PICOK = /^image\/(png|jpe?g|webp|gif)$/i;
  function pictureData(f){
    return new Promise((res, rej) => {
      if(!PICOK.test(f.type)) return rej("Pick a PNG, JPG, WEBP or GIF picture.");
      const fr = new FileReader(); fr.onerror = () => rej("Couldn’t read that picture.");
      fr.onload = () => {
        const im = new Image(); im.onerror = () => rej("Couldn’t read that picture.");
        im.onload = () => {
          let out = "";
          for(const [S, q] of [[900, .8], [700, .68], [520, .58], [380, .5]]){
            const r = Math.min(1, S / Math.max(im.width, im.height)), c = document.createElement("canvas");
            c.width = Math.max(1, Math.round(im.width * r)); c.height = Math.max(1, Math.round(im.height * r));
            const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
            try{ out = c.toDataURL("image/jpeg", q); }catch(e){ out = ""; break; }
            if(out.length < 240000) break;
          }
          if(!out || out.length >= 300000) return rej("That picture is too big to store. Try a smaller one.");
          res(out);
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(f);
    });
  }
  /* inserts each picture at the current cursor, one after the other, so a multi-file drop keeps its order */
  async function addPictures(files){
    errEl.textContent = "";
    for(const f of files){
      try{ const out = await pictureData(f); ed.focus(); cmd("insertImage", out); }
      catch(m){ errEl.textContent = String(m); }
    }
  }
  /* drag pictures from your computer straight onto the page: they land where you drop them */
  (function(){
    const hasFiles = e => !!e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0;
    const rangeAt = (x, y) => {
      if(document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
      if(document.caretPositionFromPoint){ const p = document.caretPositionFromPoint(x, y); if(p){ const r = document.createRange(); r.setStart(p.offsetNode, p.offset); r.collapse(true); return r; } }
      return null;
    };
    let depth = 0; const off = () => { depth = 0; ed.classList.remove("ct-drop"); };
    ed.addEventListener("dragenter", e => { if(!hasFiles(e)) return; e.preventDefault(); depth++; ed.classList.add("ct-drop"); });
    ed.addEventListener("dragover", e => { if(!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    ed.addEventListener("dragleave", e => { if(!hasFiles(e)) return; if(--depth <= 0) off(); });
    ed.addEventListener("drop", e => {
      off(); if(!hasFiles(e)) return;           // moving a picture that's already on the page is left to the browser
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      if(!files.length) return;
      const pics = files.filter(f => PICOK.test(f.type));
      if(!pics.length){ errEl.textContent = "Drop a PNG, JPG, WEBP or GIF picture."; return; }
      let r = rangeAt(e.clientX, e.clientY);
      if(!r || !ed.contains(r.startContainer)){ r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); }   // dropped on the padding: add at the end
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      addPictures(pics);
    });
    ed.addEventListener("dragend", off);
  })();
  (function(){   // colour + picture
    const lab = document.createElement("label"); lab.title = "Text colour"; lab.textContent = "🎨";
    const ci = document.createElement("input"); ci.type = "color"; ci.value = "#ff453a"; lab.appendChild(ci);
    let saved = null;
    const grab = () => { const sl = getSelection(); if(sl.rangeCount && ed.contains(sl.getRangeAt(0).commonAncestorContainer)) saved = sl.getRangeAt(0).cloneRange(); };
    lab.onmousedown = grab; lab.addEventListener("pointerdown", grab); lab.addEventListener("touchstart", grab, { passive: true });
    const paint = () => {
      ed.focus(); if(saved){ const sl = getSelection(); sl.removeAllRanges(); sl.addRange(saved); }
      try{ document.execCommand("styleWithCSS", false, true); document.execCommand("foreColor", false, ci.value); document.execCommand("styleWithCSS", false, false); }catch(e){}
      try{ const sl = getSelection(); if(sl.rangeCount) forceColor(sl.getRangeAt(0), ci.value); }catch(e){}
      scheduleAdj(); grab(); markDirty();   // the edit rebuilt the nodes: remember where the selection is now, so the next colour change still hits the same text
    };
    ci.oninput = paint; ci.onchange = paint;
    tb.appendChild(lab);
    const pl = document.createElement("label"); pl.title = "Add a picture"; pl.textContent = "🖼️";
    const fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/png,image/jpeg,image/webp,image/gif"; pl.appendChild(fi);
    let ps = null; pl.onmousedown = () => { const s = getSelection(); ps = s.rangeCount ? s.getRangeAt(0).cloneRange() : null; };
    fi.onchange = async () => {
      const f = fi.files && fi.files[0]; fi.value = ""; if(!f) return;
      if(ps){ const s = getSelection(); s.removeAllRanges(); s.addRange(ps); }
      await addPictures([f]);
    };
    tb.appendChild(pl);
  })();
  /* ---------- link picker: a web address, or one of this site's tabs / subtabs (like Google Docs tab links) ---------- */
  const lkBox = document.createElement("div"); lkBox.id = "ct-lk";
  lkBox.innerHTML = '<div class="gm-box" role="dialog" aria-modal="true" aria-label="Add link"><h3>Add link</h3>' +
    '<label>Web address<input id="lk-url" type="text" autocomplete="off" placeholder="https://…"></label>' +
    '<div class="gm-foot"><span class="gm-spacer"></span><button type="button" id="lk-go" class="gm-b pri">Link</button></div>' +
    '<div class="lk-h">…or link to a page in this site</div><div class="lk-list" id="lk-pages"></div>' +
    '<div id="lk-err" role="alert" style="color:#ff453a;font-size:12px"></div>' +
    '<div class="gm-foot"><span class="gm-spacer"></span><button type="button" id="lk-cancel" class="gm-b alt">Cancel</button></div></div>';
  document.body.appendChild(lkBox);
  let lkSel = null, lkCollapsed = true;
  const closeLk = () => lkBox.classList.remove("on");
  function applyLink(href, label){
    closeLk(); ed.focus();
    if(!lkSel){ const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); lkSel = r; }   // nothing selected in the page: add the link at the end
    { const s = getSelection(); s.removeAllRanges(); s.addRange(lkSel); }
    if(lkCollapsed) cmd("insertHTML", '<a href="' + esc(href) + '">' + esc(label) + "</a>"); else cmd("createLink", href);
  }
  function addLink(){
    const s = getSelection();
    const inEd = s.rangeCount && ed.contains(s.getRangeAt(0).commonAncestorContainer);
    lkSel = inEd ? s.getRangeAt(0).cloneRange() : null; lkCollapsed = !inEd || s.isCollapsed;
    $$("lk-url").value = "https://"; $$("lk-err").textContent = "";
    const list = $$("lk-pages"); list.replaceChildren();
    const add = (t, label) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = () => applyLink("#ct:" + t.id, t.name); list.appendChild(b); };
    const head = txt => { const h = document.createElement("div"); h.className = "lk-h"; h.textContent = txt; list.appendChild(h); };
    const top = byId(curId);
    if(top){
      head("This tab");
      add(top, "📄 " + top.name + " (main page)");
      subsOf(top.id).forEach(x => add(x, x.ic + " " + x.name));
    }
    { const BI = [["home","🏠","Home"],["main","💬","Chat"],["gal","🖼️","Image Gallery"],["polls","📊","Polls"],["shame","🚨","Hall of Shame"],["draw","🎨","Draw"],["tier","🏆","Tiers"],["games","🎮","Games & Media"]];
      const nm = (k, ic, d) => { const b = document.querySelector('#chtabs button[data-ch="' + k + '"]'); return b ? (b.textContent || "").replace(/\s+/g, " ").trim() || (ic + " " + d) : ""; };
      const rows = BI.map(([k, ic, d]) => [k, nm(k, ic, d)]).filter(x => x[1]);
      if(rows.length){
        head("Built-in tabs");
        const addB = (href, label) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = () => applyLink(href, label.replace(/^[\s↳]+/, "").replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")); list.appendChild(b); };
        rows.forEach(([k, label]) => { addB("#tab:" + k, label); if(k === "games") [["games","🎮 Games"],["proxy","🌐 Proxy"],["media","🎬 Media"],["music","🎵 Music"]].forEach(([sk, sl]) => addB("#tab:games:" + sk, "   ↳ " + sl)); });
      }
    }
    const others = tops().filter(t => t.id !== curId);
    if(others.length){
      head("Other tabs");
      others.forEach(t => { add(t, t.ic + " " + t.name); subsOf(t.id).forEach(x => add(x, "   ↳ " + x.ic + " " + x.name)); });
    }
    if(!list.children.length){ const e = document.createElement("div"); e.className = "ctm-note"; e.style.display = "block"; e.textContent = "No other pages yet. Add a subtab first."; list.appendChild(e); }
    lkBox.classList.add("on"); setTimeout(() => { const u = $$("lk-url"); u.focus(); u.select(); }, 30);
  }
  $$("lk-go").onclick = () => {
    let u = $$("lk-url").value.trim(); if(!u || u === "https://"){ $$("lk-err").textContent = "Type a web address, or pick a page below."; return; }
    if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
    u = hrefOk(u); if(!u){ $$("lk-err").textContent = "That link has to start with https://"; return; }
    applyLink(u, u);
  };
  $$("lk-cancel").onclick = closeLk;
  lkBox.addEventListener("mousedown", e => { if(e.target === lkBox) closeLk(); });
  lkBox.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.stopPropagation(); closeLk(); }
    else if(e.key === "Enter" && e.target.id === "lk-url"){ e.preventDefault(); $$("lk-go").click(); }
  });
  /* following a page link in the finished page */
  function goTo(id){
    const t = byId(id); if(!t) return;
    if(editing){ errEl.textContent = "Save or cancel your edit before following a link."; return; }
    if(t.p){ if(curId !== t.p) setChannel("ct:" + t.p); curSub = t.id; }
    else { if(curId !== t.id) setChannel("ct:" + t.id); curSub = ""; }
    renderSubs(true); renderPage(); updateBar();
    const sc = doc.closest(".ct-scroll"); if(sc) sc.scrollTop = 0;
  }
  doc.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[data-ct]"); if(!a) return; e.preventDefault(); goTo(a.getAttribute("data-ct")); });
  ed.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[data-ct],a[data-tab]"); if(a) e.preventDefault(); });
  doc.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[data-tab]"); if(!a) return; e.preventDefault();
    if(editing){ errEl.textContent = "Save or cancel your edit before following a link."; return; }
    const [k, sub] = a.getAttribute("data-tab").split(":");
    if(!document.querySelector('#chtabs button[data-ch="' + k + '"]') && k !== "main"){ errEl.textContent = "That tab isn't available right now."; return; }
    setChannel(k);
    if(sub) setTimeout(() => { const b = document.querySelector('#games .gm-sub[data-sub="' + sub + '"]'); if(b) b.click(); }, 80);
  });

  /* ---------- resize pictures: click a picture, then drag the dot or tap a size ---------- */
  (function(){
    const wrap = $$("ct-editwrap"), box = document.createElement("div"); box.id = "ct-rs";
    box.innerHTML = '<div class="rs-b"><button type="button" data-w="25">25%</button><button type="button" data-w="50">50%</button><button type="button" data-w="75">75%</button><button type="button" data-w="100">Full</button><button type="button" class="rs-x" data-x="1" title="Delete picture">🗑</button></div><div class="rs-h" title="Drag to resize"></div>';
    wrap.appendChild(box);
    let img = null, drag = null;
    const contentW = () => { const cs = getComputedStyle(ed); return Math.max(40, ed.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)); };
    function place(){
      if(!img || !img.isConnected || !ed.contains(img)){ hide(); return; }
      const a = wrap.getBoundingClientRect(), r = img.getBoundingClientRect();
      box.style.left = (r.left - a.left) + "px"; box.style.top = (r.top - a.top) + "px"; box.style.width = r.width + "px"; box.style.height = r.height + "px";
      box.querySelector(".rs-b").style.top = (r.top - a.top < 44 ? r.height + 12 : -38) + "px";
    }
    function show(im){ img = im; box.classList.add("on"); place(); }
    function hide(){ img = null; box.classList.remove("on"); }
    const setW = pct => { if(!img) return; pct = Math.min(100, Math.max(5, pct)); img.style.width = (Math.round(pct * 10) / 10) + "%"; img.style.height = "auto"; place(); };
    ed.addEventListener("click", e => { if(e.target && e.target.tagName === "IMG") show(e.target); else hide(); });
    ed.addEventListener("keydown", e => {
      if(img && (e.key === "Delete" || e.key === "Backspace")){ e.preventDefault(); img.remove(); hide(); }
      else if(img && !e.ctrlKey && !e.metaKey && e.key.length === 1) hide();
    });
    ed.addEventListener("input", () => { if(img) place(); });
    window.addEventListener("resize", () => { if(img) place(); });
    new ResizeObserver(() => { if(img) place(); }).observe(ed);
    box.querySelector(".rs-b").addEventListener("mousedown", e => e.preventDefault());
    box.querySelector(".rs-b").addEventListener("click", e => {
      const b = e.target.closest("button"); if(!b || !img) return;
      if(b.dataset.x){ img.remove(); hide(); return; }
      setW(+b.dataset.w);
    });
    const handle = box.querySelector(".rs-h");
    handle.addEventListener("pointerdown", e => {
      if(!img) return; e.preventDefault();
      drag = { x: e.clientX, w: img.getBoundingClientRect().width, cw: contentW() };
      try{ handle.setPointerCapture(e.pointerId); }catch(_){}
    });
    handle.addEventListener("pointermove", e => { if(drag) setW((drag.w + (e.clientX - drag.x)) / drag.cw * 100); });
    const end = () => { drag = null; };
    handle.addEventListener("pointerup", end); handle.addEventListener("pointercancel", end);
    document.addEventListener("scroll", () => { if(img) place(); }, true);
    // hide whenever the editor closes or a new page loads in it
    new MutationObserver(() => { if(img && !ed.contains(img)) hide(); }).observe(ed, { childList: true, subtree: true });
    const ew = new MutationObserver(() => { if(!wrap.classList.contains("on")) hide(); }); ew.observe(wrap, { attributes: true, attributeFilter: ["class"] });
  })();
  ed.addEventListener("paste", e => {
    e.preventDefault(); const cd = e.clipboardData; if(!cd) return;
    const h = cd.getData("text/html"), t = cd.getData("text/plain");
    cmd("insertHTML", h ? clean(h) : esc(t).replace(/\r?\n/g, "<br>"));
  });
  ed.addEventListener("keydown", e => {
    if((e.ctrlKey || e.metaKey) && e.key === "Enter"){ e.preventDefault(); finishEdit(); }
    else if((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")){ e.preventDefault(); autosave(); }
  });

  /* ---------- new / rename / delete window ---------- */
  const modal = document.createElement("div"); modal.id = "ct-modal";
  modal.innerHTML =
    '<div class="gm-box" role="dialog" aria-modal="true" aria-labelledby="ctm-t"><h3 id="ctm-t">New tab</h3>' +
      '<label>Tab name<input id="ctm-name" type="text" maxlength="24" autocomplete="off" placeholder="e.g. Rules"></label>' +
      '<label>Icon (pick one below, or type / paste any emoji)<input id="ctm-ic" type="text" maxlength="24" autocomplete="off" placeholder="📄"></label>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span id="ctm-pv" style="width:36px;height:36px;border-radius:50%;overflow:hidden;display:none;flex:none"></span><button type="button" class="gm-b alt" id="ctm-up">🖼 Use a picture instead</button><button type="button" class="gm-b alt" id="ctm-ux" style="display:none" title="Remove the picture">✕</button><input type="file" id="ctm-file" accept="image/*" hidden></div>' +
      '<div class="ctm-wp"><span class="ctm-wl">Wallpaper for this page</span><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span id="ctm-wpv" title="Preview"></span><button type="button" class="gm-b alt" id="ctm-wpb">🖼 Choose wallpaper</button><label class="gm-b alt" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">🎨 Colour<input type="color" id="ctm-wpc" value="#2b2d31" style="width:26px;height:22px;padding:0;border:0;background:none"></label><button type="button" class="gm-b alt" id="ctm-wpx" style="display:none" title="Remove the wallpaper">✕</button><input type="file" id="ctm-wpf" accept="image/*" hidden></div><div class="ctm-note" style="display:block">Subtabs without their own wallpaper use their tab’s wallpaper.</div></div>' +
      '<input id="ctm-eq" type="text" autocomplete="off" placeholder="Search emojis (cat, fire, flag…)">' +
      '<div class="ctm-ecat" id="ctm-ecat"></div>' +
      '<div class="ctm-emo" id="ctm-emo"></div>' +
      '<div id="ctm-aclbox" style="display:flex;flex-direction:column;gap:12px">' +
        '<label>Who can add &amp; edit pages in this tab<select id="ctm-acl"><option value="mods">All mods &amp; owners</option><option value="me">Only me (and owners)</option><option value="list">Only the people I name</option><option value="all">Everyone in the room</option></select></label>' +
        '<label id="ctm-names-l">Names, separated by commas<input id="ctm-names" type="text" maxlength="300" autocomplete="off" placeholder="e.g. Sam, Jo"></label>' +
      '</div>' +
      '<div id="ctm-xfer" style="display:none;flex-direction:column;gap:8px;padding-top:4px;border-top:1px solid var(--line)">' +
        '<div class="ctm-note" id="ctm-owner" style="display:block"></div>' +
        '<label>Give this tab to someone else<input id="ctm-to" type="text" maxlength="12" autocomplete="off" placeholder="Their exact name"></label>' +
        '<button type="button" id="ctm-xbtn" class="gm-b alt">Transfer ownership</button>' +
        '<div class="ctm-note" style="display:block">They become its owner (rename, reorder, delete, choose who edits). Unless you’re an owner/admin, you lose those powers.</div>' +
      '</div>' +
      '<div class="ctm-note" id="ctm-note"></div>' +
      '<div class="gm-foot"><div id="ctm-err" role="alert"></div></div>' +
      '<div class="gm-foot"><button type="button" id="ctm-del" class="gm-b red">Delete tab</button><span class="gm-spacer"></span><button type="button" id="ctm-cancel" class="gm-b alt">Cancel</button><button type="button" id="ctm-save" class="gm-b pri">Save</button></div>' +
    '</div>';
  document.body.appendChild(modal);
  /* ---------- icon picker: the full emoji set (same library as the chat picker), with search + categories ---------- */
  const POPULAR = ["📄", "📢", "📜", "📖", "🎉", "📅", "🏆", "💡", "🔗", "❓", "⭐", "🛠️", "📌", "🎮", "🎵", "🔒"];
  let icCat = "pop";
  const icGroups = () => (typeof GROUP_ICONS === "object" ? Object.keys(GROUP_ICONS) : []);
  const icList = () => (typeof EMO_LIST !== "undefined" && Array.isArray(EMO_LIST)) ? EMO_LIST : [];
  function icFill(items){
    const g = $$("ctm-emo"); g.replaceChildren();
    if(!items.length){ const n = document.createElement("div"); n.className = "ctm-none"; n.textContent = (typeof emoLoading !== "undefined" && emoLoading) ? "Loading emojis…" : "No emoji found"; g.appendChild(n); return; }
    const frag = document.createDocumentFragment();
    items.forEach(o => { const b = document.createElement("button"); b.type = "button"; b.textContent = o.e; b.title = o.n || ""; frag.appendChild(b); });
    g.appendChild(frag); g.scrollTop = 0;
  }
  function icShow(){
    const q = $$("ctm-eq").value.trim().toLowerCase(), cats = $$("ctm-ecat");
    [...cats.children].forEach(c => c.classList.toggle("on", !q && c.dataset.g === icCat));
    if(q){
      const v = q.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      icFill(icList().filter(o => o.names.some(n => n.includes(v)) || o.tags.some(t => t.includes(q))).slice(0, 300).map(o => ({ e: o.e, n: o.names[0] || "" })));
    } else if(icCat === "pop") icFill(POPULAR.map(e => ({ e })));
    else icFill(icList().filter(o => o.g === icCat).map(o => ({ e: o.e, n: o.names[0] || "" })));
  }
  (function(){
    const cats = $$("ctm-ecat");
    const mk = (g, ic, title) => { const b = document.createElement("button"); b.type = "button"; b.dataset.g = g; b.textContent = ic; b.title = title; b.onclick = () => { icCat = g; $$("ctm-eq").value = ""; icShow(); }; cats.appendChild(b); };
    mk("pop", "⭐", "Popular");
    icGroups().forEach(g => mk(g, GROUP_ICONS[g], (typeof GROUP_NAMES === "object" && GROUP_NAMES[g]) || ""));
    $$("ctm-emo").addEventListener("click", e => { const b = e.target.closest("button"); if(b) $$("ctm-ic").value = b.textContent; });
    $$("ctm-eq").addEventListener("input", icShow);
    $$("ctm-eq").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); e.stopPropagation(); } });
    icShow();
    const prev = window.refreshEmojiPicker;   // the chat picker calls this when the full emoji set has finished downloading
    window.refreshEmojiPicker = function(){ try{ if(prev) prev.apply(this, arguments); }catch(_){} icShow(); };
  })();
  let editId = null, delArmed = 0, newParent = "", ctmIm = "";
  function ctmPv(){
    const pv = $$("ctm-pv"); pv.replaceChildren();
    if(ctmIm){ const g = new Image(); g.alt = ""; g.src = ctmIm; g.style.cssText = "width:100%;height:100%;object-fit:cover;display:block"; pv.appendChild(g); }
    pv.style.display = ctmIm ? "" : "none"; $$("ctm-ux").style.display = ctmIm ? "" : "none";
  }
  let ctmWp = "";
  function ctmWpPv(){
    const v = $$("ctm-wpv");
    v.style.cssText = "width:54px;height:36px;border-radius:8px;border:1px solid var(--line);flex:none;background:" + (ctmWp ? (ctmWp[0] === "#" ? ctmWp : "url(" + ctmWp + ") center/cover") : "var(--row)");
    $$("ctm-wpx").style.display = ctmWp ? "" : "none";
  }
  $$("ctm-wpb").onclick = () => $$("ctm-wpf").click();
  $$("ctm-wpx").onclick = () => { ctmWp = ""; ctmWpPv(); };
  $$("ctm-wpc").oninput = () => { ctmWp = $$("ctm-wpc").value; ctmWpPv(); };
  $$("ctm-wpf").onchange = () => { const f = $$("ctm-wpf").files && $$("ctm-wpf").files[0]; $$("ctm-wpf").value = ""; if(!f) return; wpPic(f, d => { if(d){ ctmWp = d; ctmWpPv(); $$("ctm-err").textContent = ""; } else $$("ctm-err").textContent = "Couldn’t use that wallpaper — try a smaller or different picture."; }); };
  $$("ctm-up").onclick = () => $$("ctm-file").click();
  $$("ctm-ux").onclick = () => { ctmIm = ""; ctmPv(); };
  $$("ctm-file").onchange = () => { const f = $$("ctm-file").files && $$("ctm-file").files[0]; $$("ctm-file").value = ""; if(!f) return; squarePic(f, d => { if(d){ ctmIm = d; ctmPv(); $$("ctm-err").textContent = ""; } else $$("ctm-err").textContent = "Couldn’t use that picture — try a different one."; }); };
  function openModal(t, parent){
    if(t ? !canManage(t) : (parent ? !canEdit(byId(parent)) : !inRoom())) return;
    editId = t ? t.id : null; newParent = t ? (t.p || "") : (parent || ""); delArmed = 0;
    $$("ctm-t").textContent = t ? (t.p ? "Rename subtab" : "Rename tab") : (newParent ? "New subtab" : "New tab");
    $$("ctm-name").value = t ? t.name : ""; $$("ctm-ic").value = t ? t.ic : ""; ctmIm = t ? cleanIm(t.im) : ""; ctmPv(); ctmWp = t ? cleanWp(t.wp) : ""; if(ctmWp[0] === "#") $$("ctm-wpc").value = ctmWp; ctmWpPv();
    $$("ctm-del").style.display = (t && canDel(t)) ? "" : "none"; $$("ctm-del").textContent = t && t.p ? "Delete subtab" : "Delete tab"; $$("ctm-err").textContent = "";
    $$("ctm-note").textContent = (t && !canDel(t)) ? "Only " + (t.by || "an owner") + " (who made this" + (t.p ? " subtab’s tab" : " tab") + ") or an owner can delete it. You can still rename and edit it." : "";
    const isTopLevel = t ? !t.p : !parent, ac = aclOf(t);
    $$("ctm-aclbox").style.display = isTopLevel ? "flex" : "none";
    $$("ctm-acl").value = ac.m; $$("ctm-names").value = ac.l.join(", "); $$("ctm-names-l").style.display = ac.m === "list" ? "" : "none";
    const showX = !!t && !t.p;
    $$("ctm-xfer").style.display = showX ? "flex" : "none";
    if(showX){ $$("ctm-owner").textContent = "Current owner: " + (t.by || "nobody (only owners/admins manage it)"); $$("ctm-to").value = ""; xArmed = 0; $$("ctm-xbtn").textContent = "Transfer ownership"; }
    $$("ctm-eq").value = ""; icCat = "pop"; try{ if(typeof ensureEmoji === "function") ensureEmoji(); }catch(_){} icShow();
    modal.classList.add("on"); setTimeout(() => $$("ctm-name").focus(), 30);
  }
  const closeModal = () => modal.classList.remove("on");
  let xArmed = 0, lastLocalEdit = 0;
  $$("ctm-to").addEventListener("input", () => { xArmed = 0; $$("ctm-xbtn").textContent = "Transfer ownership"; });
  $$("ctm-xbtn").onclick = () => {
    const it = editId && byId(editId); if(!it || it.p || !canManage(it)) return;
    const to = cleanName($$("ctm-to").value).slice(0, 12);
    if(!to){ $$("ctm-err").textContent = "Type the name of the person to give it to."; return; }
    if(to.toLowerCase() === String(it.by || "").trim().toLowerCase()){ $$("ctm-err").textContent = "They already own this tab."; return; }
    if(!xArmed){ xArmed = 1; $$("ctm-err").textContent = ""; $$("ctm-xbtn").textContent = "Really give it to " + to + "?"; return; }
    it.by = to; bump(it); lastLocalEdit = Date.now(); persist(); xArmed = 0; closeModal();
    buildTabs(); renderSubs(true); renderPage(); updateBar();
  };
  $$("ctm-cancel").onclick = closeModal;
  $$("ctm-acl").onchange = () => { $$("ctm-names-l").style.display = $$("ctm-acl").value === "list" ? "" : "none"; };
  modal.addEventListener("mousedown", e => { if(e.target === modal) closeModal(); });
  $$("ct-set").onclick = () => { const t = cur(); if(t) openModal(t, ""); };
  $$("ctm-save").onclick = () => {
    const _it = editId && byId(editId);
    if(_it ? !canManage(_it) : (newParent ? !canEdit(byId(newParent)) : !inRoom())){ $$("ctm-err").textContent = "You don’t have permission to do that."; return; }
    const name = cleanName($$("ctm-name").value), ic = cleanIc($$("ctm-ic").value);
    const isTopLevel = _it ? !_it.p : !newParent;
    const acl = cleanAcl({ m: $$("ctm-acl").value, l: $$("ctm-names").value.split(/[,\n]/) });
    if(!name){ $$("ctm-err").textContent = "Give the tab a name."; return; }
    let t = editId && byId(editId);
    if(t){ t.name = name; t.ic = ic; t.im = ctmIm; t.wp = ctmWp; if(isTopLevel) t.acl = acl; bump(t); delete tombs[t.id]; }
    else {
      if(tabs.length >= MAXALL){ $$("ctm-err").textContent = "Too many tabs already."; return; }
      if(!newParent && !isMod() && !isOwner() && tops().filter(madeByMe).length >= MAXMINE){ $$("ctm-err").textContent = "You can make up to " + MAXMINE + " tabs of your own. Delete one to make another."; return; }
      if(!newParent && tops().length >= MAX){ $$("ctm-err").textContent = "You can have up to " + MAX + " custom tabs."; return; }
      if(newParent && subsOf(newParent).length >= MAXSUB){ $$("ctm-err").textContent = "A tab can have up to " + MAXSUB + " subtabs."; return; }
      const sibs = newParent ? subsOf(newParent) : tops();
      t = { id: newId(), name, ic, im: ctmIm, wp: ctmWp, html: "", p: newParent, acl: isTopLevel ? acl : { m: "mods", l: [] }, o: sibs.reduce((m, x) => Math.max(m, (x.o || 0) + 1), 0), v: Date.now(), by: (typeof usr === "string" ? usr : "").slice(0, 12) };
      tabs.push(t);
    }
    if(!persist()){ $$("ctm-err").textContent = "This device is out of storage space."; return; }
    closeModal();
    if(!editId && !t.p){ buildTabs(); setChannel("ct:" + t.id); startEdit(); }
    else { if(!editId && t.p){ curSub = t.id; } buildTabs(); renderSubs(true); renderPage(); if(!editId) startEdit(); }
  };
  $$("ctm-del").onclick = () => {
    if(!delArmed){ delArmed = 1; $$("ctm-del").textContent = "Really delete for everyone?"; return; }
    const id = editId, it = id && byId(id);
    if(!it || !canDel(it)){ $$("ctm-err").textContent = "Only the person who made this tab, or an owner, can delete it."; return; }
    const now = Date.now(), kill = x => { tombs[x.id] = Math.max(now, (x.v || 0) + 1); };
    subsOf(id).forEach(kill); kill(it);                         // a tab takes its subtabs with it
    tabs = tabs.filter(t => t.id !== id && t.p !== id); persist(); closeModal();
    if(it.p){ if(curSub === id) curSub = ""; if(editing) stopEdit(); buildTabs(); renderSubs(true); renderPage(); }
    else { buildTabs(); if(curId === id){ if(editing) stopEdit(); setChannel("main"); } }
  };
  modal.addEventListener("keydown", e => {
    if(e.key === "Escape"){ e.stopPropagation(); closeModal(); }
    else if(e.key === "Enter" && e.target.tagName === "INPUT"){ e.preventDefault(); $$("ctm-save").click(); }
  });

  /* ---------- hook into the tab switcher ---------- */
  const _sc = setChannel;
  setChannel = function(c){
    const id = typeof c === "string" && c.indexOf("ct:") === 0 ? c.slice(3) : "";
    if(id && !byId(id)){ c = "main"; }
    _sc(c);
    const t = id && byId(id);
    if(editing && (!t || t.id !== curId)){ autosave(); stopEdit(); }
    document.body.classList.toggle("in-ctab", !!t);
    try{ if(window.__ctBarSync) window.__ctBarSync(); }catch(e){}
    const prevId = curId; curId = t ? t.id : ""; if(curId !== prevId) curSub = "";
    buildTabs(); renderSubs(true);
    if(t){ renderPage(); try{ if(window.__tbPull) window.__tbPull(); }catch(e){} }
  };

  /* ---------- cloud sync hooks (used by the mailbox script below) ---------- */
  window.__tb = {
    canPush: () => isMod() || Date.now() - lastLocalEdit < 120000 || tabs.some(t => canEdit(t) || canManage(t)),
    out(){
      const o = [], have = new Set();
      tabs.forEach(t => { have.add(t.id); o.push({ id: t.id, name: t.name, ic: t.ic, im: cleanIm(t.im), wp: cleanWp(t.wp), html: t.html || "", p: t.p || "", acl: aclOf(t), o: t.o || 0, by: t.by || "", v: t.v || 1, pv: t.pv || 0, eb: t.eb || "" }); });
      Object.keys(tombs).forEach(id => { if(!have.has(id)) o.push({ id, del: 1, v: tombs[id] }); });
      return o;
    },
    apply(list){
      let ch = false;
      list.forEach(r => {
        if(!r || !okId(r.id)) return;
        const v = +r.v || 0; if(v <= 0) return;
        const i = tabs.findIndex(t => t.id === r.id), loc = tabs[i];
        if(r.del){
          if(loc && (loc.v || 0) > v) return;
          if(loc){ tabs.splice(i, 1); ch = true; }
          tabs = tabs.filter(x => { if(x.p === r.id){ tombs[x.id] = Math.max(tombs[x.id] || 0, v); ch = true; return false; } return true; });
          if((tombs[r.id] || 0) < v){ tombs[r.id] = v; ch = true; }
          return;
        }
        if((tombs[r.id] || 0) >= v) return;
        if(loc && (loc.v || 0) >= v) return;
        const p = (r.p === "" || r.p == null) ? "" : (okId(r.p) && r.p !== r.id ? r.p : null); if(p === null) return;
        const name = cleanName(r.name); if(!name) return;
        const html = clean(r.html); if(html.length > MAXHTML + 20000) return;
        const nt = { id: r.id, name, ic: cleanIc(r.ic), im: cleanIm(r.im), wp: cleanWp(r.wp), html, p, acl: cleanAcl(r.acl), o: isFinite(+r.o) ? +r.o : 0, by: String(r.by || "").slice(0, 12), v, pv: isFinite(+r.pv) ? +r.pv : 0, eb: String(r.eb || "").slice(0, 12) };
        const fresh = loc && v > (loc.v || 0) && nt.eb && nt.eb.trim().toLowerCase() !== meName() && Date.now() - v < 20000;   // somebody else changed it just now
        if(loc) tabs[i] = nt; else { if(tabs.length >= MAXALL) return; tabs.push(nt); }
        if(fresh) liveBy[r.id] = { by: nt.eb, at: Date.now() };
        delete tombs[r.id]; ch = true;
      });
      if(ch){
        persist(); buildTabs();
        if(curId && !byId(curId)){ if(editing) stopEdit(); setChannel("main"); }
        else { renderSubs(true); if(editing) liveMerge(); else renderPage(); renderPresence(); }
      }
      return ch;
    }
  };

  buildTabs(); window.__pbBuildTabs = buildTabs;
  setInterval(() => { if(!document.hidden) buildTabs(); }, 3000);
})();

;
/* ===== 51-mailbox.js ===== */
/* ---------- cloud mailbox: lets people who were offline catch up even when nobody who saw the messages is online ----------
   Public chat only (DMs and group chats stay peer-to-peer). Everything is encrypted with a key derived from the room code
   before it leaves the browser. Paste your Firebase Realtime Database URL below to switch it on. */
(function(){
  /* Cloud storage now lives in the Cloudflare worker (src/worker.js, "Store"), same address as the page: no Firebase, no quota.
     (If this page is opened from somewhere that isn't the worker, it talks to the worker's own address.) */
  const WORKER = "https://purebred-chat.226739.workers.dev";
  const onWorker = /^https?:$/.test(location.protocol) && (/\.workers\.dev$/.test(location.hostname) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
  const DB = (onWorker ? location.origin : WORKER) + "/db";
  const MAX_BODY = 500000;            // bigger photos/files are not stored in the mailbox (they still sync peer-to-peer)
  if(!DB || !window.crypto || !crypto.subtle || typeof persist !== "function" || typeof mergeEntry !== "function") return;

  const base = DB.replace(/\/+$/, "") + "/rooms/" + encodeURIComponent(ROOM_CODE);
  const K_SENT = "pb_cf_sent", K_SINCE = "pb_cf_since";
  const jget = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };

  /* the "Syncing to cloud" badge was removed; these keep the sync code's begin/end calls working */
  const beginSync = () => () => {};
  const flashSync = () => {};

  let announced = false, warned = false, caught = 0;
  const note = t => { try { if(typeof sys === "function" && inRoom()) sys(t); } catch(e){} };
  const announce = () => { if(announced || !inRoom()) return; announced = true; note("\u2601\ufe0f Cloud sync is on" + (caught ? " \u2014 caught up on " + caught + " message" + (caught === 1 ? "" : "s") + "." : ".")); };
  const fail = why => { if(warned) return; warned = true; setTimeout(() => note("\u26a0\ufe0f Cloud sync can't reach the mailbox (" + why + "). Live chat still works."), 1500); };
  let sent = jget(K_SENT, {}), since = +jget(K_SINCE, 0) || 0, ready = false, busy = false, pushing = false, pushT = 0;

  /* --- encryption (AES-GCM, key derived from the room code) --- */
  let keyP = null;
  const getKey = () => keyP || (keyP = (async () => {
    const km = await crypto.subtle.importKey("raw", new TextEncoder().encode("purebred-mailbox:" + ROOM_CODE), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: new TextEncoder().encode("purebred-mailbox-v1"), iterations: 100000, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  })());
  const b64 = u => { let s = ""; for(let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function enc(o){
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getKey(), new TextEncoder().encode(JSON.stringify(o))));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64(out);
  }
  async function dec(s){
    const u = unb64(s);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u.subarray(0, 12) }, await getKey(), u.subarray(12))));
  }

  const fx = (u, o) => { const c = new AbortController(); setTimeout(() => { try { c.abort(); } catch(e){} }, 40000); return fetch(u, Object.assign({}, o, { signal: c.signal })); };
  /* --- "has anything changed?" is one tiny request shared by everything below; real downloads only happen when it says yes --- */
  const more = { m: false, g: false, t: false };           // true while a big download is still being delivered in pieces
  const from = (n, s) => more[n] ? s + 1 : Math.max(0, s - 5000);
  /* live mode: while a custom tab page is on screen, check for changes every ~2 seconds (so you see other people's edits as they type).
     If nothing has changed for a minute or two it slows down to every ~6 seconds, and speeds up again the moment anything happens. */
  const liveOn = () => !document.hidden && document.body.classList.contains("in-ctab");
  let liveQuiet = 0, liveSkip = 0;
  window.__tbBoost = () => { liveQuiet = 0; };
  let stp = null, stpAt = 0, stpP = null, calm = 0;
  function stamp(){
    if(stp && Date.now() - stpAt < (liveOn() ? 1500 : (calm > 60 ? 30000 : 8000))) return Promise.resolve(stp);
    if(stpP) return stpP;
    return stpP = (async () => {
      try {
        const r = await fx(base + "/stamp.json", { cache: "no-store" });
        if(!r.ok) return null;
        const s = (await r.json()) || {};
        if(stp && stp.m === s.m && stp.g === s.g && stp.t === s.t) calm++; else calm = 0;
        stp = s; stpAt = Date.now(); return s;
      } catch(e){ return null; } finally { stpP = null; }
    })();
  }
  async function moved(n, since, reset){
    if(more[n]) return true;                               // a download is half done: keep going
    const s = await stamp(); if(!s) return true;            // couldn't ask: do a real download so any problem gets reported
    const top = +s[n] || 0;
    if(top < since){ reset(); return true; }                // the cloud was reset or re-imported: start over
    return top > since;
  }
  const wake = () => { calm = 0; stpAt = 0; };
  document.addEventListener("visibilitychange", () => { if(!document.hidden) wake(); });
  window.addEventListener("online", wake);
  const keyOf = id => String(id).replace(/[.$#\[\]\/]/g, "_");
  const MAX_D = 690000;   // the database rejects any record whose "d" is 700000+ characters (checked AFTER encryption), and it rejects the whole upload if one record is bad
  /* upload a batch. If the database refuses it, resend the records one by one so one bad record can't hold up everything behind it.
     done = keys that are finished (bad ones included, they are skipped); failed = nothing got through (server / rules / quota problem) */
  async function sendBatch(path, batch){
    const keys = Object.keys(batch), send = b => fx(base + path, { method: "PATCH", body: JSON.stringify(b) });
    const r = await send(batch);
    if(r.ok) return { done: keys, bad: [], failed: false };
    let text = ""; try { text = (await r.text()).replace(/\s+/g, " ").slice(0, 90); } catch(e){}
    const status = r.status;
    if(keys.length < 2) return { done: [], bad: [], failed: true, status, text };
    const done = [], bad = [];
    for(const k of keys){ ((await send({ [k]: batch[k] })).ok ? done : bad).push(k); }
    if(!done.length) return { done: [], bad: [], failed: true, status, text };
    return { done: done.concat(bad), bad, failed: false, status, text };
  }
  const sigOf = l => [l.v || 0, rxSig(l.rx), l.del ? 1 : 0, (l.b || "").length].join("|");
  const isPublic = l => l && !l.to && !l.g;
  const inRoom = () => { const g = document.getElementById("gate"); return !g || getComputedStyle(g).display === "none"; };

  /* --- download what I missed --- */
  async function pull(){
    if(busy) return; busy = true; let end = null;
    try {
      if(!(await moved("m", since, () => { since = 0; jset(K_SINCE, 0); }))){ if(!ready){ ready = true; announce(); schedulePush(); } return; }
      if(!since) end = beginSync();                // first download of the whole history
      const r = await fx(base + "/m.json?orderBy=%22up%22&startAt=" + from("m", since), { cache: "no-store" });
      if(!r.ok){ let t = ""; try { t = (await r.text()).replace(/\s+/g, " ").slice(0, 90); } catch(e){} console.warn("Mailbox read failed:", r.status, t); fail("read error " + r.status + (t ? ": " + t : "")); return; }
      const obj = (await r.json()) || {}, items = []; let maxUp = since;
      for(const w of Object.values(obj)){
        if(!w || typeof w.d !== "string") continue;
        if(+w.up > maxUp) maxUp = +w.up;
        try { const o = cleanEntry(await dec(w.d)); if(o && !o.to && !o.g) items.push(o); } catch(e){}
      }
      const changed = [];
      items.forEach(o => {
        if(mergeEntry(o)) changed.push(o);
        const cur = logs.find(l => l.i === o.i);
        if(cur && sigOf(cur) === sigOf(o)) sent[o.i] = sigOf(cur);       // the mailbox already has this exact version
      });
      since = maxUp; jset(K_SINCE, since); jset(K_SENT, sent); ready = true; caught += changed.length;
      more.m = r.headers.get("x-more") === "1"; if(more.m) setTimeout(pull, 250);
      if(changed.length) flashSync();
      if(changed.length){
        logs.sort((a, b) => (a.ts || 0) - (b.ts || 0)); persist();
        if(changed.length > 4 && typeof rerender === "function") rerender(); else changed.forEach(applyToDom);
        if(typeof dmChanged === "function") dmChanged(changed);
      }
      announce(); schedulePush();
    } catch(e){ console.warn("Mailbox read error", e); fail("network"); }
    finally { busy = false; if(end) end(); }
  }

  /* --- upload what's new or changed on my side --- */
  async function push(){
    if(pushing || !ready || (typeof isHost !== "undefined" && !isHost)) return; pushing = true; let end = null;
    try {
      const batch = {}, pend = {}, kid = {}; let n = 0, more = false;
      for(const l of logs){
        if(!isPublic(l) || !l.i) continue;
        const s = sigOf(l); if(sent[l.i] === s) continue;
        if((l.b || "").length > MAX_BODY){ sent[l.i] = s; continue; }
        if(n >= 20){ more = true; break; }
        const d = await enc(l); if(d.length >= MAX_D){ sent[l.i] = s; continue; }   // too big for the mailbox: stays peer-to-peer only
        batch[keyOf(l.i)] = { up: { ".sv": "timestamp" }, d }; pend[l.i] = s; kid[keyOf(l.i)] = l.i; n++;
      }
      if(!n){ jset(K_SENT, sent); return; }
      end = beginSync();
      const res = await sendBatch("/m.json", batch);
      res.done.forEach(k => { sent[kid[k]] = pend[kid[k]]; });
      if(res.done.length){ jset(K_SENT, sent); if(more || res.bad.length) schedulePush(); }
      if(res.bad.length) console.warn("Mailbox skipped records the database refused:", res.bad);
      if(res.failed){ console.warn("Mailbox write failed:", res.status, res.text); fail("write error " + res.status + (res.text ? ": " + res.text : "")); }
    } catch(e){ console.warn("Mailbox write error", e); }
    finally { pushing = false; if(end) end(); }
  }
  function schedulePush(){ clearTimeout(pushT); pushT = setTimeout(push, 1200); }

  /* push whenever the chat history changes (new message, edit, reaction, delete) */
  const _persist = persist;
  persist = function(){ const r = _persist.apply(this, arguments); schedulePush(); return r; };

  setInterval(() => { if(!document.hidden) pull(); }, 15000);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) pull(); });
  window.addEventListener("online", pull);
  setTimeout(pull, 400);
  setInterval(() => { if(!document.hidden){ announce(); push(); } }, 5000);

  /* ---- Games tab: one community list for everyone (add / edit / delete sync, online or offline) ---- */
  const K_GS = "pb_cf_gsent", K_GSINCE = "pb_cf_gsince";
  let gsent = jget(K_GS, {}), gsince = +jget(K_GSINCE, 0) || 0, gbusy = false, gready = false, gpushing = false, gT = 0;
  const gsig = o => (o.del ? "d" : "") + o.v;
  async function gpull(){
    if(gbusy || !window.__gm) return; gbusy = true;
    try {
      if(!(await moved("g", gsince, () => { gsince = 0; jset(K_GSINCE, 0); }))){ if(!gready){ gready = true; gSchedule(); } return; }
      const r = await fx(base + "/g.json?orderBy=%22up%22&startAt=" + from("g", gsince), { cache: "no-store" });
      if(!r.ok){ console.warn("Mailbox games read failed:", r.status); fail("games read error " + r.status); return; }
      const obj = (await r.json()) || {}, items = []; let maxUp = gsince;
      for(const w of Object.values(obj)){
        if(!w || typeof w.d !== "string") continue;
        if(+w.up > maxUp) maxUp = +w.up;
        try { const o = await dec(w.d); if(o && typeof o.id === "string") items.push(o); } catch(e){}
      }
      if(window.__gm.apply(items)) flashSync();
      items.forEach(o => { gsent[o.id] = gsig(o); });
      gsince = maxUp; jset(K_GSINCE, gsince); jset(K_GS, gsent); gready = true;
      more.g = r.headers.get("x-more") === "1"; if(more.g) setTimeout(gpull, 250);
      gSchedule();
    } catch(e){ console.warn("Mailbox games read error", e); }
    finally { gbusy = false; }
  }
  async function gpush(){
    if(gpushing || !gready || !window.__gm) return; gpushing = true; let end = null;
    try {
      const batch = {}, pend = {}, kid = {}; let n = 0;
      for(const o of window.__gm.out()){
        if(gsent[o.id] === gsig(o)) continue;
        if(n >= 15) break;
        const d = await enc(o); if(d.length >= MAX_D){ gsent[o.id] = gsig(o); continue; }
        batch[keyOf(o.id)] = { up: { ".sv": "timestamp" }, d }; pend[o.id] = gsig(o); kid[keyOf(o.id)] = o.id; n++;
      }
      if(!n) return;
      end = beginSync();
      const res = await sendBatch("/g.json", batch);
      res.done.forEach(k => { gsent[kid[k]] = pend[kid[k]]; });
      if(res.done.length){ jset(K_GS, gsent); gSchedule(); }
      if(res.bad.length) console.warn("Mailbox skipped games the database refused:", res.bad);
      if(res.failed){ console.warn("Mailbox games write failed:", res.status, res.text); fail("games write error " + res.status + (res.text ? ": " + res.text : "")); }
    } catch(e){ console.warn("Mailbox games write error", e); }
    finally { gpushing = false; if(end) end(); }
  }
  function gSchedule(){ clearTimeout(gT); gT = setTimeout(gpush, 800); }
  /* uploaded HTML games: the code lives in its own cloud node and is only downloaded when someone plays that game */
  const gcache = new Map();
  window.__gmCode = {
    async put(id, v, html){
      try {
        const end = beginSync();
        try {
          const r = await fx(base + "/gc/" + keyOf(id) + ".json", { method: "PUT", body: JSON.stringify({ up: { ".sv": "timestamp" }, d: await enc({ id, v, h: html }) }) });
          if(r.ok) gcache.set(id + ":" + v, html);
          return r.ok;
        } finally { end(); }
      } catch(e){ return false; }
    },
    async get(id, cv){
      const k = id + ":" + cv; if(gcache.has(k)) return gcache.get(k);
      const r = await fx(base + "/gc/" + keyOf(id) + ".json", { cache: "no-store" });
      if(!r.ok) throw new Error("read " + r.status);
      const w = await r.json(); if(!w || typeof w.d !== "string") throw new Error("missing");
      const o = await dec(w.d); if(!o || typeof o.h !== "string") throw new Error("bad");
      if(gcache.size > 6) gcache.delete(gcache.keys().next().value);
      gcache.set(k, o.h); return o.h;
    },
    del(id){ try { fx(base + "/gc/" + keyOf(id) + ".json", { method: "DELETE" }).catch(() => {}); } catch(e){} }
  };
  window.__gmChanged = gSchedule;
  window.__gmPull = gpull;
  setInterval(() => { if(!document.hidden) gpull(); }, 8000);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) gpull(); });
  setTimeout(gpull, 700);
  /* ---- Custom tabs: pages made by mods/owners. Everyone downloads them; only mods/owners upload (add / rename / edit / reorder / delete) ---- */
  const K_TS = "pb_cf_tsent", K_TSINCE = "pb_cf_tsince";
  let tsent = jget(K_TS, {}), tsince = +jget(K_TSINCE, 0) || 0, tbusy = false, tready = false, tpushing = false, tT = 0;
  const tsig = o => (o.del ? "d" : "") + o.v;
  let tlast = 0, tcur = 0; const T0 = Date.now();
  async function tpull(){
    /* the picture database (IndexedDB) can hang on some phones, so wait for it only a few seconds */
    if(tbusy || !window.__tb || (window.__md && !window.__md.ready && Date.now() - T0 < 6000) || (tlast && Date.now() - tlast < (liveOn() ? 1200 : 3500))) return; tbusy = true; tlast = Date.now();
    const full = !!(window.__md && window.__md.needFull);
    try {
      if(!full && !(await moved("t", tsince, () => { tsince = 0; jset(K_TSINCE, 0); }))){ liveQuiet++; if(!tready){ tready = true; tSchedule(); } return; }
      liveQuiet = 0;
      const r = await fx(base + "/t.json?orderBy=%22up%22&startAt=" + (full ? (more.t ? tcur + 1 : 0) : from("t", tsince)), { cache: "no-store" });
      if(!r.ok){ console.warn("Mailbox tabs read failed:", r.status); fail("tabs read error " + r.status); tready = true; tSchedule(); return; }   // still let uploads try
      let obj = (await r.json()) || {}; let maxUp = tsince;
      const ws = Object.values(obj).filter(w => w && typeof w.d === "string");
      ws.forEach(w => { if(+w.up > maxUp) maxUp = +w.up; });
      const items = (await Promise.all(ws.map(async w => { try { const o = await dec(w.d); return (o && typeof o.id === "string") ? o : null; } catch(e){ return null; } }))).filter(Boolean);
      let chg = window.__tb.apply(items.filter(o => o.k !== "md" && o.k !== "cl"));
      if(window.__cl && window.__cl.apply(items.filter(o => o.k === "cl"))) chg = true;
      if(window.__md && window.__md.apply(items.filter(o => o.k === "md"))) chg = true;
      if(chg) flashSync();
      more.t = r.headers.get("x-more") === "1"; tcur = maxUp;
      if(full && window.__md && !more.t) window.__md.fullDone();
      items.forEach(o => { tsent[o.id] = tsig(o); });
      tsince = maxUp; jset(K_TSINCE, tsince); jset(K_TS, tsent); tready = true;
      if(more.t){ tlast = 0; setTimeout(tpull, 250); }
      tSchedule();
    } catch(e){ console.warn("Mailbox tabs read error", e); }
    finally { tbusy = false; }
  }
  async function tpush(){
    if(tpushing || !tready || !window.__tb || !(window.__tb.canPush() || (window.__md && window.__md.canPush()) || (window.__cl && window.__cl.canPush()))) return; tpushing = true; let end = null;
    try {
      const batch = {}, pend = {}, kid = {}; let n = 0;
      for(const o of window.__tb.out().concat(window.__md ? window.__md.out() : [], window.__cl ? window.__cl.out() : [])){
        if(tsent[o.id] === tsig(o)) continue;
        if(n >= 8) break;
        const d = await enc(o); if(d.length >= MAX_D){ tsent[o.id] = tsig(o); console.warn("Tab record too big for the mailbox, skipped:", o.id); continue; }
        batch[keyOf(o.id)] = { up: { ".sv": "timestamp" }, d }; pend[o.id] = tsig(o); kid[keyOf(o.id)] = o.id; n++;
      }
      if(!n){ jset(K_TS, tsent); return; }
      end = beginSync();
      const res = await sendBatch("/t.json", batch);
      res.done.forEach(k => { tsent[kid[k]] = pend[kid[k]]; });
      if(res.done.length){ jset(K_TS, tsent); tSchedule(); }
      if(res.bad.length) console.warn("Mailbox skipped tab records the database refused:", res.bad);
      if(res.failed){ console.warn("Mailbox tabs write failed:", res.status, res.text); fail("tabs write error " + res.status + (res.text ? ": " + res.text : "")); setTimeout(tSchedule, 15000); }
    } catch(e){ console.warn("Mailbox tabs write error", e); setTimeout(tSchedule, 15000); }
    finally { tpushing = false; if(end) end(); }
  }
  function tSchedule(){ clearTimeout(tT); tT = setTimeout(tpush, 800); }
  window.__tbChanged = tSchedule;
  window.__tbPull = () => { stpAt = 0; return tpull(); };   // opening a tab checks for fresh data right away
  setInterval(() => { if(!document.hidden) tpull(); }, 8000);
  setInterval(() => { if(!liveOn()) return; if(liveQuiet > 40 && (++liveSkip % 3)) return; tpull(); }, 2000);   // live mode (see liveOn)
  document.addEventListener("visibilitychange", () => { if(!document.hidden) tpull(); });
  setTimeout(tpull, 2500);
  window.__mbPull = pull;
})();

;
/* ===== 52-img-retry.js ===== */
/* Built-in icons (home tiles + top bar): if one fails to load (flaky phone connection), try once more, then show an emoji instead of a blank circle. */
(function(){
  var EMO = { games:"\ud83c\udfae", chat:"\ud83d\udcac", media:"\ud83c\udfac", draw:"\ud83c\udfa8", shame:"\ud83d\udea8", polls:"\ud83d\udcca", gallery:"\ud83d\udcf7", tier:"\ud83c\udfc6", home:"\ud83c\udfe0" };
  window.addEventListener("error", function(e){
    var im = e.target; if(!im || im.tagName !== "IMG") return;
    var src = im.getAttribute("src") || "", m = src.match(/^assets\/icons\/([a-z]+)\.png/); if(!m) return;
    if(!im.dataset.retry){ im.dataset.retry = "1"; setTimeout(function(){ im.src = src.split("?")[0] + "?r=" + Date.now(); }, 800); return; }
    var p = im.parentNode, emo = EMO[m[1]] || "\u2b50"; if(!p) return;
    if(p.classList && p.classList.contains("hm-ic")){ p.classList.add("emo"); p.textContent = emo; }
    else im.replaceWith(document.createTextNode(emo + " "));
  }, true);
})();

;
/* ===== 53-hdr-pos-js.js ===== */
(function(){
  const K = "pb_hdr_pos", P = ["top", "left", "right", "bottom"];
  const $$ = id => document.getElementById(id), sel = $$("hdrpos"), arrow = $$("hdr-arrow");
  const get = () => { try{ const v = localStorage.getItem(K); return P.indexOf(v) >= 0 ? v : "top"; }catch(e){ return "top"; } };
  /* [bar showing, bar hidden] — the arrow always points the way the bar will slide */
  const GLYPH = { top:["\u25b2","\u25bc"], bottom:["\u25bc","\u25b2"], left:["\u2039","\u203a"], right:["\u203a","\u2039"] };
  function paintArrow(){
    if(!arrow) return;
    const g = GLYPH[document.body.dataset.hp || "top"] || GLYPH.top;
    const t = document.body.classList.contains("hide-hdr") ? g[1] : g[0];
    if(arrow.textContent !== t) arrow.textContent = t;
  }
  function apply(p, save){
    if(P.indexOf(p) < 0) p = "top";
    if(p === "top") document.body.removeAttribute("data-hp"); else document.body.dataset.hp = p;
    if(sel) sel.value = p;
    if(save){ try{ localStorage.setItem(K, p); }catch(e){} }
    paintArrow();
    setTimeout(() => window.dispatchEvent(new Event("resize")), 320);   // lets the tab-label fitter re-measure
  }
  if(arrow) new MutationObserver(paintArrow).observe(arrow, { childList:true, characterData:true, subtree:true });
  if(sel) sel.addEventListener("change", () => apply(sel.value, true));
  apply(get(), false);
})();
