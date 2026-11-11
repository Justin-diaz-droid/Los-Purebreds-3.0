/* ===== 04-main.js ===== */
const EMO_DATA = {};
const LOGO = "assets/mascot_logo.png";
const LOGO_FAV = "assets/favicon.png";
const ROOM_CODE = "lospurebro";
const ROOM_ID = "los-purebreds-chat-" + ROOM_CODE;
/* Connection settings. STUN finds a direct path; TURN relays when a direct path is blocked
   (school / mobile / strict networks). Add your own TURN server here for the most reliable result. */
const TURN_SERVERS = [
  /* { urls: "turn:your-server:3478", username: "user", credential: "pass" }, */
  { urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turns:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" }
];
const PEER_OPTS = { config: { iceServers: [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
  ...TURN_SERVERS ], iceCandidatePoolSize: 4 } };
const $ = id => document.getElementById(id);
let usr = "User", peer = null, conns = [], isHost = false, logs = [];

/* private DM state */
let dmWith = "", dmNm = "", chipT = null;
let seen = {}; try { seen = JSON.parse(load("dm_seen", "{}")) || {}; } catch(e){ seen = {}; }
const PH = {discord:"Message #purebred-chat",whatsapp:"Type a message",tiktok:"Send a message...",roblox:"To chat click here or press / key",instagram:"Message...",twitter:"Start a new message",imessage:"iMessage",ios6:"iMessage",material:"Text message",kitkat:"Type a message",terminal:"enter message…",simple:"Message",glass:"Message",win95:"Type a message",winxp:"Type a message",minecraft:"Type a message or /command",rule34:"Tags: type a message",gdocs:"Type @ to insert",kde:"Type a message…",macos:"iMessage"};
const THEMES = ["imessage","ios6","discord","whatsapp","tiktok","roblox","instagram","twitter","material","kde","kitkat","terminal","simple","glass","win95","winxp","minecraft","rule34","gdocs","macos"];
const CHNAME = {discord:"# purebred-chat",whatsapp:"WhatsApp Group",tiktok:"TikTok Inbox",roblox:"Roblox Chat",instagram:"Instagram Direct",twitter:"Twitter Messages",imessage:"iMessage Channel",ios6:"Messages",material:"Messages",kitkat:"Hangouts",terminal:"/dev/purebred",simple:"Messages",glass:"Messages",win95:"Messages",winxp:"Messenger",minecraft:"Minecraft Chat",rule34:"34 Chat",gdocs:"Google Docs",kde:"Konversation",macos:"Messages"};
let draft = null, stgOpen = false, pvLoaded = false, pvq = 0;
const shownKeys = new Set();
let groups = {};
function okGid(g){ return typeof g === "string" && /^g[a-z0-9]{3,30}$/.test(g); }
// a group icon is either one small emoji or a small square JPEG we made ourselves (never anything else)
const isMember = gid => !!(groups[gid] && groups[gid].m.includes(uid));
// conversation key: "d:<uid>" for a private chat, "g:<id>" for a group (empty if it isn't ours)
const isHd = m => !!(m && m.hd && m.to);     // a hidden reply: delivered privately to one person, but shown inline in the main chat
const dmKey = l => {
  if(l.del || l.hd) return "";
  if(l.to) return l.c === uid ? "d:" + l.to : l.to === uid ? "d:" + l.c : "";
  if(l.g) return isMember(l.g) ? "g:" + l.g : "";
  return "";
};

if(LOGO){
  document.documentElement.style.setProperty("--lp-icon", 'url("' + LOGO + '")');
  document.documentElement.classList.add("has-logo");
  $("fav").href = LOGO_FAV;
}

function load(k, fallback){ try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch(e){ return fallback; } }
const tick = (fn, ms) => setInterval(() => { if(!document.hidden) fn(); }, ms);   // UI-only timers sleep while the tab is in the background
function save(k, v){ try { localStorage.setItem(k, v); } catch(e){ console.warn("Storage failed", e); } }

/* permanent per-browser identity + bubble styles */
let uid = load("chat_uid", "");
if(!uid){ uid = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); save("chat_uid", uid); }
const bstyle = {}; let myBc = "", myBi = "";
const okUid = c => typeof c === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(c) && c !== "__proto__";
const okBc = c => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c) ? c : "";
const okBi = a => typeof a === "string" && a.length < 3000000 && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(a) ? a : "";

/* ---------- device (PC / mobile / tablet) ---------- */
const DEVS = { pc: ["💻", "PC"], mobile: ["📱", "Mobile"], tablet: ["📱", "Tablet"], watch: ["⌚", "Apple Watch"] };
const okDev = d => typeof d === "string" && Object.prototype.hasOwnProperty.call(DEVS, d) ? d : "";
function detectDevice(){
  const ua = navigator.userAgent || "", touch = (navigator.maxTouchPoints || 0) > 1;
  if(/Watch/i.test(ua) || /[?&]watch=1\b/.test(location.search || "")) return "watch";   // shows ⌚ Apple Watch next to your name
  if(/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Macintosh/.test(ua) && touch) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if(/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua) || (navigator.userAgentData && navigator.userAgentData.mobile)) return "mobile";
  return "pc";
}
const myDevice = detectDevice();

/* ---------- theme ---------- */
/* Layout: "docs" (Google Docs, the default base) or "lp" (Los Purebreds, the old layout with the iMessage / Discord / … themes) */
function pbLayout(){ try{ return localStorage.getItem("pb_layout") === "lp" ? "lp" : "docs"; }catch(e){ return "docs"; } }
function pbSkin(){ return pbLayout() === "docs" ? (window.__pbSkin || "") : ""; }
function pbLayoutTheme(t){
  if(pbLayout() === "docs"){ window.__pbSkin = (t && t !== "gdocs" && THEMES.includes(t)) ? t : ""; return "gdocs"; }   // Docs layout: the theme picked is a colour skin
  window.__pbSkin = "";
  if(t === "gdocs" || !THEMES.includes(t)){ let q = ""; try{ q = localStorage.getItem("pb_lp_theme") || ""; }catch(e){} return q && q !== "gdocs" && THEMES.includes(q) ? q : "imessage"; }
  try{ localStorage.setItem("pb_lp_theme", t); }catch(e){}
  return t;
}
function setTheme(t){
  t = pbLayoutTheme(t);
  if(!["imessage","ios6","discord","whatsapp","tiktok","roblox","instagram","twitter","material","kde","kitkat","terminal","simple","glass","win95","winxp","minecraft","rule34","gdocs","macos"].includes(t)) t = "gdocs";
  document.body.dataset.theme = t;
  const shown = pbSkin() || t;                                  // what the theme pickers / saved setting show (the skin, when there is one)
  $("theme").value = shown; $("g-theme").value = shown;
  $("chname").textContent = {discord:"# purebred-chat",whatsapp:"WhatsApp Group",tiktok:"TikTok Inbox",roblox:"Roblox Chat",instagram:"Instagram Direct",twitter:"Twitter Messages",imessage:"iMessage Channel",ios6:"Messages",material:"Messages",kitkat:"Hangouts",terminal:"/dev/purebred",simple:"Messages",glass:"Messages",win95:"Messages",winxp:"Messenger",minecraft:"Minecraft Chat",rule34:"34 Chat",gdocs:"Google Docs",kde:"Konversation",macos:"Messages"}[t];
  $("inp").placeholder = {discord:"Message #purebred-chat",whatsapp:"Type a message",tiktok:"Send a message...",roblox:"To chat click here or press / key",instagram:"Message...",twitter:"Start a new message",imessage:"iMessage",ios6:"iMessage",material:"Text message",kitkat:"Type a message",terminal:"enter message…",simple:"Message",glass:"Message",win95:"Type a message",winxp:"Type a message",minecraft:"Type a message or /command",rule34:"Tags: type a message",gdocs:"Type @ to insert",kde:"Type a message…",macos:"iMessage"}[t];
  save("chat_theme", shown); if(curCh === "dm") updateDmBar();
  try{ if(window.__gdSkinApply) window.__gdSkinApply(); }catch(e){}
  applyWall();
  restyleAll();
  queueRegroup();
}

/* ---------- wallpaper + accent (stored only in this browser) ---------- */
function accentFrom(hex){
  let [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  while(lum(r, g, b) < 0.25 && (r + g + b) < 765){ r = Math.min(255, r + 25); g = Math.min(255, g + 25); b = Math.min(255, b + 25); } // keep it visible on dark UI
  const toHex = n => n.toString(16).padStart(2, "0");
  return { color: "#" + toHex(r) + toHex(g) + toHex(b), text: lum(r, g, b) > 0.6 ? "#000" : "#fff" };
}
/* most popular colour of an image (as #rrggbb) */
function dominantColor(url, cb){
  const im = new Image();
  im.onload = () => {
    try {
      const n = 48, cv = document.createElement("canvas"); cv.width = cv.height = n;
      const cx = cv.getContext("2d", { willReadFrequently: true }); cx.drawImage(im, 0, 0, n, n);
      const px = cx.getImageData(0, 0, n, n).data, bins = {};
      for(let i = 0; i < px.length; i += 4){
        if(px[i + 3] < 128) continue;
        const r = px[i], g = px[i + 1], b = px[i + 2], key = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
        const o = bins[key] || (bins[key] = { n: 0, r: 0, g: 0, b: 0 });
        o.n++; o.r += r; o.g += g; o.b += b;
      }
      let best = null, bs = -1;
      Object.values(bins).forEach(o => {
        const r = o.r / o.n, g = o.g / o.n, b = o.b / o.n, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const sat = mx ? (mx - mn) / mx : 0, score = o.n * (0.5 + sat);   // popular first, greys count a bit less
        if(score > bs){ bs = score; best = [r, g, b]; }
      });
      if(!best) return cb("");
      cb("#" + best.map(v => Math.round(v).toString(16).padStart(2, "0")).join(""));
    } catch(e){ cb(""); }
  };
  im.onerror = () => cb("");
  im.src = url;
}
function setCx(st, hex, dim){
  if(!/^#[0-9a-f]{6}$/i.test(hex || "")) return;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const lum = ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * (1 - (dim || 0));
  if(lum > 0.5){ st.setProperty("--cx-text", "#111"); st.setProperty("--cx-muted", "#3a3a40"); }
  else { st.setProperty("--cx-text", "#fff"); st.setProperty("--cx-muted", "rgba(255,255,255,.78)"); }
}
function okTc(c){ return /^#[0-9a-f]{6}$/i.test(c || "") ? c : ""; }
function applyTc(st, tc){            // custom text color: overrides the theme's text + the text drawn over the wallpaper
  tc = okTc(tc); if(!tc) return;
  st.setProperty("--text", tc); st.setProperty("--cx-text", tc);
  st.setProperty("--cx-muted", "color-mix(in srgb," + tc + " 78%,transparent)");
}
/* ---------- big wallpapers (GIFs over ~1 MB) live in IndexedDB; localStorage only keeps a small marker ---------- */
const WALL_BIG = "idb:wall", WALL_MAX = 25 * 1024 * 1024;
let wallBigUrl = "";                                              // blob: address of the saved big wallpaper (filled in at startup)
const wallIDB = (mode, fn) => new Promise((res, rej) => {
  let q; try { q = indexedDB.open("pb_wall", 1); } catch(e){ rej(e); return; }
  q.onupgradeneeded = () => q.result.createObjectStore("w");
  q.onerror = () => rej(q.error);
  q.onsuccess = () => {
    const db = q.result; let out;
    try { const tx = db.transaction("w", mode); out = fn(tx.objectStore("w")); tx.oncomplete = () => { db.close(); res(out && "result" in out ? out.result : undefined); }; tx.onerror = tx.onabort = () => { db.close(); rej(tx.error); }; }
    catch(e){ db.close(); rej(e); }
  };
});
const wallSrc = () => { const v = load("wall_img", ""); return v === WALL_BIG ? wallBigUrl : v; };
const wallBigClear = () => { wallIDB("readwrite", st => st.delete("img")).catch(() => {}); };
function wallBigLoad(){                                           // startup: bring the saved big wallpaper back
  if(load("wall_img", "") !== WALL_BIG) return;
  wallIDB("readonly", st => st.get("img")).then(b => { if(b){ wallBigUrl = URL.createObjectURL(b); applyWall(); } else { try { localStorage.removeItem("wall_img"); } catch(e){} save("wall_kind", "none"); applyWall(); } }).catch(() => {});
}
/* Liquid Glass: the wallpaper becomes the page background itself, so the glass sidebar / bars blur the SAME picture or colour the chat shows */
function glassWall(body, box, kind, color, img, dim){
  const on = body.dataset.theme === "glass" && ((kind === "color" && /^#[0-9a-f]{6}$/i.test(color || "")) || (kind === "image" && img));
  body.classList.toggle("glass-wall", !!on);
  if(!on) return;
  box.style.backgroundImage = ""; box.style.backgroundColor = "";   // the page paints it now, not just the chat box
  if(kind === "color") body.style.setProperty("--g-bg", color);
  else { const d = "rgba(0,0,0," + dim + ")"; body.style.setProperty("--g-bg", "linear-gradient(" + d + "," + d + ") center / cover no-repeat, url(\"" + img + "\") center / cover no-repeat"); }
}
function applyWall(){
  const box = $("box"), k = load("wall_kind", "none"), dim = (+load("wall_dim", "30")) / 100;
  box.style.backgroundImage = ""; box.style.backgroundColor = "";
  $("wdim").value = load("wall_dim", "30"); $("wcol").value = load("wall_color", "#000000");
  const st = document.body.style;
  ["--accent", "--me", "--on-accent", "--bar", "--bar-text", "--cx-text", "--cx-muted", "--text", "--g-bg"].forEach(v => st.removeProperty(v));
  if(k === "color"){
    setCx(st, load("wall_color", "#000000"), 0);
    const c = load("wall_color", "#000000");
    box.style.backgroundColor = c;
    const a = accentFrom(c);
    st.setProperty("--accent", a.color); st.setProperty("--on-accent", a.text);
    st.setProperty("--bar", a.color); st.setProperty("--bar-text", a.text);   // top bar, message bar, left bar
    if(document.body.dataset.theme !== "discord") st.setProperty("--me", a.color);
  }
  else if(k === "image"){
    const img = wallSrc();
    if(img){
      setCx(st, load("wall_img_col", "#000000"), dim);
      box.style.backgroundImage = `linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})),url("${img}")`;
      box.style.backgroundSize = "cover"; box.style.backgroundPosition = "center";
      const ic = load("wall_img_col", "");
      if(/^#[0-9a-f]{6}$/i.test(ic)){
        const a = accentFrom(ic);
        st.setProperty("--accent", a.color); st.setProperty("--on-accent", a.text);
        st.setProperty("--bar", a.color); st.setProperty("--bar-text", a.text);
        if(document.body.dataset.theme !== "discord") st.setProperty("--me", a.color);
      } else dominantColor(img, c => { if(c){ save("wall_img_col", c); applyWall(); } });   // older saved wallpapers
    }
  }
  glassWall(document.body, box, k, load("wall_color", "#000000"), wallSrc(), dim);
  applyTc(st, load("chat_tc", ""));
}

/* ---------- hide / show bars ---------- */
function applyBars(){
  const h = load("hide_hdr", "0") === "1", sb = load("hide_sb","1") === "1";
  document.body.classList.toggle("hide-hdr", h); document.body.classList.toggle("hide-sb", sb);
  $("hh").checked = h; $("hs").checked = !sb; updateArrows();
}
const isMobile = () => window.matchMedia("(max-width:600px)").matches;
function updateArrows(){
  const sbShown = isMobile() ? $("sb").classList.contains("open") : load("hide_sb","1") !== "1";
  const bot = document.body.classList.contains("sb-bottom") && !isMobile();
  $("sb-arrow").textContent = bot ? (sbShown ? "⌄" : "⌃") : (sbShown ? "‹" : "›");
  $("hdr-arrow").textContent = load("hide_hdr", "0") === "1" ? "▼" : "▲";
}
$("sb-arrow").onclick = () => {
  if(isMobile()) $("sb").classList.toggle("open");
  else { save("hide_sb", load("hide_sb","1") === "1" ? "0" : "1"); applyBars(); }
};
$("hdr-arrow").onclick = () => { save("hide_hdr", load("hide_hdr", "0") === "1" ? "0" : "1"); applyBars(); };
new MutationObserver(updateArrows).observe($("sb"), { attributes: true });
window.addEventListener("resize", updateArrows);

/* ---------- fonts & profile pictures (shared with everyone) ---------- */
const FONT_MAP = {
  "Arial":"Arial, sans-serif", "Georgia":"Georgia, serif", "Times New Roman":"'Times New Roman', serif",
  "Courier New":"'Courier New', monospace", "Trebuchet MS":"'Trebuchet MS', sans-serif", "Impact":"Impact, sans-serif",
  "Comic Neue":"'Comic Neue', 'Comic Sans MS', cursive", "Pacifico":"Pacifico, cursive", "Lobster":"Lobster, cursive",
  "Dancing Script":"'Dancing Script', cursive", "Bangers":"Bangers, cursive", "Orbitron":"Orbitron, sans-serif",
  "Minecraft":"Minecraft, 'Press Start 2P', monospace", "Press Start 2P":"'Press Start 2P', monospace", "Roboto Mono":"'Roboto Mono', monospace",
  "Verdana":"'Verdana', sans-serif",
  "Tahoma":"'Tahoma', sans-serif",
  "Segoe UI":"'Segoe UI', sans-serif",
  "Poppins":"'Poppins', sans-serif",
  "Montserrat":"'Montserrat', sans-serif",
  "Raleway":"'Raleway', sans-serif",
  "Nunito":"'Nunito', sans-serif",
  "Quicksand":"'Quicksand', sans-serif",
  "Oswald":"'Oswald', sans-serif",
  "Caveat":"'Caveat', cursive",
  "Satisfy":"'Satisfy', cursive",
  "Indie Flower":"'Indie Flower', cursive",
  "Shadows Into Light":"'Shadows Into Light', cursive",
  "Patrick Hand":"'Patrick Hand', cursive",
  "Kalam":"'Kalam', cursive",
  "Gloria Hallelujah":"'Gloria Hallelujah', cursive",
  "Rock Salt":"'Rock Salt', cursive",
  "Permanent Marker":"'Permanent Marker', cursive",
  "Chewy":"'Chewy', cursive",
  "Fredoka":"'Fredoka', sans-serif",
  "Bubblegum Sans":"'Bubblegum Sans', cursive",
  "Anton":"'Anton', sans-serif",
  "Bebas Neue":"'Bebas Neue', sans-serif",
  "Bungee":"'Bungee', sans-serif",
  "Righteous":"'Righteous', sans-serif",
  "Russo One":"'Russo One', sans-serif",
  "Luckiest Guy":"'Luckiest Guy', cursive",
  "Rubik Mono One":"'Rubik Mono One', sans-serif",
  "Audiowide":"'Audiowide', sans-serif",
  "Monoton":"'Monoton', cursive",
  "Abril Fatface":"'Abril Fatface', serif",
  "VT323":"'VT323', monospace",
  "Silkscreen":"'Silkscreen', monospace",
  "Special Elite":"'Special Elite', monospace",
  "Creepster":"'Creepster', cursive",
  "Nosifer":"'Nosifer', cursive",
  "Butcherman":"'Butcherman', cursive",
  "Metal Mania":"'Metal Mania', cursive",
  "Pirata One":"'Pirata One', cursive",
  "UnifrakturMaguntia":"'UnifrakturMaguntia', serif",
  "Playfair Display":"'Playfair Display', serif",
  "Cinzel":"'Cinzel', serif",
  "Lora":"'Lora', serif",
  "Merriweather":"'Merriweather', serif",
  "Fredericka the Great":"'Fredericka the Great', cursive",
  "Palatino Linotype":"'Palatino Linotype', serif",
  "Garamond":"'Garamond', serif",
  "Open Sans":"'Open Sans', sans-serif",
  "Lato":"'Lato', sans-serif",
  "Inter":"'Inter', sans-serif",
  "Source Sans 3":"'Source Sans 3', sans-serif",
  "Work Sans":"'Work Sans', sans-serif",
  "DM Sans":"'DM Sans', sans-serif",
  "Manrope":"'Manrope', sans-serif",
  "Lexend":"'Lexend', sans-serif",
  "Josefin Sans":"'Josefin Sans', sans-serif",
  "Ubuntu":"'Ubuntu', sans-serif",
  "Fira Sans":"'Fira Sans', sans-serif",
  "Barlow":"'Barlow', sans-serif",
  "Cabin":"'Cabin', sans-serif",
  "Archivo":"'Archivo', sans-serif",
  "PT Serif":"'PT Serif', serif",
  "EB Garamond":"'EB Garamond', serif",
  "Libre Baskerville":"'Libre Baskerville', serif",
  "Crimson Text":"'Crimson Text', serif",
  "Spectral":"'Spectral', serif",
  "Cormorant Garamond":"'Cormorant Garamond', serif",
  "Zilla Slab":"'Zilla Slab', serif",
  "Alfa Slab One":"'Alfa Slab One', serif",
  "Source Code Pro":"'Source Code Pro', monospace",
  "Fira Code":"'Fira Code', monospace",
  "Space Mono":"'Space Mono', monospace",
  "Courier Prime":"'Courier Prime', monospace",
  "Amatic SC":"'Amatic SC', cursive",
  "Pangolin":"'Pangolin', cursive",
  "Handlee":"'Handlee', cursive",
  "Gochi Hand":"'Gochi Hand', cursive",
  "Sacramento":"'Sacramento', cursive",
  "Great Vibes":"'Great Vibes', cursive",
  "Courgette":"'Courgette', cursive",
  "Cookie":"'Cookie', cursive"
};
let myFont = "", myAvatar = "";
const avatars = {};
(function(){
  const sel = $("font"), d = document.createElement("option"); d.value = ""; d.textContent = "Default"; sel.appendChild(d);
  const FONT_GROUPS = [["Everyday", ["Verdana", "Tahoma", "Segoe UI", "Poppins", "Montserrat", "Raleway", "Nunito", "Quicksand", "Oswald"]], ["Handwriting & fun", ["Caveat", "Satisfy", "Indie Flower", "Shadows Into Light", "Patrick Hand", "Kalam", "Gloria Hallelujah", "Rock Salt", "Permanent Marker", "Chewy", "Fredoka", "Bubblegum Sans"]], ["Bold & display", ["Anton", "Bebas Neue", "Bungee", "Righteous", "Russo One", "Luckiest Guy", "Rubik Mono One", "Audiowide", "Monoton", "Abril Fatface"]], ["Retro & pixel", ["VT323", "Silkscreen", "Special Elite"]], ["Spooky & medieval", ["Creepster", "Nosifer", "Butcherman", "Metal Mania", "Pirata One", "UnifrakturMaguntia"]], ["Elegant & serif", ["Playfair Display", "Cinzel", "Lora", "Merriweather", "Fredericka the Great", "Palatino Linotype", "Garamond"]]];
  FONT_GROUPS.push(["More fonts", ["Open Sans", "Lato", "Inter", "Source Sans 3", "Work Sans", "DM Sans", "Manrope", "Lexend", "Josefin Sans", "Ubuntu", "Fira Sans", "Barlow", "Cabin", "Archivo", "PT Serif", "EB Garamond", "Libre Baskerville", "Crimson Text", "Spectral", "Cormorant Garamond", "Zilla Slab", "Alfa Slab One", "Source Code Pro", "Fira Code", "Space Mono", "Courier Prime", "Amatic SC", "Pangolin", "Handlee", "Gochi Hand", "Sacramento", "Great Vibes", "Courgette", "Cookie"]]);
  const mk = (k, par) => { const o = document.createElement("option"); o.value = k; o.textContent = k; o.style.fontFamily = FONT_MAP[k]; par.appendChild(o); };
  const grouped = {}; FONT_GROUPS.forEach(g => g[1].forEach(n => grouped[n] = 1));
  Object.keys(FONT_MAP).filter(k => !grouped[k]).forEach(k => mk(k, sel));            // the original fonts first
  FONT_GROUPS.forEach(g => { const og = document.createElement("optgroup"); og.label = g[0]; g[1].forEach(n => { if(FONT_MAP[n]) mk(n, og); }); sel.appendChild(og); });
})();
function okFont(f){ return typeof f === "string" && Object.prototype.hasOwnProperty.call(FONT_MAP, f) ? f : ""; }
const AV_MAX = 4600000;                                   // biggest profile picture / banner (characters of its data, ~3.4 MB file): everyone in the room receives it
function okAv(a){ return typeof a === "string" && a.length < AV_MAX && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(a) ? a : ""; }
function paintAv(el, name){
  const a = avatars[name];
  if(a){ el.style.background = 'url("' + a + '") center/cover'; el.textContent = ""; el.classList.add("has-pfp"); }
  else { el.style.background = colorFor(name); el.textContent = (name[0] || "?").toUpperCase(); el.classList.remove("has-pfp"); }
}
function refreshAvatars(){
  document.querySelectorAll(".msg[data-user]").forEach(w => { const a = w.querySelector(".av"); if(a) paintAv(a, w.dataset.user); });
  paintPfp();
}
function cacheAvatars(){ const o = {}; Object.keys(avatars).forEach(k => { if(avatars[k] && avatars[k].length < 250000) o[k] = avatars[k]; }); save("chat_avatars", JSON.stringify(o)); }   // huge GIFs are not kept in localStorage (its quota is small); the room sends them again
function me(){ return { n: usr, a: myAvatar, d: myDevice, c: uid }; }
function announce(){ if(isHost) pushRoster(); else send({ t: "P", u: usr, a: myAvatar, d: myDevice, c: uid, i: newId() }); }

/* ---------- who's online ---------- */
let lastRoster = [];
function typingNames(){ const now = Date.now(); return Object.keys(typers).filter(n => n !== usr && typers[n] >= now); }
function renderPop(){
  fillRoster($("onpop"));
  const s = $("sbroster"), h = document.createElement("div"), l = document.createElement("div");
  h.className = "sbh"; h.textContent = "Online — " + lastRoster.length;
  fillRoster(l); s.replaceChildren(h, l);
}
function fillRoster(p){
  p.innerHTML = "";
  const tp = typingNames();
  lastRoster.forEach(e => {
    const r = document.createElement("div"); r.className = "prow";
    const av = document.createElement("div"); av.className = "pav"; paintAv(av, e.n);
    const nm = document.createElement("span"); nm.className = "pnm"; nm.textContent = e.n + (e.n === usr ? " (you)" : "");
    r.append(av, nm);
        if(tp.includes(e.n)){ const t = document.createElement("span"); t.className = "ptyp"; t.title = "typing…"; t.innerHTML = "<i></i><i></i><i></i>"; r.appendChild(t); }
    if(e.d && DEVS[e.d]){ const t = document.createElement("span"); t.className = "pdev"; t.textContent = DEVS[e.d][0] + " " + DEVS[e.d][1]; r.appendChild(t); }
    p.appendChild(r);
  });
}
$("online").onclick = () => { setPop(!$("onpop").classList.contains("open") || $("onpop").classList.contains("closing")); renderPop(); };
document.addEventListener("click", ev => { if(!ev.target.closest("#online") && !ev.target.closest("#onpop")) setPop(false); });
function renderOnline(list){
  list.forEach(e => { if(e.a) avatars[e.n] = e.a; }); cacheAvatars();
  const box = $("online"); box.innerHTML = "";
  list.slice(0, 10).forEach(e => {
    const a = document.createElement("div"); a.className = "oav"; a.title = e.n + (e.d && DEVS[e.d] ? " · " + DEVS[e.d][1] : "");
    a.dataset.dev = e.d && DEVS[e.d] ? DEVS[e.d][0] : ""; paintAv(a, e.n); box.appendChild(a);
  });
  const c = document.createElement("span"); c.className = "ocount";
  c.textContent = "Users Online, " + list.length + " ▾";
  box.appendChild(c);
  lastRoster = list; renderPop(); updateDmBar(); renderDMList();
  refreshAvatars();
}
function pushRoster(){
  if(!isHost) return;
  const list = [me(), ...conns.filter(c => c.userName).map(c => ({ n: c.userName, a: c.avatar || "", d: c.device || "", c: c.uid || "" }))].filter((e, i, a) => a.findIndex(x => x.n === e.n && x.c === e.c) === i);
  renderOnline(list);
  const wire = list.map(e => (e.a && e.a.length > INLINE_MAX) ? Object.assign({}, e, { a: "" }) : e);   // big GIF pictures are not squeezed into the join/roster message: they follow one at a time (see queueBig)
  conns.forEach(c => { if(!c.open || !c.userName) return; c.sentBig = c.sentBig || {};
    list.forEach(e => { if(e.a && e.a.length > INLINE_MAX && e.n !== c.userName && c.sentBig[e.n] !== e.a.length){ c.sentBig[e.n] = e.a.length; queueBig(c, { t: "AVB", i: newId(), n: e.n, a: e.a }); } }); });
  send({ t: "R", i: newId(), list: wire });
}
const INLINE_MAX = 60000;                              // pictures bigger than this (characters) are sent on their own, slowly, after the join
function queueBig(c, msg){
  c.bigQ = c.bigQ || []; c.bigQ.push(msg);
  if(c.bigRun) return; c.bigRun = true;
  const step = () => {
    if(!c.open || !c.bigQ || !c.bigQ.length){ c.bigRun = false; return; }
    if((window.__hubBuf ? window.__hubBuf() : 0) > 400000){ setTimeout(step, 600); return; }   // the connection is still busy: wait
    c.send(c.bigQ.shift()); setTimeout(step, 1200);
  };
  setTimeout(step, 8000);                                // let the person finish joining first
}

/* ---------- startup ---------- */
window.addEventListener("load", () => {
  usr = load("chat_usr", "User");
  myFont = okFont(load("chat_font", "")); $("font").value = myFont; $("inp").style.fontFamily = FONT_MAP[myFont] || "";
  myAvatar = okAv(load("chat_pfp", ""));
  try { const c = JSON.parse(load("chat_avatars", "{}")); Object.keys(c).forEach(k => { if(okAv(c[k])) avatars[k] = c[k]; }); } catch(e){}
  if(myAvatar) avatars[usr] = myAvatar;
  $("hi").value = usr; $("g-name").value = usr === "User" ? "" : usr; updateYou();
  /* one-time reset (2026-11-07): everyone starts on the Google Docs theme; after this they can change it in Settings and it sticks.
     pb_pts is bumped so an older synced look from another device can't put the old theme back. To reset everyone again, change the flag name. */
  try{ if(!localStorage.getItem("theme_reset_20261107")){ localStorage.setItem("theme_reset_20261107","1"); save("chat_theme","gdocs"); save("pb_pts",String(Date.now())); } }catch(e){}
  setTheme(load("chat_theme", "gdocs")); applyWall(); wallBigLoad(); applyBars(); refreshAvatars();
  myBc = okBc(load("chat_bc", "")); myBi = okBi(load("chat_bi", ""));
  try { const c = JSON.parse(load("chat_bstyle", "{}")); Object.keys(c).forEach(k => { if(okUid(k) && c[k] && typeof c[k] === "object") bstyle[k] = { bc: okBc(c[k].bc), bi: okBi(c[k].bi), v: +c[k].v || 0 }; }); } catch(e){}
  bstyle[uid] = { bc: myBc, bi: myBi, v: +load("chat_bv", "0") || 0 };
  $("bcol").value = myBc || "#0a84ff";
  try { logs = JSON.parse(load("chat_history", "[]")); } catch(e){ logs = []; }
  logs = logs.filter(l => l && typeof l.i === "string");
  logs.forEach(l => {                      // upgrade old saved messages
    if(!l.ts) l.ts = +String(l.i).split("-")[1] || 0;
    if(!l.v) l.v = l.ts;
    if(!l.c && l.cls === "me") l.c = uid;
    delete l.cls;
  });
  logs.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  try { save("chat_groups", "{}"); } catch(e){}   // group chats were removed: forget any saved ones
  resetWin(); rerender();                                  // start at the newest messages only
});

$("g-go").onclick = () => {
  const code = $("g-code").value.trim().toLowerCase();
  if(code !== ROOM_CODE){ $("gerr").textContent = "Wrong room code."; return; }
  const n = $("g-name").value.trim();
  if(n){ usr = n; $("hi").value = n; save("chat_usr", n); updateYou(); }
  window.__entering = true; $("gerr").textContent = "Connecting…"; $("g-go").disabled = true;
  clearTimeout(window.__enterT);
  window.__enterT = setTimeout(() => { if(window.__entering && window.__leave) window.__leave("Couldn't connect to the room. Try again."); }, 30000);
  // let the browser paint "Connecting…" first, open the connection, and only then do the heavy redraw while the network works
  requestAnimationFrame(() => setTimeout(() => {
    sys("Welcome to purebred-chat, HM:  RIP: Ryosuke 🕊️🪦🪽");
    connect();
    setTimeout(() => { setTheme($("g-theme").value); rerender(); }, 0);
  }, 0));
};
/* the join screen only closes once the host has accepted us (right name + password) */
window.revealChat = function(){
  if(!window.__entering) return;
  window.__entering = false; clearTimeout(window.__enterT);
  $("gerr").textContent = ""; $("g-go").disabled = false;
  $("gate").classList.add("leaving"); setTimeout(() => { $("gate").style.display = "none"; }, 200);
};
["g-code", "g-name"].forEach(id => $(id).addEventListener("keydown", e => { if(e.key === "Enter") $("g-go").click(); }));
$("g-theme").addEventListener("change", e => setTheme(e.target.value));   // preview the theme on the join screen

function updateYou(){ $("youare").textContent = "Signed in as " + usr; }
/* ---------- settings screen (fullscreen, live preview) ---------- */
function currentSettings(){
  return { name: usr, avatar: myAvatar, font: myFont, bc: myBc, bi: myBi, theme: pbSkin() || document.body.dataset.theme,
    wallKind: load("wall_kind", "none"), wallColor: load("wall_color", "#000000"), wallImg: wallSrc(), wallImgCol: load("wall_img_col", ""), wallDim: +load("wall_dim", "30"), tc: okTc(load("chat_tc", "")),
    hideHdr: load("hide_hdr", "0") === "1", hideSb: load("hide_sb","1") === "1" };
}
function fillControls(){
  const d = draft;
  $("hi").value = d.name; $("font").value = d.font; $("bcol").value = d.bc || "#0a84ff"; $("theme").value = d.theme;
  $("wcol").value = d.wallColor; $("tcol").value = d.tc || getComputedStyle(document.body).getPropertyValue("--text").trim().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i,"#$1$1$2$2$3$3") || "#ffffff"; $("wdim").value = d.wallDim; $("hh").checked = d.hideHdr; $("hs").checked = !d.hideSb; paintPfp();
}
function paintPfp(){
  const pv = $("pfpprev"); if(!pv) return;
  const on = stgOpen && draft, name = on ? (draft.name || usr) : usr, a = on ? draft.avatar : myAvatar;
  if(a){ pv.style.background = 'url("' + a + '") center/cover'; pv.textContent = ""; }
  else { pv.style.background = colorFor(name); pv.textContent = (name[0] || "?").toUpperCase(); }
}
function setStg(on){
  const m = $("stg"); clearTimeout(m._t);
  if(on){ m.classList.remove("closing"); m.classList.add("open"); }
  else if(m.classList.contains("open")){ stgOpen = false; m.classList.add("closing"); m._t = setTimeout(() => { m.classList.remove("open", "closing"); draft = null; }, 250); }
}
function openSettings(){
  draft = currentSettings(); stgOpen = true;
  fillControls(); $("stgerr").textContent = "";
  $("sb").classList.remove("open");
  setStg(true);
  const f = $("pvframe");
  if(pvLoaded){ renderPreview(); return; }
  pvLoaded = true; f.onload = () => renderPreview(); f.srcdoc = pvHTML();
}
$("stg-toggle").onclick = openSettings;
$("hdr-set").onclick = openSettings;
$("stgx").onclick = $("stgcancel").onclick = () => setStg(false);
document.addEventListener("keydown", e => { if(e.key === "Escape" && stgOpen) setStg(false); });
$("pvdesk").onclick = () => { $("pvwrap").classList.remove("phone"); $("pvdesk").classList.add("on"); $("pvphone").classList.remove("on"); };
$("pvphone").onclick = () => { $("pvwrap").classList.add("phone"); $("pvphone").classList.add("on"); $("pvdesk").classList.remove("on"); };

// every control edits the draft and refreshes the preview; nothing is applied until Save
function upd(fn){ return e => { if(!draft) return; fn(e); renderPreview(); }; }
$("hi").addEventListener("input", upd(e => { draft.name = e.target.value.slice(0, 12); paintPfp(); }));
$("font").addEventListener("change", upd(e => { draft.font = okFont(e.target.value); }));
$("theme").addEventListener("change", upd(e => { draft.theme = THEMES.includes(e.target.value) ? e.target.value : "imessage"; }));
$("bcol").addEventListener("input", upd(e => { draft.bc = okBc(e.target.value); }));
$("bcolrm").onclick = upd(() => { draft.bc = ""; $("bcol").value = "#0a84ff"; });
$("bimgrm").onclick = upd(() => { draft.bi = ""; });
$("pfprm").onclick = upd(() => { draft.avatar = ""; paintPfp(); });
$("wcol").addEventListener("input", upd(e => { draft.wallKind = "color"; draft.wallColor = e.target.value; }));
$("tcol").addEventListener("input", upd(e => { draft.tc = okTc(e.target.value); }));
$("tcolrm").onclick = upd(() => { draft.tc = ""; });
$("wdim").addEventListener("input", upd(e => { draft.wallDim = +e.target.value; }));
$("wreset").onclick = upd(() => { draft.wallKind = "none"; draft.wallImg = ""; });
$("hh").addEventListener("change", upd(e => { draft.hideHdr = e.target.checked; }));
$("hs").addEventListener("change", upd(e => { draft.hideSb = !e.target.checked; }));
$("pfpbtn").onclick = () => $("pfpfile").click();
$("bimgbtn").onclick = () => $("bimgfile").click();
$("wimg").onclick = () => $("wfile").click();
function readImage(e, maxSide, quality, done){
  const f = e.target.files[0]; e.target.value = ""; if(!f || !draft) return;
  const r = new FileReader();
  r.onload = ev => {
    const im = new Image();
    im.onload = () => {
      const sc = Math.min(1, maxSide / Math.max(im.width, im.height)), cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(im.width * sc)); cv.height = Math.max(1, Math.round(im.height * sc));
      cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
      $("stgerr").textContent = ""; done(cv.toDataURL("image/jpeg", quality), cv);
    };
    im.src = ev.target.result;
  };
  r.readAsDataURL(f);
}
/* GIFs stay GIFs (so they keep moving). Too big to fit? fall back to a still picture. */
function gifPick(e, ok, use, tooBig, stillFn){
  const f = e.target.files && e.target.files[0];
  if(!(f && draft && (f.type === "image/gif" || /\.gif$/i.test(f.name)))) return false;
  e.target.value = "";
  const r = new FileReader();
  r.onload = ev => {
    const u = ev.target.result;
    if(ok(u)){ $("stgerr").textContent = ""; use(u); }
    else { stillFn({ target: { files: [f], value: "" } }); $("stgerr").textContent = tooBig; }
  };
  r.readAsDataURL(f);
  return true;
}
$("pfpfile").onchange = e => { if(!gifPick(e, okAv, u => { draft.avatar = u; paintPfp(); renderPreview(); }, "That GIF is too big to animate for everyone (max ~3.4 MB) — using a still picture instead.", pfpStill)) pfpStill(e); };
const pfpStill = e => readImage(e, 80, 0.75, (u, cv) => {   // square crop for the profile picture
  const im = new Image();
  im.onload = () => {
    const c = document.createElement("canvas"), n = 80, m = Math.min(im.width, im.height);
    c.width = c.height = n; c.getContext("2d").drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, n, n);
    draft.avatar = c.toDataURL("image/jpeg", 0.75); paintPfp(); renderPreview();
  };
  im.src = u;
});
const bubStill = e => readImage(e, 240, 0.6, u => {
  if(!okBi(u)){ $("stgerr").textContent = "That bubble image is too detailed — try a simpler one."; return; }
  draft.bi = u; renderPreview();
});
$("bimgfile").onchange = e => { if(!gifPick(e, okBi, u => { draft.bi = u; renderPreview(); }, "That GIF is too big to animate (max ~2 MB) — using a still picture instead.", bubStill)) bubStill(e); };
function wallPick(u){ draft.wallBlob = null; draft.wallImg = u; draft.wallKind = "image"; draft.wallImgCol = ""; renderPreview(); dominantColor(u, c => { if(draft && draft.wallImg === u){ draft.wallImgCol = c; renderPreview(); } }); }
$("wfile").onchange = e => {
  const f = e.target.files[0];
  if(f && draft && (f.type === "image/gif" || /\.gif$/i.test(f.name))){   // keep GIFs as-is so they stay animated
    e.target.value = "";
    if(f.size > WALL_MAX){ $("stgerr").textContent = "That GIF is too big to use as a wallpaper (max " + Math.round(WALL_MAX / 1048576) + " MB) — pick a smaller one."; return; }
    if(f.size > 1000000){ $("stgerr").textContent = ""; wallPick(URL.createObjectURL(f)); draft.wallBlob = f; return; }   // big: keep the file itself (saved in IndexedDB)
    const r = new FileReader();
    r.onload = ev => { $("stgerr").textContent = ""; wallPick(ev.target.result); };
    r.readAsDataURL(f);
    return;
  }
  wallPickStatic(e);
};
const wallPickStatic = e => readImage(e, 1280, 0.8, u => { draft.wallBlob = null; draft.wallImg = u; draft.wallKind = "image"; draft.wallImgCol = ""; renderPreview(); dominantColor(u, c => { if(draft && draft.wallImg === u){ draft.wallImgCol = c; renderPreview(); } }); });

const doSaveSettings = () => {
  if(!draft) return;
  const d = draft, old = usr, oldAv = myAvatar, oldFont = myFont, oldTheme = document.body.dataset.theme;
  if(d.wallKind === "image" && d.wallImg){
    if(d.wallBlob && /^blob:/.test(d.wallImg)){                    // a big GIF picked just now: store the file in IndexedDB, remember only a marker
      const blob = d.wallBlob;
      wallIDB("readwrite", st => st.put(blob, "img")).catch(() => { sys("Couldn't store that wallpaper on this device, so it will be gone after a refresh."); });
      try { localStorage.setItem("wall_img", WALL_BIG); } catch(err){}
      wallBigUrl = d.wallImg;
    } else if(d.wallImg === wallBigUrl && wallBigUrl){ /* the saved big wallpaper, unchanged */ }
    else {
      try { localStorage.setItem("wall_img", d.wallImg); wallBigClear(); }
      catch(err){ $("stgerr").textContent = "That wallpaper is too big to save — pick a smaller image."; return; }
    }
  } else { try { localStorage.removeItem("wall_img"); } catch(err){} wallBigClear(); }
  save("wall_img_col", d.wallKind === "image" ? (d.wallImgCol || "") : ""); save("wall_kind", d.wallKind); save("wall_color", d.wallColor); save("wall_dim", String(d.wallDim));
  save("chat_tc", d.tc || ""); save("hide_hdr", d.hideHdr ? "1" : "0"); save("hide_sb", d.hideSb ? "1" : "0");
  myFont = okFont(d.font); save("chat_font", myFont); $("inp").style.fontFamily = FONT_MAP[myFont] || "";
  usr = (d.name.trim() || usr).slice(0, 12); save("chat_usr", usr); updateYou();
  myAvatar = okAv(d.avatar); save("chat_pfp", myAvatar);
  if(myAvatar) avatars[usr] = myAvatar; else delete avatars[usr];
  if(myAvatar !== oldAv || usr !== old) cacheAvatars();   // re-serialising every avatar is slow: only when one changed
  const bChanged = d.bc !== myBc || d.bi !== myBi;
  myBc = d.bc; myBi = d.bi; save("chat_bc", myBc); save("chat_bi", myBi);
  setTheme(d.theme); applyBars();
  if(usr !== old || myAvatar !== oldAv || myFont !== oldFont || d.theme !== oldTheme){ rerender(); refreshAvatars(); }   // rebuilding the whole chat is slow: skip it for wallpaper / colour-only changes
  if(bChanged) setMyStyle();
  if(usr !== old){ send({ t: "N", u: old, b: usr, i: newId() }); sys("You changed your name to " + usr + "."); }
  else sys("Settings saved.");
  if(usr !== old || myAvatar !== oldAv) announce();
  setStg(false);
};
$("save").onclick = () => {
  if(!draft || $("applying").classList.contains("on")) return;
  const ov = $("applying"); ov.classList.add("on");
  // let the overlay paint first, then do the heavy work
  requestAnimationFrame(() => setTimeout(() => {
    try { doSaveSettings(); } catch(err){ console.error(err); }
    setTimeout(() => ov.classList.remove("on"), 250);
  }, 30));
};

/* ---- live preview: a sandboxed copy of the real UI that follows the draft ---- */
function pvHTML(){
  const css = [...document.querySelectorAll("style")].map(x => window.__pbCM ? window.__pbCM.css(x.textContent) : x.textContent).join("\n");
  const links = [...document.querySelectorAll("link[rel=stylesheet]")].map(l => l.outerHTML).join("");
  const svg = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + links +
    '<style>' + css + '\n#gate,.arrow,#stg,#gmod{display:none !important} body{pointer-events:none;user-select:none}</style></head>' +
    '<body data-theme="imessage" class="has-peers">' +
    '<div id="sb"><div><div class="hdr-sb">Messages</div>' +
    '<div class="row-ch active"><div class="av-sb lp"></div><div><b style="font-size:15px">Los Purebreds</b><br><span id="chname" class="csub"></span></div></div>' +
    '<div class="row-ch"><div class="av-sb" style="font-size:18px">🖼️</div><div><b style="font-size:15px">Image Gallery</b><br><span class="csub">Photos only</span></div></div></div>' +
    '<div class="stg-sb"><div id="youare"></div></div></div>' +
    '<div id="main"><div id="hdrwrap"><div id="hdr"><span id="status">Online — 2 connected</span>' +
    '<div id="chtabs"><button type="button" class="on">💬 Chat</button><button type="button">🖼️ Image Gallery</button></div><div id="online"></div></div></div>' +
    '<div id="box"></div><div id="typing"></div>' +
    '<div id="tray"><label class="plus">+</label><span id="emo-btn">😊</span><div class="pill"><input type="text" id="inp" disabled><button id="sendbtn" type="button">' + svg + '</button></div></div></div>' +
    '</body></html>';
}
function renderPreview(){ if(pvq) return; pvq = requestAnimationFrame(() => { pvq = 0; try { drawPreview(); } catch(err){ console.warn("preview failed", err); } }); }
function paintTo(el, name, a){
  if(a){ el.style.background = 'url("' + a + '") center/cover'; el.textContent = ""; }
  else { el.style.background = colorFor(name); el.textContent = (name[0] || "?").toUpperCase(); }
}
/* Docs layout: the picked theme is a colour skin and Docs has its own dark mode. Both live in generated <style> tags and body classes
   of the real page, which the preview's one-off copy of the styles never saw, so the preview stayed plain white whatever you picked. */
function syncDocsLook(doc, body, d){
  const head = doc.head || doc.documentElement;
  const sty = id => { let e = doc.getElementById(id); if(!e){ e = doc.createElement("style"); e.id = id; head.appendChild(e); } return e; };
  let skin = "", dark = false;
  if(pbLayout() === "docs"){
    skin = (d.theme && d.theme !== "gdocs" && THEMES.includes(d.theme)) ? d.theme : "";
    try{ dark = !!(window.gdDark && window.gdDark.get()); }catch(e){}
  }
  let skinCss = "";
  if(skin && window.__gdSkinCSS){ try{ skinCss = window.__gdSkinCSS(skin); }catch(e){} }
  sty("pv-skin").textContent = skinCss;
  let darkCss = ""; try{ const g = document.getElementById("gdocs-dark-gen"); if(dark){ if(g && !g.textContent && window.gdDark) window.gdDark.apply(true); darkCss = g ? g.textContent : ""; } }catch(e){}
  sty("pv-dark").textContent = darkCss;
  body.classList.toggle("gd-skin", !!skinCss);
  body.classList.toggle("gd-dark", dark && !skinCss);
  if(skinCss) body.dataset.skin = skin; else delete body.dataset.skin;
}
function drawPreview(){
  if(!draft) return;
  const doc = $("pvframe").contentDocument;
  if(!doc || !doc.body || !doc.getElementById("box")) return;
  const d = draft, body = doc.body, theme = pbLayout() === "docs" ? "gdocs" : (THEMES.includes(d.theme) && d.theme !== "gdocs" ? d.theme : "imessage");
  const E = (t, c, x) => { const e = doc.createElement(t); if(c) e.className = c; if(x != null) e.textContent = x; return e; };
  doc.documentElement.className = document.documentElement.className;
  doc.documentElement.style.cssText = document.documentElement.style.cssText;
  body.dataset.theme = theme; body.classList.toggle("hide-hdr", d.hideHdr); body.classList.toggle("hide-sb", d.hideSb);
  syncDocsLook(doc, body, d);
  const myName = d.name || usr;
  doc.getElementById("chname").textContent = CHNAME[theme];
  doc.getElementById("inp").placeholder = PH[theme];
  doc.getElementById("youare").textContent = "Signed in as " + myName;
  // wallpaper + accent (same rules as the real app)
  const box = doc.getElementById("box");
  box.style.backgroundImage = ""; box.style.backgroundColor = "";
  ["--accent", "--me", "--on-accent", "--bar", "--bar-text", "--cx-text", "--cx-muted", "--text", "--g-bg"].forEach(v => body.style.removeProperty(v));
  if(d.wallKind === "color"){
    setCx(body.style, d.wallColor, 0);
    box.style.backgroundColor = d.wallColor; const a = accentFrom(d.wallColor);
    body.style.setProperty("--accent", a.color); body.style.setProperty("--on-accent", a.text);
    body.style.setProperty("--bar", a.color); body.style.setProperty("--bar-text", a.text);
    if(theme !== "discord") body.style.setProperty("--me", a.color);
  } else if(d.wallKind === "image" && d.wallImg){
    setCx(body.style, d.wallImgCol, d.wallDim / 100);
    if(/^#[0-9a-f]{6}$/i.test(d.wallImgCol || "")){
      const a = accentFrom(d.wallImgCol);
      body.style.setProperty("--accent", a.color); body.style.setProperty("--on-accent", a.text);
      body.style.setProperty("--bar", a.color); body.style.setProperty("--bar-text", a.text);
      if(theme !== "discord") body.style.setProperty("--me", a.color);
    }
    const dim = d.wallDim / 100;
    box.style.backgroundImage = "linear-gradient(rgba(0,0,0," + dim + "),rgba(0,0,0," + dim + ")),url(\"" + d.wallImg + "\")";
    box.style.backgroundSize = "cover"; box.style.backgroundPosition = "center";
  }
  glassWall(body, box, d.wallKind, d.wallColor, d.wallImg, d.wallDim / 100);
  applyTc(body.style, d.tc);
  // who's online
  const on = doc.getElementById("online"); on.replaceChildren();
  [[myName, d.avatar], ["Sam", ""]].forEach(([n, a]) => { const o = E("div", "oav"); o.dataset.dev = "💻"; paintTo(o, n, a); on.appendChild(o); });
  on.appendChild(E("span", "ocount", "2 online"));
  // sample conversation
  const items = [
    { s: "peer", n: "Sam", t: "Hey! Did you change your settings? 👀" },
    { s: "me", t: "Yep — this is my new look" },
    { s: "me", t: "Here's how my messages will look", act: true },
    { s: "peer", n: "Sam", t: "Love it!" }
  ];
  let lastMe = -1; items.forEach((it, i) => { if(it.s === "me") lastMe = i; });
  const nodes = [E("div", "tsep", "Today 9:41 AM")];
  items.forEach((it, i) => {
    const first = !items[i - 1] || items[i - 1].s !== it.s, last = !items[i + 1] || items[i + 1].s !== it.s;
    const w = E("div", "msg " + it.s + (first ? " first" : "") + (last ? " last" : "") + (it.act ? " tap" : "") + (i === lastMe ? " lastmine" : ""));
    const nm = it.s === "me" ? myName : it.n;
    const av = E("div", "av"); paintTo(av, nm, it.s === "me" ? d.avatar : "");
    const col = E("div", "col"), lbl = E("span", "lbl", nm); lbl.style.setProperty("--uc", colorFor(nm)); col.appendChild(lbl);
    const wrap = E("div", "bwrap"), bub = E("div", "bubble", it.t);
    if(it.s === "me"){
      if(d.font && FONT_MAP[d.font]) bub.style.fontFamily = FONT_MAP[d.font];
      applyBubbleStyle(bub, { bc: d.bc, bi: d.bi }, theme);
    }
    wrap.appendChild(bub);
    if(it.act){                               // shows where the reply / edit / delete buttons appear
      const act = E("div", "act");
      [["rep", ICON_REPLY], ["edt", ICON_EDIT], ["del", ICON_DEL]].forEach(([c, svg]) => { const b = E("button", c); b.innerHTML = svg; act.appendChild(b); });
      wrap.appendChild(act);
    }
    col.appendChild(wrap); w.append(av, col); nodes.push(w);
  });
  box.replaceChildren(...nodes); box.scrollTop = box.scrollHeight;
}

/* ---------- networking (host relays to everyone) ---------- */
function setStatus(t){ $("status").textContent = t; }
function ready(){ $("inp").disabled = false; $("fi").disabled = false; }

function connect(){
  setStatus("Connecting..."); renderOnline([me()]);
  peer = new Peer(ROOM_ID, PEER_OPTS);
  peer.on("open", () => {
    isHost = true; ready(); if(window.revealChat) window.revealChat();
    setStatus("");
    sys("You opened the room. Friends can join with the code.");
  });
  peer.on("connection", c => addConn(c));
  peer.on("error", err => {
    if(err.type === "unavailable-id" && !isHost){
      peer = new Peer(undefined, PEER_OPTS);
      peer.on("open", () => addConn(peer.connect(ROOM_ID, { reliable: true })));
      peer.on("error", e => {
        setStatus("Connection error: " + e.type);
        if(e.type === "peer-unavailable" || e.type === "network" || e.type === "server-error" || e.type === "socket-error")
          { if(e.type === "peer-unavailable" && window.__hoRestart) window.__hoRestart(); else setTimeout(() => { try { if(peer && !isHost && peer.open && !conns.length) addConn(peer.connect(ROOM_ID, { reliable: true })); } catch(x){} }, 2500); }
      });
    } else { setStatus("Connection error: " + err.type); }
  });
}

function addConn(c){
  c.on("open", () => {
    conns.push(c); ready();
    c.send({ t: "P", u: usr, a: myAvatar, d: myDevice, c: uid, i: newId() });   // host sends its id too
    if(!isHost) Object.values(groups).forEach(g => c.send({ t: "G", i: newId(), g }));   // tell the host about my groups (the host may be new)
    c.send({ t: "S", i: newId(), s: logs.filter(l => !isHost || (!l.to && !l.g)).map(l => [l.i, l.v || 0, rxv(l)]) });   // host: public history only; private/group ids are added once the joiner identifies itself
    c.send({ t: "B", i: newId(), c: uid, bc: myBc, bi: myBi, v: bstyle[uid] ? bstyle[uid].v : 0 });
    setStatus("Online — " + conns.length + " connected");
    queueRegroup();
  });
  c.on("data", d => { try { handle(d, c); } catch(err){ console.error("handle failed", err, d); } });
  c.on("close", () => {
    if(!isHost){ window.__hoQuiet = Date.now() + 25000; window.__rosterSnap = (lastRoster || []).slice(); }   // the host left: hand over quietly
    conns = conns.filter(x => x !== c);
    if(isHost) pushRoster(); else renderOnline([me()]);
    setStatus(isHost ? "Online (hosting)" : "Online — reconnecting…");
    queueRegroup();
    // lost the connection to the room (host left, kicked, network drop) -> straight back to the join screen
    if(!isHost && window.__leave) window.__leave("Disconnected from the room. Rejoin to continue.");
  });
}

function send(d, except){ conns.forEach(c => { if(c !== except && c.open) c.send(d); }); }
function sendEntry(o, from){
  const d = { t: "Y", i: newId(), e: [o] };
  if(o.g){                                           // group message: only the members
    if(!isHost){ send(d); return; }
    const gr = groups[o.g]; if(!gr) return;
    conns.forEach(x => { if(x !== from && x.open && x.uid && gr.m.includes(x.uid)) x.send(d); });
    return;
  }
  if(!o.to){ send(d, from); return; }
  if(!isHost){ send(d); return; }
  const other = from ? (from.uid === o.c ? o.to : o.c) : (o.c === uid ? o.to : o.c);
  conns.forEach(x => { if(x !== from && x.open && x.uid === other) x.send(d); });   // only the other person
}

function validId(i){ return typeof i === "string" && i.length > 0 && i.length < 80; }

function handle(d, from){
  if(!d || typeof d !== "object" || !validId(d.i)) return;
  if(d.t === "P"){
    if(okUid(d.c)) from.uid = d.c;
    if(isHost && typeof d.u === "string"){
      from.userName = d.u.slice(0, 12); from.avatar = okAv(d.a); from.device = okDev(d.d);
      if(window.__pbCanonUid) window.__pbCanonUid(from, from.userName);   // same name on another device = same DMs + group chats
      if(!from.sentS && from.uid){
        from.sentS = 1;
        Object.values(groups).forEach(g => { if(g.m.includes(from.uid)) from.send({ t: "G", i: newId(), g }); });
        const mine = logs.filter(l => (l.to && (l.to === from.uid || l.c === from.uid)) || (l.g && groups[l.g] && groups[l.g].m.includes(from.uid)));
        if(mine.length) from.send({ t: "S", i: newId(), s: mine.map(l => [l.i, l.v || 0, rxv(l)]) });   // private/group sync, only for that person
      }
      pushRoster();
    }
    return;
  }
  if(d.t === "R"){ if(!isHost && Array.isArray(d.list)) renderOnline(d.list.slice(0, 50).filter(x => x && typeof x.n === "string").map(x => ({ n: x.n.slice(0, 12), a: okAv(x.a), d: okDev(x.d), c: okUid(x.c) ? x.c : "" }))); return; }
  if(d.t === "G") return;   // group chats were removed
  if(d.t === "S"){ answerSummary(d, from); return; }
  if(d.t === "Y"){
    const changed = [];
    (Array.isArray(d.e) ? d.e : []).slice(0, 200).forEach(e => {
      const o = cleanEntry(e); if(!o) return;
      if(isHost && o.eh && o.eh.length){
        const cur0 = logs.find(l => l.i === o.i), n0 = cur0 && cur0.eh ? cur0.eh.length : 0;
        if(o.eh.length < n0) o.eh = cur0.eh.slice();
        else if(o.eh.length > n0){ const h = o.eh[o.eh.length - 1]; if(from.uid) h.c = from.uid; if(from.userName) h.u = from.userName.slice(0, 12); }   // the host knows who really sent it
      }
      if(isHost && o.rx){ const r = vetRx(o, from); if(r) o.rx = r; else delete o.rx; }
      if(o.to){
        if(isHost){ if(!from.uid || (from.uid !== o.c && from.uid !== o.to)) return; }   // sender must be a participant
        else if(o.to !== uid && o.c !== uid) return;
      }
      if(o.g){
        if(isHost){ const gr = groups[o.g]; if(!gr || !from.uid || !gr.m.includes(from.uid)) return; }   // only members can post
        else if(!isMember(o.g)) return;
      }
      if(mergeEntry(o)) changed.push(o);
    });
    if(d.bs && typeof d.bs === "object") Object.keys(d.bs).forEach(k => { const s = d.bs[k]; if(s && typeof s === "object") setBstyle(k, s.bc, s.bi, s.v); });
    if(changed.length){
      logs.sort((a, b) => (a.ts || 0) - (b.ts || 0)); persist();
      changed.forEach(applyToDom);
      changed.forEach(o => { if(o.u){ delete typers[o.u]; delete typWhere[o.u]; } }); renderTyping();   // they sent their message, so stop "typing"
      if(isHost){
        const pub = changed.filter(o => !o.to && !o.g);
        if(pub.length) send({ t: "Y", i: newId(), e: pub }, from);
        changed.filter(o => o.to || o.g).forEach(o => sendEntry(o, from));   // DMs / groups go only to the people in them
      }
      dmChanged(changed);
    }
    return;
  }
  if(d.t === "RD"){
    const ch = ["main", "shame", "dm", "grp"].includes(d.ch) ? d.ch : "main", ts = +d.ts || 0;
    if(ts <= 0 || ts > Date.now() + 60000) return;
    const ctx = { ch, c: okUid(d.c) ? d.c : "", to: okUid(d.to) ? d.to : "", g: okGid(d.g) ? d.g : "" };
    if(isHost){
      if(from && from.uid) ctx.c = from.uid;
      if(ch === "dm" && !ctx.to) return;
      if(ch === "grp"){ const gr = groups[ctx.g]; if(!gr || !from || !from.uid || !gr.m.includes(from.uid)) return; }
      d.ch = ch; d.c = ctx.c;
    }
    const forMe = ch === "dm" ? ctx.to === uid : ch === "grp" ? isMember(ctx.g) : true;
    if(forMe && ctx.c && window.recordSeen) window.recordSeen(ctx, String(d.u || "").slice(0, 12), ts);
    if(isHost) routeTyping(d, from);
    return;
  }
  if(d.t === "T"){
    const ch = ["main", "shame", "dm", "grp"].includes(d.ch) ? d.ch : "main";
    const ctx = { ch, c: okUid(d.c) ? d.c : "", to: okUid(d.to) ? d.to : "", g: okGid(d.g) ? d.g : "" };
    if(isHost){
      if(from && from.uid) ctx.c = from.uid;
      if(ch === "dm" && !ctx.to) return;
      if(ch === "grp"){ const gr = groups[ctx.g]; if(!gr || !from || !from.uid || !gr.m.includes(from.uid)) return; }   // only members can type to a group
      d.ch = ch; d.c = ctx.c;
    }
    const forMe = ch === "dm" ? ctx.to === uid : ch === "grp" ? isMember(ctx.g) : true;
    if(typeof d.u === "string" && forMe){
      const n = d.u.slice(0, 12);
      if(d.s){ delete typers[n]; delete typWhere[n]; } else { typers[n] = Date.now() + 5000; typWhere[n] = ctx; }
      renderTyping();
    }
    if(isHost) routeTyping(d, from);     // DMs go only to the person, groups only to the members
    return;
  }
  if(d.t === "B"){ if(setBstyle(d.c, d.bc, d.bi, d.v) && isHost) send(d, from); return; }
  if(d.t === "N" && typeof d.u === "string" && typeof d.b === "string"){
    sys(d.u.slice(0,12) + " is now " + d.b.slice(0,12));
    if(isHost){ from.userName = d.b.slice(0, 12); pushRoster(); }
  } else return;
  if(isHost) send(d, from);
}

const okEmo = x => typeof x === "string" && x.length <= 20 && /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(x) && !/[A-Za-z0-9<>&"'\s]/.test(x);
const ANON_RE = /^~[0-9a-f]{16}$/;          // an anonymous voter: a random per-poll token made on the voter's own device, never a user id
const anonCast = new Map();                  // host, memory only (never saved or sent): poll id -> senders that already cast an anonymous vote, so nobody can stuff the box
function cleanRx(r){
  if(!r || typeof r !== "object") return null;
  const out = {}; let n = 0;
  for(const k of Object.keys(r)){
    if(!(okUid(k) || ANON_RE.test(k)) || n >= 60) continue;
    const x = r[k]; if(!x || typeof x !== "object") continue;
    out[k] = { e: [...new Set((Array.isArray(x.e) ? x.e : []).filter(okEmo))].slice(0, 8), v: +x.v || 0 };
    if(typeof x.t === "string"){ const t = x.t.replace(/\s+/g, " ").trim().slice(0, 80); if(t) out[k].t = t; }   // t = a typed answer (polls where people type instead of choosing)
    n++;
  }
  return n ? out : null;
}
const cleanFn = n => String(n || "file").replace(/[\\\/:*?"<>|\u0000-\u001f]/g, "_").slice(0, 80) || "file";
function cleanPoll(p){
  if(!p || typeof p !== "object") return null;
  const q = String(p.q || "").trim().slice(0, 200);
  const os = (Array.isArray(p.o) ? p.o : []).map(x => String(x || "").trim().slice(0, 80)).filter(Boolean).slice(0, 8);
  if(p.t){ if(!q) return null; return { q, o: [], t: 1, m: 0, ...(p.an ? { an: 1 } : {}), end: Math.max(0, Math.min(Date.now() + 8 * 864e5, +p.end || 0)) }; }   // t = people type their own answer
  if(!q || os.length < 2) return null;
  return { q, o: os, m: p.m ? 1 : 0, ...(p.an ? { an: 1 } : {}), end: Math.max(0, Math.min(Date.now() + 8 * 864e5, +p.end || 0)) };
}
const GIF_RE = /^https:\/\/(?:media\d*\.tenor\.com|c\.tenor\.com|media\d*\.giphy\.com|i\.giphy\.com|i\.imgur\.com|(?:[a-z0-9-]+\.)?klipy\.(?:com|co))\/[A-Za-z0-9_\-.\/%~]{1,170}\.gif$/;   // GIF messages carry a KLIPY (or older Tenor) link, not image data
function cleanEntry(e){
  if(!e || typeof e !== "object" || !validId(e.i)) return null;
  const o = { i: e.i, v: +e.v || 0, ts: +e.ts || 0 };
  if(e.del){
    o.del = true;
    if(e.to){ if(!okUid(e.to) || !okUid(e.c)) return null; o.to = e.to; o.c = e.c; o.ch = "dm"; }
    return o;
  }
  if(typeof e.u !== "string" || typeof e.b !== "string") return null;
  o.u = e.u.slice(0, 12); o.c = okUid(e.c) ? e.c : ""; o.f = okFont(e.f); o.d = okDev(e.d);
  if(e.img && e.gif){ if(e.b.length > 260 || !GIF_RE.test(e.b)) return null; o.img = 1; o.gif = 1; }
  else if(e.img){ if(!e.b.startsWith("data:image/") || e.b.length > 4500000) return null; o.img = 1; if(e.stk) o.stk = 1; }
  else if(e.aud){ if(!e.b.startsWith("data:audio/") || e.b.length > 1800000) return null; o.aud = 1; if(typeof e.tx === "string"){ const tx = e.tx.replace(/\s+/g, " ").trim().slice(0, 500); if(tx) o.tx = tx; } }   // tx = voice message transcript
  else if(e.fl){ if(!/^data:[\w.+\-\/]*;base64,[A-Za-z0-9+\/=]*$/.test(e.b) || e.b.length > 3500000) return null; o.fl = 1; o.fn = cleanFn(e.fn); o.fz = Math.max(0, Math.min(1e8, +e.fz || 0)); }
  else if(e.poll){ const pl = cleanPoll(e.poll); if(!pl || e.b.length >= 300) return null; o.poll = pl; }
  else if(e.b.length >= 2000) return null;
  o.b = e.b;
  if(e.to){
    if(!okUid(e.to) || !o.c || e.to === o.c) return null;
    o.to = e.to; o.tn = String(e.tn || "").slice(0, 12); o.ch = "dm";
  } else if(e.g){
    return null;   // group chats were removed
  } else if(e.ch === "gal" && o.img) o.ch = "gal";   // gallery only accepts images
  else if(e.ch === "polls"){ if(!o.poll) return null; o.ch = "polls"; }   // the Polls tab only ever holds polls
  else if(e.ch === "shame" && !o.aud) o.ch = "shame";   // hall of shame: text or photos
  if(e.edited) o.edited = true;
  if(Array.isArray(e.eh) && !(o.img || o.aud || o.fl || o.poll)) o.eh = e.eh.slice(0, 10).filter(h => h && typeof h.o === "string").map(h => ({ o: h.o.slice(0, 1999), u: String(h.u || "").slice(0, 12), c: okUid(h.c) ? h.c : "", t: +h.t || 0 }));
  if(e.sp && (o.img || !(o.aud || o.fl || o.poll))) o.sp = 1;     // spoiler: blurred until clicked
  if(e.r && typeof e.r === "object" && validId(e.r.i)){      // reply: id + name + short preview of the original
    o.r = { i: e.r.i, u: String(e.r.u || "").slice(0, 12), t: String(e.r.t || "").slice(0, 80), m: e.r.m ? 1 : 0 };
    if(e.r.fw) o.r.fw = String(e.r.fw).slice(0, 20);
  }
  if(o.to){ if(e.hd && o.r) o.hd = 1; else return null; }     // 1-on-1 DMs are gone: a message to one person must be a hidden reply
  let rx = cleanRx(e.rx);
  if(rx){ const an = !!(o.poll && o.poll.an); Object.keys(rx).forEach(k => { if(an !== ANON_RE.test(k)) delete rx[k]; }); if(!Object.keys(rx).length) rx = null; }   // anonymous polls hold only anonymous tokens, everything else only real user ids: so a vote in an anonymous poll can never carry an identifier
  if(rx) o.rx = rx;
  return o;
}
/* reactions are stored per person ({uid: {e:[emoji], v:time}}) and merged person by person, so two people
   reacting at the same moment never overwrite each other */
function mergeRx(a, b){
  const out = {};
  [a, b].forEach(src => { if(src) Object.keys(src).forEach(k => { if(!out[k] || (src[k].v || 0) > (out[k].v || 0)) out[k] = src[k]; }); });
  return out;
}
const rxSig = r => r ? Object.keys(r).sort().map(k => k + ":" + (r[k].v || 0)).join("|") : "";
const rxv = l => l && l.rx ? Math.max(0, ...Object.values(l.rx).map(x => x.v || 0)) : 0;
function vetRx(o, from){   // host: a person may only change their own reactions
  const cur = logs.find(l => l.i === o.i), out = {};
  if(cur && cur.poll && cur.poll.end && Date.now() > cur.poll.end + 5000) return null;   // poll is closed
  const anon = !!((cur && cur.poll) ? cur.poll.an : (o.poll && o.poll.an)), claimed = {};
  /* "is this key the sender's own?": a user id must be the sender's. In an anonymous poll the key is a secret token, so
     holding it is the proof; a NEW token is accepted once per sender (remembered in memory only, and never next to the token) */
  const own = k => {
    if(!anon) return k === from.uid;
    if(!ANON_RE.test(k)) return false;
    if(cur && cur.rx && cur.rx[k]) return true;
    if(k in claimed) return claimed[k];
    const set = anonCast.get(o.i) || new Set(); if(!from.uid || set.has(from.uid)) return (claimed[k] = false);
    set.add(from.uid); anonCast.set(o.i, set); return (claimed[k] = true);
  };
  Object.keys(o.rx).forEach(k => {
    const same = cur && cur.rx && cur.rx[k] && (cur.rx[k].v || 0) >= (o.rx[k].v || 0);
    if(cur && cur.poll && cur.poll.t){                                                              // typed-answer poll: text only, and final on the Polls tab
      if(own(k) && cur.ch === "polls" && cur.rx && cur.rx[k] && cur.rx[k].t){ out[k] = cur.rx[k]; return; }
      if(own(k) || same) out[k] = { e: [], v: o.rx[k].v || 0, ...(o.rx[k].t ? { t: o.rx[k].t } : {}) };
      return;
    }
    if(own(k) && cur && cur.poll && cur.ch === "polls" && cur.rx && cur.rx[k]){           // poll votes are final: keep what they already voted, only allow adding (multi-answer polls)
      const VTS = ["🔴","🔵","⚫","⚪","🔶","🔷","🔸","🔹"], had = (cur.rx[k].e || []).filter(e => VTS.includes(e));
      if(had.length){ const ne = cur.poll.m ? [...new Set([...had, ...(o.rx[k].e || [])])] : had.slice(); out[k] = { e: ne, v: Math.max(o.rx[k].v || 0, cur.rx[k].v || 0) }; return; }
    }
    if(own(k) || same) out[k] = o.rx[k];
  });
  return Object.keys(out).length ? out : null;
}
function mergeEntry(o){
  const cur = logs.find(l => l.i === o.i);
  if(!cur){ logs.push(o); return true; }
  const rx = (!o.del && (cur.rx || o.rx)) ? mergeRx(cur.rx, o.rx) : null;
  if(o.v > (cur.v || 0)){
    Object.keys(cur).forEach(k => delete cur[k]); Object.assign(cur, o);
    if(rx && Object.keys(rx).length){ cur.rx = rx; o.rx = rx; } else { delete cur.rx; delete o.rx; }
    return true;
  }
  if(cur.del) return false;
  if(rx && rxSig(rx) !== rxSig(cur.rx)){ cur.rx = rx; o.rx = rx; return true; }
  return false;
}
function answerSummary(d, from){
  const theirs = new Map();
  (Array.isArray(d.s) ? d.s : []).forEach(p => { if(Array.isArray(p) && typeof p[0] === "string") theirs.set(p[0], [+p[1] || 0, +p[2] || 0]); });
  if(from.open) from.send({ t: "Y", i: newId(), e: [], bs: bstyle });
  let batch = [], size = 0;
  const flush = () => { if(batch.length && from.open) from.send({ t: "Y", i: newId(), e: batch }); batch = []; size = 0; };
  const canSee = l => (!l.to && !l.g) || !isHost || (from.uid && ((l.to && (l.to === from.uid || l.c === from.uid)) || (l.g && groups[l.g] && groups[l.g].m.includes(from.uid))));
  logs.filter(l => canSee(l) && (!theirs.has(l.i) || (l.v || 0) > theirs.get(l.i)[0] || rxv(l) > theirs.get(l.i)[1])).slice(-80).forEach(l => {
    const s = (l.b || "").length + 200;
    if(batch.length && (size + s > 400000 || batch.length >= 50)) flush();
    batch.push(l); size += s;
  });
  flush();
}

/* ---------- emoji library (loads the full Unicode set automatically) ---------- */
const GROUP_ICONS = { 0:"😀", 1:"👋", 3:"🐶", 4:"🍔", 5:"✈️", 6:"⚽", 7:"💡", 8:"❤️", 9:"🏳️" };
const GROUP_NAMES = { 0:"Smileys & emotion", 1:"People", 3:"Animals & nature", 4:"Food & drink", 5:"Travel & places", 6:"Activities", 7:"Objects", 8:"Symbols", 9:"Flags" };
let EMO_LIST = [], emoLoading = true;
const EMOJI_MAP = {};
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
function addEmo(list, e, g, names, tags){
  names = names.map(n => String(n).toLowerCase()).filter(Boolean);
  list.push({ e, g: String(g), names, tags: (tags || []).map(t => String(t).toLowerCase()) });
  names.forEach(n => {
    if(!EMOJI_MAP[n]) EMOJI_MAP[n] = e;
    const u = n.replace(/-/g, "_"); if(u !== n && !EMOJI_MAP[u]) EMOJI_MAP[u] = e;
  });
}
// common shortcodes always work, even offline
const QUICK = {};
("smile=😄 grin=😁 joy=😂 rofl=🤣 smiley=😃 blush=😊 wink=😉 heart_eyes=😍 kissing_heart=😘 sunglasses=😎 thinking=🤔 sweat_smile=😅 cry=😢 sob=😭 angry=😡 rage=🤬 pleading=🥺 sleeping=😴 exploding_head=🤯 partying=🥳 eyeroll=🙄 grimacing=😬 innocent=😇 zany=🤪 smirk=😏 scream=😱 hugging=🤗 neutral=😐 expressionless=😑 sad=😞 worried=😟 confused=😕 upside_down=🙃 nerd=🤓 cold=🥶 hot=🥵 sick=🤢 skull=💀 ghost=👻 clown=🤡 poop=💩 100=💯 fire=🔥 sparkles=✨ tada=🎉 star=⭐ zap=⚡ boom=💥 sweat_drops=💦 " +
"thumbsup=👍 thumbsdown=👎 clap=👏 raised_hands=🙌 pray=🙏 muscle=💪 handshake=🤝 wave=👋 peace=✌️ crossed_fingers=🤞 ok_hand=👌 point_up=☝️ point_right=👉 point_left=👈 fist=✊ eyes=👀 brain=🧠 " +
"heart=❤️ broken_heart=💔 blue_heart=💙 green_heart=💚 purple_heart=💜 yellow_heart=💛 black_heart=🖤 white_heart=🤍 orange_heart=🧡 " +
"dog=🐶 cat=🐱 horse=🐴 unicorn=🦄 monkey=🐵 pig=🐷 frog=🐸 snake=🐍 bear=🐻 lion=🦁 " +
"pizza=🍕 burger=🍔 fries=🍟 taco=🌮 beer=🍺 coffee=☕ cake=🎂 cookie=🍪 apple=🍎 banana=🍌 " +
"soccer=⚽ basketball=🏀 football=🏈 video_game=🎮 music=🎵 guitar=🎸 rocket=🚀 car=🚗 moon=🌙 sun=☀️ rainbow=🌈 snowflake=❄️ money=💰 gift=🎁 crown=👑 trophy=🏆 check=✅ x=❌ warning=⚠️ question=❓ lol=😂 skull_crossbones=☠️ thumbs-up=👍 thumbs-down=👎 slightly-happy=🙂 scrunched-eyes=😣 party-popper=🎉 plus-sign=➕ plus=➕ heart-eyes=😍 raised-hands=🙌").split(" ").forEach(p => {
  const i = p.indexOf("="); if(i > 0){ QUICK[p.slice(0, i)] = p.slice(i + 1); EMOJI_MAP[p.slice(0, i)] = p.slice(i + 1); }
});
function quickList(){
  const seen = new Set(), list = [];
  Object.keys(QUICK).forEach(k => { if(!seen.has(QUICK[k])){ seen.add(QUICK[k]); addEmo(list, QUICK[k], 0, [k], []); } });
  return list;
}
// 1) use embedded data if you pasted it, 2) otherwise start with the quick list and download the full set
if(typeof EMO_DATA === "object" && Object.keys(EMO_DATA).length){
  Object.keys(EMO_DATA).forEach(g => EMO_DATA[g].split(";").forEach(row => {
    const [e, n, t] = row.split("|");
    addEmo(EMO_LIST, e, g, n ? n.split(",") : [], t ? t.split(",") : []);
  }));
  emoLoading = false;
} else { EMO_LIST = quickList(); }

async function loadEmojiLib(){
  const base = "https://cdn.jsdelivr.net/npm/emojibase-data@15.3.2/en/";
  try {
    const [dr, sr] = await Promise.all([fetch(base + "data.json"), fetch(base + "shortcodes/github.json").catch(() => null)]);
    if(!dr.ok) throw new Error("emoji data " + dr.status);
    const data = await dr.json();
    let sc = {}; try { if(sr && sr.ok) sc = await sr.json(); } catch(e){}
    const list = [];
    data.forEach(o => {
      if(!o || !o.emoji || o.group === undefined || o.group === 2) return;
      const codes = [].concat(sc[o.hexcode] || []);
      addEmo(list, o.emoji, o.group, [...codes, slug(o.label || "")], o.tags || []);
    });
    if(list.length > 200) EMO_LIST = list;
  } catch(err){ console.warn("Full emoji set unavailable, using quick list", err); }
  emoLoading = false;
  if(window.refreshEmojiPicker) window.refreshEmojiPicker();
}
let emoStarted = false;
function ensureEmoji(){ if(emoStarted || !emoLoading) return; emoStarted = true; loadEmojiLib(); }
if(emoLoading){                                          // the full emoji set (hundreds of KB) isn't needed to open the chat:
  const kick = () => setTimeout(ensureEmoji, 4000);      // fetch it a few seconds after the page is up, or the moment the picker is opened
  if(document.readyState === "complete") kick(); else window.addEventListener("load", kick);
}

/* ---------- emoji picker (Google Docs style, light) ---------- */
function insertAtCursor(t){
  const i = $("inp"), s = i.selectionStart == null ? i.value.length : i.selectionStart, e = i.selectionEnd == null ? s : i.selectionEnd;
  i.value = i.value.slice(0, s) + t + i.value.slice(e);
  const p = s + t.length; i.focus(); try { i.setSelectionRange(p, p); } catch(x){}
  updateSendBtn();
}
(function buildPicker(){
  const panel = $("emo-panel");
  const q = document.createElement("input"); q.id = "emo-q"; q.placeholder = "Search emojis"; q.autocomplete = "off";
  const tabs = document.createElement("div"); tabs.id = "emo-tabs";
  const title = document.createElement("div"); title.id = "emo-title";
  const grid = document.createElement("div"); grid.id = "emo-grid";
  const foot = document.createElement("div"); foot.id = "emo-foot";
  panel.append(q, tabs, title, grid, foot);
  let cur = "0";
  function fill(list){
    grid.innerHTML = "";
    if(!list.length){ const n = document.createElement("div"); n.className = "none"; n.textContent = emoLoading ? "Loading emojis…" : "No emoji found"; grid.appendChild(n); return; }
    const frag = document.createDocumentFragment();
    list.forEach(o => {
      const sp = document.createElement("span"); sp.textContent = o.e;
      sp.onmouseenter = () => { foot.textContent = o.e + "   :" + (o.names[0] || "") + ":"; };
      sp.onclick = () => (window.__rxPick ? window.__rxPick(o.e) : insertAtCursor(o.e));
      frag.appendChild(sp);
    });
    grid.appendChild(frag);
  }
  function show(g){
    cur = String(g);
    [...tabs.children].forEach(t => t.classList.toggle("on", t.dataset.g === cur));
    title.textContent = GROUP_NAMES[cur] || "";
    fill(EMO_LIST.filter(o => o.g === cur)); grid.scrollTop = 0;
    foot.textContent = emoLoading ? "Loading all emojis…" : EMO_LIST.length + " emojis";
  }
  Object.keys(GROUP_ICONS).forEach(g => {
    const t = document.createElement("span"); t.textContent = GROUP_ICONS[g]; t.dataset.g = g; t.title = GROUP_NAMES[g];
    t.onclick = () => { q.value = ""; show(g); };
    tabs.appendChild(t);
  });
  function search(){
    const raw = q.value.trim().toLowerCase(), v = slug(raw);
    if(!raw){ show(cur); return; }
    [...tabs.children].forEach(t => t.classList.remove("on"));
    title.textContent = "Results";
    fill(EMO_LIST.filter(o => o.names.some(n => n.includes(v)) || o.tags.some(t => t.includes(raw))).slice(0, 300));
  }
  q.addEventListener("input", search);
  window.refreshEmojiPicker = () => { if(q.value.trim()) search(); else show(cur); };
  show("0");
})();
$("emo-panel").classList.add("anim-pop");
$("emo-btn").onclick = () => { ensureEmoji(); if(window.__rxPick){ cancelReact(); return; } const p = $("emo-panel"), open = p.style.display === "flex" && !p.classList.contains("closing"); setShown(p, !open, "flex"); if(!open) $("emo-q").focus(); };

/* ---------- :shortcodes: popup (searches every emoji name) ---------- */
function suggest(q){
  const keys = Object.keys(EMOJI_MAP), seen = new Set(), out = [];
  (window.__ceNames ? window.__ceNames() : []).filter(k => k.includes(q))
    .sort((a, b) => (a.startsWith(q) ? 0 : 1) - (b.startsWith(q) ? 0 : 1)).forEach(k => out.push("ce:" + k));   // custom emojis first
  for(const pass of [0, 1]) for(const k of keys){
    if(out.length >= 60) return out;
    if(!(pass === 0 ? k.startsWith(q) : k.includes(q)) || seen.has(EMOJI_MAP[k])) continue;
    seen.add(EMOJI_MAP[k]); out.push(k);
  }
  return out;
}
function replaceCodes(t){ return t.replace(/:([a-z0-9_+-]+):/gi, (m, n) => EMOJI_MAP[n.toLowerCase()] || m); }
let sugList = [], sugIdx = 0;
const DEFAULT_SUG = ["thumbs-up","clap","slightly-happy","smile","joy","scrunched-eyes","rage","party-popper","plus-sign"];
function hideSug(){ $("emo-sug").style.display = "none"; sugList = []; }
function highlightSug(){
  [...$("emo-sug").querySelectorAll(".item")].forEach((d, n) => {
    d.classList.toggle("sel", n === sugIdx);
    if(n === sugIdx) d.scrollIntoView({ block: "nearest" });
  });
}
function pickSug(name){
  const el = $("inp"), pos = el.selectionStart, before = el.value.slice(0, pos), after = el.value.slice(pos);
  const nb = before.replace(/(^|\s):[a-z0-9_+-]*$/i, (m, a) => a + (name.indexOf("ce:") === 0 ? ":" + name.slice(3) + ":" : EMOJI_MAP[name]) + " ");
  el.value = nb + after; el.setSelectionRange(nb.length, nb.length); el.focus(); hideSug(); updateSendBtn();
}
function showSug(){
  const el = $("inp"), m = el.value.slice(0, el.selectionStart).match(/(?:^|\s):([a-z0-9_+-]*)$/i);
  if(!m){ hideSug(); return; }
  const q = m[1].toLowerCase();
  sugList = q ? suggest(q) : [...(window.__ceNames ? window.__ceNames() : []).map(k => "ce:" + k), ...DEFAULT_SUG.filter(k => EMOJI_MAP[k])];
  sugIdx = 0;
  if(!sugList.length){ hideSug(); return; }
  const box = $("emo-sug"); box.innerHTML = "";
  const hd = document.createElement("div"); hd.className = "hd";
  hd.append(document.createTextNode("EMOJIS"));
  const ch = document.createElement("i"); ch.textContent = "›"; hd.appendChild(ch);
  box.appendChild(hd);
  sugList.forEach(k => {
    const d = document.createElement("div"); d.className = "item";
    const isC = k.indexOf("ce:") === 0, nm = isC ? k.slice(3) : k;
    const e = document.createElement("span"); e.className = "e";
    if(isC){ const ci = document.createElement("img"); ci.src = window.__ceImg(nm); ci.alt = ""; ci.style.cssText = "width:22px;height:22px;object-fit:contain;vertical-align:middle"; e.appendChild(ci); }
    else e.textContent = EMOJI_MAP[k];
    const n = document.createElement("span"); n.textContent = ":" + nm + ":";
    d.append(e, n);
    d.onmousedown = ev => { ev.preventDefault(); pickSug(k); };
    box.appendChild(d);
  });
  box.style.display = "block"; highlightSug();
}
$("inp").addEventListener("input", () => {
  const el = $("inp"), before = el.value, pos = el.selectionStart, after = replaceCodes(before);
  if(after !== before){ el.value = after; const np = Math.max(0, pos + after.length - before.length); el.setSelectionRange(np, np); }
  showSug(); updateSendBtn();
});
$("inp").addEventListener("keydown", e => {
  if(!sugList.length) return;
  if(e.key === "ArrowDown"){ e.preventDefault(); sugIdx = (sugIdx + 1) % sugList.length; highlightSug(); }
  else if(e.key === "ArrowUp"){ e.preventDefault(); sugIdx = (sugIdx - 1 + sugList.length) % sugList.length; highlightSug(); }
  else if(e.key === "Tab" || e.key === "Enter"){ e.preventDefault(); pickSug(sugList[sugIdx]); }
  else if(e.key === "Escape") hideSug();
});
$("inp").addEventListener("blur", () => setTimeout(hideSug, 120));

/* ---------- typing indicator ---------- */
const typers = {}, typWhere = {};
let lastTyped = 0, lastTypeKey = "";
function typeCtx(){ return curCh === "dm" && dmWith ? (dmWith[0] === "g" ? { ch: "grp", g: dmWith.slice(2) } : { ch: "dm", to: dmWith.slice(2) }) : { ch: curCh }; }
function routeTyping(m, from){
  if(!isHost){ send(m); return; }
  if(m.ch === "dm") conns.forEach(x => { if(x !== from && x.open && x.uid === m.to) x.send(m); });
  else if(m.ch === "grp"){ const gr = groups[m.g]; if(gr) conns.forEach(x => { if(x !== from && x.open && x.uid && gr.m.includes(x.uid)) x.send(m); }); }
  else send(m, from);
}
function sendTyping(stop){
  const c = typeCtx(), m = { t: "T", u: usr, c: uid, i: newId(), ch: c.ch };
  if(c.to) m.to = c.to; if(c.g) m.g = c.g; if(stop) m.s = 1;
  routeTyping(m, null);
}
const tabLabel = k => { const b = document.querySelector('#chtabs button[data-ch="' + k + '"]'); return b ? b.textContent.trim() : (k === "shame" ? "Hall of Shame" : k === "polls" ? "Polls" : "Chat"); };
function renderTyping(){
  const now = Date.now();
  Object.keys(typers).forEach(k => { if(typers[k] < now) delete typers[k]; });
  const names = Object.keys(typers).filter(n => n !== usr), el = $("typing");
  const key = names.join("|"); if(key !== lastTypeKey){ lastTypeKey = key; renderPop(); }   // keep the Online lists in sync
  if(!names.length){ el.replaceChildren(); return; }
  const fmt = a => a.length === 1 ? a[0] + " is typing"
    : a.length === 2 ? a[0] + " and " + a[1] + " are typing"
    : a.length === 3 ? a[0] + ", " + a[1] + " and " + a[2] + " are typing"
    : "Several people are typing";
  const here = [], other = {};          // typing in the room I'm looking at / typing somewhere else
  names.forEach(n => {
    const c = typWhere[n] || { ch: "main" };
    const same = c.ch === "dm" ? (curCh === "dm" && dmWith === "d:" + c.c) : c.ch === "grp" ? (curCh === "dm" && dmWith === "g:" + c.g) : curCh === c.ch;
    if(same) here.push(n);
    else {
      const where = c.ch === "dm" ? " a hidden reply" : c.ch === "grp" ? " in " + ((groups[c.g] || {}).n || "a group chat") : " in " + tabLabel(c.ch);
      (other[where] = other[where] || []).push(n);
    }
  });
  const txt = [here.length ? fmt(here) : "", ...Object.keys(other).map(w => fmt(other[w]) + w)].filter(Boolean).join(" · ");
  const s = document.createElement("span"); s.textContent = txt;
  const dots = document.createElement("span"); dots.className = "dots"; dots.innerHTML = "<i></i><i></i><i></i>";
  const avs = names.slice(0, 3).map(n => { const a = document.createElement("div"); a.className = "tav"; paintAv(a, n); return a; });
  el.replaceChildren(...avs, s, dots);
}
tick(renderTyping, 1000);
$("inp").addEventListener("input", () => {
  if(curCh === "gal" || curCh === "draw") return;
  if($("inp").value.trim()){
    if(Date.now() - lastTyped > 2500){ lastTyped = Date.now(); sendTyping(false); }
  } else if(lastTyped){ lastTyped = 0; sendTyping(true); }
});

/* ---------- sending ---------- */
function newId(){ return "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8); }

let curCh = "main";
function setChannel(c){
  if(c !== "dm"){ dmWith = ""; dmNm = ""; }
  curCh = c;
  document.body.classList.toggle("in-gal", c === "gal");
  document.body.classList.toggle("in-shame", c === "shame");
  document.body.classList.toggle("in-polls", c === "polls");
  document.body.classList.toggle("in-dm", c === "dm");
  $("ch-main").classList.toggle("active", c === "main");
  $("ch-gal").classList.toggle("active", c === "gal");
  $("ch-shame").classList.toggle("active", c === "shame");
  $("ch-polls").classList.toggle("active", c === "polls");
  document.querySelectorAll("#chtabs button").forEach(b => b.classList.toggle("on", b.dataset.ch === c));
  $("emo-panel").style.display = "none"; hideSug();
  if(replyTo && replyTo.fw) showReply(); else clearReply();      // a pending forward follows you to the other channel
  if(c !== "dm") $("inp").placeholder = c === "polls" ? "Polls only: tap + then Create poll" : (PH[document.body.dataset.theme] || "Message");
  $("sb").classList.remove("open");
  updateDmBar(); renderDMList();
  resetWin(); rerender(); regroup();                      // draw only the newest messages of this channel
  const b = $("box"); b.scrollTop = b.scrollHeight; if(window.__jump) window.__jump.reset();
  b.classList.remove("swap"); void b.offsetWidth; b.classList.add("swap"); setTimeout(() => b.classList.remove("swap"), 300);
}
$("ch-main").onclick = () => setChannel("main");
$("ch-gal").onclick = () => setChannel("gal");
$("ch-shame").onclick = () => setChannel("shame");
$("ch-polls").onclick = () => setChannel("polls");
document.querySelectorAll("#chtabs button").forEach(b => b.onclick = () => setChannel(b.dataset.ch));

/* ---------- spoilers: the sender can blur their message / photo until someone clicks it ---------- */
let mySpoiler = load("chat_sp", "0") === "1";
function setSpoiler(on){
  mySpoiler = !!on; save("chat_sp", on ? "1" : "0");
  const b = document.getElementById("sp-btn"); if(b){ b.classList.toggle("on", mySpoiler); b.title = mySpoiler ? "Spoiler ON: your messages will be blurred" : "Send as spoiler (blurred until clicked)"; }
  const c = document.getElementById("spchk"); if(c) c.checked = mySpoiler;
}
function wrapSpoiler(wrap){
  const el = wrap.querySelector(":scope > .bubble, :scope > .img"); if(!el) return;
  const box = document.createElement("div"); box.className = "spbox";
  const tag = document.createElement("div"); tag.className = "sptag"; tag.textContent = "SPOILER";
  wrap.insertBefore(box, el); box.append(el, tag);
  box.addEventListener("click", ev => {            // capture: reveal first, don't open the photo viewer
    ev.stopPropagation(); ev.preventDefault();
    box.parentNode.insertBefore(el, box); box.remove();
  }, true);
}
function postMsg(b, img, aud, extra){
  if(curCh === "polls" && !(extra && extra.poll)){ sys("The Polls tab is for polls only. Tap + then “Create poll”."); return; }
  const now = Date.now(), o = { i: newId(), u: usr, c: uid, b, ts: now, v: now, d: myDevice };
  if(img){ o.img = 1; if(curCh === "gal") o.ch = "gal"; } else if(aud){ o.aud = 1; if(window.__pbTx) o.tx = String(window.__pbTx).replace(/\s+/g, " ").trim().slice(0, 500); } else o.f = myFont;
  if(extra){
    if(curCh === "gal"){ sys("The gallery is for photos only."); return; }
    if(extra.stk) o.stk = 1;
    if(extra.gif) o.gif = 1;
    if(extra.fl){ o.fl = 1; o.fn = cleanFn(extra.fn); o.fz = extra.fz || 0; delete o.f; }
    if(extra.poll){ o.poll = cleanPoll(extra.poll); if(!o.poll) return; delete o.f; }
  }
  if(mySpoiler && !aud && !(extra && (extra.fl || extra.poll))) o.sp = 1;
  if(curCh === "polls") o.ch = "polls";
  if(curCh === "shame" && !aud) o.ch = "shame";
  if(curCh === "dm" && dmWith){
    if(dmWith[0] === "g"){ o.g = dmWith.slice(2); o.ch = "grp"; } else { o.to = dmWith.slice(2); o.tn = dmNm; o.ch = "dm"; }
  }
  if(replyTo && curCh !== "gal"){
    if(replyHidden && hideOK() && !o.ch && !o.g){ o.to = replyTo.c; o.tn = String(replyTo.tn || replyTo.u || "").slice(0, 12); o.ch = "dm"; o.hd = 1; }   // hidden reply: sent only to that person
    o.r = { i: replyTo.i, u: replyTo.u, t: replyTo.t, m: replyTo.m }; if(replyTo.fw) o.r.fw = replyTo.fw;
    clearReply();
  }
  logs.push(o); persist(); renderRow(o, true);
  sendEntry(o); renderDMList();
}
setSpoiler(mySpoiler);
document.getElementById("sp-btn").onclick = () => setSpoiler(!mySpoiler);
document.getElementById("spchk").addEventListener("change", e => setSpoiler(e.target.checked));
function updateSendBtn(){ document.querySelector(".pill").classList.toggle("has-text", !!$("inp").value.trim()); }
function sendText(){
  if(curCh === "gal") return;   // gallery is photos only
  if(curCh === "polls"){ if($("inp").value.trim()) sys("The Polls tab is for polls only. Tap + then “Create poll”."); return; }
  const el = $("inp"), v = replaceCodes(el.value.trim());
  if(!v) return;
  hideSug(); postMsg(v, 0); el.value = ""; lastTyped = 0; updateSendBtn();
}
$("inp").addEventListener("keydown", e => { if(e.key === "Enter" && !sugList.length) sendText(); });
$("sendbtn").onclick = () => { sendText(); $("inp").focus(); };

function shrinkImage(url, cb){
  const im = new Image();
  im.onload = () => {
    const sc = Math.min(1, 800 / Math.max(im.width, im.height)), cv = document.createElement("canvas");
    cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc);
    cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
    cb(cv.toDataURL("image/jpeg", 0.7));
  };
  im.onerror = () => cb(url);
  im.src = url;
}
$("fi").addEventListener("change", e => {
  const f = e.target.files[0];
  if(!f) return;
  if(f.size > 10 * 1024 * 1024){ sys("Image too big (10MB max)."); e.target.value = ""; return; }
  const r = new FileReader();
  r.onload = evt => shrinkImage(evt.target.result, d => postMsg(d, 1));
  r.readAsDataURL(f); e.target.value = "";
});

/* ---------- replies ---------- */
let replyTo = null, replyHidden = false;
const hideOK = () => !!(replyTo && !replyTo.fw && replyTo.c && okUid(replyTo.c) && replyTo.c !== uid && curCh === "main");   // a hidden reply needs a real person to send it to
function showReply(){
  const bar = $("replybar"), t = bar.querySelector(".rb-t"), hb = $("replyhide");
  if(!replyTo){ bar.classList.remove("on"); t.textContent = ""; replyHidden = false; hb.classList.remove("can", "on"); return; }
  t.textContent = "";
  const can = hideOK(); if(!can) replyHidden = false;
  hb.classList.toggle("can", can); hb.classList.toggle("on", replyHidden);
  hb.title = replyHidden ? "Hidden reply is ON: only " + (replyTo.tn || replyTo.u) + " will see it" + (replyTo.hf ? "" : " (tap to make it public)") : "Make this a hidden reply: only " + (replyTo.tn || replyTo.u) + " will see it";
  const n = document.createElement("b"); n.textContent = replyTo.fw ? "↪ Forwarding from " + replyTo.fw + " · " + replyTo.u : replyHidden ? "🙈 Hidden reply to " + (replyTo.tn || replyTo.u) + " (only they can see it)" : "Replying to " + replyTo.u;
  t.append(n, document.createTextNode(replyTo.t));
  bar.classList.add("on");
}
function startReply(id){
  if(curCh === "gal") return;
  if(replyTo && replyTo.fw) replyTo = null;
  const l = logs.find(x => x.i === id);
  if(!l || l.del) return;
  replyHidden = false;
  replyTo = { c: l.c, tn: l.u, i: l.i, u: l.u, t: l.sp ? "🙈 Spoiler" : l.img ? "📷 Photo" : l.fl ? "📎 " + l.fn : l.poll ? "📊 " + l.poll.q.slice(0, 60) : l.aud ? "🎤 Voice message" : String(l.b).slice(0, 80), m: (l.img || l.aud || l.fl || l.poll) ? 1 : 0 };
  if(l.hd){ replyTo.c = l.c === uid ? l.to : l.c; replyTo.tn = (l.c === uid ? l.tn : l.u) || l.u; replyTo.hf = 1; replyHidden = true; }   // answering a hidden message stays hidden
  showReply();
  const w = $(id); if(w) w.classList.remove("tap");
  $("inp").focus();
}
function startForward(id){
  const l = logs.find(x => x.i === id);
  if(!l || l.del || l.to || l.g) return;          // never forward private DMs or group chat messages
  const from = l.ch === "gal" ? "Image Gallery" : l.ch === "shame" ? "Hall of Shame" : l.ch === "polls" ? "Polls" : "Chat";
  replyTo = { i: l.i, u: l.u, t: l.sp ? "🙈 Spoiler" : l.img ? "📷 Photo" : l.fl ? "📎 " + l.fn : l.poll ? "📊 " + l.poll.q.slice(0, 60) : l.aud ? "🎤 Voice message" : String(l.b).slice(0, 80), m: (l.img || l.aud || l.fl || l.poll) ? 1 : 0, fw: from };
  showReply();
  const w = $(id); if(w) w.classList.remove("tap");
  sys("Now open the channel you want and send a message: it will quote the message you're forwarding. (Press Esc or ✕ to cancel.)");
  $("inp").focus();
}
function clearReply(){ replyTo = null; replyHidden = false; showReply(); }
$("replyhide").onclick = () => { if(!replyTo || replyTo.hf || !hideOK()) return; replyHidden = !replyHidden; showReply(); $("inp").focus(); };
$("replyx").onclick = () => { clearReply(); $("inp").focus(); };
$("inp").addEventListener("keydown", e => { if(e.key === "Escape" && replyTo && !sugList.length) clearReply(); });

/* ---------- reactions ---------- */
function rxNames(us){
  return us.map(u => u === uid ? "You" : ((lastRoster.find(e => e.c === u) || {}).n || (logs.find(m => m.c === u && m.u) || {}).u || "Someone")).join(", ");
}
function renderRx(l, w){
  w = w || $(l.i); if(!w) return;
  if(l.poll){ if(window.renderPoll) window.renderPoll(l, w); return; }
  const col = w.querySelector(":scope > .col"); if(!col) return;
  const by = {};
  Object.keys(l.rx || {}).forEach(u => ((l.rx[u] || {}).e || []).forEach(em => (by[em] = by[em] || []).push(u)));
  const list = Object.keys(by).sort((a, b) => by[b].length - by[a].length || (a < b ? -1 : 1));
  let box = col.querySelector(":scope > .rx");
  if(!list.length){ if(box) box.remove(); return; }
  if(!box){ box = document.createElement("div"); box.className = "rx"; col.appendChild(box); }
  box.replaceChildren(...list.map(em => {
    const us = by[em], b = document.createElement("button");
    b.type = "button"; b.className = "chip" + (us.includes(uid) ? " mine" : "");
    b.title = rxNames(us);
    const e = document.createElement("span"); e.textContent = em; b.append(e);
    if(us.length > 1){ const n = document.createElement("span"); n.className = "n"; n.textContent = us.length; b.append(n); }
    b.onclick = ev => { ev.stopPropagation(); toggleReaction(l.i, em); };
    return b;
  }));
}
function toggleReaction(id, em){
  const l = logs.find(x => x.i === id); if(!l || l.del || !okEmo(em) || l.poll) return;
  if(window.__pbMuted && window.__pbMuted(usr)){ sys("You're muted by an owner."); return; }
  const mine = (l.rx && l.rx[uid]) || { e: [], v: 0 }, set = new Set(mine.e);
  if(set.has(em)) set.delete(em); else { if(set.size >= 8){ sys("You can add up to 8 reactions to one message."); return; } set.add(em); }
  l.rx = l.rx || {};
  l.rx[uid] = { e: [...set], v: Math.max(Date.now(), (mine.v || 0) + 1) };
  persist(); renderRx(l); sendEntry(l);
}
function startReact(id){
  ensureEmoji();
  const w = $(id); if(w) w.classList.remove("tap");
  const p = $("emo-panel");
  window.__rxPick = em => { cancelReact(); toggleReaction(id, em); };
  p.classList.add("rx-open"); $("emo-q").value = ""; $("emo-q").placeholder = "React with any emoji";
  if(window.refreshEmojiPicker) window.refreshEmojiPicker();
  setShown(p, true, "flex"); $("emo-q").focus();
}
function cancelReact(){
  window.__rxPick = null; const p = $("emo-panel"); $("emo-q").placeholder = "Search emojis";
  setShown(p, false, "flex"); setTimeout(() => { if(!window.__rxPick) p.classList.remove("rx-open"); }, 220);
}
$("emo-q").addEventListener("keydown", e => { if(e.key === "Escape" && window.__rxPick) cancelReact(); });

function jumpTo(id){
  const l = logs.find(x => x.i === id);
  if(!l || !canSeeMsg(l) || l.ch === "gal"){ sys("That message is no longer here."); return; }
  if(!viewMatch(l)){                                     // original lives in another channel: go there first
    if(l.to || l.g){ sys("That message is in a private chat."); return; }
    setChannel(l.ch || "main");
  }
  let e = $(id);
  if(!e){ loadAround(l); e = $(id); }                    // an old message that isn't loaded yet: load the part around it
  if(!e){ sys("That message is no longer here."); return; }
  e.scrollIntoView({ block: "center", behavior: "smooth" });
  e.classList.remove("flash"); void e.offsetWidth; e.classList.add("flash");
  setTimeout(() => e.classList.remove("flash"), 1400);
}
function buildQuote(r){
  const q = document.createElement("div"); q.className = "quote"; q.title = "Jump to original message";
  const n = document.createElement("b"); n.textContent = (r.fw ? "↪ Forwarded from " + r.fw + " · " : "") + (r.u || "Message");
  const t = document.createElement("span"); t.textContent = r.t || "Message";
  q.append(n, t);
  q.onclick = ev => { ev.stopPropagation(); jumpTo(r.i); };
  return q;
}

/* ---------- messages ---------- */
const HIST_CAP = 2000000;   // characters of chat history kept on this device; the rest of the browser's storage stays free for games, proxies, tabs, profiles…
function persist(){
  // keep storage under the cap (and the browser limit) by dropping the oldest messages if needed
  while(true){
    try {
      const s = JSON.stringify(logs);
      if(s.length > HIST_CAP && logs.length > 1) throw new Error("over cap");
      localStorage.setItem("chat_history", s); return;
    }
    catch(e){ if(logs.length <= 1) return; const k = logs.findIndex(x => !x.pn); logs.splice(k < 0 ? 0 : k, 1); }   // pinned messages are the last to go
  }
}
/* other features save through this: if the browser says "full", trim old chat history to make room, then try again */
window.__pbFreeSpace = function(){ try{ persist(); }catch(e){} };
window.__pbSet = function(k, v){
  try{ localStorage.setItem(k, v); return true; }catch(e){}
  try{ window.__pbFreeSpace(); }catch(e){}
  try{ localStorage.setItem(k, v); return true; }catch(e){ return false; }
};

function colorFor(name){
  let h = 0; for(const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return "hsl(" + h + ",55%,50%)";
}

const isMine = m => (m.to || m.g) ? m.c === uid : ((m.c && m.c === uid) || m.u === usr);

const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_DEL = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
const ICON_REACT = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.2 4.2 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>';
const ICON_FWD = '<svg viewBox="0 0 24 24"><path d="M15 14l5-5-5-5"/><path d="M20 9h-9a7 7 0 0 0-7 7v3"/></svg>';
const ICON_REPLY = '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/></svg>';
function iconBtn(cls, title, svg, fn){
  const b = document.createElement("button"); b.type = "button"; b.className = cls; b.title = title; b.setAttribute("aria-label", title);
  b.innerHTML = svg; b.onclick = ev => { ev.stopPropagation(); fn(); }; return b;
}

/* inline editing: works on ANY text message in the room (DMs: your own only). No cooldown. Every edit is kept in the message's edit history (Edit history window, next to Changelog). */
function startEdit(id){
  const l = logs.find(x => x.i === id), w = $(id);
  if(!l || l.img || l.aud || l.fl || l.poll || l.del || !w || ((l.to || l.g) && l.c !== uid)) return;
  const bub = w.querySelector("[data-bubble]"); if(!bub || w.classList.contains("editing")) return;
  const inp = document.createElement("input");
  inp.type = "text"; inp.className = "editin"; inp.value = l.b; inp.maxLength = 1999;
  if(l.f && FONT_MAP[l.f]) inp.style.fontFamily = FONT_MAP[l.f];
  w.classList.add("editing"); w.classList.remove("tap");
  bub.style.display = "none"; bub.parentNode.insertBefore(inp, bub);
  let done = false;
  const finish = ok => {
    if(done) return; done = true;
    const nv = replaceCodes(inp.value.trim());
    inp.remove(); bub.style.display = ""; w.classList.remove("editing");
    if(ok && nv && nv !== l.b){
      (l.eh = l.eh || []).push({ o: l.b, u: usr, c: uid, t: Date.now() });   // keep what it said before + who changed it (everyone can read it in the Edit history window next to Changelog)
      if(l.eh.length > 10) l.eh.splice(1, 1);                               // always keep the very first original
      l.b = nv; l.edited = true; l.v = Date.now();
      persist(); applyToDom(l); sendEntry(l);
    }
  };
  inp.addEventListener("keydown", e => { if(e.key === "Enter") finish(true); else if(e.key === "Escape") finish(false); });
  inp.addEventListener("blur", () => finish(true));
  inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
}
function deleteMsg(id){
  const l = logs.find(x => x.i === id); if(!l) return;
  if(replyTo && replyTo.i === id) clearReply();
  const dmKeep = l.to ? { to: l.to, c: l.c, ch: "dm" } : l.g ? { g: l.g, c: l.c, ch: "grp" } : null;
  Object.keys(l).forEach(k => { if(k !== "i" && k !== "ts") delete l[k]; });
  if(dmKeep) Object.assign(l, dmKeep);   // keeps the delete routed to the right person
  l.del = true; l.v = Date.now(); persist(); applyToDom(l); sendEntry(l);
}

const ICON_PIN = '<svg viewBox="0 0 24 24"><path d="M12 17v5"/><path d="M9 3h6l-1 7 3 3v2H7v-2l3-3Z"/></svg>';
function togglePin(id){                          // owners only (the host double-checks, so a edited page can't fake it)
  if(!(window.__pbAdm && window.__pbAdm())) return;
  const l = logs.find(x => x.i === id); if(!l || l.del || l.to || l.g) return;
  if(l.pn) delete l.pn; else l.pn = Date.now();
  l.v = Math.max(Date.now(), (l.v || 0) + 1);
  persist(); applyToDom(l); sendEntry(l);
}

function setEditedTag(wrap, on){
  let t = wrap.querySelector(":scope > .edited");
  if(!on){ if(t) t.remove(); return; }
  if(!t){ t = document.createElement("span"); t.className = "edited"; t.textContent = "(edited)"; wrap.insertBefore(t, wrap.querySelector(":scope > .act")); }
}

/* ---------- windowed message list ----------
   Only the newest ~15 messages of the channel you are looking at are drawn. Scroll up and older ones load in
   (15 at a time); rows that are far off-screen are removed again, so the page stays light however long the history is. */
const WIN_INIT = 15, WIN_STEP = 15, WIN_CAP = 45;
let winLo = 0, winHi = Infinity, winLoading = false, winTopDone = false, winRaf = 0, winIdle = 0;   // a row is drawn when winLo <= its time <= winHi
function viewMatch(m){                                   // does this message belong to the channel / chat on screen?
  const ch = isHd(m) ? "" : (m.ch || "");
  return curCh === "dm" ? ((ch === "dm" || ch === "grp") && dmKey(m) === dmWith) : curCh === "gal" ? ch === "gal" : curCh === "polls" ? ch === "polls" : curCh === "shame" ? ch === "shame" : !ch;
}
const canSeeMsg = m => !m.del && !(m.to && m.to !== uid && m.c !== uid) && !m.g;
function viewLogs(){ return logs.filter(m => m && canSeeMsg(m) && !m.pn && viewMatch(m)).sort((a, b) => (a.ts || 0) - (b.ts || 0)); }
function resetWin(){ const v = viewLogs(); winLo = v.length > WIN_INIT ? (v[v.length - WIN_INIT].ts || 0) : 0; winHi = Infinity; winTopDone = false; }
function winOK(m){ if(!viewMatch(m)) return false; if(m.pn) return true; const t = m.ts || 0; return t >= winLo && t <= winHi; }
const winRows = () => [...$("box").querySelectorAll(".msg[data-ts]:not(.pinned)")];
const relTop = (e, bx) => e.getBoundingClientRect().top - bx.getBoundingClientRect().top + bx.scrollTop;
function winSkip(m, animate, mine){                      // a message that is outside the drawn window
  if(!viewMatch(m)) return;
  const t = m.ts || 0;
  if(animate && mine && t > winHi){ resetWin(); rerender(); const b = $("box"); b.scrollTop = b.scrollHeight; return; }   // you sent something while far up: jump to the newest
  if(animate && t > winHi && Date.now() - t < 60000 && window.__jump) window.__jump.add(1);                              // someone sent something new while you read old messages
}
function capTop(){                                       // pinned to the bottom: keep only the newest WIN_CAP rows
  if(winHi !== Infinity || winLoading) return;
  const bx = $("box"), rows = winRows(); if(rows.length <= WIN_CAP) return;
  const cut = rows.length - WIN_CAP, h0 = bx.scrollHeight, t0 = bx.scrollTop;
  rows.slice(0, cut).forEach(e => e.remove());
  winLo = +rows[cut].dataset.ts || 0; winTopDone = false;
  bx.scrollTop = t0 - (h0 - bx.scrollHeight);
}
function trimFar(margin, minKeep){                       // unload rows that are well away from the screen (top and bottom ends only)
  const bx = $("box"); if(winLoading || !bx.clientHeight) return;
  const rows = winRows(); if(rows.length <= minKeep) return;
  const topY = bx.scrollTop - margin, botY = bx.scrollTop + bx.clientHeight + margin;
  let a = 0; while(a < rows.length - minKeep && relTop(rows[a], bx) + rows[a].offsetHeight < topY) a++;
  let b = rows.length; while(b > a + minKeep && relTop(rows[b - 1], bx) > botY) b--;
  if(!a && b === rows.length) return;
  const t0 = bx.scrollTop, h0 = bx.scrollHeight;
  rows.slice(0, a).forEach(e => e.remove());
  const dTop = h0 - bx.scrollHeight;
  rows.slice(b).forEach(e => e.remove());
  if(a){ winLo = +rows[a].dataset.ts || 0; winTopDone = false; }
  if(b < rows.length) winHi = +rows[b - 1].dataset.ts || 0;
  bx.scrollTop = t0 - dTop;
  queueRegroup();
}
function loadOlder(){
  if(winTopDone) return false;
  const older = viewLogs().filter(m => (m.ts || 0) < winLo);
  if(!older.length){ winTopDone = true; return false; }
  const newLo = older[Math.max(0, older.length - WIN_STEP)].ts || 0;
  const bx = $("box"), h0 = bx.scrollHeight, t0 = bx.scrollTop;
  winLoading = true; winLo = newLo;
  try { older.filter(m => (m.ts || 0) >= newLo).forEach(m => renderRow(m)); regroup(); } finally { winLoading = false; }
  bx.scrollTop = t0 + (bx.scrollHeight - h0);            // keep what you were reading exactly where it was
  if(winRows().length > WIN_CAP) trimFar(bx.clientHeight, 20);
  return true;
}
/* status line under the RIP text: "Loading older messages…" while you scroll up, "You reached the top" when there is nothing older */
let topT = 0;
const hasOlder = () => logs.some(m => m && canSeeMsg(m) && !m.pn && viewMatch(m) && (m.ts || 0) < winLo);
function setTop(){
  const el = document.getElementById("tb-status"); if(!el) return;
  const st = topT ? "load" : (hasOlder() ? "" : "top");
  if(el.dataset.st === st) return; el.dataset.st = st;
  el.textContent = st === "load" ? "Loading older messages…" : st === "top" ? "You reached the top of the chat." : "";
  el.className = "tb-status" + (st ? " " + st : "");
}
function topLoad(){                                      // near the top: show "Loading…" for a moment, then pull in the older messages
  if(topT || winTopDone || winLoading) return;
  if(!hasOlder()){ winTopDone = true; setTop(); return; }
  topT = setTimeout(() => { topT = 0; loadOlder(); setTop(); }, 350); setTop();
}
function loadNewer(){
  if(winHi === Infinity) return false;
  const newer = viewLogs().filter(m => (m.ts || 0) > winHi);
  if(!newer.length){ winHi = Infinity; return false; }
  const toEnd = newer.length <= WIN_STEP, last = newer[Math.min(newer.length, WIN_STEP) - 1].ts || 0, bx = $("box");
  winHi = toEnd ? Infinity : last;
  winLoading = true;
  try { newer.filter(m => toEnd || (m.ts || 0) <= last).forEach(m => renderRow(m)); regroup(); } finally { winLoading = false; }
  if(winRows().length > WIN_CAP) trimFar(bx.clientHeight, 20);
  return true;
}
function loadAround(l){                                  // make sure one particular (old) message is drawn
  const v = viewLogs(), k = v.findIndex(x => x.i === l.i); if(k < 0) return;
  const lo = Math.max(0, k - 8), hi = Math.min(v.length - 1, k + 8);
  winLo = v[lo].ts || 0; winHi = hi >= v.length - 1 ? Infinity : (v[hi].ts || 0); winTopDone = false;
  rerender();
}
function winFill(){                                      // very short messages on a tall screen: load more until there is something to scroll
  const bx = $("box"); if(winLoading || !bx.clientHeight) return;
  for(let n = 0; n < 6 && bx.scrollHeight < bx.clientHeight + 300 && !winTopDone; n++) if(!loadOlder()) break;
}
window.__pbEnd = () => { if(winHi !== Infinity){ resetWin(); rerender(); } };   // "jump to latest" needs the newest rows drawn
$("box").addEventListener("scroll", () => {
  if(winRaf) return;
  winRaf = requestAnimationFrame(() => {
    winRaf = 0; if(winLoading) return;
    const bx = $("box");
    if(bx.scrollTop < 250) topLoad();
    else if(bx.scrollHeight - bx.scrollTop - bx.clientHeight < 250 && winHi !== Infinity) loadNewer();
    setTop();
    clearTimeout(winIdle); winIdle = setTimeout(() => trimFar(bx.clientHeight * 1.5, 10), 400);
  });
}, { passive: true });

function renderRow(m, animate){
  if(m.del) return;
  if(m.to && m.to !== uid && m.c !== uid) return;   // not our DM
  if(m.g && !isMember(m.g)) return;                  // not our group
  const box = $("box"), mine = isMine(m);
  if(!winOK(m)){ winSkip(m, animate, mine); return; }       // outside the loaded window: not drawn (loads when you scroll to it)
  const wasNear = box.scrollHeight - box.scrollTop - box.clientHeight < 120;   // were they reading the latest messages?
  const w = document.createElement("div");
  w.className = "msg " + (mine ? "me" : "peer"); w.id = m.i;
  w.dataset.ts = m.ts || 0; w.dataset.uid = m.c || ""; w.dataset.user = m.u; w.dataset.ch = isHd(m) ? "" : (m.ch || ""); if(m.to || m.g) w.dataset.dm = dmKey(m);
  if(isHd(m)) w.classList.add("hid");

  if(animate && Date.now() - (m.ts || 0) < 15000) w.classList.add("pop");   // only brand-new messages animate
  const av = document.createElement("div"); av.className = "av"; paintAv(av, m.u);
  const col = document.createElement("div"); col.className = "col";
  const lbl = document.createElement("span"); lbl.className = "lbl"; lbl.textContent = m.u; lbl.dataset.nm = m.u; lbl.style.setProperty("--uc", colorFor(m.u));
  const dv = DEVS[m.d];
  if(dv){ const t = document.createElement("span"); t.className = "dev"; t.textContent = dv[0] + " " + dv[1]; lbl.appendChild(t); }
  if(isHd(m)){ const ht = document.createElement("span"); ht.className = "hdtag"; ht.textContent = m.c === uid ? "🙈 Hidden — only " + (m.tn || "them") + " can see this" : "🙈 Hidden reply — only you can see this"; lbl.appendChild(ht); }
  if(m.pn){ w.classList.add("pinned"); const pt = document.createElement("span"); pt.className = "pintag"; pt.textContent = "📌 Pinned"; lbl.appendChild(pt); }
  col.appendChild(lbl);
  if(m.r) col.appendChild(buildQuote(m.r));

  const wrap = document.createElement("div"); wrap.className = "bwrap";
  if(m.img){
    const im = document.createElement("img"); im.className = "img" + (m.stk ? " stk" : "") + (m.gif ? " gif" : ""); im.decoding = "async"; im.alt = "Photo";
    if(!animate || mine || wasNear) im.onload = () => { if(box.scrollHeight - box.scrollTop - box.clientHeight < im.offsetHeight + 160) box.scrollTop = box.scrollHeight; };   // keep the chat pinned to the bottom while photos load (not if they scrolled away)
    if(m.gif || !/^data:/.test(m.b)) im.referrerPolicy = "no-referrer";
    im.src = m.b; wrap.appendChild(im);
  } else if(m.fl){
    wrap.appendChild(window.buildFileCard ? window.buildFileCard(m) : document.createTextNode("📎 " + (m.fn || "file")));
  } else if(m.poll){
    const pc = document.createElement("div"); pc.className = "pollcard"; wrap.appendChild(pc);
  } else if(m.aud){
    const bub = document.createElement("div"); bub.className = "bubble voice";
    const au = document.createElement("audio"); au.controls = true; au.preload = "metadata"; au.src = m.b;
    bub.appendChild(au);
    if(m.tx){ const tx = document.createElement("div"); tx.className = "vtx"; tx.textContent = m.tx; tx.title = "Tap to expand"; tx.onclick = () => tx.classList.toggle("open"); bub.appendChild(tx); }   // transcript under the player
    styleBubble(bub, m.c || ""); wrap.appendChild(bub);
  } else {
    const bub = document.createElement("div"); bub.className = "bubble"; bub._raw = m.b; if(window.fillBubble) window.fillBubble(bub, m.b); else bub.textContent = m.b;
    if(m.f && FONT_MAP[m.f]) bub.style.fontFamily = FONT_MAP[m.f];
    bub.dataset.bubble = "1";
    styleBubble(bub, m.c || "");
    wrap.appendChild(bub);
    if(m.edited) setEditedTag(wrap, true);
  }

  if(m.sp && (m.img || wrap.querySelector(":scope > .bubble"))) wrapSpoiler(wrap);

  const act = document.createElement("div"); act.className = "act";
  if(m.ch !== "gal") act.appendChild(iconBtn("rep", "Reply", ICON_REPLY, () => startReply(m.i)));
  if(!(m.to || m.g)) act.appendChild(iconBtn("fwd", "Forward: reply to this from another channel", ICON_FWD, () => startForward(m.i)));   // private DMs / group chats can't be forwarded
  if(!m.poll) act.appendChild(iconBtn("rct", "React with any emoji", ICON_REACT, () => startReact(m.i)));
  if(!m.img && !m.aud && !m.fl && !m.poll && (!(m.to || m.g) || mine)) act.appendChild(iconBtn("edt", "Edit message", ICON_EDIT, () => startEdit(m.i)));
  if(mine && !(m.ch === "shame" && !(window.__pbAdm && window.__pbAdm()))) act.appendChild(iconBtn("del", "Delete message", ICON_DEL, () => deleteMsg(m.i)));   // hall of shame: only owners delete
  if(window.__pbAdm && window.__pbAdm() && !(m.to || m.g)) act.appendChild(iconBtn("pin" + (m.pn ? " on" : ""), m.pn ? "Unpin message" : "Pin message to the top of this room", ICON_PIN, () => togglePin(m.i)));   // owners only
  if(act.children.length) wrap.appendChild(act);
  col.appendChild(wrap);
  w.append(av, col);
  renderRx(m, w);

  // tap a message to show its buttons on touch screens
  w.addEventListener("click", ev => {
    if(ev.target.closest(".act") || ev.target.closest(".editin") || ev.target.closest(".quote")) return;
    document.querySelectorAll(".msg.tap").forEach(x => { if(x !== w) x.classList.remove("tap"); });
    w.classList.toggle("tap");
  });

  if(m.pn){                                      // pinned: goes to the very top of the room, oldest pin first
    w.dataset.pn = m.pn;
    const first = [...box.querySelectorAll(".msg[data-ts]")].find(r => !r.classList.contains("pinned") || +r.dataset.pn > m.pn);
    if(first) box.insertBefore(w, first); else box.appendChild(w);
    queueRegroup(); return;
  }
  const nxt = m.ts ? [...box.querySelectorAll(".msg[data-ts]:not(.pinned)")].find(r => +r.dataset.ts > m.ts) : null;
  if(nxt){ box.insertBefore(w, nxt); if(!animate) capTop(); }
  else {
    box.appendChild(w);
    if(!winLoading){
      if(!animate || mine || wasNear){ box.scrollTop = box.scrollHeight; capTop(); }   // history loading, your own message, or you were already at the bottom
      else if(window.__jump && visibleHere(w)) window.__jump.add(1);          // reading further up: stay put, the arrow shows what's new
    }
  }
  queueRegroup();
}
function visibleHere(el){                       // is this row part of the chat the person is looking at right now?
  const d = el.dataset;
  return curCh === "dm" ? ((d.ch === "dm" || d.ch === "grp") && d.dm === dmWith) : curCh === "gal" ? d.ch === "gal" : curCh === "polls" ? d.ch === "polls" : curCh === "shame" ? d.ch === "shame" : !d.ch;
}

function applyToDom(l){
  renderDMList();
  const e = $(l.i);
  if(l.del){ if(e){ e.classList.add("gone"); setTimeout(() => { e.remove(); queueRegroup(); }, 180); } else queueRegroup(); return; }
  if(!e){ renderRow(l, true); return; }
  if(!!l.pn !== e.classList.contains("pinned") || (l.pn && +e.dataset.pn !== l.pn)){   // pinned / unpinned: move it
    const bx = $("box"), keep = bx.scrollTop; e.remove(); renderRow(l); bx.scrollTop = keep; return;
  }
  renderRx(l, e); queueRegroup();       // a reaction on one photo of a stack lifts it out of the stack
  const bub = e.querySelector("[data-bubble]"); if(!bub || l.img) return;
  bub._raw = l.b; if(window.fillBubble) window.fillBubble(bub, l.b); else bub.textContent = l.b;
  if(l.edited) setEditedTag(bub.parentNode, true);
}
function rerender(){
  const bx = $("box"), far = bx.scrollHeight - bx.scrollTop - bx.clientHeight >= 120, keep = bx.scrollTop;
  document.querySelectorAll("#box .msg[data-ts]").forEach(e => e.remove());
  logs.forEach(m => renderRow(m)); renderDMList();
  if(far) bx.scrollTop = keep;
  queueRegroup(); requestAnimationFrame(() => { winFill(); setTop(); });
}

/* ---------- grouping, time stamps, "Delivered" (used by the iMessage theme) ---------- */
let rgq = 0;
function queueRegroup(){ if(rgq) return; rgq = requestAnimationFrame(() => { rgq = 0; regroup(); setTop(); }); }
function fmtStamp(ts){
  const d = new Date(ts), now = new Date(), y = new Date(now.getTime() - 86400000);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if(d.toDateString() === now.toDateString()) return "Today " + time;
  if(d.toDateString() === y.toDateString()) return "Yesterday " + time;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " " + time;
}
/* Several photos sent in a row by the same person (like picking a handful at once) stack into one tidy grid, like iMessage / Discord.
   The messages stay separate underneath: the first one shows the grid, the others are just hidden, and a lone photo is untouched. */
function albumImg(e){
  if(e._aimg) return e._aimg;
  const w = e.querySelector(".col > .bwrap"), im = w && w.querySelector(":scope > img.img");
  return im && !im.classList.contains("stk") && !im.classList.contains("gif") ? im : null;
}
function buildAlbums(vis){
  const box = $("box"), runs = []; let cur = [];
  const flush = () => { if(cur.length > 1) runs.push(cur); cur = []; };
  vis.forEach(e => {
    const ok = !e.classList.contains("sys") && !e.classList.contains("pinned") && !e.classList.contains("gone") && albumImg(e) && !e.querySelector(".quote") && !e.querySelector(".rx .chip");
    if(!ok){ flush(); return; }
    const p = cur[cur.length - 1];
    if(p && (p.dataset.uid !== e.dataset.uid || p.dataset.user !== e.dataset.user || Math.abs(+e.dataset.ts - +p.dataset.ts) > 30000 || cur.length >= 10)) flush();
    cur.push(e);
  });
  flush();
  const sig = runs.map(r => r.map(e => e.id).join(",")).join("|");
  const fine = runs.every(r => { const g = r[0].querySelector(".alb-grid"); return g && g.children.length === r.length; });
  if(sig === box._albSig && fine) return;
  box._albSig = sig;
  box.querySelectorAll(".msg").forEach(e => {             // put every photo back in its own message first
    if(e._aimg){ const h = e.querySelector(".col > .bwrap"); if(h && e._aimg.parentNode !== h) h.insertBefore(e._aimg, h.firstChild); e._aimg = null; }
    e.querySelectorAll(".alb-grid").forEach(g => g.remove());
    e.classList.remove("alb0", "alb-hid");
  });
  runs.forEach(r => {
    const g = document.createElement("div"); g.className = "alb-grid a" + r.length;
    r.forEach((e, i) => {
      const im = albumImg(e); e._aimg = im; g.appendChild(im);
      e.classList.add(i ? "alb-hid" : "alb0");
    });
    const h = r[0].querySelector(".col > .bwrap"); h.insertBefore(g, h.firstChild);
  });
}
function regroup(){
  const box = $("box"), gal = curCh === "gal";
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
  const setC = (e, c, on) => { if(e.classList.contains(c) !== !!on) e.classList.toggle(c, !!on); };   // only touch the DOM when something changed
  let vis = [...box.children].filter(e => {
    if(!e.classList.contains("msg")) return false;
    if(e.classList.contains("sys")) return true;
    const show = curCh === "dm" ? ((e.dataset.ch === "dm" || e.dataset.ch === "grp") && e.dataset.dm === dmWith) : curCh === "gal" ? e.dataset.ch === "gal" : curCh === "polls" ? e.dataset.ch === "polls" : curCh === "shame" ? e.dataset.ch === "shame" : !e.dataset.ch;
    setC(e, "off", !show);
    return show;
  });
  if(!gal){ buildAlbums(vis); vis = vis.filter(e => !e.classList.contains("alb-hid")); }
  const same = (a, b) => a && b && !a.classList.contains("sys") && !b.classList.contains("sys") && !a.classList.contains("pinned") && !b.classList.contains("pinned") &&
    a.dataset.uid === b.dataset.uid && a.dataset.user === b.dataset.user && Math.abs(+b.dataset.ts - +a.dataset.ts) < 120000;
  let lastTs = 0, mineEl = null; const want = [];
  vis.forEach((e, k) => {
    e._f = e._l = e._m = 0;
    if(e.classList.contains("sys")) return;
    if(gal){ e._f = e._l = 1; return; }
    if(!same(vis[k - 1], e)) e._f = 1;
    if(!same(e, vis[k + 1])) e._l = 1;
    const ts = +e.dataset.ts;
    if(ts && ts - lastTs > 15 * 60000) want.push([e, fmtStamp(ts)]);
    if(ts) lastTs = ts;
    if(e.classList.contains("me") && !e.querySelector(".img") && !e.classList.contains("alb0")) mineEl = e;
  });
  if(mineEl && !gal) mineEl._m = 1;
  vis.forEach(e => { setC(e, "first", e._f); setC(e, "last", e._l); setC(e, "lastmine", e._m); });
  const have = [...box.querySelectorAll(".tsep")];
  if(!(have.length === want.length && have.every((t, i) => t.nextElementSibling === want[i][0] && t.textContent === want[i][1]))){
    have.forEach(t => t.remove());
    want.forEach(([e, t]) => { const d = document.createElement("div"); d.className = "tsep"; d.textContent = t; box.insertBefore(d, e); });
  }
  document.body.classList.toggle("has-peers", conns.length > 0);
  if(near) box.scrollTop = box.scrollHeight;
}

/* ---------- bubble color / image ---------- */
function textOn(hex){
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? "#000" : "#fff";
}
function styleBubble(bub, c){ applyBubbleStyle(bub, bstyle[c], document.body.dataset.theme); }
function applyBubbleStyle(bub, s, theme){
  bub.style.backgroundColor = ""; bub.style.backgroundImage = ""; bub.style.color = "";
  bub.style.textShadow = ""; bub.style.padding = ""; bub.style.borderRadius = "";
  bub.style.removeProperty("--bub"); delete bub.dataset.img;
  if(!s || (!s.bc && !s.bi)) return;
  if(theme === "discord"){ bub.style.padding = "4px 10px"; bub.style.borderRadius = "8px"; }
  if(theme === "terminal"){ if(s.bc){ const a = accentFrom(s.bc).color; bub.style.color = a; bub.style.setProperty("--t-me", a); } return; }
  if(s.bi){
    bub.dataset.img = "1";   // image bubbles have no tail
    bub.style.backgroundImage = 'url("' + s.bi + '")'; bub.style.backgroundSize = "cover"; bub.style.backgroundPosition = "center";
    bub.style.color = "#fff"; bub.style.textShadow = "0 1px 3px rgba(0,0,0,.9)";
  } else { bub.style.backgroundColor = s.bc; bub.style.setProperty("--bub", s.bc); bub.style.color = textOn(s.bc); }
}
function restyleAll(){
  document.querySelectorAll(".msg[data-uid]").forEach(w => { const b = w.querySelector("[data-bubble]"); if(b) styleBubble(b, w.dataset.uid); });
}
function cacheB(){ save("chat_bstyle", JSON.stringify(bstyle)); }
function setBstyle(c, bc, bi, v){
  if(!okUid(c) || c === uid) return false;
  v = +v || 0;
  if(bstyle[c] && (bstyle[c].v || 0) >= v) return false;
  bstyle[c] = { bc: okBc(bc), bi: okBi(bi), v };
  cacheB(); restyleAll(); return true;
}
function setMyStyle(){
  const v = Date.now(); save("chat_bv", String(v));
  bstyle[uid] = { bc: myBc, bi: myBi, v }; cacheB(); restyleAll();
  send({ t: "B", i: newId(), c: uid, bc: myBc, bi: myBi, v });
}
function sys(t){
  const b = $("box"), near = b.scrollHeight - b.scrollTop - b.clientHeight < 120;
  const d = document.createElement("div"); d.className = "msg sys"; d.textContent = "System: " + t;
  b.appendChild(d);
  if(near) b.scrollTop = b.scrollHeight; else if(window.__jump) window.__jump.add(1);
  queueRegroup();
}

/* 1-on-1 chats and group chats were removed; hidden replies are the only private messages */
function dmChanged(){}
function updateDmBar(){}
function renderDMList(){}

/* ---------- animation helpers ---------- */
function setShown(el, show, disp){                 // show/hide with the pop animation
  disp = disp || "block"; clearTimeout(el._t);
  if(show){ el.classList.remove("closing"); el.style.display = disp; }
  else if(getComputedStyle(el).display !== "none"){
    el.classList.add("closing");
    el._t = setTimeout(() => { el.style.display = "none"; el.classList.remove("closing"); }, 170);
  }
}
function setPop(on){
  const p = $("onpop"); clearTimeout(p._t);
  if(on){ p.classList.remove("closing"); p.classList.add("open"); }
  else if(p.classList.contains("open")){ p.classList.add("closing"); p._t = setTimeout(() => p.classList.remove("open", "closing"), 160); }
}

function knownPeople(exclude){                    // everyone we know about: online now, plus anyone seen in chats before (offline)
  const m = new Map();
  logs.forEach(l => {
    if(l.del) return;
    if(l.c && l.u && l.c !== uid) m.set(l.c, { c: l.c, n: l.u, on: 0 });
    if(l.to && l.tn && l.to !== uid && !m.has(l.to)) m.set(l.to, { c: l.to, n: l.tn, on: 0 });
  });
  lastRoster.forEach(e => { if(e.c && e.c !== uid) m.set(e.c, { c: e.c, n: e.n, on: 1 }); });
  return [...m.values()].filter(p => okUid(p.c) && !(exclude || []).includes(p.c)).sort((a, b) => (b.on - a.on) || a.n.localeCompare(b.n));
}
function setModal(on){ const m = $("gmod"); if(!m) return; clearTimeout(m._t); if(on){ m.classList.remove("closing"); m.classList.add("open"); } else if(m.classList.contains("open")){ m.classList.add("closing"); m._t = setTimeout(() => m.classList.remove("open", "closing"), 190); } }

;
/* ===== 05-pv-upgrade-js.js ===== */
(function(){
  // make the preview scrollable
  const origPvHTML = pvHTML;
  pvHTML = function(){
    return origPvHTML().replace("body{pointer-events:none;user-select:none}",
      "body{user-select:none} #sb,#hdr,#tray,.act,.quote{pointer-events:none} #box{pointer-events:auto;overflow-y:auto}");
  };
  const origDraw = drawPreview;
  drawPreview = function(){
    const doc = $("pvframe").contentDocument, b = doc && doc.getElementById("box");
    const had = !!(b && b.dataset.init === "1"), keep = had ? b.scrollTop : 0;
    origDraw();
    const b2 = doc && doc.getElementById("box"); if(!b2) return;
    const msgs = [...b2.querySelectorAll(".msg")];
    for(let r = 0; r < 2; r++) msgs.forEach(m => {
      const c = m.cloneNode(true);
      c.classList.remove("tap","lastmine"); c.querySelectorAll(".act").forEach(a => a.remove());
      b2.insertBefore(c, msgs[0]);
    });
    if(had) b2.scrollTop = keep; else { b2.scrollTop = b2.scrollHeight; b2.dataset.init = "1"; }
  };
})();

;
/* ===== 06-attach-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const panel = document.createElement("div"); panel.id = "attach";
  panel.innerHTML = '<div class="at-head"><b>Photos</b><span class="at-sub" id="atsub"></span><button type="button" id="atfolder" style="display:none">📂 Folder</button><button type="button" class="x" id="atclose" title="Close">✕</button></div><div id="atgrid"></div><div class="at-foot"><span id="atcount"></span><button type="button" id="atsend">Send</button></div>';
  $$("tray").after(panel);
  const file = document.createElement("input"); file.type = "file"; file.accept = "image/*"; file.multiple = true; file.style.display = "none"; document.body.appendChild(file);
  const plus = document.querySelector("label.plus");

  let items = [], saved = null, tried = false;

  /* ---- tiny IndexedDB store so a chosen photo folder is remembered ---- */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open("purebred-chat", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  async function kvGet(k){ try { const db = await idb(); return await new Promise(res => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } catch(e){ return null; } }
  async function kvSet(k, v){ try { const db = await idb(); db.transaction("kv", "readwrite").objectStore("kv").put(v, k); } catch(e){} }

  /* ---- thumbnails ---- */
  async function thumb(it){
    const cv = document.createElement("canvas"); cv.width = cv.height = 180; const cx = cv.getContext("2d");
    let src = null;
    try { src = await createImageBitmap(it.file); }
    catch(e){ try { const u = URL.createObjectURL(it.file); src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => { res(im); URL.revokeObjectURL(u); }; im.onerror = rej; im.src = u; }); } catch(x){} }
    if(src){
      const w = src.width, h = src.height, m = Math.min(w, h);
      cx.drawImage(src, (w - m) / 2, (h - m) / 2, m, m, 0, 0, 180, 180);
      if(src.close) src.close();
    }
    it.el.appendChild(cv);
  }
  function makeItem(f, pre){
    const el = document.createElement("div"); el.className = "th" + (pre ? " sel" : "");
    const it = { file: f, sel: !!pre, el, done: false };
    el.onclick = () => { it.sel = !it.sel; el.classList.toggle("sel", it.sel); updateSel(); };
    return it;
  }
  async function fillThumbs(){
    for(const it of items){
      if(it.done) continue; it.done = true;
      await thumb(it); await new Promise(r => setTimeout(r, 0));
    }
  }
  function updateSel(){
    const n = items.filter(i => i.sel).length;
    panel.classList.toggle("has-sel", n > 0);
    $$("atcount").textContent = n + " photo" + (n === 1 ? "" : "s") + " selected";
    $$("atsend").textContent = "Send" + (n > 1 ? " (" + n + ")" : "");
  }
  function render(note){
    const grid = $$("atgrid"); grid.replaceChildren();
    const add = document.createElement("div"); add.className = "th add"; add.innerHTML = "<i>🖼️</i>Browse"; add.onclick = () => file.click();
    grid.appendChild(add);
    items.forEach(it => grid.appendChild(it.el));
    if(note){ const n = document.createElement("div"); n.className = "note"; n.textContent = note; grid.appendChild(n); }
    updateSel(); fillThumbs();
  }

  /* ---- photos chosen with the normal file picker (on phones this opens your photo library) ---- */
  file.onchange = () => {
    const fs = [...file.files].filter(f => f.type.startsWith("image/")); file.value = "";
    if(!fs.length) return;
    items = fs.map(f => makeItem(f, true)).concat(items);
    render(); openAttach();
  };

  /* ---- photo folder (desktop Chrome / Edge) ---- */
  const canDir = typeof window.showDirectoryPicker === "function";
  async function loadDir(dir){
    $$("atsub").textContent = "Reading " + dir.name + "…";
    const files = []; let seen = 0;
    try {
      for await (const [name, h] of dir.entries()){
        if(h.kind !== "file" || !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(name)) continue;
        if(++seen > 1500) break;
        try { files.push(await h.getFile()); } catch(e){}
      }
    } catch(e){ $$("atsub").textContent = "Couldn't read that folder."; return; }
    files.sort((a, b) => b.lastModified - a.lastModified);
    const staged = items.filter(i => !i.fromDir);
    items = staged.concat(files.slice(0, 80).map(f => { const it = makeItem(f, false); it.fromDir = true; return it; }));
    $$("atsub").textContent = dir.name + " · newest first";
    $$("atfolder").textContent = "📂 Change folder"; saved = dir;
    render(files.length ? "" : "No photos found in that folder.");
  }
  $$("atfolder").onclick = async () => {
    try {
      if(saved && saved.requestPermission && (await saved.queryPermission({ mode: "read" })) !== "granted"){
        if((await saved.requestPermission({ mode: "read" })) === "granted"){ await loadDir(saved); return; }
      }
      const dir = await window.showDirectoryPicker({ id: "purebred-photos", mode: "read" });
      await kvSet("photoDir", dir); await loadDir(dir);
    } catch(e){}
  };

  /* ---- open / close ---- */
  async function openAttach(){
    panel.classList.add("on"); plus.classList.add("open");
    if(canDir) $$("atfolder").style.display = "";
    else if(!$$("atsub").textContent) $$("atsub").textContent = "Tap Browse to pick photos";
    if(!tried){
      tried = true; render(canDir ? "Tip: choose a photos folder to see your newest pictures here." : "Browsers can't open your whole photo library — Browse lets you pick photos from it.");
      if(canDir){
        const h = await kvGet("photoDir");
        if(h){
          saved = h;
          try { if((await h.queryPermission({ mode: "read" })) === "granted") await loadDir(h); else { $$("atfolder").textContent = "🔓 Reconnect " + h.name; $$("atsub").textContent = "Folder remembered — tap Reconnect"; } } catch(e){}
        }
      }
    }
  }
  function closeAttach(){ panel.classList.remove("on"); plus.classList.remove("open"); }
  plus.addEventListener("click", e => {
    e.preventDefault();
    if($$("fi").disabled) return;                       // not connected yet
    if(panel.classList.contains("on")) closeAttach(); else openAttach();
  });
  $$("atclose").onclick = closeAttach;
  document.addEventListener("keydown", e => { if(e.key === "Escape" && panel.classList.contains("on") && !document.getElementById("stg").classList.contains("open")) closeAttach(); });

  /* ---- send ---- */
  $$("atsend").onclick = async () => {
    const sel = items.filter(i => i.sel); if(!sel.length) return;
    closeAttach();
    for(const it of sel){
      if(it.file.size > 10 * 1024 * 1024){ sys("Image too big (10MB max): " + it.file.name); continue; }
      await new Promise(res => { const r = new FileReader(); r.onload = ev => shrinkImage(ev.target.result, d => { postMsg(d, 1); res(); }); r.onerror = res; r.readAsDataURL(it.file); });
    }
    items = items.filter(i => !sel.includes(i) || i.fromDir);          // sent photos leave the picker
    items.forEach(i => { i.sel = false; i.el.classList.remove("sel"); }); render();
  };
})();

;
/* ===== 07-rich-js.js ===== */
(function(){
  const $$ = id => document.getElementById(id);
  const VT = ["🔴","🔵","⚫","⚪","🔶","🔷","🔸","🔹"];          // a vote for option N is stored as VT[N] in that person's reactions, so it syncs/merges like reactions do
  const fmtSize = n => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB" : (n / 1048576).toFixed(1) + " MB";

  /* ---------- photo viewer ---------- */
  const lbx = document.createElement("div"); lbx.id = "lbx";
  lbx.innerHTML = '<div class="lbb"><a id="lbdl" download="photo.jpg">⬇ Save</a><button type="button" id="lbx-x">✕</button></div><img alt="">';
  document.body.appendChild(lbx);
  const closeLb = () => lbx.classList.remove("open");
  lbx.addEventListener("click", e => { if(e.target.closest("#lbdl")) return; closeLb(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeLb(); });
  $$("box").addEventListener("click", e => {
    const im = e.target.closest("img.img"); if(!im || im.closest(".ghost") || im.classList.contains("stk")) return;
    lbx.querySelector("img").src = im.src; $$("lbdl").href = im.src; lbx.classList.add("open");
  });

  /* ---------- file card ---------- */
  const ICO = { pdf:"📕", doc:"📘", docx:"📘", txt:"📄", md:"📄", xls:"📗", xlsx:"📗", csv:"📗", ppt:"📙", pptx:"📙", zip:"🗜️", rar:"🗜️", "7z":"🗜️", mp3:"🎵", wav:"🎵", m4a:"🎵", mp4:"🎬", mov:"🎬", webm:"🎬", js:"🧩", json:"🧩", html:"🧩", py:"🧩" };
  window.buildFileCard = function(m){
    const ext = (String(m.fn).split(".").pop() || "").toLowerCase();
    const c = document.createElement("div"); c.className = "filecard";
    const i = document.createElement("div"); i.className = "fi"; i.textContent = ICO[ext] || "📎";
    const mm = document.createElement("div"); mm.className = "fm";
    const nm = document.createElement("b"); nm.textContent = m.fn || "file"; nm.title = m.fn || "";
    const sz = document.createElement("span"); sz.textContent = fmtSize(m.fz || 0) + (ext && ext.length < 6 ? " · " + ext.toUpperCase() : "");
    mm.append(nm, sz);
    const b = document.createElement("button"); b.type = "button"; b.textContent = "⬇ Download";
    b.onclick = ev => {
      ev.stopPropagation();
      try {
        const bin = atob(m.b.slice(m.b.indexOf(",") + 1)), u8 = new Uint8Array(bin.length);
        for(let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([u8], { type: "application/octet-stream" }));
        a.download = m.fn || "file"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      } catch(e){ sys("Couldn't open that file."); }
    };
    c.append(i, mm, b); return c;
  };

  /* ---------- anonymous voting: the voter is a random token made on this device for this poll (not the user id) ---------- */
  let anonSecret = "";
  function anonKey(){
    if(anonSecret) return anonSecret;
    try{ anonSecret = localStorage.getItem("pb_anon_key") || ""; }catch(e){}
    if(!/^[0-9a-f]{32}$/.test(anonSecret)){
      const a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a);
      anonSecret = Array.from(a, x => x.toString(16).padStart(2, "0")).join("");
      try{ localStorage.setItem("pb_anon_key", anonSecret); }catch(e){}
    }
    return anonSecret;
  }
  const h32 = (str, seed) => { let h = seed >>> 0; for(let i = 0; i < str.length; i++){ h = Math.imul(h ^ str.charCodeAt(i), 2654435761); h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; } return (h >>> 0).toString(16).padStart(8, "0"); };
  const anonTok = pollId => { const s = anonKey() + "|" + pollId; return "~" + h32(s, 0x9e3779b9) + h32(s + "#", 0x85ebca6b); };
  const whoKey = l => l.poll && l.poll.an ? anonTok(l.i) : uid;   // the key this device votes under

  /* ---------- poll card ---------- */
  function endText(end){
    const ms = end - Date.now(); if(ms <= 0) return "Final results";
    const m = Math.ceil(ms / 60000); if(m < 60) return "Ends in " + m + " min";
    const h = Math.round(m / 60); return h < 48 ? "Ends in " + h + " h" : "Ends in " + Math.round(h / 24) + " days";
  }
  window.renderPoll = function(l, w){
    const card = w.querySelector(".pollcard"); if(!card || !l.poll) return;
    const p = l.poll, me = whoKey(l);
    if(p.t){ renderTypedPoll(l, card); return; }
    const by = p.o.map(() => []);
    Object.keys(l.rx || {}).forEach(u => ((l.rx[u] || {}).e || []).forEach(em => { const k = VT.indexOf(em); if(k >= 0 && k < by.length) by[k].push(u); }));
    const voters = new Set(); by.forEach(a => a.forEach(u => voters.add(u)));
    const total = voters.size, ended = !!p.end && Date.now() >= p.end;
    const q = document.createElement("div"); q.className = "pq"; q.textContent = "📊 " + p.q;
    const sub = document.createElement("div"); sub.className = "ps";
    sub.textContent = (p.m ? "Select one or more" : "Select one") + (l.ch === "polls" ? " · Votes are final" : "") + (p.an ? " · 🕶️ Anonymous" : "") + (p.end ? " · " + endText(p.end) : "");
    const opts = p.o.map((t, k) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "popt" + (by[k].includes(me) ? " mine" : ""); b.disabled = ended;
      const pct = total ? Math.round(by[k].length / total * 100) : 0;
      const f = document.createElement("div"); f.className = "fill"; f.style.width = pct + "%";
      const lb = document.createElement("span"); lb.className = "l"; lb.textContent = (by[k].includes(me) ? "✓ " : "") + t;
      const n = document.createElement("span"); n.className = "n"; n.textContent = by[k].length + " · " + pct + "%";
      b.title = p.an ? (by[k].length + (by[k].length === 1 ? " vote" : " votes")) : by[k].length ? by[k].map(u => (typeof rxNames === "function" ? rxNames([u]) : u)).join(", ") : "No votes yet";
      b.append(f, lb, n); b.onclick = ev => { ev.stopPropagation(); vote(l.i, k); };
      const g = document.createElement("div"); g.className = "popt-g"; g.appendChild(b);
      if(by[k].length && !p.an){
        const pv = document.createElement("div"); pv.className = "pv";
        pv.textContent = by[k].map(u => u === uid ? "You" : (typeof rxNames === "function" ? rxNames([u]) : u)).join(", ");
        g.appendChild(pv);
      }
      return g;
    });
    const ft = document.createElement("div"); ft.className = "pf"; ft.textContent = total + (total === 1 ? " vote" : " votes") + (ended ? " · Poll closed" : voters.has(me) && l.ch === "polls" ? " · ✓ You voted, it can't be changed" : "");
    card.replaceChildren(q, sub, ...opts, ft);
  };
  /* polls where people type their own answer: the card shows a text box, and below it everyone's answers (same answers are counted together) */
  function renderTypedPoll(l, card){
    const p = l.poll, me = whoKey(l), ended = !!p.end && Date.now() >= p.end, final = l.ch === "polls";
    const groups = new Map();
    Object.keys(l.rx || {}).forEach(u => { const t = (l.rx[u] || {}).t; if(!t) return; const key = t.toLowerCase(); if(!groups.has(key)) groups.set(key, { text: t, users: [] }); groups.get(key).users.push(u); });
    const list = [...groups.values()].sort((a, b) => b.users.length - a.users.length), total = list.reduce((n, g) => n + g.users.length, 0);
    const mine = ((l.rx || {})[me] || {}).t || "";
    const old = card.querySelector(".ptin"), keep = old && document.activeElement === old ? { v: old.value, a: old.selectionStart, b: old.selectionEnd } : null;   // don't wipe what someone is typing when the card refreshes
    const q = document.createElement("div"); q.className = "pq"; q.textContent = "📊 " + p.q;
    const sub = document.createElement("div"); sub.className = "ps";
    sub.textContent = "Type your answer" + (final ? " · Answers are final" : "") + (p.an ? " · 🕶️ Anonymous" : "") + (p.end ? " · " + endText(p.end) : "");
    const kids = [q, sub];
    if(!ended && !(final && mine)){
      const row = document.createElement("div"); row.className = "ptrow";
      const inp = document.createElement("input"); inp.type = "text"; inp.className = "ptin"; inp.maxLength = 80; inp.placeholder = "Type your answer…"; inp.value = keep ? keep.v : mine;
      const go = document.createElement("button"); go.type = "button"; go.className = "ptgo"; go.textContent = mine ? "Update" : "Submit";
      const send = () => voteText(l.i, inp.value);
      go.onclick = ev => { ev.stopPropagation(); send(); };
      inp.onkeydown = ev => { if(ev.key === "Enter"){ ev.preventDefault(); ev.stopPropagation(); send(); } };
      inp.onclick = ev => ev.stopPropagation();
      row.append(inp, go); kids.push(row);
    }
    list.forEach(g => {
      const pct = total ? Math.round(g.users.length / total * 100) : 0, isMine = g.users.includes(me);
      const b = document.createElement("div"); b.className = "popt typed" + (isMine ? " mine" : "");
      const f = document.createElement("div"); f.className = "fill"; f.style.width = pct + "%";
      const lb = document.createElement("span"); lb.className = "l"; lb.textContent = (isMine ? "✓ " : "") + g.text;
      const n = document.createElement("span"); n.className = "n"; n.textContent = g.users.length + " · " + pct + "%";
      b.append(f, lb, n);
      const gw = document.createElement("div"); gw.className = "popt-g"; gw.appendChild(b);
      if(!p.an){ const pv = document.createElement("div"); pv.className = "pv";
        pv.textContent = g.users.map(u => u === uid ? "You" : (typeof rxNames === "function" ? rxNames([u]) : u)).join(", "); gw.appendChild(pv); }
      kids.push(gw);
    });
    const ft = document.createElement("div"); ft.className = "pf";
    ft.textContent = total + (total === 1 ? " answer" : " answers") + (ended ? " · Poll closed" : mine && final ? " · ✓ You answered, it can't be changed" : "");
    kids.push(ft);
    card.replaceChildren(...kids);
    if(keep){ const ni = card.querySelector(".ptin"); if(ni){ ni.focus(); try{ ni.setSelectionRange(keep.a, keep.b); }catch(e){} } }
  }
  function voteText(id, text){
    const l = logs.find(x => x.i === id); if(!l || !l.poll || !l.poll.t || l.del) return;
    if(l.poll.end && Date.now() >= l.poll.end){ sys("This poll has ended."); return; }
    if(window.__pbMuted && window.__pbMuted(usr)){ sys("You're muted by an owner."); return; }
    const t = String(text || "").replace(/\s+/g, " ").trim().slice(0, 80);
    if(!t){ sys("Type an answer first."); return; }
    const me = whoKey(l), mine = (l.rx && l.rx[me]) || { e: [], v: 0 };
    if(l.ch === "polls"){
      if(mine.t){ sys("You already answered this poll. You can't change your answer anymore."); return; }
      if(!confirm("Submit “" + t + "”?\nYou won't be able to change or remove your answer afterwards.")) return;
    } else if(mine.t === t) return;
    l.rx = l.rx || {}; l.rx[me] = { e: [], v: Math.max(Date.now(), (mine.v || 0) + 1), t };
    persist(); renderRx(l); sendEntry(l);
  }
  function vote(id, k){
    const l = logs.find(x => x.i === id); if(!l || !l.poll || l.del) return;
    if(l.poll.end && Date.now() >= l.poll.end){ sys("This poll has ended."); return; }
    if(window.__pbMuted && window.__pbMuted(usr)){ sys("You're muted by an owner."); return; }
    const me = whoKey(l), mine = (l.rx && l.rx[me]) || { e: [], v: 0 }, set = new Set(mine.e.filter(e => VT.includes(e))), tok = VT[k];
    if(l.ch === "polls"){                               // Polls tab only: votes are final
      if(set.has(tok)){ sys("Votes are final: you can't take back a vote you've already made."); return; }
      if(set.size && !l.poll.m){ sys("You already voted on this poll. You can't change your vote anymore."); return; }
      if(!confirm("Vote for “" + l.poll.o[k] + "”?\nYou won't be able to change or remove your vote afterwards.")) return;
      set.add(tok);
    } else if(set.has(tok)) set.delete(tok); else { if(!l.poll.m) set.clear(); set.add(tok); }
    l.rx = l.rx || {}; l.rx[me] = { e: [...set], v: Math.max(Date.now(), (mine.v || 0) + 1) };
    persist(); renderRx(l); sendEntry(l);
  }
  setInterval(() => { logs.forEach(l => { if(l.poll && l.poll.end && !l.del) renderRx(l); }); }, 20000);   // countdown / auto-close

  /* ---------- "Seen" read receipts ---------- */
  const seen = {};                                     // room -> { uid: {n, ts} } = how far each person has read
  const roomKey = () => curCh === "dm" && dmWith ? dmWith : (curCh === "main" || curCh === "shame") ? curCh : "";
  const inRoom = (l, key) => key === "main" ? (!l.to && !l.g && !l.ch) : key === "shame" ? l.ch === "shame" : !!((l.to || l.g) && dmKey(l) === key);
  window.recordSeen = function(ctx, name, ts){
    if(!ctx.c || ctx.c === uid) return;
    const key = ctx.ch === "dm" ? "d:" + ctx.c : ctx.ch === "grp" ? "g:" + ctx.g : ctx.ch;
    const room = seen[key] || (seen[key] = {});
    room[ctx.c] = { n: name || "Someone", ts: Math.max(ts, (room[ctx.c] || {}).ts || 0) };
    renderSeen();
  };
  function renderSeen(){
    const key = roomKey(), box = $$("box");
    const clear = () => box.querySelectorAll(".seen").forEach(e => e.remove());
    if(!key || !seen[key]){ clear(); return; }
    const mine = [...box.querySelectorAll(".msg.me")].filter(e => e.offsetParent !== null && !e.classList.contains("ghost"));
    const last = mine[mine.length - 1]; if(!last){ clear(); return; }
    const lts = +last.dataset.ts || 0, room = seen[key];
    const names = Object.keys(room).filter(u => u !== uid && room[u].ts >= lts).map(u => room[u].n);
    if(!names.length){ clear(); return; }
    const isDm = key[0] === "d";
    const text = isDm ? "Seen" : "Seen by " + (names.length <= 3 ? names.join(", ") : names.length + " people");
    const cur = box.querySelector(".seen");
    if(cur && cur.parentNode.parentNode === last && cur.textContent === text) return;
    clear();
    const col = last.querySelector(":scope > .col"); if(!col) return;
    const d = document.createElement("div"); d.className = "seen"; d.textContent = text; col.appendChild(d);
  }
  let rrOn = load("pb_rr", "1") !== "0"; const lastRep = {};
  function reportRead(){
    if(!rrOn || !peer || $$("gate").style.display !== "none" || document.visibilityState !== "visible") return;
    const key = roomKey(); if(!key) return;
    const box = $$("box"); if(box.scrollHeight - box.scrollTop - box.clientHeight > 320) return;   // only counts if you're at the bottom
    let ts = 0; logs.forEach(l => { if(!l.del && l.c !== uid && inRoom(l, key) && (l.ts || 0) > ts) ts = l.ts; });
    const prev = lastRep[key] || { ts: 0, at: 0 };
    if(!ts || (ts <= prev.ts && Date.now() - prev.at < 45000)) return;
    lastRep[key] = { ts, at: Date.now() };
    const m = { t: "RD", u: usr, c: uid, i: newId(), ts };
    if(key[0] === "d"){ m.ch = "dm"; m.to = key.slice(2); } else if(key[0] === "g"){ m.ch = "grp"; m.g = key.slice(2); } else m.ch = key;
    routeTyping(m, null);
  }
  tick(() => { reportRead(); renderSeen(); }, 1200);
  document.addEventListener("visibilitychange", reportRead); window.addEventListener("focus", reportRead);
  const rrCard = document.createElement("div"); rrCard.className = "stg-card";
  rrCard.innerHTML = '<h3>👁 Read receipts</h3><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="rrchk" style="width:auto;margin:0"> Let people see when I\'ve read their messages</label><div class="stg-note">Shows “Seen” under a message once the other person has read it.</div>';
  document.querySelector(".stg-scroll").appendChild(rrCard);
  $$("rrchk").checked = rrOn; $$("rrchk").onchange = () => { rrOn = $$("rrchk").checked; save("pb_rr", rrOn ? "1" : "0"); };

  /* ---------- poll maker ---------- */
  const pm = document.createElement("div"); pm.id = "pollmod";
  pm.innerHTML = '<div class="pc"><h3>📊 Create a poll</h3><label>Question</label><input type="text" id="pq" maxlength="200" placeholder="What do you want to ask?"><label class="chk"><input type="checkbox" id="ptyped"> Let people type their own answer (no choices)</label><label class="chk"><input type="checkbox" id="pan"> 🕶️ Anonymous voting (nobody can see who voted for what)</label><div id="pchoice" style="display:flex;flex-direction:column;gap:10px"><label>Answers</label><div id="popts" style="display:flex;flex-direction:column;gap:6px"></div><button type="button" class="addopt" id="paddopt">+ Add answer</button><label class="chk"><input type="checkbox" id="pmulti"> Allow multiple answers</label></div><label>Duration</label><select id="pdur"><option value="3600000">1 hour</option><option value="86400000" selected>24 hours</option><option value="259200000">3 days</option><option value="604800000">1 week</option><option value="0">No end</option></select><div class="perr" id="perr"></div><div class="row"><button type="button" class="pcancel" id="pcancel">Cancel</button><button type="button" class="ppost" id="ppost">Post poll</button></div></div>';
  document.body.appendChild(pm);
  const optBox = $$("popts");
  $$("ptyped").onchange = () => { $$("pchoice").style.display = $$("ptyped").checked ? "none" : "flex"; };
  function addOpt(v){ if(optBox.children.length >= 8) return; const i = document.createElement("input"); i.type = "text"; i.maxLength = 80; i.placeholder = "Answer " + (optBox.children.length + 1); i.value = v || ""; optBox.appendChild(i); }
  $$("paddopt").onclick = () => { addOpt(); $$("paddopt").style.display = optBox.children.length >= 8 ? "none" : ""; optBox.lastChild.focus(); };
  function openPoll(){
    $$("pq").value = ""; $$("pmulti").checked = false; $$("ptyped").checked = false; $$("pan").checked = false; $$("pchoice").style.display = "flex"; $$("pdur").value = "86400000"; $$("perr").textContent = "";
    optBox.replaceChildren(); addOpt(); addOpt(); $$("paddopt").style.display = ""; pm.classList.add("open"); $$("pq").focus();
  }
  const closePoll = () => pm.classList.remove("open");
  $$("pcancel").onclick = closePoll;
  pm.addEventListener("click", e => { if(e.target === pm) closePoll(); });
  $$("ppost").onclick = () => {
    const q = $$("pq").value.trim(), os = [...optBox.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
    const uniq = [...new Set(os.map(o => o.toLowerCase()))];
    if(!q){ $$("perr").textContent = "Type a question."; return; }
    if($$("ptyped").checked){ const d = +$$("pdur").value; closePoll(); postMsg(q, 0, 0, { poll: { q, o: [], t: 1, m: 0, ...($$("pan").checked ? { an: 1 } : {}), end: d ? Date.now() + d : 0 } }); return; }
    if(os.length < 2 || uniq.length < os.length){ $$("perr").textContent = os.length < 2 ? "Add at least 2 answers." : "Answers must be different."; return; }
    const dur = +$$("pdur").value;
    closePoll(); postMsg(q, 0, 0, { poll: { q, o: os, m: $$("pmulti").checked ? 1 : 0, ...($$("pan").checked ? { an: 1 } : {}), end: dur ? Date.now() + dur : 0 } });
  };

  /* ---------- file picker ---------- */
  const pf = document.createElement("input"); pf.type = "file"; pf.multiple = true; pf.style.display = "none"; document.body.appendChild(pf);
  const MAXF = 2.5 * 1024 * 1024;
  pf.onchange = async () => {
    const fs = [...pf.files]; pf.value = "";
    for(const f of fs.slice(0, 5)){
      if(f.size > MAXF){ sys("File too big (2.5 MB max): " + f.name); continue; }
      const url = await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.onerror = () => res(""); r.readAsDataURL(f); });
      if(!url) continue;
      if(f.type.startsWith("image/")) await new Promise(res => shrinkImage(url, d => { postMsg(d, 1); res(); }));
      else postMsg("data:application/octet-stream;base64," + url.slice(url.indexOf(",") + 1), 0, 0, { fl: 1, fn: f.name, fz: f.size });
    }
  };

  /* ---------- "Upload photos": straight to the Files app, no preview panel ---------- */
  const pp = document.createElement("input"); pp.type = "file"; pp.multiple = true; pp.style.display = "none";
  pp.accept = ".jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.bmp,.avif";
  document.body.appendChild(pp);
  pp.onchange = async () => {
    const fs = [...pp.files].filter(f => f.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(f.name)); pp.value = "";
    for(const f of fs.slice(0, 10)){
      if(f.size > 10 * 1024 * 1024){ sys("Image too big (10MB max): " + f.name); continue; }
      const url = await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.onerror = () => res(""); r.readAsDataURL(f); });
      if(url) await new Promise(res => shrinkImage(url, d => { postMsg(d, 1); res(); }));
    }
  };

  /* ---------- take a photo with the camera (instead of picking one); it is sent the same way as an uploaded photo ---------- */
  const shot = document.createElement("input"); shot.type = "file"; shot.accept = "image/*"; shot.setAttribute("capture", "environment"); shot.style.display = "none"; document.body.appendChild(shot);
  function sendPhoto(f){ const dt = new DataTransfer(); dt.items.add(f); pp.files = dt.files; pp.onchange(); }
  shot.onchange = () => { const f = shot.files && shot.files[0]; shot.value = ""; if(f) sendPhoto(f); };
  function takePhoto(){
    const md = navigator.mediaDevices;
    if(!window.isSecureContext || !md || !md.getUserMedia){ shot.click(); return; }       // no https / old browser: open the phone's own camera app
    if(document.getElementById("cam-ov")) return;
    const ov = document.createElement("div"); ov.id = "cam-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Take a photo");
    ov.innerHTML = '<video autoplay playsinline muted></video><canvas hidden></canvas><div class="cm-msg"></div><div class="cm-bar"><button type="button" class="cm-x" title="Close">✕</button><button type="button" class="cm-snap" title="Take photo"></button><button type="button" class="cm-flip" title="Switch camera">🔄</button><button type="button" class="cm-retake" hidden>↺ Retake</button><button type="button" class="cm-use" hidden>✔ Send photo</button></div>';
    document.body.appendChild(ov);
    const q = x => ov.querySelector(x), vid = q("video"), cv = q("canvas"), msg = q(".cm-msg");
    let stream = null, facing = "environment", blob = null, first = true;
    const stop = () => { if(stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } };
    const esc = e => { if(e.key === "Escape") close(); };
    let tok = 0, closed = false;
    const close = () => { closed = true; stop(); ov.remove(); document.removeEventListener("keydown", esc); };
    document.addEventListener("keydown", esc);
    function start(){
      stop(); msg.textContent = ""; const my = ++tok; try{ vid.srcObject = null; }catch(e){}
      const v = { width: { ideal: 1920 }, height: { ideal: 1080 } };
      const saved = first && window.PBM ? window.PBM.video().deviceId : null;          // the camera picked in Settings > Accessibility
      if(saved) v.deviceId = saved; else v.facingMode = { ideal: facing };
      first = false;
      const live = () => !closed && my === tok;
      const open = (window.PBM && window.PBM.openCam) ? window.PBM.openCam(v, vid, live)
        : md.getUserMedia({ video: v }).then(st => { vid.srcObject = st; try{ vid.muted = true; vid.play(); }catch(e){} return st; });
      open.then(st => {
        if(!live()){ st.getTracks().forEach(t => t.stop()); return; }
        stream = st;
        const fm = st.getVideoTracks()[0].getSettings().facingMode; if(fm) facing = fm;
        vid.classList.toggle("mir", facing === "user");
      }).catch(err => {
        if(!live() || (err && err.message === "cancelled")) return;
        shot.setAttribute("capture", facing === "user" ? "user" : "environment");   // fall back to the phone's picker on the camera that was asked for
        close(); shot.click();
      });
    }
    function review(on){ q(".cm-snap").hidden = q(".cm-flip").hidden = on; q(".cm-retake").hidden = q(".cm-use").hidden = !on; }
    q(".cm-x").onclick = close;
    q(".cm-flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; start(); };
    q(".cm-snap").onclick = () => {
      if(!vid.videoWidth) return;
      cv.width = vid.videoWidth; cv.height = vid.videoHeight; cv.getContext("2d").drawImage(vid, 0, 0);
      cv.toBlob(b => { if(!b) return; blob = b; vid.pause(); review(true); }, "image/jpeg", 0.92);
    };
    q(".cm-retake").onclick = () => { blob = null; vid.play(); review(false); };
    q(".cm-use").onclick = () => { if(!blob) return; const f = new File([blob], "photo-" + Date.now() + ".jpg", { type: "image/jpeg", lastModified: Date.now() }); close(); sendPhoto(f); };
    start();
  }

  /* ---------- the + menu (photos · camera · file · poll) ---------- */
  const plus = document.querySelector("label.plus");
  const menu = document.createElement("div"); menu.id = "plusmenu";
  menu.innerHTML = '<button type="button" data-a="photo"><i>🖼️</i>Upload photos</button><button type="button" data-a="camera"><i>📷</i>Take a photo</button><button type="button" data-a="gif"><i>🎞️</i>Send a GIF</button><button type="button" data-a="file"><i>📎</i>Upload a file</button><button type="button" data-a="poll"><i>📊</i>Create poll</button>';
  document.body.appendChild(menu);
  const closeMenu = () => { menu.classList.remove("open"); plus.classList.remove("open"); };
  plus.addEventListener("click", e => {
    if(window.__pbDirect){ window.__pbDirect = false; return; }          // photo panel opens/closes the way it always did
    e.preventDefault(); e.stopImmediatePropagation();
    if($$("fi").disabled) return;
    if($$("attach") && $$("attach").classList.contains("on")){ window.__pbDirect = true; plus.click(); return; }   // panel open: close it
    if(menu.classList.contains("open")){ closeMenu(); return; }
    const gal = curCh === "gal", pl = curCh === "polls";
    menu.querySelectorAll('[data-a]').forEach(b => { const a = b.dataset.a; b.style.display = pl ? (a === "poll" ? "" : "none") : (gal && a !== "photo" && a !== "camera") ? "none" : ""; });
    const r = plus.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - 230)) + "px"; menu.style.bottom = (innerHeight - r.top + 10) + "px";
    menu.classList.add("open"); plus.classList.add("open");
  }, true);
  menu.addEventListener("click", e => {
    const b = e.target.closest("button[data-a]"); if(!b) return; const a = b.dataset.a;
    closeMenu();
    if(a === "photo") pp.click();
    else if(a === "camera") takePhoto();
    else if(a === "file") pf.click();
    else if(a === "poll") openPoll();
    else if(a === "gif") setTimeout(() => { const g = document.getElementById("gif-btn"); if(g) g.click(); }, 0);
  });
  document.addEventListener("click", e => { if(menu.classList.contains("open") && !e.target.closest("#plusmenu") && !e.target.closest("label.plus")) closeMenu(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape"){ closeMenu(); closePoll(); } });

  /* ---------- new version on the server: everyone gets kicked to a "please refresh" screen ---------- */
  (function(){
    if(!/^https?:$/.test(location.protocol)) return;                        // opened from a file: nothing to check
    const own = (($$("gver") || {}).textContent || "").match(/\d+(?:\.\d+)*/);
    let base = null, shown = false;
    const hash = t => { let h = 5381; for(let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return t.length + ":" + h; };
    function showUpdate(){
      if(shown) return; shown = true;
      try{ if(window.__leave) window.__leave("New update is out, please refresh the page."); }catch(e){}
      try{ if(peer) peer.destroy(); }catch(e){}
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.92);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif";
      ov.innerHTML = '<style>@keyframes pbUpdSpin{to{transform:rotate(360deg)}}</style><div style="font-size:46px;display:inline-block;animation:pbUpdSpin 1.4s linear infinite">🔄</div><div style="font-size:22px;font-weight:800">New update is out</div><div style="font-size:15px;opacity:.8;max-width:320px">Please refresh the page to keep chatting.</div><button type="button" style="border:none;border-radius:999px;padding:12px 28px;font-size:16px;font-weight:700;background:#0a84ff;color:#fff;cursor:pointer">Refresh</button>';
      ov.querySelector("button").onclick = () => { const u = new URL(location.href); u.searchParams.set("v", Date.now()); location.replace(u.toString()); };
      document.body.appendChild(ov); try{ const ph = document.getElementById("px-host"); if(ph) ph.style.display = "none"; }catch(e){}
    }
    let sigBase = null, pending = 0, tick = 0, busy = false;
    const urlNow = () => { const u = new URL(location.href); u.hash = ""; u.searchParams.set("_", Date.now()); return u.toString(); };
    async function sigOf(url){                                              // cheap "has the file changed?" fingerprint (headers only)
      try{
        const r = await fetch(url, { method: "HEAD", cache: "no-store" });
        if(!r.ok) return "";                                                // host refuses HEAD (404/405): fall back to full downloads instead of giving up
        const s = ["etag", "last-modified", "content-length"].map(k => r.headers.get(k) || "").join("|");
        return s === "||" ? "" : s;
      }catch(e){ return null; }                                             // network down: conclude nothing
    }
    async function check(){
      if(shown || busy) return; busy = true;
      try{
        const url = urlNow();
        const sg = await sigOf(url);
        if(sg === null) return;
        tick++;
        if(sg && sigBase !== null && base !== null && sg === sigBase) return;   // identical headers: nothing to download
        if(!sg && base !== null && tick % 2 !== 1) return;                  // no usable headers: full check every other poll
        const r = await fetch(url, { cache: "no-store" }); if(!r.ok) return;
        const t = await r.text(), v = t.match(/id="gver">Version (\d+(?:\.\d+)*)</);
        if(!v) return;                                                      // not our page (error / placeholder page): ignore it
        if(own && v[1] !== own[0]) return showUpdate();                     // version number changed
        const h = hash(t);
        if(base === null){ base = h; sigBase = sg; pending = 0; }
        else if(h !== base){ if(++pending >= 2) showUpdate(); else setTimeout(check, 4000); }   // same version, different file: confirm quickly
        else { pending = 0; sigBase = sg; }
      }catch(e){} finally { busy = false; }
    }
    check(); setInterval(check, 20000);
    document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible") check(); });
    window.addEventListener("focus", check); window.addEventListener("online", check); window.addEventListener("pageshow", check);
  })();
})();
