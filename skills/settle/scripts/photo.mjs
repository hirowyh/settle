#!/usr/bin/env node
// settle / photo: fetch one openly licensed photo for a piece, when the person asks for a real photo and has none.
//
// Adapted from taste-skill's scripts/assets.mjs (MIT, © 2026 Leonxlnx): it searches Openverse, one index over Flickr,
// Wikimedia Commons, museums and libraries, for CC0, public-domain and CC BY pictures, and keeps each one's credit.
//
//   node photo.mjs "<what the photo shows>" [--out photo.jpg] [--width 1600] [--next 2]
//
// Saves the photo where it runs, under --out, and prints the credit line to put in the piece. --next 2 takes the second
// match when the first doesn't fit the subject. A found photo shows the subject's world, never the person's own product,
// place, people or team. Needs Node 22 or later and a network; nothing to install.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// Node's fetch ignores HTTP(S)_PROXY unless NODE_USE_ENV_PROXY is set at start, so behind a proxy it runs itself again with it
const env = process.env;
if ((env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy) && !env.NODE_USE_ENV_PROXY)
  process.exit(spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: { ...env, NODE_USE_ENV_PROXY: "1" } }).status ?? 1);

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const query = argv.find((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
if (!query) { console.error('usage: node photo.mjs "<what the photo shows>" [--out photo.jpg] [--width 1600] [--next 2]'); process.exit(2); }
const width = Number(opt("width", 1600)), next = Math.max(1, Number(opt("next", 1)));

const get = async (url) => {
  const r = await fetch(url, { headers: { "User-Agent": "settle-photo/1 (https://github.com/hirowyh/settle)" }, signal: AbortSignal.timeout(30000) });
  if (r.status === 429) throw new Error("Openverse is limiting requests from this address: wait a minute and try again");
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
  return r;
};
// a web-sized rendition of a Wikimedia original, which can be a scan of 10 MB or more
const sized = (u) => { const m = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png))$/i.exec(u); return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/${width}px-${m[3]}` : u; };
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const licence = (r) => (r.license === "cc0" ? "CC0" : r.license === "pdm" ? "public domain" : `CC ${String(r.license).toUpperCase()} ${r.license_version || ""}`.trim());

try {
  const q = new URLSearchParams({ q: query, license: "cc0,pdm,by", page_size: "20", size: "large" });
  const results = (await (await get(`https://api.openverse.org/v1/images/?${q}`)).json()).results || [];
  const fits = results.filter((r) => r.url && (!r.width || r.width >= 1200) && /^(jpe?g|png|webp)?$/i.test(r.filetype || "")).slice(next - 1);
  for (const r of fits) {
    let res;
    try { res = await get(sized(r.url)); } catch { continue; } // a file gone from its host: take the next match
    const type = res.headers.get("content-type") || "", bytes = Buffer.from(await res.arrayBuffer());
    if (!type.startsWith("image/") || bytes.length > 8e6) continue;
    const ext = { "image/png": ".png", "image/webp": ".webp" }[type.split(";")[0]] || ".jpg";
    const out = opt("out", "photo" + ext).replace(/(\/|^)([^./]+)$/, `$1$2${ext}`);
    writeFileSync(out, bytes);
    const by = r.creator && !/^(unknown|anonymous)\b/i.test(r.creator) ? ` by ${esc(r.creator)}` : "", via = esc(String(r.source || r.provider || "Openverse").replace(/_/g, " "));
    console.log(`Saved ${out} (${Math.round(bytes.length / 1024)} KB): "${r.title || "Untitled"}"${by.replace(/&amp;/g, "&")}, ${licence(r)}`);
    console.log(`Credit, in the piece: <p class="credit">Photo: <a href="${esc(r.foreign_landing_url)}">${esc(r.title || "Untitled")}</a>${by}, ${r.license_url ? `<a href="${esc(r.license_url)}">${licence(r)}</a>` : licence(r)}, via ${via}</p>`);
    console.log("Write its alt text from what the photo shows. It shows the subject's world, never the person's own product, place or people.");
    process.exit(0);
  }
  console.log(`No openly licensed photo found for "${query}"${next > 1 ? ` past match ${next - 1}` : ""}: try other words, or draw the picture in code.`);
  process.exit(1);
} catch (e) {
  console.log(`No photo: ${e.cause?.code || e.message}. Draw the picture in code, and say in the hand-over where the person's photo goes.`);
  process.exit(1);
}
