/* ===== 10-polish-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);

  /* ---- live preview: render at a real desktop / phone width and scale it to the pane ----
     (before, the "Desktop" preview in a narrow pane switched to the mobile layout, so Desktop / Phone looked swapped) */
  const wrap = $$("pvwrap"), fr = $$("pvframe");
  const st = (k, v) => fr.style.setProperty(k, v, "important");
  function fit(){
    const W = wrap.clientWidth, H = wrap.clientHeight; if(!W || !H) return;
    const phone = wrap.classList.contains("phone"), dw = phone ? 390 : 1100;
    const s = Math.min(1, W / dw), left = Math.max(0, (W - dw * s) / 2);
    st("position", "absolute"); st("left", "0"); st("top", "0"); st("max-width", "none"); st("transition", "none");
    st("width", dw + "px"); st("height", (H / s) + "px");
    st("transform", "translateX(" + left + "px) scale(" + s + ")"); st("transform-origin", "0 0");
  }
  new ResizeObserver(fit).observe(wrap);
  ["pvdesk", "pvphone"].forEach(id => $$(id).addEventListener("click", () => setTimeout(fit, 0)));
  fit();
})();

;
/* ===== 11-draw-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const W = 1600, H = 900;
  const MAXM = 12, MAXJ = 8;                      // most people on one private board · most private boards you can be in
  const myBid = "p" + uid;                        // everybody owns exactly one private board: "p" + their id
  const okBid = b => typeof b === "string" && /^p[A-Za-z0-9_-]{1,40}$/.test(b) && b !== "p__proto__";
  const ownerOf = b => b.slice(1);
  /* shared sub-tabs: everybody can see + draw, only the person who made one can clear or delete it. id = "c" + owner id + "." + a short code */
  const okSub = b => typeof b === "string" && /^c[A-Za-z0-9_-]{1,40}\.[a-z0-9]{3,10}$/.test(b) && b.slice(1, b.indexOf(".")) !== "__proto__";
  const subOwner = b => b.slice(1, b.indexOf("."));
  const isOwnerNow = () => { try{ return !!(window.__pbAdm && window.__pbAdm()); }catch(e){ return false; } };   // the site owner (admin): may delete anybody's sub-tab
  const cleanName = n => String(n || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18);
  const MAXSUB_EACH = 5, MAXSUB = 40;
  const jget = (k, fb) => { try { const v = JSON.parse(load(k, "")); return v && typeof v === "object" ? v : fb; } catch(e){ return fb; } };

  /* ---------- UI: sidebar row, header tab, board ---------- */
  const row = document.createElement("div"); row.className = "row-ch"; row.id = "ch-draw";
  row.innerHTML = '<div class="av-sb" style="font-size:18px">🎨</div><div><b style="font-size:15px">Drawing Board</b><br><span class="csub">Draw together</span></div>';
  $$("ch-gal").after(row); row.onclick = () => setChannel("draw");
  const tab = document.createElement("button"); tab.type = "button"; tab.dataset.ch = "draw"; tab.textContent = "🎨 Draw"; tab.onclick = () => setChannel("draw");
  $$("chtabs").appendChild(tab);

  const COLORS = ["#111111","#ffffff","#ef4444","#f97316","#facc15","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899","#92400e","#9ca3af"];
  const SHAPES = { line: "╱ Line", arrow: "➜ Arrow", rect: "▭ Rectangle", ellipse: "◯ Ellipse", tri: "△ Triangle", star: "★ Star" };
  const FILLABLE = new Set(["rect", "ellipse", "tri", "star"]);
  const PRESETS = [2, 6, 14, 28];
  const board = document.createElement("div"); board.id = "draw";
  board.innerHTML = `
    <div id="dtools">
      <select id="dboard" class="dsel" title="Which drawing board"></select>
      <span id="dtag" class="dtag"></span>
      <button class="dbtn" id="dinv" type="button" title="Invite people into your private board">👥 Invite</button>
      <button class="dbtn red" id="dsubdel" type="button" title="Delete this sub-tab for everyone (only its maker or an owner can)" style="display:none">🗑 Delete tab</button>
      <button class="dbtn red" id="dsuball" type="button" title="Owner only: delete every shared sub-tab, everyone's" style="display:none">🗑 Delete ALL tabs</button>
      <span class="dsep"></span>
      <div class="dmw"><button class="dbtn" id="dtoolbtn" type="button" title="Drawing tools" aria-haspopup="true" aria-expanded="false">✏️ Pen ▾</button>
        <div class="dmenu" id="dmtools"><div class="dmh">Tools</div><div class="dgrid">
          <button class="dbtn on" id="dpen" type="button" title="Pen">✏️ Pen</button>
          <button class="dbtn" id="dfill" type="button" title="Paint bucket: click a closed area to fill it">🪣 Fill</button>
          <button class="dbtn" id="dshape" type="button" title="Shapes: drag on the board (hold Shift for straight lines / even shapes)">🔷 Shapes</button>
          <button class="dbtn" id="dtext" type="button" title="Text box: click the board and type. Enter = new line, click outside the box (or Ctrl+Enter) to place it, Esc cancels. Click existing text to edit it.">🔤 Text</button>
          <button class="dbtn" id="dpick" type="button" title="Color dropper: click any spot on the board to copy its color">💧 Dropper</button>
          <button class="dbtn" id="der" type="button" title="Eraser">🧽 Eraser</button>
          <button class="dbtn" id="dlasso" type="button" title="Lasso: draw around drawings or pictures to select them (or click one), then drag to move, use the square handles to resize and the round handle to rotate. Hold Shift to stretch / snap the angle. Ctrl+C / Ctrl+X copy or cut the selection and Ctrl+V pastes it, even onto another board.">🪢 Lasso</button>
          <button class="dbtn" id="dimg" type="button" title="Add a picture to the board (you can also drop or paste one here)">🖼 Image</button>
        </div>
          <span id="dshgrp"><select id="dshsel" class="dsel" title="Shape">${Object.keys(SHAPES).map(k => `<option value="${k}">${SHAPES[k]}</option>`).join("")}</select><label class="dchk" title="Fill the shape in"><input type="checkbox" id="dshfill"> Filled</label></span>
          <span id="dtxgrp"><select id="dtxsz" class="dsel" title="Text size"><option value="28">Small</option><option value="48" selected>Medium</option><option value="80">Large</option><option value="130">Huge</option></select><label class="dchk" title="Bold text"><input type="checkbox" id="dtxbd"> Bold</label></span>
        </div></div>
      <div class="dmw"><button class="dbtn" id="dcolbtn" type="button" title="Color and thickness" aria-haspopup="true" aria-expanded="false"><span id="dprev" title="Brush preview"><i></i></span><span>Color ▾</span></button>
        <div class="dmenu" id="dmcol"><div class="dmh">Color</div><div class="dcrow"><div id="dpal"></div><input type="color" id="dcolor" value="#111111" title="Custom color"></div><div class="dmh">Thickness</div><span id="dsz"><span id="dpre">${PRESETS.map(n => `<button type="button" class="dth" data-n="${n}" title="Thickness ${n}"><i style="width:${Math.max(3, Math.min(n, 18))}px;height:${Math.max(3, Math.min(n, 18))}px"></i></button>`).join("")}</span><input type="range" id="dsize" min="1" max="60" value="6" title="Thickness ( [ and ] keys )"><b id="dszv">6</b></span></div></div>
      <button class="dbtn" id="dselcopy" type="button" title="Copy what is selected (Ctrl+C). Switch to another board, then Paste (Ctrl+V)" style="display:none">📋 Copy</button><button class="dbtn" id="dselcut" type="button" title="Cut what is selected (Ctrl+X)" style="display:none">✂️ Cut</button><button class="dbtn red" id="dseldel" type="button" title="Delete what is selected (Delete key)" style="display:none">✖ Delete selection</button><button class="dbtn" id="dpaste" type="button" title="Paste what you copied onto this board (Ctrl+V)" style="display:none">📥 Paste</button><input type="file" id="dimgf" accept="image/*" hidden>
      <span class="dsep"></span>
      <button class="dbtn" id="dundo" type="button" title="Undo (Ctrl+Z)">↩ Undo</button><button class="dbtn" id="dredo" type="button" title="Redo (Ctrl+Y)" disabled>↪ Redo</button>
      <div class="dmw"><button class="dbtn" id="dmorebtn" type="button" title="Save or clear the board" aria-haspopup="true" aria-expanded="false">⋯ More</button>
        <div class="dmenu dright" id="dmmore"><div class="dgrid one"><button class="dbtn" id="dsave" type="button">💾 Save</button><button class="dbtn red" id="dclr" type="button">🗑 Clear</button></div></div></div>
      <span id="dwho"></span>
    </div>
    <div id="dinvp"></div>
    <div id="dwrap"><div id="dstage"><canvas id="dcv" width="${W}" height="${H}"></canvas><canvas id="dsel" width="${W}" height="${H}"></canvas><div id="dcur"></div><div id="dloupe"><i></i><b></b></div></div></div>`;
  $$("box").after(board);
  const cv = $$("dcv"), stage = $$("dstage"), ov = $$("dsel"), ox = ov.getContext("2d");
  let cx = cv.getContext("2d");
  cx.lineCap = "round"; cx.lineJoin = "round";

  /* ---------- boards: the public one + private ones (each keeps its own strokes) ---------- */
  const mk = id => ({ id, strokes: [], byId: new Map(), gone: new Set(), clr: 0, mine: [], redoS: [], unread: 0, srAt: 0, opHist: new Map() });
  const states = new Map([["", mk("")]]);
  const P = states.get("");                      // the public board
  let S = P;                                     // the board on screen
  let joined = jget("pb_pvj", {});               // private boards other people invited me to: id -> owner's name
  let members = jget("pb_pvm", []);              // people I invited to MY private board: [{u, n}]
  if(!Array.isArray(members)) members = [];
  members = members.filter(m => m && okUid(m.u) && m.u !== uid).slice(0, MAXM).map(m => ({ u: m.u, n: String(m.n || "Friend").slice(0, 12) }));
  Object.keys(joined).forEach(b => { if(!okBid(b) || b === myBid) delete joined[b]; else joined[b] = String(joined[b] || "Someone").slice(0, 12); });
  states.set(myBid, mk(myBid));
  Object.keys(joined).forEach(b => states.set(b, mk(b)));
  const pboards = {};                            // HOST ONLY: owner id -> Set of member ids (the owner re-announces it, so a new host learns it)
  pboards[uid] = new Set(members.map(m => m.u));
  const saveJoined = () => save("pb_pvj", JSON.stringify(joined));
  const saveMembers = () => save("pb_pvm", JSON.stringify(members));
  let subs = jget("pb_subs", {}), subDel = jget("pb_subdel", {});     // shared sub-tabs: id -> { n: name, on: owner's name, ts, clr } · ids that were deleted
  if(Array.isArray(subs)) subs = {}; if(Array.isArray(subDel)) subDel = {};
  Object.keys(subs).forEach(b => { const e = subs[b]; if(!okSub(b) || !e || typeof e !== "object" || subDel[b]) delete subs[b]; else subs[b] = { n: cleanName(e.n) || "Sub-tab", on: String(e.on || "Someone").slice(0, 12), ts: +e.ts || 0, clr: +e.clr || 0 }; });
  Object.keys(subs).slice(0, MAXSUB).forEach(b => states.set(b, mk(b)));
  const saveSubs = () => { save("pb_subs", JSON.stringify(subs)); save("pb_subdel", JSON.stringify(subDel)); };

  let tool = "pen", prevTool = "pen", color = COLORS[0], size = 6, shapeKind = "line", shapeFill = false;
  let sel = null, lz = null;                      // lasso: the current selection · the pointer action in progress
  let cur = null, shp = null, base = null, pend = [], flushT = 0, persistT = 0, whoT = 0, lastC = 0;
  let ed = null, tx0 = null, txFs = 48, txBold = false;      // text tool: the open text box · where the pointer went down · chosen size · bold
  const okId = s => typeof s === "string" && /^[A-Za-z0-9_-]{4,60}$/.test(s);
  const okCol = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
  const cl = (v, a, b) => Math.min(b, Math.max(a, Math.round(+v || 0)));
  const mkId = () => "s" + uid.slice(-5) + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const MAXIMG = 10, IMG_MAX = 130000, LIM = 3000;   // pictures per board · biggest picture (characters of its data) · how far off the board a thing may be dragged
  const okPic = x => typeof x === "string" && x.length <= IMG_MAX && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(x);
  const angOf = v => { v = +v; if(!isFinite(v)) return 0; return Math.round(Math.atan2(Math.sin(v), Math.cos(v)) * 10000) / 10000; };

  const cleanText = v => { const t = String(v == null ? "" : v).replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").split("\n").slice(0, 8).map(l => l.slice(0, 80)).join("\n").replace(/\s+$/, ""); return t.trim() ? t : ""; };
  function cleanStroke(s){
    if(!s || typeof s !== "object" || !okId(s.id) || !okCol(s.c) || !Array.isArray(s.p)) return null;
    const fill = s.t === "f", shape = s.t === "h", img = s.t === "i", txt = s.t === "tx", p = [];
    if(shape && !SHAPES[s.sh]) return null;
    if(img && !okPic(s.im)) return null;
    let tx = ""; if(txt){ tx = cleanText(s.tx); if(!tx) return null; }
    const lx = fill ? 0 : -LIM, hx = fill ? W - 1 : W - 1 + LIM, hy = fill ? H - 1 : H - 1 + LIM, ly = fill ? 0 : -LIM;
    for(let i = 0; i + 1 < s.p.length && p.length < (fill || img || txt ? 2 : shape ? 4 : 8000); i += 2) p.push(cl(s.p[i], lx, hx), cl(s.p[i + 1], ly, hy));
    if(!p.length || (shape && p.length < 4) || (img && p.length < 2) || (txt && p.length < 2)) return null;
    const o = { id: s.id, o: okUid(s.o) ? s.o : "", n: String(s.n || "").slice(0, 12), c: s.c, w: cl(s.w, 1, 80), ts: +s.ts || 0, p };
    if(fill) o.t = "f";
    if(shape){ o.t = "h"; o.sh = s.sh; o.fl = s.fl ? 1 : 0; const r = angOf(s.r); if(r) o.r = r; }
    if(img){ o.t = "i"; o.im = s.im; o.iw = cl(s.iw, 8, 2400); o.ih = cl(s.ih, 8, 2400); const r = angOf(s.r); if(r) o.r = r; }
    if(txt){ o.t = "tx"; o.tx = tx; o.fs = cl(s.fs, 8, 600); o.bd = s.bd ? 1 : 0; const r = angOf(s.r); if(r) o.r = r; }
    return o;
  }
  function reindex(st){ st.byId = new Map(st.strokes.map(s => [s.id, s])); }
  function addStroke(st, s){          // keeps strokes ordered by time so every browser replays the same picture
    let lo = 0, hi = st.strokes.length;
    while(lo < hi){ const m = (lo + hi) >> 1, a = st.strokes[m]; if(a.ts < s.ts || (a.ts === s.ts && a.id <= s.id)) lo = m + 1; else hi = m; }
    st.strokes.splice(lo, 0, s); st.byId.set(s.id, s); return lo === st.strokes.length - 1;
  }
  function cap(st){
    { let ni = 0; for(let i = st.strokes.length - 1; i >= 0; i--) if(st.strokes[i].t === "i" && ++ni > MAXIMG) st.strokes.splice(i, 1); }
    let pts = 0; for(let i = st.strokes.length - 1; i >= 0; i--) pts += st.strokes[i].p.length;
    while(st.strokes.length > 1500 || (pts > 150000 && st.strokes.length > 1)){ pts -= st.strokes[0].p.length; st.strokes.shift(); }
    reindex(st);
  }

  /* ---------- painting (pen strokes, paint bucket, shapes) ---------- */
  function floodFill(x0, y0, hex){
    const img = cx.getImageData(0, 0, W, H), d = img.data, u = new Uint32Array(d.buffer);
    const i0 = (y0 * W + x0) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2];
    const fr = parseInt(hex.slice(1, 3), 16), fg = parseInt(hex.slice(3, 5), 16), fb = parseInt(hex.slice(5, 7), 16);
    if(Math.abs(tr - fr) + Math.abs(tg - fg) + Math.abs(tb - fb) < 6) return;
    const fill = ((255 << 24) | (fb << 16) | (fg << 8) | fr) >>> 0, TOL = 90;
    const seen = new Uint8Array(W * H);
    const m = p => { const j = p * 4; return Math.abs(d[j] - tr) + Math.abs(d[j + 1] - tg) + Math.abs(d[j + 2] - tb) <= TOL; };
    const stack = [x0, y0];
    while(stack.length){
      const y = stack.pop(), x = stack.pop(), row = y * W;
      if(seen[row + x] || !m(row + x)) continue;
      let lx = x, rx = x;
      while(lx > 0 && !seen[row + lx - 1] && m(row + lx - 1)) lx--;
      while(rx < W - 1 && !seen[row + rx + 1] && m(row + rx + 1)) rx++;
      for(let i = lx; i <= rx; i++){ seen[row + i] = 1; u[row + i] = fill; }
      for(const ny of [y - 1, y + 1]){
        if(ny < 0 || ny >= H) continue;
        const nr = ny * W; let inSpan = false;
        for(let i = lx; i <= rx; i++){
          const q = nr + i;
          if(!seen[q] && m(q)){ if(!inSpan){ stack.push(i, ny); inSpan = true; } } else inSpan = false;
        }
      }
    }
    cx.putImageData(img, 0, 0);
  }
  function paintShape(s){
    const [x1, y1, x2, y2] = s.p, lx = Math.min(x1, x2), rx = Math.max(x1, x2), ty = Math.min(y1, y2), by = Math.max(y1, y2);
    cx.strokeStyle = s.c; cx.fillStyle = s.c; cx.lineWidth = s.w; cx.lineCap = "round"; cx.lineJoin = "round";
    const rot = s.r && s.sh !== "line" && s.sh !== "arrow" ? s.r : 0;
    if(rot){ cx.save(); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; cx.translate(mx, my); cx.rotate(rot); cx.translate(-mx, -my); }
    cx.beginPath();
    if(s.sh === "line" || s.sh === "arrow"){
      cx.moveTo(x1, y1); cx.lineTo(x2, y2);
      if(s.sh === "arrow"){
        const a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(16, s.w * 4);
        cx.moveTo(x2, y2); cx.lineTo(x2 - L * Math.cos(a - 0.5), y2 - L * Math.sin(a - 0.5));
        cx.moveTo(x2, y2); cx.lineTo(x2 - L * Math.cos(a + 0.5), y2 - L * Math.sin(a + 0.5));
      }
      cx.stroke(); return;
    }
    if(s.sh === "rect") cx.rect(lx, ty, rx - lx, by - ty);
    else if(s.sh === "ellipse") cx.ellipse((lx + rx) / 2, (ty + by) / 2, Math.max(1, (rx - lx) / 2), Math.max(1, (by - ty) / 2), 0, 0, Math.PI * 2);
    else if(s.sh === "tri"){ cx.moveTo((lx + rx) / 2, ty); cx.lineTo(rx, by); cx.lineTo(lx, by); cx.closePath(); }
    else if(s.sh === "star"){
      const mx = (lx + rx) / 2, my = (ty + by) / 2, ax = (rx - lx) / 2, ay = (by - ty) / 2;
      for(let i = 0; i < 10; i++){
        const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 0.42 : 1, px = mx + Math.cos(a) * ax * k, py = my + Math.sin(a) * ay * k;
        if(i) cx.lineTo(px, py); else cx.moveTo(px, py);
      }
      cx.closePath();
    }
    if(s.fl) cx.fill();
    cx.stroke();
    if(rot) cx.restore();
  }
  const TXF = '"Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif', LH = 1.25;
  const mcx = document.createElement("canvas").getContext("2d");
  function txMeasure(s){
    const lines = s.tx.split("\n"); mcx.font = (s.bd ? "bold " : "") + s.fs + "px " + TXF;
    let w = 0; lines.forEach(l => { w = Math.max(w, mcx.measureText(l).width); });
    return { lines, w: Math.max(4, w), h: lines.length * s.fs * LH };
  }
  function paintText(s){
    const m = txMeasure(s);
    cx.save(); cx.translate(s.p[0], s.p[1]); if(s.r) cx.rotate(s.r);
    cx.font = (s.bd ? "bold " : "") + s.fs + "px " + TXF; cx.fillStyle = s.c; cx.textAlign = "center"; cx.textBaseline = "middle";
    m.lines.forEach((l, i) => cx.fillText(l, 0, (i - (m.lines.length - 1) / 2) * s.fs * LH));
    cx.restore();
  }
  const imgs = new Map(); let redrawQ = 0;       // picture elements by stroke id
  function paint(s, i0){
    if(s.t === "i"){ paintImg(s); return; }
    if(s.t === "tx"){ paintText(s); return; }
    if(s.t === "f"){ floodFill(s.p[0], s.p[1], s.c); return; }
    if(s.t === "h"){ paintShape(s); return; }
    const p = s.p; cx.strokeStyle = s.c; cx.fillStyle = s.c; cx.lineWidth = s.w; cx.lineCap = "round"; cx.lineJoin = "round";
    if(p.length === 2){ cx.beginPath(); cx.arc(p[0], p[1], s.w / 2, 0, 6.2832); cx.fill(); return; }
    const st = Math.max(0, i0 - 2);
    cx.beginPath(); cx.moveTo(p[st], p[st + 1]);
    for(let k = st + 2; k < p.length; k += 2) cx.lineTo(p[k], p[k + 1]);
    cx.stroke();
  }
  function redraw(){
    if(sel && sel.live){ sel.bg = buildBg(); drawPreview(); return; }      // somebody drew while I'm dragging: keep my drag on screen
    cx.fillStyle = "#fff"; cx.fillRect(0, 0, W, H);
    S.strokes.forEach(s => { if(!(ed && ed.hide === s.id)) paint(s, 0); });      // the text being edited is hidden while its box is open
    if(sel) selSync();
  }
  redraw();

  /* ---------- saving: survives a refresh (IndexedDB has far more room than localStorage) ---------- */
  const dbP = new Promise(res => {
    try { const r = indexedDB.open("purebred-board", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }
    catch(e){ res(null); }
  });
  const dirty = new Set();
  const dkey = st => st.id ? "board:" + st.id : "board";
  async function saveAll(){
    clearTimeout(persistT); persistT = 0;
    const list = [...dirty]; dirty.clear();
    const db = await dbP;
    for(const st of list){
      cap(st);
      const o = { clr: st.clr, strokes: st.strokes.slice(), gone: [...st.gone].slice(-1500) };
      if(db){ try { db.transaction("kv", "readwrite").objectStore("kv").put(o, dkey(st)); } catch(e){} }
      if(!st.id){ try { localStorage.setItem("pb_board", JSON.stringify({ clr: o.clr, strokes: o.strokes.slice(-150).filter(s => s.t !== "i"), gone: [] })); } catch(e){} }   // small backup copy of the public board
    }
  }
  function persistSoon(st){ dirty.add(st); clearTimeout(persistT); persistT = setTimeout(saveAll, 600); }
  async function dropSaved(st){ const db = await dbP; if(db){ try { db.transaction("kv", "readwrite").objectStore("kv").delete(dkey(st)); } catch(e){} } }
  async function loadBoard(st){
    if(!st.id){ try { const b = JSON.parse(load("pb_board", "{}")); if(b && typeof b === "object") merge(st, b); } catch(e){} }
    const db = await dbP; if(!db) return;
    try {
      const q = db.transaction("kv").objectStore("kv").get(dkey(st));
      q.onsuccess = () => { if(q.result && typeof q.result === "object") merge(st, q.result); };
    } catch(e){}
  }
  window.addEventListener("pagehide", saveAll);
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") saveAll(); });

  /* ---------- sharing ---------- */
  // the HOST decides who can see a private board: it only passes its messages to the owner and the people the owner invited
  function targetsOf(b){ const o = ownerOf(b), s = new Set([o]), pb = pboards[o]; if(pb) pb.forEach(u => s.add(u)); return s; }
  function routeHost(d, fromConn){            // returns true when the host itself should also apply the message
    const set = targetsOf(d.b); if(!set.has(d.f)) return false;
    let only = set;
    if(d.to){ if(!okUid(d.to) || !set.has(d.to)) return false; only = new Set([d.to]); }
    conns.forEach(x => { if(x !== fromConn && x.open && x.uid && x.uid !== d.f && only.has(x.uid)) x.send(d); });
    return only.has(uid) && d.f !== uid;
  }
  function relayTo(u, d, fromConn){
    if(u === uid){ applyPriv(d, d.b); return; }
    conns.forEach(x => { if(x !== fromConn && x.open && x.uid === u) x.send(d); });
  }
  function sendD(o, bid){
    if(bid === undefined) bid = S.id;
    o.t = "D"; o.i = newId(); o.f = uid; o.n = usr; if(bid) o.b = bid;
    if(bid && isHost){ if(okSub(bid)) routeSub(o, null); else routeHost(o, null); } else send(o);
    return o;
  }
  function snapParts(st){                                  // pictures make a board heavy: split it so no single message is too big
    cap(st); const gone = [...st.gone].slice(-1500), parts = []; let cur = [], size = 0;
    st.strokes.forEach(s => { const n = (s.im ? s.im.length : 0) + s.p.length * 7 + 120; if(cur.length && (size + n > 420000 || cur.length >= 1500)){ parts.push(cur); cur = []; size = 0; } cur.push(s); size += n; });
    parts.push(cur);
    return parts.map(strokes => ({ k: "snap", clr: st.clr, strokes, gone }));
  }
  const snapObjs = st => snapParts(st).map(b => Object.assign({ t: "D", i: newId() }, b));
  function sendSnap(conn){ (window.heavy || (f => f()))(() => { try { if(conn.open) snapObjs(P).forEach(o => conn.send(o)); } catch(e){} }); }
  function merge(st, sn){
    let changed = false;
    const nc = +sn.clr || 0;
    if(nc > st.clr){ st.clr = nc; st.strokes = st.strokes.filter(s => s.ts > st.clr); st.gone.clear(); changed = true; }
    (Array.isArray(sn.gone) ? sn.gone : []).slice(0, 3000).forEach(g => { if(okId(g) && !st.gone.has(g)){ st.gone.add(g); if(st.byId.has(g)) changed = true; } });
    if(changed){ st.strokes = st.strokes.filter(s => !st.gone.has(s.id)); reindex(st); }
    (Array.isArray(sn.strokes) ? sn.strokes : []).slice(0, 2000).forEach(raw => {
      const s = cleanStroke(raw); if(!s || s.ts <= st.clr || st.gone.has(s.id) || st.byId.has(s.id)) return;
      addStroke(st, s); changed = true;
    });
    if(changed){ cap(st); if(st === S) redraw(); persistSoon(st); }
    return changed;
  }
  function who(t){ const e = $$("dwho"); e.textContent = t; clearTimeout(whoT); whoT = setTimeout(() => { e.textContent = ""; }, 1800); }
  function rm(st, id){ if(!st.byId.has(id)) return; st.strokes = st.strokes.filter(s => s.id !== id); st.gone.add(id); reindex(st); if(st === S) redraw(); persistSoon(st); }
  function applyClr(st, t){ if(st.id && subs[st.id] && t > (subs[st.id].clr || 0)){ subs[st.id].clr = t; saveSubs(); } st.clr = Math.max(st.clr, t); st.strokes = st.strokes.filter(s => s.ts > st.clr); st.gone.clear(); st.mine = []; st.redoS = []; st.opHist.clear(); reindex(st); if(st === S){ redraw(); updBtns(); } persistSoon(st); }

  /* ---------- everyone's cursors (only people on the board you're looking at) ---------- */
  const curs = new Map();
  function showCursor(f, n, x, y, drawing){
    let c = curs.get(f);
    if(!c){ const el = document.createElement("div"); el.className = "dcur"; el.innerHTML = "<i></i><span></span>"; $$("dcur").appendChild(el); c = { el }; curs.set(f, c); }
    c.el.style.left = (x / W * 100) + "%"; c.el.style.top = (y / H * 100) + "%";
    c.el.firstChild.style.background = colorFor(n); c.el.lastChild.textContent = n; c.el.classList.toggle("dr", !!drawing); c.t = Date.now();
  }
  function hideCursor(f){ const c = curs.get(f); if(c){ c.el.remove(); curs.delete(f); } }
  tick(() => { if(!curs.size) return; const now = Date.now(); curs.forEach((c, f) => { if(now - c.t > 2500) hideCursor(f); }); }, 700);

  /* one handler for drawing messages on any board; returns false when the message is bad */
  function applyMsg(st, d, nm){
    const cs = st === S;
    const flag = () => { if(!cs && st.id && !st.unread){ st.unread = 1; buildSelect(); } };
    if(d.k === "c"){
      if(cs){ if(d.off) hideCursor(d.f); else showCursor(d.f, nm, cl(d.x, 0, W), cl(d.y, 0, H), d.d); }
      return true;
    }
    if(d.k === "p"){
      if(!okId(d.s) || !okCol(d.c) || !Array.isArray(d.pts) || !d.pts.length || d.pts.length > 400) return false;
      const ts = +d.ts || 0; if(ts <= st.clr || st.gone.has(d.s)) return false;
      let s = st.byId.get(d.s), atEnd = true;
      const old = s ? s.p.length : 0;
      if(!s){ s = { id: d.s, o: d.f, n: nm, c: d.c, w: cl(d.w, 1, 80), ts, p: [] }; atEnd = addStroke(st, s); }
      else if(s.o !== d.f || s.t) return false;
      for(let i = 0; i + 1 < d.pts.length && s.p.length < 8000; i += 2) s.p.push(cl(d.pts[i], 0, W), cl(d.pts[i + 1], 0, H));
      if(cs){ if(atEnd) paint(s, old); else redraw(); who("✏️ " + nm + " is drawing…"); } else flag();
      persistSoon(st); return true;
    }
    if(d.k === "s"){                           // a finished stroke / fill / shape
      const s = cleanStroke(d.s); if(!s || s.ts <= st.clr || st.gone.has(s.id) || st.byId.has(s.id)) return false;
      s.o = d.f; s.n = nm; const atEnd = addStroke(st, s);
      if(cs){ if(atEnd) paint(s, 0); else redraw(); who((s.t === "f" ? "🪣 " : s.t === "h" ? "🔷 " : s.t === "tx" ? "🔤 " : "✏️ ") + nm + (s.t === "f" ? " filled an area" : s.t === "h" ? " drew a shape" : s.t === "tx" ? " added text" : " drew")); } else flag();
      persistSoon(st); return true;
    }
    if(d.k === "u"){
      if(!okId(d.s)) return false; const s = st.byId.get(d.s);
      if(s && s.o !== d.f) return false;
      rm(st, d.s); if(!cs) flag(); return true;
    }
    if(d.k === "x"){                           // move / resize / rotate / delete: some things replaced by others
      const dels = Array.isArray(d.del) ? d.del.slice(0, 80) : [], adds = Array.isArray(d.add) ? d.add.slice(0, 40) : [];
      if(!dels.length && !adds.length) return false;
      const ch = applyX(st, dels, adds, d.f, nm);
      if(cs){ if(ch) who("✋ " + nm + " changed the drawing"); } else flag();
      return true;
    }
    if(d.k === "clr"){
      const t = +d.ts || 0; if(t > Date.now() + 60000) return false;
      applyClr(st, t || Date.now()); if(cs) who("🗑 " + nm + " cleared the board"); else flag();
      return true;
    }
    return false;
  }

  /* ----- the public board (works exactly like before) ----- */
  function onPub(d, fromConn){
    const host = isHost;
    if(d.k === "sl"){ if(!host) applyList(d); return; }          // the host's list of shared sub-tabs
    if(d.k === "snap"){
      if(host){ if(fromConn.snapIn) return; fromConn.snapIn = 1; if(merge(P, d)) snapObjs(P).forEach(o => send(o, fromConn)); }
      else {
        const had = P.strokes.length > 0;
        merge(P, d);
        if(had && P.strokes.length){ try { snapObjs(P).forEach(o => conns.forEach(c => c.open && c.send(o))); } catch(e){} }   // give the host anything it was missing
      }
      return;
    }
    if(!okUid(d.f) || d.f === uid) return;
    if(!applyMsg(P, d, String(d.n || "Someone").slice(0, 12))) return;
    if(host) send(d, fromConn);                // relay to everyone else
  }

  /* ----- private boards ----- */
  function setMembers(owner, mem){
    const set = new Set();
    (Array.isArray(mem) ? mem : []).slice(0, MAXM).forEach(u => { if(okUid(u) && u !== owner) set.add(u); });
    pboards[owner] = set;
  }
  function onPriv(d, b, fromConn){
    const owner = ownerOf(b);
    if(isHost){
      const fu = d.f; if(!okUid(fu)) return;
      const k = d.k;
      if(k === "pm"){ if(fu === owner) setMembers(owner, d.mem); return; }
      if(k === "pi" || k === "pk"){
        if(fu !== owner || !okUid(d.to) || d.to === owner) return;
        const set = pboards[owner] || (pboards[owner] = new Set());
        if(k === "pi"){ if(!set.has(d.to) && set.size >= MAXM) return; set.add(d.to); } else set.delete(d.to);
        relayTo(d.to, d, fromConn); return;
      }
      if(k === "pl"){ const set = pboards[owner]; if(!set || !set.has(fu)) return; set.delete(fu); relayTo(owner, d, fromConn); return; }
      if(k === "clr" && fu !== owner) return;                       // only the owner wipes a private board
      if(!routeHost(d, fromConn)) return;                           // not allowed, or the host isn't one of the people on it
    }
    applyPriv(d, b);
  }
  function applyPriv(d, b){
    const owner = ownerOf(b), k = d.k, mine = owner === uid;
    if(k === "pi"){ if(d.f === owner && !mine) joinBoard(b, d.n); return; }
    if(k === "pk"){ if(d.f === owner && joined[b]) leaveBoard(b, "removed"); return; }
    if(k === "pl"){ if(mine) dropMember(d.f); return; }
    const st = states.get(b); if(!st) return;                       // not my board and I wasn't invited: ignore
    if(!okUid(d.f) || d.f === uid) return;
    if(d.to && d.to !== uid) return;
    if(k === "snap"){ merge(st, d); return; }
    if(k === "sr"){                                                 // somebody (re)joined and wants the picture
      const ownerOn = mine || (lastRoster || []).some(e => e.c === owner);
      if(st.strokes.length && (mine || !ownerOn)){ const to = d.f; setTimeout(() => snapParts(st).forEach(pt => sendD(Object.assign(pt, { to }), b)), 100 + Math.random() * 300); }
      return;
    }
    applyMsg(st, d, String(d.n || "Someone").slice(0, 12));
  }
  /* ----- shared sub-tabs ----- */
  function routeSub(d, fromConn){            // HOST: pass a sub-tab message to everybody (or just the person it is for); returns true when the host should apply it too
    if(!subs[d.b]) return false;
    if(d.to){ if(!okUid(d.to)) return false; conns.forEach(x => { if(x !== fromConn && x.open && x.uid === d.to) x.send(d); }); return d.to === uid && d.f !== uid; }
    conns.forEach(x => { if(x !== fromConn && x.open && x.uid && x.uid !== d.f) x.send(d); });
    return d.f !== uid;
  }
  function addSub(b, name, ownerName, ts){
    name = cleanName(name); if(!okSub(b) || !name || subs[b] || subDel[b] || Object.keys(subs).length >= MAXSUB) return false;
    subs[b] = { n: name, on: String(ownerName || "Someone").slice(0, 12), ts: +ts || Date.now(), clr: 0 };
    const st = mk(b); states.set(b, st); loadBoard(st); saveSubs(); buildSelect(); chrome(); return true;
  }
  function delSub(b){
    if(!subs[b] && !states.has(b)) return;
    const st = states.get(b); delete subs[b]; subDel[b] = Date.now();
    const ks = Object.keys(subDel); if(ks.length > 200) ks.sort((a, c) => subDel[a] - subDel[c]).slice(0, ks.length - 200).forEach(k => delete subDel[k]);
    saveSubs();
    if(st){ states.delete(b); dirty.delete(st); dropSaved(st); if(S === st) openBoard(""); }
    buildSelect(); chrome();
  }
  function applyList(d){                      // the host tells a newcomer which sub-tabs exist (and which were cleared / deleted)
    (Array.isArray(d.del) ? d.del : []).slice(0, 200).forEach(b => { if(okSub(b)){ if(subs[b]) delSub(b); else subDel[b] = subDel[b] || Date.now(); } });
    (Array.isArray(d.list) ? d.list : []).slice(0, MAXSUB).forEach(e => {
      if(!e || !okSub(e.b)) return;
      addSub(e.b, e.n, e.on, e.ts);
      const st = states.get(e.b); if(st && +e.clr > st.clr) applyClr(st, Math.min(+e.clr, Date.now() + 60000));
    });
    saveSubs();
  }
  function sendSubList(conn){ try { if(conn.open) conn.send({ t: "D", i: newId(), f: uid, n: usr, k: "sl", list: Object.keys(subs).map(b => ({ b, n: subs[b].n, on: subs[b].on, ts: subs[b].ts, clr: subs[b].clr || 0 })), del: Object.keys(subDel).slice(-100) }); } catch(e){} }
  function onSub(d, b, fromConn){
    const owner = subOwner(b), fu = d.f, k = d.k;
    if(!okUid(fu)) return;
    if(isHost){
      if(k === "sc"){
        const name = cleanName(d.name);
        if(fu !== owner || !name || subs[b] || subDel[b] || Object.keys(subs).length >= MAXSUB || Object.keys(subs).filter(x => subOwner(x) === fu).length >= MAXSUB_EACH) return;
        conns.forEach(x => { if(x !== fromConn && x.open && x.uid && x.uid !== fu) x.send(d); });
      } else if(k === "sd"){
        if(fu !== owner && !(fromConn && fromConn.admin)) return;                 // only the person who made the sub-tab, or an owner (the host checks the connection really is one), can delete it
        conns.forEach(x => { if(x !== fromConn && x.open && x.uid && x.uid !== fu) x.send(d); });
      } else {
        if(k === "clr" && fu !== owner) return;                                   // ...or clear it
        if(!routeSub(d, fromConn)) return;
      }
    }
    applySub(d, b, isHost);
  }
  function applySub(d, b, hostChecked){
    const owner = subOwner(b), k = d.k, fu = d.f;
    if(!okUid(fu) || fu === uid) return;
    if(d.to && d.to !== uid) return;
    if(k === "sc"){ if(fu === owner && addSub(b, d.name, d.n, d.ts) && Date.now() - (+d.ts || 0) < 60000) sys("📌 " + String(d.n || "Someone").slice(0, 12) + " added a drawing sub-tab: " + subs[b].n + ". Open the 🎨 Draw tab to see it."); return; }
    if(k === "sd"){ if(fu === owner || hostChecked || !isHost) delSub(b); return; }   // guests only ever get this from the host, which already checked the sender is the maker or an owner
    const st = states.get(b); if(!st) return;
    if(k === "clr" && fu !== owner) return;                                          // only the owner wipes a sub-tab
    if(k === "snap"){ merge(st, fu === owner ? d : Object.assign({}, d, { clr: 0 })); return; }     // other people can't clear it by sending a picture
    if(k === "sr"){
      const mine = owner === uid, ownerOn = mine || (lastRoster || []).some(e => e.c === owner);
      if(st.strokes.length && (mine || !ownerOn)){ const to = fu; setTimeout(() => snapParts(st).forEach(pt => sendD(Object.assign(pt, { to }), b)), 100 + Math.random() * 600); }
      return;
    }
    applyMsg(st, d, String(d.n || "Someone").slice(0, 12));
  }
  function createSub(){
    const mineN = Object.keys(subs).filter(x => subOwner(x) === uid).length;
    if(mineN >= MAXSUB_EACH){ alert("You already made " + MAXSUB_EACH + " sub-tabs. Delete one first."); return; }
    if(Object.keys(subs).length >= MAXSUB){ alert("There are too many sub-tabs already."); return; }
    const name = cleanName(prompt("Name your new sub-tab (everyone can see and draw in it, only you can clear it):", ""));
    if(!name) return;
    const b = "c" + uid + "." + Date.now().toString(36).slice(-7);
    if(!addSub(b, name, usr, Date.now())) return;
    sendD({ k: "sc", name, ts: subs[b].ts }, b);
    openBoard(b);
  }

  function requestSync(st){
    if(!st || !st.id || (!isHost && !conns.length) || Date.now() - st.srAt < 8000) return;
    st.srAt = Date.now(); sendD({ k: "sr" }, st.id);
  }
  function announceMembers(){
    if(!members.length) return;
    if(isHost) pboards[uid] = new Set(members.map(m => m.u));
    else if(conns.length) sendD({ k: "pm", mem: members.map(m => m.u) }, myBid);
  }
  function afterConnect(){ announceMembers(); Object.keys(subs).forEach(b => { if(subOwner(b) === uid) sendD({ k: "sc", name: subs[b].n, ts: subs[b].ts }, b); }); Object.keys(joined).forEach(b => requestSync(states.get(b))); if(S.id) requestSync(S); }
  setInterval(() => { if(!isHost && conns.length) announceMembers(); }, 20000);

  function invite(u, n){
    if(!okUid(u) || u === uid || members.some(m => m.u === u) || members.length >= MAXM) return;
    members.push({ u, n: String(n || "Friend").slice(0, 12) }); saveMembers();
    if(isHost){ (pboards[uid] || (pboards[uid] = new Set())).add(u); relayTo(u, { t: "D", i: newId(), f: uid, n: usr, b: myBid, k: "pi", to: u }, null); }
    else sendD({ k: "pi", to: u }, myBid);
    const st = states.get(myBid);
    if(st.strokes.length) setTimeout(() => snapParts(st).forEach(pt => sendD(Object.assign(pt, { to: u }), myBid)), 300);   // give them what's already drawn
    renderInvp(); chrome();
  }
  function removeMember(u){
    members = members.filter(m => m.u !== u); saveMembers();
    if(isHost){ if(pboards[uid]) pboards[uid].delete(u); relayTo(u, { t: "D", i: newId(), f: uid, n: usr, b: myBid, k: "pk", to: u }, null); }
    else sendD({ k: "pk", to: u }, myBid);
    renderInvp(); chrome();
  }
  function dropMember(u){            // someone left my board
    const m = members.find(x => x.u === u); if(!m) return;
    members = members.filter(x => x.u !== u); saveMembers(); if(pboards[uid]) pboards[uid].delete(u);
    sys("🔒 " + m.n + " left your private drawing board."); renderInvp(); chrome();
  }
  function joinBoard(b, nm){
    const first = !joined[b];
    if(first && Object.keys(joined).length >= MAXJ) return;
    joined[b] = String(nm || "Someone").slice(0, 12); saveJoined();
    if(!states.has(b)){ const st = mk(b); states.set(b, st); loadBoard(st); }
    buildSelect(); chrome();
    if(first){
      sys("🔒 " + joined[b] + " invited you to their private drawing board. Open the 🎨 Draw tab and pick it from the board list.");
      invNote = 1; paintNote();
    }
    setTimeout(() => requestSync(states.get(b)), 500);
  }
  function leaveBoard(b, why){
    const nm = joined[b] || "Someone", st = states.get(b);
    delete joined[b]; saveJoined();
    if(st){ states.delete(b); dirty.delete(st); dropSaved(st); if(S === st) openBoard(""); }
    buildSelect();
    if(why === "removed") sys("🔒 " + nm + " removed you from their private drawing board.");
  }
  function leaveByMe(b){
    const o = ownerOf(b);
    if(isHost){ if(pboards[o]) pboards[o].delete(uid); relayTo(o, { t: "D", i: newId(), f: uid, n: usr, b, k: "pl" }, null); }
    else sendD({ k: "pl" }, b);
    leaveBoard(b, "left");
  }

  const _h = handle;
  handle = function(d, from){
    if(d && typeof d === "object" && d.t === "D"){
      if(!validId(d.i)) return;
      if(d.b !== undefined && !okBid(d.b) && !okSub(d.b)) return;
      if(isHost){
        if(!from.ok2 || from.denied || !from.uid) return;
        if(window.__pbMuted && window.__pbMuted(from.userName, from) && d.k !== "c" && d.k !== "pl" && d.k !== "pm") return;
        d.f = from.uid; d.n = String(from.userName || "").slice(0, 12);
        if(d.b !== undefined){ if(okSub(d.b)) onSub(d, d.b, from); else onPriv(d, d.b, from); } else onPub(d, from);
      } else {
        if(d.b !== undefined){ if(okSub(d.b)) onSub(d, d.b, null); else onPriv(d, d.b, null); } else onPub(d, null);
      }
      return;
    }
    _h(d, from);
    if(isHost && d && d.t === "P" && from.ok2 && !from.denied && !from.bsent){ from.bsent = 1; sendSnap(from); sendSubList(from); }   // newcomer gets the current public board
    if(!isHost && d && d.t === "R") setTimeout(afterConnect, 900);
  };

  /* ---------- board picker + invite panel ---------- */
  let invNote = 0;
  function paintNote(){
    const sub = row.querySelector(".csub"); if(sub) sub.textContent = invNote ? "🔒 New invite!" : "Draw together";
    tab.textContent = invNote ? "🎨 Draw •" : "🎨 Draw";
  }
  const dot = st => st && st.unread ? " ●" : "";
  function buildSelect(){
    const sel = $$("dboard"), v = S.id; sel.replaceChildren();
    const add = (val, txt) => { const o = document.createElement("option"); o.value = val; o.textContent = txt; sel.appendChild(o); };
    add("", "🌐 Public board");
    add(myBid, "🔒 My private board" + dot(states.get(myBid)));
    Object.keys(joined).forEach(b => add(b, "🔒 " + joined[b] + "'s board" + dot(states.get(b))));
    subList().forEach(b => add(b, "📌 " + subs[b].n + " · by " + (subOwner(b) === uid ? "you" : subs[b].on) + dot(states.get(b))));
    if(!states.has(v)) v = "";
    sel.value = v; buildSubs();
  }
  const subList = () => Object.keys(subs).filter(b => states.has(b)).sort((a, c) => (subs[a].ts || 0) - (subs[c].ts || 0));
  const strip = document.createElement("div"); strip.id = "dsubs"; $$("dtools").after(strip);
  function buildSubs(){                       // the sub-tab strip under the toolbar: Public board, every shared sub-tab, and a + to make one
    strip.replaceChildren();
    const chip = (id, txt, tip) => { const b = document.createElement("button"); b.type = "button"; b.className = "dchip" + (S.id === id ? " on" : ""); b.textContent = txt; if(tip) b.title = tip; b.onclick = () => openBoard(id); strip.appendChild(b); };
    chip("", "🌐 Public", "The public drawing board");
    subList().forEach(b => chip(b, "📌 " + subs[b].n + (states.get(b).unread && S.id !== b ? " ●" : ""), "Sub-tab by " + (subOwner(b) === uid ? "you" : subs[b].on) + ": everyone can draw, only they can clear it"));
    const add = document.createElement("button"); add.type = "button"; add.className = "dchip add"; add.textContent = "➕ Sub-tab"; add.title = "Make a new shared sub-tab (everyone can draw in it, only you can clear it)"; add.onclick = createSub; strip.appendChild(add);
  }
  function chrome(){
    const sub = okSub(S.id), priv = !!S.id && !sub, own = S.id === myBid, subMine = sub && subOwner(S.id) === uid, subBy = sub && subs[S.id] ? subs[S.id].on : "the maker";
    $$("dinv").style.display = priv ? "" : "none";
    $$("dinv").textContent = own ? "👥 Invite" : "👥 Members";
    $$("dclr").style.display = sub ? (subMine ? "" : "none") : (!priv || own) ? "" : "none";             // only the owner can wipe a private board or a sub-tab
    $$("dsubdel").style.display = (subMine || (sub && isOwnerNow())) ? "" : "none";
    $$("dsuball").style.display = (isOwnerNow() && Object.keys(subs).length) ? "" : "none";
    const t = $$("dtag"); t.className = "dtag" + (priv ? " pv" : "");
    t.textContent = sub ? "📌 " + (subMine ? "Your" : subBy + "'s") + " sub-tab · everyone can see & draw · only " + (subMine ? "you" : subBy) + " can clear it"
      : !priv ? "🌐 Everyone can see & draw here"
      : own ? (members.length ? "🔒 Private · you + " + members.length + " invited" : "🔒 Private · only you can see this")
      : "🔒 " + (joined[S.id] || "Someone") + "'s private board";
  }
  function abortDraw(){
    if(lz) lzCancel();
    if(cur) end();
    if(shp){ cx.drawImage(base, 0, 0); shp = null; base = null; }
  }
  function openBoard(id){
    if(!states.has(id)) id = "";
    closeEd(true); abortDraw(); clearSel();
    S = states.get(id); S.unread = 0;
    curs.forEach((c, f) => hideCursor(f));
    redraw(); buildSelect(); chrome(); updBtns();
    cv.classList.remove("swapin"); void cv.offsetWidth; cv.classList.add("swapin");
    $$("dinvp").style.display = "none";
    if(id){ requestSync(S); if(id === myBid) announceMembers(); }
  }
  $$("dboard").onchange = e => openBoard(e.target.value);

  const invp = $$("dinvp");
  function rowEl(name, btnTxt, fn, red){
    const r = document.createElement("div"); r.className = "dprow";
    const b = document.createElement("b"); b.textContent = name; r.appendChild(b);
    if(btnTxt){ const x = document.createElement("button"); x.type = "button"; x.className = "dbtn" + (red ? " red" : ""); x.textContent = btnTxt; x.onclick = fn; r.appendChild(x); }
    return r;
  }
  function renderInvp(){
    if(invp.style.display !== "block") return;
    const y = invp.scrollTop; invp.replaceChildren();
    const h = (t) => { const e = document.createElement("div"); e.className = "dph"; e.textContent = t; return e; };
    const top = document.createElement("div"); top.className = "dprow";
    const tt = document.createElement("b"); tt.textContent = S.id === myBid ? "🔒 Your private board" : "🔒 " + (joined[S.id] || "Private") + "'s board"; tt.style.fontSize = "14px";
    const cx2 = document.createElement("button"); cx2.type = "button"; cx2.className = "dbtn"; cx2.textContent = "✕"; cx2.onclick = () => { invp.style.display = "none"; };
    top.append(tt, cx2); invp.appendChild(top);
    if(S.id === myBid){
      invp.appendChild(h("In your board"));
      invp.appendChild(rowEl(usr + " (you)"));
      if(!members.length){ const n = document.createElement("div"); n.className = "dpn"; n.style.marginTop = "2px"; n.textContent = "Just you so far."; invp.appendChild(n); }
      members.forEach(m => invp.appendChild(rowEl(m.n, "Remove", () => removeMember(m.u), true)));
      invp.appendChild(h("Invite someone who's online"));
      const seen = new Set(), cand = [];
      (lastRoster || []).forEach(e => { if(e && e.c && okUid(e.c) && e.c !== uid && !seen.has(e.c) && !members.some(m => m.u === e.c)){ seen.add(e.c); cand.push(e); } });
      if(!cand.length){ const n = document.createElement("div"); n.className = "dpn"; n.style.marginTop = "2px"; n.textContent = members.length >= MAXM ? "Your board is full." : "Nobody else is online right now."; invp.appendChild(n); }
      else cand.forEach(e => invp.appendChild(rowEl(e.n, members.length >= MAXM ? "" : "Invite", () => invite(e.c, e.n))));
      const note = document.createElement("div"); note.className = "dpn";
      note.textContent = "Only you and the people you invite can see or draw on this board. Everyone else can't open it. Your drawing travels through the room's host device, which passes it on only to the people on this board.";
      invp.appendChild(note);
    } else {
      invp.appendChild(h("Owner"));
      invp.appendChild(rowEl(joined[S.id] || "Someone"));
      invp.appendChild(rowEl("Leave this board", "Leave", () => { if(confirm("Leave " + (joined[S.id] || "this") + "'s private board? You'll need a new invite to come back.")){ invp.style.display = "none"; leaveByMe(S.id); } }, true));
    }
    invp.scrollTop = y;
  }
  $$("dsubdel").onclick = () => { const b = S.id; if(!okSub(b) || (subOwner(b) !== uid && !isOwnerNow())) return; if(!confirm("Delete the sub-tab \"" + (subs[b] ? subs[b].n : "") + "\"" + (subOwner(b) !== uid && subs[b] ? " (made by " + subs[b].on + ")" : "") + " and everything drawn in it, for everyone?")) return; sendD({ k: "sd" }, b); delSub(b); };
  $$("dsuball").onclick = () => {
    if(!isOwnerNow()) return;
    const ids = Object.keys(subs).filter(okSub); if(!ids.length) return;
    if(!confirm("Delete ALL " + ids.length + " shared sub-tab" + (ids.length === 1 ? "" : "s") + " and everything drawn in " + (ids.length === 1 ? "it" : "them") + ", for everyone? This can't be undone.")) return;
    ids.forEach(b => { sendD({ k: "sd" }, b); delSub(b); });
  };
  $$("dinv").onclick = () => { invp.style.display = invp.style.display === "block" ? "none" : "block"; renderInvp(); };
  tick(() => { if(invp.style.display === "block") renderInvp(); }, 2500);
  document.addEventListener("pointerdown", e => { if(invp.style.display === "block" && !invp.contains(e.target) && e.target !== $$("dinv")) invp.style.display = "none"; });

  /* ---------- tools ---------- */
  const pal = $$("dpal");
  COLORS.forEach(c => {
    const b = document.createElement("button"); b.type = "button"; b.className = "dsw" + (c === color ? " on" : ""); b.style.background = c; b.dataset.c = c; b.title = c;
    b.onclick = () => useColor(c); pal.appendChild(b);
  });
  function updPrev(){
    const i = $$("dprev").firstChild, d = Math.max(3, Math.min(size, 30));
    i.style.width = i.style.height = d + "px"; i.style.background = tool === "erase" ? "#fff" : color;
    $$("dszv").textContent = size; $$("dsize").value = size;
    document.querySelectorAll(".dth").forEach(b => b.classList.toggle("on", +b.dataset.n === size));
  }
  function useColor(hex){
    color = hex.toLowerCase(); if(tool === "erase") setTool("pen");
    $$("dcolor").value = color;
    pal.querySelectorAll(".dsw").forEach(b => b.classList.toggle("on", b.dataset.c.toLowerCase() === color));
    if(ed){ ed.c = color; sizeEd(); }
    updPrev();
  }
  function setTool(t){
    if(t === "pick" && tool !== "pick") prevTool = tool;
    tool = t; if(t !== "lasso") clearSel(); if(t !== "text") closeEd(true);
    [["dpen", "pen"], ["dfill", "fill"], ["dshape", "shape"], ["dpick", "pick"], ["der", "erase"], ["dlasso", "lasso"], ["dtext", "text"]].forEach(([id, n]) => $$(id).classList.toggle("on", t === n));
    $$("dshgrp").classList.toggle("on", t === "shape");
    $$("dtxgrp").classList.toggle("on", t === "text");
    cv.style.cursor = t === "fill" ? "cell" : t === "text" ? "text" : "crosshair";
    if(t !== "pick") $$("dloupe").style.display = "none";
    updPrev();
  }
  $$("dpen").onclick = () => setTool("pen");
  $$("dfill").onclick = () => setTool("fill");
  $$("dshape").onclick = () => setTool("shape");
  $$("dtext").onclick = () => { setTool("text"); who("🔤 Click the board to type"); };
  $$("dtxsz").onchange = e => { txFs = +e.target.value; if(ed){ ed.fs = txFs; sizeEd(); ed.el.focus(); } };
  $$("dtxbd").onchange = e => { txBold = e.target.checked; if(ed){ ed.bd = txBold ? 1 : 0; sizeEd(); ed.el.focus(); } };
  $$("dtools").addEventListener("mousedown", e => { if(ed && !e.target.closest("select,input,textarea,option,label")) e.preventDefault(); });   // keep the text box open while using the buttons
  $$("dpick").onclick = () => setTool(tool === "pick" ? prevTool : "pick");
  $$("der").onclick = () => setTool("erase");
  $$("dshsel").onchange = e => { shapeKind = e.target.value; setTool("shape"); };
  $$("dshfill").onchange = e => { shapeFill = e.target.checked; };
  $$("dcolor").oninput = e => useColor(e.target.value);
  $$("dsize").oninput = e => { size = +e.target.value; updPrev(); };
  document.querySelectorAll(".dth").forEach(b => { b.onclick = () => { size = +b.dataset.n; updPrev(); }; });
  function sample(x, y){ const d = cx.getImageData(x, y, 1, 1).data; return "#" + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, "0")).join(""); }

  function updBtns(){ $$("dredo").disabled = !S.redoS.length; $$("dundo").disabled = !S.mine.some(id => { const h = S.opHist.get(id); return h ? (!h.newIds.length || h.newIds.some(x => S.byId.has(x))) : S.byId.has(id); }); }
  function undo(){
    while(S.mine.length){
      const id = S.mine.pop(), h = S.opHist.get(id);
      if(h){ S.opHist.delete(id); if(undoOp(h)) break; continue; }       // undo a move / resize / rotate / delete
      const s = S.byId.get(id);
      if(s){ S.redoS.push(JSON.parse(JSON.stringify(s))); sendD({ k: "u", s: id }); rm(S, id); break; }
    }
    updBtns();
  }
  function redo(){
    const o = S.redoS.pop(); if(!o) return;
    if(o.__op){ redoOp(o); updBtns(); return; }
    const s = Object.assign({}, o, { id: mkId(), ts: Date.now(), o: uid, n: usr });     // comes back on top as a fresh stroke
    if(addStroke(S, s)) paint(s, 0); else redraw(); S.mine.push(s.id); sendD({ k: "s", s }); persistSoon(S); updBtns();
  }
  $$("dundo").onclick = undo; $$("dredo").onclick = redo;
  const clearBoard = () => { const t = Date.now(); applyClr(S, t); sendD({ k: "clr", ts: t }); };
  $$("dclr").onclick = () => { if(okSub(S.id) && subOwner(S.id) !== uid) return; if(!confirm(okSub(S.id) ? "Clear this sub-tab for everyone?" : S.id ? "Clear your private board for everyone on it?" : "Clear the whole drawing board for everyone?")) return; clearBoard(); };
  $$("dsave").onclick = () => cv.toBlob(b => {
    if(!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = S.id ? "purebred-private-drawing.png" : "purebred-drawing.png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  document.addEventListener("keydown", e => {
    if(!document.body.classList.contains("in-draw")) return;
    const tg = e.target, typing = tg && (tg.tagName === "TEXTAREA" || (tg.tagName === "INPUT" && tg.type !== "range" && tg.type !== "checkbox"));
    if(!(e.ctrlKey || e.metaKey)){
      if(typing) return;
      if(sel && (e.key === "Delete" || e.key === "Backspace")){ e.preventDefault(); deleteSel(); return; }
      if(sel && e.key === "Escape"){ clearSel(); return; }
      if(e.key === "[" ){ size = Math.max(1, size - (size > 12 ? 4 : 1)); updPrev(); }
      else if(e.key === "]"){ size = Math.min(60, size + (size >= 12 ? 4 : 1)); updPrev(); }
      return;
    }
    const k = e.key.toLowerCase();
    if((k === "c" || k === "x") && sel && !typing){
      if(k === "x") cutSel(); else if(copySel()) say("📋 Copied " + nThings(clip.items.length) + ". Switch boards, then press Paste (or Ctrl+V).");
      return;
    }
    if(k === "z" && !e.shiftKey){ e.preventDefault(); undo(); }
    else if(k === "y" || (k === "z" && e.shiftKey)){ e.preventDefault(); redo(); }
  });

  /* ---------- text boxes ---------- */
  function topText(x, y){ const tol = 6 * unit(); for(let i = S.strokes.length - 1; i >= 0; i--){ const s = S.strokes[i]; if(s.t === "tx" && hitStroke(s, x, y, tol)) return s; } return null; }
  function sizeEd(){
    if(!ed) return;
    const k = stage.getBoundingClientRect().width / W || 1, fs = ed.fs * k, el = ed.el;
    el.style.fontSize = fs + "px"; el.style.fontWeight = ed.bd ? "700" : "400"; el.style.color = ed.c;
    const lines = el.value.split("\n"); mcx.font = (ed.bd ? "bold " : "") + fs + "px " + TXF;
    let w = 0; lines.forEach(l => { w = Math.max(w, mcx.measureText(l || " ").width); });
    el.style.width = Math.ceil(w + fs * 0.5 + 6) + "px"; el.style.height = Math.ceil(lines.length * fs * LH) + "px";
  }
  function openEd(x, y, ex){
    closeEd(true);
    const el = document.createElement("textarea"); el.id = "dtxin"; el.spellcheck = false; el.maxLength = 400; el.rows = 1; el.wrap = "off"; el.setAttribute("autocomplete", "off");
    ed = { el, x: ex ? ex.p[0] : x, y: ex ? ex.p[1] : y, fs: ex ? ex.fs : txFs, bd: ex ? (ex.bd ? 1 : 0) : (txBold ? 1 : 0), c: ex ? ex.c : color, r: ex ? (ex.r || 0) : 0, ex: ex || null, hide: ex ? ex.id : "", t: Date.now() };
    el.value = ex ? ex.tx : "";
    el.style.left = (ed.x / W * 100) + "%"; el.style.top = (ed.y / H * 100) + "%";
    if(ed.r) el.style.transform = "translate(-50%,-50%) rotate(" + ed.r + "rad)";
    stage.appendChild(el);
    if(ex) redraw();
    sizeEd(); el.focus();
    el.addEventListener("input", sizeEd);
    el.addEventListener("keydown", ev => {
      ev.stopPropagation();
      if(ev.key === "Escape"){ ev.preventDefault(); closeEd(false); }
      else if(ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)){ ev.preventDefault(); closeEd(true); }
    });
    el.addEventListener("blur", ev => {
      if(!ed || ed.el !== el) return;
      const rt = ev.relatedTarget; if(rt && $$("dtools").contains(rt)) return;          // using the size / bold controls
      if(Date.now() - ed.t < 300){ setTimeout(() => { if(ed && ed.el === el) el.focus(); }, 0); return; }
      closeEd(true);
    });
  }
  function closeEd(save){
    if(!ed) return; const e = ed; ed = null;
    const text = cleanText(e.el.value); e.el.remove();
    if(save && !muteCheck()) commitText(e, text);
    if(e.ex) redraw();
  }
  function commitText(e, text){
    const old = e.ex;
    if(old){
      if(!text){ if(S.byId.has(old.id)){ applyX(S, [old.id], [], uid, usr); sendOps([old.id], []); pushOp([], [copyS(old)]); S.redoS = []; persistSoon(S); updBtns(); } return; }
      if(text === old.tx && e.fs === old.fs && e.bd === (old.bd ? 1 : 0) && e.c === old.c) return;
    } else if(!text) return;
    const s = cleanStroke({ id: mkId(), o: uid, n: usr, c: e.c, w: 1, ts: Date.now(), t: "tx", p: [e.x, e.y], tx: text, fs: e.fs, bd: e.bd, r: e.r });
    if(!s){ say("Couldn't add that text."); return; }
    S.redoS = [];
    if(old && S.byId.has(old.id)){ applyX(S, [old.id], [s], uid, usr); sendOps([old.id], [s]); pushOp([s.id], [copyS(old)]); }
    else { if(addStroke(S, s)) paint(s, 0); else redraw(); S.mine.push(s.id); sendD({ k: "s", s }); }
    persistSoon(S); updBtns();
  }

  /* ---------- pointer drawing (several people can draw at the same time) ---------- */
  function pt(e){ const r = cv.getBoundingClientRect(); return [cl((e.clientX - r.left) * W / r.width, 0, W - 1), cl((e.clientY - r.top) * H / r.height, 0, H - 1)]; }
  function flush(){
    clearTimeout(flushT); flushT = 0;
    if(!cur || !pend.length) return;
    sendD({ k: "p", s: cur.id, c: cur.c, w: cur.w, ts: cur.ts, pts: pend }); pend = [];
  }
  function sendCursor(x, y, drawing){
    const now = Date.now(); if(now - lastC < 100) return; lastC = now;
    sendD({ k: "c", x, y, d: drawing ? 1 : 0 });
  }
  const muteCheck = () => { if(window.__pbMuted && window.__pbMuted(usr)){ sys("You're muted by an owner."); return true; } return false; };
  function shapeEnd(x, y, shift){
    let x2 = x, y2 = y;
    if(shift){
      const dx = x - shp.x1, dy = y - shp.y1;
      if(shapeKind === "line" || shapeKind === "arrow"){ const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, L = Math.hypot(dx, dy); x2 = shp.x1 + Math.cos(a) * L; y2 = shp.y1 + Math.sin(a) * L; }
      else { const m = Math.max(Math.abs(dx), Math.abs(dy)); x2 = shp.x1 + (dx < 0 ? -m : m); y2 = shp.y1 + (dy < 0 ? -m : m); }
    }
    return [cl(x2, 0, W - 1), cl(y2, 0, H - 1)];
  }
  function finishShape(){
    if(!shp) return; const s0 = shp; shp = null;
    cx.drawImage(base, 0, 0); base = null;
    if(Math.abs(s0.x2 - s0.x1) + Math.abs(s0.y2 - s0.y1) < 4) return;       // just a click: no shape
    const s = { id: mkId(), o: uid, n: usr, c: color, w: size, ts: Date.now(), t: "h", sh: shapeKind, fl: shapeFill && FILLABLE.has(shapeKind) ? 1 : 0, p: [s0.x1, s0.y1, s0.x2, s0.y2] };
    if(addStroke(S, s)) paint(s, 0); else redraw();
    S.mine.push(s.id); sendD({ k: "s", s }); persistSoon(S); updBtns();
  }
  cv.addEventListener("pointerdown", e => {
    if(e.button > 0 || cur || shp || lz) return;
    const [x, y] = pt(e);
    if(tool === "pick"){ e.preventDefault(); useColor(sample(x, y)); setTool(prevTool === "pick" || prevTool === "erase" ? "pen" : prevTool); return; }
    if(muteCheck()) return;
    e.preventDefault();
    if(tool === "lasso"){ const q = ptf(e); lassoDown(e, q[0], q[1]); return; }
    if(tool === "text"){ if(ed) closeEd(true); tx0 = { x, y }; return; }
    S.redoS = [];
    if(tool === "fill"){
      const s = { id: mkId(), o: uid, n: usr, c: color, w: 1, ts: Date.now(), t: "f", p: [x, y] };
      if(addStroke(S, s)) paint(s, 0); else redraw(); S.mine.push(s.id); sendD({ k: "s", s }); persistSoon(S); updBtns(); return;
    }
    try { cv.setPointerCapture(e.pointerId); } catch(x2){}
    if(tool === "shape"){
      base = document.createElement("canvas"); base.width = W; base.height = H; base.getContext("2d").drawImage(cv, 0, 0);
      shp = { x1: x, y1: y, x2: x, y2: y }; updBtns(); return;
    }
    cur = { id: mkId(), o: uid, n: usr, c: tool === "erase" ? "#ffffff" : color, w: tool === "erase" ? Math.min(80, size * 2.5) : size, ts: Date.now(), p: [x, y] };
    S.mine.push(cur.id);
    if(addStroke(S, cur)) paint(cur, 0); else redraw();
    pend = [x, y]; flush(); updBtns();
  });
  cv.addEventListener("pointermove", e => {
    const [hx, hy] = pt(e); sendCursor(hx, hy, !!cur || !!shp || !!lz);
    if(lz){ lassoMove(e); return; }
    if(tool === "lasso") hoverCursor(e);
    if(tool === "pick"){
      const r = cv.getBoundingClientRect(), hex = sample(hx, hy), lp = $$("dloupe");
      lp.style.display = "flex"; lp.style.left = (e.clientX - r.left + 16) + "px"; lp.style.top = (e.clientY - r.top - 40) + "px";
      lp.firstChild.style.background = hex; lp.lastChild.textContent = hex.toUpperCase();
    }
    if(shp){
      [shp.x2, shp.y2] = shapeEnd(hx, hy, e.shiftKey);
      cx.drawImage(base, 0, 0);
      paintShape({ c: color, w: size, sh: shapeKind, fl: shapeFill && FILLABLE.has(shapeKind) ? 1 : 0, p: [shp.x1, shp.y1, shp.x2, shp.y2] });
      return;
    }
    if(!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const old = cur.p.length;
    (evs.length ? evs : [e]).forEach(ev => {
      if(cur.p.length >= 8000) return;
      const [x, y] = pt(ev), n = cur.p.length;
      if(Math.abs(x - cur.p[n - 2]) + Math.abs(y - cur.p[n - 1]) < 2) return;
      cur.p.push(x, y); pend.push(x, y);
    });
    if(cur.p.length > old){ paint(cur, old); if(!flushT) flushT = setTimeout(flush, 45); }
  });
  function end(){ if(!cur) return; flush(); cur = null; persistSoon(S); }
  const up = () => {
    if(tx0){ const t = tx0; tx0 = null; const hit = topText(t.x, t.y); setTimeout(() => { if(tool === "text" && !ed) openEd(t.x, t.y, hit); }, 60); return; }      // a short wait so the click can't steal the focus back
    if(lz) lassoUp(); else if(shp) finishShape(); else end();
  };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", () => { tx0 = null; if(lz){ lzCancel(); } else if(shp){ cx.drawImage(base, 0, 0); shp = null; base = null; } else end(); });
  cv.addEventListener("pointerleave", () => { $$("dloupe").style.display = "none"; if(!cur && !shp){ lastC = 0; sendD({ k: "c", off: 1 }); } });

  /* ---------- lasso maths: a selection is a frame (centre, angle, half-width, half-height); moving / resizing / rotating the frame maps every item inside it ---------- */
  const rot2 = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };
  const isBox = s => s.t === "i" || s.t === "tx" || (s.t === "h" && s.sh !== "line" && s.sh !== "arrow");
  function boxOf(s){                                     // centre, half sizes and angle of a picture / rectangle-like shape
    if(s.t === "tx"){ const m = txMeasure(s); return { c: [s.p[0], s.p[1]], hw: m.w / 2 + 4, hh: m.h / 2, r: s.r || 0 }; }
    if(s.t === "i") return { c: [s.p[0], s.p[1]], hw: s.iw / 2, hh: s.ih / 2, r: s.r || 0 };
    const x1 = s.p[0], y1 = s.p[1], x2 = s.p[2], y2 = s.p[3];
    return { c: [(x1 + x2) / 2, (y1 + y2) / 2], hw: Math.abs(x2 - x1) / 2, hh: Math.abs(y2 - y1) / 2, r: s.r || 0 };
  }
  function ptsOf(s){                                     // outline points of one thing, in board coordinates
    if(isBox(s)){ const b = boxOf(s); return [[-b.hw, -b.hh], [b.hw, -b.hh], [b.hw, b.hh], [-b.hw, b.hh]].map(q => { const v = rot2(q[0], q[1], b.r); return [b.c[0] + v[0], b.c[1] + v[1]]; }); }
    if(s.t === "h") return [[s.p[0], s.p[1]], [s.p[2], s.p[3]]];
    const out = []; for(let i = 0; i + 1 < s.p.length; i += 2) out.push([s.p[i], s.p[i + 1]]); return out;
  }
  const padOf = s => s.t === "i" ? 0 : s.w / 2 + (s.sh === "arrow" ? Math.max(16, s.w * 4) * 0.45 : 0);
  function frameOf(items){
    if(items.length === 1 && isBox(items[0].s)){ const s = items[0].s, b = boxOf(s), pad = s.t === "i" ? 0 : s.w / 2; return { C: b.c, th: b.r, hw: Math.max(4, b.hw + pad), hh: Math.max(4, b.hh + pad) }; }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    items.forEach(it => { const pad = padOf(it.s); ptsOf(it.s).forEach(q => { x0 = Math.min(x0, q[0] - pad); y0 = Math.min(y0, q[1] - pad); x1 = Math.max(x1, q[0] + pad); y1 = Math.max(y1, q[1] + pad); }); });
    return { C: [(x0 + x1) / 2, (y0 + y1) / 2], th: 0, hw: Math.max(6, (x1 - x0) / 2), hh: Math.max(6, (y1 - y0) / 2) };
  }
  function mapOf(f0, f1){                                // frame f0 -> frame f1:  p' = C1 + R(th1) * diag(sx, sy) * R(-th0) * (p - C0)
    const sx = f1.hw / f0.hw, sy = f1.hh / f0.hh, c0 = Math.cos(-f0.th), s0 = Math.sin(-f0.th), c1 = Math.cos(f1.th), s1 = Math.sin(f1.th);
    const a = c1 * sx, b = -s1 * sy, c = s1 * sx, d = c1 * sy;
    const m11 = a * c0 + b * s0, m12 = -a * s0 + b * c0, m21 = c * c0 + d * s0, m22 = -c * s0 + d * c0;
    return { m11, m12, m21, m22, pt: (x, y) => { const dx = x - f0.C[0], dy = y - f0.C[1]; return [f1.C[0] + m11 * dx + m12 * dy, f1.C[1] + m21 * dx + m22 * dy]; } };
  }
  const axes = (M, r) => { const ux = Math.cos(r), uy = Math.sin(r); return [[M.m11 * ux + M.m12 * uy, M.m21 * ux + M.m22 * uy], [-M.m11 * uy + M.m12 * ux, -M.m21 * uy + M.m22 * ux]]; };
  function xform(s, M){                                  // a copy of one thing after the frame map
    const o = Object.assign({}, s), det = Math.abs(M.m11 * M.m22 - M.m12 * M.m21);
    if(s.t === "tx"){            // text: the font size follows the frame's scale
      const ax = axes(M, s.r || 0), c = M.pt(s.p[0], s.p[1]), k = (Math.hypot(ax[0][0], ax[0][1]) + Math.hypot(ax[1][0], ax[1][1])) / 2;
      o.p = [c[0], c[1]]; o.fs = Math.min(600, Math.max(8, s.fs * k)); o.r = Math.atan2(ax[0][1], ax[0][0]); return o;
    }
    if(s.t === "i"){
      const ax = axes(M, s.r || 0), c = M.pt(s.p[0], s.p[1]);
      o.p = [c[0], c[1]]; o.iw = Math.hypot(ax[0][0], ax[0][1]) * s.iw; o.ih = Math.hypot(ax[1][0], ax[1][1]) * s.ih; o.r = Math.atan2(ax[0][1], ax[0][0]); return o;
    }
    o.w = Math.min(80, Math.max(1, Math.round(s.w * Math.sqrt(det))));
    if(s.t === "h"){
      if(!isBox(s)){ const a = M.pt(s.p[0], s.p[1]), b = M.pt(s.p[2], s.p[3]); o.p = [a[0], a[1], b[0], b[1]]; return o; }
      const bx = boxOf(s), ax = axes(M, bx.r), c = M.pt(bx.c[0], bx.c[1]);
      const hx = bx.hw * Math.hypot(ax[0][0], ax[0][1]), hy = bx.hh * Math.hypot(ax[1][0], ax[1][1]);
      o.p = [c[0] - hx, c[1] - hy, c[0] + hx, c[1] + hy]; o.r = Math.atan2(ax[0][1], ax[0][0]); return o;
    }
    const p = []; for(let i = 0; i + 1 < s.p.length; i += 2){ const q = M.pt(s.p[i], s.p[i + 1]); p.push(q[0], q[1]); }
    o.p = p; return o;
  }
  function inPoly(x, y, poly){ let c = false; for(let i = 0, j = poly.length - 1; i < poly.length; j = i++){ const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; if((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
  function sampleIn(s, poly){                            // true when at least half of a thing's outline sits inside the lasso
    let pts = ptsOf(s);
    if(pts.length === 4){ const m = [(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2]; pts = pts.concat([m], [0, 1, 2, 3].map(k => [(pts[k][0] + pts[(k + 1) % 4][0]) / 2, (pts[k][1] + pts[(k + 1) % 4][1]) / 2])); }
    else if(pts.length === 2) pts = pts.concat([[(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2]]);
    const step = Math.max(1, Math.floor(pts.length / 80)); let n = 0, ins = 0;
    for(let i = 0; i < pts.length; i += step){ n++; if(inPoly(pts[i][0], pts[i][1], poly)) ins++; }
    return n > 0 && ins * 2 >= n;
  }
  function segDist(x, y, a, b){ const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy)); }
  function hitStroke(s, x, y, tol){                      // is this board point on that thing?
    if(isBox(s)){
      const b = boxOf(s), q = rot2(x - b.c[0], y - b.c[1], -b.r), pad = s.t === "i" ? tol : tol + s.w / 2;
      const inside = Math.abs(q[0]) <= b.hw + pad && Math.abs(q[1]) <= b.hh + pad;
      if(s.t === "h" && !s.fl) return inside && !(Math.abs(q[0]) <= b.hw - pad && Math.abs(q[1]) <= b.hh - pad);   // hollow shape: only its edge counts
      return inside;
    }
    const p = ptsOf(s), r = s.w / 2 + tol;
    if(p.length === 1) return Math.hypot(x - p[0][0], y - p[0][1]) <= r;
    for(let i = 0; i + 1 < p.length; i++) if(segDist(x, y, p[i], p[i + 1]) <= r) return true;
    return false;
  }

  /* ================= pictures + lasso (select -> move / resize / rotate) ================= */
  const CURS = { n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize", nw: "nwse-resize", se: "nwse-resize", ne: "nesw-resize", sw: "nesw-resize", rot: "grab", move: "move" };
  const say = t => { try { if(typeof toast === "function") toast(t); else sys(t); } catch(e){ try { sys(t); } catch(x){} } };
  const unit = () => { const w = cv.getBoundingClientRect().width; return w > 0 ? W / w : 1; };          // 1 screen pixel, in board pixels
  const ptf = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  const cloneF = f => ({ C: f.C.slice(), th: f.th, hw: f.hw, hh: f.hh });
  const copyS = s => JSON.parse(JSON.stringify(s));
  const normA = a => Math.atan2(Math.sin(a), Math.cos(a));
  const clampC = c => [Math.min(W, Math.max(0, c[0])), Math.min(H, Math.max(0, c[1]))];
  const showDel = on => { ["dseldel", "dselcopy", "dselcut"].forEach(id => { $$(id).style.display = on ? "" : "none"; }); };

  /* ---- pictures ---- */
  function wantRedraw(){ if(redrawQ) return; redrawQ = requestAnimationFrame(() => { redrawQ = 0; redraw(); drawOv(); }); }
  function imgEl(s){
    let e = imgs.get(s.id);
    if(!e){ if(imgs.size > 80) imgs.delete(imgs.keys().next().value); e = new Image(); e.onload = wantRedraw; e.src = s.im; imgs.set(s.id, e); }
    return e;
  }
  function paintImg(s){
    const e = imgEl(s); if(!e.complete || !e.naturalWidth) return;
    cx.save(); cx.translate(s.p[0], s.p[1]); if(s.r) cx.rotate(s.r); cx.imageSmoothingQuality = "high"; cx.drawImage(e, -s.iw / 2, -s.ih / 2, s.iw, s.ih); cx.restore();
  }
  function shrink(im){                                    // make the picture small enough to send: webp, or png / jpeg on browsers that can't write webp
    const nw = im.naturalWidth, nh = im.naturalHeight; if(!nw || !nh) return null;
    for(const L of [900, 720, 560, 420, 320, 240, 160]){
      const k = Math.min(1, L / Math.max(nw, nh)), w = Math.max(1, Math.round(nw * k)), h = Math.max(1, Math.round(nh * k));
      const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(im, 0, 0, w, h);
      let u = c.toDataURL("image/webp", 0.82);
      if(!u.startsWith("data:image/webp")){
        u = c.toDataURL("image/png");
        if(u.length > IMG_MAX){ const c2 = document.createElement("canvas"); c2.width = w; c2.height = h; const g = c2.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); u = c2.toDataURL("image/jpeg", 0.8); }
      }
      if(okPic(u)) return { u, w, h };
    }
    return null;
  }
  function addImageFile(file){
    if(!file || !/^image\//.test(file.type || "")) { say("That isn't a picture."); return; }
    if(muteCheck()) return;
    if(S.strokes.filter(s => s.t === "i").length >= MAXIMG){ say("This board already has " + MAXIMG + " pictures. Delete one first."); return; }
    const url = URL.createObjectURL(file), im = new Image();
    im.onerror = () => { URL.revokeObjectURL(url); say("Couldn't open that picture."); };
    im.onload = () => {
      URL.revokeObjectURL(url);
      const r = shrink(im); if(!r){ say("That picture is too detailed to add. Try a smaller one."); return; }
      const k = Math.min(1, W * 0.6 / r.w, H * 0.6 / r.h);
      const c = cleanStroke({ id: mkId(), o: uid, n: usr, c: "#000000", w: 1, ts: Date.now(), t: "i", p: [W / 2, H / 2], iw: r.w * k, ih: r.h * k, r: 0, im: r.u });
      if(!c) { say("Couldn't add that picture."); return; }
      S.redoS = []; if(addStroke(S, c)) paint(c, 0); else redraw();
      S.mine.push(c.id); sendD({ k: "s", s: c }); persistSoon(S); updBtns();
      setTool("lasso"); selectItems([c], []);
    };
    im.src = url;
  }
  window.__pbBoardAddImage = addImageFile;
  $$("dimg").onclick = () => $$("dimgf").click();
  $$("dimgf").onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if(f) addImageFile(f); };
  $$("dlasso").onclick = () => { setTool("lasso"); who("🪢 Draw around things to select them, or click a picture. Ctrl+C / Ctrl+V copies them to another board"); };
  $$("dseldel").onclick = () => deleteSel();

  /* ---- copy / cut / paste: the clipboard lives outside any one board, so you can lasso on one board and paste onto another ---- */
  let clip = null;                                        // { items: copies of the selected things, from: board id, cnt: pastes so far per board, at: when }
  try {
    const j = JSON.parse(sessionStorage.getItem("pb_boardclip") || "null");
    if(j && Array.isArray(j.items)){ const it = j.items.map(x => cleanStroke(x)).filter(Boolean); if(it.length) clip = { items: it, from: String(j.from || ""), cnt: {}, at: 0 }; }
  } catch(e){}
  const showPaste = () => { $$("dpaste").style.display = clip ? "" : "none"; };
  showPaste();
  const nThings = n => n + (n === 1 ? " thing" : " things");
  function copySel(){
    if(!sel || sel.live) return false;
    const items = sel.items.map(i => copyS(i.s)).sort((a, b) => a.ts - b.ts);
    if(!items.length) return false;
    clip = { items, from: S.id, cnt: {}, at: Date.now() };
    try { sessionStorage.setItem("pb_boardclip", JSON.stringify({ items, from: S.id })); } catch(e){}
    showPaste(); return true;
  }
  function cutSel(){ if(copySel()){ const n = clip.items.length; deleteSel(); say("✂️ Cut " + nThings(n) + ". Press Paste (or Ctrl+V) on any board."); } }
  function pasteClip(){
    if(!clip || !clip.items.length){ say("Nothing copied yet. Lasso something, then press Copy."); return; }
    if(muteCheck()) return;
    const need = clip.items.filter(s => s.t === "i").length, have = S.strokes.filter(s => s.t === "i").length;
    if(have + need > MAXIMG){ say("This board can only hold " + MAXIMG + " pictures and it already has " + have + "."); return; }
    const k = (clip.cnt[S.id] || 0) + (S.id === clip.from ? 1 : 0); clip.cnt[S.id] = (clip.cnt[S.id] || 0) + 1;
    const f = frameOf(clip.items.map(s => ({ s }))), step = k ? 28 * (((k - 1) % 8) + 1) : 0;   // same spot on another board, a little offset when it would land on top of itself
    const f2 = cloneF(f); f2.C = clampC([f.C[0] + step, f.C[1] + step]);
    const M = mapOf(f, f2), base = Date.now(), adds = [];
    clip.items.forEach((s, i) => { const t = xform(s, M); t.id = mkId(); t.o = uid; t.n = usr; t.ts = base + i; const c = cleanStroke(t); if(c) adds.push(c); });
    if(!adds.length){ say("Couldn't paste that."); return; }
    closeEd(true); S.redoS = [];
    applyX(S, [], adds, uid, usr); sendOps([], adds); pushOp(adds.map(a => a.id), []);
    persistSoon(S); updBtns(); setTool("lasso"); selectItems(adds, []);
    say("📥 Pasted " + nThings(adds.length) + ".");
  }
  $$("dselcopy").onclick = () => { if(copySel()) say("📋 Copied " + nThings(clip.items.length) + ". Switch boards, then press Paste (or Ctrl+V)."); };
  $$("dselcut").onclick = () => cutSel();
  $$("dpaste").onclick = () => pasteClip();
  const inField = tg => !!tg && (tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || (tg.tagName === "INPUT" && tg.type !== "range" && tg.type !== "checkbox"));
  document.addEventListener("paste", e => {               // Ctrl+V / Cmd+V (a picture copied from somewhere else is left to the picture-paste code)
    if(!document.body.classList.contains("in-draw") || !clip || inField(e.target)) return;
    if([...((e.clipboardData && e.clipboardData.items) || [])].some(i => i.kind === "file" && i.type.startsWith("image/"))) return;
    e.preventDefault(); pasteClip();
  });
  const stamp = e => {                                    // right after our own Ctrl+C / Ctrl+X, replace whatever was on the computer's clipboard so an old picture there can't be pasted instead
    if(!document.body.classList.contains("in-draw") || !clip || Date.now() - clip.at > 800 || inField(e.target)) return;
    try { e.clipboardData.setData("text/plain", "drawing board selection"); e.preventDefault(); } catch(x){}
  };
  document.addEventListener("copy", stamp); document.addEventListener("cut", stamp);

  /* ---- turning a bucket fill into a movable picture (a fill is pixels, so it can't just be re-played somewhere else) ---- */
  function maskOf(a, b, hex){
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for(let y = 0; y < H; y++) for(let x = 0; x < W; x++){ const i = (y * W + x) * 4; if(a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]){ if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; } }
    if(x1 < 0) return null;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), im = g.createImageData(w, h), d = im.data, r = parseInt(hex.slice(1, 3), 16), gg = parseInt(hex.slice(3, 5), 16), bb = parseInt(hex.slice(5, 7), 16);
    for(let y = 0; y < h; y++) for(let x = 0; x < w; x++){ const i = ((y + y0) * W + x + x0) * 4; if(a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]){ const j = (y * w + x) * 4; d[j] = r; d[j + 1] = gg; d[j + 2] = bb; d[j + 3] = 255; } }
    g.putImageData(im, 0, 0);
    const url = c.toDataURL("image/png"); if(!okPic(url)) return null;
    return { url, x0, y0, w, h };
  }
  function bakeFills(fills){
    const out = new Map(); if(!fills.length) return out;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d", { willReadFrequently: true });
    const want = new Set(fills.map(f => f.id)), keep = cx; cx = g;
    try {
      g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
      for(const s of S.strokes){
        if(want.has(s.id)){ const A = g.getImageData(0, 0, W, H); paint(s, 0); const B = g.getImageData(0, 0, W, H); const m = maskOf(A.data, B.data, s.c); if(m) out.set(s.id, m); }
        else paint(s, 0);
      }
    } catch(e){ console.warn("[draw] fill bake failed", e); } finally { cx = keep; }
    return out;
  }
  function buildBg(){                                     // the board without the selected things (they're drawn on top while being dragged)
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    const ex = new Set(sel.items.map(i => i.ref)), keep = cx; cx = g;
    try { g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); S.strokes.forEach(s => { if(!ex.has(s.id)) paint(s, 0); }); } finally { cx = keep; }
    return c;
  }
  function drawPreview(){
    cx.drawImage(sel.bg, 0, 0);
    const M = mapOf(sel.f0, sel.f);
    sel.items.forEach(it => { const t = xform(it.s, M); t.id = it.s.id; paint(t, 0); });
    drawOv();
  }

  /* ---- selection overlay: dashed box, 8 resize handles, 1 rotate handle ---- */
  function handles(f, u){
    let ry = -f.hh - 34 * u; const cs = Math.cos(f.th);
    if(f.C[1] + ry * cs < 16 * u) ry = f.hh + 34 * u;     // no room above: put the rotate handle on the other side
    const L = [["nw", -f.hw, -f.hh], ["ne", f.hw, -f.hh], ["se", f.hw, f.hh], ["sw", -f.hw, f.hh], ["n", 0, -f.hh], ["e", f.hw, 0], ["s", 0, f.hh], ["w", -f.hw, 0]];
    const out = L.map(a => { const v = rot2(a[1], a[2], f.th); return { id: a[0], x: f.C[0] + v[0], y: f.C[1] + v[1], sx: a[0].includes("e") ? 1 : a[0].includes("w") ? -1 : 0, sy: a[0].includes("s") ? 1 : a[0].includes("n") ? -1 : 0 }; });
    const rv = rot2(0, ry, f.th); out.push({ id: "rot", x: f.C[0] + rv[0], y: f.C[1] + rv[1], sx: 0, sy: 0, ry });
    return out;
  }
  function drawOv(){
    ox.clearRect(0, 0, W, H);
    const u = unit();
    if(lz && lz.kind === "lasso" && lz.path.length > 1){
      ox.save(); ox.lineJoin = "round"; ox.beginPath(); lz.path.forEach((q, i) => i ? ox.lineTo(q[0], q[1]) : ox.moveTo(q[0], q[1])); ox.closePath();
      ox.fillStyle = "rgba(47,123,246,.12)"; ox.fill(); ox.lineWidth = 3 * u; ox.strokeStyle = "rgba(255,255,255,.95)"; ox.stroke();
      ox.lineWidth = 1.5 * u; ox.strokeStyle = "#2f7bf6"; ox.setLineDash([6 * u, 5 * u]); ox.stroke(); ox.restore();
    }
    if(!sel) return;
    const f = sel.f, hs = handles(f, u), P = (x, y) => { const v = rot2(x, y, f.th); return [f.C[0] + v[0], f.C[1] + v[1]]; };
    ox.save();
    const k = [P(-f.hw, -f.hh), P(f.hw, -f.hh), P(f.hw, f.hh), P(-f.hw, f.hh)];
    ox.beginPath(); k.forEach((q, i) => i ? ox.lineTo(q[0], q[1]) : ox.moveTo(q[0], q[1])); ox.closePath();
    ox.lineWidth = 3 * u; ox.strokeStyle = "rgba(255,255,255,.9)"; ox.stroke();
    ox.lineWidth = 1.5 * u; ox.strokeStyle = "#2f7bf6"; ox.setLineDash([6 * u, 4 * u]); ox.stroke(); ox.setLineDash([]);
    const rot = hs[hs.length - 1], top = P(0, rot.ry > 0 ? f.hh : -f.hh);
    ox.beginPath(); ox.moveTo(top[0], top[1]); ox.lineTo(rot.x, rot.y); ox.lineWidth = 1.5 * u; ox.strokeStyle = "#2f7bf6"; ox.stroke();
    hs.forEach(h => {
      ox.beginPath();
      if(h.id === "rot") ox.arc(h.x, h.y, 7 * u, 0, 6.2832); else ox.rect(h.x - 5 * u, h.y - 5 * u, 10 * u, 10 * u);
      ox.fillStyle = h.id === "rot" ? "#2f7bf6" : "#fff"; ox.fill(); ox.lineWidth = 1.5 * u; ox.strokeStyle = "#2f7bf6"; ox.stroke();
    });
    ox.restore();
  }
  function hitHandle(x, y){
    if(!sel) return "";
    const u = unit(), f = sel.f, hs = handles(f, u), rot = hs[hs.length - 1];
    if(Math.hypot(x - rot.x, y - rot.y) <= 14 * u) return "rot";
    for(const h of hs) if(h.sx && h.sy && Math.hypot(x - h.x, y - h.y) <= 11 * u) return h.id;
    for(const h of hs) if(h.id !== "rot" && !(h.sx && h.sy) && Math.hypot(x - h.x, y - h.y) <= 11 * u) return h.id;
    const q = rot2(x - f.C[0], y - f.C[1], -f.th);
    return Math.abs(q[0]) <= f.hw + 8 * u && Math.abs(q[1]) <= f.hh + 8 * u ? "move" : "";
  }
  const hoverCursor = e => { if(lz) return; const p = ptf(e), h = sel ? hitHandle(p[0], p[1]) : ""; cv.style.cursor = h ? CURS[h] : "crosshair"; };

  /* ---- selecting ---- */
  function clearSel(){
    const was = sel; sel = null; if(lz && lz.kind === "drag") lz = null;
    showDel(false);
    if(was && was.live) redraw();
    drawOv(); cv.style.cursor = tool === "fill" ? "cell" : tool === "text" ? "text" : "crosshair";
  }
  function selectItems(list, fills){
    const items = list.map(s => ({ ref: s.id, s, orig: s, fill: false }));
    const bake = fills && fills.length ? bakeFills(fills) : new Map();
    (fills || []).forEach(F => {
      const m = bake.get(F.id); if(!m) return;
      const bs = { id: "b" + F.id.slice(1), t: "i", im: m.url, p: [m.x0 + m.w / 2, m.y0 + m.h / 2], iw: m.w, ih: m.h, r: 0, c: "#000000", w: 1, ts: F.ts, o: uid, n: usr };
      items.push({ ref: F.id, s: bs, orig: F, fill: true });
    });
    if(!items.length){ clearSel(); return; }
    sel = { items, f: frameOf(items), f0: null, live: false, bg: null }; sel.f0 = cloneF(sel.f);
    showDel(true); drawOv();
  }
  function selSync(){                                     // things someone else erased / moved drop out of the selection
    if(!sel || sel.live) return;
    const keep = sel.items.filter(i => S.byId.has(i.ref));
    if(keep.length === sel.items.length){ drawOv(); return; }
    if(!keep.length){ clearSel(); return; }
    sel.items = keep; sel.f = frameOf(keep); sel.f0 = cloneF(sel.f); drawOv();
  }
  function topAt(x, y){ const tol = 6 * unit(); for(let i = S.strokes.length - 1; i >= 0; i--){ const s = S.strokes[i]; if(s.t !== "f" && hitStroke(s, x, y, tol)) return s; } return null; }

  function lassoDown(e, x, y){
    try { cv.setPointerCapture(e.pointerId); } catch(_){}
    if(sel){ const h = hitHandle(x, y); if(h){ lz = { kind: "drag", mode: h, start: [x, y], last: [x, y], moved: false }; sel.f0 = cloneF(sel.f); return; } }
    lz = { kind: "lasso", path: [[x, y]] }; drawOv();
  }
  function nextFrame(l, x, y, shift){
    const f0 = sel.f0;
    if(l.mode === "move") return { C: clampC([f0.C[0] + x - l.start[0], f0.C[1] + y - l.start[1]]), th: f0.th, hw: f0.hw, hh: f0.hh };
    if(l.mode === "rot"){
      let a = Math.atan2(y - f0.C[1], x - f0.C[0]) + Math.PI / 2; if(l.flip) a += Math.PI;
      if(shift) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12); else { const q = Math.PI / 2, n = Math.round(a / q) * q; if(Math.abs(a - n) < 0.05) a = n; }   // gentle snap to upright / sideways
      return { C: f0.C.slice(), th: normA(a), hw: f0.hw, hh: f0.hh };
    }
    const hd = l.hd, q = rot2(x - f0.C[0], y - f0.C[1], -f0.th);                                  // pointer in the frame's own axes
    let nw = 2 * f0.hw, nh = 2 * f0.hh;
    if(hd.sx) nw = Math.max(8, (q[0] + hd.sx * f0.hw) * hd.sx);
    if(hd.sy) nh = Math.max(8, (q[1] + hd.sy * f0.hh) * hd.sy);
    if(hd.sx && hd.sy && !shift){                                                                  // corners keep the shape (hold Shift to stretch)
      let s = Math.max(nw / (2 * f0.hw), nh / (2 * f0.hh));
      s = Math.min(Math.max(s, 8 / (2 * f0.hw), 8 / (2 * f0.hh)), 3000 / (2 * f0.hw), 3000 / (2 * f0.hh));
      nw = 2 * f0.hw * s; nh = 2 * f0.hh * s;
    } else { nw = Math.min(3000, Math.max(8, nw)); nh = Math.min(3000, Math.max(8, nh)); }
    const cxl = hd.sx ? -hd.sx * f0.hw + hd.sx * nw / 2 : 0, cyl = hd.sy ? -hd.sy * f0.hh + hd.sy * nh / 2 : 0, v = rot2(cxl, cyl, f0.th);
    return { C: clampC([f0.C[0] + v[0], f0.C[1] + v[1]]), th: f0.th, hw: nw / 2, hh: nh / 2 };
  }
  function lassoMove(e){
    const p = ptf(e), l = lz;
    if(l.kind === "lasso"){ const q = l.path[l.path.length - 1]; if(Math.hypot(p[0] - q[0], p[1] - q[1]) >= 3 * unit() && l.path.length < 2000) l.path.push(p); drawOv(); return; }
    l.last = p;
    if(!l.moved){
      if(Math.hypot(p[0] - l.start[0], p[1] - l.start[1]) < 4 * unit()) return;
      l.moved = true; sel.bg = buildBg(); sel.live = true;
      if(l.mode !== "move" && l.mode !== "rot") l.hd = handles(sel.f0, unit()).find(h => h.id === l.mode);
      if(l.mode === "rot"){ const rh = handles(sel.f0, unit()).pop(); l.flip = rh.ry > 0; }
    }
    sel.f = nextFrame(l, p[0], p[1], e.shiftKey);
    if(!l.raf) l.raf = requestAnimationFrame(() => { l.raf = 0; if(lz === l && sel && sel.live) drawPreview(); });
  }
  function lzCancel(){
    if(lz && lz.raf) cancelAnimationFrame(lz.raf);
    if(sel && sel.live){ sel.live = false; sel.f = cloneF(sel.f0); sel.bg = null; redraw(); }
    lz = null; drawOv();
  }
  function lassoUp(){
    const l = lz; lz = null; if(!l) return;
    if(l.raf) cancelAnimationFrame(l.raf);
    if(l.kind === "drag"){
      if(l.moved) commitDrag();
      else {
        sel.live = false; sel.bg = null;
        if(l.mode === "move"){ const h = topAt(l.last[0], l.last[1]); if(h && !sel.items.some(i => i.ref === h.id)) selectItems([h], []); else if(!h) clearSel(); }
      }
      drawOv(); return;
    }
    const path = l.path, u = unit(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    path.forEach(q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
    if(x1 - x0 < 6 * u && y1 - y0 < 6 * u){ const h = topAt(path[0][0], path[0][1]); if(h) selectItems([h], []); else clearSel(); return; }
    if(path.length < 3){ clearSel(); return; }
    let picks = [], fills = [];
    S.strokes.forEach(s => { if(s.t === "f"){ if(inPoly(s.p[0], s.p[1], path)) fills.push(s); } else if(sampleIn(s, path)) picks.push(s); });
    if(!picks.length){ clearSel(); drawOv(); return; }                // a fill on its own is left alone
    if(picks.length + fills.length > 300){ say("That's a lot. Selecting the first 300 things."); picks = picks.slice(0, 300); fills = fills.slice(0, Math.max(0, 300 - picks.length)); }
    selectItems(picks, fills);
  }

  /* ---- applying a move / resize / rotate ---- */
  function applyX(st, dels, adds, owner, nm){             // replace things on a board: remove some, add others (used by me and by everybody's messages)
    let ch = false;
    (dels || []).forEach(id => { if(!okId(id)) return; st.gone.add(id); if(st.byId.has(id)) ch = true; });
    if(ch){ st.strokes = st.strokes.filter(s => !st.gone.has(s.id)); reindex(st); }
    (adds || []).forEach(raw => {
      const s = cleanStroke(raw); if(!s || s.ts <= st.clr || st.gone.has(s.id) || st.byId.has(s.id)) return;
      if(owner){ s.o = owner; s.n = nm; }
      addStroke(st, s); ch = true;
    });
    if(ch){ cap(st); if(st === S) redraw(); persistSoon(st); }
    return ch;
  }
  function sendOps(dels, adds){                           // split into messages that are never too big
    const dc = [], ac = []; let part = [], size = 0;
    for(let i = 0; i < dels.length; i += 80) dc.push(dels.slice(i, i + 80));
    adds.forEach(a => { const n = (a.im ? a.im.length : 0) + a.p.length * 7 + 200; if(part.length && (size + n > 380000 || part.length >= 40)){ ac.push(part); part = []; size = 0; } part.push(a); size += n; });
    if(part.length) ac.push(part);
    for(let i = 0; i < Math.max(dc.length, ac.length, 1); i++) sendD({ k: "x", del: dc[i] || [], add: ac[i] || [] });
  }
  const markId = () => "x" + mkId().slice(1);
  const pushOp = (newIds, olds) => { const m = markId(); S.opHist.set(m, { newIds, olds }); S.mine.push(m); };
  function commitDrag(){
    const f0 = sel.f0, f1 = sel.f, M = mapOf(f0, f1), base = Date.now();
    const items = sel.items.slice().sort((a, b) => a.s.ts - b.s.ts), adds = [], dels = [], olds = [], nit = [];
    items.forEach((it, k) => {
      const t = xform(it.s, M); t.id = mkId(); t.o = uid; t.n = usr; t.ts = base + k;
      const c = cleanStroke(t); if(!c) return;
      if(c.t === "i"){ const e = imgs.get(it.s.id); if(e) imgs.set(c.id, e); }
      adds.push(c); dels.push(it.ref); olds.push(copyS(it.orig)); nit.push({ ref: c.id, s: c, orig: c, fill: false });
    });
    sel.live = false; sel.bg = null;
    if(!adds.length){ redraw(); return; }
    sel.items = nit; sel.f0 = cloneF(f1);
    if(nit.length === 1 && nit[0].s.t === "tx"){ sel.f = frameOf(nit); sel.f0 = cloneF(sel.f); }      // snap the box to the text after a resize
    applyX(S, dels, adds, uid, usr); sendOps(dels, adds); pushOp(adds.map(a => a.id), olds);
    S.redoS = []; persistSoon(S); updBtns(); drawOv();
  }
  function deleteSel(){
    if(!sel || muteCheck()) return;
    const dels = sel.items.map(i => i.ref), olds = sel.items.map(i => copyS(i.orig));
    clearSel();
    applyX(S, dels, [], uid, usr); sendOps(dels, []); pushOp([], olds); S.redoS = []; persistSoon(S); updBtns();
  }
  function remapId(a, b){ S.mine = S.mine.map(x => x === a ? b : x); S.opHist.forEach(h => { h.newIds = h.newIds.map(x => x === a ? b : x); }); }
  function undoOp(h){
    const live = h.newIds.filter(x => S.byId.has(x));
    if(h.newIds.length && !live.length) return false;     // somebody else already changed those: nothing to undo
    const back = h.olds.map(o => Object.assign(copyS(o), { id: mkId(), o: uid, n: usr }));
    back.forEach((r, k) => remapId(h.olds[k].id, r.id));
    S.redoS.push({ __op: 1, del: back.map(r => r.id), add: live.map(id => copyS(S.byId.get(id))) });
    applyX(S, h.newIds, back, uid, usr); sendOps(h.newIds, back);
    return true;
  }
  function redoOp(o){
    const olds = o.del.map(id => S.byId.get(id)).filter(Boolean).map(copyS);
    if(o.del.length && !olds.length) return;
    const adds = o.add.map((s, k) => Object.assign(copyS(s), { id: mkId(), ts: Date.now() + k, o: uid, n: usr }));
    applyX(S, o.del, adds, uid, usr); sendOps(o.del, adds); pushOp(adds.map(a => a.id), olds);
  }

  /* ---------- fit the canvas to the pane (16:9) ---------- */
  function fit(){
    const wrap = $$("dwrap"), aw = wrap.clientWidth - 24, ah = wrap.clientHeight - 24;
    if(aw <= 0 || ah <= 0) return;
    const w = Math.max(120, Math.min(aw, ah * W / H));
    stage.style.width = w + "px"; stage.style.height = (w * H / W) + "px";
    if(sel || lz) drawOv();
    if(ed) sizeEd();
  }
  new ResizeObserver(fit).observe($$("dwrap")); fit();

  /* ---------- hook into the tab switcher ---------- */
  const _sc = setChannel;
  setChannel = function(c){
    if(c !== "draw") closeEd(true);
    _sc(c);
    document.body.classList.toggle("in-draw", c === "draw");
    $$("ch-draw").classList.toggle("active", c === "draw");
    if(c === "draw"){ setTimeout(fit, 0); try{ chrome(); }catch(e){} if(invNote){ invNote = 0; paintNote(); } }
    else invp.style.display = "none";
  };

  window.__pbBoardClear = () => { const t = Date.now(); applyClr(P, t); sendD({ k: "clr", ts: t }, ""); };   // owner panel: clears the PUBLIC board only
  buildSelect(); chrome(); updPrev(); updBtns();
  states.forEach(st => loadBoard(st));
})();

;
/* ===== 12-draw-menu-js.js ===== */
(function(){
  const $=id=>document.getElementById(id), tb=$("dtoolbtn"); if(!tb||!$("dtools")) return;
  const pairs=[["dtoolbtn","dmtools"],["dcolbtn","dmcol"],["dmorebtn","dmmore"]];
  function closeAll(except){ pairs.forEach(([b,m])=>{ if(m===except) return; $(m).classList.remove("open"); $(b).classList.remove("open"); $(b).setAttribute("aria-expanded","false"); }); }
  pairs.forEach(([b,m])=>{ $(b).addEventListener("click",e=>{ e.stopPropagation(); const o=!$(m).classList.contains("open"); closeAll(m); $(m).classList.toggle("open",o); $(b).classList.toggle("open",o); $(b).setAttribute("aria-expanded",o?"true":"false"); }); });
  // choosing a tool closes the menu (Shapes and Text stay open so you can set their options)
  $("dmtools").addEventListener("click",e=>{ const bt=e.target.closest(".dbtn"); if(bt&&bt.id!=="dshape"&&bt.id!=="dtext") closeAll(); });
  $("dmmore").addEventListener("click",e=>{ if(e.target.closest(".dbtn")) setTimeout(()=>closeAll(),0); });
  document.addEventListener("pointerdown",e=>{ if(!e.target.closest(".dmenu")&&!e.target.closest(".dmw")) closeAll(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeAll(); });
  // the tools button shows which tool is active
  const ids=["dpen","dfill","dshape","dtext","dpick","der","dlasso"];
  function label(){ const on=ids.map($).find(b=>b&&b.classList.contains("on")); if(on) tb.textContent=on.textContent.trim()+" ▾"; }
  const mo=new MutationObserver(label); ids.forEach(i=>{ const b=$(i); if(b) mo.observe(b,{attributes:true,attributeFilter:["class"]}); });
  label();
})();

;
/* ===== 13-lag-fix.js ===== */
(function(){
  /* serial queue: heavy syncs run one at a time */
  const q = []; let busy = false;
  window.heavy = function(fn){
    q.push(fn);
    if(busy) return; busy = true;
    (function run(){
      const f = q.shift();
      if(!f){ busy = false; return; }
      try { f(); } catch(e){}
      setTimeout(run, 50);
    })();
  };

  /* history + bubble styles go through the queue */
  const _as = answerSummary;
  answerSummary = function(d, from){ heavy(() => { if(from.open) _as(d, from); }); };

  /* roster: debounced, avatars only when changed */
  let rosterT = 0;
  pushRoster = function(){
    if(!isHost || rosterT) return;
    rosterT = setTimeout(() => {
      rosterT = 0;
      const list = [me(), ...conns.filter(c => c.userName).map(c => ({ n: c.userName, a: c.avatar || "", d: c.device || "", c: c.uid || "" }))].filter((e, i, a) => a.findIndex(x => x.n === e.n && x.c === e.c) === i);
      renderOnline(list);
      conns.forEach(c => {
        if(!c.open) return;
        c.avSent = c.avSent || {};
        const slim = list.map(e => {
          const k = (e.c || "") + "|" + e.n;
          if(c.avSent[k] === e.a) return { n: e.n, d: e.d, c: e.c };
          c.avSent[k] = e.a; return e;
        });
        c.send({ t: "R", i: newId(), list: slim });
      });
    }, 250);
  };

  /* only repaint avatars that actually changed */
  refreshAvatars = function(){
    document.querySelectorAll(".msg[data-user]").forEach(w => {
      const a = w.querySelector(".av"); if(!a) return;
      const k = String((avatars[w.dataset.user] || "").length);
      if(a.dataset.k === k) return;
      a.dataset.k = k; paintAv(a, w.dataset.user);
    });
    paintPfp();
  };
})();

;
/* ===== 14-stability.js ===== */
(function(){
  /* ---- cap at 11 people (host + 10) ---- */
  const _ac = addConn;
  addConn = function(c){
    if(isHost && conns.filter(x => x.open).length >= 10){
      c.on("open", () => { try { c.send({ t: "X", i: newId(), why: "full" }); } catch(e){} setTimeout(() => { try { c.close(); } catch(e){} }, 400); });
      return;
    }
    _ac(c);
  };

  /* ---- reconnect to the signalling server if it drops (keeps the room joinable) ---- */
  let hooked = null;
  setInterval(() => {
    if(!peer || peer === hooked) return; hooked = peer;
    peer.on("disconnected", () => { setTimeout(() => { try { if(peer && peer.disconnected && !peer.destroyed) peer.reconnect(); } catch(e){} }, 1000); });
  }, 500);
  setInterval(() => { try { if(peer && peer.disconnected && !peer.destroyed) peer.reconnect(); } catch(e){} }, 8000);

  /* ---- auto-rejoin instead of kicking people to the join screen ----
     If the host vanishes, whoever gets back first becomes the new host and the rest reconnect to them. */
  const _leave = window.__leave; let tries = 0, joined = false;
  const _setStatus = setStatus;
  setInterval(() => { if(window.__hubUp && window.__hubUp() && (isHost || conns.some(c => c.open))){ joined = true; tries = 0; } }, 1000);
  /* quiet handover: no "friend left/joined" noise, no scary status, and a fixed order decides who takes over
     (lowest id first) so the new host is up in about a second instead of everyone racing at random */
  const _sys = sys;
  sys = function(t){
    if(window.__hoQuiet && Date.now() < window.__hoQuiet && /^(A friend (left|joined)\.|Connected to the room\.|You opened the room)/.test(String(t))) return;
    return _sys.apply(this, arguments);
  };
  const rankDelay = () => {
    const ids = ((window.__rosterSnap && window.__rosterSnap.length ? window.__rosterSnap : lastRoster) || []).map(e => e.c).filter(Boolean).sort();
    return 300 + Math.max(0, ids.indexOf(uid)) * 450 + Math.random() * 300;
  };
  window.__hoRestart = function(){
    if(window.__hoPending) return; window.__hoPending = true;
    setTimeout(() => {
      window.__hoPending = false;
      if(isHost || conns.some(c => c.open)) return;
      try { peer && peer.destroy(); } catch(e){}
      peer = null; conns = []; isHost = false;
      try { connect(); } catch(e){}
    }, 1000 + rankDelay());
  };
  window.__leave = function(msg){
    if(joined && tries < 15 && /^Disconnected from the room|^You went offline/.test(msg || "")){
      tries++; _setStatus("Online — reconnecting…");
      window.__hoQuiet = Date.now() + 25000; window.__pbResync = true;
      try { peer && peer.destroy(); } catch(e){}
      peer = null; conns = []; isHost = false;
      setTimeout(() => { try { connect(); } catch(e){} }, rankDelay() + Math.min(tries, 6) * 300);
      return;
    }
    _leave(msg);
  };
  window.addEventListener("online", () => { if(joined && !peer){ tries = 0; try { connect(); } catch(e){} } });

  /* ---- clients re-check history every 2 minutes so nothing stays out of sync ---- */
  setInterval(() => {
    if(isHost || !conns.some(c => c.open) || document.hidden) return;
    send({ t: "S", i: newId(), s: logs.filter(l => !l.to && !l.g).slice(-300).map(l => [l.i, l.v || 0, rxv(l)]) });
  }, 120000);

  /* ---- keep the host's screen/tab awake so the room doesn't stall ---- */
  let wl = null;
  async function keepAwake(){ try { if(isHost && !wl && navigator.wakeLock){ wl = await navigator.wakeLock.request("screen"); wl.addEventListener("release", () => { wl = null; }); } } catch(e){} }
  setInterval(keepAwake, 5000);
  document.addEventListener("visibilitychange", () => { if(!document.hidden) keepAwake(); });
})();

;
/* ===== 15-hub.js ===== */
/* Chat transport: a WebSocket relay (the Cloudflare Worker in /src) replaces PeerJS data connections.
   Nobody has to be reachable on their own wifi any more. The first browser to connect is the host
   (the host logic above keeps running there); if it leaves, everyone auto-reconnects and the first
   one back becomes the new host. PeerJS is now used only for voice / video calls.

   Dead-host protection (v16):
   The relay only knows a host is gone once that host's socket closes. A host whose device slept, lost
   signal or froze keeps its seat for a long time ("ghost host"), so everybody else connects to someone
   who never answers and the room looks down. To get around that:
     - a client that connects but hears nothing from the host within GHOST_MS gives up on that room and
       moves on to the next standby room (room-r2, room-r3, ...);
     - a connected client pings the host when it has been quiet; no answer = host is dead -> reconnect;
     - before anyone takes the host seat in a room they first look for a live room further along, so the
       group always converges on one room even after the ghost finally disappears. */
(function(){
  const FALLBACK = "wss://purebred-chat.226739.workers.dev/ws";   // used when this page isn't served by the worker itself
  const here = /^https?:$/.test(location.protocol) && (/\.workers\.dev$/.test(location.hostname) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
  const BASE = here ? (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws" : FALLBACK;
  const SLOTS = 6;                                  // room 0 is the normal room; 1..5 are standbys
  const slotRoom = k => k ? ROOM_ID + "-r" + (k + 1) : ROOM_ID;
  const hubUrl = k => BASE + "?room=" + encodeURIComponent(slotRoom(k));
  const MAX_FRAME = 900000;      // biggest single WebSocket frame
  const MAX_MSG = 8000000;       // biggest whole message (big GIFs are split into frames and put back together)
  const CHUNK = 600000, rx = new WeakMap();
  const GHOST_MS = 4000;       // connected, but the host never said a word
  const HELLO_MS = 6000;       // relay accepted nothing at all
  const PROBE_MS = 1500;       // looking for a live room next door
  const DEAD_MS = 180000;      // remember "this room's host is a ghost" for a while
  const QUIET_MS = 40000;      // client: ping the host after this much silence
  const PONG_MS = 20000;       // client: host must answer a ping within this long
  let ws = null, hostMode = false, clientConn = null, hostConns = new Map(), pingT = 0;
  let slot = 0, tries = 0, helloSeen = false, ghostT = 0, openT = 0, wdT = 0, lastRx = 0, pingAt = 0;
  let tentative = false, early = [], pendingC = null;
  const dead = {};                                  // slot -> timestamp until which we skip it
  const isDead = k => (dead[k] || 0) > Date.now();
  const nextSlot = from => { for(let k = from; k < SLOTS; k++) if(!isDead(k)) return k; return -1; };
  window.__hubUp = () => !!ws && ws.readyState === 1;
  window.__hubBuf = () => { try { return ws && ws.bufferedAmount || 0; } catch(e){ return 0; } };
  window.__hubSlot = () => slot;
  window.__hubClose = () => { peerTok++; closeHubQuiet(); };   // used by the offline (view-only) mode to drop a connection attempt

  function makeConn(sendRaw, closeRaw){
    const h = {};
    const c = {
      open: false,
      on(ev, fn){ (h[ev] = h[ev] || []).push(fn); return c; },
      emit(ev, a){ (h[ev] || []).slice().forEach(fn => { try { fn(a); } catch(e){ console.error(e); } }); },
      send(d){
        if(!c.open) return;
        let s; try { s = JSON.stringify(d); } catch(e){ return; }
        if(s.length > MAX_MSG){ try { sys("A message was too big to send."); } catch(e){} return; }
        if(s.length > MAX_FRAME){
          const id = Math.random().toString(36).slice(2, 10), n = Math.ceil(s.length / CHUNK);
          for(let k = 0; k < n; k++){ try { sendRaw(JSON.stringify({ t: "CK", i: id, n, k, p: s.slice(k * CHUNK, (k + 1) * CHUNK) })); } catch(e){} }
          return;
        }
        try { sendRaw(s); } catch(e){}
      },
      close(){ if(!c.open) return; c.open = false; try { closeRaw(); } catch(e){} c.emit("close"); }
    };
    return c;
  }

  function closeHubQuiet(){
    clearInterval(pingT); clearInterval(wdT); clearTimeout(ghostT); clearTimeout(openT);
    const w = ws; ws = null; hostMode = false; clientConn = null; hostConns = new Map();
    tentative = false; early = []; pendingC = null;
    if(w){ w.onopen = w.onmessage = w.onclose = w.onerror = null; try { w.close(); } catch(e){} }
  }

  function parse(s){ try { return JSON.parse(s); } catch(e){ return null; } }
  function unchunk(c, d){                          // put a split message back together (returns the whole message, or null while parts are missing)
    if(!c || !d || d.t !== "CK" || typeof d.p !== "string" || typeof d.i !== "string" || !(d.n > 0) || !(d.k >= 0) || d.k >= d.n || d.n > 80) return null;
    let m = rx.get(c); if(!m){ m = {}; rx.set(c, m); }
    let e = m[d.i]; if(!e){ if(Object.keys(m).length > 6) m = {}; rx.set(c, m); e = m[d.i] = { n: d.n, got: 0, a: [] }; }
    if(e.a[d.k] === undefined){ e.a[d.k] = d.p; e.got++; }
    if(e.got < e.n) return null;
    delete m[d.i]; return parse(e.a.join(""));
  }

  /* ---- look at another room without joining it: "live" (a host answered), "free" (nobody there),
          "ghost" (a host is seated but silent) or "fail" ---- */
  function probe(j){
    return new Promise(res => {
      let s, done = false, hello = null, t = 0;
      const fin = r => {
        if(done) return; done = true; clearTimeout(t);
        if(r === "ghost") dead[j] = Date.now() + DEAD_MS;
        try { s.onopen = s.onmessage = s.onclose = s.onerror = null; s.close(); } catch(e){}
        res(r);
      };
      try { s = new WebSocket(hubUrl(j)); } catch(e){ res("fail"); return; }
      t = setTimeout(() => fin(hello === false ? "ghost" : "fail"), PROBE_MS);
      s.onmessage = ev => {
        const f = typeof ev.data === "string" ? ev.data : ""; if(!f) return;
        if(f[0] === "c"){ const m = parse(f.slice(1)); if(m && m.k === "hello"){ hello = !!m.host; if(m.host) fin("free"); } }
        else if(f[0] === "d" && hello === false) fin("live");
      };
      s.onclose = s.onerror = () => fin("fail");
    });
  }
  function scanHigher(k){
    const cand = []; for(let j = k + 1; j < SLOTS; j++) if(!isDead(j)) cand.push(j);
    if(!cand.length) return Promise.resolve(-1);
    return new Promise(res => {                  // lowest live room wins, but we don't wait for rooms that can no longer change the answer
      const rs = new Array(cand.length); let fin = false;
      const check = () => {
        if(fin) return;
        for(let i = 0; i < cand.length; i++){
          if(rs[i] === undefined) return;       // still waiting on a lower room
          if(rs[i] === "live"){ fin = true; res(cand[i]); return; }
        }
        fin = true; res(-1);
      };
      cand.forEach((j, i) => probe(j).then(r => { rs[i] = r; check(); }));
    });
  }

  function commitHost(sock){
    isHost = true; ready(); if(window.revealChat) window.revealChat();
    setStatus("");
    sys("You opened the room. Friends can join with the code.");
    const q = early; early = [];
    q.forEach(f => onFrame(sock, f));            // anyone who knocked while we were checking next door
  }

  function ghost(){                              // joined a room whose host never answered
    const k = slot; dead[k] = Date.now() + DEAD_MS;
    console.info("[hub] room " + k + " host is silent - moving on");
    closeHubQuiet();
    const nk = ++tries >= SLOTS ? -1 : nextSlot(k + 1);
    if(nk < 0){
      Object.keys(dead).forEach(x => delete dead[x]);
      if(window.__leave) window.__leave(window.__entering ? "The room isn't responding right now. Try again in a minute." : "Disconnected from the room. Rejoin to continue.");
      return;
    }
    setStatus("Room not responding — switching…");
    openSlot(nk);
  }

  function hostSilent(){                         // we were connected, then the host stopped answering
    const cc = clientConn; dead[slot] = Date.now() + DEAD_MS;
    console.info("[hub] host stopped answering - reconnecting");
    clearInterval(wdT);
    if(cc && cc.open){ cc.open = false; cc.emit("close"); }      // the page's own close handler starts the reconnect
    else closeHubQuiet();
  }
  function startWatchdog(){
    clearInterval(wdT); lastRx = Date.now(); pingAt = 0;
    wdT = setInterval(() => {
      const cc = clientConn;
      if(!ws || hostMode || !cc || !cc.open) return;
      const now = Date.now();
      if(pingAt && lastRx >= pingAt) pingAt = 0;                 // it answered
      if(pingAt){ if(now - pingAt > PONG_MS) hostSilent(); return; }
      if(now - lastRx > QUIET_MS){ pingAt = now; try { ws.send(JSON.stringify({ t: "PG", i: "pg" })); } catch(e){} }
    }, 10000);
  }
  function wake(){                                // tab / phone woke up: check right away instead of waiting
    if(hostMode || !ws || !clientConn || !clientConn.open || pingAt) return;
    pingAt = Date.now(); try { ws.send(JSON.stringify({ t: "PG", i: "pg" })); } catch(e){}
  }
  document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") wake(); });
  window.addEventListener("online", wake); window.addEventListener("pageshow", wake);

  function onFrame(sock, f){
    if(sock !== ws || !f) return;
    const tag = f[0], rest = f.slice(1);
    if(tag === "c"){
      const m = parse(rest); if(!m || m.k !== "hello" || helloSeen) return;
      helloSeen = true; clearTimeout(openT);
      if(m.host){
        // we'd be the host - but first make sure a live room isn't already running further along
        hostMode = true; tentative = true; early = [];
        scanHigher(slot).then(found => {
          if(sock !== ws || !tentative) return;
          if(found >= 0){ console.info("[hub] found a live room at " + found); closeHubQuiet(); openSlot(found); return; }
          tentative = false; commitHost(sock);
        });
      } else {
        hostMode = false;
        const c = makeConn(s => sock.send(s), () => closeHubQuiet());
        pendingC = c; addConn(c);                // handlers only - it opens when the host first speaks
        clearTimeout(ghostT); ghostT = setTimeout(() => { if(sock === ws && pendingC === c && !c.open) ghost(); }, GHOST_MS);
      }
      return;
    }
    if(tentative){ early.push(f); return; }
    if(tag === "o" && hostMode){
      const cid = rest; if(hostConns.has(cid)) return;
      const c = makeConn(s => sock.send("d" + cid + "\n" + s), () => { hostConns.delete(cid); sock.send("k" + cid); });
      hostConns.set(cid, c); addConn(c); c.open = true; c.emit("open");
    } else if(tag === "x" && hostMode){
      const c = hostConns.get(rest); if(c){ hostConns.delete(rest); c.open = false; c.emit("close"); }
    } else if(tag === "d"){
      if(hostMode){
        const nl = rest.indexOf("\n"); if(nl < 0) return;
        const c = hostConns.get(rest.slice(0, nl)), d = parse(rest.slice(nl + 1));
        if(d && d.t === "PG"){ if(c && c.open) c.send({ t: "PO", i: "po" }); return; }    // "are you alive?" - answered right here
        if(d && d.t === "CK"){ if(!(c && c.open)) return; d = unchunk(c, d); }
        if(c && c.open && d) c.emit("data", d);
      } else {
        lastRx = Date.now();
        const d = parse(rest); if(!d) return;
        if(pendingC && !pendingC.open){              // first word from the host: now we're really connected
          clearTimeout(ghostT); tries = 0;
          clientConn = pendingC; pendingC = null; clientConn.open = true;
          startWatchdog(); clientConn.emit("open");
        }
        if(d.t === "PO") return;
        let dd = d; if(d.t === "CK") dd = unchunk(clientConn || pendingC, d);
        if(dd && clientConn && clientConn.open) clientConn.emit("data", dd);
      }
    }
  }

  function onClosed(sock){
    if(sock !== ws) return;
    const wasHost = hostMode && !tentative, hc = [...hostConns.values()], cc = clientConn, hello = helloSeen;
    closeHubQuiet();
    if(wasHost) hc.forEach(c => { if(c.open){ c.open = false; c.emit("close"); } });
    if(cc && cc.open){ cc.open = false; cc.emit("close"); return; }   // the page's own close handler starts the reconnect
    if(window.__leave) window.__leave(window.__entering
      ? (hello ? "Couldn't connect to the room. Try again." : "Can't reach the chat server — it may be down. Try again in a minute.")
      : "Disconnected from the room. Rejoin to continue.");
  }

  function openSlot(k){
    slot = k; helloSeen = false; lastRx = 0; pingAt = 0; tentative = false; early = []; pendingC = null;
    clearInterval(pingT); clearInterval(wdT); clearTimeout(ghostT); clearTimeout(openT);
    let sock;
    try { sock = new WebSocket(hubUrl(k)); } catch(e){ ws = {}; onClosed(ws); return; }
    ws = sock;
    sock.onopen = () => { pingT = setInterval(() => { try { if(sock.readyState === 1) sock.send("ping"); } catch(e){} }, 25000); };
    sock.onmessage = ev => { if(typeof ev.data === "string") onFrame(sock, ev.data); };
    sock.onclose = () => onClosed(sock);
    sock.onerror = () => {};
    openT = setTimeout(() => { if(sock === ws && !helloSeen){ try { sock.close(); } catch(e){} } }, HELLO_MS);   // relay never greeted us
  }

  connect = function(){
    setStatus("Connecting..."); renderOnline([me()]);
    closeHubQuiet(); tries = 0;
    if(window.__entering){                        // walking through a couple of dead rooms can take a while
      clearTimeout(window.__enterT);
      window.__enterT = setTimeout(() => { if(window.__entering && window.__leave) window.__leave("Couldn't connect to the room. Try again."); }, 60000);
    }
    const k = nextSlot(0);
    openSlot(k < 0 ? 0 : k);                      // the chat socket goes first so joining isn't held up by anything else
    const tok = ++peerTok;
    let pt = 0;
    const mkPeer = () => {                        // PeerJS only carries voice / video calls now; it loads after the page, so wait for it if needed
      if(tok !== peerTok) return;
      if(typeof Peer === "undefined" && pt++ < 40){ setTimeout(mkPeer, 250); return; }
      let mp;
      try { mp = new Peer(undefined, PEER_OPTS); mp.on("error", e => console.warn("call peer:", e && e.type)); }
      catch(e){ mp = { id: "", open: false, connections: {}, on(){}, call(){ throw new Error("calls unavailable"); } }; }
      const d0 = mp.destroy ? mp.destroy.bind(mp) : () => {};
      mp.destroy = function(){ closeHubQuiet(); return d0(); };
      peer = mp;
    };
    setTimeout(mkPeer, 0);
  };
  let peerTok = 0;
})();

;
/* ===== 16-main.js ===== */
/* =============== @mentions: autocomplete, highlight, and a ping when you're mentioned =============== */
(function(){
  const inp=$("inp"); if(!inp) return;
  const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const lc=s=>String(s||"").toLowerCase();

  /* ---------- autocomplete popup ---------- */
  const box=document.createElement("div"); box.id="men-sug";
  $("emo-sug").parentNode.appendChild(box);
  let menList=[], menIdx=0;
  function hideMen(){ box.style.display="none"; menList=[]; }
  function hlMen(){ [...box.querySelectorAll(".item")].forEach((d,n)=>{ d.classList.toggle("sel",n===menIdx); if(n===menIdx) d.scrollIntoView({block:"nearest"}); }); }
  function pickMen(n){
    const pos=inp.selectionStart, before=inp.value.slice(0,pos), after=inp.value.slice(pos);
    const nb=before.replace(/(^|\s)@[^\s@]*$/,(m,a)=>a+"@"+n+" ");
    inp.value=nb+after; inp.setSelectionRange(nb.length,nb.length); inp.focus(); hideMen(); try{ updateSendBtn(); }catch(e){}
  }
  function showMen(){
    const m=inp.value.slice(0,inp.selectionStart).match(/(?:^|\s)@([^\s@]{0,12})$/);
    if(!m){ hideMen(); return; }
    const q=lc(m[1]), me=lc(usr);
    const online=new Map(), other=new Map();
    (lastRoster||[]).forEach(e=>{ if(e&&e.n&&lc(e.n)!==me) online.set(lc(e.n),e.n); });
    (logs||[]).slice(-500).forEach(l=>{ if(l&&l.u&&!l.del&&!l.to&&!l.g){ const k=lc(l.u); if(k!==me&&!online.has(k)) other.set(k,l.u); } });
    let all=[...online.values()].map(n=>({n,on:1})).concat([...other.values()].map(n=>({n,on:0})));
    const starts=all.filter(x=>lc(x.n).startsWith(q)), has=all.filter(x=>!lc(x.n).startsWith(q)&&lc(x.n).includes(q));
    menList=starts.concat(has).slice(0,8).map(x=>x);
    menIdx=0;
    if(!menList.length){ hideMen(); return; }
    box.replaceChildren();
    const hd=document.createElement("div"); hd.className="hd"; hd.textContent="MENTION SOMEONE"; box.appendChild(hd);
    menList.forEach(x=>{
      const d=document.createElement("div"); d.className="item";
      const av=document.createElement("div"); av.className="pav"; try{ paintAv(av,x.n); }catch(e){ av.textContent=x.n.slice(0,1).toUpperCase(); }
      const nm=document.createElement("span"); nm.className="nm"; nm.textContent=x.n;
      const st=document.createElement("span"); st.className="st"+(x.on?" on":""); st.textContent=x.on?"online":"offline";
      d.append(av,nm,st);
      d.onmousedown=ev=>{ ev.preventDefault(); pickMen(x.n); };
      box.appendChild(d);
    });
    menList=menList.map(x=>x.n);
    box.style.display="block"; hlMen();
  }
  inp.addEventListener("input",showMen);
  inp.addEventListener("click",showMen);
  inp.addEventListener("keyup",e=>{ if(e.key==="ArrowLeft"||e.key==="ArrowRight"||e.key==="Home"||e.key==="End") showMen(); });
  inp.addEventListener("blur",()=>setTimeout(hideMen,120));
  window.addEventListener("keydown",e=>{               // capture phase: runs before the chat's own Enter / Escape handlers
    if(!menList.length||e.target!==inp||e.isComposing) return;
    if(e.key==="ArrowDown"){ e.preventDefault(); e.stopImmediatePropagation(); menIdx=(menIdx+1)%menList.length; hlMen(); }
    else if(e.key==="ArrowUp"){ e.preventDefault(); e.stopImmediatePropagation(); menIdx=(menIdx-1+menList.length)%menList.length; hlMen(); }
    else if(e.key==="Enter"||e.key==="Tab"){ e.preventDefault(); e.stopImmediatePropagation(); pickMen(menList[menIdx]); }
    else if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); hideMen(); }
  },true);

  /* ---------- highlighting @Name inside messages ---------- */
  let reKey="", re=null, namesAt=0, names=new Map();
  function getRe(){
    const now=Date.now();
    if(now-namesAt>1500){
      namesAt=now; names=new Map();
      (lastRoster||[]).forEach(e=>{ if(e&&e.n) names.set(lc(e.n),e.n); });
      (logs||[]).forEach(l=>{ if(l&&l.u&&!l.del) names.set(lc(l.u),l.u); });
      if(usr) names.set(lc(usr),usr);
    }
    const list=[...names.values()].filter(Boolean).sort((a,b)=>b.length-a.length);
    const key=list.join("\n");
    if(key!==reKey){ reKey=key; re=list.length?new RegExp("(^|[^\\p{L}\\p{N}_@])@("+list.map(esc).join("|")+")(?![\\p{L}\\p{N}_])","giu"):null; }
    return re;
  }
  let ac=null;
  function ping(){
    try{
      ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==="suspended") ac.resume();
      const t=ac.currentTime;
      [[880,0],[1318,.13]].forEach(([f,d])=>{
        const o=ac.createOscillator(), g=ac.createGain(); o.type="sine"; o.frequency.value=f;
        g.gain.setValueAtTime(.0001,t+d); g.gain.exponentialRampToValueAtTime(.18,t+d+.02); g.gain.exponentialRampToValueAtTime(.0001,t+d+.15);
        o.connect(g); g.connect(ac.destination); o.start(t+d); o.stop(t+d+.17);
      });
    }catch(e){}
  }
  function processBubble(b){
    const t=b.textContent;
    if(b.dataset.mnt===t) return;
    b.dataset.mnt=t;
    if(t.indexOf("@")<0) return;
    const r=getRe(); if(!r) return;
    r.lastIndex=0;
    const frag=document.createDocumentFragment(); let last=0, found=false, hitMe=false, m;
    while((m=r.exec(t))){
      const start=m.index+m[1].length;
      frag.appendChild(document.createTextNode(t.slice(last,start)));
      const sp=document.createElement("span"); sp.className="mention"; sp.textContent="@"+m[2];
      if(lc(m[2])===lc(usr)){ sp.classList.add("me"); hitMe=true; }
      frag.appendChild(sp); last=start+1+m[2].length; found=true;
    }
    if(!found) return;
    frag.appendChild(document.createTextNode(t.slice(last)));
    b.replaceChildren(frag);
    const w=b.closest(".msg");
    if(hitMe&&w){
      w.classList.add("mentioned");
      if(w.classList.contains("peer")&&w.classList.contains("pop")&&!w.dataset.mnPing){ w.dataset.mnPing="1"; ping(); }   // only brand-new messages from others make a sound
    }
  }
  const SEL=".bubble[data-bubble]";
  function scan(root){ if(!root||root.nodeType!==1) return; if(root.matches&&root.matches(SEL)) processBubble(root); root.querySelectorAll&&root.querySelectorAll(SEL).forEach(processBubble); }
  let mq=[], mqt=0;
  new MutationObserver(ms=>{
    mq.push(...ms);
    if(mqt) return;
    mqt=requestAnimationFrame(()=>{ mqt=0; const q=mq; mq=[];
      q.forEach(m=>{
        m.addedNodes.forEach(scan);
        const b=m.target&&m.target.closest?m.target.closest(SEL):null; if(b) processBubble(b);
      });
    });
  }).observe($("box"),{childList:true,subtree:true});
  scan($("box"));
})();

;
/* ===== 17-main.js ===== */
/* =============== ↕ drag to reorder your tabs (header tabs + sidebar rooms) — saved on this device only =============== */
(function(){
  const KEYS=["main","shame","gal","polls","draw","tier","games","media"], LS="pb_taborder", DEF=["main","shame","gal","polls","draw","tier","games","media"];
  let order=[];
  try{ const a=JSON.parse(localStorage.getItem(LS)||"[]"); if(Array.isArray(a)) order=a.filter(k=>KEYS.includes(k)); }catch(e){}
  const full=()=>{ const o=order.filter((k,i,a)=>KEYS.includes(k)&&a.indexOf(k)===i); DEF.forEach(k=>{ if(!o.includes(k)) o.push(k); }); return o; };
  const tabEl=k=>document.querySelector('#chtabs button[data-ch="'+k+'"]');
  const rowEl=k=>document.getElementById("ch-"+k);
  const rows=()=>DEF.map(rowEl).filter(Boolean);
  const tabs=()=>DEF.map(tabEl).filter(Boolean);

  const gdLeft=()=>document.body.dataset.theme==="gdocs"&&document.body.dataset.hp==="left";   // the Docs left panel has its own (shared) tab layout
  function apply(){
    if(!order.length||gdLeft()) return;
    const o=full();
    o.forEach((k,i)=>{ const b=tabEl(k); if(b&&b.style.order!==String(i)) b.style.order=String(i); });
    const anchor=document.getElementById("sbroster"); if(!anchor||!anchor.parentNode) return;
    const present=o.map(rowEl).filter(Boolean), cur=[...anchor.parentNode.children].filter(x=>present.includes(x));
    if(present.some((r,i)=>r!==cur[i])) present.forEach(r=>anchor.parentNode.insertBefore(r,anchor));
  }
  function tip(){
    if(gdLeft()) return;
    tabs().forEach(b=>{ if(!b.title) b.title="Drag to move this tab (only you see the new order)"; });
    rows().forEach(r=>{ if(!r.title) r.title="Drag to move this room (only you see the new order)"; });
  }
  tick(()=>{ apply(); tip(); },1000); apply(); tip();

  function reset(){
    order=[]; try{ localStorage.removeItem(LS); }catch(e){}
    tabs().forEach(b=>{ b.style.order=""; });
    const anchor=document.getElementById("sbroster"); if(anchor&&anchor.parentNode) rows().forEach(r=>anchor.parentNode.insertBefore(r,anchor));
  }
  const sb=document.querySelector(".stg-sb");
  if(sb){
    const rb=document.createElement("button"); rb.type="button"; rb.className="stg-btn"; rb.textContent="↕ Reset my tab order";
    rb.title="Put the tabs back in their normal order"; rb.onclick=reset;
    const t=document.getElementById("stg-toggle"); if(t&&t.parentNode===sb) sb.insertBefore(rb,t); else sb.appendChild(rb);
  }

  /* ---- dragging (mouse: drag; touch: press and hold, then drag) ---- */
  let drag=null, noClickUntil=0, noClickEl=null;
  const items=side=>{ const l=side?rows():tabs(); return l.sort((a,b)=>{ const A=a.getBoundingClientRect(), B=b.getBoundingClientRect(); return side?A.top-B.top:A.left-B.left; }); };
  function clearMarks(){ document.querySelectorAll(".tdb-h,.tda-h,.tdb-v,.tda-v").forEach(x=>x.classList.remove("tdb-h","tda-h","tdb-v","tda-v")); }
  function begin(){
    if(!drag||drag.on) return; drag.on=true;
    drag.el.classList.add("tab-drag"); document.body.classList.add("tab-dragging");
    try{ if(navigator.vibrate) navigator.vibrate(12); }catch(e){}
  }
  function target(e){
    const side=drag.side, sibs=items(side).filter(x=>x!==drag.el), p=side?e.clientY:e.clientX;
    let idx=0; sibs.forEach(x=>{ const r=x.getBoundingClientRect(), mid=side?r.top+r.height/2:r.left+r.width/2; if(p>mid) idx++; });
    return {sibs,idx};
  }
  function finish(e,commit){
    if(!drag) return; clearTimeout(drag.timer);
    const d=drag; drag=null;
    if(!d.on) return;
    clearMarks(); d.el.classList.remove("tab-drag"); d.el.style.transform=""; document.body.classList.remove("tab-dragging");
    noClickUntil=Date.now()+350; noClickEl=d.el;
    if(!commit) return;
    drag=d; const {sibs,idx}=target(e); drag=null;
    const keyOf=x=>d.side?x.id.slice(3):x.dataset.ch, seq=sibs.map(keyOf); seq.splice(idx,0,d.key);
    order=seq; try{ localStorage.setItem(LS,JSON.stringify(order)); }catch(err){}
    apply();
  }
  document.addEventListener("pointerdown",e=>{
    if(e.button>0||drag) return;
    const el=e.target.closest&&e.target.closest('#chtabs button[data-ch], .row-ch[id^="ch-"]'); if(!el) return;
    if(gdLeft()&&!el.classList.contains("row-ch")) return;
    const side=el.classList.contains("row-ch"), key=side?el.id.slice(3):el.dataset.ch; if(!KEYS.includes(key)) return;
    drag={el,side,key,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,touch:e.pointerType==="touch"||e.pointerType==="pen",timer:0};
    if(drag.touch) drag.timer=setTimeout(begin,380);
  },true);
  document.addEventListener("pointermove",e=>{
    if(!drag||e.pointerId!==drag.id) return;
    const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
    if(!drag.on){
      if(drag.touch){ if(Math.hypot(dx,dy)>10){ clearTimeout(drag.timer); drag=null; } return; }   // moved before the hold finished = a scroll
      if(Math.hypot(dx,dy)<7) return; begin();
    }
    drag.el.style.transform=drag.side?"translateY("+dy+"px)":"translateX("+dx+"px)";
    clearMarks();
    const {sibs,idx}=target(e), v=drag.side?"v":"h";
    if(!sibs.length) return;
    if(idx<sibs.length) sibs[idx].classList.add("tdb-"+v); else sibs[sibs.length-1].classList.add("tda-"+v);
  },true);
  document.addEventListener("pointerup",e=>{ if(drag&&e.pointerId===drag.id) finish(e,true); },true);
  document.addEventListener("pointercancel",e=>{ if(drag&&e.pointerId===drag.id) finish(e,false); },true);
  document.addEventListener("touchmove",e=>{ if(drag&&drag.on&&e.cancelable) e.preventDefault(); },{passive:false});
  document.addEventListener("contextmenu",e=>{ if(drag&&drag.on) e.preventDefault(); },true);
  document.addEventListener("click",e=>{ if(Date.now()<noClickUntil&&noClickEl&&noClickEl.contains(e.target)){ e.stopImmediatePropagation(); e.preventDefault(); } },true);
})();

;
/* ===== 18-opts-js.js ===== */
(function(){
  const sb=document.querySelector(".stg-sb"), b=document.getElementById("opts-btn"); if(!sb||!b) return;
  const KEY="chat_opts_open";
  let open=false; try{ open=localStorage.getItem(KEY)==="1"; }catch(e){}
  function paint(){ sb.classList.toggle("opts-closed",!open); b.textContent=open?"☰ Options ▴":"☰ Options ▾"; b.setAttribute("aria-expanded",open?"true":"false"); }
  b.addEventListener("click",()=>{ open=!open; try{ localStorage.setItem(KEY,open?"1":"0"); }catch(e){} paint(); });
  paint();
})();
