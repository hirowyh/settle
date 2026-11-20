#!/usr/bin/env node
// Capture frames of a piece in a browser, for checking motion frame by frame.
//
//   node snap.mjs <file or url> --out <dir> [--size 390x844] [--times 0,0.1,0.2]
//                 [--do "0.5 click #play; 1 drag #knob 120,0 0.3; 2 key ArrowRight"]
//                 [--fps 60 --duration 14] [--sheet] [--calm]
//
// A reel (a page that sets window.reel) is seeked to each time. A piece built on
// the kernel runs on a stopped clock: snap sets window.settleTime, plays the --do
// steps at their times with real mouse and key input, and shoots at each --times
// entry, so a shot at 0.55 shows exactly 0.05 s after a click at 0.5. Without
// --times it shoots at 2 s, when the piece has settled. Any other page is shot
// once after it loads.
//
// Steps: click <sel> | press <sel> | release | hover <sel> | drag <sel> <dx>,<dy> <seconds>
//        | key <Key> | type <text>. Each runs at its time in seconds. A page's alert, confirm or prompt is
//        answered at once with Cancel, so a dialog never stalls the run and never confirms a delete.
// --sheet writes sheet.png, every frame in a grid with its time; --calm turns on reduced motion;
// --eval <js> prints the value of an expression after the last frame; --stage shoots a reel's
// stage alone, filling the frame; --frames-only writes the frames and skips every check below (export.mjs uses both).
// It also reports console errors, requests to other hosts, sideways overflow and the smallest text, then checks the
// settled page: text contrast on the surface behind it, 44 px targets, focus after each step, click() on every control of a standalone file,
// digit runs in the accessibility tree, text hidden at rest or cut by its box, fields under 16 px, the idle cost per
// frame with the CPU slowed, a reel's loop seam, and one frame with the web fonts blocked (fallback.png). Below 768 px
// wide it emulates a phone, so a piece that lays itself out for a wider page shows it. At 768 px or wider it also runs a
// mouse pass: a press on each row's words slid off the piece and let go outside it, then a move with no button held,
// and a hover over every control, flagging what follows the pointer and text whose colour stays after it leaves.
// Runs in ego lite when it is installed, otherwise headless in the first Chromium browser it finds (Chrome, Chromium,
// Edge, Brave; Windows comes with Edge) or the one CHROME names. Needs Node 22 or later; nothing to install.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);
const target = argv.find((a, i) => !a.startsWith("--") && !(argv[i - 1]?.startsWith("--") && !["--sheet", "--calm", "--stage", "--frames-only"].includes(argv[i - 1])));
if (!target) {
  console.error('usage: node snap.mjs <file or url> --out <dir> [--size WxH] [--times a,b] [--do "t step; ..."] [--fps 60 --duration 14] [--sheet] [--calm]');
  process.exit(2);
}
const [path, query = ""] = target.split(/(?=[?#])/);
const url = /^[a-z]+:\/\//.test(target) ? target : existsSync(path) ? pathToFileURL(resolve(path)).href + query : target;
const out = resolve(opt("out", "snaps"));
const [width, height] = opt("size", "1440x1440").split("x").map(Number);
let times = opt("times", "") ? opt("times").split(",").map(Number) : null;
if (!times && opt("duration")) {
  const fps = Number(opt("fps", 60)), n = Math.round(Number(opt("duration")) * fps);
  times = Array.from({ length: n }, (_, i) => i / fps);
}
const steps = (opt("do", "") || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
  const [t, verb, ...rest] = s.split(/\s+/);
  return { t: Number(t), verb, args: rest, text: s };
});

// Everything the capture does goes through `b`: cdp(method, params), navigate(url), events() and
// write(file, base64). It runs inside ego lite's script runtime or here against Chrome, so it reads
// nothing but its two arguments.
async function capture(cfg, b) {
  const { url, out, width, height, times, steps } = cfg;
  const phone = width < 768;
  await b.cdp("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: phone });
  if (phone) await b.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  // Set reduced motion either way: the browser inherits the system's setting otherwise.
  await b.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: cfg.calm ? "reduce" : "no-preference" }] });
  await b.cdp("Page.enable");
  await b.cdp("Runtime.enable");
  await b.cdp("Network.enable");
  await b.cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.settleTime = 0; window.alert = () => {}; window.confirm = () => false; window.prompt = () => null;" });
  await b.navigate(url);
  const evaluate = async (expression) => (await b.cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  await evaluate("document.fonts.ready.then(() => true)");
  const twoFrames = "new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))";
  const kind = await evaluate("window.reel && typeof window.reel.seek === 'function' ? 'reel' : window.settle && typeof window.settle.now === 'function' ? 'piece' : 'page'");
  if (kind !== "piece") await evaluate("delete window.settleTime; true");
  if (cfg.stage && kind === "reel") await evaluate(`(() => {
    document.querySelector(".controls")?.remove();
    document.body.style.cssText += ";padding:0;margin:0;display:block;min-height:0";
    Object.assign(document.getElementById("stage").style, { width: innerWidth + "px", borderRadius: "0" });
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))));
  })()`);

  // One timeline of shots and input, in time order; input at a time runs before a shot at the same time.
  const plan = [];
  if (kind === "page") plan.push({ t: null });
  else for (const t of times || (kind === "piece" ? [2] : [0])) plan.push({ t });
  if (kind === "piece") {
    for (const s of steps) {
      if (s.verb === "drag") {
        const [dx, dy] = s.args[1].split(",").map(Number), dur = Number(s.args[2] || 0.3), n = Math.max(1, Math.round(dur * 60));
        plan.push({ t: s.t, act: { verb: "down", sel: s.args[0] }, text: s.text });
        for (let k = 1; k <= n; k++) plan.push({ t: s.t + (dur * k) / n, act: { verb: "move", dx: (dx * k) / n, dy: (dy * k) / n } });
        plan.push({ t: s.t + dur, act: { verb: "up" } });
      } else plan.push({ t: s.t, act: { verb: s.verb, sel: ["click", "press", "hover"].includes(s.verb) ? s.args.join(" ") : s.args[0], text: s.args.join(" ") }, text: s.text }); // a selector may hold spaces
    }
  } else if (steps.length) console.error("--do needs a piece built on the kernel; ignoring it");
  plan.sort((a, b) => (a.t ?? 0) - (b.t ?? 0) || (a.act ? 0 : 1) - (b.act ? 0 : 1));

  const KEYS = { Tab: 9, Enter: 13, " ": 32, Space: 32, Escape: 27, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, Backspace: 8, PageUp: 33, PageDown: 34 };
  let at = { x: 0, y: 0 }, origin = null, lastStep = "";
  const centre = async (sel) => {
    const c = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!c) throw new Error(`no element matches ${sel}`);
    return c;
  };
  const mouse = (type, p, buttons) => b.cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, button: type === "mouseMoved" && !buttons ? "none" : "left", buttons, clickCount: 1 });
  async function act(a) {
    if (a.verb === "hover") { at = await centre(a.sel); await mouse("mouseMoved", at, 0); }
    if (a.verb === "click" || a.verb === "press" || a.verb === "down") {
      at = origin = await centre(a.sel);
      await mouse("mouseMoved", at, 0);
      await mouse("mousePressed", at, 1);
      if (a.verb === "click") await mouse("mouseReleased", at, 0);
    }
    if (a.verb === "move") { at = { x: origin.x + a.dx, y: origin.y + a.dy }; await mouse("mouseMoved", at, 1); }
    if (a.verb === "release" || a.verb === "up") await mouse("mouseReleased", at, 0);
    if (a.verb === "key") {
      const key = a.sel === "Space" ? " " : a.sel, code = KEYS[key] ?? key.toUpperCase().charCodeAt(0);
      const text = key.length === 1 ? key : key === "Enter" ? "\r" : undefined;
      await b.cdp("Input.dispatchKeyEvent", { type: "keyDown", key, code: key === " " ? "Space" : key, windowsVirtualKeyCode: code, text });
      await b.cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code: key === " " ? "Space" : key, windowsVirtualKeyCode: code });
    }
    if (a.verb === "type") await b.cdp("Input.insertText", { text: a.text });
  }

  const shots = [], dropped = [];
  let clock = 0, focusWas = "page";
  const focused = "(() => { const a = document.activeElement; return !a || a === document.body ? 'page' : a.id ? '#' + a.id : a.tagName.toLowerCase(); })()";
  for (const step of plan) {
    if (step.t !== null && kind === "piece") {
      // Play the frames in between at 60 fps, so state a piece keeps in its draw loop moves as it would live.
      // One round trip per gap: the page steps its own clock a frame at a time, and each piece's loop, asked for its frame
      // before this one, draws first.
      // A frame that takes over 100 ms moves on without it, so a slow page cannot hang the run.
      if (step.t - clock <= 2) await evaluate(`(async () => { for (let u = ${clock} + 1 / 60; u < ${step.t} - 1e-6; u += 1 / 60) { window.settleTime = u; await new Promise((r) => { requestAnimationFrame(r); setTimeout(r, 100); }); } return true; })()`);
      await evaluate(`window.settleTime = ${step.t}; true`);
      clock = step.t;
    }
    if (step.act) {
      await act(step.act);
      if (step.text) {
        lastStep = step.text.replace(/^\S+\s+/, "");
        const now = await evaluate(focused); // focus that falls to the page loses the keyboard user's place
        if (focusWas !== "page" && now === "page") dropped.push(lastStep);
        focusWas = now;
      }
      continue;
    }
    if (step.t === null) await new Promise((r) => setTimeout(r, 1500));
    // A reel draws its frame from t alone, so one frame after the seek is enough: it shoots the same pixels as two.
    if (kind === "reel") await evaluate(`window.reel.pause(); window.reel.seek(${step.t}); new Promise((r) => requestAnimationFrame(() => r(true)))`);
    else await evaluate(twoFrames);
    const shoot = () => b.cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } });
    const { data } = await shoot().catch(shoot); // a screenshot can fail once in a long run; one retry keeps the render
    b.write(`${out}/f_${String(shots.length).padStart(4, "0")}.png`, data);
    shots.push({ data: cfg.sheet ? data : null, label: step.t === null ? "after load" : `${step.t.toFixed(2)} s${lastStep ? " · " + lastStep : ""}` });
  }

  if (cfg.evalExpr) console.log("eval:", JSON.stringify(await evaluate(cfg.evalExpr)));
  if (cfg.framesOnly) { console.log(`${shots.length} frame(s) in ${out} (${kind})`); return false; }

  // Measured checks on the settled page: what a look at one frame can miss.
  const m = await evaluate(`(() => {
    const d = document.documentElement, small = [], low = [], tiny = [], cut = [];
    const pen = new OffscreenCanvas(1, 1).getContext("2d", { willReadFrequently: true });
    const rgb = (c) => { pen.clearRect(0, 0, 1, 1); pen.fillStyle = "#000"; pen.fillStyle = c; pen.fillRect(0, 0, 1, 1); const [r, g, b, a] = pen.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; }; // any CSS colour as sRGB: color-mix() computes to color(srgb 0–1 …)
    const lum = (c) => { const v = rgb(c).slice(0, 3).map((x) => x / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const behind = (e) => {
      const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      for (let n = e; n; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage !== "none") return null;
        if (rgb(cs.backgroundColor)[3] > 0.5) return cs.backgroundColor;
        for (const s of n.parentElement?.children || []) { // a sibling under the text, such as a sliding indicator, shows before the parent's colour
          const q = s.getBoundingClientRect(), ss = getComputedStyle(s);
          if (s !== n && x >= q.left && x <= q.right && y >= q.top && y <= q.bottom && rgb(ss.backgroundColor)[3] > 0.5 && +ss.opacity > 0.5 && ss.visibility !== "hidden") return ss.backgroundColor;
        }
      }
      return "rgb(255, 255, 255)";
    };
    const name = (e) => (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().replace(/\\s+/g, " ").slice(0, 24);
    let texts = 0, hidden = 0;
    for (const e of document.querySelectorAll("body *")) {
      if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(e.tagName) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (r.width && r.width <= 2 && r.height <= 2) continue; // text for screen readers only
      if (!r.width) continue; // out of the layout: a closed panel or dialog, or a part this width leaves out
      const away = e.closest("[inert], [hidden], [aria-hidden=true]"); // a closed panel or a duplicate layer is meant to be out of sight
      if (!away) texts++;
      if (cs.visibility === "hidden" || +cs.opacity === 0) { if (!away) hidden++; continue; }
      const scale = e.offsetHeight ? r.height / e.offsetHeight : 1, px = parseFloat(cs.fontSize) * scale;
      small.push({ px, text: e.textContent.trim().slice(0, 24) });
      let op = 1, clip = false;
      for (let n = e; n; n = n.parentElement) { const ns = getComputedStyle(n); op *= +ns.opacity; clip ||= ns.clipPath !== "none"; }
      const bg = behind(e);
      if (bg && op > 0.95 && !clip) { // text clipped to a shape (labels lit inside an indicator) sits on that shape, which is no ancestor
        const a = lum(cs.color), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        const need = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5;
        if (ratio < need) low.push({ ratio, need, text: name(e) });
      }
      if (/hidden|clip/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 1 && !e.closest("[aria-hidden=true]")) cut.push(name(e));
    }
    const sel = "button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=switch], [role=slider], [role=tab], [role=radio], [role=checkbox], [role=option]";
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect();
      if (e.disabled || !r.width || !r.height || e.closest("[aria-hidden=true], [inert]")) continue;
      let w = r.width, h = r.height;
      for (const ps of ["::before", "::after"]) { // an invisible margin that widens the target counts
        const p = getComputedStyle(e, ps), out = (k) => Math.max(0, -parseFloat(p[k]) || 0);
        if (p.content === "none" || p.position !== "absolute") continue;
        w = Math.max(w, r.width + out("left") + out("right")); h = Math.max(h, r.height + out("top") + out("bottom"));
      }
      if (w < 44 || h < 44) tiny.push(name(e) + " " + Math.round(w) + "×" + Math.round(h));
    }
    const zoom = [...document.querySelectorAll("input, select, textarea")].filter((e) => !/range|checkbox|radio|hidden/.test(e.type) && parseFloat(getComputedStyle(e).fontSize) < 16).length;
    small.sort((a, b) => a.px - b.px); low.sort((a, b) => a.ratio - b.ratio);
    const clipped = [d, document.body].some((e) => /hidden|clip/.test(getComputedStyle(e).overflowX)); // a page that clips x can't scroll sideways
    return { overflow: clipped ? 0 : Math.max(d.scrollWidth, document.body.scrollWidth) - innerWidth, smallest: small[0] || null,
      low: low.slice(0, 3), lowCount: low.length, tiny: tiny.slice(0, 4), tinyCount: tiny.length, cut: [...new Set(cut)].slice(0, 3),
      hiddenShare: texts ? hidden / texts : 0, zoom, fonts: !!document.querySelector('link[href*="fonts.googleapis.com"]') };
  })()`);
  let digits = [];
  try {
    const { nodes } = await b.cdp("Accessibility.getFullAXTree");
    digits = nodes.map((n) => [n.name?.value, n.value?.value].filter(Boolean).join(" ")).filter((t) => /(\d ?){10,}/.test(t));
  } catch {}
  let idle = null; // main-thread time per frame at rest, the CPU slowed four times
  try {
    await b.cdp("Performance.enable");
    await b.cdp("Emulation.setCPUThrottlingRate", { rate: 4 });
    const read = async () => Object.fromEntries((await b.cdp("Performance.getMetrics")).metrics.map((x) => [x.name, x.value]));
    const a = await read(), n = await evaluate("new Promise((r) => { let k = 0; (function f() { if (++k < 60) requestAnimationFrame(f); else r(k); })(); })"), z = await read();
    idle = (["ScriptDuration", "LayoutDuration", "RecalcStyleDuration"].reduce((t, k) => t + (z[k] - a[k]), 0) * 1000) / n;
  } catch {} finally { await b.cdp("Emulation.setCPUThrottlingRate", { rate: 1 }).catch(() => {}); }
  let seam = null;
  if (kind === "reel") {
    const D = await evaluate("window.reel.duration || +(document.getElementById('scrub')?.max) || 0");
    const box = await evaluate("(() => { const r = (document.getElementById('stage') || document.body).getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height, scale: 1 }; })()");
    if (D > 0 && box.width) {
      const grab = async (t) => { await evaluate(`window.reel.pause(); window.reel.seek(${t}); ${twoFrames}`); return (await b.cdp("Page.captureScreenshot", { format: "png", clip: box })).data; };
      const first = await grab(0), last = await grab(D - 1 / 60);
      seam = await evaluate(`(async () => {
        const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s; });
        const [a, z] = await Promise.all([load(${JSON.stringify(first)}), load(${JSON.stringify(last)})]);
        const c = new OffscreenCanvas(a.width, a.height), g = c.getContext("2d", { willReadFrequently: true });
        g.drawImage(a, 0, 0); const A = g.getImageData(0, 0, a.width, a.height).data; g.drawImage(z, 0, 0); const Z = g.getImageData(0, 0, a.width, a.height).data;
        let off = 0; for (let k = 0; k < A.length; k += 4) if (Math.abs(A[k] - Z[k]) + Math.abs(A[k + 1] - Z[k + 1]) + Math.abs(A[k + 2] - Z[k + 2]) > 48) off++;
        return off / (a.width * a.height);
      })()`);
    }
  }
  // Every action runs on click, which pointer, keys and assistive tools all send: a control whose click() changes nothing fails them.
  // Only a standalone file is swept: a project's dev page can hold Delete and Send buttons wired to a real backend.
  const sweep = kind === "piece" && url.startsWith("file:");
  const quiet = !sweep ? [] : await evaluate(`(async () => {
    const frames = () => new Promise((r) => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 250); }), quiet = [];
    const state = () => document.body.innerHTML + [...document.querySelectorAll("canvas")].map((c) => { try { return c.toDataURL(); } catch { return ""; } }).join("") + location.href;
    // the sweep presses delete buttons too; what the page saved goes back afterwards, or the next load of this origin opens empty
    const stores = (() => { try { return [localStorage, sessionStorage]; } catch { return []; } })(), kept =stores.map((s) => Array.from({ length: s.length }, (_, i) => [s.key(i), s.getItem(s.key(i))]));
    for (const e of document.querySelectorAll("button, [role=button], [role=switch], [role=tab], [role=radio], [role=checkbox], [role=option], [role=menuitem]")) {
      // A control that is not drawn, or sits behind an open modal dialog, is out of reach, like an inert subtree.
      if (e.disabled || e.getAttribute("aria-disabled") === "true" || e.closest("[aria-hidden=true], [inert]") || !e.getClientRects().length || (document.querySelector("dialog:modal") && !e.closest("dialog:modal"))) continue;
      const before = state();
      e.click();
      window.settleTime += 0.4;
      await frames();
      if (state() === before) quiet.push((e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 24));
    }
    stores.forEach((s, k) => { s.clear(); for (const [key, v] of kept[k]) s.setItem(key, v); });
    return quiet;
  })()`);
  // A mouse pass at a desktop width, on paths no phone check takes: a press on a row's words slid off the piece and let go
  // outside it must leave nothing following the pointer, and a hover's colour must clear once the pointer leaves.
  let stuck = null, stale = null;
  if (kind === "piece" && !phone) {
    // the page's own clock: on a stopped clock that jumps, the browser held some mouse moves for a second each
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const fresh = async () => { await b.navigate(url); await evaluate("delete window.settleTime; true"); await sleep(300); };
    const rows = `[...document.querySelectorAll("li, [role=slider], [role=option]"), ...[...document.querySelectorAll("body *")].filter((e) => /grab|move|resize/.test(getComputedStyle(e).cursor))]
      .filter((e, i, all) => { const r = e.getBoundingClientRect(); return all.indexOf(e) === i && r.width > 4 && r.height > 4 && r.top >= 0 && r.bottom <= innerHeight && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && !e.closest("[aria-hidden=true], [inert]"); })`;
    const near = "[window.__snapRow, ...window.__snapRow.parentElement.children].map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top]; })";
    const texts = `[...document.querySelectorAll("body *")].filter((e) => [...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim()))`;
    await fresh();
    const kept = await evaluate("(() => { try { return [localStorage, sessionStorage].map((s) => Array.from({ length: s.length }, (_, i) => [s.key(i), s.getItem(s.key(i))])); } catch { return []; } })()");
    const n = Math.min(4, await evaluate(`${rows}.length`));
    stuck = [];
    for (let i = 0; i < n; i++) {
      const p = await evaluate(`(() => {
        const e = window.__snapRow = ${rows}[${i}];
        const w = [e, ...e.querySelectorAll("*")].find((c) => [...c.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())) || e;
        const r = w.getBoundingClientRect(), box = (document.getElementById("piece") || document.body).getBoundingClientRect();
        return { x: r.left + Math.min(r.width / 2, 40), y: r.top + r.height / 2, out: Math.min(innerWidth - 2, box.right + 60), name: (e.getAttribute("aria-label") || e.textContent).trim().replace(/\\s+/g, " ").slice(0, 24) };
      })()`);
      await mouse("mouseMoved", p, 0); await mouse("mousePressed", p, 1);
      for (let k = 1; k <= 6; k++) await mouse("mouseMoved", { x: p.x + ((p.out - p.x) * k) / 6, y: p.y + 1 }, 1);
      await mouse("mouseReleased", { x: p.out, y: p.y + 1 }, 0);
      await sleep(600);
      const a = await evaluate(near);
      await mouse("mouseMoved", p, 0);
      for (let k = 1; k <= 5; k++) await mouse("mouseMoved", { x: p.x, y: p.y + k * 12 }, 0);
      await sleep(300);
      const z = await evaluate(near);
      if (a.some(([x, y], j) => Math.abs(z[j][0] - x) > 12 || Math.abs(z[j][1] - y) > 12)) { stuck.push(p.name); await fresh(); } // a row left following the pointer would spoil the next press
    }
    const c0 = await evaluate(`${texts}.map((e) => getComputedStyle(e).color)`);
    const spots = await evaluate(`[...document.querySelectorAll("a, button, input, select, li, [role], [tabindex]")].map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 4 && r.height > 4 && r.top >= 0 && r.bottom <= innerHeight).slice(0, 24).map((r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }))`);
    for (const s of spots) { await mouse("mouseMoved", s, 0); await sleep(60); }
    await mouse("mouseMoved", { x: 1, y: 1 }, 0); await sleep(1200);
    const c1 = await evaluate(`${texts}.map((e) => getComputedStyle(e).color)`), names = await evaluate(`${texts}.map((e) => e.textContent.trim().slice(0, 24))`);
    stale = c0.length === c1.length ? [...new Set(c0.map((c, j) => (c !== c1[j] ? names[j] : null)).filter(Boolean))] : [];
    await evaluate(`(() => { try { [localStorage, sessionStorage].forEach((s, k) => { s.clear(); for (const [key, v] of ${JSON.stringify(kept)}[k] || []) s.setItem(key, v); }); } catch {} return true; })()`);
  }
  const events = await b.events();
  const errors = events.filter((e) => e.method === "Runtime.exceptionThrown" || (e.method === "Runtime.consoleAPICalled" && e.params.type === "error"))
    .map((e) => e.params.exceptionDetails?.exception?.description?.split("\n")[0] || e.params.exceptionDetails?.text || e.params.args?.map((a) => a.value ?? a.description).join(" "));
  const fromExtension = (e) => [e.params.initiator?.url, ...(e.params.initiator?.stack?.callFrames || []).map((f) => f.url)].some((u) => /^(chrome|moz)-extension:/.test(u || "")); // the browser's add-ons, not the piece
  const hosts = [...new Set(events.filter((e) => e.method === "Network.requestWillBeSent" && !fromExtension(e)).map((e) => e.params.request.url)
    .filter((u) => /^https?:/.test(u) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u) && !/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(u))
    .map((u) => new URL(u).host))];
  // The same page with its web fonts blocked: it must still fit and read in the named system font.
  let fallback = null;
  if (m.fonts) {
    await b.cdp("Network.setBlockedURLs", { urls: ["*://fonts.googleapis.com/*", "*://fonts.gstatic.com/*"] });
    await b.navigate(url);
    if (kind === "piece") await evaluate(`window.settleTime = 2; ${twoFrames}`);
    if (kind === "reel") await evaluate(`window.reel.pause(); window.reel.seek(${(times || [0])[0]}); ${twoFrames}`);
    await evaluate(twoFrames);
    b.write(`${out}/fallback.png`, (await b.cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width, height, scale: 1 } })).data);
    fallback = await evaluate("(() => { const d = document.documentElement, clipped = [d, document.body].some((e) => /hidden|clip/.test(getComputedStyle(e).overflowX)); return { overflow: clipped ? 0 : Math.max(d.scrollWidth, document.body.scrollWidth) - innerWidth }; })()");
    await b.cdp("Network.setBlockedURLs", { urls: [] });
  }
  const report = [
    errors.length ? `FAIL console: ${errors.slice(0, 3).join(" | ")}` : "ok   console clean",
    hosts.length ? `FAIL outside requests: ${hosts.join(", ")}` : "ok   no requests beyond Google Fonts",
    m.overflow > 0 ? `FAIL scrolls sideways by ${m.overflow} px at ${width} px wide${phone ? " on a phone" : ""}` : `ok   fits ${width} px wide${phone ? " on a phone" : ""}`,
    m.smallest && m.smallest.px < 11 ? `WARN smallest text ${m.smallest.px.toFixed(1)} px ("${m.smallest.text}")` : `ok   smallest text ${m.smallest ? m.smallest.px.toFixed(1) + " px" : "none"}`,
    m.lowCount ? `FAIL contrast ${m.low.map((x) => `${x.ratio.toFixed(2)}:1 under ${x.need}:1 ("${x.text}")`).join(", ")}${m.lowCount > 3 ? ` and ${m.lowCount - 3} more` : ""}` : "ok   text contrast holds on every surface",
    m.tinyCount ? `WARN ${m.tinyCount} target(s) under 44 px: ${m.tiny.join(", ")}` : "ok   every target is 44 px or more",
    dropped.length ? `WARN focus fell to the page after: ${dropped.join(", ")}` : null,
    quiet.length ? `WARN click() changes nothing on: ${quiet.join(", ")} (fine for a control with nothing to do in this state; otherwise move its action to click)` : sweep ? "ok   every control answers click()" : null,
    stuck === null ? null : stuck.length ? `FAIL with a mouse, a press slid off the piece and let go outside leaves ${stuck.slice(0, 3).join(", ")} following the pointer with no button held: capture on pointerdown, drag only while e.buttons holds one` : "ok   nothing follows the mouse after a press let go outside the piece",
    stale === null ? null : stale.length ? `WARN text keeps another colour after the mouse leaves: ${stale.slice(0, 3).join(", ")}` : "ok   hover colours clear when the mouse leaves",
    digits.length ? `FAIL the accessibility tree reads a digit run ("${digits[0].slice(0, 32)}"): hide digit strips with aria-hidden` : "ok   no digit runs in the accessibility tree",
    m.hiddenShare > 0.25 ? `WARN ${Math.round(m.hiddenShare * 100)} % of the text is hidden at rest` : null,
    m.cut.length ? `WARN text cut by its box: ${m.cut.join(", ")}` : null,
    m.zoom ? `WARN ${m.zoom} field(s) under 16 px: iOS zooms the page into them` : null,
    idle === null ? null : idle > 2 ? `WARN idle cost ${idle.toFixed(1)} ms a frame with the CPU slowed 4×: skip the writes once every value has settled` : `ok   idle cost ${idle.toFixed(1)} ms a frame with the CPU slowed 4×`,
    seam === null ? null : seam > 0.01 ? `FAIL loop seam: ${(seam * 100).toFixed(1)} % of the stage differs between the first and the last frame` : `ok   loop seam: ${(seam * 100).toFixed(2)} % differs`,
    fallback === null ? null : fallback.overflow > 0 ? `WARN with the web fonts blocked it scrolls sideways by ${fallback.overflow} px (fallback.png)` : "ok   fits with the web fonts blocked (fallback.png)",
  ].filter(Boolean);

  if (cfg.sheet && shots.length) {
    // The sheet crops every frame to the area where any frame differs from the ground, plus a margin.
    await b.cdp("Emulation.setEmulatedMedia", { features: [] });
    await b.navigate("about:blank");
    const size = await evaluate(`(async () => {
      const shots = ${JSON.stringify(shots.map((s) => ({ src: "data:image/png;base64," + s.data, label: s.label })))};
      const imgs = await Promise.all(shots.map((s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s.src; })));
      const W = ${width}, H = ${height}, c = new OffscreenCanvas(W, H), g = c.getContext("2d", { willReadFrequently: true });
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const img of imgs) {
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, W, H).data, r = d[0], gg = d[1], b = d[2];
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
          const k = (y * W + x) * 4;
          if (Math.abs(d[k] - r) + Math.abs(d[k + 1] - gg) + Math.abs(d[k + 2] - b) > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
      }
      if (x1 < x0) { x0 = 0; y0 = 0; x1 = W; y1 = H; }
      const m = 32; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W, x1 + m); y1 = Math.min(H, y1 + m);
      const cw = x1 - x0, chh = y1 - y0, cell = Math.round(Math.min(360, Math.max(cw, Math.min(2 * cw, 260)))), h = Math.round((cell * chh) / cw);
      const cols = Math.max(1, Math.min(shots.length, Math.floor(1600 / (cell + 12)), 8));
      document.body.style.cssText = "margin:0;background:#fff;font:12px/1.3 ui-sans-serif,-apple-system,sans-serif;display:grid;gap:12px;padding:12px;align-content:start;grid-template-columns:repeat(" + cols + "," + cell + "px)";
      imgs.forEach((img, i) => {
        const f = document.createElement("figure"), cv = document.createElement("canvas"), cap = document.createElement("figcaption");
        f.style.margin = "0"; cv.width = cell; cv.height = h; cv.style.outline = "1px solid #ddd"; cv.style.display = "block";
        cv.getContext("2d").drawImage(img, x0, y0, cw, chh, 0, 0, cell, h);
        cap.textContent = shots[i].label; cap.style.cssText = "padding-top:4px;color:#333";
        f.append(cv, cap); document.body.append(f);
      });
      const box = [...document.body.children].map((e) => e.getBoundingClientRect());
      return { w: Math.ceil(Math.max(...box.map((r) => r.right))) + 12, h: Math.ceil(Math.max(...box.map((r) => r.bottom))) + 12 };
    })()`);
    await b.cdp("Emulation.setDeviceMetricsOverride", { width: size.w, height: size.h, deviceScaleFactor: 1, mobile: false });
    const { data } = await b.cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: size.w, height: size.h, scale: 1 } });
    b.write(`${out}/sheet.png`, data);
  }
  console.log(`${shots.length} frame(s) in ${out}${cfg.sheet ? ", sheet.png" : ""} (${kind})\n${report.join("\n")}`);
  return report.some((l) => l.startsWith("FAIL"));
}

const cfg = { url, out, width, height, times, steps, calm: flag("calm"), stage: flag("stage"), sheet: flag("sheet"), framesOnly: flag("frames-only"), evalExpr: opt("eval") };
mkdirSync(out, { recursive: true });
if (spawnSync("ego-browser", ["--version"]).status === 0) {
  const script = `const fs = await import("node:fs");
const task = await taskSpace("settle snap ${process.pid}"); // its own space, so parallel runs never close each other's
const pg = await task.newPage(), seen = [];
const b = {
  cdp: (method, params = {}) => pg.cdp(method, params),
  navigate: async (u) => { await pg.goto(u); await pg.waitForLoadState(); },
  events: async () => { seen.push(...(await pg.events())); return seen; },
  write: (file, data) => fs.writeFileSync(file, Buffer.from(data, "base64")),
};
try { await (${capture})(${JSON.stringify(cfg)}, b); } finally { await task.finish({ keep: [] }); }`;
  const r = spawnSync("ego-browser", ["nodejs"], { input: script, encoding: "utf8", maxBuffer: 1 << 28 });
  const said = (r.stdout || "") + (r.stderr || ""); // ego lite prints the script's console on stderr, console.error as "[error] "
  if (r.status !== 0) process.stderr.write(said);
  else for (const line of said.split("\n").filter(Boolean)) line.startsWith("[error] ") ? console.error(line.slice(8)) : console.log(line);
  if (r.status !== 0 || (!cfg.framesOnly && /^FAIL/m.test(said))) process.exitCode = 1;
} else {
  // the Chromium browsers that drive the same way, in their usual places on a Mac, on Linux and on Windows
  const chrome = process.env.CHROME || [
    ...["Google Chrome", "Chromium", "Microsoft Edge", "Brave Browser"].map((n) => `/Applications/${n}.app/Contents/MacOS/${n}`),
    ...["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"].map((n) => `/usr/bin/${n}`), "/snap/bin/chromium",
    ...[process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean)
      .flatMap((d) => [`${d}\\Google\\Chrome\\Application\\chrome.exe`, `${d}\\Microsoft\\Edge\\Application\\msedge.exe`]),
  ].find((p) => existsSync(p));
  if (!chrome) { console.error("No Chromium browser found: install Chrome, Edge, Brave or Chromium, or set CHROME to one's path"); process.exit(1); }
  console.error(`ego lite is not installed; using ${chrome}`);
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), "snap-"));
  const proc = spawn(chrome, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--hide-scrollbars", "--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore" });
  proc.on("error", (e) => { console.error(`Could not start ${chrome} (${e.code}): set CHROME to the path of Chrome or another Chromium browser`); rmSync(profile, { recursive: true, force: true }); process.exit(1); });
  let ws, id = 0;
  const pending = new Map(), listeners = [], events = [];
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  const once = (method) => new Promise((resolve) => listeners.push({ method, resolve }));
  try {
    let info;
    for (let i = 0; i < 100 && !info; i++) {
      try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); }
      catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    if (!info) throw new Error(`Chrome did not start: ${chrome}`);
    ws = new WebSocket(info.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", () => j(new Error(`could not connect to ${chrome}`)), { once: true }); });
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        events.push(msg);
        for (let i = listeners.length - 1; i >= 0; i--) if (listeners[i].method === msg.method) listeners.splice(i, 1)[0].resolve(msg.params);
      }
    });
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const cdp = (method, params) => send(method, params, sessionId);
    const failed = await capture(cfg, {
      cdp,
      navigate: async (u) => {
        const loaded = once("Page.loadEventFired");
        const nav = await cdp("Page.navigate", { url: u });
        if (nav.errorText) throw new Error(`could not load ${u}: ${nav.errorText}`);
        await loaded;
      },
      events: async () => events,
      write: (file, data) => writeFileSync(file, Buffer.from(data, "base64")),
    });
    if (failed) process.exitCode = 1;
  } finally {
    if (ws) ws.close();
    proc.kill();
    if (proc.exitCode === null && proc.signalCode === null) await new Promise((r) => proc.once("exit", r)); // Chrome writes to its profile as it quits
    try { rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}
