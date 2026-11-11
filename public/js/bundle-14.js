/* ===== 39-links-js.js ===== */
/* Links in messages: every web address becomes clickable (opens in a new tab), and the first one in a message gets an
   iMessage-style preview card (picture, title, site). Titles and pictures come from the free microlink.io service; private
   chats and group chats never send their links anywhere, they just get a plain site card. Turn previews off in Settings > Messages. */
(function(){
  "use strict";
  var KEY = "pb_lpv", OFFK = "pb_lpv_off", MEM = {}, QUEUE = [], BUSY = 0;
  var off = false; try{ off = localStorage.getItem(OFFK) === "1"; }catch(e){}
  if(off) document.body.classList.add("no-lpv");
  var cache = {}; try{ cache = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }catch(e){}
  function saveCache(){
    try{
      var ks = Object.keys(cache); if(ks.length > 120){ ks.sort(function(a, b){ return (cache[a].t || 0) - (cache[b].t || 0); }).slice(0, ks.length - 100).forEach(function(k){ delete cache[k]; }); }
      localStorage.setItem(KEY, JSON.stringify(cache));
    }catch(e){}
  }
  var URLRE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|gg|co|app|dev|tv|me|xyz|edu|gov|ly|us|uk|ai|fm)(?:\/[^\s<>"'`]*)?(?![\w@-])/gi;
  function norm(raw){
    var t = raw.replace(/[.,!?;:)\]}'"]+$/, "");
    var lead = /^https?:\/\//i.test(t) ? t : "https://" + t;
    try{ var u = new URL(lead); if(u.protocol !== "http:" && u.protocol !== "https:") return null; if(!/\./.test(u.hostname)) return null; return {text:t, href:u.href, host:u.hostname.replace(/^www\./, "")}; }catch(e){ return null; }
  }
  function linkify(bub){
    if(!/https?:\/\/|www\.|\.(?:com|net|org|io|gg|co|app|dev|tv|me|xyz|edu|gov|ly|us|uk|ai|fm)\b/i.test(bub.textContent)) return null;
    var first = null, nodes = [], w = document.createTreeWalker(bub, NodeFilter.SHOW_TEXT, null), n;
    while((n = w.nextNode())){ if(!n.parentNode.closest("a")) nodes.push(n); }
    nodes.forEach(function(tn){
      var txt = tn.nodeValue, last = 0, m, frag = null; URLRE.lastIndex = 0;
      while((m = URLRE.exec(txt))){
        var info = norm(m[0]); if(!info) continue;
        if(!frag) frag = document.createDocumentFragment();
        if(m.index > last) frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var a = document.createElement("a"); a.className = "lnk"; a.href = info.href; a.target = "_blank"; a.rel = "noopener noreferrer nofollow"; a.textContent = info.text;
        frag.appendChild(a);
        var used = info.text.length; last = m.index + used; URLRE.lastIndex = last;
        if(!first) first = info;
      }
      if(frag){ if(last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last))); tn.parentNode.replaceChild(frag, tn); }
    });
    return first;
  }
  var IMG = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i;
  function favicon(host){ return "https://www.google.com/s2/favicons?sz=64&domain=" + encodeURIComponent(host); }
  function paintCard(card, info, meta){
    card.replaceChildren();
    if(meta && meta.image){ var im = new Image(); im.className = "pi"; im.alt = ""; im.loading = "lazy"; im.referrerPolicy = "no-referrer"; im.onerror = function(){ im.remove(); }; im.src = meta.image; card.appendChild(im); }
    var pb = document.createElement("div"); pb.className = "pb";
    var f = new Image(); f.className = "pf"; f.alt = ""; f.referrerPolicy = "no-referrer"; f.src = (meta && meta.logo) || favicon(info.host); f.onerror = function(){ f.style.visibility = "hidden"; };
    var pt = document.createElement("div"); pt.className = "pt";
    var b = document.createElement("b"); b.textContent = (meta && meta.title) || info.host;
    var sp = document.createElement("span"); sp.textContent = (meta && meta.publisher && meta.publisher !== b.textContent ? meta.publisher + " · " : "") + info.host;
    pt.append(b, sp); pb.append(f, pt); card.appendChild(pb);
  }
  function pump(){
    while(BUSY < 2 && QUEUE.length){
      var job = QUEUE.shift(); BUSY++;
      (function(job){
        var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function(){ if(ctl) ctl.abort(); }, 7000);
        fetch("https://api.microlink.io/?url=" + encodeURIComponent(job.info.href), ctl ? {signal:ctl.signal} : {})
          .then(function(r){ return r.json(); })
          .then(function(j){
            var d = j && j.status === "success" && j.data || {};
            var meta = {title: String(d.title || "").slice(0, 160), image: d.image && d.image.url || "", logo: d.logo && d.logo.url || "", publisher: String(d.publisher || "").slice(0, 60)};
            if(!/^https?:\/\//i.test(meta.image)) meta.image = ""; if(!/^https?:\/\//i.test(meta.logo)) meta.logo = "";
            cache[job.info.href] = {m: meta, t: Date.now()}; saveCache(); MEM[job.info.href] = meta; job.done(meta);
          })
          .catch(function(){ MEM[job.info.href] = {}; job.done(null); })
          .then(function(){ clearTimeout(to); BUSY--; pump(); });
      })(job);
    }
  }
  function addCard(bub, info){
    var bw = bub.closest(".bwrap"), wrap = bw && bw.parentNode; if(!wrap) return;       // the card sits under the bubble, in the message column
    var old = wrap.querySelector(":scope > .lpv");
    if(old && old.href === info.href) return;
    if(old) old.remove();
    if(IMG.test(info.href)) return;
    var card = document.createElement("a"); card.className = "lpv"; card.href = info.href; card.target = "_blank"; card.rel = "noopener noreferrer nofollow";
    var row = bub.closest(".msg"), priv = !!row && (row.dataset.ch === "dm" || row.dataset.ch === "grp");
    var hit = MEM[info.href] || (cache[info.href] && cache[info.href].m);
    paintCard(card, info, hit);
    bw.after(card);
    if(hit || priv || off) return;
    QUEUE.push({info:info, done:function(meta){ if(meta && card.isConnected) paintCard(card, info, meta); }}); pump();
  }
  function install(){
    var base = window.fillBubble;
    window.fillBubble = function(bub, text){
      if(base) base(bub, text); else bub.textContent = text;
      var info = null; try{ info = linkify(bub); }catch(e){}
      bub._lpv = info;
      if(info) setTimeout(function(){ try{ addCard(bub, info); }catch(e){} }, 0);
      else setTimeout(function(){ var c = bub.closest(".col"); if(c){ var o = c.querySelector(":scope > .lpv"); if(o) o.remove(); } }, 0);   // an edit removed the link
    };
  }
  install();

  /* Settings > Messages: a switch for the preview cards (links stay clickable either way) */
  var cardEl = null; document.querySelectorAll(".stg-card").forEach(function(c){ var h = c.querySelector("h3"); if(!cardEl && h && /messages/i.test(h.textContent) && !/live|preview/i.test(h.textContent)) cardEl = c; });
  if(cardEl){
    var host = cardEl.querySelector(".sx-group") || cardEl;
    var l = document.createElement("label"); l.className = "chk" + (host !== cardEl ? " sx-chk" : "");
    var cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "lpv-on"; cb.checked = !off;
    l.appendChild(cb); l.appendChild(document.createTextNode("Show website previews for links"));
    host.appendChild(l);
    cb.addEventListener("change", function(){
      off = !cb.checked; try{ if(off) localStorage.setItem(OFFK, "1"); else localStorage.removeItem(OFFK); }catch(e){}
      document.body.classList.toggle("no-lpv", off);
    });
  }
})();

;
/* ===== 40-alab-js.js ===== */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  var stg = $("stg"), scroll = document.querySelector(".stg-scroll"), saveBtn = $("save");
  if(!stg || !scroll || !saveBtn) return;
  var root = document.documentElement, KEY = "pb_alab";
  var DEF = {style:"mixed", off:false, speed:100, bounce:100, zoom:100, press:100, open:null, close:null};
  var STYLE_IDS = ["mixed", "macos", "pixel", "oneui"];
  var RNG = {speed:[25,300], bounce:[0,300], zoom:[0,300], press:[0,300]};

  function clean(o){
    var r = {}, k; for(k in DEF) r[k] = DEF[k];
    if(o && typeof o === "object"){
      if(o.off === true) r.off = true;
      if(STYLE_IDS.indexOf(o.style) > -1) r.style = o.style;
      Object.keys(RNG).forEach(function(n){ var v = +o[n]; if(o[n] != null && isFinite(v)) r[n] = Math.max(RNG[n][0], Math.min(RNG[n][1], v)); });
      ["open","close"].forEach(function(n){ var v = +o[n]; if(o[n] != null && isFinite(v)) r[n] = Math.max(0, Math.min(1500, v)); });
    }
    return r;
  }
  function read(){ try{ return clean(JSON.parse(localStorage.getItem(KEY) || "null")); }catch(e){ return clean(null); } }
  var S = read();

  /* ---------- 1. find every animation rule in the page's stylesheets and make it follow the sliders ---------- */
  var items = [];
  var BEZ = /cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g;
  var PROPS = ["transition","animation","transition-duration","animation-duration","transition-timing-function","animation-timing-function","--ez2"];
  function hasOver(v){ var m, re = new RegExp(BEZ.source, "g"); while((m = re.exec(v))){ if(+m[2] > 1 || +m[4] > 1) return true; } return false; }
  function num(n){ return String(Math.round(n * 1000) / 1000); }
  function bez(v, b){ return v.replace(BEZ, function(all, x1, y1, x2, y2){ y1 = +y1; y2 = +y2; if(y1 > 1) y1 = 1 + (y1 - 1) * b; if(y2 > 1) y2 = 1 + (y2 - 1) * b; return "cubic-bezier(" + x1 + "," + num(y1) + "," + x2 + "," + num(y2) + ")"; }); }
  function splitTop(v){ var out = [], d = 0, cur = "", c, i; for(i = 0; i < v.length; i++){ c = v.charAt(i); if(c === "(") d++; else if(c === ")") d--; if(c === "," && d === 0){ out.push(cur); cur = ""; } else cur += c; } out.push(cur); return out; }
  function wrapSeg(seg){
    var toks = seg.trim().match(/[^\s(]+\([^)]*\)|\S+/g) || [], i, m, sec;
    for(i = 0; i < toks.length; i++){ m = /^(\d*\.?\d+)(ms|s)$/.exec(toks[i]); if(m){ sec = m[2] === "ms" ? +m[1] / 1000 : +m[1]; toks[i] = "calc(" + num(sec) + "s * var(--a-dur,1))"; break; } }
    return toks.join(" ");
  }
  function setItem(it, b){
    var v = it.orig;
    if(it.kind === "z"){ v = v.replace(/scale\(\s*(-?[\d.]+)\s*\)/g, function(a, n){ return "scale(calc(1 + (" + n + " - 1) * var(--a-zoom,1)))"; }); }
    else if(it.kind === "p"){ v = v.replace(/scale\(\s*(-?[\d.]+)\s*\)/g, function(a, n){ return "scale(calc(1 + (" + n + " - 1) * var(--a-press,1)))"; }); }
    else { if(it.bez) v = bez(v, b); if(it.time) v = splitTop(v).map(wrapSeg).join(", "); }
    try{ it.st.setProperty(it.prop, v, it.pri); }catch(e){}
  }
  function visit(rule){
    var t = rule.type;
    if(t === 1){
      var st = rule.style, sel = rule.selectorText || "", v;
      PROPS.forEach(function(p){
        v = st.getPropertyValue(p); if(!v) return; v = v.trim();
        var time = /(?:^|[\s,])(\d*\.?\d+)(ms|s)(?![\w-])/.test(v) && p.indexOf("timing") < 0 && p !== "--ez2";
        var b = hasOver(v);
        if(time || b) items.push({st:st, prop:p, orig:v, pri:st.getPropertyPriority(p), time:time, bez:b});
      });
      v = st.getPropertyValue("transform");
      if(v && /scale\(\s*-?[\d.]+\s*\)/.test(v)){
        if(/:active/.test(sel)) items.push({st:st, prop:"transform", orig:v.trim(), pri:st.getPropertyPriority("transform"), kind:"p"});
        else if(/:hover/.test(sel)) items.push({st:st, prop:"transform", orig:v.trim(), pri:st.getPropertyPriority("transform"), kind:"z"});
      }
    } else if(t !== 7 && t !== 8 && rule.cssRules){
      Array.prototype.forEach.call(rule.cssRules, visit);      // @media, @supports ...
    }
  }
  Array.prototype.forEach.call(document.styleSheets, function(sh){
    var rules; try{ rules = sh.cssRules; }catch(e){ return; }   // cross-site sheets can't be read
    if(rules) Array.prototype.forEach.call(rules, visit);
  });

  /* ---------- 2. apply the current settings ---------- */
  function apply(first){
    var b = S.bounce / 100;
    root.style.setProperty("--a-dur", num(100 / S.speed));
    root.style.setProperty("--a-zoom", num(S.zoom / 100));
    root.style.setProperty("--a-press", num(S.press / 100));
    root.style.setProperty("--a-bounce", num(S.bounce / 100));
    root.style.setProperty("--a-open", (S.open == null ? 0 : S.open) + "ms");
    root.style.setProperty("--a-close", (S.close == null ? 0 : S.close) + "ms");
    root.classList.toggle("a-open", S.open != null);
    root.classList.toggle("a-close", S.close != null);
    root.classList.toggle("anim-off", !!S.off);
    if(S.style && S.style !== "mixed") root.setAttribute("data-anim", S.style); else root.removeAttribute("data-anim");
    items.forEach(function(it){ if(first || it.bez) setItem(it, b); });
  }

  /* the app hides things with a timer that matches the close animation: keep the two in step */
  function scaleMs(ms){ if(S.off) return 1; if(S.close != null) return S.close + 15; return Math.round(ms * 100 / S.speed); }
  ["setShown","setPop","setModal","setStg"].forEach(function(n){
    var f = window[n]; if(typeof f !== "function") return;
    window[n] = function(){
      var real = window.setTimeout;
      window.setTimeout = function(fn, ms){ var a = Array.prototype.slice.call(arguments, 2); return real.apply(window, [fn, scaleMs(+ms || 0)].concat(a)); };
      try{ return f.apply(this, arguments); } finally { window.setTimeout = real; }
    };
  });

  /* ---------- 3. the tab ---------- */
  var ROWS = [
    {k:"speed",  t:"Animation speed",       min:25, max:300,  step:5,  unit:"%",  def:100, hint:"Higher is faster. Affects hovers, pop-ins and most transitions."},
    {k:"bounce", t:"Bounciness",            min:0,  max:300,  step:10, unit:"%",  def:100, hint:"0% is smooth with no overshoot. Higher gives a springier pop."},
    {k:"zoom",   t:"Hover zoom",            min:0,  max:300,  step:10, unit:"%",  def:100, hint:"How much buttons, tabs, emoji and pictures grow when you point at them. 0% turns it off."},
    {k:"press",  t:"Click squish",          min:0,  max:300,  step:10, unit:"%",  def:100, hint:"How much things shrink while you press them."},
    {k:"open",   t:"Open duration",         min:0,  max:1000, step:10, unit:" ms", def:200, hint:"Panels, pop-ups, dialogs and the Settings screen. Not set means the original timing."},
    {k:"close",  t:"Close duration",        min:0,  max:1000, step:10, unit:" ms", def:170, hint:"How long panels and dialogs take to disappear."}
  ];
  var card = document.createElement("div"); card.className = "stg-card"; card.id = "stg-anim";
  var h = '<h3>\uD83C\uDF9E\uFE0F Animation Lab</h3>' +
    '<div class="xnote">Tune how the app moves. You see changes right away. Save changes keeps them, Cancel undoes them.</div>' +
    '<label for="al-style">Animation style</label>' +
    '<select id="al-style"><option value="mixed">Original (One UI + Dock mix)</option><option value="macos">macOS</option><option value="pixel">Google Pixel</option><option value="oneui">One UI</option></select>' +
    '<div class="xnote">macOS: smooth and calm, with the Dock zoom on icon rows. Google Pixel: Material 3 emphasized motion, sheets rise from the bottom. One UI: bouncy springs. The sliders below fine-tune whichever you pick.</div>' +
    '<label class="chk"><input type="checkbox" id="al-off">Turn all animations off</label>';
  ROWS.forEach(function(r){
    h += '<div class="al-row"><div class="al-head"><span>' + r.t + '</span><output id="alo-' + r.k + '"></output></div>' +
      '<input type="range" id="al-' + r.k + '" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" value="' + r.def + '">' +
      '<div class="xnote">' + r.hint + '</div></div>';
  });
  h += '<div class="al-demo"><h4>Try it</h4>' +
    '<div class="al-chips"><button type="button" class="al-chip">\uD83D\uDE00</button><button type="button" class="al-chip">\uD83D\uDD25</button><button type="button" class="al-chip">\uD83C\uDF89</button><button type="button" class="al-chip">\uD83D\uDC4D</button></div>' +
    '<button type="button" class="btn alt" id="al-play">\u25B6 Play open / close</button>' +
    '<div id="al-pop" class="anim-pop" style="display:none">\uD83C\uDF88 Pop!</div></div>' +
    '<button type="button" class="btn alt" id="al-reset">Reset to original</button>';
  card.innerHTML = h;
  scroll.appendChild(card);

  function sync(){
    $("al-off").checked = !!S.off; $("al-style").value = S.style || "mixed";
    ROWS.forEach(function(r){
      var v = S[r.k], el = $("al-" + r.k), o = $("alo-" + r.k);
      el.value = v == null ? r.def : v;
      o.textContent = v == null ? (r.k === "open" || r.k === "close" ? "original" : r.def + r.unit) : v + r.unit;
    });
  }
  ROWS.forEach(function(r){
    $("al-" + r.k).addEventListener("input", function(e){ S[r.k] = +e.target.value; $("alo-" + r.k).textContent = S[r.k] + r.unit; apply(false); });
  });
  $("al-off").addEventListener("change", function(e){ S.off = e.target.checked; apply(false); });
  $("al-style").addEventListener("change", function(e){ S.style = e.target.value; apply(false); });
  $("al-reset").onclick = function(){ S = clean(null); apply(false); sync(); };
  $("al-play").onclick = function(){
    var p = $("al-pop"), shown = p.style.display !== "none" && !p.classList.contains("closing");
    if(typeof setShown === "function") setShown(p, !shown, "block"); else p.style.display = shown ? "none" : "block";
  };

  /* ---------- 4. Save keeps it, Cancel / closing puts it back ---------- */
  var snap = clean(S), saved = false, wasOpen = false;
  function persist(){ try{ if(JSON.stringify(S) === JSON.stringify(DEF)) localStorage.removeItem(KEY); else localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
  new MutationObserver(function(){
    var open = stg.classList.contains("open") && !stg.classList.contains("closing");
    if(open && !wasOpen){ snap = clean(S); saved = false; sync(); }
    else if(!open && wasOpen){ if(!saved){ S = clean(snap); apply(false); } sync(); }
    wasOpen = open;
  }).observe(stg, {attributes:true, attributeFilter:["class"]});
  var prev = saveBtn.onclick;
  saveBtn.onclick = function(){ if(stg.classList.contains("open")){ saved = true; persist(); } return prev ? prev.apply(this, arguments) : undefined; };

  apply(true); sync();
})();
