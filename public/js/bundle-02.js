/* ===== 02-main.js ===== */
/* Nothing here blocks the first paint: PeerJS (voice/video calls only) and the Google fonts are fetched once the page has loaded.
   Chat itself runs over the WebSocket, and text just swaps to the web fonts when they arrive. */
(function(){
  var FONTS = [
    "https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap",
    "https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue&family=Dancing+Script&family=Lobster&family=Orbitron&family=Pacifico&family=Press+Start+2P&family=Roboto+Mono&display=swap",
    "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Poppins&family=Montserrat&family=Raleway&family=Nunito&family=Quicksand&family=Oswald&family=Caveat&display=swap",
    "https://fonts.googleapis.com/css2?family=Satisfy&family=Indie+Flower&family=Shadows+Into+Light&family=Patrick+Hand&family=Kalam&family=Gloria+Hallelujah&family=Rock+Salt&display=swap",
    "https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Chewy&family=Fredoka&family=Bubblegum+Sans&family=Anton&family=Bebas+Neue&family=Bungee&display=swap",
    "https://fonts.googleapis.com/css2?family=Righteous&family=Russo+One&family=Luckiest+Guy&family=Rubik+Mono+One&family=Audiowide&family=Monoton&family=Abril+Fatface&display=swap",
    "https://fonts.googleapis.com/css2?family=VT323&family=Silkscreen&family=Special+Elite&family=Creepster&family=Nosifer&family=Butcherman&family=Metal+Mania&display=swap",
    "https://fonts.googleapis.com/css2?family=Pirata+One&family=UnifrakturMaguntia&family=Playfair+Display&family=Cinzel&family=Lora&family=Merriweather&family=Fredericka+the+Great&display=swap",
        "https://fonts.googleapis.com/css2?family=Roboto+Flex&display=swap",
    "https://fonts.googleapis.com/css2?family=Google+Sans+Flex&display=swap",
    "https://fonts.googleapis.com/css2?family=Itim&display=swap",
    "https://fonts.googleapis.com/css2?family=Open+Sans&family=Lato&family=Inter&family=Source+Sans+3&family=Work+Sans&family=DM+Sans&family=Manrope&family=Lexend&family=Josefin+Sans&family=Ubuntu&family=Fira+Sans&family=Barlow&family=Cabin&family=Archivo&display=swap",
    "https://fonts.googleapis.com/css2?family=PT+Serif&family=EB+Garamond&family=Libre+Baskerville&family=Crimson+Text&family=Spectral&family=Cormorant+Garamond&family=Zilla+Slab&family=Alfa+Slab+One&family=Source+Code+Pro&family=Fira+Code&family=Space+Mono&family=Courier+Prime&display=swap",
    "https://fonts.googleapis.com/css2?family=Amatic+SC&family=Pangolin&family=Handlee&family=Gochi+Hand&family=Sacramento&family=Great+Vibes&family=Courgette&family=Cookie&display=swap"
  ];
  function go(){
    var sc = document.createElement("script"); sc.async = true; sc.src = "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js"; document.head.appendChild(sc);
    FONTS.forEach(function(h){ var l = document.createElement("link"); l.rel = "stylesheet"; l.href = h; document.head.appendChild(l); });
  }
  if(document.readyState === "complete") go(); else window.addEventListener("load", go);
})();

;
/* ===== 03-colormode-js.js ===== */
/* Light / Dark / Auto. The themes pick their light or dark look with "prefers-color-scheme" rules, so a forced mode
   switches those rules on or off, and answers JavaScript's matchMedia("(prefers-color-scheme: …)") the same way. */
(function(){
  "use strict";
  var KEY = "pb_colormode", mode = "auto", realMM = window.matchMedia ? window.matchMedia.bind(window) : null;
  try{ localStorage.removeItem(KEY); }catch(e){}   // the Light/Dark/Auto setting was removed: always follow the device
  var SIMPLE = /^\s*\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)\s*$/i, FEAT = /\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)/i;
  var fakes = [];
  function fire(){ fakes.forEach(function(o){ var ev = {matches:o.matches, media:o.media, type:"change"}; o._ls.slice().forEach(function(f){ try{ f.call(o, ev); }catch(e){} }); if(typeof o.onchange === "function"){ try{ o.onchange(ev); }catch(e){} } }); }
  if(realMM){
    var realDark = realMM("(prefers-color-scheme: dark)");
    var onOS = function(){ if(mode === "auto") fire(); };
    if(realDark.addEventListener) realDark.addEventListener("change", onOS); else if(realDark.addListener) realDark.addListener(onOS);
    window.matchMedia = function(q){
      var m = typeof q === "string" && SIMPLE.exec(q);
      if(!m) return realMM(q);
      var want = m[1].toLowerCase(), real = realMM(q);
      var o = { media:q, onchange:null, _ls:[],
        get matches(){ return mode === "auto" ? real.matches : mode === want; },
        addEventListener:function(t, f){ if(t === "change" && typeof f === "function") o._ls.push(f); },
        removeEventListener:function(t, f){ o._ls = o._ls.filter(function(x){ return x !== f; }); },
        addListener:function(f){ if(typeof f === "function") o._ls.push(f); },
        removeListener:function(f){ o._ls = o._ls.filter(function(x){ return x !== f; }); },
        dispatchEvent:function(){ return true; } };
      fakes.push(o); if(fakes.length > 200) fakes.shift();
      return o;
    };
  }
  /* rewrite the condition of one @media rule for the forced mode */
  function rewrite(t){
    var keep = [];
    t.split(",").forEach(function(p){
      var m = FEAT.exec(p);
      if(!m){ keep.push(p.trim()); return; }
      if(m[1].toLowerCase() === mode) keep.push(p.replace(m[0], "(min-width:0px)").trim());
    });
    return keep.length ? keep.join(", ") : "not all";
  }
  var orig = new WeakMap();
  function walk(rules){
    for(var i = 0; i < rules.length; i++){
      var r = rules[i];
      if(r.type === 4){
        var base = orig.get(r);
        if(base === undefined){ base = /prefers-color-scheme/i.test(r.media.mediaText) ? r.media.mediaText : null; orig.set(r, base); }
        if(base !== null){ var nt = mode === "auto" ? base : rewrite(base); if(r.media.mediaText !== nt){ try{ r.media.mediaText = nt; }catch(e){} } }
      }
      if(r.cssRules && r.cssRules.length) walk(r.cssRules);
    }
  }
  var busy = 0;
  function apply(){
    busy = 0;
    Array.prototype.forEach.call(document.styleSheets, function(sh){ var rules; try{ rules = sh.cssRules; }catch(e){ return; } if(rules) walk(rules); });
  }
  /* the live preview in Settings is its own little page, so give it the same treatment as text */
  function cssText(css){
    if(mode === "auto") return css;
    return css.replace(/@media([^{]*prefers-color-scheme[^{]*)\{/gi, function(all, pre){ return "@media " + rewrite(pre.trim()) + "{"; });
  }
  window.__pbCM = { css:cssText, mode:function(){ return mode; } };

  function init(){
    document.documentElement.setAttribute("data-colormode", mode);
    if(mode !== "auto") apply();
    /* styles added later (themes inject some) get the same treatment */
    new MutationObserver(function(list){
      if(mode === "auto" || busy) return;
      var hit = list.some(function(m){ if(m.target && m.target.nodeName === "STYLE") return true; for(var i = 0; i < m.addedNodes.length; i++){ var n = m.addedNodes[i]; if(n.nodeName === "STYLE") return true; } return false; });
      if(hit) busy = setTimeout(apply, 60);
    }).observe(document.documentElement, {childList:true, subtree:true});
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  window.addEventListener("load", function(){ if(mode !== "auto") apply(); });
})();
