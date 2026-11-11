/* ===== 37-sx-js.js ===== */
(function(){
  function boot(){
    var $ = function(i){ return document.getElementById(i); };
    var stg = $("stg"), wrap = stg && stg.querySelector(".stg-wrap"), ctl = wrap && wrap.querySelector(".stg-ctl");
    var top = ctl && ctl.querySelector(".stg-top"), scroll = ctl && ctl.querySelector(".stg-scroll");
    var err = $("stgerr"), foot = ctl && ctl.querySelector(".stg-foot"), prev = wrap && wrap.querySelector(".stg-prev");
    if(!(stg && wrap && ctl && top && scroll && err && foot && prev)) return;
    try{

      var PAGES = [
        {id:"profile",    t:"Profile",           ic:"\uD83D\uDC64",         bg:"#8e8e93", prev:true},
        {id:"messages",   t:"Messages",          ic:"\uD83D\uDCAC",         bg:"#34c759", prev:true},
        {id:"appearance", t:"Appearance & Layout", ic:"\uD83C\uDFA8",         bg:"#007aff", prev:true},
        {id:"access",     t:"Accessibility",     ic:"\u267F",              bg:"#0a84ff", prev:false},
        {id:"account",    t:"Account & Privacy", ic:"\uD83D\uDD12",         bg:"#636366", prev:false},
        {id:"anim",       t:"Animation Lab",     ic:"\uD83C\uDF9E\uFE0F",   bg:"#ff9f0a", prev:false},
        {id:"exp",        t:"Experimental",      ic:"\uD83E\uDDEA",         bg:"#af52de", prev:false}
      ], PMAP = {};
      PAGES.forEach(function(p){ PMAP[p.id] = p; });

      /* ---------- cards -> iOS grouped sections ---------- */
      function catOf(c){
        var h = c.querySelector("h3"), t = h ? h.textContent : "";
        if(c.id === "stg-cursor") return "appearance";   // appearance, layout and customization share one page
        if(c.id === "stg-anim") return "anim";
        if(c.id === "stg-exp") return "exp";
        if(c.dataset.pbcat) return c.dataset.pbcat;     // a card can name its own page (e.g. Frame rate lives in Appearance & Layout)
        if(c.dataset.a11y) return "access";
        if(/read receipts|password|role tag|custom tag|account/i.test(t)) return "account";
        if(/profile/i.test(t)) return "profile";
        if(/messages/i.test(t)) return "messages";
        if(/appearance/i.test(t)) return "appearance";
        if(/layout/i.test(t)) return "appearance";
        return "account";
      }
      function groupify(card){
        if(card.dataset.sx) return; card.dataset.sx = "1";
        var h3 = card.querySelector(":scope > h3");
        var kids = Array.prototype.slice.call(card.childNodes).filter(function(n){ return n !== h3 && !(n.nodeType === 3 && !n.data.trim()); });
        var g = document.createElement("div"); g.className = "sx-group";
        var row = null;
        kids.forEach(function(n){
          if(n.nodeType !== 1){ g.appendChild(n); row = null; return; }
          var isLabel = n.tagName === "LABEL";
          if(isLabel && n.querySelector("input[type=checkbox]")){ n.classList.add("sx-chk"); g.appendChild(n); row = null; return; }
          if(isLabel){ row = document.createElement("div"); row.className = "sx-fr"; row.appendChild(n); g.appendChild(row); return; }
          if(row && !n.classList.contains("stg-note") && !n.classList.contains("xnote")){ row.appendChild(n); return; }
          row = null; g.appendChild(n);
        });
        card.appendChild(g);
        if(h3) h3.textContent = h3.textContent.replace(/^[^\p{L}\p{N}]+/u, "").trim();
      }
      var page = "profile";
      function adopt(){
        Array.prototype.forEach.call(scroll.children, function(c){
          if(!c.classList || !c.classList.contains("stg-card") || c.dataset.cat) return;
          c.dataset.cat = catOf(c); groupify(c); c.classList.toggle("sx-off", c.dataset.cat !== page);
        });
      }
      function cards(){ return Array.prototype.slice.call(scroll.querySelectorAll(":scope > .stg-card")); }

      /* ---------- the list (sidebar on iPad, first page on phones) ---------- */
      var side = document.createElement("nav"); side.className = "sx-side"; side.setAttribute("aria-label", "Settings categories");
      var sw = document.createElement("div"); sw.className = "sx-search";
      sw.innerHTML = '<input type="search" placeholder="Search" autocomplete="off" aria-label="Search settings">';
      var search = sw.firstChild;
      var list = document.createElement("div"); list.className = "sx-list";
      side.appendChild(top); side.appendChild(sw); side.appendChild(list);

      var rows = [], groups = [];
      function mkRow(p){
        var b = document.createElement("button"); b.type = "button"; b.className = "sx-row"; b.dataset.p = p.id;
        b.innerHTML = '<span class="sx-ic" style="background:' + p.bg + '">' + p.ic + '</span><span class="sx-lb">' + p.t.replace(/&/g, "&amp;") + '</span><span class="sx-chev">\u203A</span>';
        b.onclick = function(){ go(p.id); }; rows.push(b); return b;
      }
      var me = document.createElement("button"); me.type = "button"; me.className = "sx-row sx-me"; me.dataset.p = "profile";
      me.innerHTML = '<span class="sx-av"></span><span class="sx-mt"><b class="sx-name"></b><small>Name, picture &amp; password</small></span><span class="sx-chev">\u203A</span>';
      me.onclick = function(){ go("profile"); }; rows.push(me);
      var av = me.querySelector(".sx-av"), nameEl = me.querySelector(".sx-name");
      function grp(items){ var g = document.createElement("div"); g.className = "sx-grp"; items.forEach(function(i){ g.appendChild(i); }); list.appendChild(g); groups.push({el:g, rows:items}); }
      grp([me]);
      grp([mkRow(PMAP.messages), mkRow(PMAP.appearance), mkRow(PMAP.access)]);
      grp([mkRow(PMAP.account)]);
      grp([mkRow(PMAP.anim), mkRow(PMAP.exp)]);
      var empty = document.createElement("div"); empty.className = "sx-empty"; empty.hidden = true; empty.textContent = "No results"; list.appendChild(empty);

      /* ---------- detail page ---------- */
      var detail = document.createElement("section"); detail.className = "sx-detail";
      var dhead = document.createElement("div"); dhead.className = "sx-dhead";
      dhead.innerHTML = '<button type="button" class="sx-back">\u2039 Settings</button><h2 class="sx-title"></h2><button type="button" class="sx-eye" title="Show or hide the preview" aria-label="Show or hide the preview">\uD83D\uDC41</button>';
      var titleEl = dhead.querySelector(".sx-title"), eye = dhead.querySelector(".sx-eye");
      detail.appendChild(dhead); detail.appendChild(scroll);

      wrap.textContent = "";
      wrap.appendChild(side); wrap.appendChild(detail); wrap.appendChild(prev); wrap.appendChild(err); wrap.appendChild(foot);
      adopt();
      new MutationObserver(adopt).observe(scroll, {childList:true});

      /* ---------- behaviour ---------- */
      var mqPad = window.matchMedia("(min-width:700px) and (min-height:500px)");
      var prevOff = false; try{ prevOff = localStorage.getItem("pb_sxprevoff") === "1"; }catch(e){}
      var animT = 0;
      function anim(k){ stg.dataset.anim = k; clearTimeout(animT); animT = setTimeout(function(){ delete stg.dataset.anim; }, 450); }
      function fixPrevScroll(){
        setTimeout(function(){ try{ var d = $("pvframe").contentDocument, b = d && d.getElementById("box"); if(b && b.scrollTop === 0) b.scrollTop = b.scrollHeight; }catch(e){} }, 80);
      }
      function syncPrev(){
        var hp = PMAP[page].prev;
        stg.dataset.pv = (hp && !prevOff) ? "1" : "0";
        eye.hidden = !hp; eye.classList.toggle("on", !prevOff);
        if(hp && !prevOff) fixPrevScroll();
      }
      function setPage(id){
        if(!PMAP[id]) id = "profile";
        page = id; stg.dataset.page = id;
        cards().forEach(function(c){ c.classList.toggle("sx-off", c.dataset.cat !== id); });
        rows.forEach(function(r){ r.classList.toggle("on", r.dataset.p === id); });
        titleEl.textContent = PMAP[id].t;
        scroll.scrollTop = 0;
        syncPrev();
      }
      function setView(v){ stg.dataset.view = v; }
      function go(id){
        setPage(id);
        if(mqPad.matches){ anim("fade"); }
        else { anim("push"); setView("detail"); }
      }
      dhead.querySelector(".sx-back").onclick = function(){ anim("pop"); setView("list"); };
      eye.onclick = function(){
        prevOff = !prevOff; try{ localStorage.setItem("pb_sxprevoff", prevOff ? "1" : "0"); }catch(e){}
        syncPrev(); if(!prevOff && typeof renderPreview === "function") renderPreview();
      };

      function pageText(id){ return cards().filter(function(c){ return c.dataset.cat === id; }).map(function(c){ return c.textContent; }).join(" ").toLowerCase(); }
      function filter(){
        var q = search.value.trim().toLowerCase(), any = false;
        groups.forEach(function(g){
          var vis = false;
          g.rows.forEach(function(r){
            var p = PMAP[r.dataset.p], hit = !q || (p.t + " " + pageText(p.id)).toLowerCase().indexOf(q) > -1;
            r.hidden = !hit; if(hit) vis = true;
          });
          g.el.hidden = !vis; if(vis) any = true;
        });
        empty.hidden = any;
      }
      search.addEventListener("input", filter);

      /* the avatar + name on the first row follow what you're editing */
      var pv = $("pfpprev"), hi = $("hi");
      function mirror(){
        if(pv){ av.style.background = pv.style.background || ""; av.textContent = pv.textContent; }
        nameEl.textContent = (hi && hi.value.trim()) || "You";
      }
      if(pv) new MutationObserver(mirror).observe(pv, {attributes:true, childList:true, characterData:true, subtree:true});
      if(hi) hi.addEventListener("input", mirror);

      /* every time Settings opens */
      var wasOpen = false;
      function opened(){
        search.value = ""; filter(); mirror();
        if(mqPad.matches){ setView("detail"); setPage(page); }
        else {
          setView("list"); setPage(page);
          var w = $("pvwrap"); if(w && !w.classList.contains("phone") && $("pvphone")) $("pvphone").click();   // phone-shaped preview on phones
        }
      }
      new MutationObserver(function(){
        var open = stg.classList.contains("open") && !stg.classList.contains("closing");
        if(open && !wasOpen) opened();
        wasOpen = open;
      }).observe(stg, {attributes:true, attributeFilter:["class"]});
      var mqChange = function(){ if(wasOpen) setView("detail"); };   // resizing keeps you on the page you were on
      if(mqPad.addEventListener) mqPad.addEventListener("change", mqChange); else if(mqPad.addListener) mqPad.addListener(mqChange);

      setView(mqPad.matches ? "detail" : "list"); setPage("profile");
      stg.classList.add("sx");
    }catch(e){
      console.error("settings layout failed, using the old layout", e);
      stg.classList.remove("sx");
    }
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
