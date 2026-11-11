//! Cloud storage ("mailbox") for the page. Replaces Firebase: same little REST shape the page
//! already used, so nothing has to be re-learned.
//!
//!   GET    /db/rooms/<room>/stamp.json            -> {"m":n,"g":n,"t":n}   newest write per node (tiny, used to skip downloads)
//!   GET    /db/rooms/<room>/<m|g|t>.json?orderBy="up"&startAt=N   -> { key: {up, d}, ... } or null
//!   PATCH  /db/rooms/<room>/<m|g|t>.json          body { key: {up:{".sv":"timestamp"}, d:"..."} | null }
//!   GET|PUT|DELETE /db/rooms/<room>/gc/<id>.json  one uploaded game's code
//!   PUT|PATCH /db/rooms/<room>.json               import a Firebase export: { m:{}, g:{}, t:{}, gc:{} }
//!
//! Records are already encrypted by the page; the server only stores text.
use serde::Deserialize;
use serde_json::{Map, Value};
use worker::*;

use crate::util::{self, len16, record_json, slice16};
use crate::{CORS, JSON_HEAD};

const MAX_D: usize = 700_000; // same per-record limit Firebase had
const MAX_BODY: usize = 12_000_000;
const MAX_REPLY: usize = 6_000_000; // a download is split into pieces of about this size ("X-More: 1" = ask again)

#[durable_object]
pub struct Store {
    sql: SqlStorage,
}

#[derive(Deserialize)]
struct UpRow {
    up: i64,
}
#[derive(Deserialize)]
struct Row {
    k: String,
    up: i64,
    d: String,
}

impl DurableObject for Store {
    fn new(state: State, _env: Env) -> Self {
        let sql = state.storage().sql();
        let none = || None::<Vec<SqlStorageValue>>;
        let _ = sql.exec("CREATE TABLE IF NOT EXISTS rec (n TEXT NOT NULL, k TEXT NOT NULL, up INTEGER NOT NULL, d TEXT NOT NULL, PRIMARY KEY (n, k))", none());
        let _ = sql.exec("CREATE INDEX IF NOT EXISTS rec_up ON rec (n, up)", none());
        let _ = sql.exec("CREATE TABLE IF NOT EXISTS stamp (n TEXT PRIMARY KEY, up INTEGER NOT NULL)", none());
        Self { sql }
    }

    async fn fetch(&self, mut request: Request) -> Result<Response> {
        let url = request.url()?;
        let path = url.path().to_string();
        let sub = util::split_room_path(&path).map(|(_, rest)| rest).unwrap_or("");
        let method = request.method();

        if sub == "/stamp.json" && method == Method::Get {
            return out(
                format!(r#"{{"m":{},"g":{},"t":{}}}"#, self.last("m")?, self.last("g")?, self.last("t")?),
                200,
                &[],
            );
        }

        if let Some(n) = util::node_name(sub) {
            return match method {
                Method::Get => self.list(n, &url),
                Method::Patch | Method::Post => {
                    let body = body(&mut request).await;
                    self.patch(n, body)
                }
                _ => out("null", 200, &[]),
            };
        }

        if let Some(k) = util::gc_key(sub) {
            match method {
                Method::Get => {
                    let rows = self.rows("SELECT k, up, d FROM rec WHERE n = 'gc' AND k = ?", vec![k.into()])?;
                    return out(rows.first().map(|r| record_json(r.up, &r.d)).unwrap_or_else(|| "null".into()), 200, &[]);
                }
                Method::Delete => {
                    self.run("DELETE FROM rec WHERE n = 'gc' AND k = ?", vec![k.into()])?;
                    return out("null", 200, &[]);
                }
                Method::Put | Method::Patch => {
                    let v = body(&mut request).await;
                    let d = v.as_ref().and_then(|v| v.get("d")).and_then(Value::as_str);
                    let Some(d) = d.filter(|d| len16(d) < MAX_D) else { return bad("record too big or invalid") };
                    let up = self.next_up("gc")?;
                    self.bump("gc", up)?;
                    self.run(
                        "INSERT OR REPLACE INTO rec (n, k, up, d) VALUES ('gc', ?, ?, ?)",
                        vec![k.into(), up.into(), d.to_string().into()],
                    )?;
                    return out("null", 200, &[]);
                }
                _ => {}
            }
        }

        if sub == ".json" && matches!(method, Method::Put | Method::Patch) {
            return self.import(body(&mut request).await);
        }
        out("null", 404, &[])
    }
}

impl Store {
    fn run(&self, sql: &str, binds: Vec<SqlStorageValue>) -> Result<SqlCursor> {
        self.sql.exec(sql, binds)
    }

    fn rows(&self, sql: &str, binds: Vec<SqlStorageValue>) -> Result<Vec<Row>> {
        self.run(sql, binds)?.to_array::<Row>()
    }

    fn last(&self, n: &str) -> Result<i64> {
        let r = self.run("SELECT up FROM stamp WHERE n = ?", vec![n.to_string().into()])?.to_array::<UpRow>()?;
        Ok(r.first().map(|r| r.up).unwrap_or(0))
    }

    /// strictly increasing, so "anything newer than X" is exact
    fn next_up(&self, n: &str) -> Result<i64> {
        Ok(now().max(self.last(n)? + 1))
    }

    fn bump(&self, n: &str, up: i64) -> Result<()> {
        self.run(
            "INSERT INTO stamp (n, up) VALUES (?, ?) ON CONFLICT(n) DO UPDATE SET up = excluded.up",
            vec![n.to_string().into(), up.into()],
        )?;
        Ok(())
    }

    fn list(&self, n: &str, url: &Url) -> Result<Response> {
        let start_at = util::start_at(url.query_pairs().find(|(k, _)| k == "startAt").map(|(_, v)| v.into_owned()).as_deref());
        let cursor = self.run(
            "SELECT k, up, d FROM rec WHERE n = ? AND up >= ? ORDER BY up ASC",
            vec![n.to_string().into(), SqlStorageValue::Float(start_at)],
        )?;
        let (mut text, mut size, mut first, mut more) = (String::new(), 0usize, true, false);
        for row in cursor.next::<Row>() {
            let r = row?;
            if !first && size > MAX_REPLY {
                more = true;
                break;
            }
            let piece = format!("{}:{}", serde_json::to_string(&r.k).unwrap_or_default(), record_json(r.up, &r.d));
            if !first {
                text.push(',');
            }
            size += piece.len();
            text.push_str(&piece);
            first = false;
        }
        let body = if first { "null".to_string() } else { format!("{{{text}}}") };
        out(body, 200, if more { &[("X-More", "1")] } else { &[] })
    }

    fn patch(&self, n: &str, batch: Option<Value>) -> Result<Response> {
        let Some(Value::Object(batch)) = batch else { return bad("expected an object") };
        if batch.len() > 100 {
            return bad("too many records");
        }
        for (k, v) in &batch {
            // all or nothing, like the old database
            if k.is_empty() || len16(k) > 200 {
                return bad("bad key");
            }
            if !v.is_null() && !valid_record(v) {
                return bad("record too big or invalid");
            }
        }
        // every record gets its own, strictly increasing number (no ties, so a download can be paged safely)
        let mut up = self.next_up(n)? - 1;
        // No `await` happens from here to the end, so the runtime commits all these writes as one atomic unit.
        for (k, v) in &batch {
            match v.get("d").and_then(Value::as_str) {
                None => {
                    self.run("DELETE FROM rec WHERE n = ? AND k = ?", vec![n.to_string().into(), k.clone().into()])?;
                }
                Some(d) => {
                    up += 1;
                    self.run(
                        "INSERT OR REPLACE INTO rec (n, k, up, d) VALUES (?, ?, ?, ?)",
                        vec![n.to_string().into(), k.clone().into(), up.into(), d.to_string().into()],
                    )?;
                }
            }
        }
        self.bump(n, up.max(self.last(n)?))?;
        out("{}", 200, &[])
    }

    /// import a whole Firebase export
    fn import(&self, all: Option<Value>) -> Result<Response> {
        let Some(Value::Object(all)) = all else { return bad("expected an object") };
        let mut count = 0usize;
        for n in ["m", "g", "t", "gc"] {
            let Some(Value::Object(node)) = all.get(n) else { continue };
            let mut list: Vec<(String, i64, &str)> = node
                .iter()
                .filter_map(|(k, v)| {
                    let d = v.get("d")?.as_str().filter(|d| len16(d) < MAX_D)?;
                    let want = v.get("up").and_then(as_finite).map(|f| f.floor() as i64).unwrap_or_else(now);
                    Some((slice16(k, 200), want, d))
                })
                .collect();
            list.sort_by_key(|(_, up, _)| *up);
            let mut top = self.last(n)?;
            for (k, want, d) in list {
                let up = want.max(top + 1); // keep the original order, but never tie
                top = up;
                self.run(
                    "INSERT OR REPLACE INTO rec (n, k, up, d) VALUES (?, ?, ?, ?)",
                    vec![n.to_string().into(), k.into(), up.into(), d.to_string().into()],
                )?;
                count += 1;
            }
            self.bump(n, top)?;
        }
        out(format!(r#"{{"imported":{count}}}"#), 200, &[])
    }
}

fn valid_record(v: &Value) -> bool {
    v.get("d").and_then(Value::as_str).map(|d| len16(d) < MAX_D).unwrap_or(false)
}

/// `Number.isFinite(+x)` for the numbers and numeric strings a Firebase export can hold
fn as_finite(v: &Value) -> Option<f64> {
    let f = match v {
        Value::Number(n) => n.as_f64()?,
        Value::String(s) => s.trim().parse::<f64>().ok()?,
        _ => return None,
    };
    f.is_finite().then_some(f)
}

fn now() -> i64 {
    Date::now().as_millis() as i64
}

async fn body(request: &mut Request) -> Option<Value> {
    let text = request.text().await.ok()?;
    if len16(&text) > MAX_BODY {
        return None;
    }
    serde_json::from_str::<Value>(&text).ok()
}

fn out(body: impl Into<String>, status: u16, extra: &[(&str, &str)]) -> Result<Response> {
    let mut r = Response::ok(body.into())?.with_status(status);
    let h = r.headers_mut();
    for (k, v) in CORS.iter().chain(JSON_HEAD.iter()).chain(extra.iter()) {
        h.set(k, v)?;
    }
    Ok(r)
}

fn bad(msg: &str) -> Result<Response> {
    let mut m = Map::new();
    m.insert("error".into(), Value::String(msg.into()));
    out(Value::Object(m).to_string(), 400, &[])
}
