/* ===== 24-fr-js.js ===== */
(function(){
  /* ===== Friends: friend requests that work for people who are online AND offline, plus Discord-style "friends since / chatting since" =====
     Every friendship is one small record (pending / friends / removed). The host keeps all of them (like groups and DMs), hands them to people
     when they connect, and every device keeps its own copy so a new host can be rebuilt from everybody's copies. Newest change wins. */
  const $f = id => document.getElementById(id);
  const KEY = "pb_fr2", DAY = 864e5;
  let R = {};                                       // "<uidA>|<uidB>" (sorted) -> { a, b, an, bn, s: p|f|x, by, ts, since }
  const claims = {};                                // host only: "we're friends" claims that need the other person to agree (used after a host change)
  const key = (u, v) => u < v ? u + "|" + v : v + "|" + u;
  function cleanRec(x){
    if(!x || typeof x !== "object") return null;
    const a = String(x.a || ""), b = String(x.b || "");
    if(!okUid(a) || !okUid(b) || a === b || a > b) return null;
    const s = x.s === "p" || x.s === "f" || x.s === "x" ? x.s : ""; if(!s) return null;
    const by = String(x.by || ""); if(by !== a && by !== b) return null;
    const now = Date.now(), ts = Math.min(now + 60000, Math.max(0, +x.ts || 0)); if(!ts) return null;
    return { a, b, an: String(x.an || "").slice(0, 12), bn: String(x.bn || "").slice(0, 12), s, by, ts, since: Math.min(now + 60000, Math.max(0, +x.since || 0)) };
  }
  try{ const o = JSON.parse(load(KEY, "{}")) || {}; Object.keys(o).slice(0, 4000).forEach(k => { const r = cleanRec(o[k]); if(r && key(r.a, r.b) === k && !(r.s === "x" && Date.now() - r.ts > 30 * DAY)) R[k] = r; }); }catch(e){ R = {}; }
  let saveT = 0;
  const saveR = () => { clearTimeout(saveT); saveT = setTimeout(() => save(KEY, JSON.stringify(R)), 300); };
  const involves = (r, u) => r.a === u || r.b === u;
  const otherOf = r => r.a === uid ? r.b : r.a;
  const fmtDate = ts => new Date(ts).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
  const isOn = u => (lastRoster || []).some(e => e.c === u);
  function nameOf(u, r){
    const ro = (lastRoster || []).find(e => e.c === u); if(ro) return ro.n;
    for(let i = logs.length - 1; i >= 0; i--){ const l = logs[i]; if(l.c === u && l.u) return l.u; if(l.to === u && l.tn) return l.tn; }
    return r ? (r.a === u ? r.an : r.bn) || "Someone" : "Someone";
  }
  const relWith = u => R[key(uid, u)] || null;
  function status(u){ const r = relWith(u); if(!r || r.s === "x") return "none"; if(r.s === "f") return "friend"; return r.by === uid ? "out" : "in"; }
  function mineList(){ const o = []; for(const k in R){ const r = R[k]; if(involves(r, uid)) o.push(r); } return o; }
  function firstTs(k){ let m = 0; for(const l of logs){ if(l.del || !l.ts) continue; if(dmKey(l) === k && (!m || l.ts < m)) m = l.ts; } return m; }

  /* ---------- toast ---------- */
  let tt = 0;
  function toast(t){ const e = $f("frtoast"); e.textContent = t; e.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => e.classList.remove("on"), 4200); }

  /* ---------- applying a record (host and clients) ---------- */
  function apply(rec, quiet){
    const k = key(rec.a, rec.b), old = R[k];
    if(old && old.ts >= rec.ts) return false;
    R[k] = rec; saveR();
    if(!quiet && involves(rec, uid)){
      const nm = nameOf(otherOf(rec), rec);
      if(rec.s === "p" && rec.by !== uid) toast("👋 " + nm + " sent you a friend request");
      else if(rec.s === "f" && old && old.s === "p" && old.by === uid) toast("🎉 " + nm + " accepted your friend request");
    }
    return true;
  }
  function push(rec){ conns.forEach(x => { if(x.open && x.uid && involves(rec, x.uid)) { try{ x.send({ t: "FR", i: newId(), a: "rec", r: [rec] }); }catch(e){} } }); }
  function commit(rec){ if(apply(rec, false)){ push(rec); renderAll(); } }

  /* ---------- host: someone asks to do something ---------- */
  function hostAct(me, meName, d){
    const other = String(d.to || ""); if(!okUid(other) || other === me) return;
    const k = key(me, other), cur = R[k], now = Math.max(Date.now(), cur ? cur.ts + 1 : 0);
    const a = me < other ? me : other, b = me < other ? other : me;
    const tn = String(d.tn || "").trim().slice(0, 12);
    const nm = {}; nm[me] = String(meName || "").slice(0, 12); nm[other] = tn || (cur ? (cur.a === other ? cur.an : cur.bn) : "");
    let rec = null;
    if(d.k === "req"){
      if(cur && cur.s === "f") return;
      if(cur && cur.s === "p"){ if(cur.by === me) return; rec = { ...cur, an: nm[a] || cur.an, bn: nm[b] || cur.bn, s: "f", by: me, ts: now, since: now }; }   // they already asked you: you're friends now
      else {
        let n = 0; for(const x in R){ if(R[x].s === "p" && R[x].by === me) n++; }
        if(n >= 40){ return; }
        rec = { a, b, an: nm[a], bn: nm[b], s: "p", by: me, ts: now, since: 0 };
      }
    } else if(d.k === "acc"){
      if(!cur || cur.s !== "p" || cur.by === me) return;
      rec = { ...cur, an: nm[a] || cur.an, bn: nm[b] || cur.bn, s: "f", ts: now, since: now };
    } else if(d.k === "rm"){
      if(!cur || cur.s === "x") return;
      rec = { ...cur, s: "x", by: me, ts: now };
    } else return;
    commit(rec);
  }
  /* ---------- host: a device (re)connected and shares what it knows ---------- */
  function hostSync(me, from, d){
    (Array.isArray(d.r) ? d.r : []).slice(0, 3000).forEach(x => {
      const rec = cleanRec(x); if(!rec || !involves(rec, me)) return;
      const k = key(rec.a, rec.b), cur = R[k];
      if(cur && cur.ts >= rec.ts) return;
      if(rec.s === "f"){
        const ok = cur && cur.s === "p" && cur.by !== me;          // they accepted a request that was waiting
        if(!ok){                                                    // otherwise both people must say so
          const cl = claims[k] || (claims[k] = {}), o = rec.a === me ? rec.b : rec.a;
          cl[me] = rec;
          if(!cl[o]) return;
          rec.ts = Math.max(rec.ts, cl[o].ts); rec.since = Math.min(rec.since || rec.ts, cl[o].since || rec.ts) || rec.ts;
          delete claims[k];
        }
      }
      if(apply(rec, true)) push(rec);
    });
    const mine = []; for(const k in R){ if(involves(R[k], me)) mine.push(R[k]); }
    try{ from.send({ t: "FR", i: newId(), a: "rec", init: 1, r: mine }); }catch(e){}
    renderAll();
  }
  function sendSync(conn){ try{ conn.send({ t: "FR", i: newId(), a: "sync", r: mineList() }); }catch(e){} }

  /* ---------- what I do ---------- */
  function act(k, to, tn){
    tn = String(tn || "").slice(0, 12);
    if(isHost) hostAct(uid, usr, { k, to, tn });
    else if(conns.length) send({ t: "FR", i: newId(), a: "act", k, to, tn });
    else toast("You're not connected yet.");
  }

  /* ---------- hook into the message handler ---------- */
  const prev = handle;
  handle = function(d, from){
    if(d && typeof d === "object" && d.t === "FR" && validId(d.i)){
      if(isHost){
        if(!from || !from.ok2 || from.denied || !from.uid) return;
        if(d.a === "act") hostAct(from.uid, from.userName, d);
        else if(d.a === "sync") hostSync(from.uid, from, d);
      } else if(d.a === "rec" && Array.isArray(d.r)){
        let n = 0;
        d.r.slice(0, 3000).forEach(x => { const rec = cleanRec(x); if(rec && involves(rec, uid)) apply(rec, !!d.init); });
        if(d.init){ from.frOk = 1; n = mineList().filter(r => r.s === "p" && r.by !== uid).length; if(n) toast("👋 You have " + n + " friend request" + (n === 1 ? "" : "s")); }
        renderAll();
      }
      return;
    }
    const r = prev.apply(this, arguments);
    try{ if(!isHost && d && (d.t === "P" || d.t === "R") && from && !from.frOk && Date.now() - (from.frT || 0) > 2500){ from.frT = Date.now(); sendSync(from); } }catch(e){}
    return r;
  };

  /* ---------- sidebar ---------- */
  const sb = document.createElement("div"); sb.id = "sbfr";
  const dm = $f("sbdm"); if(dm && dm.parentNode) dm.parentNode.insertBefore(sb, dm);
  function mkAv(u, name, dot){
    const av = document.createElement("div"); av.className = "pav"; paintAv(av, name);
    if(dot){ const d = document.createElement("i"); d.className = "dot" + (isOn(u) ? " on" : ""); av.appendChild(d); }
    return av;
  }
  function rowBtn(txt, title, cls, fn){ const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.title = title; if(cls) b.className = cls; b.onclick = ev => { ev.stopPropagation(); fn(); }; return b; }
  function renderFr(){
    if(!sb.isConnected) return;
    const all = mineList(), inn = all.filter(r => r.s === "p" && r.by !== uid), out = all.filter(r => r.s === "p" && r.by === uid), fr = all.filter(r => r.s === "f");
    const h = document.createElement("div"); h.className = "sbh";
    const ht = document.createElement("span"); ht.textContent = "Friends — " + fr.length;
    if(inn.length){ const bd = document.createElement("span"); bd.className = "bd"; bd.textContent = inn.length; ht.appendChild(bd); }
    const nb = document.createElement("button"); nb.type = "button"; nb.textContent = "＋ Add"; nb.title = "Send a friend request"; nb.onclick = openAdd;
    h.append(ht, nb);
    const els = [h];
    const sub = t => { const s = document.createElement("div"); s.className = "sub"; s.textContent = t; return s; };
    if(inn.length){
      els.push(sub("Requests for you"));
      inn.sort((x, y) => y.ts - x.ts).forEach(r => { const u = otherOf(r), n = nameOf(u, r), row = document.createElement("div"); row.className = "fr";
        const mid = document.createElement("div"); mid.className = "mid"; const a = document.createElement("div"); a.textContent = n; const b = document.createElement("span"); b.textContent = "wants to be friends · " + fmtDate(r.ts); mid.append(a, b);
        row.append(mkAv(u, n, false), mid, rowBtn("✓", "Accept", "ok", () => act("acc", u, n)), rowBtn("✕", "Decline", "", () => act("rm", u, n))); els.push(row); });
    }
    if(out.length){
      els.push(sub("Waiting for a reply"));
      out.sort((x, y) => y.ts - x.ts).forEach(r => { const u = otherOf(r), n = nameOf(u, r), row = document.createElement("div"); row.className = "fr";
        const mid = document.createElement("div"); mid.className = "mid"; const a = document.createElement("div"); a.textContent = n; const b = document.createElement("span"); b.textContent = (isOn(u) ? "online" : "offline — they'll see it when they're back") + " · sent " + fmtDate(r.ts); mid.append(a, b);
        row.append(mkAv(u, n, true), mid, rowBtn("✕", "Cancel request", "", () => act("rm", u, n))); els.push(row); });
    }
    if(fr.length){
      els.push(sub("Your friends"));
      fr.sort((x, y) => (isOn(otherOf(y)) - isOn(otherOf(x))) || nameOf(otherOf(x), x).localeCompare(nameOf(otherOf(y), y))).forEach(r => { const u = otherOf(r), n = nameOf(u, r), row = document.createElement("div"); row.className = "fr";
        const mid = document.createElement("div"); mid.className = "mid"; const a = document.createElement("div"); a.textContent = n; const b = document.createElement("span"); b.textContent = (isOn(u) ? "online" : "offline") + " · friends since " + fmtDate(r.since || r.ts); mid.append(a, b);
        row.append(mkAv(u, n, true), mid); els.push(row); });
    }
    if(!inn.length && !out.length && !fr.length){ const t = document.createElement("div"); t.className = "hint"; t.textContent = "Add friends — online or offline — and see how long you've been chatting."; els.push(t); }
    sb.replaceChildren(...els);
  }

  /* ---------- "Add friends" window ---------- */
  function openAdd(){ $f("frmod").classList.add("on"); $f("frq").value = ""; fillAdd(); setTimeout(() => $f("frq").focus(), 30); const s = $f("sb"); if(s) s.classList.remove("open"); }
  function closeAdd(){ $f("frmod").classList.remove("on"); }
  function btns(box, u, n, big){
    const st = status(u), add = (t, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; if(cls) b.className = cls; b.onclick = ev => { ev.stopPropagation(); fn(); }; box.appendChild(b); };
    if(st === "none") add("➕ Add friend", "pri", () => act("req", u, n));
    else if(st === "out") add(big ? "Cancel request" : "Pending ✕", "", () => act("rm", u, n));
    else if(st === "in"){ add("✓ Accept", "pri", () => act("acc", u, n)); add("✕ Decline", "", () => act("rm", u, n)); }
    else add(big ? "Remove friend" : "Friends ✓", "", () => { if(!big || confirm("Remove " + n + " from your friends?")) act("rm", u, n); });
  }
  function fillAdd(){
    const list = $f("frlist"), t = $f("frq").value.trim().toLowerCase();
    const people = knownPeople([]).filter(p => !t || p.n.toLowerCase().includes(t));
    list.replaceChildren();
    if(!people.length){ const e = document.createElement("div"); e.className = "empty"; e.textContent = t ? "Nobody by that name." : "Nobody to add yet — people show up here once they've been in the chat."; list.appendChild(e); return; }
    people.forEach(p => {
      const row = document.createElement("div"); row.className = "row";
      const av = document.createElement("div"); av.className = "pav"; paintAv(av, p.n);
      const nm = document.createElement("div"); nm.className = "nm"; nm.textContent = p.n; const sm = document.createElement("small"); sm.className = "st" + (p.on ? " on" : ""); sm.textContent = p.on ? "online" : "offline"; nm.appendChild(sm);
      row.append(av, nm); btns(row, p.c, p.n, false); list.appendChild(row);
    });
  }
  $f("frq").addEventListener("input", fillAdd);
  $f("frclose").onclick = closeAdd;
  $f("frmod").addEventListener("mousedown", e => { if(e.target.id === "frmod") closeAdd(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && $f("frmod").classList.contains("on")) closeAdd(); });

  /* ---------- profile card: add friend / friends since / chatting since ---------- */
  let lastProf = null;
  window.__frProf = function(body, id, name, mine){
    lastProf = mine ? null : { id, name };
    if(mine || !okUid(id) || id === uid) return;
    const st = status(id), r = relWith(id), first = firstTs("d:" + id);
    const sec = document.createElement("div"); sec.className = "psec";
    const h = document.createElement("h4"); h.textContent = "Friendship"; sec.appendChild(h);
    const lines = [];
    lines.push(st === "friend" ? "🤝 Friends since " + fmtDate(r.since || r.ts) : st === "out" ? "⏳ Friend request sent" : st === "in" ? "👋 Wants to be your friend" : "Not friends yet");
    const p = document.createElement("p"); p.textContent = lines.join("\n"); sec.appendChild(p); body.appendChild(sec);
    const row = document.createElement("div"); row.className = "frprof"; btns(row, id, name, true);
    body.appendChild(row);
  };
  function repaintProfile(){ const pm = $f("profmod"); if(lastProf && pm && pm.classList.contains("on") && window.__pbProfile) window.__pbProfile(lastProf.id, lastProf.name); }

  /* ---------- keep everything fresh ---------- */
  function renderAll(){ try{ renderFr(); }catch(e){ console.warn("friends", e); } try{ repaintProfile(); }catch(e){} if($f("frmod").classList.contains("on")) fillAdd(); }
  const _ro = renderOnline;
  renderOnline = function(){ const r = _ro.apply(this, arguments); try{ renderFr(); }catch(e){} return r; };
  let lastSig = "";
  setInterval(() => {
    const s = uid + "#" + mineList().map(r => r.a + r.b + r.s + r.ts).join(",") + "#" + (lastRoster || []).map(e => e.c).join(",");
    if(s !== lastSig){ lastSig = s; renderAll(); }
  }, 2000);
  renderAll();
})();

;
/* ===== 25-dock-js.js ===== */
(function(){
  const b = document.getElementById("sb-dock"); if(!b) return;
  function apply(on){
    document.body.classList.toggle("sb-bottom", on);
    b.textContent = on ? "⬅ Move bar to left" : "⬇ Move bar to bottom";
    b.title = on ? "Move this bar back to the left side" : "Move this bar to the bottom of the screen";
    try { localStorage.setItem("pb_sbpos", on ? "b" : "l"); } catch(e){}
    if(typeof updateArrows === "function") updateArrows();
    document.body.classList.add("sb-switch"); clearTimeout(apply.t); apply.t = setTimeout(() => document.body.classList.remove("sb-switch"), 320);
  }
  b.onclick = e => { e.stopPropagation(); apply(!document.body.classList.contains("sb-bottom")); };
  let on = false; try { on = localStorage.getItem("pb_sbpos") === "b"; } catch(e){}
  apply(on);
})();
