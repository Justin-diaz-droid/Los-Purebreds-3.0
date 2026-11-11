/* ===== 66-gdocs-skin-js.js ===== */
(function(){
  var B=document.body, ST=document.getElementById("gdocs-skin-gen");
  var cx=document.createElement("canvas").getContext("2d");
  function rgb(str){
    if(!str) return null; cx.fillStyle="#010203"; cx.fillStyle=String(str); var v=String(cx.fillStyle), m;
    if((m=/^#([0-9a-f]{6})$/i.exec(v))){ if(m[1]==="010203"&&!/010203/.test(String(str))) return null; var n=parseInt(m[1],16); return [n>>16&255,n>>8&255,n&255]; }
    if((m=/^rgba?\(([^)]+)\)/.exec(v))){ var q=m[1].split(",").map(parseFloat); return [q[0],q[1],q[2]]; }
    return null;
  }
  function hx(c){ return c.map(function(v){ v=Math.max(0,Math.min(255,Math.round(v))).toString(16); return v.length<2?"0"+v:v; }).join(""); }
  function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
  function lum(c){ var f=function(v){ v/=255; return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4); }; return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]); }
  function palette(name){
    var prev=B.getAttribute("data-theme"), sk=B.classList.contains("gd-skin"), dk=B.classList.contains("gd-dark");
    B.classList.remove("gd-skin","gd-dark"); B.setAttribute("data-theme",name);
    var cs=getComputedStyle(B), g=function(k){ return rgb(cs.getPropertyValue(k).trim()); };
    var p={bg:g("--bg"),side:g("--side"),row:g("--row"),input:g("--input"),line:g("--line"),text:g("--text"),muted:g("--muted"),accent:g("--accent"),on:g("--on-accent")};
    B.setAttribute("data-theme",prev); if(sk) B.classList.add("gd-skin"); if(dk) B.classList.add("gd-dark");
    var dark; p.bg=p.bg||[0,0,0]; dark=lum(p.bg)<.4;
    p.text=p.text||(dark?[240,240,240]:[30,30,30]); p.muted=p.muted||mix(p.text,p.bg,.45);
    p.row=p.row||mix(p.bg,p.text,.1); p.input=p.input||p.side||mix(p.bg,p.text,.05); p.line=p.line||mix(p.bg,p.text,.2);
    p.accent=p.accent||[10,132,255]; p.on=p.on||[255,255,255]; p.dark=dark; return p;
  }
  function maps(p){
    var surf=p.input, sel=mix(p.bg,p.accent,.3), soft=mix(p.row,p.text,.05);
    var BG={"f9fbfd":p.bg,"ffffff":surf,"fff":surf,"edf2fa":p.row,"e9eef6":p.row,"d3e3fd":sel,"f1f3f4":surf,"e1e5ea":soft,"dde6f3":soft,"d0d0d0":p.line,"dadce0":p.line,"c7c7c7":mix(p.line,p.text,.3),"0b57d0":p.accent};
    var FG={"1f1f1f":p.text,"111111":p.text,"111":p.text,"000000":p.text,"000":p.text,"444746":mix(p.text,p.bg,.2),"5f6368":p.muted,"80868b":p.muted,"7d7d7d":p.muted,"565656":p.muted,"747775":p.muted,"041e49":p.text,"0b57d0":p.accent,"0842a0":mix(p.accent,p.text,.35),"dadce0":p.line,"c7c7c7":mix(p.line,p.text,.3)};
    var o={BG:{},FG:{}}; for(var k in BG) o.BG[k]=hx(BG[k]); for(var k2 in FG) o.FG[k2]=hx(FG[k2]); return o;
  }
  var BGP=/^(background|background-color)$/, FGP=/^(color|fill|stroke|caret-color|outline-color|text-decoration-color|border(-top|-right|-bottom|-left)?-color)$/;
  function mapVal(M,prop,val){
    var tbl=BGP.test(prop)?M.BG:FGP.test(prop)?M.FG:null; if(!tbl||!val||/gradient|url\(|var\(/.test(val)) return null;
    var m=val.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/); if(!m) return null;
    var t=tbl[hx([+m[1],+m[2],+m[3]])]; if(!t) return null;
    var n=[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)];
    return m[4]!==undefined&&+m[4]<1 ? "rgba("+n.join(",")+","+m[4]+")" : "#"+t;
  }
  function mapGrad(M,prop,val){
    if(!/^background(-image)?$/.test(prop)||!/gradient\(/.test(val)) return null; var ch=false;
    var o=val.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,function(m,r,g,b){ var t=M.BG[hx([+r,+g,+b])]; if(!t) return m; ch=true; return "#"+t; });
    return ch?o:null;
  }
  var TAG='[data-theme="gdocs"]';
  function ruleText(M,r){
    if(r.type===1){
      var sel=r.selectorText, themed=sel.indexOf(TAG)>=0;
      if(!themed&&!/(#|\.)gd-|#gdocs/.test(sel)) return "";
      var decl="", st=r.style;
      for(var i=0;i<st.length;i++){ var p=st[i]; if(p.indexOf("--")===0) continue; var val=st.getPropertyValue(p), v=mapVal(M,p,val)||mapGrad(M,p,val); if(v) decl+=p+":"+v+" !important;"; }
      if(!decl) return "";
      return (themed ? sel.split(TAG).join(TAG+".gd-skin") : 'body[data-theme="gdocs"].gd-skin :is('+sel+')')+"{"+decl+"}\n";
    }
    if((r.type===4||r.type===12)&&r.cssRules){ var inner=""; for(var j=0;j<r.cssRules.length;j++) inner+=ruleText(M,r.cssRules[j]); return inner ? (r.type===4?"@media "+r.conditionText:"@supports "+r.conditionText)+"{\n"+inner+"}\n" : ""; }
    return "";
  }
  function build(p){
    var M=maps(p), css="";
    for(var i=0;i<document.styleSheets.length;i++){
      var sh=document.styleSheets[i], id=sh.ownerNode&&sh.ownerNode.id; if(id==="gdocs-dark-gen"||id==="gdocs-skin-gen") continue;
      var rs; try{ rs=sh.cssRules; }catch(e){ continue; } if(!rs) continue;
      for(var j=0;j<rs.length;j++){ try{ css+=ruleText(M,rs[j]); }catch(e){} }
    }
    var c=function(a){ return "#"+hx(a); }, bgc=c(p.bg);
    var base='html body'+TAG+'.gd-skin{--bg:'+bgc+';--side:'+bgc+';--row:'+c(p.row)+';--input:'+c(p.input)+';--line:'+c(p.line)+';--text:'+c(p.text)+';--muted:'+c(p.muted)+';--accent:'+c(p.accent)+';--on-accent:'+c(p.on)+';--t-me:'+c(p.text)+';--t-on:'+c(p.text)+';color-scheme:'+(p.dark?'dark':'light')+';background:'+bgc+';color:'+c(p.text)+'}\n'+
      'html:has(body'+TAG+'.gd-skin){background:'+bgc+';color-scheme:'+(p.dark?'dark':'light')+'}\n';
    return base+css;
  }
  var cache={};
  function apply(){
    var sk=window.__pbSkin||"", on=B.getAttribute("data-theme")==="gdocs"&&sk&&sk!=="gdocs";
    if(!on){
      B.classList.remove("gd-skin"); ST.textContent="";
      try{ if(window.gdDark) window.gdDark.apply(window.gdDark.get()); }catch(e){}
      return;
    }
    var p=palette(sk); ST.textContent=build(p);
    B.classList.add("gd-skin"); B.classList.remove("gd-dark");
    var m=document.querySelector('meta[name="theme-color"]'); if(m) m.content="#"+hx(p.bg);
  }
  window.__gdSkinApply=apply;
  var skinCache={};
  window.__gdSkinCSS=function(name){   /* css for a given skin, for the Settings live preview (does not touch the real page) */
    if(!name||name==="gdocs") return "";
    if(skinCache[name]) return skinCache[name];
    try{ return (skinCache[name]=build(palette(name))); }catch(e){ return ""; }
  };
  new MutationObserver(function(){ if(B.getAttribute("data-theme")==="gdocs"&&window.__pbSkin&&!B.classList.contains("gd-skin")) apply(); }).observe(B,{attributes:true,attributeFilter:["data-theme"]});
  apply();
})();
