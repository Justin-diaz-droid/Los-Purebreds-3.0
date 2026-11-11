/* ===== 60-hatspin-raf.js ===== */
(function(){
  var PERIOD=2400;                               // one full turn, matches the old CSS timing
  var running=false;
  function icons(){ try{ var host=document.getElementById("px-host"), root=host&&host.shadowRoot; return root?root.querySelectorAll(".hatspin"):[]; }catch(e){ return []; } }
  function tick(t){
    running=false;
    if(document.hidden) return;                  // nothing to animate in a background tab; the 600 ms check below wakes it again
    var list=icons();
    if(!list.length) return;                     // no hat icons on screen: stop the per-frame loop completely
    var ph=(t%PERIOD)/PERIOD, deg=ph*360, frontOn=ph<0.5;
    list.forEach(function(ic){
      ic.querySelectorAll(".cane-rot").forEach(function(g){ g.setAttribute("transform","rotate("+deg+")"); });
      var fr=ic.querySelector(".cane-front"), bk=ic.querySelector(".cane-back");
      if(fr) fr.style.opacity=frontOn?"1":"0";
      if(bk) bk.style.opacity=frontOn?"0":"1";
    });
    running=true; requestAnimationFrame(tick);
  }
  function wake(){ if(!running && !document.hidden && icons().length){ running=true; requestAnimationFrame(tick); } }
  setInterval(wake,600); wake();                 // cheap check twice a second instead of running a loop at 60 fps forever
})();
