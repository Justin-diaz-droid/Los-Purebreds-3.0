/* ===== 54-oneui-dock-js.js ===== */
/* One UI 9 spring press + macOS Dock magnification.
   One small spring engine animates the `scale` property of whatever the pointer is near or pressing. */
(function(){
  "use strict";
  var root = document.documentElement;
  var mqReduce = window.matchMedia ? matchMedia("(prefers-reduced-motion:reduce)") : {matches:false};
  var mqHover  = window.matchMedia ? matchMedia("(hover:hover) and (pointer:fine)") : {matches:true};

  /* ---- where the dock effect happens: the box, the items inside it, which way it fans out, how big the peak gets ---- */
  var GROUPS = [
    {box:"#online",                       item:".oav",                                    axis:"x",  max:1.8 },
    {box:"#emo-grid",                     item:"span",                                    axis:"xy", max:1.85},
    {box:"#emo-tabs",                     item:"span",                                    axis:"x",  max:1.5 },
    {box:"#chtabs",                       item:"button",                                  axis:"x",  max:1.22},
    {box:"#tray",                         item:".plus,#emo-btn,#sp-btn,#gif-btn,#sendbtn", axis:"x", max:1.42},
    {box:".act",                          item:"button",                                  axis:"x",  max:1.5 },
    {box:"#replybar,#dmbar",              item:"button",                                  axis:"x",  max:1.25},
    {box:".al-chips",                     item:".al-chip",                                axis:"x",  max:1.6 },
    {box:"#sbroster,#sbdm,#onpop,#sb",    item:".row-ch,.prow",                           axis:"y",  max:1.07}
  ];
  /* things that squish when pressed and grow a little on hover when they are not part of a dock */
  var GEN = "button:not([disabled]),.btn,[role=button],label.plus,.plus,#emo-btn,#sp-btn,#gif-btn,.row-ch,.prow,.chip,.al-chip,.stg-btn,#hdr-set,.goback,.xbtn,.oav,#emo-grid span,#emo-tabs span";
  var SKIP = ".arrow,#hdr-arrow,#sb-arrow";

  /* ---- live settings (the Animation Lab sets these custom properties on <html>) ---- */
  var P = {zoom:1, press:1, speed:1, bounce:1}, pDirty = true;
  /* per animation style: mag = Dock fisheye, gen = grow on hover, sq = how much a press squishes, z = spring damping (null = follow Bounciness) */
  var STYLES = {mixed:{mag:1, gen:1, sq:.1, z:null}, oneui:{mag:0, gen:1, sq:.1, z:null}, macos:{mag:1, gen:0, sq:.04, z:.85}, pixel:{mag:0, gen:0, sq:.05, z:.95}}, STY = STYLES.mixed;
  function num(n, d){ var v = parseFloat(root.style.getPropertyValue(n)); return isFinite(v) ? v : d; }
  function params(){
    if(!pDirty) return; pDirty = false;
    STY = STYLES[root.getAttribute("data-anim")] || STYLES.mixed;
    P.zoom = num("--a-zoom", 1); P.press = num("--a-press", 1);
    P.speed = 1 / Math.max(.2, num("--a-dur", 1)); P.bounce = num("--a-bounce", 1);
  }
  new MutationObserver(function(){ pDirty = true; if(noAnim()) releaseAll(); })
    .observe(root, {attributes:true, attributeFilter:["style","class","data-anim"]});
  function noAnim(){ return root.classList.contains("anim-off") || mqReduce.matches || (document.body && document.body.getAttribute("data-theme") === "gdocs"); }

  /* ---- spring engine ---- */
  var live = new Set(), raf = 0, last = 0;
  function st(el){ return el.__dk || (el.__dk = {s:1, v:0, t:1, hov:1, pr:0}); }
  function retarget(el){
    var s = st(el);
    s.t = s.hov * (s.pr ? 1 - STY.sq * P.press : 1);
    live.add(el); if(!raf){ last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function paint(el, s){
    if(Math.abs(s.s - 1) < .0015 && s.t === 1){ el.style.removeProperty("scale"); el.classList.remove("dk-up", "dk-live"); return; }
    el.style.scale = s.s.toFixed(4);
    if(!el.classList.contains("dk-live")) el.classList.add("dk-live");
    var up = s.s > 1.08; if(up !== el.classList.contains("dk-up")) el.classList.toggle("dk-up", up);
  }
  function tick(now){
    raf = 0; params();
    var dt = Math.min(.034, Math.max(.001, (now - last) / 1000)); last = now;
    var zeta = STY.z != null ? Math.max(.12, Math.min(1, STY.z - (P.bounce - 1) * .3)) : Math.max(.12, Math.min(1, 1 - .5 * P.bounce));
    live.forEach(function(el){
      var s = st(el);
      if(!el.isConnected){ live.delete(el); return; }
      var k = (s.pr ? 1100 : 560) * P.speed * P.speed, c = 2 * zeta * Math.sqrt(k);
      var n = Math.ceil(dt / .008), h = dt / n, x = s.s - s.t, i;
      for(i = 0; i < n; i++){ var a = -k * x - c * s.v; s.v += a * h; x += s.v * h; }
      s.s = s.t + x;
      if(Math.abs(x) < .0007 && Math.abs(s.v) < .01){
        s.s = s.t; s.v = 0;
        if(s.t === 1 && !s.pr){ live.delete(el); paint(el, s); return; }
      }
      paint(el, s);
    });
    if(live.size) raf = requestAnimationFrame(tick);
  }
  function releaseAll(){
    cur = null; genEl = null;
    live.forEach(function(el){ var s = el.__dk; if(s){ s.s = 1; s.v = 0; s.t = 1; s.hov = 1; s.pr = 0; } el.style.removeProperty("scale"); el.classList.remove("dk-up", "dk-live"); });
    live.clear(); pressed.clear();
  }

  /* ---- dock magnification ---- */
  var cur = null, genEl = null, px = 0, py = 0, tgt = null, pend = false, dirty = false;
  function build(g, box){
    var els = Array.prototype.filter.call(box.querySelectorAll(g.item), function(e){ return e.offsetWidth > 0 && e.offsetHeight > 0 && !e.matches(SKIP); });
    var w = 0, h = 0, list = els.map(function(el){
      var r = el.getBoundingClientRect(); w += el.offsetWidth; h += el.offsetHeight;
      return {el:el, cx:r.left + r.width / 2, cy:r.top + r.height / 2};
    });
    var n = Math.max(1, list.length), size = g.axis === "y" ? h / n : g.axis === "x" ? w / n : (w + h) / (2 * n);
    cur = {g:g, box:box, list:list, sigma:Math.max(22, size * (g.axis === "y" ? .9 : 1.05)), t:performance.now()};
    dirty = false;
  }
  function releaseGroup(){
    if(!cur) return;
    cur.list.forEach(function(o){ var s = o.el.__dk; if(s && s.hov !== 1){ s.hov = 1; retarget(o.el); } });
    cur = null;
  }
  function setGeneric(el){
    if(genEl === el) return;
    if(genEl){ var s = genEl.__dk; if(s && s.hov !== 1){ s.hov = 1; retarget(genEl); } }
    genEl = el;
    if(el){ st(el).hov = 1 + .05 * P.zoom; retarget(el); }
  }
  function onMove(){
    pend = false; params();
    if(noAnim() || !mqHover.matches){ releaseGroup(); setGeneric(null); return; }
    var el = tgt; if(!el || !el.closest){ releaseGroup(); setGeneric(null); return; }
    var g = null, box = null, i;
    for(i = 0; i < GROUPS.length; i++){ box = el.closest(GROUPS[i].box); if(box){ g = GROUPS[i]; break; } }
    if(g && !STY.mag) g = null;
    if(!g){ releaseGroup(); }
    else {
      if(!cur || cur.box !== box || dirty || performance.now() - cur.t > 350 || (cur.list[0] && !cur.list[0].el.isConnected)){
        if(cur && cur.box !== box) releaseGroup();
        build(g, box);
      }
      var amp = (g.max - 1) * P.zoom, two = 2 * cur.sigma * cur.sigma;
      cur.list.forEach(function(o){
        var dx = px - o.cx, dy = py - o.cy;
        var d2 = g.axis === "x" ? dx * dx : g.axis === "y" ? dy * dy : dx * dx + dy * dy;
        var w = Math.exp(-d2 / two); if(w < .02) w = 0;
        var s = o.el.__dk;
        if(!s && w === 0) return;
        s = st(o.el);
        var hov = 1 + amp * w;
        if(Math.abs(hov - s.hov) > .002){ s.hov = hov; retarget(o.el); }
      });
    }
    var gen = el.closest(GEN);
    if(gen && (gen.matches(SKIP) || (cur && cur.list.some(function(o){ return o.el === gen; })))) gen = null;
    if(gen && (gen.offsetWidth > 520 || gen.offsetHeight > 150)) gen = null;
    if(!STY.gen) gen = null;
    setGeneric(gen);
  }
  document.addEventListener("pointermove", function(e){
    if(e.pointerType === "touch") return;
    px = e.clientX; py = e.clientY; tgt = e.target;
    if(!pend){ pend = true; requestAnimationFrame(onMove); }
  }, {passive:true});
  document.addEventListener("mouseleave", function(){ tgt = null; releaseGroup(); setGeneric(null); });
  window.addEventListener("blur", function(){ tgt = null; releaseGroup(); setGeneric(null); releasePress(); });
  window.addEventListener("resize", function(){ dirty = true; });
  document.addEventListener("scroll", function(){ dirty = true; }, {capture:true, passive:true});

  /* ---- One UI press: squish down fast, then spring back with a little overshoot ---- */
  var pressed = new Set();
  document.addEventListener("pointerdown", function(e){
    if(noAnim() || (e.pointerType === "mouse" && e.button !== 0)) return;
    var el = e.target.closest && e.target.closest(GEN);
    if(!el || el.matches(SKIP) || el.offsetWidth > 520 || el.offsetHeight > 150) return;
    params(); var s = st(el); s.pr = 1; pressed.add(el); retarget(el);
  }, true);
  function releasePress(){
    params();
    pressed.forEach(function(el){
      var s = st(el); s.pr = 0;
      s.v += 1.1 * P.press * Math.min(1.5, P.bounce);    // the "pop" when you let go
      retarget(el);
    });
    pressed.clear();
  }
  ["pointerup", "pointercancel", "dragend"].forEach(function(n){ document.addEventListener(n, releasePress, true); });
})();

;
/* ===== 55-cursor-js.js ===== */
/* Custom cursors: a built-in macOS set, plus themes imported from .zip / .tar / .tar.gz files
   (GNOME / X11 "Xcursor" themes, or plain PNG / SVG / CUR sets). Themes are kept in IndexedDB. */
(function(){
  "use strict";
  var root = document.documentElement, KEY = "pb_cursor";
  /* PC only: a real mouse (hover + fine pointer). Phones and tablets with touch never get the custom cursor. */
  var PC_Q = "(hover:hover) and (pointer:fine)";
  var mqPC = window.matchMedia ? matchMedia(PC_Q) : {matches:true};
  function isPC(){ return !!mqPC.matches && !(navigator.maxTouchPoints > 0 && !matchMedia("(any-pointer:fine)").matches); }

  /*PURE-START*/
  function magic(b){
    if(b.length > 4 && b[0] === 0x58 && b[1] === 0x63 && b[2] === 0x75 && b[3] === 0x72) return "xcur";
    if(b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
    if(b.length > 6 && b[0] === 0 && b[1] === 0 && (b[2] === 2 || b[2] === 1) && b[3] === 0) return b[2] === 2 ? "cur" : "ico";
    if(b.length > 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
    if(b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return "webp";
    if(b.length > 3 && b[0] === 0xff && b[1] === 0xd8) return "jpg";
    var head = ""; for(var i = 0; i < Math.min(b.length, 400); i++) head += String.fromCharCode(b[i]);
    if(/<svg[\s>]/i.test(head) || (/^\s*<\?xml/i.test(head) && /<svg/i.test(head))) return "svg";
    return null;
  }
  function norm(p){
    var out = [], a = p.split("/"), i;
    for(i = 0; i < a.length; i++){ if(a[i] === "" || a[i] === ".") continue; if(a[i] === ".."){ out.pop(); continue; } out.push(a[i]); }
    return out.join("/");
  }
  function baseKey(p){ return p.replace(/^.*\//, "").toLowerCase().replace(/\.(png|svg|cur|ico|webp|gif|jpe?g|xcur)$/, ""); }
  function readZipDir(u8){
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), i = u8.length - 22, min = Math.max(0, u8.length - 65557);
    for(; i >= min; i--){ if(dv.getUint32(i, true) === 0x06054b50) break; }
    if(i < min) throw new Error("That isn't a zip file.");
    var n = dv.getUint16(i + 10, true), p = dv.getUint32(i + 16, true), ents = [], td = new TextDecoder(), k;
    if(p === 0xffffffff) throw new Error("Zip64 files aren't supported.");
    for(k = 0; k < n; k++){
      if(p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
      var made = dv.getUint16(p + 4, true), flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true),
          csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true), nl = dv.getUint16(p + 28, true),
          el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), ext = dv.getUint32(p + 38, true), lo = dv.getUint32(p + 42, true);
      var name = td.decode(u8.subarray(p + 46, p + 46 + nl)).replace(/\\/g, "/");
      var mode = (made >> 8) === 3 ? (ext >>> 16) : 0;
      ents.push({name:name, method:method, csize:csize, usize:usize, lo:lo, flags:flags, link:(mode & 0xF000) === 0xA000, dir:/\/$/.test(name)});
      p += 46 + nl + el + cl;
    }
    return ents;
  }
  async function inflate(u8){
    if(typeof DecompressionStream === "undefined") throw new Error("This browser can't unzip files (needs a newer version).");
    var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function readEntry(u8, e){
    if(e.data) return e.data;
    if(e.flags & 1) throw new Error("Password-protected zips aren't supported.");
    if(e.csize === 0xffffffff || e.usize === 0xffffffff) throw new Error("Zip64 files aren't supported.");
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), p = e.lo;
    if(dv.getUint32(p, true) !== 0x04034b50) throw new Error("The zip file is damaged.");
    var s = p + 30 + dv.getUint16(p + 26, true) + dv.getUint16(p + 28, true), raw = u8.subarray(s, s + e.csize);
    if(e.method === 0) return raw;
    if(e.method === 8) return inflate(raw);
    throw new Error("Unsupported zip compression.");
  }
  /* ---- .tar / .tar.gz / .tgz support ---- */
  async function gunzip(u8){
    if(typeof DecompressionStream === "undefined") throw new Error("This browser can't unpack .gz files (needs a newer version).");
    var rd = new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip")).getReader(), parts = [], total = 0, r;
    try{
      while(!(r = await rd.read()).done){
        total += r.value.length;
        if(total > 400e6){ try{ rd.cancel(); }catch(e){} throw new Error("That archive is too big once unpacked (400 MB max)."); }
        parts.push(r.value);
      }
    }catch(e){ if(/too big/.test(e.message)) throw e; throw new Error("The .gz file is damaged."); }
    var out = new Uint8Array(total), o = 0; parts.forEach(function(c){ out.set(c, o); o += c.length; });
    return out;
  }
  function isTar(u8){
    if(u8.length < 512) return false;
    if(u8[257] === 0x75 && u8[258] === 0x73 && u8[259] === 0x74 && u8[260] === 0x61 && u8[261] === 0x72) return true;   /* "ustar" */
    var sum = 0, i, want = parseInt(String.fromCharCode.apply(null, u8.subarray(148, 154)).replace(/[\0 ]/g, ""), 8);
    if(isNaN(want)) return false;
    for(i = 0; i < 512; i++) sum += (i >= 148 && i < 156) ? 32 : u8[i];
    return sum === want;
  }
  function readTarDir(u8){
    var td = new TextDecoder(), ents = [], p = 0, longName = null, longLink = null, pax = {};
    function str(a, b){ var e = a; while(e < b && u8[e] !== 0) e++; return td.decode(u8.subarray(a, e)); }
    function num(a, b){
      if(u8[a] & 0x80){ var v = u8[a] & 0x7f; for(var i = a + 1; i < b; i++) v = v * 256 + u8[i]; return v; }   /* base-256 for huge files */
      return parseInt(str(a, b).trim() || "0", 8) || 0;
    }
    while(p + 512 <= u8.length){
      var z = true; for(var q = p; q < p + 512; q++){ if(u8[q]){ z = false; break; } }
      if(z) break;
      var size = num(p + 124, p + 136), type = String.fromCharCode(u8[p + 156] || 48), body = p + 512, next = body + Math.ceil(size / 512) * 512;
      var name = str(p, p + 100), link = str(p + 157, p + 257);
      if(str(p + 257, p + 262) === "ustar"){ var pre = str(p + 345, p + 500); if(pre) name = pre + "/" + name; }
      if(type === "L"){ longName = str(body, body + size); p = next; continue; }
      if(type === "K"){ longLink = str(body, body + size); p = next; continue; }
      if(type === "x"){
        pax = {}; var txt = td.decode(u8.subarray(body, body + size)), m, re = /\d+ ([^=]+)=([^\n]*)\n/g;
        while((m = re.exec(txt))) pax[m[1]] = m[2];
        p = next; continue;
      }
      if(type === "g"){ p = next; continue; }
      if(longName != null) name = longName; if(pax.path) name = pax.path;
      if(longLink != null) link = longLink; if(pax.linkpath) link = pax.linkpath;
      longName = longLink = null; pax = {};
      name = name.replace(/\\/g, "/");
      if(type === "5" || /\/$/.test(name)){ ents.push({name:name.replace(/\/?$/, "/"), dir:true, usize:0}); }
      else if(type === "2" || type === "1"){   /* symlink / hard link: Xcursor themes are full of these. The link target is the "file" and gets resolved later. */
        var d = new TextEncoder().encode(link);
        ents.push({name:name, dir:false, link:true, data:d, usize:d.length});
      }
      else if(type === "0" || type === "7" || type === "\0"){
        if(body + size > u8.length) throw new Error("The tar file is damaged (cut short).");
        ents.push({name:name, dir:false, link:false, data:u8.subarray(body, body + size), usize:size});
      }
      p = next;
    }
    return ents;
  }
  /* open any supported archive: .zip, .tar, .tar.gz, .tgz (detected by content, not by name) */
  async function openArchive(file){
    var u8 = new Uint8Array(await file.arrayBuffer());
    if(u8.length > 2 && u8[0] === 0x1f && u8[1] === 0x8b){ u8 = await gunzip(u8); if(!isTar(u8)) throw new Error("That .gz file doesn't contain a tar archive."); return {u8:u8, ents:readTarDir(u8)}; }
    if(u8.length > 3 && u8[0] === 0x50 && u8[1] === 0x4b) return {u8:u8, ents:readZipDir(u8)};
    if(isTar(u8)) return {u8:u8, ents:readTarDir(u8)};
    throw new Error("That isn't a .zip, .tar or .tar.gz file.");
  }
  /* pick the best size out of an Xcursor file and return it as RGBA (not premultiplied) */
  function xcurPick(b, want){
    var dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if(dv.getUint32(0, true) !== 0x72756358) return null;
    var ntoc = dv.getUint32(12, true), toc = [], i;
    for(i = 0; i < ntoc && 16 + i * 12 + 12 <= b.length; i++){
      var o = 16 + i * 12;
      if(dv.getUint32(o, true) === 0xfffd0002) toc.push({nom:dv.getUint32(o + 4, true), pos:dv.getUint32(o + 8, true)});
    }
    if(!toc.length) return null;
    var best = null;
    toc.forEach(function(t){
      if(!best){ best = t; return; }
      var a = Math.abs(t.nom - want), c = Math.abs(best.nom - want);
      if(a < c) best = t;                    // first frame of the closest size wins
    });
    var q = best.pos, w = dv.getUint32(q + 16, true), h = dv.getUint32(q + 20, true);
    if(!w || !h || w > 512 || h > 512 || q + 36 + w * h * 4 > b.length) return null;
    var rgba = new Uint8ClampedArray(w * h * 4), j, px, a2;
    for(j = 0; j < w * h; j++){
      px = dv.getUint32(q + 36 + j * 4, true); a2 = (px >>> 24) & 255;
      var r = (px >>> 16) & 255, g = (px >>> 8) & 255, bl = px & 255;
      if(a2 > 0 && a2 < 255){ r = Math.min(255, Math.round(r * 255 / a2)); g = Math.min(255, Math.round(g * 255 / a2)); bl = Math.min(255, Math.round(bl * 255 / a2)); }
      rgba[j * 4] = r; rgba[j * 4 + 1] = g; rgba[j * 4 + 2] = bl; rgba[j * 4 + 3] = a2;
    }
    return {w:w, h:h, hx:dv.getUint32(q + 24, true), hy:dv.getUint32(q + 28, true), nom:best.nom, rgba:rgba};
  }
  /*PURE-END*/

  var ROLES = ["default","pointer","text","wait","progress","help","crosshair","move","grab","grabbing","not-allowed","ew","ns","nesw","nwse","zoom-in","zoom-out","copy","alias"];
  var CENTER = {"text":1,"wait":1,"crosshair":1,"move":1,"grab":1,"grabbing":1,"not-allowed":1,"ew":1,"ns":1,"nesw":1,"nwse":1};
  var ALIAS = {
    "default":["left_ptr","default","arrow","normal","normal select","left_arrow","top_left_arrow"],
    "pointer":["pointer","hand2","hand1","pointing_hand","link","link select","hand","e29285e634086352946a0e7090d73106","9d800788f1b08800ae810202380a0822"],
    "text":["text","xterm","ibeam","i-beam","beam","text select"],
    "wait":["wait","watch","busy","clock"],
    "progress":["progress","left_ptr_watch","half-busy","working","08e8e1c95fe2fc01f976f1e063a24ccd","3ecb610c1bf2410f44200f48c40d3599"],
    "help":["help","question_arrow","whats_this","help select","left_ptr_help","d9ce0ab605698f320427677b458ad60b"],
    "crosshair":["crosshair","cross","tcross","cross_reverse","precision select"],
    "move":["move","fleur","all-scroll","size_all","size all"],
    "grab":["grab","openhand","hand_open","9081237383d90e509aa00f00170e968f"],
    "grabbing":["grabbing","closedhand","hand_closed","fcf21c00b30f7e3f83fe0dfd12e71cff"],
    "not-allowed":["not-allowed","crossed_circle","forbidden","no-drop","dnd-no-drop","circle","unavailable","03b6e0fcb3499374a867c041f52298f0"],
    "ew":["ew-resize","sb_h_double_arrow","h_double_arrow","size_hor","horizontal resize","col-resize","e-resize","w-resize","left_side","right_side","14fef782d02440884392942c11205230"],
    "ns":["ns-resize","sb_v_double_arrow","v_double_arrow","size_ver","vertical resize","row-resize","n-resize","s-resize","top_side","bottom_side","2870a09082c103050810ffdffffe0204"],
    "nesw":["nesw-resize","fd_double_arrow","size_bdiag","diagonal resize 2","ne-resize","sw-resize","top_right_corner","bottom_left_corner","fcf1c3c7cd4491d801f1e1c78f100000"],
    "nwse":["nwse-resize","bd_double_arrow","size_fdiag","diagonal resize 1","nw-resize","se-resize","top_left_corner","bottom_right_corner","c7088f0f3e6c8088236ef8e1e3e70000"],
    "zoom-in":["zoom-in","zoom_in"], "zoom-out":["zoom-out","zoom_out"],
    "copy":["copy","dnd-copy","1081e37283d90000800003c07f3ef6bf"], "alias":["alias","dnd-link","3085a0e285430894940527032f8b26df"]
  };
  var KW = {"default":"default","pointer":"pointer","text":"text","vertical-text":"text","wait":"wait","progress":"progress","help":"help","crosshair":"crosshair","cell":"crosshair","move":"move","all-scroll":"move","grab":"grab","grabbing":"grabbing","not-allowed":"not-allowed","no-drop":"not-allowed","ew-resize":"ew","col-resize":"ew","e-resize":"ew","w-resize":"ew","ns-resize":"ns","row-resize":"ns","n-resize":"ns","s-resize":"ns","nesw-resize":"nesw","ne-resize":"nesw","sw-resize":"nesw","nwse-resize":"nwse","nw-resize":"nwse","se-resize":"nwse","zoom-in":"zoom-in","zoom-out":"zoom-out","copy":"copy","alias":"alias","context-menu":"default"};
  var CHAIN = {
    "progress":["progress","wait","default"], "wait":["wait","progress","default"], "grabbing":["grabbing","grab","pointer","default"],
    "grab":["grab","move","pointer","default"], "text":["text"], "pointer":["pointer","default"], "help":["help","default"],
    "crosshair":["crosshair","default"], "move":["move","default"], "not-allowed":["not-allowed","default"],
    "ew":["ew","move","default"], "ns":["ns","move","default"], "nesw":["nesw","move","default"], "nwse":["nwse","move","default"],
    "zoom-in":["zoom-in","default"], "zoom-out":["zoom-out","default"], "copy":["copy","default"], "alias":["alias","default"], "default":["default"]
  };
  var ROLE_KW = {"default":"default","pointer":"pointer","text":"text"};

  /* ---------------- small helpers ---------------- */
  function loadImg(url){ return new Promise(function(res){ var im = new Image(); im.onload = function(){ res(im); }; im.onerror = function(){ res(null); }; im.src = url; }); }
  function canvas(w, h){ var c = document.createElement("canvas"); c.width = w; c.height = h; var x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; return {c:c, x:x}; }
  function blobUrl(b, mime){ return URL.createObjectURL(new Blob([b], {type:mime})); }

  /* ---------------- built-in macOS cursors (drawn as SVG, rasterised once) ---------------- */
  function svg(inner){ return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 32 32">' + inner + '</svg>'; }
  function bold(list){
    var a = "", b = "";
    list.forEach(function(it){ var t = it[1] ? ' transform="' + it[1] + '"' : ""; a += '<path d="' + it[0] + '" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"' + t + '/>'; b += '<path d="' + it[0] + '" fill="#000"' + t + '/>'; });
    return a + b;
  }
  function line(d, w){ return '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="' + (w + 2.6) + '"/><path d="' + d + '" fill="none" stroke="#000" stroke-width="' + w + '"/>'; }
  function hand(rects, seps){
    var a = "", b = "";
    rects.forEach(function(r){
      var t = r[5] ? ' transform="rotate(' + r[5] + ' ' + (r[0] + r[2] / 2) + ' ' + (r[1] + r[3] / 2) + ')"' : "";
      var g = ' x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '" rx="' + r[4] + '"' + t;
      a += '<rect' + g + ' fill="#000" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'; b += '<rect' + g + ' fill="#fff"/>';
    });
    var s = ""; (seps || []).forEach(function(d){ s += '<path d="' + d + '" stroke="#000" stroke-width=".9" fill="none"/>'; });
    return a + b + s;
  }
  function ball(){
    var cols = ["#ff3b30","#ff9500","#ffcc00","#a8d82a","#34c759","#32ade6","#5e5ce6","#bf5af2"], s = "", i, R = 10.5;
    for(i = 0; i < 8; i++){
      var a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180;
      s += '<path d="M16 16 L' + (16 + R * Math.cos(a0)).toFixed(2) + " " + (16 + R * Math.sin(a0)).toFixed(2) + " A" + R + " " + R + " 0 0 1 " + (16 + R * Math.cos(a1)).toFixed(2) + " " + (16 + R * Math.sin(a1)).toFixed(2) + ' Z" fill="' + cols[i] + '"/>';
    }
    return '<circle cx="16" cy="16" r="12.4" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1"/>' + s + '<circle cx="16" cy="16" r="11" fill="none" stroke="#fff" stroke-width="1.8"/>';
  }
  var ARROW = "M5 3 V22.5 L10.2 18 L13.6 25.6 L17 24.1 L13.7 16.7 L20.5 16.5 Z";
  var HD = "M3 16 L10 9.5 V13.6 H22 V9.5 L29 16 L22 22.5 V18.4 H10 V22.5 Z";
  var MAC_SRC = {
    "default":[svg(bold([[ARROW]])), 5, 3],
    "pointer":[svg(hand([[10,3.5,4.4,15,2.2],[6.5,12,18,13.5,5],[14.2,10.8,4,9,2],[17.9,11.8,4,9,2],[21.4,13.2,3.6,8,1.8],[3,14.6,7.6,4.2,2.1,-25]], ["M14.3 14 V19.5","M18 14.5 V20","M21.5 15.5 V20.5"])), 12.2, 2.6],
    "text":[svg(line("M11.5 5 H20.5 M16 5 V27 M11.5 27 H20.5", 1.6)), 16, 16],
    "wait":[svg(ball()), 16, 16],
    "progress":[svg(ball()), 16, 16],
    "crosshair":[svg(line("M16 4 V28 M4 16 H28", 1.5)), 16, 16],
    "not-allowed":[svg('<circle cx="16" cy="16" r="9" fill="none" stroke="#fff" stroke-width="6.4"/><path d="M9.6 9.6 L22.4 22.4" stroke="#fff" stroke-width="6.4" stroke-linecap="round"/><circle cx="16" cy="16" r="9" fill="none" stroke="#e5342b" stroke-width="3"/><path d="M9.6 9.6 L22.4 22.4" stroke="#e5342b" stroke-width="3" stroke-linecap="round"/>'), 16, 16],
    "grab":[svg(hand([[7,14,18,11,5],[7.6,6.5,3.6,12,1.8],[11.5,4.5,3.6,14,1.8],[15.4,4,3.6,14,1.8],[19.3,5.5,3.6,13,1.8],[3.6,15.5,7,4,2,-35]])), 16, 16],
    "grabbing":[svg(hand([[7,15,18,10,5],[8,11,3.6,7,1.8],[11.8,10,3.6,8,1.8],[15.6,9.8,3.6,8,1.8],[19.4,10.8,3.6,7,1.8],[5,19,8,4,2]])), 16, 16],
    "ew":[svg(bold([[HD]])), 16, 16],
    "ns":[svg(bold([[HD, "rotate(90 16 16)"]])), 16, 16],
    "nesw":[svg(bold([[HD, "rotate(-45 16 16)"]])), 16, 16],
    "nwse":[svg(bold([[HD, "rotate(45 16 16)"]])), 16, 16],
    "move":[svg(bold([[HD], [HD, "rotate(90 16 16)"]])), 16, 16],
    "zoom-in":[svg('<circle cx="13" cy="13" r="8" fill="#fff" fill-opacity=".4" stroke="#fff" stroke-width="5"/><path d="M19 19 L27 27" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="13" cy="13" r="8" fill="none" stroke="#000" stroke-width="2"/><path d="M19 19 L27 27" stroke="#000" stroke-width="3.2" stroke-linecap="round"/><path d="M13 9 V17 M9 13 H17" stroke="#000" stroke-width="1.8"/>'), 13, 13],
    "zoom-out":[svg('<circle cx="13" cy="13" r="8" fill="#fff" fill-opacity=".4" stroke="#fff" stroke-width="5"/><path d="M19 19 L27 27" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="13" cy="13" r="8" fill="none" stroke="#000" stroke-width="2"/><path d="M19 19 L27 27" stroke="#000" stroke-width="3.2" stroke-linecap="round"/><path d="M9 13 H17" stroke="#000" stroke-width="1.8"/>'), 13, 13]
  };
  async function buildMac(){
    var roles = {}, keys = Object.keys(MAC_SRC);
    await Promise.all(keys.map(async function(k){
      var im = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(MAC_SRC[k][0]));
      if(!im) return;
      var cv = canvas(64, 64); cv.x.drawImage(im, 0, 0, 64, 64);
      roles[k] = {url:cv.c.toDataURL("image/png"), w:64, h:64, hx:MAC_SRC[k][1] * 2, hy:MAC_SRC[k][2] * 2, k:.5};
    }));
    return {id:"mac", name:"macOS", builtin:true, roles:roles};
  }

  /* ---------------- zip -> theme ---------------- */
  async function toPng(b, mime){
    var u = blobUrl(b, mime), im = await loadImg(u); URL.revokeObjectURL(u);
    if(!im || !im.naturalWidth) return null;
    var ow = im.naturalWidth, oh = im.naturalHeight, s = Math.min(1, 256 / Math.max(ow, oh));
    var w = Math.max(1, Math.round(ow * s)), h = Math.max(1, Math.round(oh * s)), cv = canvas(w, h);
    cv.x.drawImage(im, 0, 0, w, h);
    return {url:cv.c.toDataURL("image/png"), ow:ow, oh:oh, w:w, h:h, s:s};
  }
  function fromRaster(r, hs, role){
    var mx = Math.max(r.ow, r.oh), css = mx <= 48 ? 1 : 32 / mx;
    var hx = hs ? hs[0] : (CENTER[role] ? r.ow / 2 : 0), hy = hs ? hs[1] : (CENTER[role] ? r.oh / 2 : 0);
    return {url:r.url, w:r.w, h:r.h, hx:hx * r.s, hy:hy * r.s, k:(r.ow * css) / r.w};
  }
  async function decode(b, role, hs){
    var type = magic(b), td, r;
    if(type === "xcur"){
      var p = xcurPick(b, 48); if(!p) return null;
      var cv = canvas(p.w, p.h); cv.x.putImageData(new ImageData(p.rgba, p.w, p.h), 0, 0);
      return {url:cv.c.toDataURL("image/png"), w:p.w, h:p.h, hx:p.hx, hy:p.hy, k:24 / (p.nom || 24)};
    }
    if(type === "png" || type === "gif" || type === "webp" || type === "jpg"){
      r = await toPng(b, type === "jpg" ? "image/jpeg" : "image/" + type); return r ? fromRaster(r, hs, role) : null;
    }
    if(type === "svg"){
      td = new TextDecoder().decode(b);
      var vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(td), vw = 32, vh = 32;
      if(vb){ vw = +vb[1] || 32; vh = +vb[2] || 32; }
      else { var wm = /\swidth\s*=\s*["']([\d.]+)/i.exec(td), hm = /\sheight\s*=\s*["']([\d.]+)/i.exec(td); if(wm) vw = +wm[1]; if(hm) vh = +hm[1]; }
      var u = blobUrl(b, "image/svg+xml"), im = await loadImg(u); URL.revokeObjectURL(u); if(!im) return null;
      var sc = 64 / Math.max(vw, vh), w = Math.max(1, Math.round(vw * sc)), h = Math.max(1, Math.round(vh * sc)), c2 = canvas(w, h);
      c2.x.drawImage(im, 0, 0, w, h);
      var cx = hs ? hs[0] * sc : (CENTER[role] ? w / 2 : 0), cy = hs ? hs[1] * sc : (CENTER[role] ? h / 2 : 0);
      return {url:c2.c.toDataURL("image/png"), w:w, h:h, hx:cx, hy:cy, k:.5};
    }
    if(type === "cur" || type === "ico"){
      var dv = new DataView(b.buffer, b.byteOffset, b.byteLength), n = dv.getUint16(4, true), best = null, i;
      for(i = 0; i < n; i++){
        var o = 6 + i * 16, ew = dv.getUint8(o) || 256, eh = dv.getUint8(o + 1) || 256;
        if(!best || ew > best.w) best = {w:ew, h:eh, hx:dv.getUint16(o + 4, true), hy:dv.getUint16(o + 6, true), size:dv.getUint32(o + 8, true), off:dv.getUint32(o + 12, true)};
      }
      if(!best) return null;
      var data = b.subarray(best.off, best.off + best.size), one = new Uint8Array(22 + data.length), dv2 = new DataView(one.buffer);
      dv2.setUint16(2, 1, true); dv2.setUint16(4, 1, true);
      one[6] = best.w === 256 ? 0 : best.w; one[7] = best.h === 256 ? 0 : best.h;
      dv2.setUint16(10, 1, true); dv2.setUint16(12, 32, true); dv2.setUint32(14, data.length, true); dv2.setUint32(18, 22, true);
      one.set(data, 22);
      r = await toPng(one, "image/x-icon"); if(!r) return null;
      var f = fromRaster(r, [hs ? hs[0] : best.hx, hs ? hs[1] : best.hy], role);
      return f;
    }
    return null;
  }
  async function buildFromZip(file){
    var arc = await openArchive(file), u8 = arc.u8;
    var ents = arc.ents.filter(function(e){ return !e.dir && !/(^|\/)(__MACOSX\/|\._)/.test(e.name); });
    if(!ents.length) throw new Error("The archive is empty.");
    var byPath = {}, byBase = {};
    ents.forEach(function(e){
      var lp = e.name.toLowerCase(); byPath[lp] = e;
      var k = baseKey(lp), o = byBase[k];
      if(!o || (o.link && !e.link) || (!e.link && e.usize > o.usize)) byBase[k] = e;
    });
    async function bytesOf(e, depth){
      var b = await readEntry(u8, e);
      if(depth < 6 && (e.link || (b.length < 200 && !magic(b)))){
        var t = new TextDecoder().decode(b).trim();
        if(t && t.length < 180 && !/[\0\n]/.test(t)){
          var lt = t.toLowerCase(), dir = e.name.toLowerCase().replace(/[^\/]*$/, "");
          var te = byPath[norm(dir + lt)] || byPath[norm(lt)] || byBase[baseKey(lt)];
          if(te && te !== e) return bytesOf(te, depth + 1);
        }
        if(e.link) return null;
      }
      return b;
    }
    var name = file.name.replace(/\.(zip|tar\.gz|tgz|tar)$/i, ""), man = {}, td = new TextDecoder();
    var idx = ents.filter(function(e){ return /(^|\/)index\.theme$/i.test(e.name); })[0];
    if(idx){ try{ var m = /^\s*Name\s*=\s*(.+)$/m.exec(td.decode(await readEntry(u8, idx))); if(m) name = m[1].trim(); }catch(e){} }
    var mf = ents.filter(function(e){ return /(^|\/)(cursor|theme|manifest|hotspots)\.json$/i.test(e.name); })[0];
    if(mf){ try{ man = JSON.parse(td.decode(await readEntry(u8, mf))) || {}; if(man.name) name = String(man.name).slice(0, 60); }catch(e){} }
    var hots = man.hotspots || {}, roles = {};
    for(var ri = 0; ri < ROLES.length; ri++){
      var role = ROLES[ri], al = ALIAS[role], got = null;
      for(var ai = 0; ai < al.length && !got; ai++){
        var e = byBase[al[ai]]; if(!e || e.usize > 8e6) continue;
        try{
          var b = await bytesOf(e, 0); if(!b) continue;
          var hs = Array.isArray(hots[role]) ? hots[role] : null;
          got = await decode(b, role, hs);
        }catch(err){ if(/password|damaged|Zip64|unzip|unpack|compression|too big/i.test(err.message)) throw err; }
      }
      if(got) roles[role] = got;
    }
    if(!roles["default"]) throw new Error("No cursors found. Use a GNOME/X11 cursor theme archive (.zip, .tar or .tar.gz, with a cursors/ folder), or an archive of PNG / SVG / CUR files named default, pointer, text, and so on.");
    return {id:"u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:name, roles:roles};
  }

  /* ---------------- storage ---------------- */
  var dbp = null;
  function db(){
    return dbp || (dbp = new Promise(function(res, rej){
      try{
        var r = indexedDB.open("pb_cursors", 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore("themes", {keyPath:"id"}); };
        r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); };
      }catch(e){ rej(e); }
    }));
  }
  function tx(mode, fn){
    return db().then(function(d){ return new Promise(function(res, rej){
      var t = d.transaction("themes", mode), r = fn(t.objectStore("themes"));
      t.oncomplete = function(){ res(r && r.result); }; t.onerror = function(){ rej(t.error); };
    }); });
  }
  var state = {id:"sys", size:1};
  try{ var sv = JSON.parse(localStorage.getItem(KEY) || "null"); if(sv){ if(sv.id) state.id = String(sv.id); if(+sv.size > 0) state.size = +sv.size; } }catch(e){}
  function persist(){ try{ if(state.id === "sys" && state.size === 1) localStorage.removeItem(KEY); else localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  /* ---------------- turning a theme into CSS ---------------- */
  var MAC = null, themes = [], styleEl = document.createElement("style"), lastVals = null, tok = 0;
  styleEl.id = "cur-css";
  function current(){
    if(state.id === "mac") return MAC;
    for(var i = 0; i < themes.length; i++) if(themes[i].id === state.id) return themes[i];
    return null;
  }
  async function compose(th, mult){
    var out = {}, cache = {};
    for(var i = 0; i < ROLES.length; i++){
      var role = ROLES[i], r = th.roles[role]; if(!r) continue;
      var im = cache[r.url] || (cache[r.url] = await loadImg(r.url)); if(!im) continue;
      var cw = r.w * r.k * mult, ch = r.h * r.k * mult, cap = 64 / Math.max(cw, ch);
      if(cap < 1){ cw *= cap; ch *= cap; }
      cw = Math.max(8, Math.round(cw)); ch = Math.max(8, Math.round(ch));
      var hx = Math.min(cw - 1, Math.max(0, Math.round(r.hx / r.w * cw))), hy = Math.min(ch - 1, Math.max(0, Math.round(r.hy / r.h * ch)));
      var a = canvas(cw, ch); a.x.drawImage(im, 0, 0, cw, ch);
      var b = canvas(cw * 2, ch * 2); b.x.drawImage(im, 0, 0, cw * 2, ch * 2);
      out[role] = {d1:"url(" + a.c.toDataURL("image/png") + ") " + hx + " " + hy, d2:"image-set(url(" + b.c.toDataURL("image/png") + ") 2x) " + hx + " " + hy};
    }
    return out;
  }
  function pick(vals, role){ var c = CHAIN[role] || ["default"]; for(var i = 0; i < c.length; i++) if(vals[c[i]]) return vals[c[i]]; return null; }
  function decl(v, kw, imp){ return "cursor:" + v.d1 + "," + kw + (imp ? " !important" : "") + ";cursor:" + v.d2 + "," + kw + (imp ? " !important" : "") + ";"; }
  function gen(vals){
    var out = [];
    function walk(rules){
      for(var i = 0; i < rules.length; i++){
        var r = rules[i], t = r.type;
        if(t === 1){
          var c = r.style && r.style.getPropertyValue("cursor"); if(!c) continue;
          c = c.trim().toLowerCase(); if(c.indexOf("url(") >= 0 || c.indexOf("image-set") >= 0) continue;
          var kw = c.split(",")[0].trim().split(/\s+/)[0], role = KW[kw]; if(!role) continue;
          var v = pick(vals, role); if(!v) continue;
          out.push(r.selectorText + "{" + decl(v, kw, true) + "}");
        } else if((t === 4 || t === 12) && r.cssRules){
          out.push((t === 4 ? "@media " + r.media.mediaText : "@supports " + r.conditionText) + "{"); walk(r.cssRules); out.push("}");
        }
      }
    }
    Array.prototype.forEach.call(document.styleSheets, function(sh){
      if(sh.ownerNode && sh.ownerNode.id === "cur-css") return;
      var rules; try{ rules = sh.cssRules; }catch(e){ return; }
      if(rules) walk(rules);
    });
    var d = vals["default"], tx2 = pick(vals, "text"), po = pick(vals, "pointer");
    if(d) out.push("html.cur-on{" + decl(d, "default", false) + "}");
    if(tx2) out.push('html.cur-on :is(input:not([type=checkbox],[type=radio],[type=range],[type=button],[type=submit],[type=reset],[type=file],[type=color]),textarea,[contenteditable=""],[contenteditable="true"]){' + decl(tx2, "text", false) + "}");
    if(po) out.push("html.cur-on :is(a[href],summary,select,label[for],input[type=checkbox],input[type=radio],input[type=range],input[type=file],input[type=color],input[type=button],input[type=submit]){" + decl(po, "pointer", false) + "}");
    return "@media " + PC_Q + "{\n" + out.join("\n") + "\n}";
  }
  function clear(){ lastVals = null; root.classList.remove("cur-on"); if(styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); }
  function paint(){
    if(!lastVals) return;
    styleEl.textContent = gen(lastVals);
    document.body.appendChild(styleEl);       // keep it last so it wins
    root.classList.add("cur-on");
  }
  async function apply(){
    var t = ++tok, th = current();
    if(!th || !isPC()){ clear(); return; }
    var vals = await compose(th, state.size);
    if(t !== tok) return;
    if(!vals["default"]){ clear(); return; }
    lastVals = vals; paint();
  }
  var rt = 0;
  new MutationObserver(function(list){
    if(!lastVals) return;
    var hit = list.some(function(m){ return Array.prototype.some.call(m.addedNodes, function(n){ return n.nodeType === 1 && n.tagName === "STYLE" && n.id !== "cur-css"; }); });
    if(hit){ clearTimeout(rt); rt = setTimeout(paint, 350); }
  }).observe(document.documentElement, {childList:true, subtree:true});

  /* ---------------- the settings card ---------------- */
  var scroll = document.querySelector(".stg-scroll");
  if(scroll){
    var card = document.createElement("div"); card.className = "stg-card"; card.id = "stg-cursor";
    var chips = [["cdm-pointer","👆 Link"],["cdm-wait","⏳ Busy"],["cdm-progress","⌛ Working"],["cdm-no","🚫 Blocked"],["cdm-grab","✋ Grab"],["cdm-grabbing","✊ Grabbing"],["cdm-cross","➕ Cross"],["cdm-move","✥ Move"],["cdm-ew","↔ Resize"],["cdm-ns","↕ Resize"],["cdm-nesw","⤢ Resize"],["cdm-nwse","⤡ Resize"],["cdm-zin","🔍 Zoom in"],["cdm-zout","🔎 Zoom out"],["cdm-help","❔ Help"]];
    card.innerHTML = '<h3>🖱️ Cursor</h3>' +
      '<div class="xnote">Replace your mouse pointer. Comes with a macOS cursor, and you can import GNOME / X11 cursor themes (or PNG / SVG / CUR sets) as .zip, .tar or .tar.gz files. Changes apply right away.</div>' +
      '<label for="cur-sel">Cursor theme</label><select id="cur-sel"></select>' +
      '<label for="cur-size">Size</label><select id="cur-size"><option value="0.75">Small</option><option value="1">Normal</option><option value="1.5">Large</option><option value="2">Extra large</option></select>' +
      '<div class="cur-row"><button type="button" class="btn alt" id="cur-imp">⬆ Import cursor theme (.zip / .tar.gz)</button><button type="button" class="btn alt" id="cur-del" disabled>🗑 Remove this theme</button></div>' +
      '<input type="file" id="cur-file" accept=".zip,.tar,.tar.gz,.tgz,.gz,application/zip,application/x-tar,application/gzip,application/x-gzip" multiple style="display:none">' +
      '<div class="xnote">Need more cursors? <a href="https://www.gnome-look.org/browse?cat=107&amp;ord=latest" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">Browse cursor themes on GNOME-Look</a>, download a theme, then import the .zip, .tar or .tar.gz here.</div>' +
      '<div id="cur-msg"></div>' +
      '<div class="cur-mk"><h4>🎨 Make your own cursor</h4>' +
      '<div class="xnote">Pick an image (PNG, JPG, WebP, GIF or SVG) for each cursor you want to change. Only the Normal arrow is needed: any cursor you skip uses it (and the Text cursor stays as your system one). Click the picture to set the exact point that does the clicking (the red dot).</div>' +
      '<label for="mk-name">Name</label><input type="text" id="mk-name" maxlength="40" placeholder="My cursor" autocomplete="off">' +
      '<label for="mk-role">Which cursor are you setting?</label><select id="mk-role"></select>' +
      '<div class="mk-edit"><div class="mk-stage" id="mk-stage">No image yet</div><div class="mk-btns"><button type="button" class="btn alt" id="mk-pick">🖼 Choose image</button><button type="button" class="btn alt" id="mk-clear" disabled>✖ Remove this image</button></div></div>' +
      '<input type="file" id="mk-file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style="display:none">' +
      '<div class="cur-grid" id="mk-list"></div>' +
      '<div class="cur-row"><button type="button" class="btn" id="mk-save" disabled>💾 Save my cursor</button><button type="button" class="btn alt" id="mk-reset">Start over</button></div></div>' +
      '<div class="al-demo" style="display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:var(--bg);border:1px solid var(--line)"><h4 style="margin:0;font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Try it</h4><div class="cur-grid">' +
      '<input type="text" class="cdm-text" placeholder="Text cursor" id="cur-demo-in">' +
      chips.map(function(c){ return '<span class="cur-chip ' + c[0] + '">' + c[1] + '</span>'; }).join("") +
      '</div></div>';
    scroll.appendChild(card);

    var $ = function(i){ return document.getElementById(i); };
    var sel = $("cur-sel"), sz = $("cur-size"), del = $("cur-del"), msg = $("cur-msg"), file = $("cur-file");
    function say(t, err){ msg.textContent = t || ""; msg.className = err ? "err" : ""; }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
    function renderSel(){
      var h = '<option value="sys">System default</option>';
      if(MAC) h += '<option value="mac">macOS (built-in)</option>';
      themes.forEach(function(t){ h += '<option value="' + esc(t.id) + '">' + esc(t.name) + "</option>"; });
      sel.innerHTML = h; sel.value = current() ? state.id : "sys"; sz.value = String(state.size);
      if(sz.value !== String(state.size)) sz.value = "1";
      del.disabled = !(themes.some(function(t){ return t.id === state.id; }));
    }
    sel.onchange = function(){ state.id = sel.value; del.disabled = !themes.some(function(t){ return t.id === state.id; }); persist(); apply(); say(""); };
    sz.onchange = function(){ state.size = +sz.value || 1; persist(); apply(); };
    $("cur-imp").onclick = function(){ file.click(); };
    del.onclick = function(){
      var t = themes.filter(function(x){ return x.id === state.id; })[0]; if(!t) return;
      if(!confirm('Remove the cursor theme "' + t.name + '"?')) return;
      themes = themes.filter(function(x){ return x !== t; });
      tx("readwrite", function(s){ return s.delete(t.id); }).catch(function(){});
      state.id = "sys"; persist(); renderSel(); apply(); say('Removed "' + t.name + '".');
    };
    file.onchange = async function(){
      var fs = Array.prototype.slice.call(file.files); file.value = "";
      for(var i = 0; i < fs.length; i++){
        say("Reading " + fs[i].name + "…");
        try{
          if(fs[i].size > 60e6) throw new Error("That file is too big (60 MB max).");
          var th = await buildFromZip(fs[i]), saved = true;
          await tx("readwrite", function(s){ return s.put(th); }).catch(function(){ saved = false; });
          themes.push(th); state.id = th.id;
          say('Added "' + th.name + '" with ' + Object.keys(th.roles).length + " cursors." + (saved ? "" : " (Couldn't save it for next time in this browser.)"));
        }catch(e){ say((fs[i].name + ": ") + (e && e.message || e), true); }
      }
      persist(); renderSel(); apply();
    };
    /* ---- make your own cursor from images ---- */
    var MK = [["default","🖱 Normal arrow (needed)"],["pointer","👆 Link / button"],["text","🔤 Text (typing)"],["wait","⏳ Busy"],["progress","⌛ Working"],["not-allowed","🚫 Blocked"],["grab","✋ Grab"],["grabbing","✊ Grabbing"],["crosshair","➕ Crosshair"],["move","✥ Move"],["help","❔ Help"],["zoom-in","🔍 Zoom in"],["zoom-out","🔎 Zoom out"]];
    var mkRole = $("mk-role"), mkStage = $("mk-stage"), mkList = $("mk-list"), mkSave = $("mk-save"), mkClear = $("mk-clear"), mkFile = $("mk-file"), mkName = $("mk-name");
    var draft = {};
    mkRole.innerHTML = MK.map(function(m){ return '<option value="' + m[0] + '">' + m[1] + "</option>"; }).join("");
    function mkLabel(r){ for(var i = 0; i < MK.length; i++) if(MK[i][0] === r) return MK[i][1]; return r; }
    function mkPaint(){
      var d = draft[mkRole.value];
      mkStage.replaceChildren();
      if(!d){ mkStage.textContent = "No image yet"; }
      else {
        var w = document.createElement("div"); w.className = "mk-wrap";
        var im = new Image(); im.alt = ""; im.draggable = false; im.src = d.url;
        var dot = document.createElement("span"); dot.className = "mk-dot"; dot.style.left = (d.fx * 100) + "%"; dot.style.top = (d.fy * 100) + "%";
        w.addEventListener("click", function(e){
          var r = im.getBoundingClientRect(); if(!r.width || !r.height) return;
          d.fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); d.fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          dot.style.left = (d.fx * 100) + "%"; dot.style.top = (d.fy * 100) + "%";
        });
        w.append(im, dot); mkStage.appendChild(w);
      }
      mkClear.disabled = !d;
      var keys = MK.map(function(m){ return m[0]; }).filter(function(k){ return draft[k]; });
      mkList.innerHTML = keys.map(function(k){ return '<span class="cur-chip mk-chip" data-r="' + k + '">' + esc(mkLabel(k)) + "<b>✎</b></span>"; }).join("");
      mkSave.disabled = !draft["default"];
    }
    async function mkRaster(f){
      if(!/^image\/(png|jpeg|webp|gif|svg\+xml)$/.test(f.type)) throw new Error("Use a PNG, JPG, WebP, GIF or SVG image.");
      if(f.size > 8e6) throw new Error("That image is too big (8 MB max).");
      var u = URL.createObjectURL(f), im = await loadImg(u); URL.revokeObjectURL(u);
      if(!im) throw new Error("Couldn't read that image.");
      var ow = im.naturalWidth || 64, oh = im.naturalHeight || 64;
      if(f.type === "image/svg+xml"){ var m0 = Math.max(ow, oh); if(m0 < 64){ ow = Math.round(ow * 64 / m0); oh = Math.round(oh * 64 / m0); } }
      var sc = Math.min(1, 256 / Math.max(ow, oh)), w = Math.max(1, Math.round(ow * sc)), h = Math.max(1, Math.round(oh * sc)), cv = canvas(w, h);
      cv.x.drawImage(im, 0, 0, w, h);
      return {url:cv.c.toDataURL("image/png"), w:w, h:h, ow:ow, oh:oh, s:sc};
    }
    mkRole.onchange = mkPaint;
    $("mk-pick").onclick = function(){ mkFile.click(); };
    mkFile.onchange = async function(){
      var f = mkFile.files[0]; mkFile.value = ""; if(!f) return;
      try{
        var r = await mkRaster(f), role = mkRole.value, c = CENTER[role] ? 0.5 : 0;
        draft[role] = {url:r.url, w:r.w, h:r.h, ow:r.ow, oh:r.oh, s:r.s, fx:c, fy:c};
        if(!mkName.value.trim()) mkName.value = f.name.replace(/\.[^.]+$/, "").slice(0, 40);
        say("");
      }catch(e){ say(e && e.message || String(e), true); }
      mkPaint();
    };
    mkClear.onclick = function(){ delete draft[mkRole.value]; mkPaint(); };
    mkList.onclick = function(e){ var c = e.target.closest(".mk-chip"); if(!c) return; mkRole.value = c.dataset.r; mkPaint(); };
    $("mk-reset").onclick = function(){ draft = {}; mkName.value = ""; say(""); mkPaint(); };
    mkSave.onclick = async function(){
      if(!draft["default"]){ say("Add an image for the Normal arrow first.", true); return; }
      var roles = {};
      Object.keys(draft).forEach(function(k){
        var d = draft[k];
        roles[k] = fromRaster({url:d.url, w:d.w, h:d.h, ow:d.ow, oh:d.oh, s:d.s}, [d.fx * d.ow, d.fy * d.oh], k);
      });
      var th = {id:"u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name:(mkName.value.trim() || "My cursor").slice(0, 40), roles:roles, custom:1}, saved = true;
      await tx("readwrite", function(s2){ return s2.put(th); }).catch(function(){ saved = false; });
      themes.push(th); state.id = th.id; persist(); renderSel(); apply();
      say('Saved "' + th.name + '" and switched to it.' + (saved ? "" : " (Couldn't save it for next time in this browser.)"));
      draft = {}; mkName.value = ""; mkPaint();
    };
    mkPaint();
    renderSel();
    window.__cursorUI = renderSel;
  }

  function onPtr(){ if(window.__cursorUI) window.__cursorUI(); apply(); }
  if(mqPC.addEventListener) mqPC.addEventListener("change", onPtr); else if(mqPC.addListener) mqPC.addListener(onPtr);
  Promise.all([
    buildMac().catch(function(){ return null; }),
    tx("readonly", function(s){ return s.getAll(); }).catch(function(){ return []; })
  ]).then(function(r){
    MAC = r[0]; themes = r[1] || [];
    if(window.__cursorUI) window.__cursorUI();
    apply();
  });
})();

;
/* ===== 56-offline-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const CONN_RE = /couldn.t (connect|join)|can.t reach|isn.t responding|not responding|disconnected from the room|went offline/i;
  const isField = t => !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
  window.__offline = false;

  /* the banner under the top bar */
  const bar = document.createElement("div"); bar.id = "offbar"; bar.setAttribute("role", "status");
  bar.innerHTML = '<span><b>You\u2019re offline.</b> The chat room can\u2019t be reached, so everything that needs it (chatting, voting, drawing, editing) is locked. You can still look around the rest of the site.</span><button type="button" id="off-retry">Try again</button>';
  const hw = $$("hdrwrap"); if(hw) hw.after(bar); else $$("box").before(bar);

  /* the classic join screen gets the same way in */
  const gb = $$("g-offline"), ge = $$("gerr");
  const syncGate = () => { if(gb) gb.hidden = !CONN_RE.test((ge && ge.textContent) || ""); };
  if(ge){ try{ new MutationObserver(syncGate).observe(ge, { childList: true, characterData: true, subtree: true }); }catch(e){} syncGate(); }
  if(gb) gb.onclick = () => window.__enterOffline();

  function stopConnecting(){
    window.__entering = false; clearTimeout(window.__enterT);
    try{ if(window.__hubClose) window.__hubClose(); }catch(e){}
    try{ if(peer && peer.destroy) peer.destroy(); }catch(e){}
    peer = null; conns = []; isHost = false;
  }

  window.__enterOffline = function(){
    if(window.__offline) return;
    stopConnecting();
    window.__offline = true;
    document.body.classList.add("offline");
    document.querySelectorAll("#box .msg.sys").forEach(e => e.remove());
    const g = $$("gate"); g.classList.add("leaving"); g.style.display = "none";
    $$("gerr").textContent = ""; $$("g-go").disabled = false;
    try{ if(window.__pbHideOv) window.__pbHideOv(); }catch(e){}
    setStatus("Offline \u2014 view only");
    $$("inp").disabled = true; $$("fi").disabled = true;
    try{ setStg(false); }catch(e){}
    try{ renderOnline([]); }catch(e){}
    try{ setChannel("home"); }catch(e){}
  };

  function retry(){
    if(!window.__offline) return;
    window.__offline = false; document.body.classList.remove("offline");
    setStatus("");
    const g = $$("gate"); g.classList.remove("leaving"); g.style.display = "flex";
    if(window.__pbSignIn) window.__pbSignIn();
  }
  $$("off-retry").onclick = retry;

  /* nothing that changes shared things can slip through while offline */
  const note = () => { try{ sys("You\u2019re offline, so this is view only."); }catch(e){} };
  if(typeof postMsg === "function"){ const o = postMsg; postMsg = function(){ if(window.__offline){ note(); return; } return o.apply(this, arguments); }; }
  if(typeof sendText === "function"){ const o = sendText; sendText = function(){ if(window.__offline){ note(); return; } return o.apply(this, arguments); }; }
  if(typeof toggleReaction === "function"){ const o = toggleReaction; toggleReaction = function(){ if(window.__offline){ note(); return; } return o.apply(this, arguments); }; }
  if(typeof window.__pbIsMod === "function"){ const o = window.__pbIsMod; window.__pbIsMod = function(){ return window.__offline ? false : o.apply(this, arguments); }; }

  /* no dropping / pasting pictures, and no board or tier-list shortcuts, while offline */
  ["dragenter", "dragover", "drop"].forEach(t => window.addEventListener(t, e => { if(!window.__offline || isField(e.target)) return; e.preventDefault(); e.stopImmediatePropagation(); }, true));
  window.addEventListener("paste", e => { if(!window.__offline || isField(e.target)) return; e.preventDefault(); e.stopImmediatePropagation(); }, true);
  window.addEventListener("keydown", e => { if(!window.__offline || isField(e.target)) return; if(curCh === "draw" || curCh === "tier") e.stopImmediatePropagation(); }, true);
})();
