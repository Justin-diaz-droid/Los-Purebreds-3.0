/* ===== 61-main.js ===== */
/* Secret: Ctrl+M toggles the Juan theme (remembered on this device) */
(function(){
  var KEY="pb_juan", B=document.body, toast=document.getElementById("juan-toast"), tt;
  var oldTitle=document.title;
  function stored(){ try{ return localStorage.getItem(KEY)==="1"; }catch(e){ return false; } }
  function say(t){ toast.lastChild.textContent=t; toast.classList.add("show"); clearTimeout(tt); tt=setTimeout(function(){ toast.classList.remove("show"); },2200); }
  function apply(on,announce){
    B.classList.toggle("juan-on",on);
    document.title=on?"Juan Purebreds 🤙":oldTitle;
    var fv=document.getElementById("fav"); if(fv){ if(!fv.dataset.orig) fv.dataset.orig=fv.getAttribute("href"); fv.setAttribute("href",on?"assets/juan/juan_fav.png":fv.dataset.orig); }
    try{ localStorage.setItem(KEY,on?"1":"0"); }catch(e){}
    if(announce) say(on?"Juan mode ON 🤙":"Juan mode off");
  }
  document.addEventListener("keydown",function(e){
    if(e.ctrlKey&&!e.altKey&&!e.shiftKey&&!e.metaKey&&(e.key==="m"||e.key==="M")){
      e.preventDefault(); e.stopPropagation();
      if(e.repeat) return;
      apply(!B.classList.contains("juan-on"),true);
    }
  },true);
  if(stored()) apply(true,false);
})();

/* smash the apple */
(function(){
  var el=document.getElementById("juan-apple"), dur=el.querySelector(".dur"), busy=false;
  var snd=new Audio("assets/juan/splat.mp3"); snd.preload="auto";
  function splat(){ try{ snd.currentTime=0; var p=snd.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){} }
  function smash(e){
    e.preventDefault(); e.stopPropagation();
    if(busy) return; busy=true;
    el.classList.add("smashing");
    setTimeout(function(){
      el.classList.add("smashed"); splat();
      dur.classList.remove("go"); void dur.offsetWidth; dur.classList.add("go");
    },230);
    setTimeout(function(){
      el.classList.remove("smashing","smashed"); el.classList.add("respawn");
      setTimeout(function(){ el.classList.remove("respawn"); busy=false; },520);
    },2300);
  }
  el.addEventListener("click",smash);
})();
