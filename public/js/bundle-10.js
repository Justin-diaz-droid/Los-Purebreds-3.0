/* ===== 35-responsive-fix-js.js ===== */
(function(){
  var tabs = document.getElementById("chtabs"), hdr = document.getElementById("hdr"), root = document.documentElement;
  if(!tabs) return;
  var raf = 0;

  /* put everything after the emoji in <span class="tl"> so CSS can hide the words (and keep a tooltip) */
  function wrap(b){
    if(!b || b.nodeType !== 1 || b.tagName !== "BUTTON") return;
    var hasImg = !!b.querySelector(".tabimg"), label = "";
    Array.prototype.slice.call(b.childNodes).forEach(function(n){
      if(n.nodeType === 1){ if(n.classList.contains("tl")) label += n.textContent; return; }
      if(n.nodeType !== 3 || !n.data.trim()) return;
      var s;
      if(hasImg){ s = document.createElement("span"); s.className = "tl"; s.textContent = n.data; b.replaceChild(s, n); label += n.data; return; }
      var m = n.data.match(/^(\s*(?![A-Za-z0-9])\S+)(\s[\s\S]*)$/);
      if(m){ var ti = document.createElement("span"); ti.className = "ti"; ti.textContent = m[1].trim(); b.replaceChild(ti, n); s = document.createElement("span"); s.className = "tl"; s.textContent = m[2]; b.insertBefore(s, ti.nextSibling); label += m[2]; }
      else if(n.data.trim() && b.dataset.ch){ s = document.createElement("span"); s.className = "tl"; s.textContent = n.data; b.replaceChild(s, n); label += n.data; }
    });
    label = label.trim();
    if(label){ if(b.title !== label) b.title = label; b.setAttribute("aria-label", label); }
  }
  function wrapAll(){ Array.prototype.forEach.call(tabs.querySelectorAll("button"), wrap); }

  /* labels on -> do they fit? no -> emoji only */
  function fit(){
    raf = 0;
    root.classList.remove("tabs-ico");   // names always stay visible; if they don't fit the bar scrolls sideways instead of dropping them
    fade();
  }
  /* soft edges show there are more tabs to scroll to */
  function fade(){
    var more = tabs.scrollWidth > tabs.clientWidth + 1;
    tabs.classList.toggle("fade-l", more && tabs.scrollLeft > 2);
    tabs.classList.toggle("fade-r", more && tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2);
  }
  tabs.addEventListener("scroll", fade, {passive:true});
  tabs.addEventListener("wheel", function(e){          // mouse wheel scrolls the tab bar sideways
    if(tabs.scrollWidth > tabs.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)){ tabs.scrollLeft += e.deltaY; e.preventDefault(); }
  }, {passive:false});
  new MutationObserver(function(){                       // keep the open tab in view
    var b = tabs.querySelector("button.on"); if(!b) return;
    var l = b.offsetLeft - tabs.offsetLeft, r = l + b.offsetWidth;
    if(l < tabs.scrollLeft) tabs.scrollLeft = Math.max(0, l - 24);
    else if(r > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = r - tabs.clientWidth + 24;
  }).observe(tabs, {attributes:true, attributeFilter:["class"], subtree:true});
  function sched(){ if(!raf) raf = requestAnimationFrame(fit); }

  new MutationObserver(function(){ wrapAll(); sched(); }).observe(tabs, {childList:true, subtree:true, characterData:true});
  if(window.ResizeObserver){ var ro = new ResizeObserver(sched); ro.observe(hdr || tabs); ro.observe(document.body); }
  addEventListener("resize", sched);
  addEventListener("orientationchange", function(){ setTimeout(sched, 150); });
  addEventListener("load", sched);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(sched);
  wrapAll(); fit();
})();
