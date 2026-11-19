// Builds the small, fast public/index.html from the readable source/index.html.
// Usage:  npm i esbuild   then   node tools/build.mjs
// Edit source/index.html, never public/index.html (it is generated).
import { readFileSync, writeFileSync } from "node:fs";
import { transformSync } from "esbuild";

const src = readFileSync(new URL("../source/index.html", import.meta.url), "utf8");
let skipped = 0;

// One pass, left to right: a "<style>" that sits inside a script's string is part of that script, never CSS.
const out = src.replace(
  /<script\b([^>]*)>([\s\S]*?)<\/script>|<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
  (m, sa, code, ya, css) => {
    if (code !== undefined) {
      const notJs = /\btype\s*=/.test(sa) && !/type\s*=\s*["']?(text\/javascript|module)/i.test(sa);
      if (/\bsrc\s*=/.test(sa) || notJs || !code.trim()) return m;
      try {
        // whitespace + syntax only: names are NOT mangled, so inline onclick="…" handlers keep working
        const r = transformSync(code, { loader: "js", minifyWhitespace: true, minifySyntax: true, legalComments: "none" });
        return `<script${sa}>${r.code.trim()}</script>`;
      } catch (e) { skipped++; return m; }
    }
    try {
      const r = transformSync(css, { loader: "css", minifyWhitespace: true, legalComments: "none" });
      return `<style${ya}>${r.code.trim()}</style>`;
    } catch (e) { skipped++; return m; }
  }
);

writeFileSync(new URL("../public/index.html", import.meta.url), out);
console.log(`source ${src.length} -> public ${out.length} characters (${skipped} blocks left as-is)`);
