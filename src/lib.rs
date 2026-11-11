//! Los Purebreds 3.0 - Cloudflare Worker, written in Rust.
//!
//!   /ws?room=<name>      WebSocket chat relay            -> `Room` Durable Object (src/room.rs)
//!   /db/rooms/<room>/... cloud storage for tabs, games…  -> `Store` Durable Object (src/store.rs)
//!   everything else      the static site in /public      -> the ASSETS binding
use worker::*;

mod room;
mod store;
mod util;

pub use room::Room;
pub use store::Store;

pub(crate) const CORS: [(&str, &str); 4] = [
    ("Access-Control-Allow-Origin", "*"),
    ("Access-Control-Allow-Methods", "GET, PUT, PATCH, DELETE, OPTIONS"),
    ("Access-Control-Allow-Headers", "Content-Type"),
    ("Access-Control-Expose-Headers", "X-More"),
];
pub(crate) const JSON_HEAD: [(&str, &str); 2] = [("Content-Type", "application/json"), ("Cache-Control", "no-store")];

fn with_cors(mut r: Response) -> Result<Response> {
    for (k, v) in CORS {
        r.headers_mut().set(k, v)?;
    }
    Ok(r)
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let url = req.url()?;
    let path = url.path();

    if path == "/ws" {
        if req.headers().get("Upgrade")?.as_deref() != Some("websocket") {
            return Response::error("Expected a WebSocket", 426);
        }
        let wanted = url.query_pairs().find(|(k, _)| k == "room").map(|(_, v)| v.into_owned());
        let room = util::room_name(wanted.as_deref());
        let ns = env.durable_object("ROOM")?;
        return ns.id_from_name(&room)?.get_stub()?.fetch_with_request(req).await;
    }

    if path.starts_with("/db/") {
        if req.method() == Method::Options {
            return with_cors(Response::empty()?.with_status(204));
        }
        let Some(room) = util::db_room(path) else {
            return with_cors(Response::error("not found", 404)?);
        };
        let ns = env.store_namespace()?;
        let key = format!("db:{room}");
        return ns.id_from_name(&key)?.get_stub()?.fetch_with_request(req).await;
    }

    env.assets("ASSETS")?.fetch_request(req).await
}

trait StoreNs {
    fn store_namespace(&self) -> Result<ObjectNamespace>;
}
impl StoreNs for Env {
    fn store_namespace(&self) -> Result<ObjectNamespace> {
        self.durable_object("STORE")
    }
}
