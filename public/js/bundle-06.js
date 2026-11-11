/* ===== 19-cl-js.js ===== */
(function(){
  /* ===== CHANGELOG — pulled live from your GitHub commits =====
     Set GH_REPO to "owner/repo" (e.g. "irma/purebred"). Add GH_BRANCH if not the default branch.
     Private repo? Add a read-only token in GH_TOKEN (note: it will be visible in the page source). */
  const GH_REPO = "Justin-diaz-droid/Los-Purebreds-Chat", GH_BRANCH = "", GH_TOKEN = "", MAX = 40;

  const $c = id => document.getElementById(id);
  const ls = { get:k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} } };
  const repo = ls.get("cl_repo") || GH_REPO;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  let cache = null;

  async function loadAll(){
    if(cache) return cache;
    if(!/^[\w.-]+\/[\w.-]+$/.test(repo) || repo === "OWNER/REPO") throw new Error("setup");
    const u = "https://api.github.com/repos/" + repo + "/commits?per_page=" + MAX + (GH_BRANCH ? "&sha=" + encodeURIComponent(GH_BRANCH) : "");
    const h = { Accept:"application/vnd.github+json" }; if(GH_TOKEN) h.Authorization = "Bearer " + GH_TOKEN;
    const r = await fetch(u, { headers:h });
    if(!r.ok) throw new Error(r.status === 403 ? "rate" : r.status === 404 ? "404" : "http");
    cache = (await r.json()).filter(c => c && c.commit && !/^Merge /.test(c.commit.message));
    return cache;
  }
  /* ---- entries an admin removed (hidden for everyone; synced through the cloud mailbox) ---- */
  const HK = "pb_cl_hide"; let hid = {}, showHidden = false, lastSeen = null, lastLocalEdit = 0;
  try{ hid = JSON.parse(ls.get(HK) || "{}") || {}; }catch(e){}
  const hidId = sha => "c" + String(sha).slice(0, 12);
  const isHidden = sha => { const h = hid[hidId(sha)]; return !!(h && h.hide); };
  const isAdm = () => { try{ return !!(window.__pbAdm && window.__pbAdm()); }catch(e){ return false; } };
  const saveH = () => { ls.set(HK, JSON.stringify(hid)); try{ if(window.__tbChanged) window.__tbChanged(); }catch(e){} };
  async function load(){ return (await loadAll()).filter(c => !isHidden(c.sha)); }
  window.__cl = {
    canPush: () => isAdm() || Date.now() - lastLocalEdit < 120000,
    out: () => Object.keys(hid).map(id => ({ k: "cl", id, sha: hid[id].sha, hide: hid[id].hide ? 1 : 0, v: hid[id].v })),
    apply(list){
      let ch = false;
      list.forEach(r => {
        if(!r || r.k !== "cl" || typeof r.id !== "string" || !/^[0-9a-f]{7,40}$/.test(r.sha || "") || r.id !== hidId(r.sha)) return;
        const v = +r.v || 0; if(v <= 0) return;
        if(hid[r.id] && hid[r.id].v >= v) return;
        hid[r.id] = { sha: r.sha, hide: r.hide ? 1 : 0, v }; ch = true;
      });
      if(ch){ ls.set(HK, JSON.stringify(hid)); if($c("clog").classList.contains("on")) draw(); }
      return ch;
    }
  };
  async function draw(){
    try{ const all = await loadAll(); render((showHidden && isAdm()) ? all : all.filter(c => !isHidden(c.sha)), lastSeen); }catch(e){}
    $c("cl-eye").hidden = !isAdm(); $c("cl-eye").style.opacity = showHidden ? "1" : ".6";
  }
  function render(list, seenSha){
    let out = "", day = "", hitSeen = !seenSha;
    for(const c of list){
      const m = c.commit.message.split("\n"), title = m[0], body = m.slice(1).join("\n").trim().replace(/^Co-Authored-By:.*$/gmi,"").replace(/^Claude-Session:.*$/gmi,"").trim();
      const d = new Date(c.commit.author.date), dk = d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
      if(dk !== day){ day = dk; out += '<div class="cl-day">' + esc(dk) + '</div>'; }
      const isNew = seenSha && !hitSeen && c.sha !== seenSha;
      if(c.sha === seenSha) hitSeen = true;
      const gone = isHidden(c.sha), adm = isAdm();
      out += '<div class="cl-item' + (isNew ? " new" : "") + (gone ? " hid" : "") + '">' + (adm ? '<button type="button" class="cl-del" data-sha="' + esc(c.sha) + '" title="' + (gone ? "Bring this entry back" : "Remove this entry for everyone") + '">' + (gone ? "↩" : "🗑") + '</button>' : "") + '<div class="cl-t">' + esc(title) + '</div>' + (body ? '<div class="cl-b">' + esc(body) + '</div>' : "") +
        '<div class="cl-m">' + d.toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}) + ' · <a href="' + esc(c.html_url) + '" target="_blank" rel="noopener">' + c.sha.slice(0,7) + '</a></div></div>';
    }
    $c("cl-list").innerHTML = out || '<div class="cl-msg">No commits yet.</div>';
  }
  async function open(auto){
    const seen = ls.get("cl_seen");
    $c("cl-ver").textContent = (($c("gver")||{}).textContent || "").trim();
    $c("cl-list").innerHTML = '<div class="cl-msg">Loading…</div>';
    $c("clog").classList.add("on");
    try{
      lastSeen = seen; const list = await load(); await draw();
      if(list[0]) ls.set("cl_seen", list[0].sha);
    }catch(e){
      const m = { setup:"Changelog isn't connected yet.<br>Set <b>GH_REPO</b> to your <b>owner/repo</b> in the changelog script.", rate:"GitHub rate limit hit — try again in a bit.", "404":"Repo not found. If it's private, add a GH_TOKEN.", http:"Couldn't load the changelog." }[e.message] || "Couldn't load the changelog (offline?).";
      $c("cl-list").innerHTML = '<div class="cl-msg">' + m + '</div>';
    }
  }
  window.__pbClLoad = load;                      // the welcome screen's Changelog row uses the same GitHub loader
  const close = () => $c("clog").classList.remove("on");
  $c("cl-open").addEventListener("click", () => open(false));
  $c("cl-x").onclick = close;
  $c("cl-eye").onclick = () => { showHidden = !showHidden; draw(); };
  $c("cl-list").addEventListener("click", e => {
    const b = e.target.closest && e.target.closest(".cl-del"); if(!b || !isAdm()) return;
    const sha = b.dataset.sha; if(!/^[0-9a-f]{7,40}$/.test(sha || "")) return;
    const id = hidId(sha), old = hid[id], gone = isHidden(sha);
    hid[id] = { sha, hide: gone ? 0 : 1, v: Math.max(Date.now(), ((old && old.v) || 0) + 1) };
    lastLocalEdit = Date.now(); saveH(); draw();
  });
  $c("clog").addEventListener("click", e => { if(e.target.id === "clog") close(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") close(); });

  /* after an update: if there are commits you haven't seen, pop the changelog once */
  window.addEventListener("load", () => setTimeout(async () => {
    try{
      if(!ls.get("cl_seen")){ const l = await load(); if(l[0]) ls.set("cl_seen", l[0].sha); return; }   // first visit: don't nag
      const l = await load(); if(l[0] && l[0].sha !== ls.get("cl_seen")) open(true);
    }catch(e){}
  }, 2500));
})();

;
/* ===== 20-gate-scale.js ===== */
/* login screen scales with the window */
(function(){
  const g=document.getElementById("gate"); if(!g) return;
  function fit(){
    const w=innerWidth, h=innerHeight;
    let s = w<=640 ? Math.min(w/380, h/820) : Math.min(w/700, h/540);
    s = Math.max(.55, Math.min(1.8, s));
    g.style.setProperty("--gs", s.toFixed(3));
  }
  fit(); addEventListener("resize", fit); addEventListener("orientationchange", fit);
})();
