#!/usr/bin/env node
// Static checks for a settle piece: one self-contained file, the kernel, reduced motion, the dealt sheet, and the
// banned list.
//
//   node lint.mjs piece.html [more.html ...]
//
// Exits 1 when any FAIL is found. A line that keeps a flagged pattern because the request asked
// for it carries the comment `settle-allow: <rule>` (anywhere in the file for a whole-file rule). Several rules follow
// taste-skill's lint.mjs (github.com/Leonxlnx/taste-skill, MIT); the sheet check follows impeccable's design-system
// detectors and a few small-piece ones (github.com/pbakaus/impeccable, Apache 2.0); the markup checks follow Vercel's web
// interface guidelines (github.com/vercel-labs/web-interface-guidelines, MIT); the gradient, glow and ground rules are
// settle's own.
import { readFileSync } from "node:fs";

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!files.length) { console.error("usage: node lint.mjs piece.html [more.html ...]"); process.exit(2); }

// ---- colour helpers: hex, rgb() and hsl() to { h, s, l } with l and s in 0..1
function parseColour(c) {
  let r, g, b, m;
  if ((m = /^#([0-9a-f]{3,8})$/i.exec(c))) {
    const x = m[1].length <= 4 ? [...m[1].slice(0, 3)].map((d) => d + d).join("") : m[1].slice(0, 6);
    [r, g, b] = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255);
  } else if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c))) {
    [r, g, b] = [m[1], m[2], m[3]].map((v) => +v / 255);
  } else if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i.exec(c))) {
    return { h: +m[1] % 360, s: +m[2] / 100, l: +m[3] / 100 };
  } else return null;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s, l };
}
const COLOUR = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

let failed = false;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  const raw = src.split("\n");
  const allow = raw.map((l) => (/settle-allow:\s*([\w ,-]+)/.exec(l)?.[1] || "").split(/[ ,]+/).filter(Boolean));
  // Comments say what a piece avoids ("no confetti"), so code rules read the file without them;
  // the pasted kernel is skipped by the code rules too.
  const blank = (s) => s.replace(/[^\n]/g, " ");
  let code = src.replace(/<!--[\s\S]*?-->/g, blank).replace(/\/\*[\s\S]*?\*\//g, blank);
  code = code.replace(/const settle = \(\(\) => \{[\s\S]*?\n\}\)\(\);\s*globalThis\.settle = settle;\s*export default settle;/, blank);
  const lines = code.split("\n").map((l) => l.replace(/(^|[^:"'\\])\/\/.*$/, "$1"));
  const findings = [];
  const allowed = (rule, i) => (i === null ? allow.some((a) => a.includes(rule)) : allow[i]?.includes(rule));
  const add = (level, rule, i, msg) => { if (!allowed(rule, i)) findings.push({ level, rule, line: i === null ? 0 : i + 1, msg }); };
  const each = (re, fn) => lines.forEach((l, i) => { if (re.test(l)) fn(l, i); });

  // One self-contained file, built on the kernel
  each(/<script[^>]*\bsrc\s*=/i, (l, i) => /kernel\.js/.test(l)
    ? add("WARN", "kernel-link", i, "links the kernel: fine for the skill's examples; an output pastes it")
    : add("FAIL", "outside-script", i, "loads a script from outside the file: paste the code in"));
  each(/<link[^>]*rel=["']?stylesheet/i, (l, i) => { if (!/fonts\.googleapis\.com/.test(l)) add("FAIL", "outside-style", i, "a stylesheet from outside the file: only Google Fonts may load"); });
  each(/@import\s+url\(/i, (l, i) => { if (!/fonts\.googleapis\.com/.test(l)) add("FAIL", "outside-style", i, "@import from outside the file"); });
  each(/(src|href)\s*=\s*["']https?:|url\(\s*["']?https?:/i, (l, i) => { if (!/fonts\.(googleapis|gstatic)\.com/.test(l)) add("WARN", "outside-asset", i, "an image or file from another host: fine for the person's own photos, otherwise draw it in code"); });
  if (!/settle kernel|kernel\.js/.test(src)) add("FAIL", "no-kernel", null, "the kernel is missing: springs and timing come from it");
  if (!/prefers-reduced-motion|settle\.(timeline|register)\(/.test(code)) add("FAIL", "no-calm", null, "no reduced-motion handling: springs go instant, arrivals become short fades");
  if (!/:focus-visible/.test(code)) add("WARN", "no-focus", null, "no :focus-visible style: show where keyboard focus is");
  each(/\b(performance|Date)\.now\(\)/, (l, i) => add("WARN", "clock", i, "reads time outside settle.now(): snap.mjs cannot step through it (a clock showing today's time is fine)"));
  each(/addEventListener\(\s*["']mouse(down|up|move)|\bonmouse(down|up|move)\b/i, (l, i) => add("WARN", "mouse-events", i, "mouse events miss touch: use pointer events"));

  // Gradients: lighting the ground is fine; several hues, or colour washes, are not
  const gradients = [];
  for (const m of code.matchAll(/(linear|radial|conic)-gradient\(/g)) {
    let depth = 0, j = m.index + m[0].length - 1;
    for (; j < code.length; j++) { if (code[j] === "(") depth++; else if (code[j] === ")" && --depth === 0) break; }
    gradients.push({ text: code.slice(m.index, j + 1), line: code.slice(0, m.index).split("\n").length - 1 });
  }
  for (const m of code.matchAll(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/g)) gradients.push({ text: m[0], line: code.slice(0, m.index).split("\n").length - 1 });
  for (const g of gradients) {
    const cs = (g.text.match(COLOUR) || []).map(parseColour).filter(Boolean);
    const vivid = cs.filter((c) => c.s > 0.2 && c.l > 0.08 && c.l < 0.92);
    const hues = vivid.some((a) => vivid.some((b) => hueGap(a.h, b.h) > 30));
    const spread = cs.length ? Math.max(...cs.map((c) => c.l)) - Math.min(...cs.map((c) => c.l)) : 0;
    if (hues) add("FAIL", "gradient", g.line, "a gradient across several hues: use flat colour");
    else if (spread > 0.12) add("WARN", "gradient", g.line, "a strong gradient: keep gradients to lighting the ground or fading one colour");
  }
  each(/background-clip\s*:\s*text/i, (l, i) => add("FAIL", "gradient-text", i, "clipped or gradient text: use solid ink"));

  // Glows: shadows with no offset, or in colour
  each(/(box|text)-shadow\s*:|drop-shadow\(/i, (l, i) => {
    const decl = l.slice(l.search(/(box|text)-shadow\s*:|drop-shadow\(/i));
    if (/(box|text)-shadow\s*:\s*0(px)?\s+0(px)?\s+[1-9]|drop-shadow\(\s*0(px)?\s+0(px)?\s+[1-9]/i.test(decl)) add("FAIL", "glow", i, "a shadow with no offset glows: shadows fall below objects");
    if ((decl.match(COLOUR) || []).map(parseColour).some((c) => c && c.s > 0.3 && c.l > 0.1 && c.l < 0.9)) add("FAIL", "glow", i, "a coloured shadow glows: shadows are black at low opacity");
  });

  // The rest of the banned list
  each(/confetti|particle|sparkle|firework/i, (l, i) => add("FAIL", "confetti", i, "confetti or particles: let the object celebrate itself (a check, a flood, a second lap)"));
  each(/lorem ipsum|dolor sit amet/i, (l, i) => add("FAIL", "lorem", i, "placeholder copy: write plausible content"));
  each(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, (l, i) => add("FAIL", "emoji", i, "an emoji: draw icons as SVG"));
  each(/transition\s*:\s*all\b/i, (l, i) => add("FAIL", "transition-all", i, "transition: all: name the properties (Emil Kowalski's rule)"));
  each(/scale\(\s*0\s*\)/, (l, i) => add("FAIL", "scale-zero", i, "entering from scale(0): start at 0.6-0.95 with opacity 0"));
  each(/(?<![-\w])ease-in(?!-out)\b/, (l, i) => add("WARN", "ease-in", i, "ease-in on interface motion feels slow: springs or ease-out"));
  each(/text-transform\s*:\s*uppercase/i, (l, i) => add("WARN", "caps-label", i, "labels in capitals read as template chrome: sentence case"));
  each(/border(-top|-bottom|-left|-right)?\s*:\s*[0-9.]+px\s+solid/i, (l, i) => add("WARN", "border", i, "a solid border: cards take their edges from contrast and shadow"));
  each(/(?<![-\w])color\s*:[^;]*color-mix\([^;]*currentColor/i, (l, i) => add("WARN", "stale-colour", i, "color-mix() of currentColor in color: Chrome keeps the old colour when script changes the parent's; tint from the sheet or use opacity"));
  each(/backdrop-filter\s*:(?!\s*none)/i, (l, i) => add("WARN", "glass", i, "frosted glass: one small panel over a real scene at most"));
  each(/(\.filter\s*=|["']filter["'])[^;]*blur\(|\bfilter\s*:\s*[`'"]\s*blur\(/, (l, i) => add("FAIL", "blur", i, "a blur written straight onto an element: Safari on iPhone draws a stray purple line along it. Blur through settle.blur(el, px)"));
  each(/blur\(\s*(\d+(\.\d+)?)px/i, (l, i) => { if (+/blur\(\s*(\d+(\.\d+)?)px/i.exec(l)[1] > 8) add("WARN", "big-blur", i, "a blur over 8px: costly on phones and in Safari"); });

  // The dealt sheet: every colour, face and corner comes from its variables (impeccable's design-system detectors)
  const SHEET = ["--ground", "--surface", "--inset", "--ink", "--on-ink", "--muted", "--accent", "--on-accent", "--shadow", "--shadow-lift", "--radius", "--round", "--font", "--mono"];
  const roots = [...code.matchAll(/:root\s*\{[^}]*\}/g)];
  const vars = Object.fromEntries(roots.flatMap((r) => [...r[0].matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim()])));
  const missing = SHEET.filter((v) => !(v in vars));
  if (missing.length === SHEET.length) add("FAIL", "no-sheet", null, "no dealt sheet: deal a look with scripts/deal.mjs and paste the :root it prints");
  else if (missing.length) add("FAIL", "sheet", null, `the sheet lacks ${missing.join(", ")}: paste the whole :root that deal.mjs prints`);
  const outside = roots.reduce((c, r) => c.slice(0, r.index) + blank(r[0]) + c.slice(r.index + r[0].length), code).split("\n");
  const neutral = (t) => /^rgba?\(\s*(0[\s,]+0[\s,]+0|255[\s,]+255[\s,]+255)\s*[,/]\s*(0?\.\d+|0)\s*\)$/.test(t.replace(/\s+/g, " ")); // black or white at low alpha: shade and light
  outside.forEach((l, i) => {
    for (const m of l.matchAll(COLOUR)) if (!neutral(m[0])) { add("FAIL", "sheet", i, `${m[0]} is outside the sheet: use its variables, or color-mix() of them`); break; }
    if (/(?:^|[\s;{"'])(?:color|background(?:-color)?|fill|stroke|border(?:-\w+)?-color|outline-color)\s*[:=]\s*["']?(white|black|red|blue|green|orange|purple|pink|yellow|gr[ae]y|silver)\b/i.test(l)) add("FAIL", "sheet", i, "a named colour is outside the sheet: use its variables");
    const fam = /font-family\s*:\s*([^;}]+)/i.exec(l)?.[1], short = /(?:^|[\s;{])font\s*:\s*([^;}]+)/i.exec(l)?.[1];
    if ((fam && !/var\(--(font|mono)\)|^\s*(inherit|initial)\s*$/.test(fam)) || (short && !/var\(--(font|mono)\)|^\s*(inherit|initial)\s*$/.test(short))) add("FAIL", "sheet", i, "a face outside the sheet: use var(--font), or var(--mono) for time codes");
    const rad = /border-radius\s*:\s*([^;}]+)/i.exec(l)?.[1];
    if (rad && !/var\(--(radius|round)\)/.test(rad) && /\b([3-9]|[1-9]\d+)px\b/.test(rad)) add("WARN", "sheet", i, `border-radius ${rad.trim()} is outside the sheet: use var(--radius) for cards, var(--round) for controls`);
  });
  const face = (vars["--font"] || "").match(/^\s*["']([^"']+)["']/)?.[1];
  if (face && !new RegExp(`fonts\\.googleapis\\.com[^"']*family=${face.replace(/ /g, "\\+")}[:&"']`).test(src)) add("WARN", "font-link", null, `the sheet's face ${face} has no Google Fonts link: the piece shows the fallback`);

  // Small-piece detectors (impeccable) and markup checks (Vercel's guidelines)
  each(/will-change\s*:/i, (l, i) => add(/settle\.timeline\(|window\.reel\s*=/.test(code) ? "FAIL" : "WARN", "will-change", i, "will-change keeps a layer at one resolution: text blurs when a camera scales it. Leave it out"));
  each(/animation(-iteration-count)?\s*:[^;]*\binfinite\b/i, (l, i) => add("WARN", "loop", i, "an endless animation: pulsing dots and blinking cursors are attention loops; a reel loops through settle.timeline"));
  each(/border-(left|right)\s*:\s*([3-9]|\d{2,})px\s+solid/i, (l, i) => add("WARN", "side-tab", i, "a thick border down one side reads as the generated-card tell: mark the state with the accent elsewhere"));
  each(/letter-spacing\s*:\s*-0?\.(0[6-9]|[1-9])\d*em/i, (l, i) => add("WARN", "tracking", i, "tracking tighter than -0.05em breaks the letter shapes"));
  each(/repeating-(linear|radial|conic)-gradient\(/i, (l, i) => add("WARN", "stripes", i, "repeating-gradient stripes as decoration read as a generated surface"));
  each(/<img\b(?![^>]*\balt=)[^>]*>/i, (l, i) => add("FAIL", "img-alt", i, "an image without alt: describe it, or alt=\"\" when it is decoration"));
  each(/<img\b[^>]*\bsrc\s*=\s*["']\s*["']/i, (l, i) => add("FAIL", "img-src", i, "an image with an empty src shows as a broken box"));
  each(/<(div|span|li|p)\b[^>]*\sonclick\s*=/i, (l, i) => add("FAIL", "click-div", i, "a clickable div: use a <button>, which keys and assistive tools can press"));
  each(/outline\s*:\s*(none|0)\b/i, (l, i) => { if (!/:focus-visible/.test(code)) add("FAIL", "outline", i, "outline: none with no :focus-visible ring: keyboard focus disappears"); });
  each(/<meta[^>]*name=["']viewport["'][^>]*(user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b)/i, (l, i) => add("FAIL", "zoom", i, "the viewport blocks zoom: let people pinch"));

  // Turned sheets under a device read as a pad of notes: a device is drawn as the device (directions.md, Every direction).
  // Static: it sees a turned .layer and a device in the same file, not how they stack.
  const turned = [...code.matchAll(/[^{}]*\.layer\b[^{}]*\{([^}]*)\}/g)].find((m) => /\brotate\s*:|rotate\(/.test(m[1]));
  const DEVICE = /[.#](phone|device|laptop|tablet|bezel|handset|notch|sensor)\b|\b(class|id|className)\s*=\s*["'][^"']*\b(phone|device|laptop|tablet|bezel|handset|notch|sensor)\b/i;
  if (turned && DEVICE.test(code)) add("FAIL", "paper-stack", code.slice(0, turned.index + turned[0].search(/\S/)).split("\n").length - 1, "turned paper sheets under a device: draw the device itself (bezel, screen, sensor housing), with one flat sheet behind the whole composition at most");

  // The ground and the palette
  const ground = /--ground\s*:\s*([^;]+);/.exec(code)?.[1] || /(?:^|\n)\s*(?:html|body)\s*\{[^}]*background(?:-color)?\s*:\s*([^;]+);/.exec(code)?.[1];
  const gc = ground && (ground.match(COLOUR) || []).map(parseColour)[0];
  if (gc && gc.l < 0.1) add("WARN", "dark-ground", null, "a black ground: the dark look is for subjects that happen in the dark");
  if (gc && gc.h >= 290 && gc.h <= 350 && gc.s > 0.5 && gc.l > 0.35 && gc.l < 0.85) add("FAIL", "pink-ground", null, "a loud pink ground");
  const accents = [];
  for (const c of (code.match(COLOUR) || []).map(parseColour)) {
    if (c && c.s > 0.35 && c.l > 0.2 && c.l < 0.85 && !accents.some((a) => hueGap(a.h, c.h) < 25)) accents.push(c);
  }
  if (accents.length > 3) add("WARN", "palette", null, `${accents.length} distinct accent hues: one or two accents, the rest ink and greys`);

  const fails = findings.filter((f) => f.level === "FAIL").length;
  failed ||= fails > 0;
  console.log(`${file}: ${fails} FAIL, ${findings.length - fails} WARN`);
  for (const f of findings.sort((a, b) => (a.level === b.level ? a.line - b.line : a.level < b.level ? -1 : 1)))
    console.log(`  ${f.level} ${f.rule}${f.line ? ` line ${f.line}` : ""}: ${f.msg}`);
}
process.exit(failed ? 1 : 0);
