// Los Purebreds chat relay.
//
// One Durable Object per room keeps every browser connected over WebSocket.
// The first browser to connect is the "host" (the page's own host logic keeps
// running in that browser: passwords, bans, DM routing...). Everyone else talks
// to the host through this relay, so nobody needs to reach the host's network.
// If the host leaves, everyone else is dropped; the page auto-reconnects and the
// first one back becomes the new host.
//
// Frames (plain text, no JSON parsing here so big images stay cheap):
//   server -> client : "c{json}" control   | "d<payload>" data from the host
//   server -> host   : "c{json}" control   | "o<cid>" client joined | "x<cid>" client left
//                      "d<cid>\n<payload>" data from that client
//   client -> server : "<payload>"
//   host   -> server : "d<cid>\n<payload>" to one client | "k<cid>" disconnect that client
import { DurableObject } from "cloudflare:workers";

const MAX_FRAME = 1_000_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected a WebSocket", { status: 426 });
      }
      const room = (url.searchParams.get("room") || "main").replace(/[^\w-]/g, "").slice(0, 64) || "main";
      return env.ROOM.get(env.ROOM.idFromName(room)).fetch(request);
    }
    if (url.pathname.startsWith("/db/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
      const m = url.pathname.match(/^\/db\/rooms\/([\w-]{1,64})(?:\/|\.json$)/);
      if (!m) return new Response("not found", { status: 404, headers: CORS });
      return env.STORE.get(env.STORE.idFromName("db:" + m[1])).fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-More",
};
const JSON_HEAD = { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" };

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // keep-alive pings are answered without waking the object
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  fetch() {
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    const cid = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const host = this.hostSocket(server);
    if (host) {
      server.serializeAttachment({ cid, host: false });
      server.send("c" + JSON.stringify({ k: "hello", cid, host: false }));
      host.send("o" + cid);
    } else {
      server.serializeAttachment({ cid, host: true });
      server.send("c" + JSON.stringify({ k: "hello", cid, host: true }));
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  hostSocket(except) {
    return this.ctx.getWebSockets().find((s) => s !== except && s.deserializeAttachment()?.host);
  }

  webSocketMessage(ws, message) {
    if (typeof message !== "string" || message.length > MAX_FRAME) return;
    const me = ws.deserializeAttachment();
    if (!me) return;
    if (!me.host) {
      const host = this.hostSocket(ws);
      if (host) host.send("d" + me.cid + "\n" + message);
      return;
    }
    const tag = message[0];
    if (tag === "d") {
      const nl = message.indexOf("\n");
      if (nl < 0) return;
      const target = this.byCid(message.slice(1, nl));
      if (target) target.send("d" + message.slice(nl + 1));
    } else if (tag === "k") {
      const target = this.byCid(message.slice(1));
      if (target) {
        const t = target.deserializeAttachment();
        // mark it handled so the close event that follows doesn't report it a second time
        target.serializeAttachment({ ...t, gone: true });
        try { target.close(4001, "removed"); } catch {}
        ws.send("x" + t.cid);
      }
    }
  }

  byCid(cid) {
    return this.ctx.getWebSockets().find((s) => s.deserializeAttachment()?.cid === cid);
  }

  webSocketClose(ws) { this.gone(ws); }
  webSocketError(ws) { this.gone(ws); }

  gone(ws) {
    const me = ws.deserializeAttachment();
    if (!me || me.gone) return;
    ws.serializeAttachment({ ...me, gone: true });
    if (me.host) {
      // host left: drop everyone so they reconnect and the first one back becomes host
      for (const s of this.ctx.getWebSockets()) {
        if (s !== ws) { try { s.close(1012, "host left"); } catch {} }
      }
    } else {
      const host = this.hostSocket(ws);
      if (host) { try { host.send("x" + me.cid); } catch {} }
    }
    try { ws.close(1000, "bye"); } catch {}
  }
}

// ---------------------------------------------------------------------------------------------
// Cloud storage ("mailbox") for the page. Replaces Firebase: same little REST shape the page
// already used, so nothing has to be re-learned.
//
//   GET    /db/rooms/<room>/stamp.json            -> {"m":n,"g":n,"t":n}   newest write per node (tiny, used to skip downloads)
//   GET    /db/rooms/<room>/<m|g|t>.json?orderBy="up"&startAt=N   -> { key: {up, d}, ... } or null
//   PATCH  /db/rooms/<room>/<m|g|t>.json          body { key: {up:{".sv":"timestamp"}, d:"..."} | null }
//   GET|PUT|DELETE /db/rooms/<room>/gc/<id>.json  one uploaded game's code
//   PUT|PATCH /db/rooms/<room>.json               import a Firebase export: { m:{}, g:{}, t:{}, gc:{} }
//
// Records are already encrypted by the page; the server only stores text.
// ---------------------------------------------------------------------------------------------
const MAX_D = 700_000;          // same per-record limit Firebase had
const MAX_BODY = 12_000_000;
const MAX_REPLY = 6_000_000;    // a download is split into pieces of about this size ("X-More: 1" = ask again)
const NODES = new Set(["m", "g", "t"]);

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS rec (n TEXT NOT NULL, k TEXT NOT NULL, up INTEGER NOT NULL, d TEXT NOT NULL, PRIMARY KEY (n, k))");
    this.sql.exec("CREATE INDEX IF NOT EXISTS rec_up ON rec (n, up)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS stamp (n TEXT PRIMARY KEY, up INTEGER NOT NULL)");
  }

  last(n) {
    const r = this.sql.exec("SELECT up FROM stamp WHERE n = ?", n).toArray();
    return r.length ? r[0].up : 0;
  }
  nextUp(n) { return Math.max(Date.now(), this.last(n) + 1); }   // strictly increasing, so "anything newer than X" is exact
  bump(n, up) { this.sql.exec("INSERT INTO stamp (n, up) VALUES (?, ?) ON CONFLICT(n) DO UPDATE SET up = excluded.up", n, up); }
  out(body, status = 200, extra = {}) { return new Response(body, { status, headers: { ...JSON_HEAD, ...extra } }); }
  bad(msg) { return this.out(JSON.stringify({ error: msg }), 400); }

  async fetch(request) {
    const url = new URL(request.url);
    const sub = url.pathname.replace(/^\/db\/rooms\/[\w-]+/, "");   // "/m.json", "/gc/abc.json", ".json", "/stamp.json"
    const method = request.method;

    if (sub === "/stamp.json" && method === "GET") {
      return this.out(JSON.stringify({ m: this.last("m"), g: this.last("g"), t: this.last("t") }));
    }

    let mm;
    if ((mm = sub.match(/^\/([mgt])\.json$/))) {
      const n = mm[1];
      if (method === "GET") return this.list(n, url);
      if (method === "PATCH" || method === "POST") return this.patch(n, await this.body(request));
      return this.out("null");
    }
    if ((mm = sub.match(/^\/gc\/([^\/]{1,200})\.json$/))) {
      const k = decodeURIComponent(mm[1]);
      if (method === "GET") {
        const r = this.sql.exec("SELECT up, d FROM rec WHERE n = 'gc' AND k = ?", k).toArray();
        return this.out(r.length ? `{"up":${r[0].up},"d":"${r[0].d}"}` : "null");
      }
      if (method === "DELETE") { this.sql.exec("DELETE FROM rec WHERE n = 'gc' AND k = ?", k); return this.out("null"); }
      if (method === "PUT" || method === "PATCH") {
        const v = await this.body(request);
        if (!v || typeof v.d !== "string" || v.d.length >= MAX_D) return this.bad("record too big or invalid");
        const up = Math.max(Date.now(), this.last("gc") + 1); this.bump("gc", up);
        this.sql.exec("INSERT OR REPLACE INTO rec (n, k, up, d) VALUES ('gc', ?, ?, ?)", k, up, v.d);
        return this.out("null");
      }
    }
    if (sub === ".json" && (method === "PUT" || method === "PATCH")) {      // import a whole Firebase export
      const all = await this.body(request);
      if (!all || typeof all !== "object") return this.bad("expected an object");
      let count = 0;
      for (const n of ["m", "g", "t", "gc"]) {
        const nodeObj = all[n]; if (!nodeObj || typeof nodeObj !== "object") continue;
        const list = Object.entries(nodeObj)
          .filter(([, v]) => v && typeof v.d === "string" && v.d.length < MAX_D)
          .map(([k, v]) => [String(k).slice(0, 200), Number.isFinite(+v.up) ? Math.floor(+v.up) : Date.now(), v.d])
          .sort((a, b) => a[1] - b[1]);
        let top = this.last(n);
        for (const [k, want, d] of list) {
          const up = Math.max(want, top + 1); top = up;      // keep the original order, but never tie
          this.sql.exec("INSERT OR REPLACE INTO rec (n, k, up, d) VALUES (?, ?, ?, ?)", n, k, up, d); count++;
        }
        this.bump(n, top);
      }
      return this.out(JSON.stringify({ imported: count }));
    }
    return this.out("null", 404);
  }

  async body(request) {
    const text = await request.text();
    if (text.length > MAX_BODY) return null;
    try { return JSON.parse(text); } catch { return null; }
  }

  list(n, url) {
    const startAt = Math.max(0, Number(url.searchParams.get("startAt")) || 0);
    const rows = this.sql.exec("SELECT k, up, d FROM rec WHERE n = ? AND up >= ? ORDER BY up ASC", n, startAt);
    let out = "", size = 0, first = true, more = false;
    for (const r of rows) {
      if (!first && size > MAX_REPLY) { more = true; break; }
      const piece = JSON.stringify(r.k) + `:{"up":${r.up},"d":"${r.d}"}`;   // d is base64: nothing to escape
      out += (first ? "" : ",") + piece; size += piece.length; first = false;
    }
    return this.out(first ? "null" : "{" + out + "}", 200, more ? { "X-More": "1" } : {});
  }

  patch(n, batch) {
    if (!batch || typeof batch !== "object") return this.bad("expected an object");
    const entries = Object.entries(batch);
    if (entries.length > 100) return this.bad("too many records");
    for (const [k, v] of entries) {          // all or nothing, like the old database
      if (!k || k.length > 200) return this.bad("bad key");
      if (v !== null && (typeof v !== "object" || typeof v.d !== "string" || v.d.length >= MAX_D)) return this.bad("record too big or invalid");
    }
    let up = this.nextUp(n) - 1;     // every record gets its own, strictly increasing number (no ties, so a download can be paged safely)
    this.ctx.storage.transactionSync(() => {
      for (const [k, v] of entries) {
        if (v === null) this.sql.exec("DELETE FROM rec WHERE n = ? AND k = ?", n, k);
        else this.sql.exec("INSERT OR REPLACE INTO rec (n, k, up, d) VALUES (?, ?, ?, ?)", n, k, ++up, v.d);
      }
      this.bump(n, Math.max(up, this.last(n)));
    });
    return this.out("{}");
  }
}
