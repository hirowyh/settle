#!/usr/bin/env node
// The variety meter: how alike are the looks of a folder of eval outputs?
//
//   node evals/variety.mjs <folder>        e.g. _local/evals/baseline
//
// Finds each run's page at <folder>/<id>/files/**/*.html (node_modules skipped; the first path in
// sorted order when a run left several), loads it in ego lite and reads the ground (background as
// painted), the ink (body text colour), the accent (--accent, else the most used saturated colour
// that is neither ground nor ink, else the ink), the first font family that loaded, the corner
// radius (--radius, else the largest card's), and the library palette whose colours the page's
// :root variables spell out (at least 4 of ground, surface, ink, muted, accent).
//
// Two outputs share a look family when they use the same palette id, or when their ground, ink and
// accent are each within DIST in OKLab and their first font family is the same (single linkage).
// DIST = 0.04: one just-noticeable difference is about 0.02 in OKLab, so 0.04 is two, near enough
// to merge tints of one palette while keeping apart palettes that differ in any one of the three.
// Plan targets: no family over 3 members, at most 2 outputs resembling a seed look (the three looks the library started from:
// palettes warm-grey-black, paper-red, night-violet; Geist for the first and last, colour alone for paper-red), and the
// runs of one request (ids that differ only by a repeat suffix such as comp-1-r2) all different.
// Writes <folder>/variety.json. Needs Node 22 or later and ego lite; nothing to install.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIST = 0.04, MAX_FAMILY = 3, MAX_SEED = 2, MAX_SHARE = { direction: 0.5, shape: 0.6, material: 0.6 };
const folder = resolve(process.argv[2] || "");
if (!process.argv[2] || !existsSync(folder)) {
  console.error("usage: node evals/variety.mjs <folder with <id>/files/ runs>");
  process.exit(2);
}
const palettes = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../skills/settle/library/palettes.json"), "utf8"));
if (spawnSync("ego-browser", ["--version"]).status !== 0) {
  console.error("ego lite is not installed; this meter runs only there");
  process.exit(1);
}

const htmlIn = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.name === "node_modules" ? [] : e.isDirectory() ? htmlIn(join(dir, e.name)) : /\.html?$/i.test(e.name) ? [join(dir, e.name)] : []).sort();
const runs = readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(folder, e.name, "files")))
  .map((e) => ({ id: e.name, file: htmlIn(join(folder, e.name, "files"))[0] })).sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
const missing = runs.filter((r) => !r.file).map((r) => r.id);
const pages = runs.filter((r) => r.file).map((r) => ({ id: r.id, url: pathToFileURL(r.file).href }));

// Runs inside ego lite: loads each page and returns what it paints. Reads only its argument.
async function measure(cfg, b) {
  const read = () => {
    const probe = document.createElement("i");
    document.body.append(probe);
    // Any CSS colour (var(), color-mix, oklch) to [r, g, b, a] through the canvas.
    const g = new OffscreenCanvas(1, 1).getContext("2d", { willReadFrequently: true });
    const rgba = (css) => {
      probe.style.color = ""; probe.style.color = css;
      const c = getComputedStyle(probe).color;
      g.clearRect(0, 0, 1, 1); g.fillStyle = "#000"; g.fillStyle = c; g.fillRect(0, 0, 1, 1);
      return [...g.getImageData(0, 0, 1, 1).data];
    };
    const hex = ([r, g2, b]) => "#" + [r, g2, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    const chroma = ([r, g2, b]) => (Math.max(r, g2, b) - Math.min(r, g2, b)) / 255; // cheap saturation proxy
    const near = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) < 40;

    const root = getComputedStyle(document.documentElement);
    let ground = [255, 255, 255, 255];
    for (const e of [document.body, document.documentElement]) {
      const cs = getComputedStyle(e);
      // shortcut: a gradient ground reads as its first stop, not the average
      const stop = cs.backgroundImage.match(/(rgba?|color)\([^)]*\)/);
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) { ground = c; break; }
      if (stop) { ground = rgba(stop[0]); break; }
    }
    const ink = rgba(getComputedStyle(document.body).color);

    let accent = null;
    const accentVar = root.getPropertyValue("--accent").trim();
    if (accentVar) accent = rgba(accentVar);
    if (!accent) {
      const tally = new Map();
      for (const e of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(e);
        if (!e.getBoundingClientRect().width) continue;
        for (const v of [cs.color, cs.backgroundColor, cs.borderTopColor, cs.fill, cs.stroke]) {
          if (!v || v === "none") continue;
          const c = rgba(v);
          if (c[3] < 128 || chroma(c) < 0.25 || near(c, ground) || near(c, ink)) continue;
          const k = hex(c);
          tally.set(k, (tally.get(k) || 0) + 1);
        }
      }
      const top = [...tally].sort((a, b2) => b2[1] - a[1])[0];
      accent = top ? rgba(top[0]) : ink;
    }

    // The first family in the body's stack that is generic, a loaded @font-face, or installed.
    const stack = getComputedStyle(document.body).fontFamily.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""));
    const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|BlinkMacSystemFont|emoji|math)$/i;
    const width = (fam) => { const s = document.createElement("span"); s.style.cssText = `position:absolute;visibility:hidden;font:48px ${fam}`; s.textContent = "mmmmmmmmmmlli1 Quick"; document.body.append(s); const w = s.getBoundingClientRect().width; s.remove(); return w; };
    const faces = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replace(/^["']|["']$/g, "").toLowerCase());
    const font = stack.find((f) => generic.test(f) || faces.includes(f.toLowerCase()) ||
      (width(`"${f}",monospace`) !== width("monospace") || width(`"${f}",serif`) !== width("serif"))) || stack[0];

    let radius = root.getPropertyValue("--radius").trim() || null;
    if (!radius) {
      let best = 0;
      for (const e of document.querySelectorAll("body *")) {
        const r = e.getBoundingClientRect(), cs = getComputedStyle(e), rad = parseFloat(cs.borderTopLeftRadius);
        if (!(rad > 0) || r.width * r.height > innerWidth * innerHeight * 0.9) continue;
        if (r.width * r.height > best) { best = r.width * r.height; radius = cs.borderTopLeftRadius; }
      }
    }

    // :root custom properties declared in the page's sheets, as hex colours, for the palette match.
    const vars = new Set();
    const walk = (rules) => { for (const r of rules) {
      if (r.cssRules) walk(r.cssRules);
      if (!r.style || !/:root|^html$|^body$/.test(r.selectorText || "")) continue;
      for (const n of r.style) if (n.startsWith("--")) { const v = r.style.getPropertyValue(n).trim(); if (v) { const c = rgba(v); if (c[3]) vars.add(hex(c)); } }
    } };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch {} }
    probe.remove();
    return { ground: hex(ground), ink: hex(ink), accent: hex(accent), font, radius, vars: [...vars] };
  };

  const out = [];
  await b.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await b.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }, { name: "prefers-color-scheme", value: "light" }] });
  for (const p of cfg.pages) {
    try {
      await b.navigate(p.url);
      await b.evaluate("document.fonts.ready.then(() => true)");
      await new Promise((r) => setTimeout(r, 600));
      out.push({ id: p.id, ...(await b.evaluate(`(${read})()`)) });
    } catch (e) { out.push({ id: p.id, error: String(e.message || e).split("\n")[0] }); }
  }
  console.log("RESULT " + JSON.stringify(out));
}

const script = `const task = await taskSpace("settle variety");
const pg = await task.newPage();
const b = {
  cdp: (method, params = {}) => pg.cdp(method, params),
  navigate: async (u) => { await pg.goto(u); await pg.waitForLoadState(); },
  evaluate: async (expression) => (await pg.cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value,
};
try { await (${measure})(${JSON.stringify({ pages })}, b); } finally { await task.finish({ keep: [] }); }`;
const r = spawnSync("ego-browser", ["nodejs"], { input: script, encoding: "utf8", maxBuffer: 1 << 28 });
const said = (r.stdout || "") + (r.stderr || ""); // ego lite prints the script's console on stderr
const line = said.split("\n").find((l) => l.includes("RESULT "));
if (r.status !== 0 || !line) { process.stderr.write(said); process.exit(1); }
const outputs = JSON.parse(line.slice(line.indexOf("RESULT ") + 7));

// OKLab, from sRGB hex.
const lab = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const dist = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const typeOf = (f) => (f || "").toLowerCase().replace(/["']/g, "");
const sameLook = (a, b) => (a.palette && a.palette === b.palette) ||
  (["ground", "ink", "accent"].every((k) => dist(a[k], b[k]) <= DIST) && typeOf(a.font) === typeOf(b.font));

const palette = (o) => palettes.find((p) => [p.ground, p.surface, p.ink, p.muted, p.accent].filter((c) => o.vars.includes(c.toUpperCase())).length >= 4 &&
  o.vars.includes(p.ground.toUpperCase()) && o.vars.includes(p.accent.toUpperCase()))?.id ?? null;
const SEEDS = { "warm-grey-black": "Geist", "paper-red": null, "night-violet": "Geist" };
const ok = outputs.filter((o) => !o.error);
for (const o of ok) o.palette = palette(o);
for (const o of ok) {
  o.seeds = Object.entries(SEEDS).filter(([id, font]) => {
    const p = palettes.find((q) => q.id === id);
    return ["ground", "ink", "accent"].every((k) => dist(o[k], p[k]) <= DIST) && (!font || typeOf(o.font).startsWith(font.toLowerCase()));
  }).map(([id]) => id);
}

// Single-linkage families.
const parent = ok.map((_, i) => i);
const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
ok.forEach((a, i) => ok.forEach((b, j) => { if (j > i && sameLook(a, b)) parent[find(j)] = find(i); }));
const families = Object.values(Object.groupBy(ok.map((o, i) => [find(i), o]), ([k]) => k)).map((g) => g.map(([, o]) => o))
  .sort((a, b) => b.length - a.length);
const famOf = new Map(families.flatMap((f, i) => f.map((o) => [o.id, i + 1])));

// Repeats of one request: ids that differ only by a repeat suffix (comp-1-r2, comp-1_2, comp-1.2).
const requestOf = (id) => id.match(/^(.*-\d+)(?:[-_.]r?\d+)$/)?.[1] ?? id;
const requests = Object.entries(Object.groupBy(ok, (o) => requestOf(o.id))).filter(([, g]) => g.length > 1);
const repeatClashes = requests.flatMap(([req, g]) => g.flatMap((a, i) => g.slice(i + 1).filter((b) => famOf.get(a.id) === famOf.get(b.id)).map((b) => `${req}: ${a.id} and ${b.id}`)));

const pad = (s, n) => String(s ?? "").padEnd(n);
console.log(`${ok.length} outputs read from ${folder}${missing.length ? `; no page in: ${missing.join(", ")}` : ""}${outputs.length > ok.length ? `; failed: ${outputs.filter((o) => o.error).map((o) => `${o.id} (${o.error})`).join(", ")}` : ""}\n`);
console.log(`${pad("family", 7)}${pad("n", 4)}${pad("id", 10)}${pad("ground", 9)}${pad("ink", 9)}${pad("accent", 9)}${pad("font", 24)}${pad("radius", 8)}${pad("palette", 24)}seed`);
families.forEach((f, i) => f.forEach((o, k) => console.log(`${pad(k ? "" : "F" + (i + 1), 7)}${pad(k ? "" : f.length + (f.length > MAX_FAMILY ? "!" : ""), 4)}${pad(o.id, 10)}${pad(o.ground, 9)}${pad(o.ink, 9)}${pad(o.accent, 9)}${pad(o.font.slice(0, 22), 24)}${pad(o.radius, 8)}${pad(o.palette, 24)}${o.seeds.join(",")}`)));
const big = families.filter((f) => f.length > MAX_FAMILY), seed = ok.filter((o) => o.seeds.length);
console.log(`\nfamilies: ${families.length} over ${ok.length} outputs; largest ${families[0]?.length ?? 0} (target <= ${MAX_FAMILY})`);
console.log(big.length ? `FAIL families over ${MAX_FAMILY}: ${big.map((f) => `F${families.indexOf(f) + 1} (${f.length}: ${f.map((o) => o.id).join(" ")})`).join("; ")}` : `ok   no family over ${MAX_FAMILY}`);
console.log(seed.length > MAX_SEED ? `FAIL ${seed.length} outputs resemble a seed look (target <= ${MAX_SEED}): ${seed.map((o) => `${o.id}~${o.seeds}`).join(" ")}` : `ok   ${seed.length} output(s) resemble a seed look${seed.length ? ": " + seed.map((o) => `${o.id}~${o.seeds}`).join(" ") : ""} (target <= ${MAX_SEED})`);
console.log(requests.length ? (repeatClashes.length ? `FAIL repeats landing on the same look: ${repeatClashes.join("; ")}` : `ok   repeats of ${requests.length} request(s) all differ`) : "ok   no repeated requests in this folder");

// The dealt parts, read from each run's saved look: one entry over its part's cap is the convergence the pilot found
// (9 of 14 on square corners and on one shadow), which colours alone never show. The dealer deals three directions, most
// tones two shapes, and soft shadow on about half its looks, so each cap sits above what the dealer gives by itself.
const looks = ok.map((o) => { try { return JSON.parse(readFileSync(join(folder, o.id, "files", ".settle", "look.json"), "utf8")); } catch { return null; } }).filter(Boolean);
const shares = ["direction", "shape", "material"].map((part) => {
  const dealt = looks.filter((l) => l[part]); // a project's page deals no direction
  const count = Object.entries(Object.groupBy(dealt, (l) => l[part].id)).map(([id, g]) => [id, g.length]).sort((a, b) => b[1] - a[1]);
  return { part, id: count[0]?.[0] ?? "none", n: count[0]?.[1] ?? 0, of: dealt.length, kinds: count.length };
});
const crowded = shares.filter((x) => x.of >= 5 && x.n / x.of > MAX_SHARE[x.part]);
const caps = shares.map((x) => `${x.part} ${MAX_SHARE[x.part] * 100} %`).join(", ");
console.log(`parts over ${looks.length} saved looks: ${shares.map((x) => `${x.part}s ${x.kinds}, most ${x.id} on ${x.n}`).join("; ")}`);
console.log(crowded.length ? `FAIL one part over its cap (${caps}): ${crowded.map((x) => `${x.part} ${x.id} on ${x.n} of ${x.of}`).join("; ")}` : `ok   no part over its cap (${caps})`);

writeFileSync(join(folder, "variety.json"), JSON.stringify({
  threshold: DIST, outputs: ok.map((o) => ({ ...o, family: famOf.get(o.id) })), errors: outputs.filter((o) => o.error), missing,
  families: families.map((f, i) => ({ family: i + 1, size: f.length, ids: f.map((o) => o.id) })),
  overLimit: big.map((f) => f.map((o) => o.id)), seedLike: seed.map((o) => ({ id: o.id, seeds: o.seeds })), repeatClashes, shares, crowded,
}, null, 2) + "\n");
if (big.length || seed.length > MAX_SEED || repeatClashes.length || crowded.length) process.exitCode = 1;
