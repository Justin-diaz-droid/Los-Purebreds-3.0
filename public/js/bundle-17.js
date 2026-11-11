/* ===== 57-dt-js.js ===== */
(function(){
  "use strict";
  var KEY = "pb_desktop", D = document, B = D.body, $ = function(i){ return D.getElementById(i); };
  var OSES = [["", "Off"], ["mac", "macOS"], ["chromeos", "ChromeOS"], ["win11", "Windows"]];
  /* A window beyond the first runs its own full copy of the app inside an iframe (this page loaded with #dtch=<tab>).
     That copy must never start a desktop of its own. */
  var EMB = (window.top !== window.self) && /[#&]dtch=/.test(location.hash);
  function saved(){ if(EMB) return ""; try{ var v = localStorage.getItem(KEY) || ""; return v === "win" ? "win11" : v; }catch(e){ return ""; } }
  function keep(v){ try{ if(v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); }catch(e){} }

  /* =============== Settings > Appearance & Layout: Desktop mode switch =============== */
  var hh = $("hh"), card = hh && hh.closest(".stg-card"), stg = $("stg"), saveBtn = $("save"), LASTK = "pb_dt_last";
  if(card && stg && saveBtn){
    var host = card.querySelector(".sx-group") || card, inSx = host !== card;
    var swl = D.createElement("label"); swl.className = "chk";
    var sw = D.createElement("input"); sw.type = "checkbox"; sw.id = "x-deskon"; swl.appendChild(sw); swl.appendChild(D.createTextNode("Desktop mode"));
    var lab = D.createElement("label"); lab.setAttribute("for", "x-desk"); lab.textContent = "Desktop style";
    var sel = D.createElement("select"); sel.id = "x-desk";
    OSES.forEach(function(o){ if(!o[0]) return; var op = D.createElement("option"); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
    var note = D.createElement("div"); note.className = "stg-note";
    note.textContent = "Turns the site into a pretend desktop (macOS, ChromeOS or Windows) with a dock or taskbar. Every tab opens in its own mini window: drag, resize, minimize, maximize, or drag to a screen edge to snap. Once it is on, right-click the desktop (or open the Apple menu, the launcher, or the Control Center) and choose Customize desktop to set your own wallpaper and change any icon.";
    var srow = null;
    if(inSx){ srow = D.createElement("div"); srow.className = "sx-fr"; srow.appendChild(lab); srow.appendChild(sel); }
    host.appendChild(swl); if(srow) host.appendChild(srow); else { host.appendChild(lab); host.appendChild(sel); }
    host.appendChild(note);
    function lastOs(){ try{ var v = localStorage.getItem(LASTK); return v === "chromeos" || v === "win11" ? v : "mac"; }catch(e){ return "mac"; } }
    function showStyle(){ var d = sw.checked ? "" : "none"; if(srow) srow.style.display = d; else { lab.style.display = d; sel.style.display = d; } }
    function load(){ var v = saved(); sw.checked = !!v; sel.value = v || lastOs(); showStyle(); }
    sw.addEventListener("change", showStyle);
    var wasOpen = false;
    new MutationObserver(function(){
      var open = stg.classList.contains("open");
      if(open && !wasOpen) load();
      wasOpen = open;
    }).observe(stg, {attributes:true, attributeFilter:["class"]});
    load();
    var prev = saveBtn.onclick;
    saveBtn.onclick = function(){
      var r = prev ? prev.apply(this, arguments) : undefined;
      setTimeout(function(){ try{ applyTheme(); }catch(e){} }, 250);
      var v = sw.checked ? sel.value : "";
      if(v){ try{ localStorage.setItem(LASTK, v); }catch(e){} }
      if(v !== saved()){ keep(v); setTimeout(function(){ apply(v); }, 60); }
      return r;
    };
  }

  /* =============== the desktop =============== */
  var SCK = "pb_dt_sc", UNK = "pb_dt_unpinned";
  function unLoad(){ try{ var a = JSON.parse(localStorage.getItem(UNK) || "[]"); return Array.isArray(a) ? a.filter(function(x){ return typeof x === "string"; }) : []; }catch(e){ return []; } }
  function unSave(){ try{ localStorage.setItem(UNK, JSON.stringify(st.un)); }catch(e){} }
  function scLoad(){ try{ var a = JSON.parse(localStorage.getItem(SCK) || "[]"); return Array.isArray(a) ? a.filter(function(x){ return x && x.id && x.url; }) : []; }catch(e){ return []; } }
  function scSave(){ try{ localStorage.setItem(SCK, JSON.stringify(st.sc)); }catch(e){} }
  var st = {sc:[], un:[], os:"", wins:[], live:null, z:10, uid:0, cascade:0, shell:null, liveHost:null, park:null, ph:[], clock:0, ro:null, tabObs:null, ic:{}, wall:{t:"", v:"", fit:"cover", dim:0}, wallSrc:"", wallObj:null, thObs:null};
  var APPEL = ["sb", "sb-arrow", "main"];

  /* =============== custom wallpaper + custom icons =============== */
  var ICK = "pb_dt_icons", WPK = "pb_dt_wall";
  var PRESETS = [
    ["Sunset", "linear-gradient(160deg,#ff512f,#dd2476)"],
    ["Ocean", "linear-gradient(160deg,#2193b0,#6dd5ed)"],
    ["Forest", "linear-gradient(160deg,#134e5e,#71b280)"],
    ["Midnight", "linear-gradient(160deg,#0f0c29,#302b63 55%,#24243e)"],
    ["Candy", "linear-gradient(135deg,#f093fb,#f5576c)"],
    ["Lavender", "linear-gradient(135deg,#a18cd1,#fbc2eb)"],
    ["Peach", "linear-gradient(135deg,#ffecd2,#fcb69f)"],
    ["Aurora", "radial-gradient(900px 600px at 20% 100%,#00ffa3 0,transparent 60%),radial-gradient(900px 600px at 85% 0,#7b5cff 0,transparent 60%),linear-gradient(160deg,#071a2f,#0b3a4a)"],
    ["Graphite", "#17181b"],
    ["Paper", "#e9ecf1"]
  ];
  var SYS = {
    apple:["Menu-bar icon (top left)", "💬", "mac"], launcher:["Launcher button", "", "chromeos"], start:["Start button", "", "win11"],
    wifi:["Wi‑Fi", "📶"], battery:["Battery", "🔋", "mac,chromeos"], sound:["Sound", "🔊", "win11"],
    add:["“Add shortcut” button", "+"], user:["Your profile (Start / launcher)", "👤", "win11"]
  };
  var EMOJIS = ["💬","🏠","🖼️","📸","🎮","🎵","📺","🗂️","📌","⭐","❤️","🔥","⚡","🌈","🌙","☀️","🍕","🐶","🐱","🦄","🚀","👾","🎨","🧠","🛠️","🔒","📚","🎯","🏆","💎","🌍","😎"];
  function icLoad(){ try{ var o = JSON.parse(localStorage.getItem(ICK) || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; }catch(e){ return {}; } }
  function icSave(){ try{ localStorage.setItem(ICK, JSON.stringify(st.ic)); return true; }catch(e){ return false; } }
  function wallLoad(){ try{ var o = JSON.parse(localStorage.getItem(WPK) || "null"); if(o && typeof o === "object") return {t:o.t || "", v:o.v || "", fit:o.fit || "cover", dim:+o.dim || 0}; }catch(e){} return {t:"", v:"", fit:"cover", dim:0}; }
  function wallSave(){ try{ localStorage.setItem(WPK, JSON.stringify(st.wall)); return true; }catch(e){ return false; } }
  /* wallpaper pictures live in IndexedDB (localStorage is too small for a full-size picture) */
  function kv(mode, fn){
    return new Promise(function(res){
      try{
        var r = indexedDB.open("pb_dt", 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore("kv"); };
        r.onerror = r.onblocked = function(){ res(null); };
        r.onsuccess = function(){
          try{
            var db = r.result, tx = db.transaction("kv", mode), q = fn(tx.objectStore("kv"));
            tx.oncomplete = function(){ db.close(); res(q ? q.result : true); };
            tx.onerror = tx.onabort = function(){ db.close(); res(null); };
          }catch(e){ res(null); }
        };
      }catch(e){ res(null); }
    });
  }
  function rawIcon(v){ v = (v || "").trim(); if(!v) return ""; return isImg(v) ? '<img alt="" draggable="false" src="' + esc(v) + '" onerror="this.style.display=\'none\'">' : esc(v); }
  function sysHtml(k, def){ var o = st.ic["sys:" + k]; return o ? '<span class="dt-si">' + rawIcon(o) + '</span>' : def; }
  function getIc(key){ if(key.indexOf("sc:") === 0){ var sc = st.sc.filter(function(x){ return "sc:" + x.id === key; })[0]; return sc ? (sc.icon || "") : ""; } return st.ic[key] || ""; }
  function setIc(key, v){
    v = (v || "").trim();
    if(key.indexOf("sc:") === 0){ var sc = st.sc.filter(function(x){ return "sc:" + x.id === key; })[0]; if(sc){ sc.icon = v; scSave(); } }
    else { if(v) st.ic[key] = v; else delete st.ic[key]; icSave(); }
    refreshIcons();
  }
  function refreshIcons(){ if(!st.shell) return; buildShell(); st.wins.forEach(setTitle); }
  function applySys(){
    if(!st.shell) return;
    [["#dt-shelf .lnch", "launcher"], ["#dt-task .start", "start"]].forEach(function(p){
      var b = st.shell.querySelector(p[0]); if(!b) return; var o = st.ic["sys:" + p[1]], x = b.querySelector(".dt-si"); if(x) x.remove();
      b.classList.toggle("cust", !!o); if(o) b.appendChild(el("span", "dt-si", rawIcon(o)));
    });
  }
  /* shrink a picked picture to a small square PNG (icons) */
  function readIconFile(f, ok, bad){
    var fr = new FileReader();
    fr.onload = function(){
      var im = new Image();
      im.onload = function(){
        try{
          var c = D.createElement("canvas"), n = 128; c.width = c.height = n; var x = c.getContext("2d"), r = Math.min(im.width, im.height);
          x.drawImage(im, (im.width - r) / 2, (im.height - r) / 2, r, r, 0, 0, n, n); ok(c.toDataURL("image/png"));
        }catch(e){ bad("Couldn\u2019t read that image."); }
      };
      im.onerror = function(){ bad("That isn\u2019t an image I can read."); }; im.src = fr.result;
    };
    fr.readAsDataURL(f);
  }

  /* ---- wallpaper ---- */
  function paintWall(w, c, src, def){
    w.style.background = ""; w.style.backgroundImage = ""; w.style.backgroundSize = ""; w.style.backgroundPosition = ""; w.style.backgroundRepeat = ""; w.style.backgroundColor = "";
    if(c.t === "grad" || c.t === "color"){ w.style.background = c.v; return; }
    if(c.t === "url" || c.t === "img"){
      w.style.backgroundColor = "#111";
      if(!src) return;
      w.style.backgroundImage = 'url("' + src.replace(/"/g, "%22") + '")';
      var f = c.fit, S = {cover:["cover", "center", "no-repeat"], contain:["contain", "center", "no-repeat"], center:["auto", "center", "no-repeat"], tile:["auto", "0 0", "repeat"], stretch:["100% 100%", "center", "no-repeat"]}[f] || ["cover", "center", "no-repeat"];
      w.style.backgroundSize = S[0]; w.style.backgroundPosition = S[1]; w.style.backgroundRepeat = S[2];
    }
  }
  function wallApply(){
    var w = $("dt-wall"); if(!w || !st.wall) return;
    w.style.setProperty("--dt-dim", (st.wall.dim || 0) / 100);
    paintWall(w, st.wall, st.wallSrc);
  }
  function wallRevoke(){ if(st.wallObj){ try{ URL.revokeObjectURL(st.wallObj); }catch(e){} st.wallObj = null; } }
  function wallResolve(){
    st.wallSrc = "";
    if(st.wall.t === "url"){ st.wallSrc = st.wall.v; wallApply(); }
    else if(st.wall.t === "img"){
      wallApply();
      kv("readonly", function(s){ return s.get("wall"); }).then(function(b){
        if(!st.shell || st.wall.t !== "img") return;
        if(b && b.size){ wallRevoke(); st.wallObj = URL.createObjectURL(b); st.wallSrc = st.wallObj; }
        else { st.wall.t = ""; wallSave(); }
        wallApply();
      });
    } else wallApply();
  }
  function wallSet(c, src){ st.wall = c; st.wallSrc = src || ""; wallSave(); wallApply(); }
  function wallPicture(file, er){
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function(){
      try{
        var m = 2560, k = Math.min(1, m / Math.max(im.width, im.height)), c = D.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b){
          if(!b){ er.textContent = "Couldn\u2019t read that image."; return; }
          wallRevoke(); st.wallObj = URL.createObjectURL(b);
          wallSet({t:"img", v:"", fit:st.wall.fit === "tile" ? "tile" : (st.wall.fit || "cover"), dim:st.wall.dim}, st.wallObj);
          kv("readwrite", function(s){ return s.put(b, "wall"); }).then(function(r){ if(r === null) er.textContent = "Applied, but this browser wouldn\u2019t let me save it, so it will reset when you reload."; });
          wpSync();
        }, "image/jpeg", .9);
      }catch(e){ er.textContent = "Couldn\u2019t read that image."; }
    };
    im.onerror = function(){ URL.revokeObjectURL(url); er.textContent = "That isn\u2019t an image I can read."; };
    im.src = url;
  }
  var wpSync = function(){};

  /* =============== desktop themes: one for every site theme =============== */
  var THK = "pb_dt_theme", LAYK = "pb_dt_lay";
  function thGet(){ try{ return localStorage.getItem(THK) || "native"; }catch(e){ return "native"; } }
  function layGet(){ try{ return localStorage.getItem(LAYK) !== "0"; }catch(e){ return true; } }
  var DEF = {
    rad:"10px", tbh:"36px", shadow:"0 18px 50px rgba(0,0,0,.38),0 0 0 1px rgba(0,0,0,.22)", font:"inherit", ttlw:"600", tbbd:"1px solid var(--dt-sep)",
    tbbg:"var(--dt-tbar)", tbfg:"var(--dt-fg)", barbg:"var(--dt-glass)", barfg:"var(--dt-glassfg)", barbd:"1px solid var(--dt-sep)", dockbg:"var(--dt-glass)", dockrad:"20px",
    aibg:"linear-gradient(160deg,#fdfdfd,#d5d6dc)", aifg:"#222", cw:"28px", ch:"24px", cr:"4px", cb:"transparent", cfg:"inherit", cbd:"0", cbc:"transparent", cs:"none", cg:"2px",
    cx:'"✕"', cm:'"—"', cz:'"☐"', czr:'"❐"', chv:"rgba(127,127,127,.25)", cclose:"#c42b1c"
  };
  var MCWALL = "linear-gradient(#5d9e3a 0,#5d9e3a 7%,#3f7a27 7%,#3f7a27 9%,transparent 9%),conic-gradient(rgba(0,0,0,.28) 25%,rgba(255,255,255,.03) 0 50%,rgba(0,0,0,.18) 0 75%,rgba(255,255,255,.02) 0) 0 0/32px 32px,#4a331f";
  var TH = {
    imessage:{n:"iMessage", lay:"mac", v:{wall:"radial-gradient(900px 600px at 20% 100%,#ff6a88,transparent 60%),radial-gradient(900px 600px at 90% 0,#0a84ff,transparent 60%),linear-gradient(160deg,#0b1030,#1c1c3a)", win:"#1c1c1e", tbar:"#2c2c2e", sep:"rgba(255,255,255,.13)", fg:"#fff", glass:"rgba(44,44,46,.7)", glassfg:"#fff", hov:"rgba(255,255,255,.1)", acc:"#0a84ff"}},
    ios6:{n:"iOS 6", lay:"mac", v:{wall:"repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 2px,transparent 2px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.05) 0 2px,transparent 2px 4px),linear-gradient(#aab4c4,#8e9bb1)", win:"#d9dee7", tbar:"#cdd4df", tbbg:"linear-gradient(#eef1f6,#b7bfcc)", sep:"#8a94a6", fg:"#1c1c1e", glass:"rgba(230,234,241,.8)", glassfg:"#1c1c1e", hov:"rgba(0,0,0,.08)", acc:"#3d7fd1", rad:"7px", tbh:"34px", shadow:"0 10px 28px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.5)", dockbg:"linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,.18))", dockrad:"6px", barbg:"linear-gradient(#5a6c88,#2f3b52)", barfg:"#fff", aibg:"linear-gradient(#fff,#cfd5e0)", ttlw:"700"},
      x:"@ #dt .dt-tb{text-shadow:0 1px 0 rgba(255,255,255,.7)} @ #dt-bar{border-bottom:1px solid #1d2535;text-shadow:0 -1px 0 rgba(0,0,0,.6)} @ #dt-dock{border:1px solid rgba(255,255,255,.55);box-shadow:0 8px 24px rgba(0,0,0,.45)}"},
    discord:{n:"Discord", v:{wall:"radial-gradient(800px 600px at 15% 0,#5865f2 0,transparent 60%),radial-gradient(700px 500px at 100% 100%,#eb459e 0,transparent 60%),#1e1f22", win:"#313338", tbar:"#1e1f22", sep:"#1f2023", fg:"#dbdee1", glass:"rgba(30,31,34,.85)", glassfg:"#dbdee1", hov:"rgba(255,255,255,.08)", acc:"#5865f2", rad:"8px", tbh:"32px", aibg:"#313338", aifg:"#fff", dockrad:"16px"}},
    whatsapp:{n:"WhatsApp", v:{wall:"radial-gradient(rgba(255,255,255,.06) 1.2px,transparent 1.6px) 0 0/28px 28px,radial-gradient(700px 500px at 85% 0,#00a884 0,transparent 60%),linear-gradient(160deg,#0b141a,#111b21)", win:"#0b141a", tbar:"#202c33", sep:"#222d34", fg:"#e9edef", glass:"rgba(32,44,51,.85)", glassfg:"#e9edef", hov:"rgba(255,255,255,.08)", acc:"#00a884", rad:"12px", aibg:"#202c33", aifg:"#e9edef"}},
    tiktok:{n:"TikTok", v:{wall:"radial-gradient(700px 500px at 10% 95%,rgba(37,244,238,.6),transparent 60%),radial-gradient(700px 500px at 90% 5%,rgba(254,44,85,.6),transparent 60%),#000", win:"#121212", tbar:"#1f1f1f", sep:"#2f2f2f", fg:"#fff", glass:"rgba(18,18,18,.82)", glassfg:"#fff", hov:"rgba(255,255,255,.1)", acc:"#fe2c55", rad:"14px", aibg:"#1f1f1f", aifg:"#fff"}, x:"@ #dt .dt-win.dtact{box-shadow:-3px 0 0 rgba(37,244,238,.7),3px 0 0 rgba(254,44,85,.7),0 18px 50px rgba(0,0,0,.5)}"},
    roblox:{n:"Roblox", v:{wall:"linear-gradient(#7fd0ff 0,#d3f0ff 50%,#5fbf4a 50%,#3d8c32 100%)", win:"#232527", tbar:"#393b3d", sep:"#393b3d", fg:"#fff", glass:"rgba(35,37,39,.88)", glassfg:"#fff", hov:"rgba(255,255,255,.1)", acc:"#00a2ff", rad:"4px", tbh:"34px", ttlw:"700", aibg:"#393b3d", aifg:"#fff", dockrad:"6px", shadow:"0 6px 0 rgba(0,0,0,.25),0 0 0 2px #111"}},
    instagram:{n:"Instagram", v:{wall:"linear-gradient(135deg,#515bd4,#8134af 30%,#dd2a7b 58%,#feda77 85%,#f58529)", win:"#000", tbar:"#121212", sep:"#262626", fg:"#f5f5f5", glass:"rgba(18,18,18,.78)", glassfg:"#f5f5f5", hov:"rgba(255,255,255,.1)", acc:"#0095f6", rad:"14px"}},
    twitter:{n:"Twitter", v:{wall:"radial-gradient(900px 600px at 80% 0,#1d9bf0 0,transparent 60%),linear-gradient(160deg,#000,#0b1a26)", win:"#000", tbar:"#16181c", sep:"#2f3336", fg:"#e7e9ea", glass:"rgba(22,24,28,.85)", glassfg:"#e7e9ea", hov:"rgba(255,255,255,.1)", acc:"#1d9bf0", rad:"16px", dockrad:"26px"}},
    material:{n:"Android 17 (Material 3)", lay:"chromeos", r:1, l:1,
      v:{wall:"radial-gradient(900px 600px at 15% 100%,#6750a4 0,transparent 60%),radial-gradient(800px 600px at 90% 0,#386a20 0,transparent 55%),#141218", win:"#141218", tbar:"#211f26", sep:"rgba(202,196,208,.2)", fg:"#e6e0e9", glass:"rgba(33,31,38,.9)", glassfg:"#e6e0e9", hov:"rgba(208,188,255,.14)", acc:"#d0bcff", rad:"28px", tbh:"48px", cw:"34px", ch:"34px", cr:"50%", cb:"rgba(208,188,255,.16)", chv:"rgba(208,188,255,.3)", cclose:"#8c1d18", aibg:"#2b2930", aifg:"#e6e0e9", shadow:"0 8px 30px rgba(0,0,0,.45)", cg:"6px"},
      lv:{wall:"radial-gradient(900px 600px at 15% 100%,#d0bcff 0,transparent 60%),radial-gradient(800px 600px at 90% 0,#c4eed0 0,transparent 55%),#fef7ff", win:"#fef7ff", tbar:"#f3edf7", sep:"rgba(121,116,126,.25)", fg:"#1d1b20", glass:"rgba(243,237,247,.92)", glassfg:"#1d1b20", hov:"rgba(103,80,164,.12)", acc:"#6750a4", cb:"rgba(103,80,164,.12)", chv:"rgba(103,80,164,.24)", cclose:"#b3261e", aibg:"#e8def8", aifg:"#1d1b20", shadow:"0 8px 30px rgba(0,0,0,.18)"},
      x:"@ #dt-shelf{border-radius:28px 28px 0 0;border-top:0} @ #dt-shelf .lnch{background:var(--dt-acc);opacity:.9}"},
    kde:{n:"KDE Plasma", lay:"win11", r:1, l:1,
      v:{wall:"radial-gradient(900px 700px at 80% 100%,#3daee9 0,transparent 60%),linear-gradient(160deg,#1d99f3,#0e3a66 70%,#232629)", win:"#232629", tbar:"#31363b", tbbg:"linear-gradient(#3b4045,#31363b)", sep:"#4d5258", fg:"#eff0f1", glass:"rgba(35,38,41,.95)", glassfg:"#eff0f1", hov:"rgba(61,174,233,.2)", acc:"#3daee9", rad:"5px", tbh:"30px", cw:"22px", ch:"22px", cr:"50%", chv:"rgba(61,174,233,.3)", cclose:"#da4453", aibg:"#31363b", aifg:"#eff0f1", ttlw:"500", barbd:"1px solid #4d5258", shadow:"0 8px 24px rgba(0,0,0,.5),0 0 0 1px #1b1e20"},
      lv:{wall:"radial-gradient(900px 700px at 80% 100%,#7fcbf3 0,transparent 60%),linear-gradient(160deg,#5bb8f0,#2a7ab8 70%,#bcc2c7)", win:"#fcfcfc", tbar:"#eff0f1", tbbg:"linear-gradient(#f6f7f8,#e3e5e7)", sep:"#bcc2c7", fg:"#31363b", glass:"rgba(239,240,241,.96)", glassfg:"#31363b", aibg:"#fff", aifg:"#31363b", barbd:"1px solid #bcc2c7", shadow:"0 8px 24px rgba(0,0,0,.25),0 0 0 1px #bcc2c7"},
      x:"@ #dt-task{justify-content:flex-start;height:44px} @ #dt-task .apps{max-width:calc(100% - 200px)} @ #dt-panel{left:6px;transform:none;border-radius:6px} @ #dt-task .start::before{background:radial-gradient(circle,#3daee9 0 5px,transparent 6px);width:20px;height:20px;border-radius:50%;box-shadow:0 0 0 2px #3daee9 inset} @ #dt-task .start,@ #dt-task .dt-app{border-radius:3px} @ #dt-task .dt-app.dtact{box-shadow:inset 0 -3px 0 var(--dt-acc)}"},
    kitkat:{n:"Android 4.4 KitKat", lay:"chromeos", r:1, v:{wall:"radial-gradient(1000px 500px at 50% 0,rgba(51,181,229,.55),transparent 65%),radial-gradient(600px 300px at 10% 100%,rgba(153,204,0,.25),transparent 70%),#000", win:"#0b0b0b", tbar:"#222", tbbd:"2px solid #33b5e5", sep:"#333", fg:"#fff", glass:"rgba(0,0,0,.92)", glassfg:"#fff", hov:"rgba(51,181,229,.25)", acc:"#33b5e5", rad:"0", tbh:"36px", ttlw:"400", cw:"34px", ch:"30px", cr:"0", chv:"rgba(51,181,229,.35)", cclose:"#cc0000", aibg:"#222", aifg:"#fff", barbd:"2px solid #33b5e5", shadow:"0 6px 18px rgba(0,0,0,.7),0 0 0 1px #333"}, x:"@ #dt-shelf .lnch{background:#33b5e5} @ #dt-shelf .dt-app.dtact{box-shadow:inset 0 -3px 0 #33b5e5}"},
    terminal:{n:"Terminal", r:1, v:{wall:"repeating-linear-gradient(0deg,rgba(57,255,122,.05) 0 1px,transparent 1px 3px),radial-gradient(900px 600px at 50% 50%,#0a1d10 0,#030a05 80%)", win:"#030a05", tbar:"#0a1d10", sep:"#134d27", fg:"#8affb0", glass:"rgba(3,10,5,.92)", glassfg:"#8affb0", hov:"rgba(57,255,122,.15)", acc:"#39ff7a", rad:"0", tbh:"26px", tbfg:"#39ff7a", font:"ui-monospace,Menlo,Consolas,monospace", ttlw:"400", shadow:"0 0 0 1px #134d27,0 0 22px rgba(57,255,122,.22)", cw:"34px", ch:"20px", cr:"0", cfg:"#39ff7a", cx:'"[x]"', cm:'"[_]"', cz:'"[+]"', czr:'"[-]"', chv:"rgba(57,255,122,.2)", cclose:"#ff4d4d", aibg:"#0a1d10", aifg:"#39ff7a", dockrad:"0", barbd:"1px solid #134d27"}, x:"@ #dt-wall::after{box-shadow:inset 0 0 160px rgba(0,0,0,.7)} @ #dt .dt-app .ai{box-shadow:0 0 0 1px #134d27} @ #dt .dt-ctl button{font-family:ui-monospace,Menlo,Consolas,monospace !important;font-size:11px !important}"},
    simple:{n:"Simple", l:1, v:{wall:"#0b0b0b", win:"#000", tbar:"#161616", sep:"#1d1d1d", fg:"#ececec", glass:"rgba(22,22,22,.85)", glassfg:"#ececec", hov:"rgba(255,255,255,.1)", acc:"#fff", rad:"8px", tbh:"32px", ttlw:"500", aibg:"#161616", aifg:"#ececec", shadow:"0 10px 30px rgba(0,0,0,.5),0 0 0 1px #1d1d1d"}, lv:{wall:"#f2f2f2", win:"#fff", tbar:"#f2f2f2", sep:"#ececec", fg:"#111", glass:"rgba(255,255,255,.88)", glassfg:"#111", hov:"rgba(0,0,0,.07)", acc:"#111", aibg:"#f2f2f2", aifg:"#111", shadow:"0 10px 30px rgba(0,0,0,.12),0 0 0 1px #e4e4e4"}, x:"@ #dt-dlg button.pri{color:var(--dt-win)} @ #dt .dt-pop button:hover{color:var(--dt-win)}"},
    glass:{n:"Liquid Glass", lay:"mac", l:1, v:{wall:"radial-gradient(700px 600px at 20% 20%,#ff7ad9,transparent 60%),radial-gradient(800px 600px at 85% 25%,#5ac8fa,transparent 60%),radial-gradient(900px 700px at 55% 100%,#a58bff,transparent 65%),linear-gradient(160deg,#101a4a,#3a1c71)", win:"#0b0f2a", tbar:"rgba(255,255,255,.14)", sep:"rgba(255,255,255,.22)", fg:"#fff", glass:"rgba(255,255,255,.16)", glassfg:"#fff", hov:"rgba(255,255,255,.16)", acc:"#0a84ff", rad:"24px", tbh:"40px", dockrad:"30px", shadow:"0 20px 60px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.45),0 0 0 1px rgba(255,255,255,.25)", dockbg:"rgba(255,255,255,.18)", barbg:"rgba(255,255,255,.14)", aibg:"rgba(255,255,255,.55)", air:"14px"},
      lv:{wall:"radial-gradient(700px 600px at 20% 20%,#ffc2ec,transparent 60%),radial-gradient(800px 600px at 85% 25%,#a8e0ff,transparent 60%),radial-gradient(900px 700px at 55% 100%,#d4c6ff,transparent 65%),linear-gradient(160deg,#dfe7ff,#f3e8ff)", win:"#eef2ff", tbar:"rgba(255,255,255,.55)", sep:"rgba(255,255,255,.75)", fg:"#0f172a", glass:"rgba(255,255,255,.5)", glassfg:"#0f172a", hov:"rgba(15,23,42,.08)", dockbg:"rgba(255,255,255,.5)", barbg:"rgba(255,255,255,.45)"},
      x:"@ #dt .dt-win{-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%)} @ #dt .dt-tb{-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)} @ #dt-dock{box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 14px 40px rgba(0,0,0,.35)}"},
    win95:{n:"Windows 95", lay:"win11", r:1, v:{wall:"#008080", win:"#c0c0c0", tbar:"#c0c0c0", tbbg:"linear-gradient(90deg,#000080,#1084d0)", tbbgi:"linear-gradient(90deg,#808080,#b5b5b5)", tbfg:"#fff", tbbd:"0", sep:"#808080", fg:"#000", glass:"#c0c0c0", glassfg:"#000", hov:"rgba(0,0,128,.15)", acc:"#000080", rad:"0", tbh:"22px", font:'Tahoma,"MS Sans Serif",Verdana,sans-serif', ttlw:"700", shadow:"1px 1px 0 #000", cw:"18px", ch:"16px", cr:"0", cb:"#c0c0c0", cfg:"#000", cbd:"2px solid", cbc:"#fff #404040 #404040 #fff", chv:"#c0c0c0", cclose:"#c0c0c0", aibg:"#c0c0c0", aifg:"#000", air:"0", barbg:"#c0c0c0", barfg:"#000", barbd:"2px solid #fff", dockrad:"0", cg:"3px"},
      x:"@ #dt .dt-win{border:2px solid;border-color:#dfdfdf #404040 #404040 #dfdfdf;outline:1px solid #fff;outline-offset:-3px} @ #dt .dt-win:not(.dtact) .dt-tb{opacity:1} @ #dt .dt-ctl button{font-size:10px !important;color:#000 !important} @ #dt-task{justify-content:flex-start;height:36px} @ #dt-task .apps{max-width:calc(100% - 150px);gap:3px} @ #dt-panel{left:4px;transform:none;border-radius:0;border:2px solid;border-color:#fff #404040 #404040 #fff;background:#c0c0c0;color:#000} @ #dt-task .start{width:auto;padding:0 8px;border:2px solid;border-color:#fff #404040 #404040 #fff;background:#c0c0c0;border-radius:0;height:32px} @ #dt-task .start::after{content:\"Start\";font-weight:700;margin-left:6px;font-size:13px;color:#000} @ #dt-task .start::before{background:linear-gradient(#f33,#f33) 0 0/8px 8px no-repeat,linear-gradient(#3c3,#3c3) 10px 0/8px 8px no-repeat,linear-gradient(#36f,#36f) 0 10px/8px 8px no-repeat,linear-gradient(#fc3,#fc3) 10px 10px/8px 8px no-repeat} @ #dt-task .dt-app{border:2px solid;border-color:#fff #404040 #404040 #fff;background:#c0c0c0;border-radius:0;height:32px} @ #dt-task .dt-app.dtact{border-color:#404040 #fff #fff #404040;background:repeating-conic-gradient(#c0c0c0 0 25%,#fff 0 50%) 0 0/2px 2px} @ #dt-task .tray{border:2px solid;border-color:#808080 #fff #fff #808080;border-radius:0;color:#000}"},
    winxp:{n:"Windows XP", lay:"win11", r:1, v:{wall:"radial-gradient(1300px 420px at 25% 100%,#4fae33 0,#3f9a2a 62%,transparent 63%),radial-gradient(1500px 460px at 90% 108%,#5fbe40 0,#3f9a2a 62%,transparent 63%),linear-gradient(#2a68d0 0,#5c9be8 40%,#b7dbff 66%)", win:"#ece9d8", tbar:"#0a5fd8", tbbg:"linear-gradient(#0997ff,#0053ee 9%,#0050ee 45%,#0066ff 88%,#005bff 93%,#003dd7)", tbbgi:"linear-gradient(#7697e7,#7a96df 9%,#7b95d9 88%,#6580c9)", tbfg:"#fff", tbbd:"0", sep:"#aca899", fg:"#000", glass:"#ece9d8", glassfg:"#000", hov:"rgba(49,106,197,.2)", acc:"#316ac5", rad:"9px 9px 0 0", tbh:"30px", font:'Tahoma,"Segoe UI",Verdana,sans-serif', ttlw:"700", shadow:"0 6px 18px rgba(0,0,0,.5)", cw:"22px", ch:"22px", cr:"4px", cb:"linear-gradient(#6aa8ff,#2a62d9)", cfg:"#fff", cbd:"1px solid", cbc:"#fff", chv:"linear-gradient(#8bbcff,#3d78ec)", cclose:"#d9552b", aibg:"#fff", aifg:"#000", air:"6px", barbg:"linear-gradient(#245edb,#3f8ae5 10%,#245edb 45%,#1941a5)", barfg:"#fff", barbd:"0", dockrad:"0"},
      x:"@ #dt .dt-win{border:3px solid #0831d9;border-top:0} @ #dt .dt-win:not(.dtact){border-color:#6a82c8} @ #dt .dt-ctl [data-act=close]{background:linear-gradient(#e9946f,#c8401b) !important} @ #dt-task{justify-content:flex-start;height:40px} @ #dt-task .apps{max-width:calc(100% - 150px)} @ #dt-panel{left:0;transform:none;border-radius:8px 8px 0 0;background:#fff;color:#000;border:2px solid #0831d9} @ #dt-task .start{width:auto;padding:0 16px 0 10px;height:40px;border-radius:0 14px 14px 0;background:linear-gradient(#5cc34b,#2e8b26 55%,#3da832);box-shadow:2px 0 4px rgba(0,0,0,.35)} @ #dt-task .start::after{content:\"start\";font:italic 900 19px Tahoma,Verdana,sans-serif;color:#fff;margin-left:6px;text-shadow:1px 1px 2px rgba(0,0,0,.5)} @ #dt-task .start::before{background:linear-gradient(#f35325,#f35325) 0 0/8px 8px no-repeat,linear-gradient(#81bc06,#81bc06) 10px 0/8px 8px no-repeat,linear-gradient(#05a6f0,#05a6f0) 0 10px/8px 8px no-repeat,linear-gradient(#ffba08,#ffba08) 10px 10px/8px 8px no-repeat} @ #dt-task .dt-app{background:#3c81f3;border-radius:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.25);height:32px} @ #dt-task .dt-app.dtact{background:#1e52b7;box-shadow:inset 1px 1px 3px rgba(0,0,0,.5)} @ #dt-task .tray{background:linear-gradient(#0f9bf0,#1290e8);color:#fff;border-radius:0;height:40px;box-shadow:inset 1px 0 0 #0a5fb4}"},
    minecraft:{n:"Minecraft", r:1, v:{wall:MCWALL, win:"#c6c6c6", tbar:"#c6c6c6", tbfg:"#404040", tbbd:"3px solid #8b8b8b", sep:"#8b8b8b", fg:"#202020", glass:"rgba(60,60,60,.92)", glassfg:"#fff", hov:"rgba(85,255,85,.25)", acc:"#3c8527", rad:"0", tbh:"30px", ttlw:"400", font:'"Press Start 2P",ui-monospace,Menlo,monospace', shadow:"0 0 0 3px #000,0 10px 0 rgba(0,0,0,.35)", cw:"24px", ch:"22px", cr:"0", cb:"#8b8b8b", cfg:"#fff", cbd:"2px solid", cbc:"#fff #373737 #373737 #fff", chv:"#7d8f7d", cclose:"#a33a3a", aibg:"#8b8b8b", aifg:"#fff", air:"0", barbg:"rgba(30,30,30,.85)", barfg:"#fff", barbd:"3px solid #000", dockrad:"0", cg:"4px"},
      x:"@ #dt .dt-win{border:3px solid;border-color:#fff #373737 #373737 #fff;outline:3px solid #000} @ #dt .dt-ttl,@ #dt .dt-ctl button{font-size:9px !important;line-height:1.4} @ #dt-dock{border:3px solid #000;box-shadow:inset 0 0 0 2px #555;gap:4px;padding:4px} @ #dt .dt-app .ai{border:2px solid;border-color:#fff #373737 #373737 #8b8b8b} @ #dt-dock .dt-app:hover{transform:translateY(-6px)} @ #dt-bar{font-size:11px} @ #dt-panel{background:#c6c6c6;color:#202020;border:3px solid #000;border-radius:0} @ #dt-task .tray,@ #dt-shelf .tray{border-radius:0}"}
  };
  var TH_NAT = {"nat-mac": {"n": "macOS", "lay": "mac", "hide": 1, "v": {"wall": "url('assets/wallpapers/macos.svg') center/cover no-repeat", "win": "#1e1e1e", "tbar": "#2b2b2d", "tbbg": "#2b2b2d", "tbbgi": "#252527", "sep": "rgba(255,255,255,.1)", "fg": "#f2f2f7", "glass": "rgba(44,44,48,.62)", "glassfg": "#fff", "hov": "rgba(255,255,255,.1)", "acc": "#0a84ff", "rad": "12px", "tbh": "38px", "font": "-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"Helvetica Neue\",system-ui,sans-serif", "shadow": "0 22px 60px rgba(0,0,0,.55),0 0 0 .5px rgba(255,255,255,.18)", "dockrad": "26px", "barfg": "#fff", "aibg": "linear-gradient(160deg,#ffffff,#dfe1e8)", "aifg": "#222", "air": "22.5%", "ttlw": "600"}, "lv": {"win": "#f6f6f6", "tbar": "#ebebeb", "tbbg": "#ebebeb", "tbbgi": "#f3f3f3", "sep": "rgba(0,0,0,.12)", "fg": "#1d1d1f", "glass": "rgba(246,246,248,.7)", "glassfg": "#1d1d1f", "hov": "rgba(0,0,0,.07)", "shadow": "0 22px 60px rgba(0,0,0,.35),0 0 0 .5px rgba(0,0,0,.2)"}}, "nat-chromeos": {"n": "ChromeOS", "lay": "chromeos", "hide": 1, "r": 1, "v": {"wall": "url('assets/wallpapers/chromeos.svg') center/cover no-repeat", "win": "#202124", "tbar": "#2b2c30", "tbbg": "#2b2c30", "tbbgi": "#232427", "tbbd": "0", "sep": "rgba(255,255,255,.1)", "fg": "#e8eaed", "tbfg": "#e8eaed", "glass": "rgba(52,32,42,.9)", "glassfg": "#e8eaed", "hov": "rgba(255,255,255,.1)", "acc": "#8ab4f8", "rad": "12px", "tbh": "40px", "font": "\"Google Sans\",\"Roboto\",\"Segoe UI\",system-ui,sans-serif", "ttlw": "500", "shadow": "0 18px 50px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.1)", "barbg": "rgba(34,16,26,.62)", "barfg": "#fff", "barbd": "0", "aibg": "#fff", "aifg": "#222", "air": "50%", "cw": "34px", "ch": "34px", "cr": "50%", "cg": "0", "chv": "rgba(255,255,255,.12)", "cclose": "#d93025"}, "lv": {"win": "#ffffff", "tbar": "#f1f3f4", "tbbg": "#f1f3f4", "tbbgi": "#f8f9fa", "tbfg": "#202124", "sep": "rgba(0,0,0,.12)", "fg": "#202124", "glass": "rgba(252,246,248,.92)", "glassfg": "#202124", "hov": "rgba(0,0,0,.07)", "acc": "#1a73e8", "chv": "rgba(0,0,0,.08)", "shadow": "0 18px 50px rgba(0,0,0,.35),0 0 0 1px rgba(0,0,0,.12)"}}, "nat-win11": {"n": "Windows 11", "lay": "win11", "hide": 1, "r": 1, "v": {"wall": "url('assets/wallpapers/windows11_dark.svg') center/cover no-repeat", "win": "#202020", "tbar": "#202020", "tbbg": "#202020", "tbbgi": "#2b2b2b", "tbbd": "0", "sep": "rgba(255,255,255,.08)", "fg": "#ffffff", "tbfg": "#ffffff", "glass": "rgba(32,32,32,.9)", "glassfg": "#fff", "hov": "rgba(255,255,255,.07)", "acc": "#4cc2ff", "rad": "8px", "tbh": "32px", "ttlw": "400", "font": "\"Segoe UI Variable\",\"Segoe UI\",system-ui,sans-serif", "shadow": "0 16px 40px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.12)", "barbg": "rgba(32,32,32,.85)", "barfg": "#fff", "barbd": "1px solid rgba(255,255,255,.06)", "aibg": "linear-gradient(160deg,#ffffff,#e1e6f0)", "aifg": "#222", "air": "7px", "cw": "46px", "ch": "32px", "cr": "0", "cg": "0", "chv": "rgba(255,255,255,.08)", "cclose": "#c42b1c"}, "lv": {"wall": "url('assets/wallpapers/windows11_light.svg') center/cover no-repeat", "win": "#ffffff", "tbar": "#f3f3f3", "tbbg": "#f3f3f3", "tbbgi": "#fafafa", "tbfg": "#1b1b1b", "sep": "rgba(0,0,0,.09)", "fg": "#1b1b1b", "glass": "rgba(243,243,243,.9)", "glassfg": "#1b1b1b", "hov": "rgba(0,0,0,.05)", "acc": "#005fb8", "barbg": "rgba(243,243,243,.85)", "barfg": "#1b1b1b", "barbd": "1px solid rgba(0,0,0,.08)", "chv": "rgba(0,0,0,.06)", "shadow": "0 16px 40px rgba(0,0,0,.3),0 0 0 1px rgba(0,0,0,.14)"}}};
  Object.keys(TH_NAT).forEach(function(k){ TH[k] = TH_NAT[k]; });
  var THBASE = "body.dt-th.dt-mac #dt{--dt-air:12px}body.dt-th.dt-chromeos #dt{--dt-air:50%}body.dt-th.dt-win11 #dt{--dt-air:7px}\n" +
    "body.dt-th #dt-wall{background:var(--dt-wall)}\n" +
    "body.dt-th #dt .dt-win,body.dt-th #dt .dt-win:not(.dtact){border-radius:var(--dt-rad);box-shadow:var(--dt-shadow);font-family:var(--dt-font)}\n" +
    "body.dt-th #dt .dt-win.max,body.dt-th #dt .dt-win.snapL,body.dt-th #dt .dt-win.snapR{border-radius:0 !important}\n" +
    "body.dt-th #dt .dt-tb{height:var(--dt-tbh);background:var(--dt-tbbg);color:var(--dt-tbfg);border-bottom:var(--dt-tbbd)}\n" +
    "body.dt-th #dt .dt-win:not(.dtact) .dt-tb{background:var(--dt-tbbgi,var(--dt-tbbg))}\n" +
    "body.dt-th #dt .dt-ttl{font-weight:var(--dt-ttlw);font-family:var(--dt-font)}\n" +
    "body.dt-th #dt-bar{background:var(--dt-barbg);color:var(--dt-barfg)}\n" +
    "body.dt-th #dt-shelf,body.dt-th #dt-task{background:var(--dt-barbg);color:var(--dt-barfg);border-top:var(--dt-barbd)}\n" +
    "body.dt-th #dt-dock{background:var(--dt-dockbg);color:var(--dt-barfg);border-radius:var(--dt-dockrad)}\n" +
    "body.dt-th #dt .dt-app .ai{background:var(--dt-aibg);color:var(--dt-aifg);border-radius:var(--dt-air)}\n" +
    "body.dt-th #dt-panel,body.dt-th .dt-pop{font-family:var(--dt-font)}\n" +
    "body.dtc-r #dt .dt-tb{justify-content:flex-start;padding:0 6px 0 10px}\n" +
    "body.dtc-r #dt .dt-ctl{position:static;order:3;gap:var(--dt-cg);align-self:center}\n" +
    "body.dtc-r #dt .dt-ttl{flex:1;max-width:none;text-align:left}\n" +
    "body.dtc-r #dt .dt-ico{display:inline-flex;align-items:center}\n" +
    "body.dtc-r #dt .dt-ctl button{width:var(--dt-cw);height:var(--dt-ch);border-radius:var(--dt-cr);background:var(--dt-cb) !important;color:var(--dt-cfg);border:var(--dt-cbd);border-color:var(--dt-cbc);box-shadow:var(--dt-cs);font-size:12px;font-weight:700;line-height:1}\n" +
    "body.dtc-r #dt .dt-ctl [data-act=min]{order:1}body.dtc-r #dt .dt-ctl [data-act=max]{order:2}body.dtc-r #dt .dt-ctl [data-act=close]{order:3}\n" +
    "body.dtc-r #dt .dt-ctl [data-act=close]::before{content:var(--dt-cx)}body.dtc-r #dt .dt-ctl [data-act=min]::before{content:var(--dt-cm)}body.dtc-r #dt .dt-ctl [data-act=max]::before{content:var(--dt-cz)}\n" +
    "body.dtc-r #dt .dt-win.max .dt-ctl [data-act=max]::before{content:var(--dt-czr)}\n" +
    "body.dtc-r #dt .dt-ctl button:hover{background:var(--dt-chv) !important}\n" +
    "body.dtc-r #dt .dt-ctl [data-act=close]:hover{background:var(--dt-cclose) !important;color:#fff}\n";
  function thCss(){
    var out = [THBASE], vars = function(o){ return Object.keys(o).map(function(k){ return "--dt-" + k + ":" + o[k] + ";"; }).join(""); };
    Object.keys(TH).forEach(function(id){
      var t = TH[id], sc = "body.dt-th.dtth-" + id, v = {};
      Object.keys(DEF).forEach(function(k){ v[k] = DEF[k]; }); Object.keys(t.v).forEach(function(k){ v[k] = t.v[k]; });
      out.push(sc + " #dt{" + vars(v) + "}");
      if(t.lv) out.push(sc + ".dtl #dt{" + vars(t.lv) + "}");
      if(t.x) out.push(t.x.replace(/@ /g, sc + " ").replace(/@#/g, sc + " #"));
    });
    return out.join("\n");
  }
  function siteLight(){
    try{
      var p = D.createElement("i"); p.style.cssText = "position:absolute;visibility:hidden;width:1px;height:1px;background:var(--bg)"; B.appendChild(p);
      var m = (getComputedStyle(p).backgroundColor || "").match(/[\d.]+/g); p.remove();
      return !!m && (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) > 150;
    }catch(e){ return false; }
  }
  function thRaw(){ var c = thGet(); if(c === "native") return natId(); if(c === "match") c = B.dataset.theme || "imessage"; if(c === "macos" && TH["nat-mac"]) c = "nat-mac"; return TH[c] ? c : "imessage"; }
  function thLayout(os){ if(!os) return os; if(layGet()){ var l = TH[thRaw()].lay; if(l) return l; } return os; }
  function thClear(){ Array.prototype.slice.call(B.classList).forEach(function(c){ if(/^dtth-/.test(c) || c === "dtl" || c === "dtc-r" || c === "dt-th") B.classList.remove(c); }); }

  /* =============== Terminal desktop theme: no dock, you type the name of a tab to open it ===============
     Active whenever the desktop theme is "Terminal" (pick it in Customize desktop, or set the site theme to Terminal with
     "Match my site"). /help lists every tab name and command. */
  var TTY = {hist:[], hi:0}; window.__dtT0 = window.__dtT0 || Date.now();
  function ttyNames(){
    var out = [];
    tabs().forEach(function(t){ out.push({key:t.label.toLowerCase(), label:t.label, ch:t.ch, sc:null}); });
    st.sc.forEach(function(sc){ out.push({key:String(sc.name).toLowerCase(), label:sc.name, ch:"sc:" + sc.id, sc:sc}); });
    return out;
  }
  function ttySync(on){
    var el = $("dt-tty");
    if(!on){ if(el) el.remove(); return; }
    if(!$("dt-tty-css")){
      var cs = D.createElement("style"); cs.id = "dt-tty-css";
      cs.textContent =
        "body.dt-on.dtth-terminal #dt-dock,body.dt-on.dtth-terminal #dt-shelf,body.dt-on.dtth-terminal #dt-task{display:none !important}" +
        "body.dt-on.dtth-terminal #dt{--dt-bot:36px !important}" +
        "#dt-tty{position:absolute;left:0;right:0;bottom:0;z-index:99985;display:flex;flex-direction:column;font-family:var(--dt-font,ui-monospace,Menlo,Consolas,monospace);font-size:14px;color:var(--dt-fg,#8affb0);user-select:text;-webkit-user-select:text}" +
        "#dt-tty .o{display:none;max-height:58vh;overflow:auto;padding:8px 14px;background:rgba(3,10,5,.9);border-top:1px solid var(--dt-sep,#134d27);white-space:pre-wrap;line-height:1.45;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}" +
        "#dt-tty .ff{display:flex;gap:24px;align-items:center;padding:6px 0 10px}#dt-tty .ff img{width:140px;height:auto;flex:none;filter:drop-shadow(0 0 10px rgba(57,255,122,.35))}#dt-tty .ff pre{margin:0;font:inherit;line-height:1.4;white-space:pre-wrap;min-width:0}#dt-tty .ff .k{color:var(--dt-acc,#39ff7a);font-weight:700}#dt-tty .ff .sw{display:inline-block;width:2.2ch;height:1.1em;vertical-align:middle}@media(max-width:560px){#dt-tty .ff img{width:80px}#dt-tty .ff{gap:12px}}" +
        "#dt-tty .o.on{display:block}#dt-tty .o .e{color:#ff6b6b}#dt-tty .o .c{color:var(--dt-acc,#39ff7a)}#dt-tty .o .d{opacity:.7}" +
        "#dt-tty .p{display:flex;align-items:center;gap:8px;height:36px;box-sizing:border-box;padding:0 14px;background:rgba(3,10,5,.96);border-top:1px solid var(--dt-sep,#134d27);cursor:text}" +
        "#dt-tty .p b{color:var(--dt-acc,#39ff7a);font-weight:700;white-space:nowrap}" +
        "#dt-tty input,#dt-tty input:focus,#dt-tty input:focus-visible{flex:1;min-width:0;background:none !important;border:none !important;outline:none !important;box-shadow:none !important;color:inherit;font:inherit;caret-color:var(--dt-acc,#39ff7a);padding:0}";
      D.head.appendChild(cs);
    }
    if(el) return;
    el = D.createElement("div"); el.id = "dt-tty";
    el.innerHTML = '<div class="o" id="dt-tty-o" aria-live="polite"></div><div class="p"><b id="dt-tty-ps"></b><input id="dt-tty-i" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal: type a tab name, or /help"></div>';
    st.shell.appendChild(el);
    var inp = $("dt-tty-i"), out = $("dt-tty-o");
    function who(){ var u = (typeof usr !== "undefined" && usr) || "guest"; return String(u).toLowerCase().replace(/[^a-z0-9_.-]+/g, "") || "guest"; }
    $("dt-tty-ps").textContent = who() + "@purebreds:~$";
    function say(txt, cls){ var d = D.createElement("div"); if(cls) d.className = cls; d.textContent = txt; out.appendChild(d); out.classList.add("on"); out.scrollTop = out.scrollHeight; }
    function ff(){
      var ua = navigator.userAgent, br = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
      var ver = (/(?:Edg|Firefox|Chrome|Version)\/([\d.]+)/.exec(ua) || [])[1] || "";
      var plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "unknown";
      var up = Math.max(1, Math.round((Date.now() - (window.__dtT0 || Date.now())) / 60000));
      var nameOf = {mac:"macOS layout", chromeos:"ChromeOS layout", win11:"Windows layout"}[st.os] || st.os;
      var rows = [
        ["", who() + "@purebreds"], ["", "-".repeat(who().length + 10)],
        ["OS", "Los PureBreds 3.0"], ["Host", br + (ver ? " " + ver.split(".")[0] : "") + " on " + plat],
        ["Kernel", "purebreds-web"], ["Uptime", up + " min"],
        ["Packages", tabs().length + " tabs" + (st.sc.length ? ", " + st.sc.length + " shortcuts" : "")],
        ["Shell", "purebreds-term"], ["Resolution", window.innerWidth + "x" + window.innerHeight],
        ["DE", "Desktop mode (" + nameOf + ")"], ["Theme", "Terminal [" + (B.dataset.theme || "imessage") + "]"],
        ["Windows", st.wins.length + " open"], ["CPU", (navigator.hardwareConcurrency || "?") + " threads"],
        ["Memory", navigator.deviceMemory ? "~" + navigator.deviceMemory + " GB" : "unknown"],
        ["Network", navigator.onLine === false ? "offline" : "online"]
      ];
      var d = D.createElement("div"); d.className = "ff";
      var im = D.createElement("img"); im.alt = ""; im.draggable = false;
      try{ im.src = typeof LOGO === "string" ? LOGO : ""; }catch(e){}
      var pre = D.createElement("pre");
      rows.forEach(function(r, i){
        if(!r[0]){ var b = D.createElement("span"); b.className = i ? "" : "k"; b.textContent = r[1]; pre.appendChild(b); pre.appendChild(D.createTextNode("\n")); return; }
        var k = D.createElement("span"); k.className = "k"; k.textContent = r[0]; pre.appendChild(k); pre.appendChild(D.createTextNode(": " + r[1] + "\n"));
      });
      pre.appendChild(D.createTextNode("\n"));
      ["#e5484d", "#f5a623", "#e5d02b", "#39ff7a", "#12a594", "#3e63dd", "#8e4ec6", "#e6e6e6"].forEach(function(c){ var w = D.createElement("span"); w.className = "sw"; w.style.background = c; pre.appendChild(w); });
      d.append(im, pre); out.appendChild(d); out.classList.add("on"); out.scrollTop = out.scrollHeight;
    }
    function help(){
      var n = ttyNames();
      say("Type the name of a tab to open it:", "c");
      n.forEach(function(x){ say("  " + x.key + (x.sc ? "   (website shortcut, opens in a new browser tab)" : ""), ""); });
      say("Commands:", "c");
      [["/help", "show this list"], ["/fastfetch", "system info with the Los PureBreds mascot"], ["/list", "show the open windows"], ["/close <name|all>", "close a window"], ["/clear", "clear this screen"], ["/customize", "wallpaper and icons"], ["/exit", "leave desktop mode"]].forEach(function(c){ say("  " + c[0] + "   " + c[1], "d"); });
    }
    function find(q){
      var n = ttyNames(), ex = n.filter(function(x){ return x.key === q || x.ch === q; });
      if(ex.length) return ex;
      return n.filter(function(x){ return x.key.indexOf(q) === 0; });
    }
    function run(line){
      var l = line.trim(); if(!l) return;
      say(who() + "@purebreds:~$ " + l, "d");
      TTY.hist.push(l); TTY.hi = TTY.hist.length;
      var q = l.toLowerCase();
      if(q.charAt(0) === "/"){
        var parts = q.slice(1).split(/\s+/), cmd = parts[0], arg = parts.slice(1).join(" ");
        if(cmd === "help" || cmd === "?" || cmd === "ls" || cmd === "tabs") help();
        else if(cmd === "fastfetch" || cmd === "neofetch") ff();
        else if(cmd === "clear"){ out.innerHTML = ""; out.classList.remove("on"); }
        else if(cmd === "list" || cmd === "windows"){
          if(!st.wins.length) say("No windows are open.", "d");
          st.wins.forEach(function(w){ say("  " + w.label + (w.min ? " (minimized)" : ""), ""); });
        }
        else if(cmd === "close"){
          if(!arg) say("Usage: /close <name|all>", "e");
          else if(arg === "all"){ st.wins.slice().forEach(closeWin); say("Closed every window.", "d"); }
          else {
            var hit = st.wins.filter(function(w){ return String(w.label).toLowerCase().indexOf(arg) === 0; });
            if(!hit.length) say("No open window called \"" + arg + "\".", "e"); else { hit.forEach(closeWin); say("Closed " + hit.length + " window" + (hit.length > 1 ? "s" : "") + ".", "d"); }
          }
        }
        else if(cmd === "customize"){ openCustomize(); }
        else if(cmd === "exit" || cmd === "quit"){ exit(); }
        else say("Unknown command: /" + cmd + ". Type /help to see all the names of the tabs.", "e");
        return;
      }
      if(q === "fastfetch" || q === "neofetch"){ ff(); return; }
      if(q.indexOf("open ") === 0) q = q.slice(5).trim();
      var m = find(q);
      if(m.length === 1){ var t = m[0]; say("opening " + t.label + "…", "c"); if(t.sc) launchSc(t.sc.id); else launch(t.ch); out.classList.remove("on"); out.innerHTML = ""; }
      else if(m.length > 1) say("Which one? " + m.map(function(x){ return x.key; }).join(", "), "e");
      else say("command not found: " + l + ". Type /help to see all the names of the tabs.", "e");
    }
    inp.addEventListener("keydown", function(e){
      if(e.key === "Enter"){ e.preventDefault(); var v = inp.value; inp.value = ""; run(v); }
      else if(e.key === "ArrowUp"){ e.preventDefault(); if(TTY.hi > 0) inp.value = TTY.hist[--TTY.hi] || ""; }
      else if(e.key === "ArrowDown"){ e.preventDefault(); TTY.hi = Math.min(TTY.hist.length, TTY.hi + 1); inp.value = TTY.hist[TTY.hi] || ""; }
      else if(e.key === "Escape"){ out.classList.remove("on"); }
      else if(e.key === "Tab"){
        e.preventDefault(); var v = inp.value.toLowerCase().replace(/^open /, ""); if(!v) return;
        var pool = ttyNames().map(function(x){ return x.key; }).concat(["/help", "/fastfetch", "/list", "/close", "/clear", "/customize", "/exit", "fastfetch"]);
        var c = pool.filter(function(k){ return k.indexOf(v) === 0; });
        if(c.length === 1) inp.value = c[0]; else if(c.length > 1) say(c.join("   "), "d");
      }
    });
    el.querySelector(".p").addEventListener("mousedown", function(e){ if(e.target !== inp){ e.preventDefault(); inp.focus(); } });
    ff();
    say("Type the name of a tab to open it. Type /help to see all the names of the tabs. (/fastfetch shows this again.)", "c");
    out.scrollTop = 0;
    setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 60);
  }
  function applyTheme(){
    if(!st.os) return;
    var want = thLayout(saved());
    if(want && want !== st.os){ apply(want); return; }
    var id = thRaw(), t = TH[id], light = false;
    if(t.lv) light = thGet() === "match" ? siteLight() : !(window.matchMedia && matchMedia("(prefers-color-scheme:dark)").matches);
    thClear(); B.classList.add("dt-th", "dtth-" + id); if(light) B.classList.add("dtl"); if(t.r) B.classList.add("dtc-r");
    ttySync(id === "terminal");
    var s = $("dt-th-css"); if(!s){ s = D.createElement("style"); s.id = "dt-th-css"; s.textContent = thCss(); D.head.appendChild(s); }
    if(st.shell && st._nat !== isNat()){ buildShell(); }
  }
  function themePane(pane){
    pane.innerHTML = '<small>Windows, bars and the wallpaper take on the look of a theme. “Match my site” follows whichever theme you pick in Settings. (The chat inside each window keeps your site theme.)</small>' +
      '<div class="wp-grid th-grid" id="th-grid"></div>' +
      '<label class="chk" style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input type="checkbox" id="th-lay" style="margin-top:2px"><span>Switch the desktop layout to suit the theme (Windows 95 / XP / KDE get a taskbar, KitKat and Android 17 a shelf, iMessage / iOS 6 / Liquid Glass a dock). Switching layout closes open windows.</span></label>';
    var g = $("th-grid"), cur = thGet();
    function chip(id, label, wall){
      var b = el("button"); b.type = "button"; b.dataset.id = id; b.textContent = label; b.style.background = wall; b.title = label;
      b.onclick = function(){
        var oldShell = st.shell; try{ localStorage.setItem(THK, id); }catch(e){}
        applyTheme(); if(st.shell !== oldShell){ openCustomize("theme"); return; }
        if(st.shell){ buildShell(); }
        mark();
      };
      return b;
    }
    g.appendChild(chip("native", "Native look (macOS / ChromeOS / Windows 11)", TH[thRawFor("native")].v.wall));
    g.appendChild(chip("match", "Match my site (" + TH[B.dataset.theme && TH[B.dataset.theme] ? B.dataset.theme : "imessage"].n + ")", TH[thRawFor("match")].v.wall));
    Object.keys(TH).forEach(function(id){ if(!TH[id].hide) g.appendChild(chip(id, TH[id].n, TH[id].v.wall)); });
    function mark(){ cur = thGet(); g.querySelectorAll("button").forEach(function(b){ b.classList.toggle("on", b.dataset.id === cur); }); }
    mark();
    var cb = $("th-lay"); cb.checked = layGet();
    cb.onchange = function(){
      var oldShell = st.shell; try{ localStorage.setItem(LAYK, cb.checked ? "1" : "0"); }catch(e){}
      var want = thLayout(saved()); if(want && want !== st.os){ apply(want); }
      if(st.shell !== oldShell) openCustomize("theme");
    };
  }
  function thRawFor(c){ if(c === "native") return natId(); if(c === "match") c = B.dataset.theme || "imessage"; if(c === "macos" && TH["nat-mac"]) c = "nat-mac"; return TH[c] ? c : "imessage"; }

  /* ---- small context menu at the pointer ---- */
  function ctx(x, y, items, keep){
    pop({getBoundingClientRect:function(){ return {left:x, right:x, top:y, bottom:y}; }, classList:{add:function(){}, remove:function(){}}}, items, "", keep);
  }
  function appKey(t){ return t.sc ? "sc:" + t.sc.id : "app:" + t.ch; }
  function appDef(t){ return t.sc ? scIcon({name:t.sc.name, url:t.sc.url, icon:""}) : esc(icoOf(t)); }
  /* ---- pin / unpin apps on the dock (macOS) / shelf (ChromeOS) / taskbar (Windows) ----
     Every app starts pinned. An unpinned app leaves the dock but stays in Launchpad / the launcher / Start, and
     shows in the dock again (like a real OS) while one of its windows is open. */
  function dockName(){ return st.os === "mac" ? "Dock" : st.os === "chromeos" ? "shelf" : "taskbar"; }
  function isPinned(t){ return st.un.indexOf(appKey(t)) < 0; }
  function setPinned(t, on){
    var k = appKey(t), i = st.un.indexOf(k);
    if(on && i > -1) st.un.splice(i, 1); else if(!on && i < 0) st.un.push(k);
    unSave(); refreshDock();
  }
  function appMenu(t, back){
    var k = appKey(t), items = [["Open", function(){ if(t.sc) launchSc(t.sc.id); else launch(t.ch); }], [isPinned(t) ? "Unpin from " + dockName() : "Pin to " + dockName(), function(){ setPinned(t, !isPinned(t)); }], ["Change icon…", function(){ iconEditor(k, t.label, appDef(t), back); }]];
    if(getIc(k)) items.push([t.sc ? "Use the site\u2019s icon" : "Reset icon", function(){ setIc(k, ""); }]);
    if(t.sc){ items.push("-", ["Edit shortcut…", function(){ shortcutDialog(t.sc); }], ["Remove shortcut", function(){ removeSc(t.sc.id); }]); }
    items.push("-", ["Customize desktop…", function(){ openCustomize(); }]);
    return items;
  }

  /* ---- icon editor ---- */
  function iconEditor(key, title, defHtml, back){
    var old = $("dt-dlg"); if(old) old.remove();
    var cur = getIc(key), pending = /^data:/.test(cur) ? cur : "", d = el("div"); d.id = "dt-dlg";
    d.innerHTML = '<div class="box"><h4>Change icon</h4><small>' + esc(title) + '</small>' +
      '<div class="ir"><span class="pv" id="dti-pv"></span><input type="text" id="dti-i" placeholder="Type an emoji, or paste an image link" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="emo" id="dti-e"></div>' +
      '<div class="ir"><button type="button" id="dti-up">⬆ Upload an image</button><button type="button" id="dti-rs">' + (key.indexOf("sc:") === 0 ? "Use the site\u2019s icon" : "Reset to default") + '</button><input type="file" id="dti-f" accept="image/*" style="display:none"></div>' +
      '<div class="err" id="dti-er"></div><div class="btns"><button type="button" id="dti-c">Back</button><button type="button" class="pri" id="dti-s">Save</button></div></div>';
    st.shell.appendChild(d);
    var inp = $("dti-i"), pv = $("dti-pv"), er = $("dti-er");
    inp.value = /^data:/.test(cur) ? "" : cur;
    function val(){ return pending || inp.value.trim(); }
    function prev(){ var v = val(); pv.innerHTML = v ? rawIcon(v) : defHtml; }
    inp.oninput = function(){ pending = ""; prev(); }; prev();
    var eg = $("dti-e"); EMOJIS.forEach(function(e){ var b = el("button"); b.type = "button"; b.textContent = e; b.onclick = function(){ pending = ""; inp.value = e; prev(); }; eg.appendChild(b); });
    $("dti-up").onclick = function(){ $("dti-f").click(); };
    $("dti-f").onchange = function(){ var f = this.files && this.files[0]; this.value = ""; if(!f) return; readIconFile(f, function(u){ pending = u; inp.value = ""; er.textContent = ""; prev(); }, function(m){ er.textContent = m; }); };
    function close(){ d.remove(); if(back) back(); }
    $("dti-c").onclick = close; d.addEventListener("mousedown", function(e){ if(e.target === d) close(); });
    $("dti-rs").onclick = function(){ d.remove(); setIc(key, ""); if(back) back(); };
    $("dti-s").onclick = function(){ var v = val(); if(v && !isImg(v) && v.length > 8){ er.textContent = "Use one emoji or a short symbol, or an image."; return; } d.remove(); setIc(key, v); if(back) back(); };
    setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 30);
  }

  /* ---- the Customize desktop window ---- */
  function openCustomize(tab){
    closePops();
    var old = $("dt-dlg"); if(old) old.remove();
    var d = el("div"); d.id = "dt-dlg"; d.className = "cust"; tab = tab || "wall";
    d.innerHTML = '<div class="box wide"><h4>Customize desktop</h4><div class="tabs"><button type="button" data-t="wall">🖼️ Wallpaper</button><button type="button" data-t="ico">🎨 Icons</button><button type="button" data-t="theme">🎭 Theme</button></div><div class="pane" style="display:flex;flex-direction:column;gap:9px"></div><div class="btns"><button type="button" class="pri" id="dtc-x">Done</button></div></div>';
    st.shell.appendChild(d);
    var pane = d.querySelector(".pane"), tb = d.querySelectorAll(".tabs button");
    function show(t){ tab = t; tb.forEach(function(b){ b.classList.toggle("on", b.dataset.t === t); }); wpSync = function(){}; if(t === "wall") wallPane(pane); else if(t === "theme") themePane(pane); else iconPane(pane); }
    tb.forEach(function(b){ b.onclick = function(){ show(b.dataset.t); }; });
    $("dtc-x").onclick = function(){ d.remove(); }; d.addEventListener("mousedown", function(e){ if(e.target === d) d.remove(); });
    show(tab);
  }
  function wallPane(pane){
    var c = st.wall;
    pane.innerHTML = '<div class="wp-prev" id="wp-prev"></div>' +
      '<label>Pick one</label><div class="wp-grid" id="wp-grid"></div>' +
      '<label>Or use your own</label>' +
      '<div class="ir"><button type="button" id="wp-up">⬆ Upload a picture</button><input type="file" id="wp-f" accept="image/*" style="display:none"><span style="flex:1"></span><small>Solid color</small><input type="color" id="wp-col" value="' + (c.t === "color" && /^#[0-9a-f]{6}$/i.test(c.v) ? c.v : "#1b2a6b") + '"></div>' +
      '<div class="ir"><input type="text" id="wp-url" placeholder="…or paste a link to a picture" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" id="wp-go">Use</button></div>' +
      '<label>Picture fit</label><select id="wp-fit"><option value="cover">Fill the screen</option><option value="contain">Fit inside</option><option value="center">Center (original size)</option><option value="tile">Tile</option><option value="stretch">Stretch</option></select>' +
      '<label>Darken picture: <span id="wp-dv"></span>%</label><input type="range" id="wp-dim" min="0" max="70" step="1">' +
      '<div class="err" id="wp-er"></div><div class="ir"><button type="button" id="wp-rs">Reset to default wallpaper</button></div>';
    var prev = $("wp-prev"), er = $("wp-er"), grid = $("wp-grid");
    function sync(){
      var w = $("dt-wall"), cs = getComputedStyle(w);
      prev.style.backgroundImage = cs.backgroundImage; prev.style.backgroundColor = cs.backgroundColor; prev.style.backgroundSize = cs.backgroundSize; prev.style.backgroundPosition = cs.backgroundPosition; prev.style.backgroundRepeat = cs.backgroundRepeat;
      prev.style.setProperty("--dt-dim", (st.wall.dim || 0) / 100);
      grid.querySelectorAll("button").forEach(function(b){ b.classList.toggle("on", b.dataset.d ? st.wall.t === "" : ((st.wall.t === "grad" || st.wall.t === "color") && st.wall.v === b.dataset.v)); });
      $("wp-fit").value = st.wall.fit || "cover"; $("wp-dim").value = st.wall.dim || 0; $("wp-dv").textContent = st.wall.dim || 0;
      $("wp-fit").disabled = !(st.wall.t === "url" || st.wall.t === "img");
    }
    wpSync = sync;
    var df = el("button"); df.type = "button"; df.dataset.d = "1"; df.textContent = "Theme"; df.style.background = "var(--dt-hov)"; df.onclick = function(){ wallSet({t:"", v:"", fit:st.wall.fit, dim:st.wall.dim}); sync(); }; grid.appendChild(df);
    PRESETS.forEach(function(p){
      var b = el("button"); b.type = "button"; b.dataset.v = p[1]; b.title = p[0]; b.style.background = p[1];
      b.onclick = function(){ wallSet({t:/^#/.test(p[1]) ? "color" : "grad", v:p[1], fit:st.wall.fit, dim:st.wall.dim}); sync(); };
      grid.appendChild(b);
    });
    $("wp-up").onclick = function(){ $("wp-f").click(); };
    $("wp-f").onchange = function(){ var f = this.files && this.files[0]; this.value = ""; er.textContent = ""; if(f) wallPicture(f, er); };
    $("wp-col").oninput = function(){ wallSet({t:"color", v:this.value, fit:st.wall.fit, dim:st.wall.dim}); sync(); };
    $("wp-go").onclick = function(){
      var u = $("wp-url").value.trim(); if(!u) return;
      if(!/^https?:\/\//i.test(u)) u = "https://" + u;
      er.textContent = "Loading…"; var im = new Image();
      im.onload = function(){ er.textContent = ""; wallRevoke(); wallSet({t:"url", v:u, fit:st.wall.fit, dim:st.wall.dim}, u); kv("readwrite", function(s){ return s.delete("wall"); }); sync(); };
      im.onerror = function(){ er.textContent = "That link didn\u2019t load as a picture. Try uploading the file instead."; }; im.src = u;
    };
    $("wp-fit").onchange = function(){ st.wall.fit = this.value; wallSave(); wallApply(); sync(); };
    $("wp-dim").oninput = function(){ st.wall.dim = +this.value; wallSave(); wallApply(); sync(); };
    $("wp-rs").onclick = function(){ wallRevoke(); wallSet({t:"", v:"", fit:"cover", dim:0}); kv("readwrite", function(s){ return s.delete("wall"); }); sync(); };
    sync();
  }
  function iconPane(pane){
    function row(label, key, curHtml, defHtml){
      var b = el("button", "ic-row"); b.type = "button";
      b.innerHTML = '<span class="pv">' + curHtml + '</span><span class="nm">' + esc(label) + '</span><span class="ed">' + (getIc(key) ? "Custom · " : "") + 'Change ›</span>';
      b.onclick = function(){ iconEditor(key, label, defHtml, function(){ openCustomize("ico"); }); };
      return b;
    }
    pane.innerHTML = '<div class="ic-list"></div><div class="ir"><button type="button" id="ic-rs">Reset all icons</button></div>';
    var ls = pane.querySelector(".ic-list");
    ls.appendChild(el("div", "ic-h", "Apps and tabs"));
    allApps().forEach(function(t){ ls.appendChild(row(t.label, appKey(t), iconHtml(t), appDef(t))); });
    ls.appendChild(el("div", "ic-h", "Desktop"));
    Object.keys(SYS).forEach(function(k){
      var s = SYS[k]; if(s[2] && s[2].split(",").indexOf(st.os) < 0) return;
      var def = s[1] ? esc(s[1]) : (k === "launcher" ? "◯" : "⊞");
      ls.appendChild(row(s[0], "sys:" + k, st.ic["sys:" + k] ? rawIcon(st.ic["sys:" + k]) : def, def));
    });
    $("ic-rs").onclick = function(){
      if(!confirm("Remove every custom icon, including the icons you gave your website shortcuts?")) return;
      st.ic = {}; icSave(); st.sc.forEach(function(sc){ sc.icon = ""; }); scSave(); refreshIcons(); iconPane(pane);
    };
  }

  function tabs(){
    var out = [], seen = {};
    D.querySelectorAll("#chtabs button").forEach(function(b){
      var ch = b.dataset.ch; if(!ch || seen[ch] || b.hidden || b.style.display === "none") return; seen[ch] = 1;
      var t = (b.textContent || "").trim(), m = /^(\S+)\s+(.+)$/.exec(t), ic = null, lb = t;
      if(m && !/^[A-Za-z0-9]/.test(m[1])){ ic = m[1]; lb = m[2]; }
      out.push({ch:ch, icon:ic, label:lb || ch});
    });
    return out;
  }
  function tabOf(ch){ return tabs().filter(function(t){ return t.ch === ch; })[0] || null; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function hostOf(u){ try{ return new URL(u).hostname; }catch(e){ return ""; } }
  function isImg(v){ return /^(data:image\/|https?:\/\/)/i.test(v || ""); }
  function scIcon(sc){
    var v = (sc.icon || "").trim(), nm = (sc.name || hostOf(sc.url) || "?").charAt(0).toUpperCase();
    if(isImg(v)) return '<img alt="" draggable="false" src="' + esc(v) + '" onerror="this.replaceWith(document.createTextNode(\'' + esc(nm) + '\'))">';
    if(v) return esc(v);
    var h = hostOf(sc.url);
    return h ? '<img alt="" draggable="false" src="https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=64" onerror="this.replaceWith(document.createTextNode(\'' + esc(nm) + '\'))">' : esc(nm);
  }
  function iconHtml(t){ if(t.sc) return scIcon(t.sc); var o = st.ic["app:" + t.ch]; return o ? rawIcon(o) : esc(icoOf(t)); }
  function allApps(){
    return tabs().concat(st.sc.map(function(sc){ return {ch:"sc:" + sc.id, label:sc.name, icon:null, sc:sc}; }));
  }
  function icoOf(t){ return t.icon || (t.label || "?").charAt(0).toUpperCase(); }
  function el(tag, cls, html){ var e = D.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function area(){ var r = st.shell.getBoundingClientRect(), cs = getComputedStyle(st.shell), top = parseFloat(cs.getPropertyValue("--dt-top")) || 0, bot = parseFloat(cs.getPropertyValue("--dt-bot")) || 0; return {w:r.width, h:r.height - top - bot, top:top}; }
  function small(){ return window.innerWidth < 720; }

  /* The app's phone layout is chosen with @media (max-width) = the whole browser. A window is narrower than the browser,
     so copy those rules as @container rules: each window then lays out by its own width. */
  var WRE = /^\s*(screen\s+and\s+)?\(\s*(max|min)-width:\s*[\d.]+px\s*\)(\s+and\s+\(\s*(max|min)-width:\s*[\d.]+px\s*\))*\s*$/;
  function buildCQ(){
    var out = [];
    try{
      Array.prototype.forEach.call(D.styleSheets, function(sh){
        if(!sh.ownerNode || sh.ownerNode.id === "dt-cq") return;
        var rules; try{ rules = sh.cssRules; }catch(e){ return; }
        Array.prototype.forEach.call(rules, function(r){
          if(r.type !== 4 || !WRE.test(r.media.mediaText)) return;
          var cond = r.media.mediaText.replace(/^\s*screen\s+and\s+/i, "");
          var inner = Array.prototype.map.call(r.cssRules, function(x){ return x.cssText; }).join("\n");
          out.push("@container dtl " + cond + "{" + inner + "}");
        });
      });
    }catch(e){}
    var st2 = $("dt-cq"); if(!st2){ st2 = D.createElement("style"); st2.id = "dt-cq"; }
    st2.textContent = out.join("\n"); B.appendChild(st2);
  }

  /* ---- build / tear down ---- */
  function apply(os){
    if(EMB) return;
    if(os === "win") os = "win11";
    if(st.os) teardown();
    if(!os) return;
    os = thLayout(os);
    st.os = os; st.sc = scLoad(); st.un = unLoad(); st.ic = icLoad(); st.wall = wallLoad(); B.classList.add("dt-on", "dt-" + os);
    /* the "move the side bar to the bottom" feature makes no sense on a desktop (the dock is the bar): switch it off while desktop mode is on */
    if(!$("dt-nobar")){ var nb = D.createElement("style"); nb.id = "dt-nobar"; nb.textContent = "body.dt-on.dt-on .stg-sb.stg-sb button#sb-dock.stg-btn,body.dt-on.dt-on #sb-dock{display:none !important}"; D.head.appendChild(nb); }
    st.sbb = B.classList.contains("sb-bottom"); B.classList.remove("sb-bottom");
    var sh = el("div"); sh.id = "dt"; st.shell = sh;
    sh.innerHTML = '<div id="dt-wall"></div><div id="dt-wins"></div><div id="dt-ghost"></div>' +
      '<div id="dt-bar" class="dt-glass-x"></div><div id="dt-dock" class="dt-glass"></div>' +
      '<div id="dt-shelf"><button class="lnch" type="button" title="Launcher"></button><div class="apps"></div><button class="tray" type="button"></button></div>' +
      '<div id="dt-task"><div class="apps"><button class="start" type="button" title="Start"></button></div><button class="tray" type="button"></button></div>' +
      '<div id="dt-panel" class="dt-glass"></div><div id="dt-lpad"></div><div class="dt-pop dt-glass" id="dt-pop"></div>';
    B.appendChild(sh);
    st.park = el("div"); st.park.id = "dt-park"; B.appendChild(st.park);
    /* hand the live app to the desktop: remember where each piece was */
    st.liveHost = el("div", "dt-live");
    st.ph = [];
    APPEL.forEach(function(id){ var e = $(id); if(!e) return; var c = D.createComment("dt:" + id); e.before(c); st.ph.push({c:c, e:e}); st.liveHost.appendChild(e); });
    st.park.appendChild(st.liveHost);
    st.ro = window.ResizeObserver ? new ResizeObserver(function(){ st.liveHost.classList.toggle("wide", st.liveHost.clientWidth >= 640); }) : null;
    if(st.ro) st.ro.observe(st.liveHost);
    buildShell(); wallResolve(); applyTheme();
    try{ st.thObs = new MutationObserver(function(){ applyTheme(); }); st.thObs.observe(B, {attributes:true, attributeFilter:["data-theme"]}); }catch(e){}
    var wa = $("dt-wins");
    sh.addEventListener("contextmenu", function(e){
      if(e.target !== sh && e.target.id !== "dt-wall") return; e.preventDefault();
      ctx(e.clientX, e.clientY, [["Change wallpaper…", function(){ openCustomize("wall"); }], ["Customize icons…", function(){ openCustomize("ico"); }], ["New shortcut…", function(){ shortcutDialog(null); }], "-", ["Exit desktop mode", exit]]);
    });
    sh.addEventListener("mousedown", function(e){ if(!e.target.closest("#dt-panel,#dt-pop,#dt-cc,#dt-bar,.start,.lnch,.tray")) closePops(); }, true);
    window.addEventListener("resize", onResize);
    st.tabObs = new MutationObserver(function(){ refreshDock(); });
    var ct = $("chtabs"); if(ct) st.tabObs.observe(ct, {childList:true, subtree:true, characterData:true});
    st.clock = setInterval(tick, 15000); tick();
    buildCQ(); setTimeout(buildCQ, 2500);
    var cur = (typeof curCh !== "undefined" && curCh) || "main", t = tabOf(cur) || tabOf("home") || tabOf("main") || {ch:"main", label:"Chat", icon:"💬"};
    var w = openWin(t, {big:true}); focus(w);
  }
  function teardown(){
    try{ clearInterval(st.clock); window.removeEventListener("resize", onResize); if(st.tabObs) st.tabObs.disconnect(); if(st.ro) st.ro.disconnect(); }catch(e){}
    st.ph.forEach(function(p){ try{ p.c.replaceWith(p.e); }catch(e){} });
    if(st.liveHost) st.liveHost.remove(); if(st.park) st.park.remove(); if(st.shell) st.shell.remove();
    B.classList.remove("dt-on", "dt-mac", "dt-chromeos", "dt-win11"); if(st.sbb){ B.classList.add("sb-bottom"); st.sbb = false; } var cq = $("dt-cq"); if(cq) cq.remove();
    try{ if(st.thObs) st.thObs.disconnect(); }catch(e){} thClear(); wallRevoke(); st.os = ""; st.wins = []; st.live = null; st.ph = []; st.shell = null;
  }
  function exit(){ keep(""); var c = $("x-deskon"); if(c){ c.checked = false; c.dispatchEvent(new Event("change")); } teardown(); }
  function onResize(){ st.wins.forEach(function(w){ clampWin(w); }); }
  function tickOld(){
    var n = new Date(), tm = n.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
    var bar = $("dt-bar"), tr = st.shell && st.shell.querySelectorAll(".tray");
    if(st.os === "mac" && bar){ var cl = bar.querySelector(".dtclk"); if(cl) cl.textContent = n.toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"}) + "  " + tm; }
    if(st.os === "chromeos"){ var t1 = st.shell.querySelector("#dt-shelf .tray"); if(t1) t1.innerHTML = '<span>' + sysHtml("wifi", "📶") + '</span><span>' + sysHtml("battery", "🔋") + '</span><span>' + esc(tm) + '</span>'; }
    if(st.os === "win11"){ var t2 = st.shell.querySelector("#dt-task .tray"); if(t2) t2.innerHTML = '<span>' + sysHtml("wifi", "📶") + ' ' + sysHtml("sound", "🔊") + '</span><span>' + esc(tm) + '<br>' + esc(n.toLocaleDateString()) + '</span>'; }
  }

  /* =============== native OS looks: icons, Launchpad, ChromeOS launcher, Windows Start =============== */
  function natId(){ var o = saved(); return "nat-" + (o === "chromeos" || o === "win11" ? o : "mac"); }
  function isNat(){ return thRaw().indexOf("nat-") === 0; }
  function sv(inner, vb, extra){ return '<svg viewBox="' + (vb || "0 0 24 24") + '" width="16" height="16" aria-hidden="true" ' + (extra || 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') + '>' + inner + '</svg>'; }
  var I = {
    apple: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>',
    wifi: sv('<path d="M2 9a15 15 0 0 1 20 0M5.5 12.8a10 10 0 0 1 13 0M9 16.5a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1.2" fill="currentColor"/>'),
    search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    bat: sv('<rect x="2" y="7" width="17" height="10" rx="2.5"/><rect x="4.5" y="9.5" width="9" height="5" rx="1" fill="currentColor" stroke="none"/><path d="M21.5 10.5v3"/>'),
    ctl: sv('<rect x="3" y="4.5" width="18" height="6.5" rx="3.2"/><circle cx="7" cy="7.75" r="1.6" fill="currentColor" stroke="none"/><rect x="3" y="13" width="18" height="6.5" rx="3.2"/><circle cx="17" cy="16.25" r="1.6" fill="currentColor" stroke="none"/>'),
    usr: sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.2c1.4-2.2 3.2-3.2 5.5-3.2s4.1 1 5.5 3.2"/>'),
    cc: sv('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
    vol: sv('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'),
    up: sv('<path d="M6 15l6-6 6 6"/>', "0 0 24 24", 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"'),
    chev: sv('<path d="M6 9l6 6 6-6"/>'),
    more: sv('<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="12" r="1" fill="currentColor" stroke="none"/>'),
    power: sv('<path d="M12 3v9M6.6 6.6a8 8 0 1 0 10.8 0"/>'),
    user: sv('<circle cx="12" cy="9" r="4" fill="currentColor" stroke="none"/><path d="M4.5 21c.6-4 3.7-6 7.5-6s6.9 2 7.5 6z" fill="currentColor" stroke="none"/>'),
    g: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-width="3.2" aria-hidden="true"><path d="M17.66 6.34A8 8 0 0 0 6.34 6.34" stroke="#ea4335"/><path d="M6.34 6.34A8 8 0 0 0 6.34 17.66" stroke="#fbbc05"/><path d="M6.34 17.66A8 8 0 0 0 17.66 17.66" stroke="#34a853"/><path d="M17.66 17.66A8 8 0 0 0 20 12H12.5" stroke="#4285f4"/></svg>',
    gem: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" fill="#8ab4f8"/></svg>',
    lens: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke-width="2.4" aria-hidden="true"><path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9" stroke="#ea4335"/><path d="M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9" stroke="#4285f4"/><path d="M20 15v2.5a2.5 2.5 0 0 1-2.5 2.5H15" stroke="#34a853"/><path d="M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" stroke="#fbbc05"/><circle cx="12" cy="12" r="2.6" fill="#f1f3f4" stroke="none"/></svg>',
    lpad: '<svg viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="lpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafafa"/><stop offset="1" stop-color="#cfd2da"/></linearGradient></defs><rect width="56" height="56" rx="13" fill="url(#lpg)"/>' + (function(){ var cols=["#ff5f57","#febc2e","#28c840","#4aa8ff","#bf5af2","#ff7ab6","#ff9f0a","#64d2ff","#8e8e93"], s=""; for(var r=0;r<3;r++) for(var c=0;c<3;c++) s += '<rect x="' + (10+c*13) + '" y="' + (10+r*13) + '" width="10" height="10" rx="2.6" fill="' + cols[r*3+c] + '"/>'; return s; })() + '</svg>',
    finder: '<svg viewBox="0 0 56 56" aria-hidden="true"><defs><linearGradient id="fdl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cc4ff"/><stop offset="1" stop-color="#1b7cf0"/></linearGradient></defs><rect width="56" height="56" rx="13" fill="url(#fdl)"/><path d="M28 0h15a13 13 0 0 1 13 13v30a13 13 0 0 1-13 13H20c4-8 8-18 8-28z" fill="#f4f8ff"/><path d="M28 6v22M18 17v6M38 17v6" stroke="#10325c" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M16 36c6 7 18 7 24 0" stroke="#10325c" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>',
    folder: '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M6 14a4 4 0 0 1 4-4h12l5 5h19a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#4aa3e8"/><path d="M6 20h44v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="#7cc4f7"/></svg>',
    trash: '<svg viewBox="0 0 56 56" aria-hidden="true"><path d="M14 14h28l-2.5 32a4 4 0 0 1-4 3.7H20.5a4 4 0 0 1-4-3.7z" fill="rgba(255,255,255,.55)" stroke="rgba(255,255,255,.8)" stroke-width="1.4"/><ellipse cx="28" cy="14" rx="14" ry="3.6" fill="rgba(255,255,255,.7)"/><path d="M22 20v22M28 20v22M34 20v22" stroke="rgba(120,125,140,.55)" stroke-width="1.6"/></svg>'
  };
  function natBar(){
    return '<button class="mb apl" type="button">' + sysHtml("apple", I.apple) + '</button><button class="mb dtapp" type="button">Finder</button>' +
      '<button class="mb" data-m="file" type="button">File</button><button class="mb" data-m="edit" type="button">Edit</button><button class="mb" data-m="view" type="button">View</button><button class="mb" data-m="go" type="button">Go</button><button class="mb" data-m="win" type="button">Window</button><button class="mb" data-m="help" type="button">Help</button>' +
      '<span class="dtsp"></span><span class="dtst">' + sysHtml("battery", I.bat) + '</span><span class="dtst">' + sysHtml("wifi", I.wifi) + '</span><span class="dtst">' + I.search + '</span><span class="dtst">' + I.usr + '</span><span class="dtst" data-cc="1" title="Control Center">' + I.ctl + '</span><span class="dtst dtclk"></span>';
  }
  function natBarExtra(bar){
    function m(k, f){ var b = bar.querySelector("[data-m=" + k + "]"); if(b) b.onclick = function(e){ pop(e.currentTarget, f()); }; }
    m("edit", function(){ return [["Customize desktop…", function(){ openCustomize(); }]]; });
    m("view", function(){ return [["Show Launchpad", function(){ lpOpen(); }], ["Change wallpaper…", function(){ openCustomize("wall"); }]]; });
    m("go", function(){ var it = []; tabs().forEach(function(t){ it.push([(t.icon ? t.icon + "  " : "") + t.label, function(){ launch(t.ch); }]); }); return it.length ? it : [["Nothing here", function(){}]]; });
    m("help", function(){ return [["About this desktop", function(){ alert("Desktop mode (macOS look).\nEvery tab can be opened in its own window."); }], ["Exit desktop mode", exit]]; });
  }
  function natTick(){
    var n = new Date(), tm = n.toLocaleTimeString([], {hour:"numeric", minute:"2-digit"});
    if(st.os === "mac"){ var bar = $("dt-bar"), cl = bar && bar.querySelector(".dtclk"); if(cl) cl.textContent = n.toLocaleDateString([], {weekday:"short"}) + " " + n.toLocaleDateString([], {month:"short", day:"numeric"}) + "  " + tm; }
    if(st.os === "chromeos"){ var t1 = st.shell.querySelector("#dt-shelf .tray"); if(t1) t1.innerHTML = '<span class="cr-pill">' + esc(n.toLocaleDateString([], {month:"short", day:"numeric"})) + '</span><span class="cr-pill">' + sysHtml("wifi", I.wifi) + sysHtml("battery", I.bat) + '<span>' + esc(tm) + '</span></span>'; }
    if(st.os === "win11"){ var t2 = st.shell.querySelector("#dt-task .tray"); if(t2) t2.innerHTML = '<span class="wt-ic">' + I.up + sysHtml("wifi", I.wifi) + sysHtml("sound", I.vol) + sysHtml("battery", I.bat) + '</span><span class="wt-ck"><span>' + esc(tm) + '<br>' + esc(n.toLocaleDateString()) + '</span></span>'; }
  }
  function tick(){ tickOld(); if(isNat()) natTick(); }

  /* dock extras (macOS) and the search button (Windows) */
  function dockExtras(h){
    h.querySelectorAll(".dt-fx,.dt-dsep").forEach(function(x){ x.remove(); });
    var nat = isNat();
    var lp = el("button", "dt-fx dt-lp", I.lpad); lp.type = "button"; lp.title = "Launchpad"; lp.onclick = function(){ lpOpen(); };
    h.insertBefore(lp, h.firstChild);
    if(!nat) return;
    var f = el("button", "dt-fx dt-fnd", I.finder); f.type = "button"; f.title = "Finder";
    f.onclick = function(){ closePops(); lpClose(); var a = activeWin(); if(a) focus(a); else { var t = tabs()[0]; if(t) launch(t.ch); } };
    h.insertBefore(f, h.firstChild);
    h.appendChild(el("span", "dt-dsep"));
    var fo = el("button", "dt-fx", I.folder); fo.type = "button"; fo.title = "Downloads"; h.appendChild(fo);
    var tr = el("button", "dt-fx", I.trash); tr.type = "button"; tr.title = "Trash"; h.appendChild(tr);
  }
  function winExtras(h){
    h.querySelectorAll(".wsb").forEach(function(x){ x.remove(); });
    if(!isNat()) return;
    var s = h.querySelector(".start"); if(!s) return;
    var b = el("button", "wsb", I.search.replace('width="16" height="16"', 'width="18" height="18"')); b.type = "button"; b.title = "Search";
    b.onclick = function(){ togglePanel(); }; s.after(b);
  }

  /* ---- Launchpad ---- */
  function lpDims(){ var w = st.shell.clientWidth, h = st.shell.clientHeight; return {cols: w < 520 ? 3 : w < 760 ? 4 : w < 1000 ? 6 : 8, rows: Math.max(2, Math.min(5, Math.floor((h - 300) / 118)))}; }
  function lpClose(){ var L = $("dt-lpad"); if(!L || !L.classList.contains("show")) return; L.classList.remove("show"); L.innerHTML = ""; }
  function lpPage(d){ var L = $("dt-lpad"); if(!L || !st.lp || st.lp.q) return; st.lp.page += d; lpRender(); }
  function lpRender(){
    var L = $("dt-lpad"); if(!L || !st.lp) return;
    var g = L.querySelector(".lp-grid"), dots = L.querySelector(".lp-dots"), q = st.lp.q, d = lpDims();
    var all = allApps().filter(function(t){ return !q || t.label.toLowerCase().indexOf(q) > -1; });
    var per = q ? 9999 : d.cols * d.rows, pages = Math.max(1, Math.ceil(all.length / per));
    st.lp.page = Math.max(0, Math.min(pages - 1, st.lp.page));
    g.style.setProperty("--lc", d.cols); g.innerHTML = ""; dots.innerHTML = "";
    if(!all.length){ g.appendChild(el("div", "lp-none", "No results")); g.style.display = "block"; g.style.textAlign = "center"; } else { g.style.display = ""; g.style.textAlign = ""; }
    all.slice(st.lp.page * per, st.lp.page * per + per).forEach(function(t){
      var b = el("button", "lp-ap"); b.type = "button"; b.dataset.ch = t.ch; b.innerHTML = '<span class="ai">' + iconHtml(t) + '</span><span class="lb">' + esc(t.label) + '</span>';
      b.onclick = function(e){ lpClose(); closePops(); if(t.sc) launchSc(t.sc.id, e.shiftKey); else launch(t.ch, e.shiftKey); };
      b.oncontextmenu = function(e){ e.preventDefault(); e.stopPropagation(); ctx(e.clientX, e.clientY, appMenu(t), true); };
      g.appendChild(b);
    });
    if(pages > 1){ for(var i = 0; i < pages; i++){ (function(i){ var b = el("button"); b.type = "button"; b.title = "Page " + (i + 1); if(i === st.lp.page) b.className = "on"; b.onclick = function(){ st.lp.page = i; lpRender(); }; dots.appendChild(b); })(i); } }
  }
  function lpOpen(){
    var L = $("dt-lpad"); if(!L) return; closePops();
    if(L.classList.contains("show")){ lpClose(); return; }
    st.lp = {page:0, q:""};
    L.innerHTML = '<div class="lp-search">' + I.search + '<input type="text" placeholder="Search Applications" aria-label="Search applications" autocomplete="off" spellcheck="false"><span style="display:flex;opacity:.7">' + I.more + '</span></div><div class="lp-pages"><div class="lp-grid"></div></div><div class="lp-dots"></div>';
    L.classList.add("show");
    var inp = L.querySelector("input"); inp.oninput = function(){ st.lp.q = inp.value.trim().toLowerCase(); st.lp.page = 0; lpRender(); };
    L.onclick = function(e){ var c = e.target.classList; if(e.target === L || c.contains("lp-pages") || c.contains("lp-grid") || c.contains("lp-dots")) lpClose(); };
    var wt = 0; L.onwheel = function(e){ if(st.lp.q) return; var n = Date.now(); if(n - wt < 350) return; var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if(Math.abs(d) < 10) return; wt = n; lpPage(d > 0 ? 1 : -1); };
    lpRender(); setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 40);
  }
  D.addEventListener("keydown", function(e){
    var L = $("dt-lpad"); if(!L || !L.classList.contains("show")) return;
    if(e.key === "Escape") lpClose(); else if(e.key === "ArrowRight") lpPage(1); else if(e.key === "ArrowLeft") lpPage(-1);
  });

  /* ---- ChromeOS launcher + Windows 11 Start ---- */
  function natPanel(pn, os){
    var apps = allApps();
    function launchT(t, e){ closePops(); if(t.sc) launchSc(t.sc.id, e && e.shiftKey); else launch(t.ch, e && e.shiftKey); }
    function bind(b, t){ b.onclick = function(e){ launchT(t, e); }; b.oncontextmenu = function(e){ e.preventDefault(); e.stopPropagation(); ctx(e.clientX, e.clientY, appMenu(t), true); }; }
    function tile(t){ var b = el("button", "dtgi"); b.type = "button"; b.innerHTML = '<span class="ai">' + iconHtml(t) + '</span><span>' + esc(t.label) + '</span>'; bind(b, t); return b; }
    var btns = '<button type="button" class="nsc">＋ New shortcut</button><button type="button" class="cz">🎨 Customize</button><button type="button" class="pw">' + (os === "win11" ? I.power.replace('width="16" height="16"', 'width="15" height="15"') : '⏻') + ' Exit desktop mode</button>';
    var inp;
    if(os === "chromeos"){
      pn.className = "dt-glass cr";
      pn.innerHTML = '<div class="cr-search">' + I.g + '<input type="text" placeholder="Search your shortcuts, files, apps, and more…" aria-label="Search apps" autocomplete="off" spellcheck="false"><span class="cr-ic">' + I.lens + I.gem + '</span></div>' +
        '<div class="cr-cont"><button type="button" class="cr-tog"><span>Continue where you left off</span>' + I.chev + '</button></div><div class="cr-rec"></div><div class="grid cr-grid"></div><div class="foot"><span></span><span>' + btns + '</span></div>';
      inp = pn.querySelector("input");
      var rec = pn.querySelector(".cr-rec"), tog = pn.querySelector(".cr-tog");
      st.wins.forEach(function(w){ var c = el("button", "cr-chip"); c.type = "button"; c.textContent = w.label; c.onclick = function(){ closePops(); focus(w); }; rec.appendChild(c); });
      if(!st.wins.length) rec.appendChild(el("span", "", "Nothing open yet"));
      tog.onclick = function(){ tog.classList.toggle("open"); rec.classList.toggle("open"); };
      var g = pn.querySelector(".cr-grid");
      var fill = function(q){ g.innerHTML = ""; apps.filter(function(t){ return !q || t.label.toLowerCase().indexOf(q) > -1; }).forEach(function(t){ g.appendChild(tile(t)); }); };
      fill(""); inp.oninput = function(){ fill(inp.value.trim().toLowerCase()); };
    } else {
      pn.className = "dt-glass ws";
      pn.innerHTML = '<div class="ws-search">' + I.search + '<input type="text" placeholder="Type here to search" aria-label="Search apps" autocomplete="off" spellcheck="false"></div><div class="ws-main"></div>' +
        '<div class="foot ws-foot"><span class="ws-user">' + sysHtml("user", I.user) + '<span>' + esc((typeof usr !== "undefined" && usr) || "You") + '</span></span><span>' + btns + '</span></div>';
      inp = pn.querySelector("input");
      var mode = "pin", q = "", main = pn.querySelector(".ws-main");
      var row = function(t){ var b = el("button", "ws-row"); b.type = "button"; b.innerHTML = '<span class="ai">' + iconHtml(t) + '</span><span class="tx">' + esc(t.label) + '</span>'; bind(b, t); return b; };
      var head = function(title, label, fn){ var h = el("div", "ws-h", '<span>' + esc(title) + '</span>'); if(label){ var b = el("button", "", esc(label)); b.type = "button"; b.onclick = fn; h.appendChild(b); } return h; };
      var render = function(){
        main.innerHTML = "";
        if(q){
          main.appendChild(head("Best match"));
          var m = apps.filter(function(t){ return t.label.toLowerCase().indexOf(q) > -1; });
          if(!m.length) main.appendChild(el("div", "", "No results")); m.forEach(function(t){ main.appendChild(row(t)); });
        } else if(mode === "all"){
          main.appendChild(head("All apps", "‹ Back", function(){ mode = "pin"; render(); }));
          apps.slice().sort(function(a, b){ return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1; }).forEach(function(t){ main.appendChild(row(t)); });
        } else {
          main.appendChild(head("Pinned", "All apps ›", function(){ mode = "all"; render(); }));
          var gr = el("div", "ws-grid"); apps.slice(0, 18).forEach(function(t){ gr.appendChild(tile(t)); }); main.appendChild(gr);
          main.appendChild(head("Recommended", "More ›", function(){ mode = "all"; render(); }));
          var rc = el("div", "ws-rec"), used = {};
          var items = st.wins.map(function(w){ return {t:tabOf(w.ch) || {ch:w.ch, label:w.label, icon:w.icon, sc:w.sc}, sub:"Open now", w:w}; });
          items.forEach(function(i){ used[i.t.ch] = 1; });
          apps.slice(18).concat(apps.slice(0, 18)).forEach(function(t){ if(items.length < 6 && !used[t.ch]){ used[t.ch] = 1; items.push({t:t, sub:"Recently added"}); } });
          items.slice(0, 6).forEach(function(i){ var b = el("button", "ws-r"); b.type = "button"; b.innerHTML = '<span class="ai">' + iconHtml(i.t) + '</span><span class="tx"><b>' + esc(i.t.label) + '</b><small>' + i.sub + '</small></span>'; if(i.w) b.onclick = function(){ closePops(); focus(i.w); }; else bind(b, i.t); rc.appendChild(b); });
          main.appendChild(rc);
        }
      };
      render(); inp.oninput = function(){ q = inp.value.trim().toLowerCase(); render(); };
    }
    var pw = pn.querySelector(".pw"); if(pw) pw.onclick = exit;
    pn.querySelector(".nsc").onclick = function(){ closePops(); shortcutDialog(null); };
    pn.querySelector(".cz").onclick = function(){ closePops(); openCustomize(); };
    pn.classList.add("show"); setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 30);
  }


  /* =============== Control Center ===============
     macOS: the sliders icon in the menu bar. ChromeOS / Windows: click the tray (clock + status icons).
     Everything in it really does something: display brightness, a warm "Night Shift" tint, volume for the app's sounds
     and videos, mute, full screen, plus shortcuts to the launcher, wallpaper and exit. Settings are remembered. */
  var CCK = "pb_dt_cc", CC = {b:100, v:100, n:false, m:false};
  try{ var _c = JSON.parse(localStorage.getItem(CCK) || "{}"); if(_c.b >= 40 && _c.b <= 100) CC.b = +_c.b; if(_c.v >= 0 && _c.v <= 100) CC.v = +_c.v; CC.n = !!_c.n; CC.m = !!_c.m; }catch(e){}
  function ccSave(){ try{ localStorage.setItem(CCK, JSON.stringify(CC)); }catch(e){} }
  function ccDocs(){ var out = [D]; try{ Array.prototype.forEach.call(D.querySelectorAll("iframe"), function(f){ try{ if(f.contentDocument) out.push(f.contentDocument); }catch(e){} }); }catch(e){} return out; }
  function ccMedia(){
    ccDocs().forEach(function(d){ try{ Array.prototype.forEach.call(d.querySelectorAll("audio,video"), function(m){ m.volume = CC.v / 100; m.muted = CC.m || CC.v === 0; }); }catch(e){} });
  }
  function ccApply(){
    if(!st.shell) return;
    var f = CC.b < 100 ? "brightness(" + (CC.b / 100) + ")" : "";
    ["dt-wall", "dt-wins"].forEach(function(id){ var e = $(id); if(e) e.style.filter = f; });
    var nt = $("dt-night");
    if(!nt){ nt = el("div"); nt.id = "dt-night"; st.shell.appendChild(nt); }
    nt.classList.toggle("on", CC.n);
    ccMedia();
  }
  setInterval(function(){ if(st.shell && (CC.v < 100 || CC.m)) ccMedia(); }, 2500);   // sounds that start later pick the volume up too
  function ccUI(){
    var pn = $("dt-cc"), nm = st.os === "mac" ? "Launchpad" : st.os === "chromeos" ? "Launcher" : "Start";
    if(!pn){ pn = el("div", "dt-glass"); pn.id = "dt-cc"; st.shell.appendChild(pn); pn.addEventListener("mousedown", function(e){ e.stopPropagation(); }); }
    var wasOn = pn.classList.contains("show"); pn.className = "dt-glass " + (st.os === "mac" ? "cc-top" : "cc-bot") + (wasOn ? " show" : "");
    var online = navigator.onLine !== false;
    pn.innerHTML =
      '<div class="cc-tiles">' +
        '<div class="cc-t' + (online ? " on" : "") + '" data-k="net"><b>' + sysHtml("wifi", I.wifi) + '</b><span>Network<small>' + (online ? "Online" : "Offline") + '</small></span></div>' +
        '<button type="button" class="cc-t' + (CC.n ? " on" : "") + '" data-k="night"><b>🌙</b><span>Night Shift<small>' + (CC.n ? "On" : "Off") + '</small></span></button>' +
        '<button type="button" class="cc-t' + (CC.m ? " on" : "") + '" data-k="mute"><b>' + (CC.m ? "🔇" : "🔊") + '</b><span>Mute<small>' + (CC.m ? "On" : "Off") + '</small></span></button>' +
        '<button type="button" class="cc-t' + (D.fullscreenElement ? " on" : "") + '" data-k="full"><b>⛶</b><span>Full screen<small>' + (D.fullscreenElement ? "On" : "Off") + '</small></span></button>' +
      '</div>' +
      '<label class="cc-s"><span>Display</span><div><i>☀️</i><input type="range" min="40" max="100" value="' + CC.b + '" data-k="b" aria-label="Display brightness"></div></label>' +
      '<label class="cc-s"><span>Sound</span><div><i>🔈</i><input type="range" min="0" max="100" value="' + CC.v + '" data-k="v" aria-label="Volume"></div></label>' +
      '<div class="cc-b"><button type="button" data-k="lp">' + nm + '</button><button type="button" data-k="wall">Wallpaper…</button><button type="button" data-k="cz">Customize…</button><button type="button" data-k="exit">Exit desktop mode</button></div>';
    pn.querySelectorAll("input[type=range]").forEach(function(r){ r.oninput = function(){ CC[r.dataset.k] = +r.value; if(r.dataset.k === "v" && CC.v > 0) CC.m = false; ccSave(); ccApply(); }; r.onchange = function(){ if(r.dataset.k === "v") ccUI(); }; });
    pn.querySelectorAll("button[data-k]").forEach(function(b){
      b.onclick = function(){
        var k = b.dataset.k;
        if(k === "night"){ CC.n = !CC.n; ccSave(); ccApply(); ccUI(); }
        else if(k === "mute"){ CC.m = !CC.m; ccSave(); ccApply(); ccUI(); }
        else if(k === "full"){ try{ if(D.fullscreenElement) D.exitFullscreen(); else D.documentElement.requestFullscreen(); }catch(e){} setTimeout(ccUI, 250); }
        else if(k === "lp"){ closePops(); if(st.os === "mac") lpOpen(); else togglePanel(); }
        else if(k === "wall"){ closePops(); openCustomize("wall"); }
        else if(k === "cz"){ closePops(); openCustomize(); }
        else if(k === "exit"){ closePops(); exit(); }
      };
    });
  }
  function toggleCC(){
    if(!st.shell) return;
    var pn = $("dt-cc"), was = pn && pn.classList.contains("show");
    closePops(); if(was) return;
    ccUI(); pn = $("dt-cc"); pn.classList.add("show");
  }
  if(!$("dt-cc-css")){
    var ccs = D.createElement("style"); ccs.id = "dt-cc-css";
    ccs.textContent = "#dt-cc{position:absolute;z-index:99993;width:320px;max-width:calc(100% - 16px);box-sizing:border-box;padding:12px;border-radius:18px;display:none;flex-direction:column;gap:10px;box-shadow:0 12px 40px rgba(0,0,0,.4),0 0 0 1px rgba(255,255,255,.12);font-size:13px}" +
      "#dt-cc.show{display:flex}#dt-cc.cc-top{top:34px;right:8px}#dt-cc.cc-bot{bottom:calc(var(--dt-bot,48px) + 8px);right:8px}" +
      "#dt-cc .cc-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px}" +
      "#dt-cc .cc-t{display:flex;align-items:center;gap:10px;padding:10px;border:none;border-radius:14px;background:rgba(127,127,127,.18);color:inherit;text-align:left;cursor:default;font:inherit}" +
      "#dt-cc button.cc-t:hover{background:rgba(127,127,127,.3)}" +
      "#dt-cc .cc-t b{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:rgba(127,127,127,.3);font-size:15px;flex:0 0 auto}" +
      "#dt-cc .cc-t b svg{width:16px;height:16px}" +
      "#dt-cc .cc-t.on b{background:var(--dt-acc,#0a84ff);color:#fff}" +
      "#dt-cc .cc-t span{display:flex;flex-direction:column;font-weight:600;line-height:1.25;min-width:0}#dt-cc .cc-t small{font-weight:400;opacity:.7;font-size:11px}" +
      "#dt-cc .cc-s{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:14px;background:rgba(127,127,127,.18);font-weight:600}" +
      "#dt-cc .cc-s div{display:flex;align-items:center;gap:8px}#dt-cc .cc-s i{font-style:normal;width:18px;text-align:center}" +
      "#dt-cc .cc-s input{flex:1;min-width:0;accent-color:var(--dt-acc,#0a84ff)}" +
      "#dt-cc .cc-b{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
      "#dt-cc .cc-b button{padding:8px 10px;border:none;border-radius:10px;background:rgba(127,127,127,.18);color:inherit;font:inherit;font-size:12px;cursor:default}#dt-cc .cc-b button:hover{background:rgba(127,127,127,.3)}" +
      "#dt-cc .cc-b button[data-k=exit]{grid-column:1/-1;color:#ff453a}" +
      "#dt-night{position:absolute;inset:0;pointer-events:none;background:rgba(255,150,40,.22);mix-blend-mode:multiply;opacity:0;transition:opacity .3s;z-index:99990}#dt-night.on{opacity:1}" +
      "[data-cc]{cursor:pointer}";
    D.head.appendChild(ccs);
  }

  /* ---- shell chrome (dock / shelf / taskbar / menubar / launcher) ---- */
  function appBtn(t){
    var b = el("button", "dt-app"); b.type = "button"; b.dataset.ch = t.ch; b.title = t.label;
    b.innerHTML = '<span class="ai">' + iconHtml(t) + '</span><span class="run"></span>';
    b.onclick = function(e){ if(t.sc) launchSc(t.sc.id, e.shiftKey); else launch(t.ch, e.shiftKey); closePops(); lpClose(); };
    b.oncontextmenu = function(e){ e.preventDefault(); e.stopPropagation(); pop(b, appMenu(t), "up"); };
    return b;
  }
  function buildShell(){
    var os = st.os; st._nat = isNat();
    if(os === "mac"){
      var bar = $("dt-bar");
      bar.innerHTML = '<button class="mb apl" type="button" style="font-size:14px">' + sysHtml("apple", "💬") + '</button><button class="mb dtapp" type="button">Los Purebreds</button><button class="mb" data-m="file" type="button">File</button><button class="mb" data-m="win" type="button">Window</button><span class="dtsp"></span><span class="dtst">' + sysHtml("wifi", "📶") + '</span><span class="dtst">' + sysHtml("battery", "🔋") + '</span><span class="dtst" data-cc="1" title="Control Center">' + I.ctl + '</span><span class="dtst dtclk"></span>';
      if(isNat()){ bar.innerHTML = natBar(); natBarExtra(bar); }
      bar.addEventListener("click", function(e){ if(e.target.closest("[data-cc]")){ e.stopPropagation(); toggleCC(); } });
      bar.querySelector(".apl").onclick = function(e){ pop(e.currentTarget, [["Launchpad", function(){ lpOpen(); }], "-", ["About this desktop", function(){ alert("Los Purebreds desktop mode (macOS look).\nEvery tab can be opened in its own window."); }], ["Customize desktop…", function(){ openCustomize(); }], "-", ["Exit desktop mode", exit]]); };
      bar.querySelector(".dtapp").onclick = function(e){ pop(e.currentTarget, [["Customize desktop…", function(){ openCustomize(); }], "-", ["Exit desktop mode", exit]]); };
      bar.querySelector("[data-m=file]").onclick = function(e){ pop(e.currentTarget, [["New window", function(){ var c = st.live ? st.live.ch : "main"; var w = openWin(tabOf(c) || tabs()[0], {}); focus(w); }], ["New shortcut…", function(){ shortcutDialog(null); }], ["Close window", function(){ var a = activeWin(); if(a) closeWin(a); }]]); };
      bar.querySelector("[data-m=win]").onclick = function(e){
        var items = [["Minimize", function(){ var a = activeWin(); if(a) minWin(a); }], ["Zoom", function(){ var a = activeWin(); if(a) maxWin(a); }], "-", ["Tile left", function(){ var a = activeWin(); if(a) snapWin(a, "L"); }], ["Tile right", function(){ var a = activeWin(); if(a) snapWin(a, "R"); }]];
        if(st.wins.length) items.push("-");
        st.wins.forEach(function(w){ items.push([w.label + (w.min ? " (minimized)" : ""), function(){ focus(w); }]); });
        pop(e.currentTarget, items);
      };
    }
    if(os === "chromeos"){
      var sh = st.shell.querySelector("#dt-shelf");
      sh.querySelector(".lnch").onclick = function(){ togglePanel(); };
      sh.querySelector(".tray").onclick = function(e){ e.stopPropagation(); toggleCC(); };
    }
    if(os === "win11"){
      var tk = st.shell.querySelector("#dt-task");
      tk.querySelector(".start").onclick = function(){ togglePanel(); };
      tk.querySelector(".tray").onclick = function(e){ e.stopPropagation(); toggleCC(); };
    }
    applySys(); refreshDock(); tick(); ccApply();
  }
  function appsHost(){
    return st.os === "mac" ? $("dt-dock") : st.os === "chromeos" ? st.shell.querySelector("#dt-shelf .apps") : st.shell.querySelector("#dt-task .apps");
  }
  function refreshDock(){
    if(!st.shell) return;
    var h = appsHost(); if(!h) return;
    h.querySelectorAll(".dt-app").forEach(function(b){ b.remove(); });
    allApps().forEach(function(t){
      var open = st.wins.filter(function(w){ return w.ch === t.ch; });
      if(!isPinned(t) && !open.length) return;          // unpinned and not running: not on the dock
      var b = appBtn(t);
      if(open.length) b.classList.add("on");
      if(open.some(function(w){ return w === activeWin(); })) b.classList.add("dtact");
      h.appendChild(b);
    });
    /* windows whose tab isn't in the bar (e.g. a direct message) still get an icon */
    var add = el("button", "dt-app dt-add"); add.type = "button"; add.title = "Add a website shortcut";
    add.innerHTML = '<span class="ai">' + (st.ic["sys:add"] ? rawIcon(st.ic["sys:add"]) : "+") + '</span>';
    add.oncontextmenu = function(e){ e.preventDefault(); e.stopPropagation(); pop(add, [["Change icon…", function(){ iconEditor("sys:add", SYS.add[0], "+", null); }], ["Customize desktop…", function(){ openCustomize(); }]], "up"); }; add.onclick = function(){ closePops(); shortcutDialog(null); }; h.appendChild(add);
    st.wins.forEach(function(w){ if(!w.sc && !tabOf(w.ch)){ var b = appBtn({ch:w.ch, icon:w.icon, label:w.label}); b.classList.add("on"); h.appendChild(b); } });
    if(st.os === "mac") dockExtras(h); if(st.os === "win11") winExtras(h);
  }
  function closePops(keep){ var cc = $("dt-cc"); if(cc && !keep) cc.classList.remove("show"); var p = $("dt-pop"); if(p) p.classList.remove("show"); var pn = $("dt-panel"); if(pn && !keep) pn.classList.remove("show"); if(st.shell) st.shell.querySelectorAll("#dt-bar .mb.open").forEach(function(b){ b.classList.remove("open"); }); }
  function pop(anchor, items, dir, keep){
    var p = $("dt-pop"), was = p.classList.contains("show") && p._a === anchor; closePops(keep); if(was) return;
    p.innerHTML = ""; p._a = anchor;
    items.forEach(function(it){
      if(it === "-"){ p.appendChild(el("hr")); return; }
      var b = el("button"); b.type = "button"; b.textContent = it[0]; b.onclick = function(){ closePops(); it[1](); }; p.appendChild(b);
    });
    var r = anchor.getBoundingClientRect(), sr = st.shell.getBoundingClientRect();
    p.classList.add("show"); anchor.classList.add("open");
    var pw = p.offsetWidth, ph = p.offsetHeight;
    var left = Math.max(6, Math.min(r.left - sr.left, sr.width - pw - 6));
    p.style.left = left + "px";
    if(dir === "up") { p.style.top = Math.max(6, r.top - sr.top - ph - 8) + "px"; } else p.style.top = Math.max(6, Math.min(r.bottom - sr.top + 2, sr.height - ph - 6)) + "px";
  }
  function togglePanel(){
    var pn = $("dt-panel"), was = pn.classList.contains("show"); closePops(); if(was) return;
    var os = st.os; pn.className = "dt-glass";
    if(isNat() && (os === "chromeos" || os === "win11")){ natPanel(pn, os); return; }
    pn.innerHTML = '<input type="search" placeholder="' + (os === "win11" ? "Type here to search" : "Search your tabs") + '" aria-label="Search tabs"><div class="grid"></div>' +
      '<div class="foot"><span>' + (os === "win11" ? sysHtml("user", "👤") + ' ' + esc((typeof usr !== "undefined" && usr) || "You") : '') + '</span><span><button type="button" class="nsc">＋ New shortcut</button><button type="button" class="cz">🎨 Customize</button>' + (os === "win11" ? '<button type="button" class="pw">⏻ Exit desktop mode</button>' : '') + '</span></div>';
    var g = pn.querySelector(".grid"), inp = pn.querySelector("input");
    function fill(q){
      g.innerHTML = "";
      allApps().filter(function(t){ return !q || t.label.toLowerCase().indexOf(q) > -1; }).forEach(function(t){
        var b = el("button", "dtgi"); b.type = "button"; b.innerHTML = '<span class="ai">' + iconHtml(t) + '</span><span>' + esc(t.label) + '</span>';
        b.onclick = function(e){ closePops(); if(t.sc) launchSc(t.sc.id, e.shiftKey); else launch(t.ch, e.shiftKey); };
        b.oncontextmenu = function(e){ e.preventDefault(); e.stopPropagation(); ctx(e.clientX, e.clientY, appMenu(t), true); }; g.appendChild(b);
      });
    }
    fill(""); inp.oninput = function(){ fill(inp.value.trim().toLowerCase()); };
    var pw = pn.querySelector(".pw"); if(pw) pw.onclick = exit;
    pn.querySelector(".nsc").onclick = function(){ closePops(); shortcutDialog(null); };
    pn.querySelector(".cz").onclick = function(){ closePops(); openCustomize(); };
    pn.classList.add("show"); setTimeout(function(){ try{ inp.focus(); }catch(e){} }, 30);
  }

  /* ---- windows ---- */
  function activeWin(){ var top = null; st.wins.forEach(function(w){ if(!w.min && (!top || +w.el.style.zIndex > +top.el.style.zIndex)) top = w; }); return top; }
  function launch(ch, forceNew){
    var t = tabOf(ch) || {ch:ch, label:ch, icon:null}, ex = st.wins.filter(function(w){ return w.ch === ch; })[0];
    if(ex && !forceNew){ if(ex.min && st.live !== ex){ } focus(ex); return; }
    focus(openWin(t, {}));
  }
  function openWin(t, o){
    var w = {id:++st.uid, sc:t.sc || null, ch:t.ch, label:t.label, icon:t.icon, min:false, max:false, snap:"", prev:null, x:0, y:0, w:0, h:0};
    var e = el("div", "dt-win opening"); w.el = e;
    e.innerHTML = '<div class="dt-tb"><span class="dt-ico"></span><span class="dt-ttl"></span><div class="dt-ctl"><button type="button" data-act="close" title="Close"></button><button type="button" data-act="min" title="Minimize"></button><button type="button" data-act="max" title="Maximize"></button></div></div>' +
      '<div class="dt-body"><div class="dt-snap"><iframe sandbox="allow-same-origin" title=""></iframe><div class="dt-shield"></div></div></div>' +
      ["n","s","e","w","ne","nw","se","sw"].map(function(d){ return '<div class="dt-rz" data-d="' + d + '"></div>'; }).join("");
    w.body = e.querySelector(".dt-body"); w.frame = e.querySelector("iframe"); w.tb = e.querySelector(".dt-tb");
    if(w.sc) buildWeb(w);
    var a = area(), big = o && o.big;
    w.w = big ? Math.min(a.w - 60, 1000) : Math.min(a.w - 20, 440);
    w.h = big ? Math.min(a.h - 40, 700) : Math.min(a.h - 20, 560);
    var off = big ? 0 : (st.cascade++ % 8) * 30;
    w.x = big ? Math.round((a.w - w.w) / 2) : Math.max(0, Math.min(a.w - w.w, 70 + off + Math.round(Math.random() * 40)));
    w.y = (big ? Math.round((a.h - w.h) / 2) : Math.max(0, Math.min(a.h - w.h, 30 + off))) + a.top;
    place(w); setTitle(w);
    e.addEventListener("animationend", function(){ e.classList.remove("opening"); });
    e.addEventListener("mousedown", function(){ if(st.live !== w || activeWin() !== w) focus(w); }, true);
    var shd = e.querySelector(".dt-shield"); if(shd) shd.addEventListener("mousedown", function(ev){ ev.preventDefault(); focus(w); });
    e.querySelector(".dt-ctl").addEventListener("click", function(ev){
      var b = ev.target.closest("button"); if(!b) return; ev.stopPropagation();
      var act = b.dataset.act; if(act === "close") closeWin(w); else if(act === "min") minWin(w); else maxWin(w);
    });
    e.querySelector(".dt-ctl").addEventListener("mousedown", function(ev){ ev.stopPropagation(); });
    w.tb.addEventListener("dblclick", function(ev){ if(!ev.target.closest(".dt-ctl")) maxWin(w); });
    w.tb.addEventListener("pointerdown", function(ev){ if(ev.button || ev.target.closest(".dt-ctl")) return; startDrag(ev, w); });
    e.querySelectorAll(".dt-rz").forEach(function(r){ r.addEventListener("pointerdown", function(ev){ if(ev.button) return; startResize(ev, w, r.dataset.d); }); });
    $("dt-wins").appendChild(e);
    st.wins.push(w);
    if(small()) maxWin(w, true);
    return w;
  }
  function setTitle(w){
    w.el.querySelector(".dt-ttl").textContent = w.label;
    w.el.querySelector(".dt-ico").innerHTML = iconHtml({ch:w.ch, sc:w.sc, icon:w.icon, label:w.label});
    if(w.frame) w.frame.title = w.label;
  }
  function place(w){ var s = w.el.style; s.left = w.x + "px"; s.top = w.y + "px"; s.width = w.w + "px"; s.height = w.h + "px"; }
  function clampWin(w){
    if(!st.shell || w.max || w.snap) return; var a = area();
    w.w = Math.min(w.w, a.w); w.h = Math.min(w.h, a.h);
    w.x = Math.max(-w.w + 80, Math.min(w.x, a.w - 80)); w.y = Math.max(a.top, Math.min(w.y, a.top + a.h - 36)); place(w);
  }
  function focus(w){
    if(!w || !st.shell) return;
    if(w.min){ w.min = false; w.el.classList.remove("min"); }
    st.z++; w.el.style.zIndex = st.z;
    st.wins.forEach(function(x){ x.el.classList.toggle("dtact", x === w); });
    if(!w.sc) activate(w);
    refreshDock();
  }
  /* Multitasking: the first window uses the app that is on this page. Every other window loads its own running copy of
     the app in an iframe (same page, same sign-in), so all of them keep working at the same time. */
  function startInst(w){
    if(w.inst || w.sc) return;
    var c = w.ch === "dm" ? "main" : w.ch, f = w.frame;
    w.inst = true; w.el.classList.add("is-inst");
    f.onload = null; f.removeAttribute("sandbox"); f.removeAttribute("srcdoc");
    f.setAttribute("allow", "fullscreen; clipboard-write; autoplay; microphone; camera");
    f.src = location.href.split("#")[0] + "#dtch=" + encodeURIComponent(c);
  }
  function activate(w){
    if(w.inst || st.live === w) return;
    if(st.live){ startInst(w); return; }      // the page's own copy is already in another window
    var c = w.ch === "dm" ? "main" : w.ch;
    w.body.appendChild(st.liveHost); w.el.classList.add("is-live"); st.live = w;
    st.liveHost.classList.toggle("wide", st.liveHost.clientWidth >= 640);
    try{ if(typeof curCh !== "undefined" && curCh !== c) setChannel(c); }catch(e){}
    try{ var bx = $("box"); if(bx) bx.scrollTop = bx.scrollHeight; }catch(e){}
  }
  /* ---- website shortcuts ---- */
  function buildWeb(w){
    var u = w.sc.url;
    w.body.innerHTML = '<div class="dt-web"><div class="dt-wbar"><button type="button" data-w="rl" title="Reload">⟳</button><input type="text" readonly aria-label="Address"><button type="button" data-w="ext" title="Open in a new browser tab">↗</button></div>' +
      '<iframe referrerpolicy="no-referrer" allow="fullscreen; clipboard-write" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"></iframe>' +
      '<div class="dt-webnote">Blank? Some websites don\u2019t allow being shown inside another page. Use \u2197 to open it in a browser tab.</div></div>';
    w.frame = w.body.querySelector("iframe"); w.frame.src = u; w.body.querySelector("input").value = u;
    w.body.querySelector("[data-w=rl]").onclick = function(){ w.frame.src = u; };
    w.body.querySelector("[data-w=ext]").onclick = function(){ window.open(u, "_blank", "noopener"); };
  }
  function launchSc(id, forceNew){
    var sc = st.sc.filter(function(x){ return x.id === id; })[0]; if(!sc) return;
    /* shortcuts open in a new browser tab, not in a mini window */
    st.wins.filter(function(w){ return w.ch === "sc:" + id; }).forEach(closeWin);      // a window left over from before
    var u = String(sc.url || ""); if(!/^https?:\/\//i.test(u)) u = "https://" + u;
    try{ window.open(u, "_blank", "noopener"); }catch(e){}
  }
  function removeSc(id){
    st.sc = st.sc.filter(function(x){ return x.id !== id; }); scSave();
    st.wins.filter(function(w){ return w.ch === "sc:" + id; }).forEach(closeWin);
    refreshDock();
  }
  function shortcutDialog(sc){
    var old = $("dt-dlg"); if(old) old.remove();
    var d = el("div"); d.id = "dt-dlg"; var pending = sc ? (sc.icon || "") : "";
    d.innerHTML = '<div class="box"><h4>' + (sc ? "Edit shortcut" : "New website shortcut") + '</h4>' +
      '<label>Name</label><input type="text" id="dts-n" maxlength="30" placeholder="My site" autocomplete="off">' +
      '<label>Website address</label><input type="text" id="dts-u" placeholder="https://example.com" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<label>Icon</label><div class="ir"><span class="pv" id="dts-pv"></span><input type="text" id="dts-i" placeholder="Emoji, or an image link" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
      '<div class="ir"><button type="button" id="dts-up">⬆ Upload an image</button><button type="button" id="dts-clr">Use the site\u2019s icon</button><input type="file" id="dts-f" accept="image/*" style="display:none"></div>' +
      '<small>Leave the icon empty to use the website\u2019s own icon. Shortcuts are saved on this device.</small><div class="err" id="dts-e"></div>' +
      '<div class="btns">' + (sc ? '<button type="button" class="del" id="dts-d">Remove</button>' : '') + '<button type="button" id="dts-c">Cancel</button><button type="button" class="pri" id="dts-s">Save</button></div></div>';
    st.shell.appendChild(d);
    var g = function(i){ return $(i); }, nm = g("dts-n"), ur = g("dts-u"), ic = g("dts-i"), pv = g("dts-pv"), er = g("dts-e");
    nm.value = sc ? sc.name : ""; ur.value = sc ? sc.url : "";
    ic.value = sc && !/^data:/.test(pending) ? pending : "";
    function prev(){
      var v = ic.value.trim() || pending, tmp = {name:nm.value || "?", url:ur.value.trim().indexOf("http") === 0 ? ur.value.trim() : "https://" + (ur.value.trim() || "x.invalid"), icon:v};
      pv.innerHTML = v || ur.value.trim() ? scIcon(tmp) : "🌐";
    }
    ic.oninput = function(){ pending = ""; prev(); }; nm.oninput = ur.oninput = prev; prev();
    g("dts-up").onclick = function(){ g("dts-f").click(); };
    g("dts-clr").onclick = function(){ pending = ""; ic.value = ""; prev(); };
    g("dts-f").onchange = function(){
      var f = this.files && this.files[0]; this.value = ""; if(!f) return;
      var fr = new FileReader();
      fr.onload = function(){
        var im = new Image();
        im.onload = function(){
          try{
            var c = D.createElement("canvas"), n = 96; c.width = c.height = n; var x = c.getContext("2d"), r = Math.min(im.width, im.height);
            x.drawImage(im, (im.width - r) / 2, (im.height - r) / 2, r, r, 0, 0, n, n);
            pending = c.toDataURL("image/png"); ic.value = ""; prev(); er.textContent = "";
          }catch(e){ er.textContent = "Couldn\u2019t read that image."; }
        };
        im.onerror = function(){ er.textContent = "That isn\u2019t an image I can read."; };
        im.src = fr.result;
      };
      fr.readAsDataURL(f);
    };
    function close(){ d.remove(); }
    g("dts-c").onclick = close; d.addEventListener("mousedown", function(e){ if(e.target === d) close(); });
    if(g("dts-d")) g("dts-d").onclick = function(){ close(); removeSc(sc.id); };
    g("dts-s").onclick = function(){
      var u = ur.value.trim(); if(!u){ er.textContent = "Enter the website address."; return; }
      if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
      var url; try{ url = new URL(u); }catch(e){ er.textContent = "That address doesn\u2019t look right."; return; }
      if(url.protocol !== "http:" && url.protocol !== "https:"){ er.textContent = "Only http and https websites can be added."; return; }
      var icon = ic.value.trim() || pending;
      var rec = {id:sc ? sc.id : "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:(nm.value.trim() || url.hostname.replace(/^www\./, "")).slice(0, 30), url:url.href, icon:icon};
      if(sc){ st.sc = st.sc.map(function(x){ return x.id === sc.id ? rec : x; }); } else st.sc.push(rec);
      scSave(); close();
      st.wins.forEach(function(w){ if(w.sc && w.sc.id === rec.id){ w.sc = rec; w.label = rec.name; setTitle(w); if(w.frame && w.frame.src !== rec.url) buildWeb(w); } });
      refreshDock(); if(!sc) launchSc(rec.id);
    };
    setTimeout(function(){ try{ (sc ? nm : ur).focus(); }catch(e){} }, 30);
  }
  /* clicking inside a website window puts focus in its frame, so bring that window to the front */
  window.addEventListener("blur", function(){
    setTimeout(function(){
      if(!st.os) return; var a = D.activeElement; if(!a || a.tagName !== "IFRAME") return;
      var w = st.wins.filter(function(x){ return x.el.contains(a); })[0]; if(w && activeWin() !== w) focus(w);
    }, 0);
  });
  function closeWin(w){
    var wasLive = st.live === w;
    if(wasLive){ st.park.appendChild(st.liveHost); st.live = null; }
    if(w.inst){ try{ w.frame.src = "about:blank"; }catch(e){} }      // closes that copy's connection
    w.el.remove(); st.wins = st.wins.filter(function(x){ return x !== w; });
    var nx = activeWin(); if(nx) focus(nx);
    refreshDock();
  }
  function minWin(w){
    w.min = true; w.el.classList.add("min");
    var nx = activeWin(); if(nx) focus(nx);
    refreshDock();
  }
  function maxWin(w, quiet){
    if(w.max){ w.max = false; w.el.classList.remove("max"); }
    else { clearSnap(w); w.max = true; w.el.classList.add("max"); }
    if(!quiet) setTimeout(function(){ if(st.live === w) st.liveHost.classList.toggle("wide", st.liveHost.clientWidth >= 640); }, 30);
  }
  function clearSnap(w){ w.snap = ""; w.el.classList.remove("snapL", "snapR"); }
  function snapWin(w, side){
    if(w.max){ w.max = false; w.el.classList.remove("max"); }
    clearSnap(w); w.snap = side; w.el.classList.add("snap" + side); focus(w);
  }
  function unSnap(w, px, py){
    var pw = w.el.offsetWidth, rel = pw ? (px - w.el.getBoundingClientRect().left) / pw : .5, a = area();
    w.max = false; w.el.classList.remove("max"); clearSnap(w);
    w.w = Math.min(w.prevW || 440, a.w); w.h = Math.min(w.prevH || 520, a.h);
    w.x = Math.round(px - w.w * rel); w.y = Math.max(a.top, py - 18); place(w);
  }
  function startDrag(ev, w){
    focus(w);
    var sx = ev.clientX, sy = ev.clientY, moved = false, a = area(), sr = st.shell.getBoundingClientRect();
    if(!(w.max || w.snap)){ w.prevW = w.w; w.prevH = w.h; }
    var ghost = $("dt-ghost"), edge = "";
    function mv(e){
      if(!moved && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) < 4) return;
      if(!moved){ moved = true; B.classList.add("dt-drag"); if(w.max || w.snap){ unSnap(w, e.clientX - sr.left, e.clientY - sr.top); sx = e.clientX; sy = e.clientY; w.ox = w.x; w.oy = w.y; } else { w.ox = w.x; w.oy = w.y; } }
      w.x = w.ox + (e.clientX - sx); w.y = w.oy + (e.clientY - sy);
      w.y = Math.max(a.top, Math.min(w.y, a.top + a.h - 36)); w.x = Math.max(-w.w + 80, Math.min(w.x, a.w - 80)); place(w);
      var px = e.clientX - sr.left, py = e.clientY - sr.top;
      edge = py <= a.top + 4 ? "max" : px <= 4 ? "L" : px >= a.w - 5 ? "R" : "";
      if(edge){ ghost.style.display = "block"; ghost.style.top = a.top + "px"; ghost.style.height = a.h + "px"; ghost.style.left = edge === "R" ? a.w / 2 + "px" : "0"; ghost.style.width = (edge === "max" ? a.w : a.w / 2) + "px"; } else ghost.style.display = "none";
    }
    function up(){
      D.removeEventListener("pointermove", mv); D.removeEventListener("pointerup", up); D.removeEventListener("pointercancel", up);
      B.classList.remove("dt-drag"); ghost.style.display = "none";
      if(moved){ if(edge === "max") maxWin(w); else if(edge) snapWin(w, edge); else clampWin(w); }
    }
    D.addEventListener("pointermove", mv); D.addEventListener("pointerup", up); D.addEventListener("pointercancel", up);
  }
  function startResize(ev, w, dir){
    ev.preventDefault(); focus(w);
    var sx = ev.clientX, sy = ev.clientY, o = {x:w.x, y:w.y, w:w.w, h:w.h}, a = area(), MINW = 300, MINH = 220;
    B.classList.add("dt-drag");
    function mv(e){
      var dx = e.clientX - sx, dy = e.clientY - sy, x = o.x, y = o.y, ww = o.w, hh = o.h;
      if(dir.indexOf("e") > -1) ww = Math.max(MINW, o.w + dx);
      if(dir.indexOf("s") > -1) hh = Math.max(MINH, o.h + dy);
      if(dir.indexOf("w") > -1){ ww = Math.max(MINW, o.w - dx); x = o.x + (o.w - ww); }
      if(dir.indexOf("n") > -1){ hh = Math.max(MINH, o.h - dy); y = o.y + (o.h - hh); if(y < a.top){ hh -= a.top - y; y = a.top; } }
      w.x = x; w.y = y; w.w = ww; w.h = hh; place(w);
    }
    function up(){ D.removeEventListener("pointermove", mv); D.removeEventListener("pointerup", up); D.removeEventListener("pointercancel", up); B.classList.remove("dt-drag"); if(st.live === w) st.liveHost.classList.toggle("wide", st.liveHost.clientWidth >= 640); }
    D.addEventListener("pointermove", mv); D.addEventListener("pointerup", up); D.addEventListener("pointercancel", up);
  }

  /* keep the window title in step when you switch tabs inside the live window */
  if(typeof setChannel === "function"){
    var _sc = setChannel;
    setChannel = function(c){
      var r = _sc.apply(this, arguments);
      try{
        if(st.os && st.live){
          var w = st.live, t = tabOf(c); w.ch = c;
          if(t){ w.label = t.label; w.icon = t.icon; }
          else if(c === "dm"){ w.label = (typeof dmNm !== "undefined" && dmNm) || "Messages"; w.icon = "💬"; }
          setTitle(w); refreshDock();
        }
      }catch(e){}
      return r;
    };
  }
  if(EMB){
    var want = "main", tries = 0, held = 0;
    try{ want = decodeURIComponent((/dtch=([^&]*)/.exec(location.hash) || [])[1] || "main"); }catch(e){}
    var hs = D.createElement("style"); hs.textContent = "#px-host{display:none !important}"; D.head.appendChild(hs);
    var iv = setInterval(function(){
      if(++tries > 200){ clearInterval(iv); return; }
      try{
        if(typeof setChannel === "function" && typeof curCh !== "undefined" && $("chtabs")){
          if(curCh !== want){ held = 0; setChannel(want); } else if(++held >= 8) clearInterval(iv);
        }
      }catch(e){}
    }, 300);
  }
  window.__dtExit = exit;
  var start = saved();
  if(start) setTimeout(function(){ try{ apply(start); }catch(e){ console.error(e); } }, 0);
})();

;
/* ===== 58-offpop-js.js ===== */
(function(){
  var pop=document.createElement("div"); pop.id="offpop"; pop.setAttribute("role","alertdialog"); pop.setAttribute("aria-modal","true");
  pop.innerHTML='<div class="op-card"><div class="op-ic">📡</div><h2 class="op-t">You went offline</h2><p class="op-m">Rejoin when you\u2019re back.</p><button type="button">OK</button></div>';
  document.body.appendChild(pop);
  var t=pop.querySelector(".op-t"), m=pop.querySelector(".op-m"), ic=pop.querySelector(".op-ic"), btn=pop.querySelector("button"), tm=0;
  function hide(){ clearTimeout(tm); pop.classList.remove("on","back"); }
  btn.onclick=hide;
  pop.addEventListener("click",function(e){ if(e.target===pop) hide(); });
  window.addEventListener("offline",function(){
    var g=document.getElementById("gate"); if(!g||!(g.style.display==="none"||g.classList.contains("leaving"))||window.__offline) return;   // only when you were actually in the chat
    clearTimeout(tm); pop.classList.remove("back"); ic.textContent="📡"; t.textContent="You went offline"; m.textContent="Rejoin when you\u2019re back."; btn.textContent="OK";
    pop.classList.add("on");
  },true);                                                   // capture: runs before the app resets its state
  window.addEventListener("online",function(){
    if(!pop.classList.contains("on")) return;
    pop.classList.add("back"); ic.textContent="✅"; t.textContent="You\u2019re back online"; m.textContent="Rejoining the chat\u2026"; btn.textContent="OK";
    tm=setTimeout(hide,2200);
  });
})();

;
/* ===== 59-hmore-js.js ===== */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var hdr = $("hdr"); if(!hdr || $("hmore-btn")) return;
  var btn = document.createElement("button"); btn.type = "button"; btn.id = "hmore-btn"; btn.title = "More";
  btn.setAttribute("aria-haspopup", "menu"); btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = 'More <span class="car">\u25BE</span><span class="dot"></span>';
  hdr.appendChild(btn);
  var menu = document.createElement("div"); menu.id = "hmore-menu"; menu.setAttribute("role", "menu");
  document.body.appendChild(menu);

  /* move the real buttons into the menu (their click handlers stay attached): owner/mod panel, mute all, changelog, edit history, settings */
  var IDS = ["hdr-staff", "hmute", "hdr-log", "hdr-eh", "hdr-set"];
  function adopt(){ IDS.forEach(function(id){ var el = $(id); if(el && el.parentNode !== menu) menu.appendChild(el); }); }
  adopt(); setInterval(adopt, 1000);

  /* red dot on More when there is a new changelog entry */
  var log = $("hdr-log");
  function dot(){ var l = $("hdr-log"); btn.classList.toggle("new", !!(l && l.classList.contains("new"))); }
  if(log){ try{ new MutationObserver(dot).observe(log, {attributes: true, attributeFilter: ["class"]}); }catch(e){} } dot();

  function place(){
    var r = btn.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, hp = document.body.getAttribute("data-hp");
    var left, top;
    if(hp === "left"){ left = r.right + 6; top = r.top; }
    else if(hp === "right"){ left = r.left - w - 6; top = r.top; }
    else { left = r.right - w; top = (r.bottom + 6 + h > vh - 8) ? r.top - h - 6 : r.bottom + 6; }
    left = Math.max(8, Math.min(left, vw - w - 8)); top = Math.max(8, Math.min(top, vh - h - 8));
    menu.style.left = left + "px"; menu.style.top = top + "px";
  }
  function open(){ adopt(); menu.classList.add("on"); btn.setAttribute("aria-expanded", "true"); place(); }
  function close(){ menu.classList.remove("on"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function(e){ e.stopPropagation(); menu.classList.contains("on") ? close() : open(); });
  menu.addEventListener("click", function(e){ if(e.target.closest("button")) setTimeout(close, 0); });   /* run the button's own action first, then close */
  document.addEventListener("click", function(e){ if(menu.classList.contains("on") && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
  window.addEventListener("resize", function(){ if(menu.classList.contains("on")) place(); });
})();
