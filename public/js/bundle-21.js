/* ===== 65-gdocs-dark-js.js ===== */
(function(){
  var B=document.body, KEY="gd_dark", built=false;
  /* Docs dark palette. Backgrounds and text/line colours map differently (white is a surface in one, a label colour in the other). */
  var BG={"f9fbfd":"131314","ffffff":"1e1f20","fff":"1e1f20","edf2fa":"282a2c","e9eef6":"2d2f31","d3e3fd":"004a77","f1f3f4":"2b2c2f","e1e5ea":"303134","dde6f3":"303134","d0d0d0":"4a4d51","dadce0":"444746","c7c7c7":"5f6368"};
  var FG={"1f1f1f":"e3e3e3","111111":"e8eaed","111":"e8eaed","000000":"e8eaed","000":"e8eaed","444746":"c4c7c5","5f6368":"9aa0a6","80868b":"9aa0a6","565656":"bdc1c6","7d7d7d":"9aa0a6","041e49":"c2e7ff","0b57d0":"a8c7fa","0842a0":"d3e3fd","dadce0":"444746","c7c7c7":"5f6368"};
  var BGP=/^(background|background-color)$/, FGP=/^(color|fill|stroke|caret-color|outline-color|text-decoration-color|border(-top|-right|-bottom|-left)?-color)$/;
  function hex(r,g,b){ return [r,g,b].map(function(v){ v=(+v).toString(16); return v.length<2?"0"+v:v; }).join(""); }
  function mapVal(prop,val){
    var tbl=BGP.test(prop)?BG:FGP.test(prop)?FG:null; if(!tbl||!val||/gradient|url\(|var\(/.test(val)) return null;
    var m=val.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/); if(!m) return null;
    var h=hex(m[1],m[2],m[3]), t=tbl[h]; if(!t) return null;
    var n=[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)];
    return m[4]!==undefined&&+m[4]<1 ? "rgba("+n.join(",")+","+m[4]+")" : "#"+t;
  }
  function mapGrad(prop,val){                                  // the white "page" is a gradient: recolour the stops
    if(!/^background(-image)?$/.test(prop)||!/gradient\(/.test(val)) return null; var ch=false;
    var o=val.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,function(m,r,g,b){ var t=BG[hex(r,g,b)]; if(!t) return m; ch=true; return "#"+t; });
    return ch?o:null;
  }
  function ruleText(r,out){
    if(r.type===1){
      var sel=r.selectorText, themed=sel.indexOf('[data-theme="gdocs"]')>=0;
      if(!themed&&!/(#|\.)gd-|#gdocs/.test(sel)) return "";
      var decl="", st=r.style;
      for(var i=0;i<st.length;i++){ var p=st[i]; if(p.indexOf("--")===0) continue; var val=st.getPropertyValue(p), v=mapVal(p,val)||mapGrad(p,val); if(v) decl+=p+":"+v+" !important;"; }
      if(!decl) return "";
      return (themed ? sel.split('[data-theme="gdocs"]').join('[data-theme="gdocs"].gd-dark') : 'body[data-theme="gdocs"].gd-dark :is('+sel+')')+"{"+decl+"}\n";
    }
    if((r.type===4||r.type===12)&&r.cssRules){ var inner=""; for(var j=0;j<r.cssRules.length;j++) inner+=ruleText(r.cssRules[j]); return inner ? (r.type===4?"@media "+r.conditionText:"@supports "+r.conditionText)+"{\n"+inner+"}\n" : ""; }
    return "";
  }
  function build(){
    var css="";
    for(var i=0;i<document.styleSheets.length;i++){ var rs; try{ rs=document.styleSheets[i].cssRules; }catch(e){ continue; } if(!rs) continue; for(var j=0;j<rs.length;j++){ try{ css+=ruleText(rs[j]); }catch(e){} } }
    document.getElementById("gdocs-dark-gen").textContent=css; built=true;
  }
  function apply(on){
    if(on&&!built) build();
    B.classList.toggle("gd-dark",!!on&&!B.classList.contains("gd-skin"));
    var m=document.querySelector('meta[name="theme-color"]'); if(m){ if(on){ m.dataset.gdPrev=m.content; m.content="#131314"; } else if(m.dataset.gdPrev) m.content=m.dataset.gdPrev; }
  }
  function get(){ try{ return localStorage.getItem(KEY)==="1"; }catch(e){ return false; } }
  window.gdDark={ get:get, apply:apply, toggle:function(){ var on=!B.classList.contains("gd-dark"); try{ localStorage.setItem(KEY,on?"1":"0"); }catch(e){} apply(on); return on; } };
  if(get()) apply(true);
})();
