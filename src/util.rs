//! Small pure helpers (no Cloudflare types in here, so they can be unit-tested on a normal computer).

/// JavaScript's `string.length` counts UTF-16 units. The page was written against those limits,
/// so we count the same way to keep every size limit exactly where it was.
pub fn len16(s: &str) -> usize {
    s.encode_utf16().count()
}

/// JavaScript's `string.slice(0, n)` (by UTF-16 units, never cutting a character in half).
pub fn slice16(s: &str, n: usize) -> String {
    let mut used = 0;
    let mut out = String::new();
    for c in s.chars() {
        used += c.len_utf16();
        if used > n {
            break;
        }
        out.push(c);
    }
    out
}

fn is_word(c: char) -> bool {
    c.is_ascii_alphanumeric() || c == '_' || c == '-'
}

/// `?room=...` -> the room's name: only letters, digits, `_` and `-`, at most 64 long, default "main".
pub fn room_name(raw: Option<&str>) -> String {
    let cleaned: String = raw.unwrap_or("").chars().filter(|c| is_word(*c)).take(64).collect();
    if cleaned.is_empty() { "main".to_string() } else { cleaned }
}

/// `/db/rooms/<name><rest>` -> (`name`, `rest`). The name is the longest run of `[A-Za-z0-9_-]`.
pub fn split_room_path(path: &str) -> Option<(&str, &str)> {
    let after = path.strip_prefix("/db/rooms/")?;
    let end = after.find(|c: char| !is_word(c)).unwrap_or(after.len());
    if end == 0 {
        return None;
    }
    Some((&after[..end], &after[end..]))
}

/// The Worker only forwards `/db/rooms/<1-64 chars>/...` and `/db/rooms/<1-64 chars>.json`.
pub fn db_room(path: &str) -> Option<&str> {
    let (name, rest) = split_room_path(path)?;
    if name.len() > 64 {
        return None;
    }
    if rest.starts_with('/') || rest == ".json" {
        Some(name)
    } else {
        None
    }
}

/// `/gc/<id>.json` -> the (percent-decoded) id. 1 to 200 characters, no slash.
pub fn gc_key(sub: &str) -> Option<String> {
    let mid = sub.strip_prefix("/gc/")?.strip_suffix(".json")?;
    if mid.is_empty() || mid.contains('/') || len16(mid) > 200 {
        return None;
    }
    Some(percent_decode(mid))
}

pub fn percent_decode(s: &str) -> String {
    let b = s.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            let h = (b[i + 1] as char).to_digit(16);
            let l = (b[i + 2] as char).to_digit(16);
            if let (Some(h), Some(l)) = (h, l) {
                out.push((h * 16 + l) as u8);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// `/m.json`, `/g.json`, `/t.json` -> "m", "g", "t"
pub fn node_name(sub: &str) -> Option<&'static str> {
    match sub {
        "/m.json" => Some("m"),
        "/g.json" => Some("g"),
        "/t.json" => Some("t"),
        _ => None,
    }
}

/// `Number(x) || 0`, never below 0, for the `startAt` query value.
pub fn start_at(raw: Option<&str>) -> f64 {
    let n = raw.and_then(|s| s.trim().parse::<f64>().ok()).unwrap_or(0.0);
    if n.is_nan() { 0.0 } else { n.max(0.0) }
}

/// One record as it goes out to the page: `{"up":N,"d":"..."}` (with `d` safely escaped).
pub fn record_json(up: i64, d: &str) -> String {
    format!("{{\"up\":{},\"d\":{}}}", up, serde_json::to_string(d).unwrap_or_else(|_| "\"\"".into()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rooms() {
        assert_eq!(room_name(None), "main");
        assert_eq!(room_name(Some("")), "main");
        assert_eq!(room_name(Some("lospurebro")), "lospurebro");
        assert_eq!(room_name(Some("a b/c!d")), "abcd");
        assert_eq!(room_name(Some("é!?")), "main");
        assert_eq!(room_name(Some(&"x".repeat(100))).len(), 64);
    }

    #[test]
    fn routes() {
        assert_eq!(db_room("/db/rooms/lospurebro.json"), Some("lospurebro"));
        assert_eq!(db_room("/db/rooms/lospurebro/m.json"), Some("lospurebro"));
        assert_eq!(db_room("/db/rooms/lospurebro"), None);
        assert_eq!(db_room("/db/rooms/lospurebro.jsonx"), None);
        assert_eq!(db_room("/db/rooms/"), None);
        assert_eq!(db_room("/db/rooms//m.json"), None);
        assert_eq!(db_room(&format!("/db/rooms/{}/m.json", "a".repeat(65))), None);
        assert_eq!(db_room(&format!("/db/rooms/{}/m.json", "a".repeat(64))).map(str::len), Some(64));
        assert_eq!(split_room_path("/db/rooms/abc/gc/x.json"), Some(("abc", "/gc/x.json")));
        assert_eq!(split_room_path("/db/rooms/abc.json"), Some(("abc", ".json")));
    }

    #[test]
    fn nodes_and_gc() {
        assert_eq!(node_name("/m.json"), Some("m"));
        assert_eq!(node_name("/x.json"), None);
        assert_eq!(gc_key("/gc/abc.json").as_deref(), Some("abc"));
        assert_eq!(gc_key("/gc/a%20b.json").as_deref(), Some("a b"));
        assert_eq!(gc_key("/gc/.json"), None);
        assert_eq!(gc_key("/gc/a/b.json"), None);
        assert_eq!(gc_key(&format!("/gc/{}.json", "a".repeat(201))), None);
        assert!(gc_key(&format!("/gc/{}.json", "a".repeat(200))).is_some());
    }

    #[test]
    fn numbers_and_json() {
        assert_eq!(start_at(None), 0.0);
        assert_eq!(start_at(Some("1700000000000")), 1700000000000.0);
        assert_eq!(start_at(Some("-5")), 0.0);
        assert_eq!(start_at(Some("nope")), 0.0);
        assert_eq!(record_json(5, "QUJD"), r#"{"up":5,"d":"QUJD"}"#);
        assert_eq!(record_json(5, "a\"b"), r#"{"up":5,"d":"a\"b"}"#);
        assert_eq!(slice16("héllo", 3), "hél");
        assert_eq!(slice16("a😀b", 2), "a");
        assert_eq!(len16("a😀"), 3);
        assert_eq!(percent_decode("100%"), "100%");
        assert_eq!(percent_decode("%zz"), "%zz");
    }
}
