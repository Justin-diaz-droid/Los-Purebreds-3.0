/* ===== 38-sx-profile-js.js ===== */
(function(){
  function build(){
    var $ = function(i){ return document.getElementById(i); };
    var stg = $("stg"), hi = $("hi"), pv = $("pfpprev"), pb = $("pfpbtn"), pr = $("pfprm"), pf = $("pfpfile");
    if(!(stg && stg.classList.contains("sx") && hi && pv && pb && pr && pf)) return;
    var card = hi.closest(".stg-card"); if(!card || card.classList.contains("sx-prof")) return;
    var g = card.querySelector(":scope > .sx-group"); if(!g) return;
    card.classList.add("sx-prof");

    /* big round picture + name + Edit, like an iOS contact card */
    var hero = document.createElement("div"); hero.className = "spf-hero";
    var av = document.createElement("div"); av.className = "spf-av"; av.setAttribute("role", "button"); av.tabIndex = 0; av.setAttribute("aria-label", "Change profile picture");
    var cam = document.createElement("span"); cam.className = "spf-cam"; cam.textContent = "\uD83D\uDCF7";
    av.appendChild(pv); av.appendChild(cam);
    var nm = document.createElement("div"); nm.className = "spf-name";
    var ed = document.createElement("button"); ed.type = "button"; ed.className = "spf-edit"; ed.textContent = "Edit";
    var sub = document.createElement("div"); sub.className = "spf-sub"; sub.textContent = "Everyone in the chat sees this";
    hero.appendChild(av); hero.appendChild(nm); hero.appendChild(ed); hero.appendChild(sub);
    av.onclick = ed.onclick = function(){ pb.click(); };
    av.onkeydown = function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); pb.click(); } };

    /* grouped list: Name row, then the photo actions as blue / red rows */
    var field = document.createElement("label"); field.className = "spf-field";
    var fl = document.createElement("span"); fl.textContent = "Name";
    hi.placeholder = "Your name";
    field.appendChild(fl); field.appendChild(hi);
    pb.textContent = "Choose Photo\u2026"; pb.classList.add("spf-btn");
    pr.textContent = "Remove Photo"; pr.classList.add("spf-btn", "danger");
    g.textContent = "";
    g.classList.add("spf-list");
    g.appendChild(field); g.appendChild(pb); g.appendChild(pr); g.appendChild(pf);

    var note = document.createElement("div"); note.className = "stg-note";
    note.textContent = "Your name (up to 12 characters) and photo show next to your messages and in the online list. Changes apply when you press Save.";
    card.insertBefore(hero, g); card.appendChild(note);

    function mirror(){
      nm.textContent = (hi.value || "").trim() || "Your name";
      pr.hidden = !/url\(/.test(pv.style.background || "");      // nothing to remove until there is a photo
    }
    hi.addEventListener("input", mirror);
    new MutationObserver(mirror).observe(pv, {attributes:true, attributeFilter:["style"]});
    new MutationObserver(function(){ if(stg.classList.contains("open")) setTimeout(mirror, 0); }).observe(stg, {attributes:true, attributeFilter:["class"]});
    mirror();
  }
  function init(){ build(); setTimeout(build, 400); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
