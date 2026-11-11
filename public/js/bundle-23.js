/* ===== 67-main.js ===== */
(function(){
  var B=document.body, CH=document.getElementById("chtabs"); if(!CH) return;
  var CK="pb_tt_collapsed", collapsed=[];
  try{ collapsed=JSON.parse(localStorage.getItem(CK)||"[]"); if(!Array.isArray(collapsed)) collapsed=[]; }catch(e){ collapsed=[]; }
  function saveCollapsed(){ try{ localStorage.setItem(CK,JSON.stringify(collapsed)); }catch(e){} }
  function active(){ return B.dataset.theme==="gdocs"&&B.dataset.hp==="left"; }
  function ttGet(){ try{ return (window.__pbTT&&window.__pbTT.get())||null; }catch(e){ return null; } }
  function homeEl(){ var h=CH.querySelector('button[data-ch="home"]'); return (h&&!h.hidden&&h.style.display!=="none")?h:null; }
  function allB(){ var a=btns(), h=homeEl(); if(h) a.push(h); return a; }
  function btns(){ return [].slice.call(CH.querySelectorAll("button[data-ch]")).filter(function(b){ return b.dataset.ch&&b.dataset.ch!=="home"&&!b.hidden&&b.style.display!=="none"&&!b.classList.contains("ct-plus"); }); }

  /* the tree: keys in order + a parent for each nested tab -> a flat, depth-annotated list */
  function flatten(keys,o,p){
    var kids={}, roots=[], flat=[], depth={}, seen={};
    o.forEach(function(k){ if(p[k]) (kids[p[k]]=kids[p[k]]||[]).push(k); else roots.push(k); });
    function walk(list,d){ list.forEach(function(k){ if(seen[k]) return; seen[k]=1; depth[k]=d; flat.push(k); if(kids[k]) walk(kids[k],d+1); }); }
    depth["home"]=0; seen["home"]=1; if(kids["home"]) walk(kids["home"],1);      // tabs inside the Homepage tab come right after it
    walk(roots,0);
    o.forEach(function(k){ if(!seen[k]){ seen[k]=1; depth[k]=0; delete p[k]; flat.push(k); } });
    return {flat:flat,depth:depth,kids:kids,p:p};
  }
  function model(){
    var keys=btns().map(function(b){ return b.dataset.ch; }), tt=ttGet()||{o:[],p:{}};
    var o=(tt.o||[]).filter(function(k){ return keys.indexOf(k)>-1; });
    keys.forEach(function(k){ if(o.indexOf(k)<0) o.push(k); });
    var p={}; Object.keys(tt.p||{}).forEach(function(k){ var v=tt.p[k]; if(keys.indexOf(k)>-1&&(keys.indexOf(v)>-1||(v==="home"&&homeEl()))) p[k]=v; });
    var m=flatten(keys,o,p); m.o=m.flat.slice(); return m;
  }
  function subtree(m,k){ var out={}; (function w(x){ (m.kids[x]||[]).forEach(function(c){ out[c]=1; w(c); }); })(k); return out; }
  function height(m,k){ var h=0; (m.kids[k]||[]).forEach(function(c){ h=Math.max(h,1+height(m,c)); }); return h; }

  function clearBtn(b){
    b.classList.remove("gd-sub","gd-subhide","gd-parent","gd-collapsed");
    b.style.removeProperty("--gd-d"); b.style.removeProperty("order"); if(b.dataset.ch==="home") b.style.setProperty("order","-1");
    var c=b.querySelector(".gd-chev"); if(c) c.remove();
  }
  var lastSig="", lastAct=null;
  function render(){
    var bs=btns();
    if(!active()){ if(lastSig!=="off"){ [].slice.call(CH.querySelectorAll("button[data-ch]")).forEach(clearBtn); lastSig="off"; lastAct=null; try{ if(window.__pbBuildTabs) window.__pbBuildTabs(); }catch(e){} } return; }
    var m=model(), els={}; bs.forEach(function(b){ els[b.dataset.ch]=b; });
    var act=null; bs.forEach(function(b){ if(b.classList.contains("on")) act=b.dataset.ch; });
    if(act!==lastAct){ lastAct=act; var chg=false; for(var a=act; a&&m.p[a]; a=m.p[a]){ var ci=collapsed.indexOf(m.p[a]); if(ci>-1){ collapsed.splice(ci,1); chg=true; } } if(chg) saveCollapsed(); }   // going to a nested tab opens its parents once; after that the arrow can collapse them
    var forced={};
    m.flat.forEach(function(k,i){
      var b=els[k]; if(!b) return;
      var d=m.depth[k], kidsN=(m.kids[k]||[]).length, isCol=collapsed.indexOf(k)>-1&&!forced[k], hide=false;
      for(var q=m.p[k]; q; q=m.p[q]){ if(collapsed.indexOf(q)>-1&&!forced[q]) hide=true; }
      if(b.style.order!==String(i+1)) b.style.setProperty("order",String(i+1));
      if(b.style.getPropertyValue("--gd-d")!==String(d)) b.style.setProperty("--gd-d",String(d));
      b.classList.toggle("gd-sub",d>0); b.classList.toggle("gd-subhide",hide);
      b.classList.toggle("gd-parent",kidsN>0); b.classList.toggle("gd-collapsed",kidsN>0&&isCol);
      var c=b.querySelector(".gd-chev");
      if(kidsN>0&&!c){ c=document.createElement("span"); c.className="gd-chev"; c.setAttribute("aria-hidden","true"); b.appendChild(c); }
      else if(!kidsN&&c) c.remove();
      var tip="Drag to move this tab, or drop it on another tab to put it inside. Changes for everyone.";
      if(b.title!==tip) b.title=tip;
    });
    var hb=homeEl();
    if(hb){
      var hn=(m.kids["home"]||[]).length;
      hb.classList.toggle("gd-parent",hn>0); hb.classList.toggle("gd-collapsed",hn>0&&collapsed.indexOf("home")>-1);
      var hc=hb.querySelector(".gd-chev");
      if(hn>0&&!hc){ hc=document.createElement("span"); hc.className="gd-chev"; hc.setAttribute("aria-hidden","true"); hb.appendChild(hc); }
      else if(!hn&&hc) hc.remove();
    }
    lastSig="on";
  }
  try{ new MutationObserver(function(){ render(); }).observe(CH,{childList:true}); }catch(e){}
  try{ new MutationObserver(function(){ render(); }).observe(B,{attributes:true,attributeFilter:["data-theme","data-hp"]}); }catch(e){}
  setInterval(function(){ if(!document.hidden) render(); },700);
  render();

  /* expand / collapse (just for you) */
  window.addEventListener("click",function(e){
    var c=e.target.closest&&e.target.closest("#chtabs .gd-chev"); if(c&&active()){
      e.stopPropagation(); e.preventDefault();
      var k=c.parentNode.dataset.ch, i=collapsed.indexOf(k); if(i>-1) collapsed.splice(i,1); else collapsed.push(k);
      saveCollapsed(); render(); return;
    }
    if(Date.now()<noClick&&e.target.closest&&e.target.closest("#chtabs button")){ e.stopImmediatePropagation(); e.preventDefault(); }
  },true);

  /* toast with Undo */
  var toast=document.createElement("div"); toast.id="gd-tt-toast"; toast.innerHTML='<span></span><button type="button">Undo</button>'; document.body.appendChild(toast);
  var toastT=0, undoTo=null;
  function say(msg,undo){
    toast.firstChild.textContent=msg; undoTo=undo||null; toast.lastChild.style.display=undo?"":"none"; toast.classList.add("on");
    clearTimeout(toastT); toastT=setTimeout(function(){ toast.classList.remove("on"); },6500);
  }
  toast.lastChild.onclick=function(){ if(!undoTo) return; var u=undoTo; undoTo=null; toast.classList.remove("on"); try{ window.__pbTT.set(u); }catch(e){} render(); };
  function label(b){
    try{ var c=getComputedStyle(b,"::after").content; if(c&&c!=="none"&&c!=="normal"&&c!=='""') return c.replace(/^["']|["']$/g,""); }catch(e){}
    var t=(b.textContent||"").trim(), mm=/^(\S+)\s+(.+)$/.exec(t); return mm&&!/^[A-Za-z0-9]/.test(mm[1])?mm[2]:(t||b.dataset.ch);
  }

  /* dragging: mouse = drag; touch = press and hold, then drag */
  var drag=null, noClick=0;
  function clearMarks(){ [].slice.call(CH.querySelectorAll(".gd-dz-before,.gd-dz-after,.gd-dz-into")).forEach(function(x){ x.classList.remove("gd-dz-before","gd-dz-after","gd-dz-into"); }); }
  function begin(){ if(!drag||drag.on) return; drag.on=true; drag.el.classList.add("gd-dragging"); B.classList.add("tab-dragging"); try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){} }
  function fits(m,D,depthNew){ return depthNew+height(m,D)<=3; }
  function calc(e){
    var m=model(), sub=subtree(m,drag.key), vis=allB().filter(function(b){ return b!==drag.el&&!b.classList.contains("gd-subhide")&&!sub[b.dataset.ch]; }), hm=homeEl();
    if(!vis.length) return null;
    vis.sort(function(a,b){ return a.getBoundingClientRect().top-b.getBoundingClientRect().top; });
    var y=e.clientY, first=vis[0].getBoundingClientRect(), last=vis[vis.length-1].getBoundingClientRect(), tgt=null, hit=null;
    var rootsOnly=vis.filter(function(b){ return b!==hm; });
    if(y<first.top){ return rootsOnly.length?{z:"start",el:rootsOnly[0],m:m}:null; }
    if(y>=last.bottom){ if(vis[vis.length-1]===hm){ return fits(m,drag.key,1)?{z:"into",key:"home",el:hm,m:m,sub:sub}:null; } return {z:"end",el:vis[vis.length-1],m:m}; }
    vis.forEach(function(b){ var r=b.getBoundingClientRect(); if(y>=r.top&&y<r.bottom) hit={b:b,r:r}; });
    if(!hit) return null;
    if(hit.b===hm){ return fits(m,drag.key,1)?{z:"into",key:"home",el:hm,m:m,sub:sub}:null; }
    var k=hit.b.dataset.ch, f=(y-hit.r.top)/hit.r.height, z=f<.28?"before":f>.72?"after":"into";
    if(z==="into"&&!fits(m,drag.key,m.depth[k]+1)) z=f<.5?"before":"after";
    if(!fits(m,drag.key,z==="into"?m.depth[k]+1:m.depth[k])) return null;
    return {z:z,key:k,el:hit.b,m:m,sub:sub};
  }
  function lastVisibleDescendant(t){
    var m=t.m, i=m.flat.indexOf(t.key), out=null, depth=m.depth[t.key], els={};
    btns().forEach(function(b){ els[b.dataset.ch]=b; });
    for(var j=i+1;j<m.flat.length&&m.depth[m.flat[j]]>depth;j++){ var b=els[m.flat[j]]; if(b&&b!==drag.el&&!b.classList.contains("gd-subhide")) out=b; }
    return out;
  }
  function mark(e){
    clearMarks(); var t=calc(e); drag.tgt=t; if(!t) return;
    if(t.z==="start") t.el.classList.add("gd-dz-before");
    else if(t.z==="end") t.el.classList.add("gd-dz-after");
    else if(t.z==="after") (lastVisibleDescendant(t)||t.el).classList.add("gd-dz-after");
    else t.el.classList.add("gd-dz-"+t.z);
  }
  function commitMove(D,t){
    var m=t.m, p={}; Object.keys(m.p).forEach(function(k){ p[k]=m.p[k]; });
    var o=m.flat.slice(), at=o.indexOf(D); if(at>-1) o.splice(at,1);
    var T=t.key;
    if(t.z==="into"){
      p[D]=T; var li=o.indexOf(T); o.forEach(function(k,i){ if(p[k]===T&&k!==D) li=Math.max(li,i); }); o.splice(li+1,0,D);
      var ci=collapsed.indexOf(T); if(ci>-1){ collapsed.splice(ci,1); saveCollapsed(); }
    }else if(t.z==="before"){ if(p[T]) p[D]=p[T]; else delete p[D]; o.splice(o.indexOf(T),0,D); }
    else if(t.z==="after"){ if(p[T]) p[D]=p[T]; else delete p[D]; o.splice(o.indexOf(T)+1,0,D); }
    else if(t.z==="end"){ delete p[D]; o.push(D); }
    else{ delete p[D]; var fr=null; o.forEach(function(k){ if(fr===null&&!p[k]) fr=k; }); if(fr===null) o.push(D); else o.splice(o.indexOf(fr),0,D); }
    var f=flatten(m.flat,o,p), np={}; Object.keys(f.p).forEach(function(k){ np[k]=f.p[k]; });
    var next={o:f.flat,p:np}, prev=ttGet(), same=JSON.stringify(next)===JSON.stringify({o:m.flat,p:m.p});
    if(same) return;
    var els={}; allB().forEach(function(b){ els[b.dataset.ch]=b; });
    try{ window.__pbTT.set(next); }catch(e){ return; }
    render();
    var name=els[D]?label(els[D]):D, msg;
    if(t.z==="into") msg="Moved \u201C"+name+"\u201D into \u201C"+(els[T]?label(els[T]):T)+"\u201D for everyone";
    else if(p[D]) msg="Moved \u201C"+name+"\u201D inside \u201C"+(els[p[D]]?label(els[p[D]]):p[D])+"\u201D for everyone";
    else msg="Moved \u201C"+name+"\u201D to the top level for everyone";
    say(msg,prev);
  }
  function finish(e,doIt){
    if(!drag) return; var d=drag; drag=null; clearTimeout(d.timer);
    if(!d.on) return;
    d.el.classList.remove("gd-dragging"); d.el.style.removeProperty("transform"); B.classList.remove("tab-dragging"); clearMarks();
    noClick=Date.now()+350;
    if(!doIt) return;
    drag=d; var t=calc(e); drag=null;
    if(t) commitMove(d.key,t);
  }
  window.addEventListener("pointerdown",function(e){
    if(!active()||e.button>0||drag) return;
    var tg=e.target; if(!tg||!tg.closest||tg.closest(".gd-chev")) return;
    var b=tg.closest("#chtabs button[data-ch]"); if(!b||btns().indexOf(b)<0) return;
    drag={el:b,key:b.dataset.ch,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,touch:e.pointerType==="touch"||e.pointerType==="pen",timer:0,tgt:null};
    if(drag.touch) drag.timer=setTimeout(begin,380);
  },true);
  window.addEventListener("pointermove",function(e){
    if(!drag||e.pointerId!==drag.id) return;
    var dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    if(!drag.on){
      if(drag.touch){ if(Math.hypot(dx,dy)>10){ clearTimeout(drag.timer); drag=null; } return; }
      if(Math.hypot(dx,dy)<7) return; begin();
    }
    drag.el.style.setProperty("transform","translateY("+dy+"px)","important"); mark(e);
  },true);
  window.addEventListener("pointerup",function(e){ if(drag&&e.pointerId===drag.id) finish(e,true); },true);
  window.addEventListener("pointercancel",function(e){ if(drag&&e.pointerId===drag.id) finish(e,false); },true);
  document.addEventListener("touchmove",function(e){ if(drag&&drag.on&&e.cancelable) e.preventDefault(); },{passive:false});
  document.addEventListener("contextmenu",function(e){ if(drag&&drag.on) e.preventDefault(); },true);
  window.addEventListener("keydown",function(e){ if(e.key==="Escape"&&drag&&drag.on){ finish(e,false); } },true);

  /* settings: a way back to the normal tab order for everyone */
  var sb=document.querySelector(".stg-sb");
  if(sb){
    var rb=document.createElement("button"); rb.type="button"; rb.className="stg-btn"; rb.textContent="\u21D5 Reset subtabs for everyone";
    rb.title="Take every tab out of the tab it's inside and put them back in the normal order, for everyone";
    rb.onclick=function(){
      if(!ttGet()){ say("No tabs are nested right now",null); return; }
      if(!confirm("Take every tab out of the tab it is inside, for everyone?")) return;
      var prev=ttGet(); try{ window.__pbTT.set(null); }catch(e){} render(); say("Subtabs reset for everyone",prev);
    };
    var t0=document.getElementById("stg-toggle"); if(t0&&t0.parentNode===sb) sb.insertBefore(rb,t0); else sb.appendChild(rb);
  }
})();

;
/* ===== 68-layout-js.js ===== */
(function(){
  var sel = document.getElementById("layoutsel"), th = document.getElementById("theme"); if(!sel || !th) return;
  var lab = th.previousElementSibling && th.previousElementSibling.tagName === "LABEL" ? th.previousElementSibling : null;
  function show(){
    var lp = pbLayout() === "lp";
    sel.value = lp ? "lp" : "docs";
    if(lab) lab.textContent = lp ? "Theme (Los Purebreds layout)" : "Color theme (Google Docs layout)";
    Array.prototype.forEach.call(th.options, function(o){
      if(o.value === "gdocs"){ o.textContent = lp ? "Google Docs" : "Google Docs (default colors)"; o.disabled = lp; o.hidden = lp; }
    });
  }
  sel.addEventListener("change", function(){
    var was = pbSkin() || document.body.dataset.theme || "gdocs";       // the look you have right now
    try{ localStorage.setItem("pb_layout", sel.value === "lp" ? "lp" : "docs"); }catch(e){}
    try{ setTheme(was); }catch(e){}                                     // docs: it becomes the colour skin; LP: it becomes the theme (Docs itself -> your last / iMessage)
    try{ var cur = pbSkin() || document.body.dataset.theme; if(typeof draft !== "undefined" && draft) draft.theme = cur; th.value = cur; }catch(e){}
    show();
  });
  show();
})();

;
/* ===== 69-gal-size-js.js ===== */
(function(){
  var B = document.body, rng = document.getElementById("galrng"), px = document.getElementById("galpx"), sq = document.getElementById("galsq"), bar = document.getElementById("galsz");
  if(!rng || !bar) return;
  var MIN = 80, MAX = 640, DEF = 300, st = { w: DEF, sq: false };
  try{ var j = JSON.parse(localStorage.getItem("pb_gal_size") || "null"); if(j && +j.w >= MIN && +j.w <= MAX){ st.w = Math.round(+j.w / 10) * 10; st.sq = !!j.sq; } }catch(e){}
  function paint(){
    B.style.setProperty("--galw", st.w + "px"); B.classList.toggle("gal-sq", st.sq);
    rng.value = st.w; px.textContent = st.w + "px"; sq.classList.toggle("on", st.sq); sq.setAttribute("aria-pressed", st.sq ? "true" : "false");
    Array.prototype.forEach.call(bar.querySelectorAll("button[data-w]"), function(b){ b.classList.toggle("on", +b.dataset.w === st.w); });
  }
  function set(w, keep){ st.w = Math.max(MIN, Math.min(MAX, Math.round(w / 10) * 10)); paint(); if(!keep) try{ localStorage.setItem("pb_gal_size", JSON.stringify(st)); }catch(e){} }
  function save(){ try{ localStorage.setItem("pb_gal_size", JSON.stringify(st)); }catch(e){} }
  rng.addEventListener("input", function(){ set(+rng.value); });
  bar.addEventListener("click", function(e){
    var b = e.target.closest("button"); if(!b) return;
    if(b.dataset.w) set(+b.dataset.w);
    else if(b.id === "galsq"){ st.sq = !st.sq; paint(); save(); }
    else if(b.id === "galrs"){ st.w = DEF; st.sq = false; paint(); save(); }
  });
  var box = document.getElementById("box");
  if(box){
    /* Ctrl / ⌘ + mouse wheel over the gallery */
    box.addEventListener("wheel", function(e){ if(!B.classList.contains("in-gal") || !(e.ctrlKey || e.metaKey)) return; e.preventDefault(); set(st.w * (e.deltaY < 0 ? 1.12 : 1 / 1.12)); }, { passive: false });
    /* two-finger pinch on a touch screen */
    var d0 = 0, w0 = 0, dist = function(t){ return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); };
    box.addEventListener("touchstart", function(e){ if(B.classList.contains("in-gal") && e.touches.length === 2){ d0 = dist(e.touches); w0 = st.w; } }, { passive: true });
    box.addEventListener("touchmove", function(e){ if(d0 && e.touches.length === 2 && B.classList.contains("in-gal")){ e.preventDefault(); set(w0 * dist(e.touches) / d0, true); } }, { passive: false });
    box.addEventListener("touchend", function(e){ if(d0 && e.touches.length < 2){ d0 = 0; save(); } });
  }
  paint();
})();
