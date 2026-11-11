/* ===== 36-stg-exp-js.js ===== */
(function(){
  var $ = function(id){ return document.getElementById(id); };
  var stg = $("stg"), scroll = document.querySelector(".stg-scroll"), saveBtn = $("save");
  if(!stg || !scroll || !saveBtn) return;
  var LS = "pb_autologin";
  function get(){ try{ return localStorage.getItem(LS) === "1"; }catch(e){ return false; } }
  function put(on){ try{ if(on) localStorage.setItem(LS, "1"); else localStorage.removeItem(LS); }catch(e){} }

  var card = document.createElement("div"); card.className = "stg-card"; card.id = "stg-exp";
  card.innerHTML = '<h3>\uD83E\uDDEA Experimental</h3>' +
    '<div class="xnote">Features that are still being tested. They can change or break.</div>' +
    '<label class="chk"><input type="checkbox" id="x-auto">Auto login: sign in automatically on this device</label>' +
    '<div class="xnote">Skips the join screen when you open the page. It needs your name and password saved on this device, so join once normally first. Press Save changes to apply.</div>';
  scroll.appendChild(card);

  /* each time Settings opens, show the saved value */
  var wasOpen = false;
  new MutationObserver(function(){
    var open = stg.classList.contains("open");
    if(open && !wasOpen){ $("x-auto").checked = get(); }
    wasOpen = open;
  }).observe(stg, {attributes:true, attributeFilter:["class"]});

  /* only saved when you press Save changes (Cancel throws it away, like every other setting) */
  var prev = saveBtn.onclick;
  saveBtn.onclick = function(){ if(stg.classList.contains("open")) put($("x-auto").checked); return prev ? prev.apply(this, arguments) : undefined; };
})();
