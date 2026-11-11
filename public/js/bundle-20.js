/* ===== 62-main.js ===== */
/* Google Docs theme: left panel + Docs top bar (can be turned off in Settings) */
(function(){
  var B=document.body, K_BAR="pb_gd_bar", K_POS="pb_hdr_pos";
  var $=function(id){return document.getElementById(id);};
  var bar=$("gd-bar"), menu=$("gd-menu"), snack=$("gd-snack"), st;
  var P={
    search:"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    undo:"M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
    redo:"M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z",
    print:"M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z",
    link:"M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
    comment:"M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM17 14H7v-2h10v2zm0-3H7V9h10v2zm0-3H7V6h10v2z",
    image:"M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
    emoji:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z",
    down:"M7 10l5 5 5-5z", pencil:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    up:"M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
    left:"M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z",
    list:"M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z",
    spell:"M12.45 16h2.09L9.43 3H7.57L2.46 16h2.09l1.12-3h5.64l1.14 3zm-6.02-5L8.5 5.48 10.57 11H6.43zm15.16.59l-8.09 8.09L9.83 16l-1.41 1.41 5.09 5.09L23 13l-1.41-1.41z",
    paint:"M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z",
    hl:"M6 14l3 3v5h6v-5l3-3V9H6zm5-12h2v3h-2zM3.5 5.88l1.41-1.41 2.12 2.12L5.62 8zm13.46.71l2.12-2.12 1.41 1.41L18.38 8z",
    lsp:"M6 7h2.5L5 3.5 1.5 7H4v10H1.5L5 20.5 8.5 17H6V7zm4-2v2h12V5H10zm0 14h12v-2H10v2zm0-6h12v-2H10v2z",
    check:"M22 7h-9v2h9V7zm0 8h-9v2h9v-2zM5.54 11L2 7.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L5.54 11zm0 8L2 15.46l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41L5.54 19z",
    num:"M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z",
    more:"M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
    back:"M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
    add:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
    clear:"M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"
  };
  var IC={search:"search",undo:"undo",redo:"redo",print:"print",link:"link",comment:"add_comment",image:"image",emoji:"add_reaction",down:"arrow_drop_down",pencil:"edit",up:"keyboard_arrow_up",left:"format_align_left",list:"format_list_bulleted",spell:"spellcheck",paint:"format_paint",hl:"ink_highlighter",lsp:"format_line_spacing",check:"checklist",num:"format_list_numbered",more:"more_vert",back:"arrow_back",add:"add",clear:"format_clear"};
  var svg=function(k){return '<span class="gd-ic"><svg viewBox="0 0 24 24"><path d="'+P[k]+'"/></svg><i class="gd-mi" aria-hidden="true">'+(IC[k]||"")+'</i></span>';};
  /* the buttons written in the page HTML get the same Google icons */
  (function(){ var M={verified:"verified_user",star:"star",move:"drive_file_move",saved:"cloud_done",history:"history",comments:"comment"};
    function wrap(sv,name){ if(!sv||sv.parentNode.classList.contains("gd-ic")) return; var w=document.createElement("span"); w.className="gd-ic"; sv.parentNode.insertBefore(w,sv); w.appendChild(sv); var i=document.createElement("i"); i.className="gd-mi"; i.setAttribute("aria-hidden","true"); i.textContent=name; w.appendChild(i); }
    Object.keys(M).forEach(function(k){ var b=bar.querySelector('[data-gd="'+k+'"]'); if(b) wrap(b.querySelector("svg"),M[k]); });
    var sh=bar.querySelector(".gd-share"); if(sh){ wrap(sh.querySelector(":scope > svg"),"group"); wrap(sh.querySelector(".gd-caret svg"),"arrow_drop_down"); } })();
  var miT=0;
  function loadIcons(){ if(B.classList.contains("gd-mi-on")||miT) return; miT=1;
    try{ if(!document.getElementById("gd-mi-css")){ var l=document.createElement("link"); l.id="gd-mi-css"; l.rel="stylesheet"; l.href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"; document.head.appendChild(l); }
      document.fonts.load('20px "Material Symbols Outlined"',"search").then(function(f){ if(f&&f.length) B.classList.add("gd-mi-on"); else miT=0; },function(){ miT=0; }); }catch(e){ miT=0; } }
  function snk(t){ snack.textContent=t; snack.classList.add("on"); clearTimeout(st); st=setTimeout(function(){snack.classList.remove("on");},2600); }
  function inTheme(){ return B.dataset.theme==="gdocs"; }
  function barOn(){ try{ return localStorage.getItem(K_BAR)!=="0"; }catch(e){ return true; } }

  /* ----- real actions ----- */
  /* which kind of tab is open: chat (messages), doc (Home, Gallery, Polls, Tier, Games, Media) or draw */
  function kindOf(){ var c; try{ c=curCh; }catch(e){ c="main"; } if(["main","dm","grp","shame"].indexOf(c)>=0) return "chat"; if(c==="draw") return "draw"; return "doc"; }
  function trayOK(){ var t=$("tray"); return !!(t&&t.getClientRects().length&&!B.classList.contains("gd-view")); }
  function docArea(){ if(kindOf()!=="doc") return null; var c; try{ c=curCh; }catch(e){} if(c==="gal"||c==="polls") return $("box"); var ids=["home","tier","games","mdview"]; for(var i=0;i<ids.length;i++){ var e=$(ids[i]); if(e&&e.getClientRects().length) return e; } return null; }
  function fmtOK(){ if(kindOf()==="draw"){ snk("Formatting isn't available in the Drawing tab"); return false; } return true; }
  function chatText(){
    if(kindOf()==="doc"){ var da=docArea(); return da?(da.innerText||"").trim():""; }
    var out=[]; document.querySelectorAll("#box .msg").forEach(function(m){
      var l=m.querySelector(".lbl"), b=m.querySelector(".bubble"); if(!b) return;
      var who=l?l.textContent.trim():"", t=b.textContent.trim(); if(t) out.push((who?who+": ":"")+t);
    }); return out.join("\n");
  }
  function download(){ var t=chatText(); if(!t){ snk("Nothing to download yet"); return; }
    var a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([t],{type:"text/plain"})); a.download=(($("gd-title").textContent||"chat").trim()||"chat")+".txt"; document.body.appendChild(a); a.click(); a.remove(); snk("Downloaded as .txt"); }
  function copyLink(){ try{ navigator.clipboard.writeText(location.href).then(function(){ snk("Link copied"); },function(){ snk("Couldn't copy the link"); }); }catch(e){ snk("Couldn't copy the link"); } }
  var curZ=1;
  function showZ(){ var zi=$("gd-zoomin"); if(zi&&document.activeElement!==zi) zi.value=Math.round(curZ*100); else if(zi) zi.value=Math.round(curZ*100); }
  function zoom(z){ if(kindOf()==="draw"){ snk("Zoom isn't available in the Drawing tab"); showZ(); return; } z=+z; if(!isFinite(z)||z<=0){ showZ(); return; } z=Math.max(.25,Math.min(5,z)); curZ=z; B.style.setProperty("--gdz",z); snk("Zoom "+Math.round(z*100)+"%"); showZ(); }
  var fs=11;
  function size(d){ fs=Math.max(8,Math.min(36,(d===0?11:fs+d))); B.style.setProperty("--gdfs",fs+"pt"); var n=$("gd-fsn"); if(n) n.textContent=fs; }
  function click(sel){ if(!trayOK()){ snk("Open a chat or gallery tab to use this"); return; } var e=document.querySelector(sel); if(e) e.click(); else snk("Not available here"); }
  function toggleBar(){ try{ localStorage.setItem(K_BAR,barOn()?"0":"1"); }catch(e){} sync(); var c=$("gdbar"); if(c) c.checked=barOn(); }
  function words(){ var t=chatText(); var w=t?t.split(/\s+/).filter(Boolean).length:0; snk(w+" words · "+t.length+" characters"); }
  var MENUS={
    File:[["Share","",copyLink],["Download as .txt","",download],"-",["Print","Ctrl+P",function(){window.print();}]],
    Edit:[["Find","Ctrl+Alt+F",function(){ openFind(); }],"-",["Undo","Ctrl+Z",function(){ undoRedo("undo"); }],["Redo","Ctrl+Y",function(){ undoRedo("redo"); }],"-",["Select all","Ctrl+A",function(){document.execCommand("selectAll");}],["Copy","Ctrl+C",function(){document.execCommand("copy");}]],
    View:[["Show / hide tabs panel","",function(){ click("#hdr-arrow"); }],"-",["Zoom 75%","",function(){zoom(.75);}],["Zoom 100%","",function(){zoom(1);}],["Zoom 125%","",function(){zoom(1.25);}],["Zoom 150%","",function(){zoom(1.5);}],"-",["Dark mode (on / off)","",function(){ try{ var on=window.gdDark.toggle(); snk(on?"Dark mode on":"Dark mode off"); }catch(e){ snk("Dark mode isn’t available"); } }],"-",["Full screen","",function(){ var d=document.documentElement; if(document.fullscreenElement) document.exitFullscreen(); else if(d.requestFullscreen) d.requestFullscreen(); }],["Hide the Docs top bar","",toggleBar]],
    Insert:[["Link","Ctrl+K",function(){ if(!trayOK()||kindOf()!=="chat"){ snk("Open a chat tab to insert a link"); return; } var u=window.prompt("Link URL","https://"); if(u&&u!=="https://"){ var i=$("inp"); if(i&&!i.disabled){ i.value+=(i.value?" ":"")+u; i.dispatchEvent(new Event("input",{bubbles:true})); i.focus(); } } }],["Image","",function(){click("label.plus");}],["Emoji","",function(){ if(kindOf()!=="chat"||!trayOK()){ snk("Open a chat tab to insert an emoji"); return; } click("#emo-btn");}],["GIF","",function(){ if(kindOf()!=="chat"||!trayOK()){ snk("Open a chat tab to insert a GIF"); return; } click("#gif-btn");}]],
    Format:[["Bold","",function(){ if(fmtOK()) fmtBtn.b.click(); }],["Italic","",function(){ if(fmtOK()) fmtBtn.i.click(); }],["Underline","",function(){ if(fmtOK()) fmtBtn.u.click(); }],"-",["Increase text size","",function(){ if(fmtOK()) size(1); }],["Decrease text size","",function(){ if(fmtOK()) size(-1); }],["Reset text size","",function(){ if(fmtOK()) size(0); }],"-",["Clear formatting","",function(){ if(fmtOK()){ resetFmt(); snk("Formatting cleared"); } }]],
    Tools:[["Word count","Ctrl+Shift+C",words]],
    Extensions:[["No add-ons installed","",null]],
    Help:[["Keyboard shortcuts","Ctrl+/",function(){snk("Ctrl+Enter sends · Esc closes menus · Ctrl+P prints");}],["Docs Help","",function(){snk("This is just a Docs-style theme 😄");}]],
    Settings:[]
  };
  var menus=$("gd-menus"); Object.keys(MENUS).forEach(function(n){ var b=document.createElement("button"); b.className="gd-m"; b.type="button"; b.textContent=n; b.onclick=function(e){ e.stopPropagation(); if(n==="Settings"){ closeMenu(); try{ openSettings(); }catch(err){ snk("Open Settings from the gear"); } return; } openMenu(b,n); }; menus.appendChild(b); });
  function closeMenu(){ menu.dataset.dots=""; menu.classList.remove("on"); document.querySelectorAll("#gd-bar .open").forEach(function(x){x.classList.remove("open");}); }
  function openMenu(btn,name){
    var was=btn.classList.contains("open"); closeMenu(); if(was) return;
    menu.innerHTML=""; menu.classList.remove("gd-fontmenu"); MENUS[name].forEach(function(it){
      if(it==="-"){ menu.appendChild(document.createElement("hr")); return; }
      var b=document.createElement("button"); b.type="button"; b.innerHTML="<span></span><small></small>"; b.firstChild.textContent=it[0]; b.lastChild.textContent=it[1];
      if(!it[2]) b.disabled=true; else b.onclick=function(){ closeMenu(); it[2](); };
      menu.appendChild(b);
    });
    var r=btn.getBoundingClientRect(); menu.style.left=Math.max(4,Math.min(r.left,innerWidth-250))+"px"; menu.style.top=r.bottom+2+"px"; menu.classList.add("on"); btn.classList.add("open");
  }
  document.addEventListener("click",function(e){ if(!e.target.closest||!e.target.closest("#gd-menu")) closeMenu(); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape") closeMenu(); });

  /* ----- toolbar (works on the chat text; dims in tabs where it makes no sense) ----- */
  var tb=$("gd-tb"), FX={b:0,i:0,u:0}, fmtBtn={};
  function fx(el,s){ el.dataset.s=s||"d"; return el; }   // d = text formatting (chat + other tabs), c = chat only, t = needs the message tray, u = always
  function ib(icon,title,fn){ var b=document.createElement("button"); b.type="button"; b.className="gd-ib"; b.title=title; b.innerHTML=svg(icon); b.onclick=fn||function(){snk(title);}; tb.appendChild(b); return b; }
  function ibd(icon,title,fn,s){ var b=ib(icon,title,fn); var m=document.createElement("button"); m.type="button"; m.className="gd-ib gd-mini"; m.title=title; m.innerHTML=svg("down"); m.onclick=fn||function(){snk(title);}; tb.appendChild(m); fx(b,s); fx(m,s); return b; }
  function sep(){ var s=document.createElement("span"); s.className="gd-sep"; tb.appendChild(s); }
  function dd(label,title,fn,id){ var b=document.createElement("button"); b.type="button"; b.className="gd-dd"; b.title=title; b.innerHTML="<span>"+label+"</span>"+svg("down"); if(id) b.id=id; b.onclick=fn||function(){}; tb.appendChild(b); return b; }
  function txt(ch,title,st,fn){ var b=document.createElement("button"); b.type="button"; b.className="gd-ib gd-fmt"; b.title=title; b.textContent=ch; if(st) b.style.cssText=st; b.onclick=fn||function(){}; tb.appendChild(b); return fx(b); }
  function pick(btn,items){ return function(e){ e.stopPropagation(); MENUS.__d=items; openMenu(btn,"__d"); }; }
  function inp(){ return $("inp"); }
  function ins(t,front){ var i=inp(); if(!i||i.disabled){ snk("Join the chat to type"); return; } i.focus(); var a=i.selectionStart||0,b=i.selectionEnd||0;
    if(front){ if(i.value.indexOf(t)!==0) i.value=t+i.value; } else { i.value=i.value.slice(0,a)+t+i.value.slice(b); i.selectionStart=i.selectionEnd=a+t.length; }
    i.dispatchEvent(new Event("input",{bubbles:true})); }
  function setVar(k,v){ if(v===null) B.style.removeProperty(k); else B.style.setProperty(k,v); }
  /* ----- colour picker like Google Sheets: palette popup + "custom colour" dialog ----- */
  var CP_PAL=[
    ["#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#efefef","#f3f3f3","#ffffff"],
    ["#980000","#ff0000","#ff9900","#ffff00","#00ff00","#00ffff","#4a86e8","#0000ff","#9900ff","#ff00ff"],
    ["#e6b8af","#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#c9daf8","#cfe2f3","#d9d2e9","#ead1dc"],
    ["#dd7e6b","#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#a4c2f4","#9fc5e8","#b4a7d6","#d5a6bd"],
    ["#cc4125","#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6d9eeb","#6fa8dc","#8e7cc3","#c27ba0"],
    ["#a61c00","#cc0000","#e69138","#f1c232","#6aa84f","#45818e","#3c78d8","#3d85c6","#674ea7","#a64d79"],
    ["#85200c","#990000","#b45f06","#bf9000","#38761d","#134f5c","#1155cc","#0b5394","#351c75","#741b47"],
    ["#5b0f00","#660000","#783f04","#7f6000","#274e13","#0c343d","#1c4587","#073763","#20124d","#4c1130"]
  ];
  var CP_THEME=["#000000","#ffffff","#4285f4","#ea4335","#fbbc04","#34a853","#ff6d01","#46bdc6"];
  var CP_I={
    reset:'<svg viewBox="0 0 24 24"><path d="M18 14c0-4-6-10.8-6-10.8s-1.33 1.51-2.73 3.52l8.59 8.59c.09-.42.14-.86.14-1.31zm-.88 3.12L12.5 12.5 5.27 5.27 4 6.55l3.32 3.32C6.55 11.32 6 12.79 6 14c0 3.31 2.69 6 6 6 1.52 0 2.9-.57 3.95-1.5l2.63 2.63 1.27-1.27-2.74-2.74z"/></svg>',
    edit:'<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    add:'<svg viewBox="0 0 24 24"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    eye:'<svg viewBox="0 0 24 24"><path d="M20.71 5.63l-2.34-2.34a.996.996 0 00-1.41 0l-3.12 3.12-1.93-1.91-1.41 1.41 1.42 1.42L3 16.25V21h4.75l8.92-8.92 1.42 1.42 1.41-1.41-1.92-1.92 3.12-3.12c.4-.4.4-1.03.01-1.42zM6.92 19L5 17.08l8.06-8.06 1.92 1.92L6.92 19z"/></svg>'
  };
  function cpH2(n){ n=Math.max(0,Math.min(255,Math.round(n))); return (n<16?"0":"")+n.toString(16); }
  function cpParse(str){
    str=String(str||"").trim().toLowerCase(); var m;
    if((m=/^#([0-9a-f]{3,4})$/.exec(str))) str="#"+m[1].split("").map(function(x){ return x+x; }).join("");
    if((m=/^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(str))) return {r:parseInt(m[1].slice(0,2),16),g:parseInt(m[1].slice(2,4),16),b:parseInt(m[1].slice(4,6),16),a:m[2]?parseInt(m[2],16)/255:1};
    if((m=/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*(?:[,\/]\s*([\d.]+%?)\s*)?\)$/.exec(str))){ var a=1; if(m[4]!==undefined) a=m[4].slice(-1)==="%"?parseFloat(m[4])/100:parseFloat(m[4]); return {r:+m[1],g:+m[2],b:+m[3],a:Math.max(0,Math.min(1,a))}; }
    return null;
  }
  function cpCss(c){ return c.a>=.995?"#"+cpH2(c.r)+cpH2(c.g)+cpH2(c.b):"rgba("+Math.round(c.r)+","+Math.round(c.g)+","+Math.round(c.b)+","+(Math.round(c.a*100)/100)+")"; }
  function cpLum(c){ return (.299*c.r+.587*c.g+.114*c.b)/255; }
  function cpRgb2hsv(r,g,b){ r/=255; g/=255; b/=255; var mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn, h=0; if(d){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; } return {h:h,s:mx?d/mx:0,v:mx}; }
  function cpHsv2rgb(h,s,v){ var c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c, r=0,g=0,b=0; if(h<60){r=c;g=x;} else if(h<120){r=x;g=c;} else if(h<180){g=c;b=x;} else if(h<240){g=x;b=c;} else if(h<300){r=x;b=c;} else {r=c;b=x;} return {r:(r+m)*255,g:(g+m)*255,b:(b+m)*255}; }
  var CP_KEY="gd_custom_colors";
  function cpLoad(){ try{ var a=JSON.parse(localStorage.getItem(CP_KEY)||"[]"); return Array.isArray(a)?a.filter(function(x){ return cpParse(x); }).slice(0,10):[]; }catch(e){ return []; } }
  function cpSave(css){ var a=cpLoad().filter(function(x){ return x!==css; }); a.unshift(css); try{ localStorage.setItem(CP_KEY,JSON.stringify(a.slice(0,10))); }catch(e){} }
  var cpEls=[], cpOff=[], cpLastA=null, cpLastT=0;
  function cpClose(a){ cpOff.forEach(function(f){ try{ f(); }catch(e){} }); cpOff=[]; cpEls.forEach(function(e){ e.remove(); }); if(cpEls.length){ cpLastA=a||null; cpLastT=Date.now(); } cpEls=[]; }
  function cpDrag(el,fn){
    el.style.touchAction="none";
    el.addEventListener("pointerdown",function(e){ if(e.button>0) return; e.preventDefault(); try{ el.setPointerCapture(e.pointerId); }catch(x){} fn(e);
      function mv(ev){ fn(ev); } function up(){ el.removeEventListener("pointermove",mv); el.removeEventListener("pointerup",up); el.removeEventListener("pointercancel",up); }
      el.addEventListener("pointermove",mv); el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up); });
  }
  function cpDialog(start,done,cancel){
    var c0=cpParse(start)||{r:0,g:0,b:0,a:1}, hv=cpRgb2hsv(c0.r,c0.g,c0.b), S={h:hv.h,s:hv.s,v:hv.v,a:c0.a};
    var d=document.createElement("div"); d.className="gd-cd"; d.id="gd-cd"; d.setAttribute("role","dialog"); d.setAttribute("aria-label","Custom color");
    d.innerHTML='<div class="sv"><i class="t"></i></div>'+
      '<div class="mid"><div class="prev"><i></i></div><button type="button" class="eye" aria-label="Pick a custom color">'+CP_I.eye+'<span class="tip">Pick a custom color</span></button>'+
      '<div class="sl"><div class="hue"><b></b></div><div class="al"><i></i><b></b></div></div></div>'+
      '<div class="lab"><span class="hx">Hex</span><span>R</span><span>G</span><span>B</span><span>A</span></div>'+
      '<div class="ins"><input class="hx" type="text" maxlength="9" spellcheck="false" autocomplete="off" aria-label="Hex"><input class="n" data-k="r" type="text" inputmode="numeric" maxlength="3" aria-label="Red"><input class="n" data-k="g" type="text" inputmode="numeric" maxlength="3" aria-label="Green"><input class="n" data-k="b" type="text" inputmode="numeric" maxlength="3" aria-label="Blue"><input class="n" data-k="a" type="text" inputmode="numeric" maxlength="3" aria-label="Alpha percent"></div>'+
      '<div class="btns"><button type="button" class="cn">Cancel</button><button type="button" class="ok">OK</button></div>';
    document.body.appendChild(d); cpEls.push(d);
    var q=function(s){ return d.querySelector(s); };
    var sv=q(".sv"), svt=q(".sv .t"), hue=q(".hue"), hueT=q(".hue b"), al=q(".al"), alI=q(".al i"), alT=q(".al b"), prev=q(".prev i"), hx=q("input.hx"), ns={}; 
    [].slice.call(d.querySelectorAll("input.n")).forEach(function(i){ ns[i.dataset.k]=i; });
    function rgb(){ return cpHsv2rgb(S.h,S.s,S.v); }
    function upd(skip){
      var c=rgb(), r=Math.round(c.r), g=Math.round(c.g), b=Math.round(c.b), hex="#"+cpH2(r)+cpH2(g)+cpH2(b);
      sv.style.background="linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,hsl("+S.h+",100%,50%))";
      svt.style.left=(S.s*100)+"%"; svt.style.top=((1-S.v)*100)+"%"; svt.style.background=hex;
      hueT.style.left=(S.h/360*100)+"%"; hueT.style.background="hsl("+S.h+",100%,50%)";
      alI.style.background="linear-gradient(to right,rgba("+r+","+g+","+b+",0),rgb("+r+","+g+","+b+"))"; alT.style.left=(S.a*100)+"%"; alT.style.background="rgba("+r+","+g+","+b+","+S.a+")";
      prev.style.background="rgba("+r+","+g+","+b+","+S.a+")";
      if(skip!=="hx") hx.value=hex+cpH2(S.a*255);
      if(skip!=="r") ns.r.value=r; if(skip!=="g") ns.g.value=g; if(skip!=="b") ns.b.value=b; if(skip!=="a") ns.a.value=Math.round(S.a*100);
    }
    function setRgb(r,g,b){ var n=cpRgb2hsv(r,g,b); if(n.s===0) n.h=S.h; if(n.v===0){ n.h=S.h; n.s=S.s; } S.h=n.h; S.s=n.s; S.v=n.v; }
    function pos(e,el){ var r=el.getBoundingClientRect(); return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}; }
    cpDrag(sv,function(e){ var p=pos(e,sv); S.s=p.x; S.v=1-p.y; upd(); });
    cpDrag(hue,function(e){ S.h=Math.min(359.99,pos(e,hue).x*360); upd(); });
    cpDrag(al,function(e){ S.a=Math.round(pos(e,al).x*100)/100; upd(); });
    hx.addEventListener("input",function(){ var m=/^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hx.value.trim()); if(!m) return; var c=cpParse("#"+m[1]+(m[2]||"")); setRgb(c.r,c.g,c.b); S.a=c.a; upd("hx"); });
    ["r","g","b"].forEach(function(k){ ns[k].addEventListener("input",function(){ ns[k].value=ns[k].value.replace(/\D/g,"").slice(0,3); if(ns[k].value==="") return; var c=rgb(), o={r:c.r,g:c.g,b:c.b}; o[k]=Math.min(255,+ns[k].value); setRgb(o.r,o.g,o.b); upd(k); }); });
    ns.a.addEventListener("input",function(){ ns.a.value=ns.a.value.replace(/\D/g,"").slice(0,3); if(ns.a.value==="") return; S.a=Math.min(100,+ns.a.value)/100; upd("a"); });
    d.querySelectorAll("input").forEach(function(i){ i.addEventListener("blur",function(){ upd(); }); i.addEventListener("focus",function(){ setTimeout(function(){ try{ i.select(); }catch(e){} },0); }); i.addEventListener("keyup",function(e){ e.stopPropagation(); }); i.addEventListener("keypress",function(e){ e.stopPropagation(); }); });
    function ok(){ var c=rgb(); done(cpCss({r:c.r,g:c.g,b:c.b,a:S.a})); }
    d.addEventListener("keydown",function(e){ e.stopPropagation(); if(e.key==="Enter"){ e.preventDefault(); ok(); } else if(e.key==="Escape"){ e.preventDefault(); cancel(); } });
    q(".ok").onclick=ok; q(".cn").onclick=cancel;
    q(".eye").onclick=function(){ if(window.EyeDropper){ new window.EyeDropper().open().then(function(r){ var c=cpParse(r.sRGBHex); if(c){ setRgb(c.r,c.g,c.b); upd(); } }).catch(function(){}); } else snk("Your browser can't pick a colour from the screen"); };
    upd(); setTimeout(function(){ try{ hx.focus(); hx.select(); }catch(e){} },30);
  }
  function colorPick(cb,start,anchor,opts){
    if(anchor&&anchor===cpLastA&&Date.now()-cpLastT<300){ cpLastA=null; return; }
    cpClose(); opts=opts||{};
    var cur=cpParse(start), curCss=cur?cpCss(cur).toLowerCase():"";
    var pop=document.createElement("div"); pop.className="gd-cp"; pop.id="gd-cp"; pop.setAttribute("role","dialog"); pop.setAttribute("aria-label","Color picker");
    function finish(css){ cb(css); cpClose(anchor); }
    function sw(css,title){ var c=cpParse(css), s=document.createElement("button"); s.type="button"; s.className="sw"; s.style.background=css; s.title=title||css; s.setAttribute("aria-label",s.title); if(cpLum(c)>.9) s.classList.add("lt");
      if(cur&&cpCss(c).toLowerCase()===curCss){ s.innerHTML=CP_I.check; s.firstChild.style.fill=cpLum(c)>.6?"#000":"#fff"; } s.onclick=function(){ finish(css); }; return s; }
    var rs=document.createElement("button"); rs.type="button"; rs.className="rs"; rs.innerHTML=CP_I.reset+"<span>Reset</span>"; rs.onclick=function(){ finish(null); }; pop.appendChild(rs);
    var grid=document.createElement("div"); grid.className="grid";
    CP_PAL.forEach(function(row,i){ var r=document.createElement("div"); r.className="r"+(i<2?" g":""); row.forEach(function(c){ r.appendChild(sw(c)); }); grid.appendChild(r); }); pop.appendChild(grid);
    var lt=document.createElement("div"); lt.className="lbl"; lt.innerHTML="<span>THEME</span>"+CP_I.edit; pop.appendChild(lt);
    var tr=document.createElement("div"); tr.className="r th"; CP_THEME.forEach(function(c){ tr.appendChild(sw(c)); }); pop.appendChild(tr);
    pop.appendChild(document.createElement("hr"));
    var cl=document.createElement("div"); cl.className="lbl"; cl.innerHTML="<span>CUSTOM</span>"; pop.appendChild(cl);
    var cr=document.createElement("div"); cr.className="r cu";
    var add=document.createElement("button"); add.type="button"; add.className="add"; add.title="Custom color"; add.setAttribute("aria-label","Custom color"); add.innerHTML=CP_I.add;
    add.onclick=function(){ pop.style.display="none"; cpDialog(cur?cpCss(cur):(opts.def||"#000000"),function(css){ cpSave(css); finish(css); },function(){ cpClose(anchor); }); };
    cr.appendChild(add); cpLoad().slice(0,8).forEach(function(c){ cr.appendChild(sw(c)); }); pop.appendChild(cr);
    document.body.appendChild(pop); cpEls.push(pop);
    var w=pop.offsetWidth, h=pop.offsetHeight, ar=anchor?anchor.getBoundingClientRect():{left:60,bottom:100};
    pop.style.left=Math.max(6,Math.min(ar.left-8,innerWidth-w-6))+"px"; pop.style.top=Math.max(6,Math.min(ar.bottom+4,innerHeight-h-6))+"px";
    function md(e){ if(cpEls.some(function(el){ return el.contains(e.target); })) return; cpClose(anchor); }
    function kd(e){ if(e.key==="Escape"&&cpEls.length&&!document.getElementById("gd-cd")){ e.stopPropagation(); cpClose(anchor); } }
    document.addEventListener("mousedown",md,true); document.addEventListener("touchstart",md,true); document.addEventListener("keydown",kd,true);
    cpOff.push(function(){ document.removeEventListener("mousedown",md,true); document.removeEventListener("touchstart",md,true); document.removeEventListener("keydown",kd,true); });
  }
  /* keep the message box focused / selection intact when clicking toolbar buttons */
  bar.addEventListener("mousedown",function(e){ if(e.target.closest&&!e.target.closest("#gd-title,#gd-fsn,#gd-zoomin")&&e.target.closest(".gd-tb")) e.preventDefault(); });

  /* find in chat */
  var find=document.createElement("div"); find.id="gd-find"; find.innerHTML='<input type="text" placeholder="Find" spellcheck="false"><span class="n" style="min-width:48px;text-align:center;color:#5f6368"></span><button type="button" title="Previous match">&#9650;</button><button type="button" title="Next match">&#9660;</button><button type="button" title="Close">&#10005;</button>';
  document.body.appendChild(find);
  var fIn=find.querySelector("input"), fN=find.querySelector(".n"), hits=[], hi=-1;
  var hlOK=!!(window.CSS&&CSS.highlights&&window.Highlight);
  function clearHits(){ document.querySelectorAll("#box .msg.gd-hit,#box .msg.gd-cur").forEach(function(m){ m.classList.remove("gd-hit","gd-cur"); }); hits=[]; hi=-1; fN.textContent=""; if(hlOK){ try{ CSS.highlights.delete("gd-hit"); CSS.highlights.delete("gd-cur"); }catch(e){} } }
  function run(){ clearHits(); var q=fIn.value.trim().toLowerCase(); if(!q) return;
    if(kindOf()==="doc"){   /* Home, Gallery, Polls, Tier, Games, Media: search the visible text of the tab */
      var a=docArea(); if(a){ var w=document.createTreeWalker(a,NodeFilter.SHOW_TEXT,null), n;
        while((n=w.nextNode())){ var pe=n.parentElement; if(!pe||!pe.getClientRects().length||pe.closest("script,style,#gd-find")) continue; var v=n.nodeValue.toLowerCase(), k=0;
          while((k=v.indexOf(q,k))>=0){ var r=document.createRange(); r.setStart(n,k); r.setEnd(n,k+q.length); hits.push(r); k+=q.length; } } }
      if(hits.length){ if(hlOK){ try{ CSS.highlights.set("gd-hit",new Highlight(...hits)); }catch(e){} } go(0); } else fN.textContent="0 results";
      return; }
    document.querySelectorAll("#box .msg").forEach(function(m){ if((m.textContent||"").toLowerCase().indexOf(q)>=0){ m.classList.add("gd-hit"); hits.push(m); } }); if(hits.length) go(hits.length-1); else fN.textContent="0 results"; }
  function go(n){ if(!hits.length) return;
    if(kindOf()==="doc"){ hi=(n+hits.length)%hits.length; var rg=hits[hi]; if(hlOK){ try{ var hc=new Highlight(rg); hc.priority=1; CSS.highlights.set("gd-cur",hc); }catch(e){} } var el=rg.startContainer.parentElement; if(el&&el.scrollIntoView) el.scrollIntoView({block:"center"}); fN.textContent=(hi+1)+" of "+hits.length; return; }
    if(hi>=0&&hits[hi]&&hits[hi].classList) hits[hi].classList.remove("gd-cur"); hi=(n+hits.length)%hits.length; hits[hi].classList.add("gd-cur"); hits[hi].scrollIntoView({block:"center"}); fN.textContent=(hi+1)+" of "+hits.length; }
  fIn.oninput=run; fIn.onkeydown=function(e){ if(e.key==="Enter"){ go(hi+(e.shiftKey?-1:1)); } else if(e.key==="Escape"){ closeFind(); } };
  find.children[2].onclick=function(){ go(hi-1); }; find.children[3].onclick=function(){ go(hi+1); }; find.children[4].onclick=closeFind;
  function openFind(){ if(kindOf()==="draw"){ snk("Find isn't available in the Drawing tab"); return; } fIn.placeholder=kindOf()==="chat"?"Find in chat":"Find in this tab"; find.classList.add("on"); fIn.focus(); fIn.select(); run(); }
  function closeFind(){ find.classList.remove("on"); clearHits(); }
  find.addEventListener("mousedown",function(e){ e.stopPropagation(); });

  var lastEd=null;
  document.addEventListener("focusin",function(e){ var t=e.target; if(inTheme()&&t&&t.matches&&t.matches('input:not([type=file]):not([type=color]):not([type=range]):not([type=checkbox]):not([type=radio]):not([type=button]),textarea,[contenteditable="true"]')&&!(t.closest&&t.closest("#gd-find,#gd-menu"))) lastEd=t; });
  function undoRedo(cmd){
    if(kindOf()==="draw"){ var db=$(cmd==="undo"?"dundo":"dredo"); if(db) db.click(); else snk("Nothing to "+cmd); return; }
    var t=(lastEd&&lastEd.isConnected&&lastEd.getClientRects().length)?lastEd:inp(); if(t&&!t.disabled) t.focus(); document.execCommand(cmd); }
  fx(ib("search","Find (Ctrl+Alt+F)",openFind));
  fx(ib("undo","Undo (Ctrl+Z)",function(){ undoRedo("undo"); }),"u");
  fx(ib("redo","Redo (Ctrl+Y)",function(){ undoRedo("redo"); }),"u");
  var spOn=true; fx(ib("spell","Spelling and grammar check",function(){ spOn=!spOn; B.spellcheck=spOn; var i=inp(); if(i) i.spellcheck=spOn; snk("Spell check "+(spOn?"on":"off")); }));
  var painted=null; fx(ib("paint","Paint format (copies the current text style, then click again to reset)",function(){ if(!painted){ painted={f:Object.assign({},FX)}; snk("Style copied — click again to clear formatting"); } else { painted=null; resetFmt(); snk("Formatting cleared"); } }));
  sep();
  var zw=document.createElement("span"); zw.className="gd-zoomw"; zw.id="gd-zoom";
  zw.innerHTML='<input id="gd-zoomin" type="text" inputmode="numeric" maxlength="3" value="100" autocomplete="off" spellcheck="false" aria-label="Zoom percent" title="Zoom: type any number from 25 to 500, then press Enter (Up / Down arrows change it by 5)"><span class="gd-zp">%</span><button type="button" class="gd-ib gd-mini" title="Zoom presets">'+svg("down")+'</button>';
  tb.appendChild(zw); fx(zw);
  var zin=zw.firstChild, zar=zw.lastChild;
  function zcommit(){ var v=parseFloat(String(zin.value).replace(/[^\d.]/g,"")); if(!isFinite(v)||v<=0){ showZ(); return; } if(Math.round(v)!==Math.round(curZ*100)) zoom(v/100); else showZ(); }
  zin.addEventListener("focus",function(){ setTimeout(function(){ try{ zin.select(); }catch(e){} },0); });
  zin.addEventListener("keydown",function(e){
    e.stopPropagation();
    if(e.key==="Enter"){ e.preventDefault(); zcommit(); zin.blur(); }
    else if(e.key==="Escape"){ showZ(); zin.blur(); }
    else if(e.key==="ArrowUp"||e.key==="ArrowDown"){ e.preventDefault(); var v=parseFloat(zin.value); if(!isFinite(v)) v=Math.round(curZ*100); zoom((v+(e.key==="ArrowUp"?5:-5))/100); }
  });
  zin.addEventListener("keyup",function(e){ e.stopPropagation(); }); zin.addEventListener("keypress",function(e){ e.stopPropagation(); });
  zin.addEventListener("input",function(){ var c=zin.value.replace(/[^\d]/g,"").slice(0,3); if(c!==zin.value) zin.value=c; });
  zin.addEventListener("blur",zcommit);
  zar.onclick=function(e){ e.stopPropagation(); MENUS.__z=[["25%","",function(){zoom(.25);}],["50%","",function(){zoom(.5);}],["75%","",function(){zoom(.75);}],["90%","",function(){zoom(.9);}],["100%","",function(){zoom(1);}],["125%","",function(){zoom(1.25);}],["150%","",function(){zoom(1.5);}],["200%","",function(){zoom(2);}],["300%","",function(){zoom(3);}],["400%","",function(){zoom(4);}],["500%","",function(){zoom(5);}],"-",["Type your own number in the box","",null]]; openMenu(zar,"__z"); };
  sep();
  var STY=[["Normal text",1],["Title",2.2],["Heading 1",1.8],["Heading 2",1.5],["Heading 3",1.25],["Small text",.85]], styB;
  styB=dd("Normal text","Styles",pick(null,[])); fx(styB);
  styB.onclick=function(e){ e.stopPropagation(); MENUS.__d=STY.map(function(r){ return [r[0],"",function(){ setVar("--gdsz",r[1]); styB.firstChild.textContent=r[0]; }]; }); openMenu(styB,"__d"); };
  sep();
  var FONTS=(function(){
    var m={"Architects Daughter":"'Architects Daughter',cursive","Roboto":"Roboto,Arial,sans-serif"};
    try{ Object.keys(FONT_MAP).forEach(function(k){ if(k!=="Minecraft") m[k]=FONT_MAP[k]; }); }catch(e){ m["Arial"]="Arial,Helvetica,sans-serif"; m["Georgia"]="Georgia,serif"; m["Verdana"]="Verdana,sans-serif"; m["Courier New"]="'Courier New',monospace"; }
    return Object.keys(m).sort(function(x,y){ return x.toLowerCase()<y.toLowerCase()?-1:1; }).map(function(k){ return [k,m[k]]; });
  })(), fontB;
  fontB=dd("Arial","Font",null); fontB.classList.add("gd-font"); fx(fontB);
  fontB.onclick=function(e){ e.stopPropagation(); MENUS.__d=FONTS.map(function(r){ return [r[0],"",function(){ setVar("--gdff",r[1]); fontB.firstChild.textContent=r[0]; }]; }); openMenu(fontB,"__d"); menu.classList.add("gd-fontmenu"); Array.prototype.forEach.call(menu.querySelectorAll("button"),function(bt,i){ if(FONTS[i]) bt.firstChild.style.fontFamily=FONTS[i][1]; }); var cur=fontB.firstChild.textContent; Array.prototype.some.call(menu.querySelectorAll("button"),function(bt){ if(bt.firstChild.textContent===cur){ bt.style.background="#e9eef6"; menu.scrollTop=Math.max(0,bt.offsetTop-120); return true; } }); };
  sep();
  var fsw=document.createElement("span"); fsw.className="gd-fs"; fsw.innerHTML='<button class="gd-ib" title="Decrease font size" type="button" style="font:700 18px Arial">&minus;</button><span class="num" id="gd-fsn">11</span><button class="gd-ib" title="Increase font size" type="button" style="font:700 18px Arial">+</button>';
  fsw.children[0].onclick=function(){size(-1);}; fsw.children[2].onclick=function(){size(1);}; tb.appendChild(fsw); fx(fsw);
  sep();
  function tog(k,btn,cssVar,on,off){ FX[k]=FX[k]?0:1; btn.classList.toggle("gd-on",!!FX[k]); setVar(cssVar,FX[k]?on:off); }
  fmtBtn.b=txt("B","Bold (Ctrl+B)",null,function(){ tog("b",fmtBtn.b,"--gdw","700",null); });
  fmtBtn.i=txt("I","Italic (Ctrl+I)","font:italic 700 15px Georgia,serif",function(){ tog("i",fmtBtn.i,"--gdi","italic",null); });
  fmtBtn.u=txt("U","Underline (Ctrl+U)","text-decoration:underline;font:700 15px Arial",function(){ tog("u",fmtBtn.u,"--gdu","underline",null); });
  var aB=txt("A","Text color","border-bottom:3px solid #000;border-radius:0;height:22px;line-height:18px;align-self:center;width:24px;margin:0 4px",function(){ colorPick(function(c){ if(c===null){ setVar("--gdc",null); aB.style.borderBottomColor="#000"; } else { setVar("--gdc",c); aB.style.borderBottomColor=c; } },gv("--gdc")||"#000000",aB,{def:"#000000"}); });
  var hlB=fx(ib("hl","Highlight color",function(){ colorPick(function(c){ setVar("--gdhl",c); },gv("--gdhl")||"",hlB,{def:"#ffff00"}); }));
  function resetFmt(){ ["--gdw","--gdi","--gdu","--gdc","--gdhl","--gdsz","--gdff","--gdlh"].forEach(function(k){ setVar(k,null); }); FX={b:0,i:0,u:0}; ["b","i","u"].forEach(function(k){ fmtBtn[k].classList.remove("gd-on"); }); aB.style.borderBottomColor="#000"; styB.firstChild.textContent="Normal text"; fontB.firstChild.textContent="Arial"; B.classList.remove("gd-al-c","gd-al-r"); size(0); }
  sep();
  fx(ib("link","Insert link (Ctrl+K)",function(){ var u=window.prompt("Link URL","https://"); if(u&&u!=="https://") ins(u+" "); }),"c");
  fx(ib("comment","Add a comment (Ctrl+Alt+M)",function(){ var i=inp(); if(i) i.focus(); snk("Type your comment in the message box"); }),"c");
  fx(ib("image","Insert image",function(){click("label.plus");}),"t");
  sep();
  var alB=ibd("left","Align",null); var alFn=function(e){ e.stopPropagation(); MENUS.__d=[["Left","Ctrl+Shift+L",function(){ B.classList.remove("gd-al-c","gd-al-r"); }],["Center","Ctrl+Shift+E",function(){ B.classList.remove("gd-al-r"); B.classList.add("gd-al-c"); }],["Right","Ctrl+Shift+R",function(){ B.classList.remove("gd-al-c"); B.classList.add("gd-al-r"); }]]; openMenu(alB,"__d"); }; alB.onclick=alFn; alB.nextSibling.onclick=alFn;
  var lsB=fx(ib("lsp","Line & paragraph spacing",null)); lsB.onclick=function(e){ e.stopPropagation(); MENUS.__d=[["Single","",1],["1.15","",1.15],["1.5","",1.5],["Double","",2]].map(function(r){ return [r[0],"",function(){ setVar("--gdlh",r[2]); }]; }); openMenu(lsB,"__d"); };
  ibd("check","Checklist",function(){ ins("☐ ",true); },"c"); ibd("list","Bulleted list (Ctrl+Shift+8)",function(){ ins("• ",true); },"c"); ibd("num","Numbered list (Ctrl+Shift+7)",function(){ ins("1. ",true); },"c");
  function showMore(r,right){ var hb=$("hmore-btn"), mn=$("hmore-menu"); if(!hb||!mn){ snk("Nothing more here"); return; } hb.click(); if(mn.classList.contains("on")){ var w=mn.offsetWidth, h=mn.offsetHeight; var l=right?r.right+4:r.left-w+32, t=right?r.top:r.bottom+6; mn.style.left=Math.max(8,Math.min(l,innerWidth-w-8))+"px"; mn.style.top=Math.max(8,Math.min(t,innerHeight-h-8))+"px"; } }
  var moreB=ib("more","More",function(e){ e.stopPropagation(); showMore(moreB.getBoundingClientRect(),false); });
  /* the 3 dots on the open tab in the left panel open a menu with that tab's editing features (rename, edit page, add subtab, delete) */
  (function(){ var ct=$("chtabs"); if(!ct) return; ct.addEventListener("click",function(e){ if(!inTheme()) return; var b=e.target.closest&&e.target.closest("button.on"); if(!b||B.dataset.hp!=="left") return; var r=b.getBoundingClientRect(); if(e.clientX<r.right-40) return; e.stopPropagation(); e.preventDefault();
    var was=menu.classList.contains("on")&&menu.dataset.dots==="1"; closeMenu(); b.classList.remove("open"); if(was) return;   // a second click on the dots closes the menu
    var T=window.__ctTop, custom=/^ct:/.test(b.dataset.ch||""), st=custom&&T?T.state():null, it=[];
    if(st&&st.on){
      if(st.rename) it.push(["Rename","Name, icon, wallpaper, who can edit",function(){ T.rename(); }]);
      if(st.edit) it.push(["Edit page","",function(){ T.edit(); }]);
      if(st.sub) it.push(["Add subtab","",function(){ T.addSub(); }]);
      if(st.del){ if(it.length) it.push("-"); it.push(["Delete","",function(){ T.del(); }]); }
    }
    if(T&&T.state().add){ if(it.length) it.push("-"); it.push(["New tab","",function(){ T.newTab(); }]); }
    if(!it.length) it.push([custom?"You can't edit this tab":"Built-in tab: nothing to edit","",null]);
    MENUS.__d=it; openMenu(b,"__d"); b.classList.remove("open"); menu.dataset.dots="1";
    var w=menu.offsetWidth,h=menu.offsetHeight; menu.style.left=Math.max(8,Math.min(r.right+4,innerWidth-w-8))+"px"; menu.style.top=Math.max(8,Math.min(r.top,innerHeight-h-8))+"px";
  },true); })();
  try{ var hb0=$("hmore-btn"); if(hb0) new MutationObserver(function(){ moreB.classList.toggle("gd-new",hb0.classList.contains("new")); }).observe(hb0,{attributes:true,attributeFilter:["class"]}); }catch(e){}
  var ed=document.createElement("button"); ed.type="button"; ed.className="gd-edit"; ed.title="Editing mode"; ed.innerHTML=svg("pencil")+svg("down"); tb.appendChild(ed);
  ed.onclick=function(e){ e.stopPropagation(); var set=function(v){ return function(){ B.classList.toggle("gd-view",v==="Viewing"); snk(v==="Viewing"?"Viewing: the message box is hidden":v+" mode"); }; }; MENUS.__d=[["Editing","Edit the chat",set("Editing")],["Suggesting","Edits become suggestions",set("Suggesting")],["Viewing","Read the chat (hides the message box)",set("Viewing")]]; openMenu(ed,"__d"); };
  sep();
  ib("up","Hide the menus (Ctrl+Shift+F)",function(){ toggleBar(); });
  var showB=document.createElement("button"); showB.id="gd-show"; showB.type="button"; showB.title="Show the menus (Ctrl+Shift+F)"; showB.innerHTML=svg("down"); showB.onclick=function(){ toggleBar(); }; document.body.appendChild(showB);
  document.addEventListener("keydown",function(e){ if(!inTheme()) return; if(e.ctrlKey&&e.shiftKey&&(e.key==="F"||e.key==="f")){ e.preventDefault(); toggleBar(); } else if(e.ctrlKey&&e.altKey&&(e.key==="f"||e.key==="F")){ e.preventDefault(); openFind(); } });
  /* Formatting for Home / Gallery / Polls / Tier / Games / Media: the toolbar restyles the text of the open tab
     (inline styles on text elements only; buttons and controls are left alone; everything is undone by Paint format / Clear formatting) */
  var dMap=new Map(), dObs=null, dSig="", dT=0, dT2=0, SKIP="button,[role=button],select,input,textarea,svg,canvas,img,video,audio,script,style,.arrow,.btn,.pill,label.plus";
  function gv(k){ return B.style.getPropertyValue(k).trim(); }
  function fmtState(){ return {ff:gv("--gdff"),w:gv("--gdw"),i:gv("--gdi"),u:gv("--gdu"),c:gv("--gdc"),hl:gv("--gdhl"),lh:gv("--gdlh"),k:(parseFloat(gv("--gdsz"))||1)*(fs/11),al:B.classList.contains("gd-al-c")?"center":B.classList.contains("gd-al-r")?"right":""}; }
  function textEls(root){ var out=[], seen=new Set(), w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), n; while((n=w.nextNode())){ if(!/\S/.test(n.nodeValue)) continue; var pe=n.parentElement; if(!pe||seen.has(pe)||pe.closest(SKIP)) continue; seen.add(pe); out.push(pe); } return out; }
  function docRevert(){ dMap.forEach(function(t,el){ for(var pr in t){ if(t[pr][0]) el.style.setProperty(pr,t[pr][0],t[pr][1]); else el.style.removeProperty(pr); } if(!el.getAttribute("style")) el.removeAttribute("style"); }); dMap.clear(); }
  function docStop(){ clearTimeout(dT); if(dObs){ dObs.disconnect(); dObs=null; } docRevert(); dSig=""; }
  function docApply(force){
    var a=docArea(), s=fmtState(), on=!!(s.ff||s.w||s.i||s.u||s.c||s.hl||s.lh||s.al||Math.abs(s.k-1)>.001), sig=(a?a.id:"")+"|"+JSON.stringify(s);
    if(!force&&sig===dSig) return; dSig=sig;
    docRevert(); if(dObs){ dObs.disconnect(); dObs=null; }
    if(!a||!on) return;
    var els=textEls(a), sizes=els.map(function(e){ return parseFloat(getComputedStyle(e).fontSize)||14; });
    els.forEach(function(el,i){ var t={}; dMap.set(el,t);
      var put=function(pr,v){ t[pr]=[el.style.getPropertyValue(pr),el.style.getPropertyPriority(pr)]; el.style.setProperty(pr,v,"important"); };
      if(s.ff) put("font-family",s.ff); if(s.w) put("font-weight",s.w); if(s.i) put("font-style",s.i); if(s.u) put("text-decoration",s.u);
      if(s.c) put("color",s.c); if(s.hl) put("background-color",s.hl); if(s.lh) put("line-height",s.lh); if(s.al) put("text-align",s.al);
      if(Math.abs(s.k-1)>.001) put("font-size",(sizes[i]*s.k).toFixed(2)+"px"); });
    dObs=new MutationObserver(function(){ clearTimeout(dT); dT=setTimeout(function(){ if(inTheme()) docApply(true); },300); });
    dObs.observe(a,{childList:true,subtree:true,characterData:true});
  }
  function scheduleDoc(){ clearTimeout(dT2); dT2=setTimeout(function(){ if(inTheme()) docApply(false); },30); }
  try{ new MutationObserver(scheduleDoc).observe(B,{attributes:true,attributeFilter:["class","style"]}); }catch(e){}
  var lastKey="";
  function tick(){
    if(!inTheme()) return;
    var k=kindOf(), c=""; try{ c=curCh; }catch(e){}
    tb.classList.toggle("gd-k-doc",k==="doc"); tb.classList.toggle("gd-k-draw",k==="draw"); tb.classList.toggle("gd-notray",!trayOK());
    var key=k+"|"+c;
    if(key!==lastKey){ lastKey=key; if(find.classList.contains("on")){ if(k==="draw") closeFind(); else run(); } }
    docApply(false);
  }
  setInterval(tick,250);

  /* profile picture + people online (like the collaborator avatars in Docs) */
  var pres=$("gd-pres"), av=$("gd-av"), lastSig="";
  function openOnline(e){ e.stopPropagation(); var o=$("online"); if(o) o.click(); }
  pres.onclick=openOnline; av.onclick=openOnline; av.title="You — click to see who's online";
  function paintPeople(){
    if(!inTheme()) return;
    try{ var nm=((typeof usr!=="undefined"&&usr)||"U"); paintAv(av,nm); var _t=av.classList.contains("has-pfp")?"":nm.trim().charAt(0).toUpperCase(); if(av.textContent!==_t) av.textContent=_t; }catch(e){}
    var others=[]; try{ others=lastRoster.filter(function(r){ return r.n!==usr; }); }catch(e){}
    var sig=others.map(function(r){ return r.n+(avatars[r.n]?avatars[r.n].length:0); }).join("|");
    if(sig===lastSig) return; lastSig=sig; pres.replaceChildren();
    pres.title=others.length?(others.length+" other"+(others.length>1?"s":"")+" online"):"Nobody else is online";
    others.slice(0,3).forEach(function(r){ var d=document.createElement("div"); d.className="gd-pav"; d.title=r.n; try{ paintAv(d,r.n); }catch(e){} pres.appendChild(d); });
    if(others.length>3){ var m=document.createElement("div"); m.className="gd-pav more"; m.textContent="+"+(others.length-3); pres.appendChild(m); }
  }
  setInterval(paintPeople,800);
  /* the people-online popup has to sit above the header */
  var onpop=$("onpop"), onHome=onpop?onpop.parentNode:null;
  function homePop(){ if(!onpop) return; if(inTheme()){ if(onpop.parentNode!==document.body) document.body.appendChild(onpop); } else if(onHome&&onpop.parentNode!==onHome) onHome.appendChild(onpop); }
  setInterval(homePop,500);

  /* right app rail (Calendar, Keep, Tasks, Contacts, +) */
  var rail=document.createElement("div"); rail.id="gd-rail";
  rail.innerHTML='<button title="Calendar"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#1a73e8"/><rect x="6" y="6" width="12" height="12" rx="1.5" fill="#fff"/><text x="12" y="15.4" font-size="7.5" font-weight="700" text-anchor="middle" fill="#1a73e8" font-family="Arial">31</text></svg></button>'+
    '<button title="Keep"><svg viewBox="0 0 24 24"><path fill="#fbbc04" d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"/><rect x="9" y="19" width="6" height="2.6" rx="1.2" fill="#fbbc04"/><path fill="#fff" opacity=".8" d="M9.2 8.5a3 3 0 0 1 2.3-2.2v1.3a1.8 1.8 0 0 0-1.2 1.1z"/></svg></button>'+
    '<button title="Tasks"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="#1a73e8"/><path d="M7.5 12.3l3 3 6-6.3" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
    '<button title="Contacts"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a73e8"/><circle cx="12" cy="9.6" r="3" fill="#fff"/><path fill="#fff" d="M6.4 17.4c.8-2.4 3-3.4 5.6-3.4s4.8 1 5.6 3.4z"/></svg></button>'+
    '<hr><button class="gd-plus" title="Get add-ons">'+svg("add")+'</button>';
  rail.addEventListener("click",function(e){ var b=e.target.closest&&e.target.closest("button"); if(b) snk((b.title||"App")+" isn't available here"); });
  document.body.appendChild(rail);

  /* "Document tabs" header + back arrow on the left panel */
  (function(){
    var hdr=$("hdr"); if(!hdr) return;
    var th=document.createElement("div"); th.className="gd-th"; th.innerHTML='<span>Document tabs</span><button type="button" class="gd-ib" title="Add tab">'+svg("add")+'</button>';
    th.querySelector("button").onclick=function(){ var cp=document.querySelector("#chtabs button.ct-plus"); if(cp) cp.click(); else snk("Tabs can’t be added right now"); };
    hdr.prepend(th);
  })();
  try{ var l=document.createElement("link"); l.rel="stylesheet"; l.href="https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap"; document.head.appendChild(l); }catch(e){}

  /* top-right buttons */
  bar.addEventListener("click",function(e){ var b=e.target.closest&&e.target.closest("[data-gd]"); if(!b) return; var a=b.dataset.gd;
    if(a==="share") copyLink(); else if(a==="star"){ b.style.color=b.style.color?"":"#f9ab00"; snk(b.style.color?"Starred":"Removed star"); }
    else if(a==="move") snk("Shortcut added to Drive"); else if(a==="verified") snk("This document is verified"); else if(a==="saved") snk("All changes saved in Drive"); else if(a==="history"){ if(window.__pbOpenEditHist) window.__pbOpenEditHist(); else snk("Edit history isn’t available right now"); } else if(a==="comments") snk("No comments yet"); });

  /* ----- state sync ----- */
  var wasTheme=false;
  function sync(){
    var on=inTheme();
    B.classList.toggle("gd-bar-on", on && barOn());
    if(on) loadIcons();
    if(on){
      
      if(!wasTheme){ B.dataset.hp="left"; var s=$("hdrpos"); if(s) s.value="left"; setTimeout(function(){window.dispatchEvent(new Event("resize"));},320); }   // the old top bar goes to the left
      requestAnimationFrame(function(){ var h=bar.offsetHeight; if(h) B.style.setProperty("--gdh",h+"px"); });
    } else if(wasTheme){
      var p="top"; try{ p=localStorage.getItem(K_POS)||"top"; }catch(e){}
      if(["top","left","right","bottom"].indexOf(p)<0) p="top";
      if(p==="top") B.removeAttribute("data-hp"); else B.dataset.hp=p; var s2=$("hdrpos"); if(s2) s2.value=p;
      closeMenu(); docStop(); closeFind();
    }
    wasTheme=on;
  }
  new MutationObserver(sync).observe(B,{attributes:true,attributeFilter:["data-theme"]});
  window.addEventListener("resize",function(){ if(inTheme()) sync(); });
  var chk=$("gdbar"); if(chk){ chk.checked=barOn(); chk.addEventListener("change",function(){ try{ localStorage.setItem(K_BAR,chk.checked?"1":"0"); }catch(e){} sync(); }); }
  sync();
})();

;
/* ===== 63-gdocs-motion-js.js ===== */
(function(){
  var B=document.body, RM=window.matchMedia&&matchMedia("(prefers-reduced-motion:reduce)").matches;
  function inTheme(){ return B.getAttribute("data-theme")==="gdocs"; }
  /* ripple on press */
  var SEL="#gd-bar .gd-ib,#gd-bar .gd-dd,#gd-bar .gd-edit,#gd-bar .gd-m,#gd-bar .gd-share,#gd-rail button,#chtabs button,#hdr .row-ch,#gd-menu button:not([disabled]),#gd-find button,#sendbtn,.hm-cell";
  document.addEventListener("pointerdown",function(e){
    if(RM||!inTheme()||e.button>0) return;
    var t=e.target&&e.target.closest&&e.target.closest(SEL); if(!t) return;
    var r=t.getBoundingClientRect(); if(r.width<4||r.height<4) return;
    var cs=getComputedStyle(t), d=Math.hypot(Math.max(e.clientX-r.left,r.right-e.clientX),Math.max(e.clientY-r.top,r.bottom-e.clientY))*2;
    var w=document.createElement("div"); w.className="gd-rip";
    w.style.cssText="left:"+r.left+"px;top:"+r.top+"px;width:"+r.width+"px;height:"+r.height+"px;border-radius:"+cs.borderRadius;
    var i=document.createElement("i"); i.style.cssText="width:"+d+"px;height:"+d+"px;left:"+(e.clientX-r.left-d/2)+"px;top:"+(e.clientY-r.top-d/2)+"px";
    w.appendChild(i); document.body.appendChild(w);
    setTimeout(function(){ w.remove(); },560);
  },true);
  /* switching tabs: the page area fades in quickly (the tabs panel stays put) */
  function fadeMain(){
    if(RM||!inTheme()) return;
    var m=document.getElementById("main"); if(!m||!m.animate) return;
    try{ m.animate([{opacity:.4},{opacity:1}],{duration:160,easing:"cubic-bezier(.2,0,0,1)"}); }catch(e){}
  }
  try{ if(typeof setChannel==="function"){ var _sc=setChannel; setChannel=function(){ var r=_sc.apply(this,arguments); fadeMain(); return r; }; } }catch(e){}
  /* a new message settles in like text arriving from a collaborator */
  var box=document.getElementById("box");
  if(box&&window.MutationObserver&&!RM){
    new MutationObserver(function(ms){
      if(!inTheme()) return;
      var add=[]; ms.forEach(function(m){ Array.prototype.forEach.call(m.addedNodes,function(n){ if(n.nodeType===1&&n.classList.contains("msg")) add.push(n); }); });
      if(!add.length||add.length>3) return;                 // history loading in bulk is not animated
      add.forEach(function(n){ try{ n.animate([{opacity:0,transform:"translateY(6px)"},{opacity:1,transform:"none"}],{duration:200,easing:"cubic-bezier(.2,0,0,1)"}); }catch(e){} });
    }).observe(box,{childList:true});
  }
})();

;
/* ===== 64-gdocs-fix2-js.js ===== */
(function(){
  var mq=window.matchMedia("(max-width:700px)"), B=document.body;
  function th(){ return B.getAttribute("data-theme")==="gdocs"; }
  /* first visit on a phone: start with the drawer closed */
  try{ if(mq.matches&&th()&&localStorage.getItem("hide_hdr")===null&&typeof save==="function"&&typeof applyBars==="function"){ save("hide_hdr","1"); applyBars(); } }catch(e){}
  /* tap the page to close the drawer */
  document.addEventListener("click",function(e){
    if(!th()||!mq.matches||B.classList.contains("hide-hdr")) return;
    var t=e.target; if(!t||!t.closest) return;
    if(t.closest("#hdrwrap,#gd-bar,#gd-menu,#hmore-menu,#onpop,#ct-modal")) return;
    if(t.closest("#main")){ try{ save("hide_hdr","1"); applyBars(); }catch(err){} }
  },true);
  /* choosing a tab closes the drawer on a phone */
  var ct=document.getElementById("chtabs");
  if(ct) ct.addEventListener("click",function(e){ if(!th()||!mq.matches) return; var b=e.target.closest&&e.target.closest("button[data-ch]:not(.ct-plus)"); if(b) setTimeout(function(){ try{ save("hide_hdr","1"); applyBars(); }catch(err){} },60); });
})();
