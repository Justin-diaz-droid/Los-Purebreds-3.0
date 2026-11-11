//! Los Purebreds chat relay.
//!
//! One Durable Object per room keeps every browser connected over WebSocket.
//! The first browser to connect is the "host" (the page's own host logic keeps
//! running in that browser: passwords, bans, DM routing...). Everyone else talks
//! to the host through this relay, so nobody needs to reach the host's network.
//! If the host leaves, everyone else is dropped; the page auto-reconnects and the
//! first one back becomes the new host.
//!
//! Frames (plain text, no JSON parsing here so big images stay cheap):
//!   server -> client : "c{json}" control   | "d<payload>" data from the host
//!   server -> host   : "c{json}" control   | "o<cid>" client joined | "x<cid>" client left
//!                      "d<cid>\n<payload>" data from that client
//!   client -> server : "<payload>"
//!   host   -> server : "d<cid>\n<payload>" to one client | "k<cid>" disconnect that client
use serde::{Deserialize, Serialize};
use worker::wasm_bindgen::JsCast;
use worker::*;

use crate::util::len16;

const MAX_FRAME: usize = 1_000_000;

/// What each socket remembers about itself (survives the object going to sleep).
#[derive(Serialize, Deserialize, Clone)]
struct Me {
    cid: String,
    host: bool,
    #[serde(default)]
    gone: bool,
}

#[durable_object]
pub struct Room {
    state: State,
}

impl DurableObject for Room {
    fn new(state: State, _env: Env) -> Self {
        // keep-alive pings are answered without waking the object
        if let Ok(pair) = worker::worker_sys::WebSocketRequestResponsePair::new("ping", "pong") {
            state.set_websocket_auto_response(&pair);
        }
        Self { state }
    }

    async fn fetch(&self, _req: Request) -> Result<Response> {
        let pair = WebSocketPair::new()?;
        let server = pair.server;
        self.state.accept_web_socket(&server);

        let cid = new_cid();
        match self.host_socket(None) {
            Some(host) => {
                server.serialize_attachment(Me { cid: cid.clone(), host: false, gone: false })?;
                server.send_with_str(hello(&cid, false))?;
                let _ = host.send_with_str(format!("o{cid}"));
            }
            None => {
                server.serialize_attachment(Me { cid: cid.clone(), host: true, gone: false })?;
                server.send_with_str(hello(&cid, true))?;
            }
        }
        Response::from_websocket(pair.client)
    }

    async fn websocket_message(&self, ws: WebSocket, message: WebSocketIncomingMessage) -> Result<()> {
        let message = match message {
            WebSocketIncomingMessage::String(s) => s,
            WebSocketIncomingMessage::Binary(_) => return Ok(()),
        };
        if len16(&message) > MAX_FRAME {
            return Ok(());
        }
        let Some(me) = attachment(&ws) else { return Ok(()) };

        if !me.host {
            if let Some(host) = self.host_socket(Some(&me.cid)) {
                let _ = host.send_with_str(format!("d{}\n{}", me.cid, message));
            }
            return Ok(());
        }

        if let Some(rest) = message.strip_prefix('d') {
            let Some(nl) = rest.find('\n') else { return Ok(()) };
            if let Some(target) = self.by_cid(&rest[..nl]) {
                let _ = target.send_with_str(format!("d{}", &rest[nl + 1..]));
            }
        } else if let Some(cid) = message.strip_prefix('k') {
            if let Some(target) = self.by_cid(cid) {
                if let Some(t) = attachment(&target) {
                    // mark it handled so the close event that follows doesn't report it a second time
                    let _ = target.serialize_attachment(Me { gone: true, ..t.clone() });
                    let _ = target.close(Some(4001), Some("removed"));
                    let _ = ws.send_with_str(format!("x{}", t.cid));
                }
            }
        }
        Ok(())
    }

    async fn websocket_close(&self, ws: WebSocket, _code: usize, _reason: String, _was_clean: bool) -> Result<()> {
        self.gone(&ws);
        Ok(())
    }

    async fn websocket_error(&self, ws: WebSocket, _error: Error) -> Result<()> {
        self.gone(&ws);
        Ok(())
    }
}

impl Room {
    /// The socket that is the host, other than the one whose id is `except`.
    fn host_socket(&self, except: Option<&str>) -> Option<WebSocket> {
        self.state.get_websockets().into_iter().find(|s| match attachment(s) {
            Some(m) => m.host && Some(m.cid.as_str()) != except,
            None => false,
        })
    }

    fn by_cid(&self, cid: &str) -> Option<WebSocket> {
        self.state
            .get_websockets()
            .into_iter()
            .find(|s| attachment(s).map(|m| m.cid == cid).unwrap_or(false))
    }

    fn gone(&self, ws: &WebSocket) {
        let Some(me) = attachment(ws) else { return };
        if me.gone {
            return;
        }
        let _ = ws.serialize_attachment(Me { gone: true, ..me.clone() });
        if me.host {
            // host left: drop everyone so they reconnect and the first one back becomes host
            for s in self.state.get_websockets() {
                if attachment(&s).map(|m| m.cid != me.cid).unwrap_or(true) {
                    let _ = s.close(Some(1012), Some("host left"));
                }
            }
        } else if let Some(host) = self.host_socket(Some(&me.cid)) {
            let _ = host.send_with_str(format!("x{}", me.cid));
        }
        let _ = ws.close(Some(1000), Some("bye"));
    }
}

fn attachment(ws: &WebSocket) -> Option<Me> {
    ws.deserialize_attachment::<Me>().ok().flatten()
}

fn hello(cid: &str, host: bool) -> String {
    format!(r#"c{{"k":"hello","cid":"{cid}","host":{host}}}"#)
}

/// A short random connection id (10 hex characters), from the runtime's secure random generator.
fn new_cid() -> String {
    let uuid = (|| -> Option<String> {
        let global = worker::js_sys::global();
        let crypto = worker::js_sys::Reflect::get(&global, &"crypto".into()).ok()?;
        let f: worker::js_sys::Function =
            worker::js_sys::Reflect::get(&crypto, &"randomUUID".into()).ok()?.dyn_into().ok()?;
        f.call0(&crypto).ok()?.as_string()
    })();
    uuid.unwrap_or_default().replace('-', "").chars().take(10).collect()
}
