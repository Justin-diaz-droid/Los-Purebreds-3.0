/* ===== 01-watch-dbg-js.js ===== */
(function(){
  try{
    var q=location.search||"", ua=navigator.userAgent||"";
    var on=/[?&]watch=1\b/.test(q)||/Watch/i.test(ua)||Math.min(screen.width||9999,window.innerWidth||9999)<=280;
    if(/[?&]watch=0\b/.test(q)) on=false;
    if(!on) return;
    var box=document.createElement("div");
    box.id="watch-dbg"; box.style.cssText="position:fixed;left:4px;right:4px;bottom:4px;z-index:99999;background:#400;color:#fff;border-radius:10px;padding:6px 8px;font:11px/1.25 monospace;display:none;word-break:break-word;max-height:45vh;overflow:auto";
    function show(t){ var h=document.body||document.documentElement; if(!box.parentNode) h.appendChild(box); box.style.display="block"; box.textContent+=t+"\n"; }
    window.addEventListener("error",function(e){ show("ERR: "+(e.message||"?")+" @"+String(e.filename||"").split("/").pop()+":"+(e.lineno||0)); });
    window.addEventListener("unhandledrejection",function(e){ show("REJ: "+(e.reason&&e.reason.message||e.reason)); });
    window.addEventListener("load",function(){ if(typeof WebSocket==="undefined") show("No WebSocket support"); });
    if(typeof WebSocket!=="undefined"){   /* log what the chat socket does, so we can see why "chat server is down" appears */
      var WS0=WebSocket, n=0;
      var WS=function(u,p){
        var id=++n, w=p===undefined?new WS0(u):new WS0(u,p);
        try{
          show("WS"+id+" connecting");
          w.addEventListener("open",function(){ show("WS"+id+" open"); });
          w.addEventListener("error",function(){ show("WS"+id+" error"); });
          w.addEventListener("close",function(e){ show("WS"+id+" close code="+e.code+(e.reason?" "+e.reason:"")); });
        }catch(x){}
        return w;
      };
      WS.prototype=WS0.prototype; WS.CONNECTING=0; WS.OPEN=1; WS.CLOSING=2; WS.CLOSED=3;
      window.WebSocket=WS;
    }
  }catch(e){}
})();
