/* ===== 21-prof-js.js ===== */
(function(){
  /* ===== profiles: click a name or avatar. Everyone can look, only the owner can edit. ===== */
  const KEY="pb_prof", $p=id=>document.getElementById(id);
  const hex=c=>/^#[0-9a-f]{6}$/i.test(c||"")?c:"";
  const txt=(t,n)=>String(t==null?"":t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").slice(0,n);
  const clean=p=>({ bio:txt(p&&p.bio,190), pr:txt(p&&p.pr,20).replace(/\n/g," "), st:txt(p&&p.st,40).replace(/\n/g," "), bn:hex(p&&p.bn), bi:(p&&typeof p.bi==="string"&&p.bi.length<4600000&&/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(p.bi))?p.bi:"", v:Math.max(0,+(p&&p.v)||0) });
  let profs={};
  try{ const c=JSON.parse(localStorage.getItem(KEY)||"{}"); Object.keys(c).forEach(k=>{ if(okUid(k)) profs[k]=clean(c[k]); }); }catch(e){}
  const keep=()=>{ try{ const o={}; Object.keys(profs).forEach(k=>{ o[k]=Object.assign({},profs[k]); if(o[k].bi&&o[k].bi.length>250000) o[k].bi=""; }); localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} };
  function take(c,p){ if(!okUid(c)||!p||typeof p!=="object") return false; p=clean(p); if(profs[c]&&profs[c].v>=p.v) return false; profs[c]=p; keep(); return true; }

  /* ---- sync (host is the referee: you can only change your own) ---- */
  const prev=handle;
  handle=function(d,from){
    if(d&&typeof d==="object"&&(d.t==="PF"||d.t==="PFS")&&validId(d.i)){
      if(isHost&&(!from||!from.ok2||from.denied||!from.uid)) return;
      if(d.t==="PF"){
        if(isHost){ d.c=from.uid; if(take(d.c,d.p)){ const fp=profs[d.c], big=fp.bi&&fp.bi.length>INLINE_MAX; send({t:"PF",i:newId(),c:d.c,p:big?Object.assign({},fp,{bi:""}):fp},from);
            if(big) conns.forEach(c2=>{ if(c2!==from&&c2.open&&c2.ok2) queueBig(c2,{t:"PFB",i:newId(),c:d.c,v:fp.v,bi:fp.bi}); }); } }
        else take(d.c,d.p);
      } else if(!isHost&&d.all&&typeof d.all==="object"){
        Object.keys(d.all).slice(0,200).forEach(k=>take(k,d.all[k]));
      }
      if($p("profmod").classList.contains("on")&&shown&&shown!==uid) paint();
      return;
    }
    if(!isHost&&d&&typeof d==="object"&&validId(d.i)){
      if(d.t==="PFB"&&okUid(d.c)){ const q=profs[d.c], b=clean({bi:d.bi}).bi; if(q&&b&&q.v===(+d.v||0)){ q.bi=b; keep(); if($p("profmod").classList.contains("on")&&shown&&shown!==uid) paint(); } return; }
      if(d.t==="AVB"&&typeof d.n==="string"&&d.n.length&&d.n.length<=12&&okAv(d.a)){ avatars[d.n]=d.a; cacheAvatars(); refreshAvatars(); return; }
    }
    const r=prev.apply(this,arguments);
    try{
      if(isHost&&from&&from.ok2&&from.uid&&!from.pfSent){
        from.pfSent=1;                                              // sent in several messages so big GIF banners can't push one over the size limit
        let batch={},sz=0,n=0; const out=()=>{ from.send({t:"PFS",i:newId(),all:batch}); batch={}; sz=0; n=0; };
        const later=[];
        Object.keys(profs).forEach(k=>{ let pk=profs[k]; if(pk.bi&&pk.bi.length>INLINE_MAX){ later.push({t:"PFB",i:newId(),c:k,v:pk.v,bi:pk.bi}); pk=Object.assign({},pk,{bi:""}); }
          const w=JSON.stringify(pk).length+80; if(n&&sz+w>600000) out(); batch[k]=pk; sz+=w; n++; });
        out(); later.forEach(m=>queueBig(from,m));
      }
      else if(!isHost&&d&&(d.t==="P"||d.t==="R")&&profs[uid]&&!window.__pfOut){ window.__pfOut=1; send({t:"PF",i:newId(),c:uid,p:profs[uid]}); setTimeout(()=>{ window.__pfOut=0; },3000); }
    }catch(e){}
    return r;
  };

  /* ---- who is this? ---- */
  function uidOf(name){
    const r=(lastRoster||[]).find(e=>e.n===name&&e.c); if(r) return r.c;
    const l=[...logs].reverse().find(x=>x.u===name&&x.c); return l?l.c:"";
  }
  let shown="", editing=false, dbi=null;   // dbi: banner image being edited (null = unchanged)
  const card=document.querySelector("#profmod .pcard");
  let draftT=null;
  function keepDraft(){ const g=id=>$p(id)?$p(id).value:null; draftT={ bio:g("pf-bio"), pr:g("pf-pr"), st:g("pf-st"), bn:g("pf-bn"), t:$p("pf-bn")&&$p("pf-bn").dataset.t }; }
  function paint(){
    const id=shown, mine=id===uid, p=profs[id]||clean({});
    const name=mine?usr:(card.dataset.nm||"?");
    const bn=p.bn||colorFor(name), av=avatars[name];
    card.textContent="";
    const E=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
    const ban=E("div","pban"); const curBi=editing&&dbi!==null?dbi:p.bi;
    ban.style.background=editing?($p("pf-bn")?$p("pf-bn").value:bn):bn;
    if(curBi){ ban.style.backgroundImage='url("'+curBi+'")'; ban.style.backgroundSize="cover"; ban.style.backgroundPosition="center"; }
    const x=E("button","pxx","✕"); x.type="button"; x.onclick=close; ban.appendChild(x);
    const pav=E("div","pav"); if(av){ pav.style.backgroundImage='url("'+av+'")'; } else { pav.style.background=colorFor(name); pav.textContent=(name[0]||"?").toUpperCase(); }
    ban.appendChild(pav);
    const body=E("div","pbody");
    const nm=E("div","pnm",name);
    try{ if(window.__pbIsAdmin&&window.__pbIsAdmin(name)) nm.appendChild(E("span","pbadge","OWNER")); }catch(e){}
    try{ const ct=window.__pbTagOf&&window.__pbTagOf(name); if(ct){ const sp=E("span","ctag",ct.t); sp.style.setProperty("--tc",ct.c); nm.appendChild(sp); } }catch(e){}
    body.appendChild(nm);
    if(!editing){
      if(p.pr) body.appendChild(E("div","ppr",p.pr));
      if(p.st) body.appendChild(E("div","pst","💬 "+p.st));
      const s=E("div","psec"); s.appendChild(E("h4",null,"About me"));
      s.appendChild(p.bio?E("p",null,p.bio):E("p","pempty",mine?"You haven't written anything yet.":"Nothing here yet."));
      body.appendChild(s);
      if(mine){ const row=E("div","prow2"); const b=E("button",null,"✏️ Edit profile"); b.type="button"; b.onclick=()=>{ editing=true; dbi=null; draftT=null; paint(); }; row.appendChild(b); body.appendChild(row); }
      try{ if(!mine&&window.__pbTagOf&&window.__pbTagOf(name)&&window.__pbIsMod&&window.__pbIsMod(null)){ const row=E("div","prow2"); const b=E("button","alt","🚫 Remove their custom tag"); b.type="button"; b.onclick=()=>{ window.__pbTagRemove(name); b.disabled=true; b.textContent="Tag removed"; }; row.appendChild(b); body.appendChild(row); } }catch(e){}
    } else {
      const f=(lbl,el,cnt)=>{ const l=E("label",null,lbl); if(cnt){ const c=E("span","pcount",""); l.appendChild(c); el.addEventListener("input",()=>{ c.textContent=el.value.length+"/"+cnt; }); c.textContent=el.value.length+"/"+cnt; } body.append(l,el); };
      const pr=E("input"); pr.type="text"; pr.id="pf-pr"; pr.maxLength=20; pr.value=p.pr; pr.placeholder="e.g. he/him";
      const st=E("input"); st.type="text"; st.id="pf-st"; st.maxLength=40; st.value=p.st; st.placeholder="What are you up to?";
      const bio=E("textarea"); bio.id="pf-bio"; bio.maxLength=190; bio.value=p.bio; bio.placeholder="Tell people about yourself";
      const bc=E("input"); bc.type="color"; bc.id="pf-bn"; bc.value=p.bn||"#5865f2"; bc.addEventListener("input",()=>{ bc.dataset.t=1; ban.style.background=bc.value; });
      if(draftT){ if(draftT.bio!=null) bio.value=draftT.bio; if(draftT.pr!=null) pr.value=draftT.pr; if(draftT.st!=null) st.value=draftT.st; if(draftT.bn) bc.value=draftT.bn; if(draftT.t) bc.dataset.t=1; draftT=null; }
      f("Pronouns",pr,20); f("Status",st,40); f("About me",bio,190); body.append(E("label",null,"Banner color"),bc);
      const ir=E("div","prow2"), ib=E("button","alt","🖼️ Banner image"), ix=E("button","alt","Remove image"), fi=E("input"); ib.type=ix.type="button"; fi.type="file"; fi.accept="image/*"; fi.style.display="none";
      ib.onclick=()=>fi.click(); ix.onclick=()=>{ dbi=""; keepDraft(); paint(); };
      fi.onchange=()=>{ const f=fi.files[0]; if(!f) return;
        if(f.type==="image/gif"||/\.gif$/i.test(f.name)){            // GIFs stay GIFs so they keep moving (as long as they are small enough to send to everyone)
          const gr=new FileReader(); gr.onload=ge=>{ if(String(ge.target.result).length<4600000){ dbi=ge.target.result; keepDraft(); paint(); } else { sys("That GIF is too big to animate as a banner (max ~3.4 MB) — using a still picture instead."); still(f); } }; gr.readAsDataURL(f); return;
        }
        still(f); };
      function still(f){ const r=new FileReader(); r.onload=ev=>{ const im=new Image(); im.onload=()=>{
        const W=640,H=220,cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d"), k=Math.max(W/im.width,H/im.height), w=im.width*k, h=im.height*k;
        g.drawImage(im,(W-w)/2,(H-h)/2,w,h);
        let q=.8,u=cv.toDataURL("image/jpeg",q); while(u.length>110000&&q>.3){ q-=.1; u=cv.toDataURL("image/jpeg",q); }
        dbi=u; keepDraft(); paint(); }; im.src=ev.target.result; }; r.readAsDataURL(f); }
      ir.append(ib,ix,fi); body.appendChild(ir);
      const row=E("div","prow2"); const sv=E("button",null,"Save"), cn=E("button","alt","Cancel"); sv.type=cn.type="button";
      sv.onclick=()=>{
        const np=clean({ bio:bio.value, pr:pr.value, st:st.value, bn:bc.dataset.t?bc.value:p.bn, bi:dbi!==null?dbi:p.bi, v:Date.now() });
        profs[uid]=np; keep(); send({t:"PF",i:newId(),c:uid,p:np}); editing=false; dbi=null; paint();
      };
      cn.onclick=()=>{ editing=false; dbi=null; paint(); };
      row.append(sv,cn); body.appendChild(row);
    }
    card.append(ban,body);
    try{ if(window.__frProf) window.__frProf(body,id,name,mine); }catch(e){}
  }
  function open(id,name){ if(!id) return; shown=id; editing=false; card.dataset.nm=name||""; $p("profmod").classList.add("on"); paint(); }
  function close(){ $p("profmod").classList.remove("on"); editing=false; }
  $p("profmod").addEventListener("click",e=>{ if(e.target.id==="profmod") close(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$p("profmod").classList.contains("on")) close(); });
  window.__pbProfile=open;
  const ya=$p("youare"); if(ya){ ya.style.cursor="pointer"; ya.title="View / edit your profile"; ya.addEventListener("click",()=>open(uid,usr)); }

  /* click a name or avatar in chat / the online strip */
  document.addEventListener("click",e=>{
    const t=e.target;
    const m=t.closest&&t.closest("#box .msg .av, #box .msg .lbl[data-nm]");
    if(m){ const w=m.closest(".msg"); const id=w&&w.dataset.uid, nm=w&&w.dataset.user; if(id){ e.stopPropagation(); open(id,nm); return; } }
    const o=t.closest&&t.closest("#online .oav");
    if(o){ const nm=(o.title||"").split(" · ")[0]; const id=nm===usr?uid:uidOf(nm); if(id){ e.stopPropagation(); open(id,nm); } }
  },true);
})();

;
/* ===== 22-gif-js.js ===== */
(function(){
  /* Built-in Trevor GIFs (u = Tenor link, t = title, k = search words). Each one tries a few Tenor hosts before giving up. */
  const GIFS = [{"u": "https://media1.tenor.com/m/ZLWw_d_EghsAAAAd/focking-treva-after.gif", "t": "Focking Treva", "k": "after we collided focking treva trevor"}, {"u": "https://media1.tenor.com/m/AWtzN2nvWGkAAAAd/neville-trevor.gif", "t": "Neville & Trevor the toad", "k": "neville trevor toad harry potter"}, {"u": "https://media1.tenor.com/m/b5i21E5LnGkAAAAd/trevor-philips-gta5.gif", "t": "Trevor Philips", "k": "trevor philips gta gta5 gta v"}, {"u": "https://media1.tenor.com/m/ewG9oYJyg4EAAAAd/trevor-lore-1991.gif", "t": "New Trevor lore", "k": "trevor lore 1991"}, {"u": "https://media1.tenor.com/m/dVSOanB1zOwAAAAd/bye-trevor-trevor.gif", "t": "Bye Trevor", "k": "bye trevor goodbye dog"}];
  const $g = id => document.getElementById(id);
  const btn = $g("gif-btn"), panel = $g("gif-panel");
  if(!btn || !panel) return;
  const KEYN = "pb_klipykey";
  const CIDN = "pb_klipycid";
  const getCid = () => { try{ let c = localStorage.getItem(CIDN); if(!c){ c = "pb" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem(CIDN, c); } return c; }catch(e){ return "pb-anon"; } };
  const DEFAULT_KEY = "iF36ghmj5UEzZbWNW4a2n3pqETRwkHzwR11l6zcp9RYEDdbxd7S23ml2eWkGmmBQ";   // built-in KLIPY key so everyone gets GIF search without pasting one
  const getKey = () => { try{ return localStorage.getItem(KEYN) || DEFAULT_KEY; }catch(e){ return DEFAULT_KEY; } };

  /* the same Tenor GIF lives on a few hosts; if one is blocked / 404s we try the others */
  function variants(u){
    const m = /^https:\/\/(?:media\d*|c)\.tenor\.com\/(?:m\/)?([A-Za-z0-9_\-]+)\/([A-Za-z0-9_\-]+\.gif)$/.exec(u);
    if(!m) return [u];
    return [...new Set([u, "https://media.tenor.com/" + m[1] + "/" + m[2], "https://media1.tenor.com/m/" + m[1] + "/" + m[2], "https://c.tenor.com/" + m[1] + "/" + m[2]])];
  }

  panel.innerHTML = '<input type="text" id="gif-q" placeholder="Search GIFs" autocomplete="off"><div id="gif-grid"></div>' +
    '<div id="gif-foot"><button type="button" id="gif-link" title="Paste a direct GIF link">🔗 Paste link</button><button type="button" id="gif-up" title="Send a GIF from your device">📁 Upload GIF</button><button type="button" id="gif-key" title="Search all of KLIPY with a free API key">🔑 KLIPY search</button><span id="gif-n" style="margin-left:auto;font-size:11px;color:var(--muted)"></span><input type="file" id="gif-file" accept="image/gif" hidden></div>';
  const q = $g("gif-q"), grid = $g("gif-grid"), cnt = $g("gif-n");
  const isOpen = () => panel.style.display === "flex";
  function show(on){
    if(typeof setShown === "function") setShown(panel, on, "flex"); else panel.style.display = on ? "flex" : "none";
    btn.classList.toggle("on", on);
  }
  function note(t){ const n = document.createElement("div"); n.className = "gnote"; n.textContent = t; return n; }

  function send(url){
    const inp = $g("inp"); if(inp && inp.disabled) return;      // not connected yet
    if(!GIF_RE.test(url)){ sys("That isn't a GIF link I can send (it must be a direct .gif link from KLIPY, Tenor, Giphy or Imgur)."); return; }
    show(false);
    postMsg(url, 1, 0, { gif: 1 });
  }
  function thumb(g, onBad){
    const im = document.createElement("img"); im.className = "gi"; im.alt = g.t || "GIF"; im.title = g.t || ""; im.decoding = "async"; im.draggable = false; im.referrerPolicy = "no-referrer";
    const vs = variants(g.p || g.u); let i = 0;
    im.onerror = () => { if(++i < vs.length){ im.src = vs[i]; return; } im.onerror = null; im.removeAttribute("src"); im.classList.add("bad"); im.dataset.bad = "1"; if(onBad) onBad(); };
    im.onclick = () => { if(im.dataset.bad) return; const u = (g.p ? g.u : (im.currentSrc || g.u)); send(u); };
    im.src = vs[0];
    return im;
  }
  async function klipy(t){
    const k = getKey();
    const url = "https://api.klipy.com/api/v1/" + encodeURIComponent(k) + "/gifs/" + (t ? "search" : "trending") + "?per_page=24&customer_id=" + encodeURIComponent(getCid()) + (t ? "&q=" + encodeURIComponent(t) : "");
    const r = await fetch(url); if(!r.ok) throw new Error("http " + r.status);
    const j = await r.json();
    if(j && j.result === false) throw new Error("klipy error");
    const rows = (j && j.data && j.data.data) || [];
    const gifUrl = (f, sz) => f && f[sz] && f[sz].gif && f[sz].gif.url;
    return rows.map(x => { const f = x.file; if(!f) return null; const full = gifUrl(f, "md") || gifUrl(f, "sm") || gifUrl(f, "hd") || gifUrl(f, "xs"), pv = gifUrl(f, "sm") || gifUrl(f, "xs") || full; return full && GIF_RE.test(full) ? { u: full, p: pv, t: x.title || "" } : null; }).filter(Boolean);
  }
  let seq = 0;
  async function fill(){
    const t = q.value.trim(), my = ++seq;
    let list = null, msg = "";
    if(getKey()){ try{ list = await klipy(t); }catch(e){ msg = "KLIPY search didn't work (check your key). Showing the built-in GIFs."; } }
    if(my !== seq) return;
    if(!list){ const tl = t.toLowerCase(); list = GIFS.filter(g => !tl || (g.t + " " + g.k).toLowerCase().includes(tl)); }
    grid.replaceChildren();
    if(msg) grid.appendChild(note(msg));
    if(!list.length) grid.appendChild(note("No GIFs match that." + (getKey() ? "" : " Tip: 🔑 KLIPY search lets you search every GIF.")));
    let fails = 0;
    list.forEach(g => grid.appendChild(thumb(g, () => { if(++fails === list.length) grid.prepend(note("GIFs can't load right now — KLIPY may be blocked on this network or by an ad-blocker. You can still use 📁 Upload GIF or 🔗 Paste link.")); })));
    cnt.textContent = list.length + " GIF" + (list.length === 1 ? "" : "s");
  }
  function toggle(){
    const inp = $g("inp");
    if(inp && inp.disabled) return;
    if(isOpen()){ show(false); return; }
    const emo = $g("emo-panel");
    if(emo && emo.style.display === "flex" && typeof setShown === "function") setShown(emo, false, "flex");
    q.value = ""; fill(); show(true); q.focus();
  }
  btn.addEventListener("click", toggle);
  btn.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(); } });
  let tm = 0;
  q.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(fill, getKey() ? 350 : 0); });
  document.addEventListener("click", e => { if(isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) show(false); });
  document.addEventListener("keydown", e => { if(e.key === "Escape" && isOpen()) show(false); });
  const emoBtn = $g("emo-btn");
  if(emoBtn) emoBtn.addEventListener("click", () => { if(isOpen()) show(false); }, true);

  /* paste a direct GIF link */
  $g("gif-link").onclick = () => {
    const v = (prompt("Paste a GIF link (KLIPY, Tenor, Giphy or Imgur).\nTip: right-click a GIF → Copy image address.") || "").trim();
    if(!v) return;
    let u = v.split("#")[0].split("?")[0].replace(/^http:\/\//i, "https://");
    if(!GIF_RE.test(u)){ sys("That doesn't look like a direct GIF link. It should end in .gif and come from KLIPY, Tenor, Giphy or Imgur — try right-click → Copy image address."); return; }
    send(u);
  };
  /* send a GIF from your device (kept as a GIF, so it still moves) */
  $g("gif-up").onclick = () => $g("gif-file").click();
  $g("gif-file").onchange = e => {
    const f = e.target.files && e.target.files[0]; e.target.value = ""; if(!f) return;
    if(!(f.type === "image/gif" || /\.gif$/i.test(f.name))){ sys("That file isn't a GIF."); return; }
    if(f.size > 900 * 1024){ sys("That GIF is " + Math.round(f.size / 1024) + " KB — the max is about 900 KB so it can send and keep animating."); return; }
    const inp = $g("inp"); if(inp && inp.disabled) return;
    const r = new FileReader();
    r.onload = () => { const u = String(r.result || ""); if(/^data:image\/gif;base64,/.test(u)){ show(false); postMsg(u, 1); } else sys("Couldn't read that GIF."); };
    r.onerror = () => sys("Couldn't read that GIF.");
    r.readAsDataURL(f);
  };
  /* optional: a free KLIPY API key turns on search across all of KLIPY */
  $g("gif-key").onclick = () => {
    const v = prompt("Optional: paste a free KLIPY API key to search ALL of KLIPY (get one at klipy.com/developers).\nLeave it empty to use the built-in key.", getKey());
    if(v === null) return;
    try{ if(v.trim()) localStorage.setItem(KEYN, v.trim()); else localStorage.removeItem(KEYN); }catch(e){}
    q.value = ""; fill();
  };

  /* GIFs already in the chat: if the link's host fails, try the other Tenor hosts before showing a broken picture */
  document.addEventListener("error", e => {
    const im = e.target; if(!im || im.tagName !== "IMG" || !im.classList.contains("img")) return;
    const src = im.getAttribute("src") || ""; if(!/^https:\/\/(?:media\d*|c)\.tenor\.com\//.test(src)) return;
    const tried = (im.dataset.vt || "").split("|").filter(Boolean); tried.push(src); im.dataset.vt = tried.join("|");
    const nx = variants(src).find(v => !tried.includes(v));
    if(nx) im.src = nx; else im.alt = "GIF couldn't load";
  }, true);
})();

;
/* ===== 23-jump-js.js ===== */
(function(){
  /* "jump to latest" arrow: shows up when you've scrolled away from the newest messages */
  const box = document.getElementById("box"); if(!box) return;
  const btn = document.createElement("button"); btn.id = "jump-btn"; btn.type = "button";
  btn.title = "Jump to latest message"; btn.setAttribute("aria-label", "Jump to latest message");
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg><span class="jb"></span>';
  document.body.appendChild(btn);
  const jb = btn.querySelector(".jb");
  let unread = 0, hold = 0;
  const dist = () => box.scrollHeight - box.scrollTop - box.clientHeight;
  function place(){
    const r = box.getBoundingClientRect();
    if(!r.width || !r.height) return false;
    btn.style.left = (r.left + r.width / 2) + "px";
    btn.style.top = (r.bottom - 42 - 14) + "px";
    return true;
  }
  function update(){
    const d = dist();
    if(d < 60) unread = 0;
    jb.textContent = unread > 99 ? "99+" : String(unread); jb.style.display = unread ? "block" : "none";
    const visible = place();
    const on = visible && Date.now() > hold && d >= 60 && (unread > 0 || d > (btn.classList.contains("on") ? 120 : 240));
    btn.classList.toggle("on", on);
  }
  box.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  if(window.ResizeObserver) new ResizeObserver(update).observe(box);
  tick(update, 700);
  btn.addEventListener("click", () => {
    unread = 0; hold = Date.now() + 700; btn.classList.remove("on");
    if(window.__pbEnd) window.__pbEnd();
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  });
  window.__jump = { add(n){ unread += n || 1; update(); }, reset(){ unread = 0; hold = 0; update(); } };
  update();
})();
