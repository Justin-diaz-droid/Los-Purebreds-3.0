// Builds the website: public/ (readable source) -> dist/ (what Cloudflare serves).
//   - minifies every js/*.js and css/*.css file (whitespace, syntax and local variable names; top-level names are never renamed)
//   - gives each one a content hash in its file name (app.3fa9c1d2e0.js) so browsers can keep it
//     forever and still pick up a new version the moment its content changes
//   - rewrites index.html to point at the hashed names and writes dist/_headers (cache rules)
// Run:  node scripts/build-web.mjs        (wrangler does this for you, see wrangler.jsonc)
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "public", OUT = "dist";
let esbuild = null;
try { esbuild = await import("esbuild"); } catch { console.warn("esbuild not installed: files are hashed but NOT minified (run npm install)"); }

rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });
rmSync(join(OUT, "README.md"), { force: true });

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);
let html = readFileSync(join(SRC, "index.html"), "utf8");
let before = 0, after = 0;

async function pack(dir, ext, loader) {
  if (!existsSync(join(SRC, dir))) return;
  for (const file of readdirSync(join(SRC, dir)).filter((f) => f.endsWith(ext))) {
    const code = readFileSync(join(SRC, dir, file), "utf8");
    let min = code;
    if (esbuild) {
      const r = await esbuild.transform(code, { loader, minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: true, legalComments: "none" });
      for (const w of r.warnings) console.warn(`${dir}/${file}: ${w.text}`);
      min = r.code;
    }
    const name = file.slice(0, -ext.length) + "." + hash(min) + ext;
    rmSync(join(OUT, dir, file));
    writeFileSync(join(OUT, dir, name), min);
    const ref = `${dir}/${file}`;
    if (!html.includes(`"${ref}"`)) console.warn(`${ref} is not referenced by index.html`);
    html = html.split(`"${ref}"`).join(`"${dir}/${name}"`);
    before += code.length; after += min.length;
  }
}
await pack("js", ".js", "js");
await pack("css", ".css", "css");
writeFileSync(join(OUT, "index.html"), html);

// Cache rules (Cloudflare reads this file). Hashed files never change, so they are cached for a year.
writeFileSync(join(OUT, "_headers"), `/index.html
  Cache-Control: public, max-age=0, must-revalidate
/js/*
  Cache-Control: public, max-age=31536000, immutable
/css/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
`);
console.log(`built ${OUT}/  js+css ${(before / 1024) | 0} KB -> ${(after / 1024) | 0} KB`);
