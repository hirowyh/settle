#!/usr/bin/env node
// settle / deal: deal a look for a request, or inherit the project's.
//
// Adapted from taste-skill's scripts/draw.mjs (MIT, © 2026 Leonxlnx): the script deals instead of the model,
// because a model asked to pick a look returns the category default every time. The deal is random within what
// fits the request, and it remembers recent deals so consecutive pieces don't look alike.
//
//   node deal.mjs --brief "one line" [--kind control|data-view|composite|flow] [--direction id] [--tone quiet|warm|bold|playful|technical|luxury|editorial]
//                 [--dark] [--register crisp|soft|smooth] [--have photos] [--keep palette,type] [--avoid id,id] [--seed N]
//                 [--project] [--out DIR] [--fresh]
//                                     deal three looks, save them to DIR/options.json (DIR is ./.settle) and print them;
//                                     inside a project (--project), a look picked there before is inherited unless --fresh
//   node deal.mjs --pick 1            save the dealt look as DIR/look.json and print the sheet
//   node deal.mjs --pick 2|3 --because "the clash"   take another option, only for a clash with the subject
//   node deal.mjs --show              print the saved look's sheet again
//   node deal.mjs --redeal direction|palette|type|shape|material|imagery|register   deal one part of the saved look again
//   node deal.mjs --list directions|palettes|type|shapes|materials|imagery|registers|tones
//   node deal.mjs --check             check every palette's contrast and every library entry; exit 1 on a fault
//
// --dark is for subjects that happen in the dark, or a request that asks for dark. --register fixes the tempo when the
// request names one ("smooth", "snappy").
// --keep names the parts a project already fixes: they stay the project's.
// Zero dependencies. Node 18+. Build tools import { library, sheet, dealOptions, check } from this file.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(HERE, "..", "library", name + ".json"), "utf8"));
export const library = { directions: load("directions"), palettes: load("palettes"), type: load("type"), shapes: load("shapes"), materials: load("materials"), imagery: load("imagery"), registers: load("registers") };
export const TONES = ["quiet", "warm", "bold", "playful", "technical", "luxury", "editorial"];
const KINDS = ["control", "data-view", "composite", "flow"];
const FAMILIES = ["white", "light", "warm", "colour", "dark"];
// The system face, for a project that keeps its own type and for boards that judge colour alone.
export const SYSTEM = { id: "system", family: "the system face", font: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', link: null };

// ---------- contrast (WCAG 2) ----------
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// ---------- the sheet ----------
// The variables every recipe reads (references/motion.md), from one look. A part the project keeps is left out.
export function sheet(look) {
  const { palette: p, type: t, shape: s, material: m } = look, vars = {};
  if (p) Object.assign(vars, { "--ground": p.ground, "--surface": p.surface, "--inset": p.inset, "--ink": p.ink, "--on-ink": p.onInk, "--muted": p.muted, "--accent": p.accent, "--on-accent": p.onAccent });
  Object.assign(vars, { "--shadow": m.shadow, "--shadow-lift": p?.family === "dark" && m.darkLift ? m.darkLift : m.lift, "--radius": s.radius, "--round": s.round });
  if (t) Object.assign(vars, { "--font": t.font, "--mono": t.mono });
  const css = `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}` + (m.css ? "\n" + m.css : "");
  const link = t?.link ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="${t.link}" rel="stylesheet">` : null;
  return { vars, css, link, register: look.register.id };
}

// ---------- dealing (seedable) ----------
let seed = 1;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// prefer what is not in `used`, without ever emptying the pool
const fresh = (pool, used) => { const f = pool.filter((x) => !used.includes(x.id)); return f.length ? f : pool; };
// the entries that suit the tone, when at least `min` do
const fits = (pool, tone, min = 1) => { if (!tone) return pool; const t = pool.filter((x) => x.tones.includes(tone)); return t.length >= min ? t : pool; };
// a direction's allowed entries, or the whole pool when it names none (or none of them is in the pool)
const narrow = (pool, ids) => { const w = ids ? pool.filter((x) => ids.includes(x.id)) : pool; return w.length ? w : pool; };

/** Three looks for one request: a direction each, different ground families, faces, shapes and registers where the pools allow. */
export function dealOptions(input, { seed: s, history = [] } = {}) {
  const i = { tone: null, dark: false, register: null, kind: null, direction: null, have: [], keep: [], avoid: [], ...input };
  seed = s ?? randomInt(1, 2 ** 31 - 1);
  const startSeed = seed, L = library;
  const recent = (key, n) => history.slice(0, n).map((h) => h[key]).filter(Boolean);
  // the entries used least in the last six deals, so no direction, shape, material or register settles in; a tie skips the last deal's, so no part repeats back to back
  const leastUsed = (pool, key) => { const n = (id) => recent(key, 6).filter((x) => x === id).length, low = Math.min(...pool.map((x) => n(x.id))), least = pool.filter((x) => n(x.id) === low), next = least.filter((x) => x.id !== recent(key, 1)[0]); return next.length ? next : least; };
  let wide = L.palettes.filter((p) => !i.avoid.includes(p.id) && (i.dark ? p.family === "dark" : p.family !== "dark"));
  if (!wide.length) wide = L.palettes.filter((p) => !i.avoid.includes(p.id));
  const pals = fits(wide, i.tone, 3);
  // a ground family first, so a family with many entries (warm light grounds) doesn't crowd out the others
  const fams = shuffle([...new Set(pals.map((p) => p.family))]);
  const types = fits(L.type.filter((t) => !i.avoid.includes(t.id)), i.tone, 3);
  // in a project the piece lives on the project's own page, so only a page of its own deals a direction
  const named = L.directions.filter((d) => d.id === i.direction); // a request that names one ("like an iPhone app") keeps it
  // a direction marked named (System, Editorial, Split, Stationery) frames the piece for one context, so only a request that names it gets it
  const dirs = i.project ? [] : named.length ? named : fits(L.directions.filter((d) => !d.named && !i.avoid.includes(d.id) && (!i.kind || d.kinds.includes(i.kind))), i.tone, 2);
  const options = [];
  for (let k = 0; k < 3; k++) {
    const taken = (key) => options.map((o) => o[key]?.id);
    // a direction with a weight under 1 joins the pool only that share of the time, and never two deals running; one with no weight draws no number, so its seeds deal as before
    const dealable = dirs.filter((d) => d.weight === undefined || (d.id !== recent("direction", 1)[0] && rnd() < d.weight));
    const direction = dirs.length ? pick(leastUsed(fresh(dealable.length ? dealable : dirs, taken("direction")), "direction")) : null;
    let palette = null;
    if (!i.keep.includes("palette")) {
      const used = recent("palette", 6), left = pals.filter((p) => !taken("palette").includes(p.id)), fam = left.filter((p) => p.family === fams[k % fams.length]);
      // a fresh palette from the family first, then from the tone, then from any; a recent one only when nothing fresh is left
      palette = pick([fam, left, wide.filter((p) => !taken("palette").includes(p.id))].map((l) => l.filter((p) => !used.includes(p.id))).find((l) => l.length) || (fam.length ? fam : left.length ? left : pals));
    }
    let type = null;
    if (direction?.type === "system") type = SYSTEM;
    else if (!i.keep.includes("type")) { const left = types.filter((t) => !taken("type").includes(t.id)); type = pick(fresh(left.length ? left : types, recent("type", 6))); }
    // a shape marked asked (square) comes only when the tone lists it or the direction names it
    const shapes = direction?.shapes ? narrow(L.shapes, direction.shapes) : L.shapes.filter((x) => !x.asked || x.tones.includes(i.tone));
    const shape = pick(leastUsed(fresh(fits(shapes, i.tone), taken("shape")), "shape"));
    // with the project's own palette, only materials some palette allows: glass comes with the Glass direction alone
    const allowed = L.materials.filter((m) => (palette ? [palette] : L.palettes).some((p) => p.materials.includes(m.id)));
    // a direction that brings its own depth (glass) wins over the palette's list
    const mats = !direction?.materials ? allowed : allowed.some((m) => direction.materials.includes(m.id)) ? narrow(allowed, direction.materials) : narrow(L.materials, direction.materials);
    const material = pick(leastUsed(fresh(fits(mats, i.tone), taken("material")), "material"));
    const pictures = i.have.includes("photos") ? L.imagery.filter((x) => x.id === "photos") : narrow(L.imagery.filter((x) => !x.needs), direction?.imagery);
    const imagery = pick(leastUsed(fresh(fits(pictures, i.tone), taken("imagery")), "imagery"));
    const register = L.registers.find((r) => r.id === i.register) || pick(leastUsed(fresh(fits(L.registers, i.tone), taken("register")), "register"));
    options.push({ direction, palette, type, shape, material, imagery, register });
  }
  return { seed: startSeed, options };
}

// ---------- the library check ----------
/** Every fault in the library: contrast on every surface, 3:1 between state shades, and well-formed entries. */
export function check() {
  const bad = [], L = library;
  const need = (id, a, b, min, what) => { const c = contrast(a, b); if (c < min) bad.push(`palette ${id}: ${what} is ${c.toFixed(2)}:1, needs ${min}:1`); };
  for (const [kind, list] of Object.entries(L)) {
    const seen = new Set();
    for (const x of list) { if (seen.has(x.id)) bad.push(`${kind} ${x.id}: duplicate id`); seen.add(x.id); if (kind !== "palettes" && kind !== "type" && !x.say) bad.push(`${kind} ${x.id}: no "say"`); for (const t of x.tones || []) if (!TONES.includes(t)) bad.push(`${kind} ${x.id}: unknown tone ${t}`); }
  }
  for (const m of L.materials) for (const k of ["shadow", "lift", "darkLift"]) if (/[{}]/.test(m[k] || "")) bad.push(`material ${m.id}: ${k} holds a placeholder the sheet never fills`);
  for (const d of L.directions) {
    if (!d.kinds?.length || d.kinds.some((k) => !KINDS.includes(k))) bad.push(`direction ${d.id}: kinds must be some of ${KINDS.join(", ")}`);
    for (const [part, ids] of [["shapes", d.shapes], ["materials", d.materials], ["imagery", d.imagery]]) for (const id of ids || []) if (!L[part].some((x) => x.id === id)) bad.push(`direction ${d.id}: unknown ${part} entry ${id}`);
    if (d.type && d.type !== "system") bad.push(`direction ${d.id}: type is "system" or absent`);
    if (d.weight !== undefined && !(d.weight > 0 && d.weight <= 1)) bad.push(`direction ${d.id}: weight is above 0 and at most 1`);
  }
  for (const k of KINDS) if (L.directions.filter((d) => !d.named && d.kinds.includes(k)).length < 2) bad.push(`kind ${k}: fewer than two dealt directions`);
  for (const p of L.palettes) {
    for (const k of ["ground", "surface", "inset", "ink", "onInk", "muted", "accent", "onAccent"]) if (!/^#[0-9A-F]{6}$/.test(p[k] || "")) bad.push(`palette ${p.id}: ${k} is not a #RRGGBB colour`);
    if (bad.some((b) => b.startsWith(`palette ${p.id}:`))) continue;
    if (!FAMILIES.includes(p.family)) bad.push(`palette ${p.id}: unknown family ${p.family}`);
    for (const m of p.materials) if (!L.materials.some((x) => x.id === m)) bad.push(`palette ${p.id}: unknown material ${m}`);
    for (const s of ["ground", "surface", "inset"]) {
      need(p.id, p.ink, p[s], 7, `ink on ${s}`);
      need(p.id, p.muted, p[s], 4.5, `muted on ${s}`);
      need(p.id, p.accent, p[s], 3, `accent against ${s}`); // a mark for a state against what it sits on
    }
    need(p.id, p.onInk, p.ink, 7, "on-ink on ink");
    need(p.id, p.onAccent, p.accent, 4.5, "on-accent on accent");
    need(p.id, p.inset, p.surface, 1.08, "inset against surface"); // a well or a track has to show
    need(p.id, p.inset, p.ground, 1.08, "inset against ground");
    if (p.materials.includes("steps")) need(p.id, p.surface, p.ground, 1.06, "surface against ground, under tone steps");
  }
  for (const t of L.type) {
    if (!t.link?.startsWith("https://fonts.googleapis.com/css2?family=")) bad.push(`type ${t.id}: the link is not one Google Fonts link`);
    if (!t.font?.startsWith(`"${t.family}", `)) bad.push(`type ${t.id}: font stack lacks its family or a fallback`);
    if (!/monospace$/.test(t.mono || "")) bad.push(`type ${t.id}: mono stack ends without monospace`);
  }
  return bad;
}

// ---------- the command line ----------
function main(argv) {
  const opt = (name, def) => { const i = argv.indexOf("--" + name); if (i === -1) return def; const v = argv[i + 1]; return v === undefined || v.startsWith("--") ? true : v; };
  const list = (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
  const fail = (msg) => { console.error(msg); process.exit(2); };
  const dir = resolve(String(opt("out", ".settle"))), lookPath = join(dir, "look.json"), optionsPath = join(dir, "options.json");
  const histPath = process.env.SETTLE_HISTORY || join(homedir(), ".settle", "history.json");
  const readHist = () => { try { return JSON.parse(readFileSync(histPath, "utf8")); } catch { return []; } };
  // one entry per piece, keyed by its deal's seed: the deal records look 1 at once, so a piece dealt alongside sees it, and a pick or a redeal replaces it
  // shortcut: two deals in the same few milliseconds still read the same history; add a lock file if pieces are ever dealt that close
  const writeHist = (o, seed) => { try { mkdirSync(dirname(histPath), { recursive: true }); const h = readHist(), e = { at: new Date().toISOString(), seed, direction: o.direction?.id, palette: o.palette?.id, type: o.type?.id, shape: o.shape.id, material: o.material.id, imagery: o.imagery?.id, register: o.register.id }, k = h.findIndex((x) => x.seed === seed); if (k === -1) h.unshift(e); else h[k] = e; const tmp = `${histPath}.${process.pid}`; writeFileSync(tmp, JSON.stringify(h.slice(0, 24), null, 1)); renameSync(tmp, histPath); } catch {} };
  const save = (path, data) => { mkdirSync(dir, { recursive: true }); writeFileSync(path, JSON.stringify(data, null, 1)); };
  const read = (path, what) => { if (!existsSync(path)) fail(`No ${what} at ${path}. Deal first: node deal.mjs --brief "..."`); return JSON.parse(readFileSync(path, "utf8")); };

  // --help prints this file's header; without it the flag fell through to a deal, which overwrote options.json and the history
  if (argv.includes("--help") || argv.includes("-h")) { const src = readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n"); return console.log(src.slice(1, src.findIndex((l) => l.startsWith("import"))).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); }
  if (opt("list")) {
    const what = String(opt("list"));
    if (what === "tones") console.log(TONES.join("\n"));
    else if (library[what]) for (const x of library[what]) console.log(`${x.id.padEnd(28)} ${x.name || x.family}${x.family && x.name ? ` (${x.family})` : ""} · ${(x.tones || []).join(", ")}`);
    else fail("List one of: directions, palettes, type, shapes, materials, imagery, registers, tones.");
    return;
  }
  if (opt("check")) {
    const bad = check();
    console.log(bad.length ? bad.join("\n") : `ok: ${library.directions.length} directions, ${library.palettes.length} palettes, ${library.type.length} type systems, ${library.shapes.length} shapes, ${library.materials.length} materials, ${library.imagery.length} imagery modes, ${library.registers.length} registers`);
    process.exit(bad.length ? 1 : 0);
  }
  if (opt("show")) return console.log(render(read(lookPath, "saved look")));
  if (opt("pick")) {
    const saved = read(optionsPath, "dealt options"), n = opt("pick") === true ? 1 : Number(opt("pick"));
    const o = saved.options[n - 1];
    if (!o) fail(`Pick 1, 2 or 3 of the looks in ${optionsPath}.`);
    // the seed deals look 1; a model left to choose picks the most striking option, and every piece converges on it
    const because = typeof opt("because") === "string" ? opt("because") : null;
    if (n !== 1 && !because) fail(`Look 1 is the dealt look: build it with --pick 1. Take look ${n} only when look 1 clashes with the subject, and name the clash: --pick ${n} --because "a dark ground for a breakfast menu".`);
    const look = { version: 1, at: new Date().toISOString(), seed: saved.seed, input: saved.input, pick: n, ...(because ? { because } : {}), ...o };
    save(lookPath, { ...look, sheet: sheet(look) });
    writeHist(o, saved.seed);
    return console.log(render({ ...look, sheet: sheet(look) }));
  }
  if (opt("redeal")) {
    const look = read(lookPath, "saved look"), part = String(opt("redeal"));
    if (!["direction", "palette", "type", "shape", "material", "imagery", "register"].includes(part)) fail("Redeal one of: direction, palette, type, shape, material, imagery, register.");
    const avoid = [...(look.input.avoid || []), look[part]?.id].filter(Boolean);
    const next = dealOptions({ ...look.input, avoid, keep: (look.input.keep || []).filter((k) => k !== part), register: part === "register" ? null : look.input.register }, { history: readHist() }).options[0];
    look[part] = next[part];
    if (part === "palette" && look.palette && !look.palette.materials.includes(look.material.id)) look.material = next.material;
    // a new direction brings the parts it constrains; the colours and the tempo stay
    if (part === "direction") Object.assign(look, { shape: next.shape, material: next.material, imagery: next.imagery, ...(next.type?.id === "system" || look.type?.id === "system" ? { type: next.type } : {}) });
    look.at = new Date().toISOString();
    save(lookPath, { ...look, sheet: sheet(look) });
    writeHist(look, look.seed);
    return console.log(render({ ...look, sheet: sheet(look) }));
  }

  // a project's pieces share one look; outside a project every request gets a fresh one
  if (opt("project") === true && existsSync(lookPath) && read(lookPath, "saved look").input?.project && !opt("fresh")) {
    console.log(`This project already has a look, saved at ${lookPath}. Every piece in a project shares it, so it is inherited.\nTo deal a new one for this project, add --fresh.\n`);
    return console.log(render(read(lookPath, "saved look")));
  }
  const tone = opt("tone");
  if (tone !== undefined && !TONES.includes(tone)) fail(`--tone is one of: ${TONES.join(", ")}.`);
  const register = opt("register");
  if (register !== undefined && !library.registers.some((r) => r.id === register)) fail(`--register is one of: ${library.registers.map((r) => r.id).join(", ")}.`);
  const kind = opt("kind");
  if (kind !== undefined && !KINDS.includes(kind)) fail(`--kind is one of: ${KINDS.join(", ")}.`);
  const direction = opt("direction");
  if (direction !== undefined && !library.directions.some((x) => x.id === direction)) fail(`--direction is one of: ${library.directions.map((x) => x.id).join(", ")}.`);
  const input = { brief: typeof opt("brief") === "string" ? opt("brief") : "", kind: kind || null, direction: direction || null, tone: tone || null, dark: opt("dark") === true, register: register || null, have: list(opt("have")), keep: list(opt("keep")), avoid: list(opt("avoid")), project: opt("project") === true };
  const s = opt("seed");
  const dealt = dealOptions(input, { seed: s !== undefined && s !== true ? Number(s) : undefined, history: readHist() });
  save(optionsPath, { version: 1, at: new Date().toISOString(), seed: dealt.seed, input, options: dealt.options });
  writeHist(dealt.options[0], dealt.seed);
  console.log(`# Three looks${input.brief ? ` for "${input.brief}"` : ""}\nseed ${dealt.seed}${input.kind ? `, ${input.kind}` : ""}${input.tone ? `, tone ${input.tone}` : ""}${input.dark ? ", dark" : ""}\n`);
  dealt.options.forEach((o, k) => console.log(describe(o, k) + "\n"));
  console.log("Look 1 is the dealt look. Build it: node deal.mjs --pick 1");
  console.log('Take look 2 or 3 only when look 1 clashes with the subject, and name the clash: --pick 2 --because "...". The other two are the re-deal offers for the hand-over.');
  console.log("A subject with colours of its own keeps the dealt proportions and takes its own colours.");
}
const fallback = (t) => t.font.split(", ").slice(1, 3).join(", ");
function describe(o, k) {
  const p = o.palette, t = o.type, d = o.direction;
  return [
    `## ${k + 1}. ${d ? `${d.name}: ` : ""}${p ? p.name : "The project's colours"}${t ? `, ${t.id === "system" ? "the system face" : t.family}` : ""}`,
    `Direction ${d ? `${d.name}, ${d.say}. Build from its section in references/directions.md.` : "the project's own page and layout"}`,
    `Colours   ${p ? `ground ${p.ground}, surface ${p.surface}, inset ${p.inset}, ink ${p.ink}, muted ${p.muted}, accent ${p.accent}` : "kept from the project: map its colours onto the sheet, ink 7:1 and muted 4.5:1 on every surface"}`,
    `Type      ${!t ? "kept from the project" : t.id === "system" ? "the system face: San Francisco on Apple devices, Segoe UI on Windows; no font to load" : `${t.family}, from Google Fonts, falling back to ${fallback(t)}`}`,
    `Shape     ${o.shape.say}`,
    `Material  ${o.material.say}`,
    `Imagery   ${o.imagery.say}`,
    `Motion    the ${o.register.id} register: ${o.register.say}`,
  ].join("\n");
}
function render(look) {
  const s = look.sheet;
  return [
    `# The look${look.input?.brief ? ` for "${look.input.brief}"` : ""}`, "", describe(look, 0).replace(/^## 1\. /, "## "), "",
    `Paste into the page's <head>${s.link ? ". It loads one font; the piece must still read in the fallback" : ""}:`, "",
    ...(s.link ? [s.link] : []), "<style>", s.css, "</style>", "",
    `Name the register once, after the kernel: settle.register("${s.register}");`,
    "Use the imagery only where the piece has a picture to show.",
    look.input?.project ? "Saved as this project's look. Later pieces here inherit it; --fresh deals a new one." : "Saved for --show and --redeal. The next request deals a fresh look.",
  ].join("\n");
}

// real paths on both sides: the skills installer links .claude/skills/settle to its copy, and Node resolves that link for import.meta.url alone
if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
