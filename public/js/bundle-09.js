/* ===== 26-edit-hist-js.js ===== */
/* Edit history window, opened from the "✏️ Edit history" buttons next to Changelog (top bar + sidebar).
   Lists every edited message with the original text and each edit (who + when). Visible to everyone. */
(function(){
  const $h = id => document.getElementById(id), pop = $h("ehist"), body = $h("ehbody");
  const close = () => pop.classList.remove("open");
  $h("ehx").onclick = close; pop.addEventListener("click", e => { if(e.target === pop) close(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });
  const when = t => t ? new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
  const CH = { gal: "Gallery", shame: "Hall of shame", polls: "Polls" };
  const lastT = l => { const h = l.eh; return (h && h.length && h[h.length - 1].t) || l.v || 0; };
  const visible = l => !!l && !l.del && ((l.to || l.g) ? (l.c === uid || l.to === uid) : true);   // other people's hidden replies stay private
  function el(tag, cls, txt){ const d = document.createElement(tag); if(cls) d.className = cls; if(txt != null) d.textContent = txt; return d; }
  function item(parent, label, text, cur){
    const d = el("div", "eit" + (cur ? " cur" : "")); d.append(el("small", "", label), el("div", "", text)); parent.appendChild(d);
  }
  function open(){
    body.replaceChildren();
    const rows = logs.filter(l => visible(l) && l.edited && !(l.img || l.aud || l.fl || l.poll));
    const withH = rows.filter(l => Array.isArray(l.eh) && l.eh.length).sort((a, b) => lastT(b) - lastT(a));
    withH.forEach(l => {
      const g = el("div", "egrp"), h = l.eh;
      const hd = el("h4", "", "Message by " + l.u); if(CH[l.ch]) hd.appendChild(el("span", "", " · " + CH[l.ch])); g.appendChild(hd);
      item(g, "Original" + (h[0].t ? " · first changed " + when(h[0].t) : ""), h[0].o, false);
      h.forEach((e, i) => item(g, "Edit " + (i + 1) + " by " + (e.u || "unknown") + (e.t ? " · " + when(e.t) : ""), i + 1 < h.length ? h[i + 1].o : l.b, i + 1 === h.length));
      body.appendChild(g);
    });
    const old = rows.length - withH.length;
    if(!withH.length) body.appendChild(el("div", "enone", rows.length ? "No history was recorded for the edited messages here (they were edited before tracking was added)." : "No messages have been edited yet."));
    else if(old > 0) body.appendChild(el("div", "enone", old + " other edited message" + (old === 1 ? " was" : "s were") + " changed before tracking was added, so there's no history for " + (old === 1 ? "it." : "them.")));
    pop.classList.add("open");
  }
  window.__pbOpenEditHist = open;   // the Google Docs theme's history button opens this too
  /* buttons next to the Changelog buttons */
  const cl = $h("cl-open");
  if(cl && !$h("eh-open")){ const b = el("button", "stg-btn", "✏️ Edit history"); b.id = "eh-open"; b.type = "button"; b.addEventListener("click", open); cl.insertAdjacentElement("afterend", b); }
  const hdr = $h("hdr");
  if(hdr && !$h("hdr-eh")){ const b = el("button"); b.id = "hdr-eh"; b.type = "button"; b.title = "Edit history — see what edited messages used to say"; b.setAttribute("aria-haspopup", "dialog"); b.innerHTML = '\u270f\ufe0f<span class="lbl">Edit history</span>'; b.addEventListener("click", open); hdr.appendChild(b); }
})();

;
/* ===== 27-logout-autojoin.js ===== */
(function(){
  /* ---- Settings: Log out button ---- */
  const card = document.createElement("div"); card.className = "stg-card";
  card.innerHTML = '<h3>🚪 Account</h3><div class="stg-note">Signs you out on this device and takes you back to the sign-in screen. You\'ll need your password to get back in.</div><div class="stg-row"><button id="logoutbtn" type="button" class="btn" style="background:#ff453a;color:#fff">Log out</button></div>';
  document.querySelector(".stg-scroll").appendChild(card);
  document.getElementById("logoutbtn").onclick = () => {
    if(!confirm("Log out and go back to the sign-in screen?")) return;
    try { myPwH = ""; } catch(e){}
    ["pb_pwh", "chat_pwh", "pb_admin"].forEach(k => { try { save(k, ""); } catch(e){} });   // forget the saved password (and owner unlock) so nothing signs you straight back in
    try { window.__entering = false; } catch(e){}
    location.reload();                                                                         // fresh sign-in screen, connection fully closed
  };

  /* ---- auto join: you've already entered the room code and made an account on this device ---- */
  window.addEventListener("load", () => setTimeout(() => {
    try {
      if(window.__entering || window.__autoCancel) return;
      const g = document.getElementById("gate");
      if(!g || g.style.display === "none") return;
      const hasAccount = load("pb_autologin", "") === "1" && load("pb_code", "") === ROOM_CODE && !!load("pb_pwh", "") && load("chat_usr", "User") !== "User";   // Settings > Experimental > Auto login
      if(!hasAccount) return;
      if(!document.getElementById("g-name").value.trim()) return;
      window.__autoJoined = true;
      document.getElementById("g-go").click();
    } catch(e){}
  }, 0));
})();

;
/* ===== 28-boot-reveal.js ===== */
(function(){
  const d = document.documentElement, g = document.getElementById("gate");
  const auto = d.classList.contains("autoload");
  if(auto){ try { document.getElementById("al-sub").textContent = "Signing in as " + localStorage.getItem("chat_usr"); } catch(e){} }
  const showGate = () => d.classList.remove("booting");
  if(!auto){
    const go = () => requestAnimationFrame(showGate);
    if(document.readyState === "complete") go(); else window.addEventListener("load", go);
    return;
  }
  showGate();                                   // the pop-up covers the sign-in screen while we auto join
  let t0 = Date.now(), saw = false, done = false;
  window.addEventListener("load", () => { t0 = Date.now(); });
  function finish(){
    if(done) return; done = true; clearInterval(iv);
    d.classList.add("al-out");
    setTimeout(() => d.classList.remove("autoload", "al-out"), 200);
  }
  const skip = document.getElementById("al-skip");
  if(skip) skip.onclick = () => {                 // stay out: cancel the auto sign-in and show the normal login screen
    window.__autoCancel = true;
    if(window.__entering && window.__leave) window.__leave("");
    g.style.display = "flex"; g.classList.remove("leaving");
    finish();
  };
  const iv = setInterval(() => {
    const open = g.style.display === "none";
    if(window.__entering || window.__autoJoined) saw = true;
    if(open) return finish();                                    // chat opened
    if(saw && !window.__entering) return finish();               // join failed: show the sign-in screen with its error
    const waited = Date.now() - t0;
    if((!saw && waited > 6000) || waited > 45000) finish();      // auto join never started / took too long
  }, 80);
})();

;
/* ===== 29-fsel-js.js ===== */
(function(){
  /* every <select> keeps its look + layout; only its pop-up list is replaced by an animated one */
  const pop = document.createElement("div"); pop.id = "fsel-pop"; pop.setAttribute("role", "listbox"); document.body.appendChild(pop);
  let cur = null, kb = -1, hideT = 0;
  const optsOf = sel => [...sel.options];

  function build(sel){
    pop.replaceChildren(); let i = 0, lastG = null;
    optsOf(sel).forEach((o, idx) => {
      const g = o.parentNode && o.parentNode.tagName === "OPTGROUP" ? o.parentNode : null;
      if(g && g !== lastG){ const h = document.createElement("div"); h.className = "fg"; h.textContent = g.label; pop.appendChild(h); }
      lastG = g;
      const d = document.createElement("div"); d.className = "fo" + (idx === sel.selectedIndex ? " sel" : "") + ((o.disabled || (g && g.disabled)) ? " dis" : "");
      d.setAttribute("role", "option"); d.dataset.i = idx; d.style.setProperty("--i", Math.min(i++, 14)); d.textContent = o.textContent;
      d.onclick = () => pick(sel, idx);
      pop.appendChild(d);
    });
  }
  function place(sel){
    const r = sel.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    pop.style.maxHeight = ""; pop.style.minWidth = Math.max(r.width, 120) + "px"; pop.style.maxWidth = Math.min(440, vw - 16) + "px";
    pop.style.left = "0px"; pop.style.top = "0px";
    const need = pop.scrollHeight + 10, below = vh - r.bottom - 10, above = r.top - 10;
    const up = below < Math.min(need, 240) && above > below;
    const avail = Math.max(120, up ? above : below), h = Math.min(need, 400, avail);
    pop.style.maxHeight = h + "px";
    const w = pop.offsetWidth;
    pop.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + "px";
    pop.style.top = (up ? r.top - 6 - h : r.bottom + 6) + "px";
    pop.classList.toggle("up", up);
  }
  function open(sel){
    if(sel.disabled) return;
    if(cur === sel){ close(); return; }
    if(cur) cur.classList.remove("fsel-open");
    clearTimeout(hideT); cur = sel; kb = sel.selectedIndex;
    build(sel); place(sel);
    sel.classList.add("fsel-open"); pop.classList.remove("open"); void pop.offsetWidth; pop.classList.add("open");
    const s = pop.querySelector(".sel"); if(s) s.scrollIntoView({ block: "nearest" });
  }
  function close(){
    if(!cur) return;
    cur.classList.remove("fsel-open"); pop.classList.remove("open"); cur = null;
  }
  function pick(sel, i){
    const o = sel.options[i]; if(!o || o.disabled) return;
    close(); sel.focus({ preventScroll: true });
    if(i === sel.selectedIndex) return;
    sel.selectedIndex = i;
    sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function mark(){ [...pop.querySelectorAll(".fo")].forEach(e => e.classList.toggle("kb", +e.dataset.i === kb)); const k = pop.querySelector(".kb"); if(k) k.scrollIntoView({ block: "nearest" }); }

  document.addEventListener("pointerdown", e => { if(cur && !pop.contains(e.target) && e.target !== cur) close(); }, true);
  window.addEventListener("resize", close);
  window.addEventListener("scroll", e => { if(cur && !pop.contains(e.target) && (e.target === document || (e.target.contains && e.target.contains(cur)))) close(); }, true);
  document.addEventListener("keydown", e => {
    if(!cur) return;
    const n = cur.options.length;
    if(e.key === "Escape"){ e.preventDefault(); const s = cur; close(); s.focus({ preventScroll: true }); }
    else if(e.key === "Tab"){ close(); }
    else if(e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); let k = kb, t = 0; do { k = (k + (e.key === "ArrowDown" ? 1 : -1) + n) % n; t++; } while(cur.options[k].disabled && t < n); kb = k; mark(); }
    else if(e.key === "Enter" || e.key === " "){ e.preventDefault(); if(kb >= 0) pick(cur, kb); }
  }, true);

  function enhance(sel){
    if(sel._fsel || sel.multiple || sel.size > 1 || sel.dataset.native != null) return; sel._fsel = 1;
    sel.addEventListener("mousedown", e => { if(e.button !== 0 || sel.disabled) return; e.preventDefault(); sel.focus({ preventScroll: true }); open(sel); });
    let t0 = null;
    sel.addEventListener("touchstart", e => { const t = e.touches[0]; t0 = t ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
    sel.addEventListener("touchend", e => {
      if(!t0 || sel.disabled) return; const t = e.changedTouches[0], moved = t && Math.hypot(t.clientX - t0.x, t.clientY - t0.y) > 10; t0 = null;
      if(moved) return; e.preventDefault(); open(sel);                // stops the phone's own picker from also opening
    }, { passive: false });
    sel.addEventListener("keydown", e => { if(cur) return; if((e.key === " " && !e.ctrlKey && !e.metaKey) || (e.altKey && e.key === "ArrowDown")){ e.preventDefault(); open(sel); } });
  }
  document.querySelectorAll("select").forEach(enhance);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {          // dropdowns that scripts add later (announcements, emojis, boards…)
    if(n.nodeType !== 1 || n === pop) return;
    if(n.tagName === "SELECT") enhance(n); else if(n.querySelectorAll) n.querySelectorAll("select").forEach(enhance);
  }))).observe(document.documentElement, { childList: true, subtree: true });
})();

;
/* ===== 30-tier-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const MAXL = 6, MAXI = 300, MAXT = 10;      /* MAXI = most pictures per tier list (was 60) */
  const DEF = [["S","#ff7f7f"],["A","#ffbf7f"],["B","#ffdf7f"],["C","#ffff7f"],["D","#bfff7f"],["F","#7fff7f"]];
  const okId = s => typeof s === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(s) && s !== "__proto__";
  const okHex = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
  const okIm = x => typeof x === "string" && x.length <= 12000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(x);
  const rid = p => p + Math.random().toString(36).slice(2, 9);
  const isMod = c => window.__pbIsMod ? !!window.__pbIsMod(c) : false;
  const lum = c => { const n = parseInt(c.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); };

  /* ---------- state: lists -> tiers + images. The host orders every change and sends it to everyone ---------- */
  let T = { lists: {} }, cur = load("pb_tl_cur", "");
  try { const s = JSON.parse(load("pb_tier", "")); if(s && typeof s.lists === "object") T = s; } catch(e){}
  let persistT = 0;
  const dbP = new Promise(res => { try { const r = indexedDB.open("purebred-board", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch(e){ res(null); } });
  async function idbPut(str, key){
    const db = await dbP, k = key || "tierlists";
    if(!db){ if(k === "tierlists" && str.length < 2000000) save("pb_tier", str); return; }
    try {
      const tx = db.transaction("kv", "readwrite"); tx.objectStore("kv").put(str, k);
      tx.oncomplete = () => { if(k === "tierlists") try { localStorage.removeItem("pb_tier"); } catch(e){} };   // only forget the backup once the write really landed
      const bad = () => { if(k === "tierlists" && str.length < 2000000) save("pb_tier", str); };
      tx.onerror = bad; tx.onabort = bad;
    } catch(e){ if(k === "tierlists" && str.length < 2000000) save("pb_tier", str); }
  }
  let idbDone = false, idbWait = [];
  const whenLoaded = f => { if(idbDone) f(); else idbWait.push(f); };
  const idbFinish = () => { idbDone = true; const q = idbWait; idbWait = []; q.forEach(f => { try { f(); } catch(e){} }); };
  dbP.then(db => { if(!db){ idbFinish(); return; } try {
    const q = db.transaction("kv").objectStore("kv").get("tierlists");
    q.onsuccess = () => { try {
      const s = JSON.parse(q.result || "");
      if(s && typeof s.lists === "object"){                  // MERGE (never skip): lists that arrived before the saved copy loaded must not hide it
        Object.keys(s.lists).forEach(id => { if(!T.lists[id]) T.lists[id] = s.lists[id]; });
        if(!T.lists[cur]) cur = Object.keys(T.lists)[0] || ""; schedule();
      }
    } catch(e){} idbFinish(); };
    q.onerror = () => idbFinish();
  } catch(e){ idbFinish(); } });
  setTimeout(idbFinish, 3000);                              // never wait forever
  const cleanTiers = a => {
    if(!Array.isArray(a)) return null; const seen = new Set(), out = [];
    for(const t of a.slice(0, MAXT)){ if(!t || !okId(t.i) || seen.has(t.i)) continue; seen.add(t.i); out.push({ i: t.i, n: String(t.n == null ? "" : t.n).slice(0, 16), c: okHex(t.c) ? t.c : "#cccccc" }); }
    return out.length ? out : null;
  };
  const defTiers = () => DEF.map((x, k) => ({ i: "t" + k, n: x[0], c: x[1] }));
  const title = d => String(d || "").trim().slice(0, 40) || "Tier list";

  function norm(d, who){                        // check + clean one change
    if(!d || typeof d !== "object" || !okId(d.l)) return null;
    const o = { k: d.k, l: d.l };
    switch(d.k){
      case "nl": o.n = title(d.n); o.tiers = cleanTiers(d.tiers) || defTiers(); break;
      case "dl": case "cl": break;
      case "tn": o.n = title(d.n); o.tiers = cleanTiers(d.tiers); if(!o.tiers) return null; break;
      case "ai": if(!okId(d.i) || !okIm(d.im)) return null; o.i = d.i; o.im = d.im; o.t = typeof d.t === "string" ? d.t.slice(0, 40) : ""; o.o = isFinite(+d.o) ? +d.o : Date.now(); break;
      case "mi": if(!okId(d.i) || !isFinite(+d.o)) return null; o.i = d.i; o.t = typeof d.t === "string" ? d.t.slice(0, 40) : ""; o.o = +d.o; break;
      case "di": if(!okId(d.i)) return null; o.i = d.i; break;
      default: return null;
    }
    o.u = who ? who.uid : (okId(d.u) ? d.u : ""); o.by = who ? who.name : String(d.by || "").slice(0, 12);
    return o;
  }
  function apply(o){
    const L = T.lists;
    if(o.k === "nl"){
      if(L[o.l] || Object.keys(L).length >= MAXL) return false;
      L[o.l] = { id: o.l, n: o.n, by: o.by, u: o.u, tiers: o.tiers, items: {} };
      if(!cur || o.u === uid) cur = o.l; if(o.u === uid) newSel = o.l; return true;
    }
    const l = L[o.l]; if(!l) return false;
    if(o.k === "dl"){ delete L[o.l]; if(cur === o.l) cur = Object.keys(L)[0] || ""; return true; }
    if(o.k === "tn"){
      l.n = o.n; l.tiers = o.tiers; const ids = new Set(o.tiers.map(t => t.i));
      Object.values(l.items).forEach(it => { if(it.t && !ids.has(it.t)) it.t = ""; }); return true;
    }
    if(o.k === "cl"){ Object.values(l.items).forEach(it => { it.t = ""; }); return true; }
    if(o.k === "ai"){
      if(!l.items[o.i] && Object.keys(l.items).length >= MAXI) return false;
      const ok = l.tiers.some(t => t.i === o.t);
      l.items[o.i] = { i: o.i, im: o.im, by: o.by, u: o.u, t: ok ? o.t : "", o: o.o }; if(l.known) l.known.add(o.i); return true;
    }
    if(o.k === "di" && !l.items[o.i] && l.known && l.known.has(o.i)){ l.known.delete(o.i); return true; }
    const it = l.items[o.i]; if(!it) return false;
    if(o.k === "di"){ delete l.items[o.i]; if(l.known) l.known.delete(o.i); return true; }
    if(o.k === "mi"){ it.t = l.tiers.some(t => t.i === o.t) ? o.t : ""; it.o = o.o; return true; }
    return false;
  }
  function perm(o, who){                        // who can do what
    const l = T.lists[o.l];
    switch(o.k){
      case "nl": return !l && Object.keys(T.lists).length < MAXL;
      case "dl": case "tn": case "cl": return !!l && (who.mod || l.u === who.uid);
      case "ai": return !!l && (Object.keys(l.items).length < MAXI || !!l.items[o.i]);
      case "mi": return !!l && !!l.items[o.i];
      case "di": return !!l && !!l.items[o.i] && (who.mod || l.items[o.i].u === who.uid || l.u === who.uid);
    }
    return false;
  }
  window.__pbTierClear = () => { if(!isHost) return; T.lists = {}; cur = ""; changed(); broadcast({ k: "ca" }); };
  function changed(){
    clearTimeout(persistT); persistT = setTimeout(() => { idbPut(JSON.stringify(T, (k, v) => k === "known" ? undefined : v)); save("pb_tl_cur", cur); }, 800);
    schedule();
  }

  /* ---------- network ---------- */
  const broadcast = o => { const m = Object.assign({ t: "TL", i: newId() }, o); conns.forEach(c => { if(c.open && c.uid) try { c.send(m); } catch(e){} }); };
  function sendSnap(conn){
    const H = window.heavy || (f => f());
    whenLoaded(() => {                                      // host: don't tell anyone "you have no lists" before its own saved lists are loaded
      const lists = Object.values(T.lists).map(l => ({ id: l.id, n: l.n, by: l.by, u: l.u, tiers: l.tiers, ids: Object.keys(l.items) }));
      H(() => { try { if(conn.open) conn.send({ t: "TL", i: newId(), k: "snap", lists }); } catch(e){} });
    });
    /* pictures are NOT pushed on join any more (hundreds of them clogged the room for new people) - each person asks for the ones it is missing, see "want" */
  }
  function serveWant(d, from){                   // host: send back the pictures somebody asked for, a few at a time
    const now = Date.now(); if(now - (from.twAt || 0) < 120) return; from.twAt = now;
    const l = okId(d.l) ? T.lists[d.l] : null; if(!l || !Array.isArray(d.ids)) return;
    const its = d.ids.slice(0, 24).filter(okId).map(i => l.items[i]).filter(Boolean);
    for(let a = 0; a < its.length; a += 6){
      const ops = its.slice(a, a + 6).map(it => ({ k: "ai", l: l.id, i: it.i, im: it.im, t: it.t, o: it.o, u: it.u, by: it.by }));
      setTimeout(() => { try { if(from.open) from.send({ t: "TL", i: newId(), k: "batch", ops }); } catch(e){} }, (a / 6) * 60);
    }
  }
  const asked = new Map();                       // picture id -> when I last asked for it
  let askT = 0;
  function askMissing(){
    clearTimeout(askT); askT = 0;
    if(isHost || !document.body.classList.contains("in-tier")) return;
    const now = Date.now(); let total = 0, k = 0;
    Object.values(T.lists).forEach(l => {
      if(!l.known || total >= 24) return;
      const need = [];
      l.known.forEach(i => { if(!l.items[i] && now - (asked.get(i) || 0) > 6000 && total + need.length < 24) need.push(i); });
      if(!need.length) return;
      need.forEach(i => asked.set(i, now)); total += need.length;
      const m = { t: "TL", i: newId(), k: "want", l: l.id, ids: need };
      setTimeout(() => { try { send(m); } catch(e){} }, (k++) * 150);
    });
  }
  const missingCount = l => { let n = 0; if(l && l.known) l.known.forEach(i => { if(!l.items[i]) n++; }); return n; }
  function applySnap(d){
    if(!Array.isArray(d.lists)) return;
    const keep = new Set();
    if(Object.keys(T.lists).some(i => !d.lists.some(m => m && m.id === i))){     // the host's copy is about to remove lists from this device: keep a recoverable backup first
      try { idbPut(JSON.stringify(T, (k, v) => k === "known" ? undefined : v), "tierlists_bak"); } catch(e){}
    }
    d.lists.slice(0, MAXL).forEach(m => {
      if(!m || !okId(m.id)) return; keep.add(m.id);
      const tiers = cleanTiers(m.tiers) || defTiers();
      const l = T.lists[m.id] || (T.lists[m.id] = { id: m.id, n: "", by: "", u: "", tiers, items: {} });
      l.n = title(m.n); l.by = String(m.by || "").slice(0, 12); l.u = okId(m.u) ? m.u : ""; l.tiers = tiers;
      const ids = new Set((Array.isArray(m.ids) ? m.ids : []).filter(okId).slice(0, MAXI));
      Object.keys(l.items).forEach(i => { if(!ids.has(i)) delete l.items[i]; });
      l.known = ids;
    });
    Object.keys(T.lists).forEach(i => { if(!keep.has(i)) delete T.lists[i]; });
    if(!T.lists[cur]) cur = Object.keys(T.lists)[0] || "";
  }
  function hostOp(d, from){
    const who = from ? { uid: from.uid, name: String(from.userName || "").slice(0, 12), mod: isMod(from) } : { uid, name: usr, mod: isMod(null) };
    if(from){ const now = Date.now(); if(now - (from.tlAt || 0) < 100) return; from.tlAt = now; if(window.__pbMuted && window.__pbMuted(who.name, from)) return; }
    if(!idbDone){ whenLoaded(() => { if(from) from.tlAt = 0; hostOp(d, from); }); return; }
    const o = norm(d, who);
    if(!o || !perm(o, who)){ if(from) sendSnap(from); return; }     // not allowed: put their screen back
    if(o.k === "ai") o.o = Date.now() + Math.random();
    if(apply(o)){ changed(); broadcast(o); }
  }
  function sendOp(d){
    if(isHost){ hostOp(d, null); return; }
    const o = norm(d, { uid, name: usr, mod: isMod(null) });
    if(!o || !perm(o, { uid, name: usr, mod: isMod(null) })) return;
    if(apply(o)) changed();                                          // show it right away; the host's copy settles any clash
    try { send(Object.assign({ t: "TL", i: newId() }, d)); } catch(e){}
  }
  /* live "someone is dragging" messages: never stored, only relayed */
  const cl = (v, a, b) => Math.min(b, Math.max(a, +v || 0));
  function cleanG(d){
    if(!d || !okId(d.l) || !okId(d.i)) return null;
    if(d.off) return { k: "g", l: d.l, i: d.i, off: 1 };
    return { k: "g", l: d.l, i: d.i, z: typeof d.z === "string" ? d.z.slice(0, 40) : "", zz: d.zz ? 1 : 0, fx: cl(d.fx, -0.2, 1.2), fy: cl(d.fy, -50, 5000) };
  }
  function sendG(d){
    const o = cleanG(d); if(!o) return;
    if(isHost){ const m = Object.assign({ t: "TL", i: newId(), f: uid, n: usr }, o); conns.forEach(c => { if(c.open && c.uid) try { c.send(m); } catch(e){} }); }
    else { try { send(Object.assign({ t: "TL", i: newId() }, o)); } catch(e){} }
  }
  function hostG(d, from){
    const now = Date.now(); if(now - (from.tgAt || 0) < 45 && !d.off) return; from.tgAt = now;
    const name = String(from.userName || "").slice(0, 12);
    if(window.__pbMuted && window.__pbMuted(name, from)) return;
    const o = cleanG(d); if(!o) return;
    const m = Object.assign({ t: "TL", i: newId(), f: from.uid, n: name }, o);
    conns.forEach(c => { if(c !== from && c.open && c.uid) try { c.send(m); } catch(e){} });
    showRemote(m);                                                   // the host sees it too
  }

  const _h = handle;
  handle = function(d, from){
    if(d && typeof d === "object" && d.t === "TL"){
      if(d.k === "want"){ if(isHost && from.ok2 && !from.denied && from.uid) serveWant(d, from); return; }
      if(d.k === "g"){
        if(isHost){ if(!from.ok2 || from.denied || !from.uid) return; hostG(d, from); }
        else showRemote(d);
        return;
      }
      if(isHost){ if(!from.ok2 || from.denied || !from.uid) return; hostOp(d, from); }
      else if(d.k === "ca"){ T.lists = {}; cur = ""; changed(); }              // an owner cleared every tier list
      else if(d.k === "snap"){ applySnap(d); changed(); }
      else if(d.k === "batch"){ (Array.isArray(d.ops) ? d.ops : []).slice(0, 12).forEach(x => { const o = norm(x, null); if(o && o.k === "ai") apply(o); }); changed(); }
      else { const o = norm(d, null); if(o && apply(o)) changed(); }
      return;
    }
    _h(d, from);
    if(isHost && d && d.t === "P" && from.ok2 && !from.denied && !from.tsent){ from.tsent = 1; sendSnap(from); }
  };

  /* ---------- UI shell ---------- */
  const row = document.createElement("div"); row.className = "row-ch"; row.id = "ch-tier";
  row.innerHTML = '<div class="av-sb" style="font-size:18px">🏆</div><div><b style="font-size:15px">Tier Lists</b><br><span class="csub">Rank things together</span></div>';
  ($$("ch-draw") || $$("ch-gal")).after(row); row.onclick = () => setChannel("tier");
  const tab = document.createElement("button"); tab.type = "button"; tab.dataset.ch = "tier"; tab.textContent = "🏆 Tiers"; tab.onclick = () => setChannel("tier");
  $$("chtabs").appendChild(tab);
  const view = document.createElement("div"); view.id = "tier";
  view.innerHTML = '<div id="ttools"><button class="tbtn tp" id="tlnew" type="button">➕ New list</button><span id="tlmsg"></span></div><div id="tlscroll"><div id="tlempty">No tier lists yet.<br>Tap <b>➕ New list</b> to make one, then add pictures and drag them into tiers.</div><div id="tllists"></div></div>';
  $$("box").after(view);
  const fi = document.createElement("input"); fi.type = "file"; fi.accept = "image/*"; fi.multiple = true; fi.hidden = true; document.body.appendChild(fi);
  const msg = t => { const m = $$("tlmsg"); m.textContent = t; clearTimeout(msg.t); msg.t = setTimeout(() => { m.textContent = ""; }, 4000); };
  const canEdit = l => !!l && (isMod(null) || l.u === uid);

  /* ---------- drawing the board ---------- */
  let drag = null, dirty = false, raf = 0;
  function schedule(){ if(raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }
  const tcache = new Map();                      // item id -> tile element (re-used so big lists don't flicker)
  const remote = new Map();                      // user id -> { n, l, i, z, zz, fx, fy, t, el }
  function tile(it, l){
    const own = isMod(null) || it.u === uid || l.u === uid, hit = tcache.get(it.i);
    if(hit && hit.im === it.im && hit.own === own){ hit.seen = 1; return hit.el; }
    const d = tileNew(it, l); tcache.set(it.i, { el: d, im: it.im, own, seen: 1 }); return d;
  }
  function tileNew(it, l){
    const d = document.createElement("div"); d.className = "ttile"; d.dataset.i = it.i; d.style.backgroundImage = 'url("' + it.im + '")'; d.title = "Added by " + (it.by || "someone");
    if(isMod(null) || it.u === uid || l.u === uid){
      const x = document.createElement("button"); x.type = "button"; x.className = "tx"; x.textContent = "✕"; x.title = "Remove this image";
      x.onpointerdown = e => e.stopPropagation(); x.onclick = e => { e.stopPropagation(); sendOp({ k: "di", l: l.id, i: it.i }); };
      d.appendChild(x);
    }
    return d;
  }
  let secs = new Map(), newSel = "";              // list id -> { el, ghosts } · the list I just made (scroll to it)
  function mkBtn(txt, cls, fn){ const b = document.createElement("button"); b.type = "button"; b.className = "tbtn" + (cls ? " " + cls : ""); b.textContent = txt; b.onclick = fn; return b; }
  function buildSec(l){
    const sec = document.createElement("section"); sec.className = "tsec"; sec.dataset.l = l.id;
    const gh = document.createElement("div"); gh.className = "tghosts";
    const hd = document.createElement("div"); hd.className = "tsh";
    const tt = document.createElement("div"); tt.style.minWidth = "0";
    const ti = document.createElement("div"); ti.className = "tltitle"; ti.textContent = l.n;
    const by = document.createElement("div"); by.className = "tlby"; by.textContent = "Made by " + (l.by || "someone") + " · drag pictures into a tier · everyone can add and rank";
    tt.append(ti, by);
    const bs = document.createElement("div"), mine = canEdit(l); bs.className = "tsb";
    if(mine){ bs.append(mkBtn("✏️ Edit tiers", "", () => { cur = l.id; editTiers(l); }), mkBtn("↺ Reset", "", () => { cur = l.id; resetList(l); })); }
    bs.append(mkBtn("📷 Save picture", "", () => savePic(l)));
    if(mine) bs.append(mkBtn("🗑 Delete", "red", () => delList(l)));
    hd.append(tt, bs);
    const items = Object.values(l.items).sort((a, b) => a.o - b.o), board = document.createElement("div");
    l.tiers.forEach(t => {
      const r = document.createElement("div"); r.className = "trow";
      const lab = document.createElement("div"); lab.className = "tlab"; lab.textContent = t.n; lab.style.background = t.c; lab.style.color = lum(t.c) > 150 ? "#111" : "#fff";
      const z = document.createElement("div"); z.className = "tzone"; z.dataset.t = t.i;
      items.filter(it => it.t === t.i).forEach(it => z.appendChild(tile(it, l)));
      r.append(lab, z); board.appendChild(r);
    });
    const pool = document.createElement("div"); pool.className = "tpool";
    const un = items.filter(it => !l.tiers.some(t => t.i === it.t)), miss = missingCount(l);
    const ph = document.createElement("div"); ph.className = "tphd";
    const pt = document.createElement("div"); pt.textContent = "Unranked images ";
    const pc = document.createElement("span"); pc.textContent = "· " + items.length + "/" + MAXI + " images" + (miss ? " · loading " + miss + " more…" : ""); pt.appendChild(pc);
    ph.append(pt, mkBtn("➕ Add images", "tp", () => { cur = l.id; fi.click(); }));
    const pz = document.createElement("div"); pz.className = "tzone"; pz.dataset.t = ""; un.forEach(it => pz.appendChild(tile(it, l)));
    pool.append(ph, pz);
    sec.append(gh, hd, board, pool);
    secs.set(l.id, { el: sec, ghosts: gh });
    return sec;
  }
  function render(){
    if(!document.body.classList.contains("in-tier")) return;
    const ids = Object.keys(T.lists), host = $$("tllists");
    if(!T.lists[cur]) cur = ids[0] || "";
    tcache.forEach(v => { v.seen = 0; });
    $$("tlempty").style.display = ids.length ? "none" : "";
    secs = new Map(); host.replaceChildren(...ids.map(id => buildSec(T.lists[id])));
    if(ids.some(id => missingCount(T.lists[id])) && !askT) askT = setTimeout(askMissing, 150);
    tcache.forEach((v, k) => { if(!v.seen && !(drag && drag.id === k)) tcache.delete(k); });
    if(drag && !(T.lists[drag.l] && T.lists[drag.l].items[drag.id])){ drag.g.remove(); drag = null; }   // someone deleted the picture I was holding
    if(newSel && secs.has(newSel)){ const s = secs.get(newSel).el; newSel = ""; requestAnimationFrame(() => { try { s.scrollIntoView({ block: "start", behavior: "smooth" }); } catch(e){} }); }
    updateRemote();
  }

  /* ---------- seeing other people drag, live ---------- */
  function showRemote(d){
    if(!d || !okId(d.f) || d.f === uid) return;
    let r = remote.get(d.f);
    if(d.off){ if(r){ if(r.el) r.el.remove(); remote.delete(d.f); updateRemote(); } return; }
    if(!r){ r = { n: String(d.n || "Someone").slice(0, 12), el: null }; remote.set(d.f, r); }
    r.l = d.l; r.i = d.i; r.z = d.z; r.zz = d.zz; r.fx = d.fx; r.fy = d.fy; r.t = Date.now();
    if(d.n) r.n = String(d.n).slice(0, 12);
    if(document.body.classList.contains("in-tier")) updateRemote();
  }
  function updateRemote(){
    tcache.forEach(v => v.el.classList.remove("tremote"));
    let names = [];
    remote.forEach((r, f) => {
      const l = T.lists[r.l], s = secs.get(r.l);
      if(!l || !s || !l.items[r.i]){ if(r.el){ r.el.remove(); r.el = null; } return; }
      names.push(r.n);
      const c = tcache.get(r.i); if(c) c.el.classList.add("tremote");
      const mr = s.el.getBoundingClientRect();
      let x, y;
      const z = r.zz ? [...s.el.querySelectorAll(".tzone")].find(e => e.dataset.t === r.z) : null;
      if(z){ const zr = z.getBoundingClientRect(); x = zr.left - mr.left + r.fx * zr.width; y = zr.top - mr.top + r.fy; }
      else { x = r.fx * mr.width; y = r.fy; }
      if(!r.el){ r.el = document.createElement("div"); r.el.className = "tlg"; r.el.style.setProperty("--gc", colorFor(r.n)); r.el.innerHTML = "<span></span>"; }
      if(r.el.parentNode !== s.ghosts) s.ghosts.appendChild(r.el);
      r.el.style.backgroundImage = 'url("' + l.items[r.i].im + '")'; r.el.firstChild.textContent = r.n;
      r.el.style.left = x + "px"; r.el.style.top = y + "px";
    });
    secs.forEach(s => { [...s.ghosts.children].forEach(e => { if(![...remote.values()].some(r => r.el === e)) e.remove(); }); });
    if(names.length) $$("tlmsg").textContent = "✋ " + names.join(", ") + (names.length > 1 ? " are" : " is") + " dragging…";
    else if($$("tlmsg").textContent.startsWith("✋")) $$("tlmsg").textContent = "";
  }
  setInterval(() => {                               // drop ghosts of people whose connection went quiet
    const now = Date.now(); let ch = false;
    remote.forEach((r, f) => { if(now - r.t > 3000){ if(r.el) r.el.remove(); remote.delete(f); ch = true; } });
    if(ch) updateRemote();
  }, 800);
  window.addEventListener("resize", () => { if(remote.size) updateRemote(); });

  let gAt = 0;
  function sendDragPos(e){
    const now = Date.now(); if(now - gAt < 60) return; gAt = now;
    const s = secs.get(drag.l); if(!s) return;
    const z = zoneAt(e.clientX, e.clientY, drag.l), mr = s.el.getBoundingClientRect();
    if(z){ const zr = z.getBoundingClientRect(); sendG({ l: drag.l, i: drag.id, z: z.dataset.t, zz: 1, fx: (e.clientX - zr.left) / zr.width, fy: e.clientY - zr.top }); }
    else sendG({ l: drag.l, i: drag.id, z: "", zz: 0, fx: (e.clientX - mr.left) / mr.width, fy: e.clientY - mr.top });
  }

  /* ---------- dragging (mouse + touch) ---------- */
  function zoneAt(x, y, lid){ const e = document.elementFromPoint(x, y), z = e && e.closest ? e.closest(".tzone") : null; if(!z) return null; const s = z.closest(".tsec"); return s && s.dataset.l === lid ? z : null; }      // a picture can only be dropped in its own list
  function move(e){
    drag.g.style.left = (e.clientX - drag.ox) + "px"; drag.g.style.top = (e.clientY - drag.oy) + "px";
    view.querySelectorAll(".tzone.tover").forEach(z => z.classList.remove("tover"));
    const z = zoneAt(e.clientX, e.clientY, drag.l); if(z) z.classList.add("tover");
    const sc = $$("tlscroll"), r = sc.getBoundingClientRect();
    if(e.clientY < r.top + 60) sc.scrollTop -= 14; else if(e.clientY > r.bottom - 60) sc.scrollTop += 14;
    sendDragPos(e);
  }
  function finish(e, cancel){
    const d = drag; drag = null; d.g.remove(); d.el.classList.remove("tdrag");
    sendG({ l: d.l, i: d.id, off: 1 });
    view.querySelectorAll(".tzone.tover").forEach(z => z.classList.remove("tover"));
    const l = T.lists[d.l], z = cancel ? null : zoneAt(e.clientX, e.clientY, d.l);
    if(l && z){
      const sibs = [...z.querySelectorAll(".ttile")].filter(x => x.dataset.i !== d.id);
      let idx = sibs.length;
      for(let k = 0; k < sibs.length; k++){ const r = sibs[k].getBoundingClientRect(); if(e.clientY < r.top || (e.clientY <= r.bottom && e.clientX < r.left + r.width / 2)){ idx = k; break; } }
      const ov = k => (l.items[sibs[k].dataset.i] || {}).o || 0;
      const o = sibs.length === 0 ? Date.now() : idx === 0 ? ov(0) - 1000 : idx >= sibs.length ? ov(sibs.length - 1) + 1000 : (ov(idx - 1) + ov(idx)) / 2;
      const it = l.items[d.id], t = z.dataset.t;
      if(it && (it.t !== t || Math.abs(it.o - o) > 1e-9)) sendOp({ k: "mi", l: d.l, i: d.id, t, o });
    }
    schedule();
  }
  view.addEventListener("pointerdown", e => {
    const el = e.target.closest(".ttile"); if(!el || e.target.closest(".tx") || drag) return;
    if(e.pointerType === "mouse" && e.button !== 0) return;
    const sec = el.closest(".tsec"), l = sec && T.lists[sec.dataset.l]; if(!l || !l.items[el.dataset.i]) return;
    cur = l.id; e.preventDefault();
    const r = el.getBoundingClientRect(), g = el.cloneNode(true);
    g.className = "ttile tghost"; g.style.width = r.width + "px"; g.style.height = r.height + "px"; g.querySelectorAll(".tx").forEach(x => x.remove()); document.body.appendChild(g);
    drag = { id: el.dataset.i, l: l.id, el, g, ox: e.clientX - r.left, oy: e.clientY - r.top, pid: e.pointerId };
    el.classList.add("tdrag"); gAt = 0; move(e);
  });
  window.addEventListener("pointermove", e => { if(drag && e.pointerId === drag.pid) move(e); });
  window.addEventListener("pointerup", e => { if(drag && e.pointerId === drag.pid) finish(e, false); });
  window.addEventListener("pointercancel", e => { if(drag) finish(e, true); });

  /* ---------- adding pictures ---------- */
  function shrink(f, cb){
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const side = Math.min(im.width, im.height) || 1, sx = (im.width - side) / 2, sy = (im.height - side) / 2;
      for(const [s, q] of [[88, 0.72], [72, 0.62], [56, 0.55]]){
        const c = document.createElement("canvas"); c.width = c.height = s; const x = c.getContext("2d");
        x.fillStyle = "#222"; x.fillRect(0, 0, s, s); x.drawImage(im, sx, sy, side, side, 0, 0, s, s);
        const d = c.toDataURL("image/jpeg", q); if(okIm(d)){ cb(d); return; }
      }
      cb("");
    };
    im.onerror = () => { URL.revokeObjectURL(url); cb(""); };
    im.src = url;
  }
  async function addFiles(list, tierId, listId){
    const lid = T.lists[listId] ? listId : cur; cur = lid;
    const fs = [...list].filter(f => f && f.type && f.type.startsWith("image/")).slice(0, 60);
    const l = T.lists[lid]; if(!l){ msg("Make a tier list first (➕ New list)."); return; }
    let n = 0;
    for(const f of fs){
      if(Object.keys(l.items).length >= MAXI){ msg("This list is full (" + MAXI + " images)."); break; }
      if(f.size > 12 * 1024 * 1024){ msg("Skipped a picture over 12 MB."); continue; }
      const d = await new Promise(res => shrink(f, res)); if(!d){ msg("Couldn't use one of those pictures."); continue; }
      sendOp({ k: "ai", l: lid, i: rid("i"), im: d, t: tierId || "", o: Date.now() + Math.random() }); n++;
      await new Promise(r => setTimeout(r, 120));
    }
    if(n) msg("Added " + n + (n === 1 ? " picture" : " pictures") + (tierId ? "." : " — drag them into a tier."));
  }
  window.__tierAdd = addFiles;
  fi.onchange = () => { const fs = [...fi.files]; fi.value = ""; addFiles(fs, ""); };

  /* ---------- dialogs ---------- */
  const dlg = document.createElement("div"); dlg.id = "tldlg"; document.body.appendChild(dlg);
  const closeDlg = () => dlg.classList.remove("open");
  dlg.addEventListener("click", e => { if(e.target === dlg) closeDlg(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeDlg(); });
  function openDlg(html, mount){ dlg.innerHTML = '<div class="tdc">' + html + '</div>'; dlg.classList.add("open"); const c = dlg.firstChild; mount(c); return c; }

  $$("tlnew").onclick = () => openDlg('<h3>🏆 New tier list</h3><label>Title</label><input type="text" id="tdn" maxlength="40" placeholder="e.g. Best pizza toppings"><div class="trow2"><button class="tbtn" type="button" id="tdc">Cancel</button><button class="tbtn tp" type="button" id="tdok">Create</button></div>', c => {
    const inp = c.querySelector("#tdn"); inp.focus();
    const go = () => { const n = inp.value.trim(); if(!n){ inp.focus(); return; } closeDlg(); sendOp({ k: "nl", l: rid("l"), n, tiers: defTiers() }); };
    c.querySelector("#tdc").onclick = closeDlg; c.querySelector("#tdok").onclick = go; inp.onkeydown = e => { if(e.key === "Enter") go(); };
  });
  const delList = l => { if(l && confirm("Delete the tier list “" + l.n + "” for everyone?")) sendOp({ k: "dl", l: l.id }); };
  const resetList = l => { if(l && confirm("Move every picture back to the unranked pile?")) sendOp({ k: "cl", l: l.id }); };
  const editTiers = l => {
    if(!l) return;
    const rows = l.tiers.map(t => ({ i: t.i, n: t.n, c: t.c }));
    openDlg('<h3>✏️ Edit tier list</h3><label>Title</label><input type="text" id="tdn" maxlength="40"><label>Tiers</label><div id="tdrows" style="display:flex;flex-direction:column;gap:6px"></div><button class="tbtn" type="button" id="tdadd" style="align-self:flex-start">➕ Add tier</button><div class="trow2"><button class="tbtn" type="button" id="tdc">Cancel</button><button class="tbtn tp" type="button" id="tdok">Save</button></div>', c => {
      c.querySelector("#tdn").value = l.n; const box = c.querySelector("#tdrows");
      const draw = () => {
        box.replaceChildren();
        rows.forEach((r, k) => {
          const w = document.createElement("div"); w.className = "ted";
          const col = document.createElement("input"); col.type = "color"; col.value = r.c; col.oninput = () => { r.c = col.value; };
          const nm = document.createElement("input"); nm.type = "text"; nm.maxLength = 16; nm.value = r.n; nm.placeholder = "Tier name"; nm.oninput = () => { r.n = nm.value; };
          const up = document.createElement("button"); up.type = "button"; up.className = "tbtn"; up.textContent = "↑"; up.disabled = k === 0; up.onclick = () => { [rows[k - 1], rows[k]] = [rows[k], rows[k - 1]]; draw(); };
          const dn = document.createElement("button"); dn.type = "button"; dn.className = "tbtn"; dn.textContent = "↓"; dn.disabled = k === rows.length - 1; dn.onclick = () => { [rows[k + 1], rows[k]] = [rows[k], rows[k + 1]]; draw(); };
          const x = document.createElement("button"); x.type = "button"; x.className = "tbtn red"; x.textContent = "✕"; x.disabled = rows.length <= 1; x.onclick = () => { rows.splice(k, 1); draw(); };
          w.append(col, nm, up, dn, x); box.appendChild(w);
        });
        c.querySelector("#tdadd").style.display = rows.length >= MAXT ? "none" : "";
      };
      draw();
      c.querySelector("#tdadd").onclick = () => { rows.push({ i: rid("t"), n: "New", c: "#9ec5ff" }); draw(); };
      c.querySelector("#tdc").onclick = closeDlg;
      c.querySelector("#tdok").onclick = () => { closeDlg(); sendOp({ k: "tn", l: l.id, n: c.querySelector("#tdn").value, tiers: rows }); };
    });
  };

  /* ---------- save as a picture ---------- */
  const savePic = async l => {
    if(!l) return;
    const W = 900, LAB = 130, S = 92, cols = Math.floor((W - LAB - 12) / S), TOP = 64;
    const rows = l.tiers.map(t => { const its = Object.values(l.items).filter(x => x.t === t.i).sort((a, b) => a.o - b.o); return { t, its, h: Math.max(1, Math.ceil(its.length / cols)) * S + 8 }; });
    const H = TOP + rows.reduce((a, r) => a + r.h + 4, 0) + 12;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const cx = cv.getContext("2d");
    cx.fillStyle = "#1a1a1a"; cx.fillRect(0, 0, W, H);
    cx.fillStyle = "#fff"; cx.font = "bold 30px system-ui,sans-serif"; cx.textBaseline = "middle"; cx.textAlign = "left"; cx.fillText(l.n, 16, TOP / 2, W - 32);
    const imgs = {};
    await Promise.all(Object.values(l.items).map(it => new Promise(res => { const im = new Image(); im.onload = () => { imgs[it.i] = im; res(); }; im.onerror = res; im.src = it.im; })));
    let y = TOP;
    rows.forEach(r => {
      cx.fillStyle = "#2b2b2b"; cx.fillRect(0, y, W, r.h);
      cx.fillStyle = r.t.c; cx.fillRect(0, y, LAB, r.h);
      cx.fillStyle = lum(r.t.c) > 150 ? "#111" : "#fff"; cx.font = "bold 28px system-ui,sans-serif"; cx.textAlign = "center"; cx.fillText(r.t.n, LAB / 2, y + r.h / 2, LAB - 14);
      r.its.forEach((it, k) => { const im = imgs[it.i]; if(im) cx.drawImage(im, LAB + 6 + (k % cols) * S, y + 4 + Math.floor(k / cols) * S, S - 4, S - 4); });
      y += r.h + 4;
    });
    cv.toBlob(b => {
      if(!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b);
      a.download = (l.n.replace(/[^\w\- ]+/g, "").trim().slice(0, 40) || "tierlist") + ".png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
  };

  /* ---------- hook into the tab switcher ---------- */
  const _sc = setChannel;
  setChannel = function(c){
    _sc(c);
    document.body.classList.toggle("in-tier", c === "tier");
    $$("ch-tier").classList.toggle("active", c === "tier");
    if(c === "tier") render();
  };
})();

;
/* ===== 31-drop-js.js ===== */
(function(){
  /* drag a picture in from another tab / window / your desktop (or paste one) — no downloading needed */
  const $$ = id => document.getElementById(id);
  const hint = document.createElement("div"); hint.id = "dropHint"; document.body.appendChild(hint);
  const toastEl = document.createElement("div"); toastEl.id = "droptoast"; document.body.appendChild(toastEl);
  const dlg = document.createElement("div"); dlg.id = "dropdlg"; document.body.appendChild(dlg);
  let tt = 0;
  const toast = t => { toastEl.textContent = t; toastEl.style.display = "block"; clearTimeout(tt); tt = setTimeout(() => { toastEl.style.display = "none"; }, 5000); };
  const inTier = () => document.body.classList.contains("in-tier");
  const where = () => inTier() ? "the tier list" : curCh === "dm" ? (dmNm || "this chat") : tabLabel(curCh);
  const wants = dt => { if(!dt) return false; const t = [...(dt.types || [])]; return t.includes("Files") || t.includes("text/uri-list"); };

  /* what was dropped? (must be read right now, before the event ends) */
  function grab(dt){
    const files = [...(dt.files || [])].filter(f => f.type && f.type.startsWith("image/"));
    let url = "", other = (dt.files || []).length > files.length;
    if(!files.length){
      url = (dt.getData("text/uri-list") || "").split(/\r?\n/).map(s => s.trim()).find(s => s && s[0] !== "#") || "";
      if(!url){ const m = /<img[^>]+src=["']([^"']+)["']/i.exec(dt.getData("text/html") || ""); if(m) url = m[1]; }
      if(url){ const t = document.createElement("textarea"); t.innerHTML = url; url = t.value; }
    }
    return { files, url, other };
  }
  async function urlToBlob(url){
    if(/^data:image\//i.test(url)){ try { return await (await fetch(url)).blob(); } catch(e){ return null; } }
    if(!/^https?:/i.test(url)) return null;
    try { const r = await fetch(url, { mode: "cors", credentials: "omit" }); if(r.ok){ const b = await r.blob(); if(b.type.startsWith("image/")) return b; } } catch(e){}
    try {                                                   // some sites allow pictures but not fetch()
      return await new Promise((res, rej) => {
        const im = new Image(); im.crossOrigin = "anonymous";
        im.onload = () => { try { const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); c.toBlob(b => b ? res(b) : rej(), "image/png"); } catch(e){ rej(e); } };
        im.onerror = rej; im.src = url;
      });
    } catch(e){}
    return null;
  }

  /* chat: show a quick preview, then send like a normal photo */
  function closeDlg(){ dlg.querySelectorAll("img").forEach(i => URL.revokeObjectURL(i.src)); dlg.classList.remove("open"); dlg.replaceChildren(); }
  function sendAll(blobs){
    let i = 0;
    (function next(){
      if(i >= Math.min(blobs.length, 5)) return;
      const f = blobs[i++];
      if(f.size > 10 * 1024 * 1024){ sys("Image too big (10MB max)."); return next(); }
      const r = new FileReader(); r.onload = ev => shrinkImage(ev.target.result, d => { postMsg(d, 1); setTimeout(next, 250); }); r.readAsDataURL(f);
    })();
  }
  function confirmSend(blobs){
    const list = blobs.slice(0, 5), box = document.createElement("div"); box.className = "dc";
    const h = document.createElement("h3"); h.textContent = "Send " + (list.length === 1 ? "this picture" : list.length + " pictures") + " to " + where() + "?";
    const th = document.createElement("div"); th.className = "dth";
    list.forEach(b => { const im = document.createElement("img"); im.src = URL.createObjectURL(b); th.appendChild(im); });
    const row = document.createElement("div"); row.className = "dr";
    const no = document.createElement("button"); no.type = "button"; no.textContent = "Cancel"; no.onclick = closeDlg;
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "ok"; ok.textContent = "Send"; ok.onclick = () => { closeDlg(); sendAll(list); };
    row.append(no, ok); box.append(h, th, row); dlg.replaceChildren(box); dlg.classList.add("open"); ok.focus();
  }
  dlg.addEventListener("click", e => { if(e.target === dlg) closeDlg(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && dlg.classList.contains("open")) closeDlg(); });

  async function deliver(g, tierId, listId){
    let blobs = g.files;
    if(!blobs.length){
      if(!g.url){ toast(g.other ? "Only pictures can be dropped here." : "Drop a picture (not text)."); return; }
      toast("Getting the picture…");
      const b = await urlToBlob(g.url);
      if(!b){ toast("That website doesn't let its pictures be copied. Right-click it → Copy image, then press Ctrl+V here."); return; }
      toastEl.style.display = "none"; blobs = [b];
    }
    if(inTier()){ if(window.__tierAdd) window.__tierAdd(blobs, tierId || "", listId || ""); return; }
    if(curCh === "draw"){ if(window.__pbBoardAddImage && blobs[0]) window.__pbBoardAddImage(blobs[0]); else toast("Pictures can't be dropped on the drawing board."); return; }
    if(curCh === "shame" && !(window.__pbIsMod && window.__pbIsMod(null))){ toast("Only mods and owners can post in the Hall of Shame."); return; }
    confirmSend(blobs);
  }

  let depth = 0;
  window.addEventListener("dragenter", e => { if(!wants(e.dataTransfer)) return; depth++; hint.textContent = inTier() ? "Drop pictures to add them to the tier list\n(drop on a tier to put them straight in it)" : "Drop pictures to send in " + where(); hint.style.whiteSpace = "pre-line"; hint.classList.add("on"); });
  window.addEventListener("dragover", e => { if(!wants(e.dataTransfer)) return; e.preventDefault(); try { e.dataTransfer.dropEffect = "copy"; } catch(x){} });
  window.addEventListener("dragleave", e => { if(!hint.classList.contains("on")) return; depth = Math.max(0, depth - 1); if(!depth) hint.classList.remove("on"); });
  window.addEventListener("drop", e => {
    if(!wants(e.dataTransfer)) return;
    e.preventDefault(); depth = 0; hint.classList.remove("on");
    const g = grab(e.dataTransfer), z = document.elementFromPoint(e.clientX, e.clientY), zone = z && z.closest ? z.closest(".tzone") : null;
    deliver(g, zone ? zone.dataset.t : "", zone && zone.closest(".tsec") ? zone.closest(".tsec").dataset.l : "");
  });
  document.addEventListener("paste", e => {                  // copied picture (right-click → Copy image) + Ctrl/Cmd+V
    const items = [...((e.clipboardData && e.clipboardData.items) || [])].filter(i => i.kind === "file" && i.type.startsWith("image/"));
    if(!items.length) return;
    e.preventDefault();
    deliver({ files: items.map(i => i.getAsFile()).filter(Boolean), url: "", other: false }, "");
  });
})();

;
/* ===== 32-main.js ===== */
/* top banner of the main room: it is black artwork, so turn it white whenever the room background is dark */
(function(){
  var tb = document.getElementById("topbanner"); if(!tb) return;
  function ls(k, f){ try{ var v = localStorage.getItem(k); return v === null ? f : v; }catch(e){ return f; } }
  function lum(r, g, b){ return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function hex(h){ return /^#[0-9a-f]{6}$/i.test(h || "") ? [1, 3, 5].map(function(i){ return parseInt(h.slice(i, i + 2), 16); }) : null; }
  function solid(el){                              // the colour actually painted behind the chat, or null
    var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if(!m || m.length < 3) return null;
    if(m.length > 3 && +m[3] < 0.5) return null;
    return [+m[0], +m[1], +m[2]];
  }
  function isDark(){
    var box = document.getElementById("box"), kind = ls("wall_kind", "none"), c;
    if(kind === "image" && ls("wall_img", "")){        // a picture: use its main colour, darkened by the dim slider
      c = hex(ls("wall_img_col", ""));
      if(c) return lum(c[0], c[1], c[2]) * (1 - (+ls("wall_dim", "30")) / 100) < 0.5;
    }
    c = (box && solid(box)) || solid(document.body) || [0, 0, 0];
    return lum(c[0], c[1], c[2]) < 0.5;
  }
  var q = 0;
  function update(){ q = 0; try{ tb.classList.toggle("inv", isDark()); }catch(e){} }
  function soon(){ if(!q) q = requestAnimationFrame(update); }
  var mo = new MutationObserver(soon);
  mo.observe(document.body, { attributes: true, attributeFilter: ["data-theme", "style", "class"] });
  var bx = document.getElementById("box"); if(bx) mo.observe(bx, { attributes: true, attributeFilter: ["style", "class"] });
  window.addEventListener("load", soon); window.addEventListener("storage", soon);
  update();
})();

;
/* ===== 33-pv-js.js ===== */
(function(){
  var D=document, $=function(i){return D.getElementById(i)};
  var bypass=false, cur=null, scareSrc="";
  function first(){ try{ return localStorage.getItem("pb_pvfirst")!=="0"; }catch(e){ return true; } }
  function setFirst(v){ try{ localStorage.setItem("pb_pvfirst",v?"1":"0"); }catch(e){} D.querySelectorAll(".pvchk input").forEach(function(c){ c.checked=v; }); }
  function me(){ var t=($("youare")||{}).textContent||""; return t.replace(/^Signed in as\s*/,"")||"Owner"; }

  /* ---------- the preview window ---------- */
  var m=D.createElement("div"); m.id="pvm"; m.setAttribute("role","dialog"); m.setAttribute("aria-label","Preview");
  m.innerHTML='<div class="pvc"><div class="pvh"><b id="pvt">👁 Preview</b><button type="button" id="pvx" title="Close">✕</button></div><div class="pvsub" id="pvs"></div><iframe id="pvf" title="Preview of what people will see"></iframe><div class="pvn" id="pvn"></div><div class="pvb"><button type="button" class="alt" id="pvr">↻ Replay</button><button type="button" class="alt" id="pvc">Cancel</button><button type="button" id="pvg">Send it</button></div></div>';
  D.body.appendChild(m);
  function close(){ m.classList.remove("open"); cur=null; clearTimeout(play.t); $("pvf").srcdoc=""; }
  $("pvx").onclick=$("pvc").onclick=close;
  m.addEventListener("mousedown",function(e){ if(e.target===m) close(); });
  D.addEventListener("keydown",function(e){ if(e.key==="Escape"&&m.classList.contains("open")){ e.stopPropagation(); close(); } },true);
  $("pvr").onclick=function(){ play(); };
  $("pvg").onclick=function(){ var r=cur&&cur.real; close(); if(r) fire(r); };

  function fire(real){
    bypass=true; var oc=window.confirm;
    if(real.id==="amscall") window.confirm=function(){ return true; };   // you already confirmed in the preview
    try{ real.click(); } finally { window.confirm=oc; bypass=false; }
  }

  /* the same look as the real chat: theme colors + the real effect CSS */
  function gatherCSS(){
    var out=[], re=/tr-(fall|flip|spin|shake|rainbow|blur|on)|@keyframes\s+(tr|js|anIn)|^#anb|^#jsov/;
    for(var i=0;i<D.styleSheets.length;i++){
      var rules; try{ rules=D.styleSheets[i].cssRules; }catch(e){ continue; }
      if(!rules) continue;
      for(var j=0;j<rules.length;j++){ var t=rules[j].cssText; if(re.test(t)) out.push(t); }
    }
    return out.join("\n");
  }
  function vars(){
    var cs=getComputedStyle(D.body), o="";
    ["--bg","--side","--line","--row","--accent","--text","--muted","--input","--me","--peer","--on-accent"].forEach(function(k){ var v=cs.getPropertyValue(k).trim(); if(v) o+=k+":"+v+";"; });
    return o;
  }
  function docHTML(){
    return '<!doctype html><html><head><meta charset="utf-8"><style>:root{'+vars()+'}*{box-sizing:border-box}html,body{margin:0;height:100%}body{display:flex;background:var(--bg);color:var(--text);font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}'+
    '#a{width:96px;background:var(--side);border-right:1px solid var(--line);padding:12px 10px;flex:none}#a b{display:block;margin-bottom:10px;font-size:13px}#a i{display:block;font-style:normal;padding:7px 8px;border-radius:8px;margin-bottom:4px;font-size:12px;background:var(--row)}'+
    '#c{flex:1;min-width:0;display:flex;flex-direction:column;padding:12px;gap:8px}#c .m{max-width:78%;padding:7px 11px;border-radius:16px;background:var(--peer);line-height:1.3}#c .m.me{align-self:flex-end;background:var(--me,var(--accent));color:#fff}#c .sp{flex:1}#c .in{padding:9px 12px;border-radius:999px;background:var(--input);color:var(--muted);border:1px solid var(--line)}'+
    '#anb .anic{font-size:22px}'+gatherCSS()+'</style></head><body><div id="a"><b>Messages</b><i>Los Purebreds</i><i>Gallery</i><i>Polls</i></div><div id="c"><div class="m">hey everyone 👋</div><div class="m">what are we doing tonight?</div><div class="m me">gaming? 🎮</div><div class="sp"></div><div class="in">Message…</div></div></body></html>';
  }
  function durText(v){ v=+v; if(v===0) return "Stays until someone dismisses it"; if(v<60) return "Stays on screen for "+v+" seconds"; if(v<3600) return "Stays on screen for "+Math.round(v/60)+" minute"+(Math.round(v/60)===1?"":"s"); return "Stays on screen for 1 hour"; }
  function scareImg(){
    try{ var cu=window.__pbJsCustom&&window.__pbJsCustom(); if(cu) return cu; }catch(e){}
    if(scareSrc) return scareSrc;
    var sc=D.scripts;
    for(var i=0;i<sc.length;i++){ var t=sc[i].textContent; if(t.length<5000) continue; var k=t.indexOf('const JS_IMG="'); if(k>=0){ var e=t.indexOf('"',k+14); scareSrc=new URL(t.slice(k+14,e),document.baseURI).href; break; } }
    return scareSrc;
  }

  /* run (or re-run) the effect inside the preview */
  function play(){
    var f=$("pvf"), d=f.contentDocument, o=cur; if(!d||!d.body||!o) return;
    clearTimeout(play.t); var b=d.body, h=d.documentElement;
    ["fall","flip","shake","rainbow","spin","blur"].forEach(function(x){ b.classList.remove("tr-"+x); }); h.classList.remove("tr-on");
    var old=d.getElementById("anb"); if(old) old.remove(); old=d.getElementById("jsov"); if(old) old.remove();
    void b.offsetWidth;
    if(o.kind==="troll"){
      b.style.setProperty("--trd",(o.dur||8)+"s"); b.classList.add("tr-"+o.k); h.classList.add("tr-on");
      play.t=setTimeout(function(){ b.classList.remove("tr-"+o.k); h.classList.remove("tr-on"); },(o.dur||8)*1000);
    } else if(o.kind==="ann"){
      var a=d.createElement("div"); a.id="anb"; a.className="on";
      a.innerHTML='<div class="anic">📢</div><div class="anbd"><div class="anh"></div><div class="anm"></div></div><button type="button" title="Dismiss">✕</button>';
      a.querySelector(".anh").textContent="Announcement from "+o.who; a.querySelector(".anm").textContent=o.text;
      a.querySelector("button").onclick=function(){ a.remove(); };
      if(/^#[0-9a-f]{6}$/i.test(o.col||"")){ var n=parseInt(o.col.slice(1),16), L=(0.2126*(n>>16&255)+0.7152*(n>>8&255)+0.0722*(n&255))/255; a.style.background="linear-gradient(135deg,"+o.col+",color-mix(in srgb,"+o.col+" 70%,#000))"; a.style.color=L>0.6?"#000":"#fff"; }
      b.appendChild(a);
    } else if(o.kind==="scare"){
      var s=d.createElement("div"); s.id="jsov"; s.className="on"; var im=d.createElement("img"); im.alt=""; im.src=scareImg(); s.appendChild(im); b.appendChild(s);
      play.t=setTimeout(function(){ s.classList.remove("on"); },5000);
    }
  }

  function open(o){
    cur=o;
    $("pvt").textContent=o.title; $("pvs").textContent=o.sub; $("pvn").textContent=o.note; $("pvg").textContent=o.go;
    var f=$("pvf"); f.onload=function(){ if(cur) play(); };
    f.srcdoc=docHTML(); m.classList.add("open"); $("pvg").focus();
  }

  /* work out what a panel button is about to do */
  function describe(r){
    var id=r.id||"";
    if(id==="amanb"||id==="mmanb"){
      var p=id==="amanb"?"am":"mm", ta=$(p+"ant"); if(!ta||!ta.value.trim()) return null;
      var du=$(p+"dur"), co=$(p+"col"), dur=du?+du.value:5;
      return {kind:"ann",real:r,text:ta.value.trim().slice(0,300),dur:dur,col:co?co.value:"",who:me(),title:"👁 Preview: announcement",sub:"Goes to everyone in the room · "+durText(dur),note:"This is how it will pop up at the top of everyone’s screen. Nothing has been sent yet.",go:"📢 Send announcement"};
    }
    if(id==="amscall") return {kind:"scare",real:r,title:"👁 Preview: jumpscare",sub:"Goes to everyone except owners · 5 seconds",note:"They also hear a loud sound and can’t close it (the preview is silent). Use the Preview button for the full-screen version with sound.",go:"👻 Scare everyone"};
    var row=r.closest&&r.closest(".arow");
    if(r.classList.contains("scare")&&row){ var nm=((row.querySelector(".an")||{}).textContent||"them").replace(/\s*\(you\)|\s*🔒|\s*🔇/g,"").trim(); return {kind:"scare",real:r,title:"👁 Preview: jumpscare",sub:"Goes to "+nm+" · 5 seconds",note:"They also hear a loud sound and can’t close it (the preview is silent).",go:"👻 Scare "+nm}; }
    if(r.dataset&&r.dataset.k&&r.closest(".trrow")){
      var host=r.closest(".trrow").parentNode, sel=host.querySelector(".trsel"), who=sel&&sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:"Everyone";
      var isMod=!!r.closest("#mmod"), label=r.textContent.replace(/\s*\(\d+s\)\s*$/,"").trim();
      var ds=host.querySelector(".trdur"), dur=ds?(+ds.value||8):8;
      return {kind:"troll",k:r.dataset.k,dur:dur,real:r,title:"👁 Preview: "+label.replace(/^\S+\s/,""),sub:"Goes to "+who.replace(/^\S+\s(?=Everyone)/,"")+" · lasts "+(dur>=60?(dur/60)+" minute"+(dur>=120?"s":""):dur+" seconds"),note:(isMod?"Mods have a 30 second cooldown after each troll. ":"")+"They see this on their own screen, then it goes back to normal.",go:"😈 Troll them"};
    }
    return null;
  }
  D.addEventListener("click",function(e){
    if(bypass) return;
    var b=e.target.closest&&e.target.closest("button"); if(!b||b.disabled) return;
    var real=b, forced=false;
    if(b.classList.contains("pvbtn")){ real=$(b.dataset.real); forced=true; if(!real) return; }
    else if(!first()) return;
    var o=describe(real); if(!o){ if(forced){ bypass=true; try{ real.click(); } finally { bypass=false; } } return; }
    e.preventDefault(); e.stopImmediatePropagation(); open(o);
  },true);

  /* the switch + an explicit Preview button in both panels */
  [["amsg","amanb"],["mmsg","mmanb"]].forEach(function(p){
    var s=$(p[0]); if(s&&!s.parentNode.querySelector(".pvchk")){ var l=D.createElement("label"); l.className="pvchk"; l.innerHTML='<input type="checkbox"> 👁 Preview before sending (announcements, trolls, jumpscares)'; s.after(l); var c=l.querySelector("input"); c.checked=first(); c.onchange=function(){ setFirst(c.checked); }; }
    var a=$(p[1]); if(a&&!a.parentNode.querySelector(".pvbtn")){ var pb=D.createElement("button"); pb.type="button"; pb.className="abtn pvbtn"; pb.dataset.real=p[1]; pb.textContent="👁 Preview"; a.after(pb); }
  });
})();

;
/* ===== 34-px-flow.js ===== */
(function(){
var D=document,H=D.documentElement,G=function(i){return D.getElementById(i)};
var RC=(typeof ROOM_CODE==="string")?ROOM_CODE:"lospurebro";
function ls(k){try{return localStorage.getItem(k)||""}catch(e){return ""}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function esc(t){var d=D.createElement("div");d.textContent=t;return d.innerHTML}
var gate=G("gate"); if(!gate) return;
var CSS=`
:host{all:initial}
*{box-sizing:border-box}
.root{position:absolute;inset:0;background:#1f1f25;color:#e6e0e9;font-family:"Google Sans","Product Sans",Roboto,"Segoe UI",system-ui,sans-serif;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);transition:opacity .3s;color-scheme:dark}
.root.big{font-size:19px}
.app{height:100%;max-width:440px;margin:0 auto;display:flex;flex-direction:column}
.screen{flex:1;display:flex;flex-direction:column;padding:28px 28px 0;overflow-y:auto;animation:slide .38s cubic-bezier(.2,0,0,1) both}
.screen>*{animation:rise .5s cubic-bezier(.2,0,0,1) both}
.screen>:nth-child(2){animation-delay:.05s}.screen>:nth-child(3){animation-delay:.1s}.screen>:nth-child(4){animation-delay:.15s}.screen>:nth-child(5){animation-delay:.2s}.screen>:nth-child(n+6){animation-delay:.25s}
.icon{width:44px;height:44px;margin:20px 0 28px;color:#d0bcff;animation:pop .5s cubic-bezier(.3,1.4,.5,1) both}
h1{font-weight:400;font-size:2.1rem;line-height:1.2;margin:0 0 18px}
p{font-size:1.02rem;line-height:1.5;margin:0 0 16px}
.dim{color:#cac4d0}
.bar{display:flex;justify-content:space-between;align-items:center;padding:18px 28px 22px;animation:rise .5s .2s cubic-bezier(.2,0,0,1) both}
.link{background:none;border:0;color:#d0bcff;font:inherit;font-size:.95rem;padding:10px 0;cursor:pointer;text-decoration:none}
.pill{background:#d0bcff;color:#381e72;border:0;border-radius:999px;padding:12px 24px;font:inherit;font-size:.95rem;cursor:pointer}
.pill,.row,.link{transition:transform .15s,background-color .2s,opacity .2s}
.pill:active{transform:scale(.94)}.row:active{transform:scale(.98)}
.pill:hover{background:#e0d2ff}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid #d0bcff;outline-offset:2px}
.f{width:100%;background:transparent;border:1px solid #cac4d0;border-radius:6px;color:#e6e0e9;font:inherit;font-size:1.1rem;padding:16px;margin:6px 0 12px;transition:border-color .2s,box-shadow .2s}
.f:focus{border-color:#d0bcff;box-shadow:0 0 0 1px #d0bcff}
select.f{background:#2b2930;font-size:1rem;padding:12px}
.err{color:#f2b8b5;min-height:1.4em;font-size:.9rem}
.err:not(:empty){animation:rise .25s both}
.row{display:flex;align-items:center;gap:18px;width:100%;background:none;border:0;color:#e6e0e9;font:inherit;font-size:1.5rem;padding:16px 0;text-align:left;cursor:pointer}
.row svg{width:30px;height:30px;color:#d0bcff;flex:none}
.row .chev{margin-left:auto;width:24px;height:24px;color:#e6e0e9;transition:transform .2s}
.row.open .chev{transform:rotate(180deg)}
.drawer{background:#2b2930;border-radius:16px;padding:14px 18px;margin-bottom:8px;font-size:.95rem;transform-origin:top;animation:drop .25s cubic-bezier(.2,0,0,1) both}
.drawer ul{margin:0;padding-left:18px}.drawer li{margin:6px 0}
.tg{display:flex;justify-content:space-between;align-items:center;padding:8px 0}
.tg input{accent-color:#d0bcff;width:20px;height:20px}
.drawer label.l{display:block;color:#cac4d0;font-size:.85rem;margin-top:8px}
.drawer .mini{display:flex;gap:8px;align-items:center;margin-top:6px}
.drawer .mini .f{margin:0;padding:10px;font-size:.95rem}
.drawer .mini .pill{padding:10px 16px;white-space:nowrap}
.clk{display:flex;flex-direction:column;gap:4px;margin:2px 0 6px;color:#e6e0e9;user-select:none;-webkit-user-select:none}
.cd{font-size:1.05rem;font-weight:500;color:#d0bcff;letter-spacing:.1px}
.ct{display:flex;align-items:baseline;font-size:clamp(3.8rem,20vw,5.8rem);line-height:1;font-weight:400;letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.ct .cc{color:#d0bcff;margin:0 .02em;animation:cpulse 2s steps(6) infinite}   /* stepped: a smooth pulse re-styled the clock every frame (60x a second) for no visible gain */
.ct small{font-size:1.05rem;font-weight:500;letter-spacing:0;color:#cac4d0;margin-left:10px}
@keyframes cpulse{0%,100%{opacity:1}50%{opacity:.3}}
.hero{height:clamp(150px,25dvh,230px);display:flex;align-items:center;justify-content:center}
.hero svg{height:100%;max-height:240px;width:auto;aspect-ratio:1;color:#d0bcff;animation:spin 30s linear infinite,breathe 4s steps(12) infinite}
.clk.sm{align-items:center;gap:0;margin:10px 0 4px;opacity:.85}
.clk.sm .cd{font-size:.8rem}
.clk.sm .ct{font-size:1.7rem;letter-spacing:-.02em}
.clk.sm .ct small{font-size:.75rem;margin-left:6px}
.hero svg.aclk{animation:breathe 4s steps(12) infinite;filter:drop-shadow(0 6px 18px rgba(0,0,0,.35))}
.aclk #ahr,.aclk #amn{transform-origin:100px 100px}
.spacer{flex:1}
.prog{height:8px;background:#4a4458;border-radius:99px;overflow:hidden;margin:18px 0 10px}
.prog i{display:block;height:100%;width:0;background:#d0bcff;border-radius:99px;transition:width .15s linear}
@keyframes slide{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:none}}
@keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes breathe{0%,100%{scale:1}50%{scale:1.06}}
@keyframes drop{from{opacity:0;transform:translateY(-8px) scaleY(.9)}to{opacity:1;transform:none}}
@keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}
/* ---- Material 3 Expressive (follows the chat theme's colours) ---- */
.root{--a:#d0bcff;--on-a:#381e72;--bg:#141218;--tx:#e6e0e9;--mu:#cac4d0;
--ln:color-mix(in srgb,var(--tx) 38%,var(--bg));
--s1:color-mix(in srgb,var(--tx) 6%,var(--bg));--s2:color-mix(in srgb,var(--tx) 11%,var(--bg));--s3:color-mix(in srgb,var(--tx) 17%,var(--bg));
--ac:color-mix(in srgb,var(--a) 34%,var(--bg));
--face:color-mix(in srgb,var(--a) 20%,#fff);--hh:color-mix(in srgb,var(--a) 45%,#000);--mh:color-mix(in srgb,var(--a) 60%,#a01040);--sh:#e0453a;
background:radial-gradient(130% 55% at 50% -8%,color-mix(in srgb,var(--a) 30%,var(--bg)) 0%,transparent 70%),var(--bg);color:var(--tx)}
.root[data-skin=material]{--hh:#4f378b;--mh:#e0457b}
.app{max-width:460px}
.screen{padding:24px 20px 0}
h1{font-weight:600;font-size:2.35rem;line-height:1.1;letter-spacing:-.02em;margin:0 0 14px;color:var(--tx)}
.dim{color:var(--mu)}
.err{color:color-mix(in srgb,#e5484d 75%,var(--tx))}
.icon{width:80px;height:80px;padding:20px;margin:16px 0 24px;border-radius:50%;background:var(--ac);color:var(--tx);animation:pop .6s cubic-bezier(.34,1.56,.64,1) both,morph 7s ease-in-out .6s infinite}
@keyframes morph{0%,100%{border-radius:50%}33%{border-radius:34% 66% 58% 42%/46% 40% 60% 54%}66%{border-radius:28px}}
.bar{padding:16px 20px 22px}
.pill{height:56px;padding:0 32px;border-radius:999px;background:var(--a);color:var(--on-a);font-weight:600;font-size:1rem;letter-spacing:.1px;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:border-radius .25s cubic-bezier(.34,1.56,.64,1),transform .25s cubic-bezier(.34,1.56,.64,1),background-color .2s,box-shadow .2s}
.pill:hover{background:color-mix(in srgb,var(--a) 88%,#fff);box-shadow:0 4px 16px color-mix(in srgb,var(--a) 35%,transparent)}
.pill:active{border-radius:18px;transform:scale(.96)}
.link{display:inline-flex;align-items:center;height:48px;padding:0 20px;border-radius:999px;font-weight:600;color:var(--a)}
.link:hover{background:color-mix(in srgb,var(--a) 14%,transparent)}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline-color:var(--a)}
.row{gap:16px;font-size:1.1rem;font-weight:500;padding:12px 16px;margin:0 0 4px;border-radius:28px;background:var(--s1);color:var(--tx);transition:border-radius .3s cubic-bezier(.34,1.56,.64,1),background-color .2s,transform .25s cubic-bezier(.34,1.56,.64,1)}
.row:hover{background:var(--s2)}
.row:active{transform:scale(.98);border-radius:14px}
.row svg{width:44px;height:44px;padding:10px;border-radius:50%;background:var(--ac);color:var(--tx)}
.row .chev{width:24px;height:24px;padding:0;border-radius:0;background:none;color:var(--mu)}
.row.open{border-radius:28px 28px 8px 8px;background:var(--s2)}
.drawer{background:var(--s1);color:var(--tx);border-radius:8px 8px 28px 28px;padding:16px 20px;margin-bottom:4px}
.drawer label.l{color:var(--mu);font-weight:500}
.tg input{accent-color:var(--a)}
.f{border:1px solid var(--ln);border-radius:16px;padding:16px 18px;background:var(--s1);color:var(--tx)}
.f::placeholder{color:var(--mu);opacity:.7}
.f:focus{border-color:var(--a);box-shadow:0 0 0 1px var(--a);outline:none}
select.f{background:var(--s2)}
.drawer .mini .pill{height:48px;padding:0 20px}
.prog{height:14px;margin:22px 0 12px;background:var(--s3)}
.prog i{background:linear-gradient(90deg,var(--a),color-mix(in srgb,var(--a) 55%,#ff8fb1))}
.cd,.ct .cc{color:var(--a)}
.ct small{color:var(--mu)}
.hero{height:clamp(170px,30dvh,260px);flex:none}
.clk.sm{flex:none;margin-bottom:14px}
.clk.sm .ct{font-weight:500}
.hero svg.aclk{filter:drop-shadow(0 10px 28px color-mix(in srgb,var(--a) 45%,transparent))}
.aclk #asc{transform-origin:100px 100px}
.aclk .sc{fill:var(--face)}
.aclk .dt{fill:var(--hh)}
.aclk .dot{fill:color-mix(in srgb,var(--a) 50%,#ffb6c8)}
.aclk #ahr line{stroke:var(--hh)}.aclk #amn line{stroke:var(--mh)}.aclk #asc line{stroke:var(--sh)}
.aclk .c1{fill:var(--face)}.aclk .c2{fill:var(--hh)}
.aclk .rd,.aclk #asc,.aclk .dtr{display:none}
.aclk .rim{fill:var(--rim,#9aa0a8)}.aclk .rf{fill:var(--rface,#fff)}.aclk .tk{stroke:var(--tick,#222)}
.aclk .dtr{fill:var(--tick,#222);font-size:10px;font-weight:700;letter-spacing:.5px}
.root[data-round] .aclk .sc,.root[data-round] .aclk .dot,.root[data-round] .aclk .dt{display:none}
.root[data-round] .aclk .rd,.root[data-round] .aclk #asc,.root[data-round] .aclk .dtr{display:block}
.root[data-round] .hero svg.aclk{animation:none}
.root[data-round] .aclk #ahr line{stroke-width:6}.root[data-round] .aclk #amn line{stroke-width:4}
.root[data-round] .aclk .c1{fill:var(--hh)}
.tb{display:none}
@keyframes stripes{to{background-position:28px 0,0 0}}
/* terminal */
.root[data-skin=terminal]{font-family:"JetBrains Mono","Fira Code","Roboto Mono","Cascadia Mono",ui-monospace,Consolas,monospace;text-shadow:0 0 6px color-mix(in srgb,var(--a) 38%,transparent)}
.root[data-skin=terminal] :is(.pill,.row,.f,.drawer,.link,.icon,.row svg,.prog,.prog i){border-radius:2px !important;animation-name:none}
.root[data-skin=terminal] h1{font-weight:400;letter-spacing:0;font-size:1.8rem}
/* ================= iOS 6 ================= */
.root[data-skin=ios6]{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#fff;color-scheme:dark;--rim:#d3d6db;--rface:#fff;--tick:#222;--hh:#111;--mh:#111;--sh:#d9332a;
background-color:#393c41;background-image:radial-gradient(ellipse 90% 55% at 50% 36%,rgba(255,255,255,.17),rgba(255,255,255,0) 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.045) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.17) 0 1px,transparent 1px 3px)}
.root[data-skin=ios6] .app{max-width:none}
.root[data-skin=ios6] .screen{width:100%;max-width:460px;margin:0 auto;padding:22px 16px 0}
.root[data-skin=ios6] h1{font-weight:500;font-size:2.5rem;text-align:center;letter-spacing:-.03em;color:#fff;margin:0 0 6px;text-shadow:0 -1px 1px rgba(0,0,0,.65),0 1px 0 rgba(255,255,255,.18),0 4px 10px rgba(0,0,0,.45)}
.root[data-skin=ios6] .screen>p{text-align:center;color:#d2d7df;text-shadow:0 -1px 0 rgba(0,0,0,.6)}
.root[data-skin=ios6] .dim{color:#a9afb9;text-align:center;text-shadow:0 -1px 0 rgba(0,0,0,.6)}
.root[data-skin=ios6] .icon{width:76px;height:76px;padding:18px;margin:12px auto 18px;border-radius:17px;color:#fff;border:1px solid rgba(0,0,0,.55);background-image:linear-gradient(rgba(255,255,255,.45),rgba(255,255,255,0) 52%),linear-gradient(#5a9cf0,#2a63c4);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 3px 9px rgba(0,0,0,.6);animation:pop .5s cubic-bezier(.3,1.4,.5,1) both}
.root[data-skin=ios6] .hero{height:clamp(150px,27dvh,230px)}
.root[data-skin=ios6] .hero svg.aclk{filter:drop-shadow(0 8px 12px rgba(0,0,0,.6))}
.root[data-skin=ios6] .clk.sm{color:#e8ebf0;text-shadow:0 -1px 0 rgba(0,0,0,.6)}
.root[data-skin=ios6] .cd,.root[data-skin=ios6] .ct .cc,.root[data-skin=ios6] .ct small{color:#aab0ba}
.root[data-skin=ios6] .row{background:#fff;color:#000;border:1px solid #abb3be;border-radius:0;margin:0;padding:0 14px 0 10px;min-height:46px;font-size:1.06rem;font-weight:700;text-shadow:0 1px 0 #fff;gap:12px;transition:none}
.root[data-skin=ios6] #cl{border-radius:10px 10px 0 0;border-bottom-color:#d9d9d9}
.root[data-skin=ios6] #st{border-radius:0 0 10px 10px;border-top:0}
.root[data-skin=ios6] #st.open{border-radius:0}
.root[data-skin=ios6] .row:hover{background:#fff}
.root[data-skin=ios6] .row:active{transform:none;background:linear-gradient(#4aa8f4,#1a6ae0);color:#fff;text-shadow:0 -1px 0 rgba(0,0,0,.4)}
.root[data-skin=ios6] .row svg:not(.chev){width:30px;height:30px;padding:5px;border-radius:7px;color:#fff;border:1px solid rgba(0,0,0,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.root[data-skin=ios6] #cl svg:not(.chev){background-image:linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,0) 50%),linear-gradient(#f9ab4f,#e5701c)}
.root[data-skin=ios6] #st svg:not(.chev){background-image:linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,0) 50%),linear-gradient(#a9acb3,#666972)}
.root[data-skin=ios6] .row .chev{width:20px;height:20px;color:#8d949f;background:none;border:0;box-shadow:none}
.root[data-skin=ios6] .row:active .chev{color:#fff}
.root[data-skin=ios6] .drawer{background:#f7f7f7;color:#000;border:1px solid #abb3be;border-top:0;border-radius:0;margin:0;padding:12px 14px;text-shadow:none}
.root[data-skin=ios6] #stb .drawer{border-radius:0 0 10px 10px}
.root[data-skin=ios6] .drawer label.l{color:#4c566c;font-weight:700;font-size:.8rem;text-shadow:0 1px 0 #fff}
.root[data-skin=ios6] .drawer .link{color:#2a66c8;height:36px;padding:0}
.root[data-skin=ios6] .tg input{accent-color:#3d7fd1}
.root[data-skin=ios6] .f{background:#fff;color:#000;border:1px solid #9aa3b2;border-radius:7px;font-size:1.05rem;padding:11px 12px;box-shadow:inset 0 2px 3px rgba(0,0,0,.22)}
.root[data-skin=ios6] .f:focus{border-color:#3d7fd1;box-shadow:inset 0 2px 3px rgba(0,0,0,.22),0 0 0 2px rgba(61,127,209,.55)}
.root[data-skin=ios6] select.f{background:#fff}
.root[data-skin=ios6] .err{color:#ff8a80}
.root[data-skin=ios6] .drawer .err{color:#c62828}
.root[data-skin=ios6] .pill{height:38px;padding:0 18px;border-radius:8px;border:1px solid #1d4a94;background:linear-gradient(#6fa8ee,#2a66c8);color:#fff;font-weight:700;text-shadow:0 -1px 0 rgba(0,0,0,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 1px 2px rgba(0,0,0,.4);transition:none}
.root[data-skin=ios6] .pill:hover{background:linear-gradient(#78afef,#306cce)}
.root[data-skin=ios6] .pill:active{border-radius:8px;transform:none;background:linear-gradient(#2a66c8,#4a8ae0)}
.root[data-skin=ios6] .bar{padding:14px max(16px,calc((100% - 428px)/2)) 16px;background:linear-gradient(#2b2d32,#141518);border-top:1px solid #000;box-shadow:0 -1px 0 rgba(255,255,255,.1)}
.root[data-skin=ios6] .bar .link{color:#c9cfd9;font-weight:700;text-shadow:0 -1px 0 #000}
.root[data-skin=ios6] .bar .link:hover{background:rgba(255,255,255,.08)}
.root[data-skin=ios6] .bar .pill{position:relative;height:46px;min-width:210px;padding:0 18px 0 76px;border-radius:9px;border:1px solid #000;background:linear-gradient(#0f1012,#27292e);box-shadow:inset 0 2px 5px rgba(0,0,0,.85),0 1px 0 rgba(255,255,255,.12);color:#b7bcc6;font-weight:500;text-shadow:0 -1px 0 #000;text-align:left;overflow:hidden}
.root[data-skin=ios6] .bar .pill::before{content:"➤";position:absolute;left:3px;top:3px;bottom:3px;width:62px;border-radius:7px;background:linear-gradient(#fbfbfc,#b9bdc6);border:1px solid #777c86;box-shadow:inset 0 1px 0 #fff,0 1px 2px rgba(0,0,0,.6);color:#6c717b;font-size:1.4rem;display:flex;align-items:center;justify-content:center;text-shadow:0 1px 0 #fff}
.root[data-skin=ios6] .prog{height:16px;border-radius:8px;background:#fff;border:1px solid #6d7686;box-shadow:inset 0 2px 3px rgba(0,0,0,.35)}
.root[data-skin=ios6] .prog i{border-radius:8px;background-size:28px 28px,auto;background-image:repeating-linear-gradient(-45deg,rgba(255,255,255,.3) 0 7px,transparent 7px 14px),linear-gradient(#8bbcf5,#2f6fd6);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);animation:stripes 1s linear infinite}
/* ================= Windows 95 ================= */
.root[data-skin=win95]{font-family:"MS Sans Serif","Microsoft Sans Serif",Tahoma,Verdana,Arial,sans-serif;font-size:13px;color:#000;color-scheme:light;background:#008080;display:flex;align-items:center;justify-content:center;padding:12px 12px 44px;--rim:#000;--rface:#fff;--tick:#000;--hh:#000;--mh:#000;--sh:#f00}
.root[data-skin=win95] *{animation:none !important;transition:none !important}
.root[data-skin=win95] .app{position:relative;height:auto;max-height:100%;width:100%;max-width:440px;background:#c0c0c0;border:2px solid;border-color:#dfdfdf #000 #000 #dfdfdf;box-shadow:inset 1px 1px #fff,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.35);padding:3px}
.root[data-skin=win95] .app::before{content:"Los Purebreds Setup";flex:none;display:block;background:linear-gradient(90deg,#000080,#1084d0);color:#fff;font-weight:700;padding:3px 26px 3px 6px;margin-bottom:2px}
.root[data-skin=win95] .app::after{content:"x";position:absolute;right:6px;top:6px;width:16px;height:14px;background:#c0c0c0;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080;color:#000;font-weight:700;font-size:11px;line-height:9px;text-align:center}
.root[data-skin=win95] .screen{min-height:0;padding:12px 12px 4px}
.root[data-skin=win95] h1{font-size:1.15rem;font-weight:700;letter-spacing:0;margin:0 0 10px;color:#000}
.root[data-skin=win95] p,.root[data-skin=win95] .dim{font-size:13px;color:#000;margin:0 0 10px}
.root[data-skin=win95] .icon{width:34px;height:34px;padding:0;margin:2px 0 10px;border-radius:0;background:none;color:#000080}
.root[data-skin=win95] .hero{height:clamp(140px,24dvh,190px);margin-bottom:8px;background:#008080;border:2px solid;border-color:#808080 #fff #fff #808080;box-shadow:inset 1px 1px #000}
.root[data-skin=win95] .hero svg.aclk{filter:none;height:88%}
.root[data-skin=win95] .clk.sm{align-items:center;margin:0 0 8px}
.root[data-skin=win95] .clk{color:#000}
.root[data-skin=win95] .cd,.root[data-skin=win95] .ct .cc,.root[data-skin=win95] .ct small{color:#000}
.root[data-skin=win95] .cd{font-size:12px}
.root[data-skin=win95] .clk.sm .ct{font-size:1.3rem;font-weight:400;letter-spacing:0}
.root[data-skin=win95] .row{background:#c0c0c0;color:#000;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf;border-radius:0;font-size:13px;font-weight:400;padding:6px 8px;margin:0 0 6px;gap:8px}
.root[data-skin=win95] .row:active,.root[data-skin=win95] .row.open{border-color:#000 #fff #fff #000;box-shadow:inset 1px 1px #808080,inset -1px -1px #dfdfdf;transform:none;border-radius:0;background:#c0c0c0}
.root[data-skin=win95] .row:hover{background:#c0c0c0}
.root[data-skin=win95] .row svg:not(.chev){width:22px;height:22px;padding:0;border-radius:0;background:none;color:#000080}
.root[data-skin=win95] .row .chev{width:14px;height:14px;color:#000;background:none}
.root[data-skin=win95] .drawer{background:#c0c0c0;color:#000;border:2px solid;border-color:#808080 #fff #fff #808080;border-radius:0;padding:8px 10px;margin:0 0 6px}
.root[data-skin=win95] .drawer label.l{color:#000;font-size:12px;font-weight:400}
.root[data-skin=win95] .tg input{accent-color:#000080}
.root[data-skin=win95] .f{background:#fff;color:#000;border:2px solid;border-color:#808080 #fff #fff #808080;box-shadow:inset 1px 1px #000;border-radius:0;font-size:13px;padding:5px 6px;margin:4px 0 8px}
.root[data-skin=win95] .f:focus{box-shadow:inset 1px 1px #000;border-color:#808080 #fff #fff #808080;outline:none}
.root[data-skin=win95] select.f{background:#fff}
.root[data-skin=win95] .err{color:#800000;font-size:12px}
.root[data-skin=win95] .pill,.root[data-skin=win95] .bar .link{height:auto;min-width:84px;justify-content:center;padding:6px 16px;border-radius:0;background:#c0c0c0;color:#000;font-size:13px;font-weight:400;letter-spacing:0;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf;text-shadow:none}
.root[data-skin=win95] .pill:hover,.root[data-skin=win95] .bar .link:hover{background:#c0c0c0;box-shadow:inset -1px -1px #808080,inset 1px 1px #dfdfdf}
.root[data-skin=win95] .pill:active,.root[data-skin=win95] .bar .link:active{transform:none;border-radius:0;border-color:#000 #fff #fff #000;box-shadow:inset 1px 1px #808080;padding:7px 15px 5px 17px}
.root[data-skin=win95] .pill:focus-visible,.root[data-skin=win95] .link:focus-visible{outline:1px dotted #000;outline-offset:-5px}
.root[data-skin=win95] .bar{padding:8px 12px 10px;background:none}
.root[data-skin=win95] .drawer .link{color:#0000ee;height:auto;padding:0;text-decoration:underline}
.root[data-skin=win95] .prog{height:20px;margin:14px 0 8px;background:#fff;border:2px solid;border-color:#808080 #fff #fff #808080;border-radius:0;box-shadow:inset 1px 1px #000;padding:2px}
.root[data-skin=win95] .prog i{border-radius:0;background:repeating-linear-gradient(90deg,#000080 0 8px,transparent 8px 10px)}
.root[data-skin=win95] .tb{display:flex;align-items:center;position:absolute;left:0;right:0;bottom:0;height:32px;padding:3px 4px;background:#c0c0c0;border-top:2px solid #fff;box-shadow:0 -1px 0 #dfdfdf;z-index:2}
.root[data-skin=win95] .tb .st{display:inline-flex;align-items:center;height:24px;padding:0 8px;font-weight:700;color:#000;border:2px solid;border-color:#fff #000 #000 #fff;box-shadow:inset -1px -1px #808080}
.root[data-skin=win95] .tb .st::before{content:"";width:14px;height:12px;margin-right:5px;display:inline-block;background:linear-gradient(90deg,#f00 50%,#0a0 50%) top/100% 50% no-repeat,linear-gradient(90deg,#00f 50%,#fc0 50%) bottom/100% 50% no-repeat}
.root[data-skin=win95] .tb .tc{margin-left:auto;height:24px;display:inline-flex;align-items:center;padding:0 10px;font-size:12px;color:#000;border:1px solid;border-color:#808080 #fff #fff #808080}
/* ================= Windows XP (Luna welcome screen) ================= */
.root[data-skin=winxp]{font-family:Tahoma,"Segoe UI",Verdana,Arial,sans-serif;color:#fff;color-scheme:light;--rim:#2a64e0;--rface:#fff;--tick:#003c74;--hh:#003c74;--mh:#003c74;--sh:#e03a1f;
background:radial-gradient(ellipse 80% 70% at 18% 50%,rgba(255,255,255,.3),rgba(255,255,255,0) 62%),linear-gradient(#6f92e8,#4b72d6 50%,#3a5fc2)}
.root[data-skin=winxp]::before{content:"";position:absolute;left:0;right:0;top:0;height:60px;background:#00309c;border-bottom:3px solid;border-image:linear-gradient(90deg,#00309c,#b5c7f5 50%,#00309c) 1;z-index:0}
.root[data-skin=winxp]::after{content:"";position:absolute;left:0;right:0;bottom:0;height:76px;background:#00309c;border-top:3px solid;border-image:linear-gradient(90deg,#00309c,#f2a64a 50%,#00309c) 1;z-index:0}
.root[data-skin=winxp] .app{position:relative;z-index:1;padding:60px 0 0}
.root[data-skin=winxp] .screen{padding:20px 20px 0}
.root[data-skin=winxp] h1{font-family:"Franklin Gothic Medium","Trebuchet MS",Tahoma,sans-serif;font-style:italic;font-weight:700;font-size:2.3rem;letter-spacing:-.01em;color:#fff;margin:0 0 8px;text-shadow:2px 2px 3px rgba(0,20,90,.7)}
.root[data-skin=winxp] p,.root[data-skin=winxp] .dim{color:#dbe6ff;text-shadow:1px 1px 1px rgba(0,20,90,.5)}
.root[data-skin=winxp] .icon{width:72px;height:72px;padding:16px;margin:8px 0 18px;border:3px solid #fff;border-radius:8px;background:linear-gradient(#7aa5f7,#2b5fd0);color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.45);animation:pop .5s cubic-bezier(.3,1.4,.5,1) both}
.root .icon.mascot{width:96px;height:96px;padding:0 !important;margin:10px auto 18px;border:0 !important;border-radius:0 !important;background:none !important;box-shadow:none !important;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35));animation:pop .5s cubic-bezier(.3,1.4,.5,1) both !important}
.root .icon.hatspin{width:120px;height:120px;filter:none;overflow:visible;animation:pop .5s cubic-bezier(.3,1.4,.5,1) both !important}
.hatspin .cane-back,.hatspin .cane-front{overflow:visible}
.hatspin .cane-rot{transform-origin:0 0}
/* the spin itself is driven by JS (see #hatspin-raf below), not a CSS animation: some Windows setups
   (the "Show animations" accessibility toggle, or a browser/driver that mutes CSS animations when the
   OS reports reduced motion) silently freeze a plain CSS @keyframes animation, which left this loading
   icon stuck. requestAnimationFrame always runs, so the spin can't be muted that way. */
.root[data-skin=winxp] .hero{height:clamp(150px,27dvh,220px)}
.root[data-skin=winxp] .hero svg.aclk{filter:drop-shadow(0 6px 10px rgba(0,20,90,.55))}
.root[data-skin=winxp] .clk.sm{text-shadow:1px 1px 2px rgba(0,20,90,.6)}
.root[data-skin=winxp] .cd,.root[data-skin=winxp] .ct .cc,.root[data-skin=winxp] .ct small{color:#dbe6ff}
.root[data-skin=winxp] .row{background:rgba(0,48,156,.35);border:1px solid rgba(255,255,255,.4);border-radius:8px;color:#fff;font-size:1.05rem;font-weight:700;padding:9px 12px;margin:0 0 8px;text-shadow:1px 1px 2px rgba(0,20,90,.7);transition:background .15s,border-color .15s}
.root[data-skin=winxp] .row:hover{background:rgba(255,255,255,.22);border-color:#fff}
.root[data-skin=winxp] .row:active,.root[data-skin=winxp] .row.open{transform:none;border-radius:8px;background:rgba(255,255,255,.28);border-color:#fff}
.root[data-skin=winxp] .row svg:not(.chev){width:46px;height:46px;padding:9px;border:2px solid #fff;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.4);color:#fff}
.root[data-skin=winxp] #cl svg:not(.chev){background:linear-gradient(#fbbf55,#df7810)}
.root[data-skin=winxp] #st svg:not(.chev){background:linear-gradient(#86d664,#2f8f2a)}
.root[data-skin=winxp] .row .chev{width:22px;height:22px;padding:0;color:#fff;background:none;border:0;box-shadow:none}
.root[data-skin=winxp] .drawer{background:#ece9d8;color:#000;border:1px solid #003c74;border-radius:6px;margin:-2px 0 8px;padding:12px 14px;text-shadow:none}
.root[data-skin=winxp] .drawer label.l{color:#333;font-weight:400}
.root[data-skin=winxp] .drawer .link{color:#0033cc;height:auto;padding:0;text-decoration:underline}
.root[data-skin=winxp] .tg input{accent-color:#316ac5}
.root[data-skin=winxp] .f{background:#fff;color:#000;border:1px solid #7f9db9;border-radius:3px;font-size:1rem;padding:10px;box-shadow:none}
.root[data-skin=winxp] .f:focus{border-color:#316ac5;box-shadow:0 0 0 1px #316ac5}
.root[data-skin=winxp] select.f{background:#fff}
.root[data-skin=winxp] .err{color:#ffd27a;text-shadow:1px 1px 1px rgba(0,20,90,.6)}
.root[data-skin=winxp] .drawer .err{color:#b00020;text-shadow:none}
.root[data-skin=winxp] .pill{height:36px;padding:0 20px;border-radius:5px;border:1px solid #1a5c1a;background:linear-gradient(#5fd35b,#3aa733 55%,#2c8c27);color:#fff;font-weight:700;font-style:italic;text-shadow:1px 1px 1px rgba(0,0,0,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);transition:filter .15s}
.root[data-skin=winxp] .pill:hover{filter:brightness(1.08);background:linear-gradient(#5fd35b,#3aa733 55%,#2c8c27)}
.root[data-skin=winxp] .pill:active{border-radius:5px;transform:none;filter:brightness(.9)}
.root[data-skin=winxp] .drawer .pill{height:32px;border-color:#003c74;border-radius:3px;background:linear-gradient(#fff,#ecebe5 86%,#d8d0c4);color:#000;font-style:normal;font-weight:400;text-shadow:none;box-shadow:none}
.root[data-skin=winxp] .bar{height:76px;padding:0 24px;background:none}
.root[data-skin=winxp] .bar .pill{height:44px;border-radius:5px 18px 18px 5px;font-size:1.05rem}
.root[data-skin=winxp] .bar .link{color:#fff;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,.6)}
.root[data-skin=winxp] .bar .link:hover{background:rgba(255,255,255,.18)}
.root[data-skin=winxp] .prog{height:20px;margin:16px 0 8px;background:#fff;border:1px solid #686868;border-radius:4px;box-shadow:inset 0 1px 2px rgba(0,0,0,.3);padding:2px}
.root[data-skin=winxp] .prog i{border-radius:2px;background:linear-gradient(rgba(255,255,255,.55),transparent 55%),repeating-linear-gradient(90deg,#37d033 0 8px,transparent 8px 11px)}
`;
var host=D.createElement("div"); host.id="px-host";
host.style.cssText="position:fixed;inset:0;z-index:2147483001;display:block";
var sh=host.attachShadow({mode:"open"});
sh.innerHTML="<style>"+CSS+"</style><div class=\"root\" id=\"root\"><div class=\"app\" id=\"app\"></div><div class=\"tb\" id=\"tb\"><span class=\"st\">Start</span><span class=\"tc\" id=\"tbc\"></span></div></div>";
D.body.appendChild(host);
var $=function(s){return sh.querySelector(s)}, app=$("#app"), root=$("#root");
var shown=true, tm=0, S={user:"",pass:"",fresh:false,err:"",have:false,redo:false};
var svg=function(b){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+b+'</svg>'};
var ic={hat:'<svg class="icon mascot hatspin" viewBox="0 0 120 120" aria-hidden="true"><g class="cane-back" transform="translate(60 58)"><g class="cane-rot"><path d="M0 46 L0 -18 C0 -32 10 -38 20 -38 C28 -38 32 -32 32 -26" fill="none" stroke="#000" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 46 L0 -18 C0 -32 10 -38 20 -38 C28 -38 32 -32 32 -26" fill="none" stroke="#f3d592" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -33.5 L33.6 -29.5" stroke="#000" stroke-width="3" fill="none"/><circle cx="26.8" cy="-35.2" r=".9" fill="#f3d592"/><circle cx="29.6" cy="-31.6" r=".9" fill="#f3d592"/><circle cx="32.2" cy="-28.6" r=".9" fill="#f3d592"/></g></g><g stroke="#fff" stroke-width="1.6" stroke-linejoin="round"><polygon points="42,30 78,30 75,64 45,64" fill="#000"/><rect x="45" y="64" width="30" height="7" fill="#f3d592" stroke="#000" stroke-width="1"/><rect x="32" y="71" width="56" height="14" fill="#000"/></g><g class="cane-front" transform="translate(60 58)"><g class="cane-rot"><path d="M0 46 L0 -18 C0 -32 10 -38 20 -38 C28 -38 32 -32 32 -26" fill="none" stroke="#000" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 46 L0 -18 C0 -32 10 -38 20 -38 C28 -38 32 -32 32 -26" fill="none" stroke="#f3d592" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.2 -33.5 L33.6 -29.5" stroke="#000" stroke-width="3" fill="none"/><circle cx="26.8" cy="-35.2" r=".9" fill="#f3d592"/><circle cx="29.6" cy="-31.6" r=".9" fill="#f3d592"/><circle cx="32.2" cy="-28.6" r=".9" fill="#f3d592"/></g></g></svg>',hi:'<img class="icon mascot" alt="" draggable="false" src="'+(typeof LOGO==="string"?LOGO:"")+'">',user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),key:svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'),ok:svg('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>')};
var ROWI={log:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/></svg>',set:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',chev:'<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'};
/* theme skin: the setup screens follow the chat theme the person picked */
var CUSTOM={ios6:1,win95:1,winxp:1},ROUND={ios6:1,win95:1,winxp:1};
function rgbOf(c){if(!c||!(window.CSS&&window.CSS.supports&&window.CSS.supports("color",c)))return null;var e=D.createElement("i");e.style.cssText="position:absolute;visibility:hidden;color:"+c;D.body.appendChild(e);var m=getComputedStyle(e).color.match(/[\d.]+/g);D.body.removeChild(e);return m&&m.length>=3?[+m[0],+m[1],+m[2]]:null}
function lum(a){return(.299*a[0]+.587*a[1]+.114*a[2])/255}
function rgbs(a){return"rgb("+Math.round(a[0])+","+Math.round(a[1])+","+Math.round(a[2])+")"}
function skin(){
 var b=D.body,t=b.dataset.theme||"imessage",cs=getComputedStyle(b),st=root.style;
 root.setAttribute("data-skin",t);
 if(ROUND[t])root.setAttribute("data-round","1");else root.removeAttribute("data-round");
 var names=["--a","--on-a","--bg","--tx","--mu"];
 if(CUSTOM[t]){names.forEach(function(n){st.removeProperty(n)});st.removeProperty("color-scheme");return}
 function pick(n){return rgbOf(cs.getPropertyValue(n).trim())}
 var a=pick("--accent"),bg=pick("--bg"),tx=pick("--text"),mu=pick("--muted");
 if(a){st.setProperty("--a",rgbs(a));st.setProperty("--on-a",lum(a)>.6?"#141414":"#ffffff")}
 if(bg){st.setProperty("--bg",rgbs(bg));st.setProperty("color-scheme",lum(bg)>.5?"light":"dark")}
 if(tx)st.setProperty("--tx",rgbs(tx));
 if(mu)st.setProperty("--mu",rgbs(mu));
}
try{new MutationObserver(skin).observe(D.body,{attributes:true,attributeFilter:["data-theme"]})}catch(e){}
function tbtick(){var e=$("#tbc");if(!e)return;try{e.textContent=new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}catch(x){}}
setInterval(tbtick,1000);tbtick();
function scr(icon,title,body,left,right){app.innerHTML='<div class="screen">'+icon+'<h1>'+title+'</h1>'+body+'</div><div class="bar">'+(left||"<span></span>")+(right||"")+'</div>'}
function savedName(){var n=ls("chat_usr");return n&&n!=="User"?n:""}
function gateOpen(){return gate.style.display==="none"||gate.classList.contains("leaving")}
function showOv(){shown=true;H.classList.add("px-on");host.style.display="block";root.style.opacity=1}
function hideOv(){shown=false;H.classList.remove("px-on");root.style.opacity=0;setTimeout(function(){if(!shown)host.style.display="none"},320)}
function go(n){clearInterval(tm);({welcome:welcome,code:codeS,intro:intro,user:userS,passIntro:passIntro,pass:passS,done:done,login:login})[n]()}

var CONN_RE=/couldn.t (connect|join)|can.t reach|isn.t responding|not responding|disconnected from the room|went offline/i;
function addOfflineBtn(){var s=app.querySelector(".screen");if(!s||s.querySelector("#offl"))return;var p=D.createElement("p");p.className="dim";p.textContent="Can\u2019t get in? You can still look around. Anything that needs the chat room stays locked.";var b=D.createElement("button");b.className="link";b.id="offl";b.type="button";b.textContent="Continue without chat (view only)";b.onclick=function(){clearInterval(tm);if(window.__enterOffline)window.__enterOffline();hideOv()};s.appendChild(p);s.appendChild(b)}
window.__pbHideOv=function(){hideOv()};
window.__pbSignIn=function(){S.err="";S.pass="";S.fresh=false;S.user=savedName()||S.user;showOv();if(S.user)join(S.user,"");else login()};
function welcome(){
 var gb=D.querySelector(".goback"),href=gb?gb.href:"";
 app.innerHTML='<div class="screen"><div class="hero"><svg class="aclk" viewBox="0 0 200 200" role="img" aria-label="Analog clock"><defs><path id="datearc" d="M100 100 m-62 0 a62 62 0 1 1 124 0 a62 62 0 1 1 -124 0"/></defs><path class="sc" d="M100.0,6.0 L103.3,6.6 L106.4,8.2 L109.4,10.6 L112.2,13.5 L114.8,16.3 L117.3,18.7 L119.9,20.3 L122.6,21.1 L125.7,20.9 L129.1,20.1 L132.7,19.0 L136.5,17.9 L140.3,17.3 L143.9,17.5 L147.0,18.6 L149.5,20.7 L151.5,23.7 L152.8,27.3 L153.8,31.1 L154.6,34.9 L155.6,38.2 L157.1,40.9 L159.1,42.9 L161.8,44.4 L165.1,45.4 L168.9,46.2 L172.7,47.2 L176.3,48.5 L179.3,50.5 L181.4,53.0 L182.5,56.1 L182.7,59.7 L182.1,63.5 L181.0,67.3 L179.9,70.9 L179.1,74.3 L178.9,77.4 L179.7,80.1 L181.3,82.7 L183.7,85.2 L186.5,87.8 L189.4,90.6 L191.8,93.6 L193.4,96.7 L194.0,100.0 L193.4,103.3 L191.8,106.4 L189.4,109.4 L186.5,112.2 L183.7,114.8 L181.3,117.3 L179.7,119.9 L178.9,122.6 L179.1,125.7 L179.9,129.1 L181.0,132.7 L182.1,136.5 L182.7,140.3 L182.5,143.9 L181.4,147.0 L179.3,149.5 L176.3,151.5 L172.7,152.8 L168.9,153.8 L165.1,154.6 L161.8,155.6 L159.1,157.1 L157.1,159.1 L155.6,161.8 L154.6,165.1 L153.8,168.9 L152.8,172.7 L151.5,176.3 L149.5,179.3 L147.0,181.4 L143.9,182.5 L140.3,182.7 L136.5,182.1 L132.7,181.0 L129.1,179.9 L125.7,179.1 L122.6,178.9 L119.9,179.7 L117.3,181.3 L114.8,183.7 L112.2,186.5 L109.4,189.4 L106.4,191.8 L103.3,193.4 L100.0,194.0 L96.7,193.4 L93.6,191.8 L90.6,189.4 L87.8,186.5 L85.2,183.7 L82.7,181.3 L80.1,179.7 L77.4,178.9 L74.3,179.1 L70.9,179.9 L67.3,181.0 L63.5,182.1 L59.7,182.7 L56.1,182.5 L53.0,181.4 L50.5,179.3 L48.5,176.3 L47.2,172.7 L46.2,168.9 L45.4,165.1 L44.4,161.8 L42.9,159.1 L40.9,157.1 L38.2,155.6 L34.9,154.6 L31.1,153.8 L27.3,152.8 L23.7,151.5 L20.7,149.5 L18.6,147.0 L17.5,143.9 L17.3,140.3 L17.9,136.5 L19.0,132.7 L20.1,129.1 L20.9,125.7 L21.1,122.6 L20.3,119.9 L18.7,117.3 L16.3,114.8 L13.5,112.2 L10.6,109.4 L8.2,106.4 L6.6,103.3 L6.0,100.0 L6.6,96.7 L8.2,93.6 L10.6,90.6 L13.5,87.8 L16.3,85.2 L18.7,82.7 L20.3,80.1 L21.1,77.4 L20.9,74.3 L20.1,70.9 L19.0,67.3 L17.9,63.5 L17.3,59.7 L17.5,56.1 L18.6,53.0 L20.7,50.5 L23.7,48.5 L27.3,47.2 L31.1,46.2 L34.9,45.4 L38.2,44.4 L40.9,42.9 L42.9,40.9 L44.4,38.2 L45.4,34.9 L46.2,31.1 L47.2,27.3 L48.5,23.7 L50.5,20.7 L53.0,18.6 L56.1,17.5 L59.7,17.3 L63.5,17.9 L67.3,19.0 L70.9,20.1 L74.3,20.9 L77.4,21.1 L80.1,20.3 L82.7,18.7 L85.2,16.3 L87.8,13.5 L90.6,10.6 L93.6,8.2 L96.7,6.6 L100.0,6.0Z"/><g class="rd"><circle class="rim" cx="100" cy="100" r="95"/><circle class="rf" cx="100" cy="100" r="87"/><line class="tk" x1="100.0" y1="32.0" x2="100.0" y2="18.0" stroke-width="3.4" stroke-linecap="round"/><line class="tk" x1="137.5" y1="35.0" x2="141.0" y2="29.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="165.0" y1="62.5" x2="171.0" y2="59.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="168.0" y1="100.0" x2="182.0" y2="100.0" stroke-width="3.4" stroke-linecap="round"/><line class="tk" x1="165.0" y1="137.5" x2="171.0" y2="141.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="137.5" y1="165.0" x2="141.0" y2="171.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="100.0" y1="168.0" x2="100.0" y2="182.0" stroke-width="3.4" stroke-linecap="round"/><line class="tk" x1="62.5" y1="165.0" x2="59.0" y2="171.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="35.0" y1="137.5" x2="29.0" y2="141.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="32.0" y1="100.0" x2="18.0" y2="100.0" stroke-width="3.4" stroke-linecap="round"/><line class="tk" x1="35.0" y1="62.5" x2="29.0" y2="59.0" stroke-width="1.6" stroke-linecap="round"/><line class="tk" x1="62.5" y1="35.0" x2="59.0" y2="29.0" stroke-width="1.6" stroke-linecap="round"/></g><text class="dt" font-size="11" font-weight="600" letter-spacing="1.2"><textPath href="#datearc" startOffset="9%" id="adate"></textPath></text><text class="dtr" x="100" y="140" text-anchor="middle" id="adate2"></text><circle class="dot" cx="46" cy="148" r="7"/><g id="ahr" stroke-linecap="round"><line x1="100" y1="100" x2="100" y2="58" stroke-width="13"/></g><g id="amn" stroke-linecap="round"><line x1="100" y1="100" x2="100" y2="34" stroke-width="13"/></g><g id="asc" stroke-linecap="round"><line x1="100" y1="114" x2="100" y2="20" stroke-width="1.6"/></g><circle class="c1" cx="100" cy="100" r="7"/><circle class="c2" cx="100" cy="100" r="3.5"/></svg></div><div class="clk sm" id="pxclock" aria-label="Current time"><div class="cd" id="cdate"></div><div class="ct"><span id="ch"></span><span class="cc">:</span><span id="cm"></span><small id="cap"></small></div></div><div class="spacer"></div><h1>Welcome to Los Purebreds</h1><p class="dim">Version 3.0</p>'+
 '<button class="row" id="cl">'+ROWI.log+'<span>Changelog</span>'+ROWI.chev+'</button><div id="clb"></div>'+
 '<button class="row" id="st">'+ROWI.set+'<span>Settings</span>'+ROWI.chev+'</button><div id="stb"></div></div>'+
 '<div class="bar">'+(href?'<a class="link" href="'+href+'" rel="noopener">Go back</a>':'<span></span>')+'<button class="pill" id="gs">Get started</button></div>';
 $("#cl").onclick=function(){
  var b=$("#clb");this.classList.toggle("open");
  if(b.innerHTML){b.innerHTML="";return}
  var OLD='<li>New setup screens inspired by the Pixel</li><li>Room code is saved after you enter it once</li><li>Username and password on one screen, ready to press continue</li><li>Loading bar with a live percent</li>';
  var ST='style="max-height:46vh;overflow:auto"';
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  b.innerHTML='<div class="drawer"><ul><li>Loading\u2026</li></ul></div>';
  var f=window.__pbClLoad;
  (f?f():Promise.reject(new Error("none"))).then(function(list){
   if(!b.innerHTML)return;                                   // closed again while loading
   var li=list.slice(0,20).map(function(c){
    var t=String(c.commit.message||"").split("\n")[0],d=new Date(c.commit.author.date).toLocaleDateString(undefined,{month:"short",day:"numeric"});
    return"<li>"+esc(t)+' <small style="opacity:.55">'+esc(d)+"</small></li>"}).join("");
   b.innerHTML='<div class="drawer" '+ST+'><ul>'+(li||"<li>No commits yet.</li>")+'</ul></div>';
  }).catch(function(){
   if(b.innerHTML)b.innerHTML='<div class="drawer"><ul>'+OLD+'<li style="opacity:.6;list-style:none;margin-left:-18px">Couldn\u2019t reach GitHub, so this is the saved list.</li></ul></div>';
  });
 };
 $("#st").onclick=function(){
  var b=$("#stb");this.classList.toggle("open");
  if(b.innerHTML){b.innerHTML="";return}
  var gt=G("g-theme"),opts="";
  if(gt)for(var i=0;i<gt.options.length;i++)opts+='<option value="'+gt.options[i].value+'"'+(gt.options[i].value===gt.value?" selected":"")+'>'+esc(gt.options[i].text)+'</option>';
  var on=G("gadm")&&G("gadm").classList.contains("on");
  b.innerHTML='<div class="drawer"><label class="tg">Large text<input type="checkbox" id="lt"'+(root.classList.contains("big")?" checked":"")+'></label><label class="l">Theme</label><select class="f" id="th">'+opts+'</select><button class="link" id="redo">Redo setup</button></div>';
  $("#redo").onclick=function(){try{localStorage.removeItem("pb_code")}catch(e){}S.user="";S.pass="";S.fresh=true;S.have=false;S.redo=true;S.err="";go("code")};
  $("#lt").onchange=function(){root.classList.toggle("big",this.checked)};
  $("#th").onchange=function(){gt.value=this.value;gt.dispatchEvent(new Event("change",{bubbles:true}))};
 };
 $("#gs").onclick=function(){if(ls("pb_code")===RC)afterCode();else go("code")};
 (function(){   /* Pixel-style clock: follows the device's 12 / 24 hour setting */
  var ro={};try{ro=Intl.DateTimeFormat(undefined,{hour:"numeric"}).resolvedOptions()}catch(e){}
  var h12=ro.hour12!==undefined?!!ro.hour12:(ro.hourCycle==="h12"||ro.hourCycle==="h11");
  function p2(n){return(n<10?"0":"")+n}
  var ct;
  function tick(){
   if(!$("#pxclock")){clearInterval(ct);return}          /* screen changed: stop */
   var d=new Date(),h=d.getHours();
   $("#ch").textContent=h12?String(h%12||12):p2(h);
   $("#cm").textContent=p2(d.getMinutes());
   $("#cap").textContent=h12?(h<12?"AM":"PM"):"";
   $("#cdate").textContent=d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});
   var m=d.getMinutes(),s=d.getSeconds(),hr=$("#ahr"),mn=$("#amn"),ad=$("#adate");
   if(hr)hr.style.transform="rotate("+(((h%12)+m/60)*30)+"deg)";
   if(mn)mn.style.transform="rotate("+((m+s/60)*6)+"deg)";
   if(ad)ad.textContent=d.toLocaleDateString(undefined,{weekday:"short",day:"numeric"});
   var sc=$("#asc"),a2=$("#adate2");
   if(sc)sc.style.transform="rotate("+(s*6)+"deg)";
   if(a2)a2.textContent=d.toLocaleDateString(undefined,{weekday:"short",day:"numeric"}).toUpperCase();
  }
  ct=setInterval(tick,1000);tick();
 })();
}
function haveAcct(){S.have=true;S.fresh=false;S.redo=false;S.pass="";S.user=S.user||savedName();go("login")}
function afterCode(){var n=savedName();if(n&&!S.redo){S.user=n;S.fresh=false;go("login")}else{S.fresh=true;go("intro")}}
function codeS(){
 scr(ic.key,"Enter room code",'<p class="dim">Ask a Los Purebreds member for the room code.</p><input class="f" id="rc" type="password" placeholder="Room code" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="err" id="e"></div>','<button class="link" id="b">Back</button>','<button class="pill" id="n">Next</button>');
 function ok(){if($("#rc").value.trim().toLowerCase()!==RC.toLowerCase()){$("#e").textContent="That room code isn’t right. Check it and try again.";return}lsSet("pb_code",RC);afterCode()}
 $("#b").onclick=welcome;$("#n").onclick=ok;$("#rc").onkeydown=function(e){if(e.key==="Enter")ok()};setTimeout(function(){$("#rc").focus()},350);
}
function intro(){scr(ic.hi,"Get the best chatting experience",'<p>Make an account to join Los Purebreds.</p><button class="link" id="have">I already have an account</button>','<button class="link" id="b">Back</button>','<button class="pill" id="n">Continue</button>');$("#have").onclick=haveAcct;$("#b").onclick=welcome;$("#n").onclick=function(){go("user")}}
function userS(){
 scr(ic.user,"Choose a username",'<p class="dim">Others will see this name in the chat.</p><input class="f" id="u" placeholder="Username" autocomplete="username" maxlength="12" value="'+esc(S.user)+'"><div class="err" id="e"></div><button class="link" id="have">I already have an account</button>','<button class="link" id="b">Back</button>','<button class="pill" id="n">Next</button>');
 $("#have").onclick=function(){S.user=$("#u").value.trim();haveAcct()};
 function nx(){var v=$("#u").value.trim();if(v.length<2){$("#e").textContent="Use at least 2 characters.";return}S.user=v;go("passIntro")}
 $("#b").onclick=intro;$("#n").onclick=nx;$("#u").onkeydown=function(e){if(e.key==="Enter")nx()};setTimeout(function(){$("#u").focus()},350);
}
function passIntro(){scr(ic.key,"Time to set up a password","<p>Pick something you will remember. It protects your name so nobody else can use it.</p>",'<button class="link" id="b">Back</button>','<button class="pill" id="n">Continue</button>');$("#b").onclick=function(){go("user")};$("#n").onclick=function(){go("pass")}}
function passS(){
 scr(ic.key,"Choose a password",'<input class="f" id="p1" type="password" placeholder="Password" autocomplete="new-password"><input class="f" id="p2" type="password" placeholder="Confirm password" autocomplete="new-password"><div class="err" id="e"></div>','<button class="link" id="b">Back</button>','<button class="pill" id="n">Next</button>');
 function nx(){var a=$("#p1").value,b=$("#p2").value;if(a.length<4){$("#e").textContent="Use at least 4 characters.";return}if(a!==b){$("#e").textContent="Passwords don’t match. Try again.";return}S.pass=a;go("done")}
 $("#b").onclick=passIntro;$("#n").onclick=nx;$("#p2").onkeydown=function(e){if(e.key==="Enter")nx()};setTimeout(function(){$("#p1").focus()},350);
}
function done(){scr(ic.ok,"You’re all set","<p>Welcome to Los Purebreds.</p>","",'<button class="pill" id="n">Continue</button>');$("#n").onclick=function(){go("login")}}
function login(){
 var saved=!!ls("pb_pwh")&&!S.pass,err=S.err;S.err="";
 scr(ic.hi,"Welcome to Los Purebreds",'<p class="dim">'+(saved?"Your password is saved on this device. Just press continue.":"Your username and password are filled in. Just press continue.")+'</p><input class="f" id="u" maxlength="12" autocomplete="username" placeholder="Username" value="'+esc(S.user)+'"><input class="f" id="p" type="password" autocomplete="current-password" placeholder="'+(saved?"Saved on this device":"Password")+'" value="'+esc(S.pass)+'"><div class="err" id="e">'+esc(err)+'</div>','<button class="link" id="b">Back</button>','<button class="pill" id="n">Continue</button>');
 if(err&&CONN_RE.test(err))addOfflineBtn();
 $("#b").onclick=function(){go(S.fresh?"user":S.have?"intro":"welcome")};
 function nx(){
  var u=$("#u").value.trim(),p=$("#p").value;
  if(!u){$("#e").textContent="Enter a username.";return}
  if(!p&&!ls("pb_pwh")){$("#e").textContent="Enter a password.";return}
  if(p&&p.length<4){$("#e").textContent="Password must be at least 4 characters.";return}
  S.user=u;S.pass=p;join(u,p);
 }
 $("#n").onclick=nx;$("#p").onkeydown=function(e){if(e.key==="Enter")nx()};
}
function fill(id,v){var el=G(id);if(!el)return;el.value=v;["input","change"].forEach(function(t){el.dispatchEvent(new Event(t,{bubbles:true}))})}
function join(u,p){S.redo=false;
 fill("g-code",RC);fill("g-name",u);fill("g-pw",p);
 loadScr(false);
 G("g-go").click();
}
function loadScr(auto){
 scr(ic.hat,"Loading..",'<div class="prog"><i id="fill"></i></div><p id="pc" class="dim">0%</p><p id="sub" class="dim">Connecting to the room…</p>','<button class="link" id="b">Cancel</button>','');
 $("#b").onclick=function(){clearInterval(tm);var sk=G("al-skip");if(auto&&H.classList.contains("autoload")&&sk)sk.click();else if(window.__leave&&window.__entering)window.__leave("");S.err="";login()};
 var p=0,t0=Date.now(),started=!auto,offAdded=false;
 function paint(){var n=Math.round(p),f=$("#fill");if(!f)return;f.style.width=p+"%";$("#pc").textContent=n+"%";$("#sub").textContent=n>=100?"All done!":n<30?"Connecting to the room…":n<70?"Checking your name & password…":"Loading chat…"}
 clearInterval(tm);
 tm=setInterval(function(){
  if(window.__entering||window.__autoJoined)started=true;
  if(!offAdded&&Date.now()-t0>10000&&!gateOpen()){offAdded=true;addOfflineBtn()}
  if(gateOpen()){clearInterval(tm);p=100;paint();setTimeout(hideOv,500);return}
  var failed=(started&&!window.__entering)||(auto&&!started&&!H.classList.contains("autoload"))||Date.now()-t0>45000;
  if(failed){clearInterval(tm);var m=(G("gerr").textContent||"").trim();S.err=(m&&m!=="Connecting…")?m:(auto&&!started?"":"Couldn’t join the room. Try again.");if(!S.user)S.user=savedName();login();return}
  p+=(92-p)*.045+.12;if(p>93)p=93;paint();
 },100);
}
/* the app kicks you back to the join screen (kicked, room full, lost connection): show the new login screen with the reason */
new MutationObserver(function(){
 if(!shown&&!gateOpen()&&!window.__entering){var m=(G("gerr").textContent||"").trim();S.err=(m&&m!=="Connecting…")?m:"";S.fresh=false;S.pass="";S.user=savedName()||S.user;showOv();login()}
}).observe(gate,{attributes:true,attributeFilter:["style","class"]});
/* start: returning members who are auto-signing-in go straight to the loading bar */
skin();if(H.classList.contains("autoload"))loadScr(true);else welcome();
})();
