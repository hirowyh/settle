# Motion recipes

One motion per recipe, each about 30 lines and runnable as it stands. Colours come only from the sheet's variables and timings only from the register, so a recipe reads right in every look and every register. `references/craft.md` says which kind of change takes which recipe and why; build a piece by taking the recipes its changes need and giving them the piece's content.

## The sheet

Every recipe reads these variables and no others. A look sets them, and `scripts/deal.mjs` deals them from `library/`.

| Variable | Holds |
| --- | --- |
| `--ground` | The page behind everything |
| `--surface` | A card or panel on the ground: paper on a light look, a lighter step on a dark one |
| `--inset` | A well, an unfilled track or a quiet button inside a surface |
| `--ink` | Text and solid shapes |
| `--on-ink` | Text and marks on an ink-filled shape |
| `--muted` | Secondary text, 4.5:1 on every surface it sits on |
| `--accent` | The one thing that matters now |
| `--on-accent` | Text on an accent fill |
| `--shadow`, `--shadow-lift` | A surface's shadow, and one for something the hand holds (`none` on dark looks, where depth comes from lighter steps) |
| `--radius`, `--round` | A card's corners, and a control's (999px for full pills, 0 for square shapes) |
| `--font`, `--mono` | The type system's face, and its face for time codes |

## The base page

Each recipe assumes the page below: the sheet's variables on `:root`, the kernel pasted whole into a module script, the dealt register named once, and a few base styles.

The dealt direction lays out the page with its own `body` and `#piece` rules (`references/directions.md`). Whatever it does, `#piece` carries the width itself, `#piece { width: min(360px, 100%); }`: a percentage width on anything inside a box sized to its content has nothing to resolve against, and the piece shrinks to its narrowest part.

```html
<script type="module">/* assets/kernel.js, pasted whole */ settle.register("crisp");</script>
<style>
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { margin: 0; min-height: 100dvh; background: var(--ground); color: var(--ink); font: 15px/1.4 var(--font); }
:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
button, input { font: inherit; color: inherit; }
* { -webkit-tap-highlight-color: transparent; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
```

`settle.register()` returns the dealt register's presets: `morph` and `fold` for a shape growing and folding, `front` and `back` for an indicator's two edges, `pop` for something appearing, `fade` for colour and opacity, `count` for a shown number, `throw` for a value the hand lets go. When the system asks for reduced motion it returns the calm set instead: every move lands at once, colour and opacity keep a short fade, and numbers show their final value. A recipe never names a duration of its own, apart from story time in a reel or a demo.

## Press

Confirms. A pressed control dips to 0.97 and springs back; the action runs on `click`, which pointer, keys and assistive tools all send.

```html recipe
<button class="pr" type="button">Save draft</button>
<style>
.pr { padding: 14px 26px; border: 0; border-radius: var(--round); background: var(--ink); color: var(--on-ink); font-weight: 600; cursor: pointer; touch-action: manipulation; -webkit-user-select: none; user-select: none; }
</style>
<script type="module">
const R = settle.register(), b = document.querySelector(".pr"), dip = settle.track(1, R.pop);
const down = () => dip.set(0.97, settle.now()), up = () => dip.set(1, settle.now());
b.addEventListener("pointerdown", down);
for (const e of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(e, up);
b.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) down(); });
b.addEventListener("keyup", up);
b.addEventListener("click", () => (b.textContent = "Saved"));
(function draw() { b.style.transform = `scale(${dip.value(settle.now())})`; requestAnimationFrame(draw); })();
</script>
```

## Arrive

Appears. A group arrives in order, 37 ms apart for rows, each from a short blur with a small rise. Opacity rides `fade`, so it never overshoots; the rise rides `pop`.

```html recipe
<ul class="ar" aria-label="Up next"><li>Harbour Lights</li><li>Slow Weather</li><li>Glass Orchard</li><li>Night Bus Home</li></ul>
<button class="ar-b" type="button">Show again</button>
<style>
.ar { width: min(280px, 100%); margin: 0; padding: 6px; list-style: none; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.ar li { padding: 12px 14px; }
.ar-b { margin-top: 10px; padding: 12px 16px; border: 0; background: none; color: var(--muted); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), rows = [...document.querySelectorAll(".ar li")];
let at = settle.now() + 0.1;
document.querySelector(".ar-b").addEventListener("click", () => (at = settle.now()));
(function draw() {
  const t = settle.now();
  rows.forEach((el, i) => {
    const a = t - at - settle.stagger(i), o = settle.move(a, R.fade, 0, 1);
    el.style.opacity = o;
    el.style.transform = `translateY(${settle.move(a, R.pop, 8, 0)}px)`;
    settle.blur(el, (1 - o) * 6);
  });
  requestAnimationFrame(draw);
})();
</script>
```

## Mask rise

Appears. A line of text slides up from below its baseline, clipped by a mask; the lines of a flow sit in one column, so "Booking" hands over to "Booked". The column is hidden from screen readers and the current line is spoken.

```html recipe
<p class="mk"><span class="mk-m" aria-hidden="true"><span class="mk-c"><span>Booking</span><span>Booked</span><span>Table for 4 at 19:30</span></span></span><span class="sr" aria-live="polite">Booking</span></p>
<button class="mk-b" type="button">Next</button>
<style>
.mk { margin: 0; text-align: center; font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.mk-m { display: inline-block; height: 1.25em; clip-path: inset(0 -0.25em); vertical-align: bottom; }
.mk-c > span { display: block; line-height: 1.25em; }
.mk-b { margin-top: 12px; padding: 12px 18px; border: 0; border-radius: var(--round); background: var(--inset); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), col = document.querySelector(".mk-c"), live = document.querySelector(".mk .sr"), at = settle.track(0, R.pop);
let i = 0;
document.querySelector(".mk-b").addEventListener("click", () => {
  i = (i + 1) % col.children.length;
  at.set(i, settle.now());
  live.textContent = col.children[i].textContent;
});
(function draw() { col.style.transform = `translateY(${-at.value(settle.now()) * 1.25}em)`; requestAnimationFrame(draw); })();
</script>
```

## Typing

Appears. A line types out after a solid caret in quick bursts with pauses at spaces and stops. The cursor blinks a few times once the line is done and then goes; a cursor that blinks forever is an attention loop.

```html recipe
<p class="ty"><span class="sr">What did you make this year?</span><span aria-hidden="true"><span class="ty-t"></span><i class="ty-c"></i></span></p>
<style>
.ty { margin: 0; min-height: 1.4em; font-size: 24px; font-weight: 500; }
.ty-c { display: inline-block; width: 0.5em; height: 1em; margin-left: 2px; vertical-align: -0.12em; background: var(--ink); }
</style>
<script type="module">
const line = document.querySelector(".ty .sr").textContent, times = settle.typeTimes(line, { rate: 16 }), end = times[times.length - 1];
const text = document.querySelector(".ty-t"), cursor = document.querySelector(".ty-c"), t0 = settle.now() + 0.4;
(function draw() {
  const t = settle.now() - t0, n = settle.calm ? line.length : times.filter((s) => s <= t).length;
  text.textContent = line.slice(0, n);
  cursor.style.opacity = !settle.calm && (t < end || (t - end < 1.6 && Math.floor((t - end) * 2.5) % 2 === 0)) ? 1 : 0;
  requestAnimationFrame(draw);
})();
</script>
```

## Letters on a beat

Appears. A word lands a letter at a time, one per eighth note at 120 BPM (the 0.25 s grid); Again waits for the next beat.

```html recipe
<p class="lb"><span class="sr">Gathering</span><span aria-hidden="true">Gathering</span></p>
<button class="lb-b" type="button">Again</button>
<style>
.lb { margin: 0; font-size: 44px; font-weight: 700; letter-spacing: -0.03em; }
.lb i { display: inline-block; font-style: normal; }
.lb-b { margin-top: 8px; padding: 12px 18px; border: 0; background: none; color: var(--muted); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), word = document.querySelector(".lb [aria-hidden]"), BEAT = 0.25;
word.innerHTML = [...word.textContent].map((c) => `<i>${c}</i>`).join("");
const letters = [...word.children];
let t0 = settle.now() + 0.25;
document.querySelector(".lb-b").addEventListener("click", () => (t0 = Math.ceil(settle.now() / BEAT) * BEAT));
(function draw() {
  const t = settle.now();
  letters.forEach((el, i) => {
    const a = t - t0 - i * BEAT;
    el.style.opacity = settle.move(a, R.fade, 0, 1);
    el.style.transform = `translateY(${settle.move(a, R.pop, 0.25, 0)}em)`;
  });
  requestAnimationFrame(draw);
})();
</script>
```

## Blur swap

Swaps content. A label changes through a short blur: the old one leaves first and the new one follows, so the two never show at once.

```html recipe
<button class="bs" type="button" aria-pressed="false"><span>Follow</span><span aria-hidden="true">Following</span></button>
<style>
.bs { position: relative; width: 148px; height: 48px; border: 0; border-radius: var(--round); background: var(--ink); color: var(--on-ink); font-weight: 600; cursor: pointer; }
.bs span { position: absolute; inset: 0; display: grid; place-items: center; }
</style>
<script type="module">
const R = settle.register(), b = document.querySelector(".bs"), [a, z] = b.children, p = settle.track(0, settle.calm ? R.fade : R.pop);
b.addEventListener("click", () => {
  const on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", on);
  p.set(+on, settle.now());
});
(function draw() {
  const s = settle.blurSwap(Math.min(1, Math.max(0, p.value(settle.now()))));
  for (const [el, o] of [[a, s.out], [z, s.in]]) {
    el.style.opacity = o.opacity;
    settle.blur(el, o.blur);
  }
  requestAnimationFrame(draw);
})();
</script>
```

## Morph

Grows into something else. One shape springs its real width, height and radius from a pill to a card; each state's content sits at its final size inside the shape and swaps through a blur. A click outside or Escape folds it back, and keyboard focus follows the state while a pointer leaves focus alone.

```html recipe
<div class="mo"><button class="mo-p" type="button" aria-expanded="false">Book a table</button><div class="mo-c" inert><b>Osteria Lume</b><span>Friday 23 October, 19:30, 4 guests</span><button class="mo-x" type="button">Done</button></div></div>
<style>
.mo { position: relative; width: 184px; height: 52px; overflow: hidden; background: var(--ink); color: var(--on-ink); box-shadow: var(--shadow); }
.mo > * { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
.mo-p { width: 184px; height: 52px; border: 0; background: none; font-weight: 600; cursor: pointer; }
.mo-c { width: 300px; height: 176px; padding: 22px; display: grid; align-content: start; gap: 4px; }
.mo-x { justify-self: start; margin-top: 14px; padding: 12px 18px; border: 0; border-radius: var(--round); background: var(--on-ink); color: var(--ink); font-weight: 600; cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), box = document.querySelector(".mo"), [pill, card] = box.children, css = getComputedStyle(box);
const round = Math.min(26, parseFloat(css.getPropertyValue("--round"))), radius = Math.min(88, parseFloat(css.getPropertyValue("--radius")));
const W = settle.track(184), H = settle.track(52), Rd = settle.track(round), C = settle.track(0, settle.calm ? R.fade : R.pop);
let open = false;
function set(v, e) {
  if (v === open) return;
  const t = settle.now(), P = (open = v) ? R.morph : R.fold;
  W.set(v ? 300 : 184, t, P); H.set(v ? 176 : 52, t, P); Rd.set(v ? radius : round, t, P); C.set(+v, t);
  pill.inert = v; card.inert = !v; pill.setAttribute("aria-expanded", v);
  if (e && !e.detail) (v ? card.querySelector("button") : pill).focus();
}
pill.addEventListener("click", (e) => set(true, e)); card.querySelector("button").addEventListener("click", (e) => set(false, e));
addEventListener("pointerdown", (e) => { if (!box.contains(e.target)) set(false); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); pill.focus(); } });
(function draw() {
  const t = settle.now(), w = W.value(t), h = H.value(t), s = settle.blurSwap(Math.min(1, Math.max(0, C.value(t))));
  Object.assign(box.style, { width: w + "px", height: h + "px", borderRadius: Math.min(Rd.value(t), h / 2, w / 2) + "px" });
  for (const [el, o] of [[pill, s.out], [card, s.in]]) { el.style.opacity = o.opacity; settle.blur(el, o.blur); }
  requestAnimationFrame(draw);
})();
</script>
```

## Iris

Grows into something else. A picture opens from the control that called it, inside a growing circle. The picture sits at its resting place from the first frame and only the circle grows, while the picture eases from 1.04 to 1. With no photo, the picture is drawn in code (`references/directions.md`, Pictures): here a street plan.

```html recipe
<div class="ir"><svg class="ir-s" viewBox="0 0 300 200" aria-hidden="true"><rect width="300" height="200" class="ir-field"/><path d="M0 132 H300 M188 0 V200" class="ir-road"/><circle cx="188" cy="132" r="12" class="ir-pin"/></svg><button class="ir-k" type="button" aria-pressed="false" aria-label="Open the picture">Open</button></div>
<style>
.ir { position: relative; width: min(300px, 100%); aspect-ratio: 3 / 2; overflow: hidden; border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow); }
.ir-s { position: absolute; inset: 0; width: 100%; height: 100%; } .ir-field { fill: var(--inset); } .ir-road { fill: none; stroke: var(--surface); stroke-width: 18; } .ir-pin { fill: var(--accent); }
.ir-k { position: absolute; left: 16px; bottom: 16px; width: 56px; height: 56px; border: 0; border-radius: var(--round); background: var(--ink); color: var(--on-ink); font-weight: 600; font-variant-numeric: tabular-nums; cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), box = document.querySelector(".ir"), pic = box.firstElementChild, knob = box.querySelector(".ir-k"), o = settle.track(0, R.morph);
let geo;
const measure = () => {
  const b = box.getBoundingClientRect(), k = knob.getBoundingClientRect(), x = k.left - b.left + k.width / 2, y = k.top - b.top + k.height / 2;
  geo = { x, y, far: Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y)) };
};
measure(); addEventListener("resize", measure);
knob.addEventListener("click", () => {
  const on = knob.getAttribute("aria-pressed") !== "true";
  knob.setAttribute("aria-pressed", on);
  o.set(+on, settle.now());
});
(function draw() {
  const u = Math.max(0, o.value(settle.now()));
  pic.style.clipPath = `circle(${settle.flood(u, geo.far)}px at ${geo.x}px ${geo.y}px)`;
  pic.style.transform = `scale(${1.04 - 0.04 * Math.min(1, u)})`;
  requestAnimationFrame(draw);
})();
</script>
```

## Flood

Grows into something else. A new colour fills the whole card, spreading from the control that set it off. `settle.flood()` sizes the radius by √progress, so the covered area grows at a steady rate. The flood eases in and is complete before the next state can be read.

```html recipe
<div class="fd"><div class="fd-a"><b>Flat white</b><span>Monmouth Coffee</span><button type="button">Pay £3.60</button></div><div class="fd-z" inert><b>Paid £3.60</b><span>Monmouth Coffee</span><button type="button">Done</button></div></div>
<style>
.fd { position: relative; width: min(300px, 100%); height: 180px; overflow: hidden; border-radius: var(--radius); box-shadow: var(--shadow); }
.fd > div { position: absolute; inset: 0; padding: 20px; display: grid; align-content: start; gap: 2px; }
.fd-a { background: var(--surface); } .fd-a span { color: var(--muted); } .fd-z { background: var(--accent); color: var(--on-accent); }
.fd button { position: absolute; left: 20px; right: 20px; bottom: 20px; height: 48px; border: 0; border-radius: var(--round); font-weight: 600; cursor: pointer; }
.fd-a button { background: var(--ink); color: var(--on-ink); } .fd-z button { background: var(--on-accent); color: var(--accent); }
</style>
<script type="module">
const R = settle.register(), [a, z] = document.querySelectorAll(".fd > div"), pay = a.querySelector("button"), done = z.querySelector("button"), f = settle.track(0, R.fade);
let geo;
const measure = () => {
  const p = pay.getBoundingClientRect(), b = a.getBoundingClientRect(), x = p.left - b.left + p.width / 2, y = p.top - b.top + p.height / 2;
  geo = { x, y, far: Math.hypot(Math.max(x, b.width - x), Math.max(y, b.height - y)) };
};
measure(); addEventListener("resize", measure);
function go(on, e) {
  f.set(+on, settle.now()); z.inert = !on; a.inert = on;
  if (!e.detail) (on ? done : pay).focus();
}
pay.addEventListener("click", (e) => go(true, e)); done.addEventListener("click", (e) => go(false, e));
(function draw() {
  z.style.clipPath = `circle(${settle.flood(f.value(settle.now()), geo.far)}px at ${geo.x}px ${geo.y}px)`;
  requestAnimationFrame(draw);
})();
</script>
```

## Pixel morph

Grows into something else. A picture built in code from a 16 by 16 grid of raised tiles, their darker sides facing down and right and a soft shadow under the whole picture, turns into another tile by tile: every cell glides to its new place and colour after a small delay of its own.

```html recipe
<canvas class="px" width="320" height="224" role="img" aria-label="A pixel heart that turns into a star, cell by cell"></canvas>
<button class="px-b" type="button">Morph</button>
<style>.px { width: 160px; height: 112px; } .px-b { margin-top: 10px; padding: 12px 18px; border: 0; border-radius: var(--round); background: var(--inset); cursor: pointer; }</style>
<script type="module">
const R = settle.register(), g = document.querySelector(".px").getContext("2d"), css = getComputedStyle(document.body), S = 12;
const C = { a: css.getPropertyValue("--accent").trim(), i: css.getPropertyValue("--ink").trim() };
const sprite = (rows) => rows.split("/").flatMap((r, y) => [...r].map((c, x) => c !== "." && { x, y, c: C[c] })).filter(Boolean);
const A = sprite("................/..aaaa....aaaa../.aaaaaa..aaaaaa./aaaaaaaaaaaaaaaa/aaaaaaaaaaaaaaaa/aaaaaaaaaaaaaaaa/.aaaaaaaaaaaaaa./..aaaaaaaaaaaa../...aaaaaaaaaa.../....aaaaaaaa..../.....aaaaaa...../......aaaa....../.......aa.......");
const B = sprite(".......ii......./.......ii......./......iiii....../......iiii....../iiiiiiiiiiiiiiii/.iiiiiiiiiiiiii./..iiiiiiiiiiii../...iiiiiiiiii.../...iiiiiiiiii.../..iiiiiiiiiiii../..iiiii..iiiii../.iiii......iiii./.iii........iii./ii............ii");
const cells = Array.from({ length: Math.max(A.length, B.length) }, (_, k) => [A[k] ? { ...A[k], o: 1 } : { ...B[k], o: 0 }, B[k] ? { ...B[k], o: 1 } : { ...A[k], o: 0 }]);
const u = cells.map(() => settle.track(0, R.morph)), wait = (k) => (((k * 7919) % 97) / 97) * 0.3;
let to = 0;
document.querySelector(".px-b").addEventListener("click", () => { const t = settle.now(); to = 1 - to; u.forEach((tr, k) => tr.set(to, t + wait(k))); });
function pass(t, shade) {   // all extrusions first, then all faces
  cells.forEach(([a, b], k) => {
    const v = Math.min(1, Math.max(0, u[k].value(t))), x = 64 + S * (a.x + (b.x - a.x) * v) + (shade ? 3 : 0), y = 8 + S * (a.y + (b.y - a.y) * v) + (shade ? 3 : 0);
    for (const [c, o] of [[a.c, (1 - v) * a.o], [b.c, v * b.o]]) { g.globalAlpha = o; g.fillStyle = c; g.fillRect(x, y, S, S); if (shade) { g.fillStyle = "rgb(0 0 0 / 0.4)"; g.fillRect(x, y, S, S); } }
  });
}
(function draw() {
  const t = settle.now(); g.globalAlpha = 1; g.clearRect(0, 0, 320, 224);
  g.fillStyle = "rgb(0 0 0 / 0.12)"; g.beginPath(); g.ellipse(160, 206, 84, 7, 0, 0, 7); g.fill();
  pass(t, true); pass(t, false); requestAnimationFrame(draw);
})();
</script>
```

## Stretch

Changes the selection. A moving indicator's front edge rides a faster spring than its back edge, so it stretches and then settles, and each label takes the indicator's colours exactly where it covers the label. Layout is read at load, again when the web font arrives and on resize, and each read is applied to the indicator again. It is never read in the frame loop.

```html recipe
<div class="sg" role="tablist" aria-label="Period"><i class="sg-i"></i><button role="tab" aria-selected="true">Day</button><button role="tab" aria-selected="false" tabindex="-1">Week</button><button role="tab" aria-selected="false" tabindex="-1">Month</button></div>
<style>
.sg { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); width: min(300px, 100%); padding: 4px; background: var(--surface); border-radius: var(--round); box-shadow: var(--shadow); }
.sg button { position: relative; height: 44px; border: 0; border-radius: var(--round); background: none; font-weight: 600; cursor: pointer; }
.sg-i { position: absolute; top: 4px; left: 0; height: 44px; border-radius: var(--round); background: var(--ink); }
</style>
<script type="module">
const tabs = [...document.querySelectorAll(".sg button")], ind = document.querySelector(".sg-i");
let box = [], sel = 0; const measure = () => (box = tabs.map((b) => [b.offsetLeft, b.offsetLeft + b.offsetWidth])); measure(); // never per frame
const s = settle.stretch(...box[0]), again = () => { measure(); s.set(...box[sel], settle.now()); };
addEventListener("resize", again); document.fonts.ready.then(again); // the web font changes the label widths
function pick(i, focus) {
  sel = i; s.set(...box[i], settle.now());
  tabs.forEach((b, j) => { b.setAttribute("aria-selected", j === i); b.tabIndex = j === i ? 0 : -1; });
  if (focus) tabs[i].focus();
}
tabs.forEach((b, i) => {
  b.addEventListener("click", () => pick(i));
  b.addEventListener("keydown", (e) => { const j = { ArrowRight: (i + 1) % 3, ArrowLeft: (i + 2) % 3, Home: 0, End: 2 }[e.key]; if (j !== undefined) { e.preventDefault(); pick(j, true); } });
});
(function draw() {
  const [l, r] = s.value(settle.now());
  ind.style.transform = `translateX(${l}px)`; ind.style.width = r - l + "px";
  tabs.forEach((b, i) => { const [a, z] = box[i], over = Math.max(0, Math.min(r, z) - Math.max(l, a)) / (z - a); b.style.color = `color-mix(in srgb, var(--on-ink) ${over * 100}%, var(--ink))`; });
  requestAnimationFrame(draw);
})();
</script>
```

## Toggle

Changes the selection. A switch's knob squeezes on press and stretches as it crosses, front edge first; its track's colour tweens with no overshoot. It flips on `click`, so every input method works, and an invisible margin makes it a 44 px target.

```html recipe
<button class="sw" type="button" role="switch" aria-checked="false" aria-label="Wi-Fi"><i class="sw-k"></i></button>
<style>
.sw { position: relative; width: 64px; height: 36px; padding: 0; border: 0; border-radius: var(--round); cursor: pointer; touch-action: manipulation; }
.sw::before { content: ""; position: absolute; inset: -4px; }
.sw-k { position: absolute; top: 4px; left: 0; height: 28px; border-radius: var(--round); background: var(--ground); box-shadow: var(--shadow); }
</style>
<script type="module">
const R = settle.register(), sw = document.querySelector(".sw"), knob = sw.firstElementChild;
const REST = [[4, 32], [32, 60]], k = settle.stretch(...REST[0]), tint = settle.track(0, R.fade);
let on = false;
const rest = () => k.set(...REST[+on], settle.now());
sw.addEventListener("pointerdown", () => { const [a, b] = REST[+on]; k.set(on ? a + 5 : a, on ? b : b - 5, settle.now()); });
for (const e of ["pointerup", "pointercancel", "pointerleave"]) sw.addEventListener(e, rest);
sw.addEventListener("click", () => { on = !on; sw.setAttribute("aria-checked", on); tint.set(+on, settle.now()); rest(); });
(function draw() {
  const t = settle.now(), [l, r] = k.value(t), u = Math.min(1, Math.max(0, tint.value(t)));
  knob.style.transform = `translateX(${l}px)`; knob.style.width = r - l + "px";
  sw.style.background = `color-mix(in srgb, var(--accent) ${u * 100}%, var(--muted))`;
  requestAnimationFrame(draw);
})();
</script>
```

## Range

Changes a value. Two handles on one track: each follows its own pointer, so two fingers each move one handle. The two values may meet one step apart; the handles never cross and may overlap there. A handle draws small, a slim grip, with a 44 px target around it. When a press lands where both handles are in reach, the first sideways move decides: left moves the low handle, right the high one, and the handle moved last sits on top. A press on the track brings the nearest handle there. On release a handle springs to its step at the hand's speed. Under a histogram, the track sits below the bars' baseline with a gap larger than half the grip's height, so no handle covers a bar.

```html recipe
<div class="rg"><p class="rg-h">Price <span class="rg-v"></span></p><div class="rg-t"><i class="rg-f"></i><b role="slider" tabindex="0" aria-label="Minimum price" aria-valuemin="0" aria-valuemax="480"></b><b role="slider" tabindex="0" aria-label="Maximum price" aria-valuemin="0" aria-valuemax="480"></b></div></div>
<style>
.rg { width: min(300px, 100%); padding: 18px 20px 10px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.rg-h { margin: 0; display: flex; justify-content: space-between; font-weight: 600; font-variant-numeric: tabular-nums; } .rg-t { position: relative; height: 44px; touch-action: none; cursor: pointer; }
.rg-t::before, .rg-f { content: ""; position: absolute; left: 0; right: 0; top: 20px; height: 4px; border-radius: var(--round); background: var(--inset); } .rg-f { right: auto; background: var(--ink); }
.rg b { position: absolute; top: 10px; left: 0; width: 12px; height: 24px; border-radius: var(--round); background: var(--ink); } .rg b::before { content: ""; position: absolute; inset: -10px -16px; }
</style>
<script type="module">
const R = settle.register(), tr = document.querySelector(".rg-t"), hs = [...tr.querySelectorAll("b")], fill = tr.querySelector(".rg-f"), out = document.querySelector(".rg-v");
const MAX = 480, STEP = 10, val = [60, 220], pos = val.map((n) => settle.track(n, R.morph)), hand = [null, null], grab = [0, 0]; let pend = null;
const span = () => Math.max(1, tr.clientWidth - 12), toX = (n) => (n / MAX) * span(), toV = (e) => ((e.clientX - tr.getBoundingClientRect().left - 6) / span()) * MAX;
const lim = (i) => (i ? [val[0] + STEP, MAX] : [0, val[1] - STEP]);
function put(i, to, held) {
  const t = settle.now(), [a, b] = lim(i), c = Math.min(b, Math.max(a, to));
  val[i] = Math.round(c / STEP) * STEP; held ? pos[i].hold(c, t) : pos[i].set(val[i], t);
  hs[i].setAttribute("aria-valuenow", val[i]); hs[i].setAttribute("aria-valuetext", `£${val[i]}`); out.textContent = `£${val[0]} to £${val[1]}`;
}
function take(i, id, at, g) { if (hand[i] !== null) return; hand[i] = id; grab[i] = g; hs[i].style.zIndex = 1; hs[1 - i].style.zIndex = 0; put(i, at + g, true); }
tr.addEventListener("pointerdown", (e) => {
  const at = toV(e), t = settle.now(), near = [0, 1].filter((j) => Math.abs(toX(pos[j].value(t)) - toX(at)) <= 22);
  tr.setPointerCapture(e.pointerId);
  if (near.length === 2) pend = { id: e.pointerId, x: e.clientX, at }; // both in reach: the first sideways move picks
  else { const i = near.length ? near[0] : Math.abs(at - val[0]) <= Math.abs(at - val[1]) ? 0 : 1; take(i, e.pointerId, at, near.length ? pos[i].value(t) - at : 0); }
});
tr.addEventListener("pointermove", (e) => {
  if (pend && pend.id === e.pointerId && Math.abs(e.clientX - pend.x) > 3) { const i = e.clientX < pend.x ? 0 : 1, p = pend; pend = null; take(i, p.id, p.at, pos[i].value(settle.now()) - p.at); }
  const i = hand.indexOf(e.pointerId); if (i >= 0) put(i, toV(e) + grab[i], true);
});
for (const ev of ["pointerup", "pointercancel"]) tr.addEventListener(ev, (e) => { if (pend && pend.id === e.pointerId) pend = null; const i = hand.indexOf(e.pointerId); if (i >= 0) { hand[i] = null; pos[i].release(settle.now(), val[i]); } });
hs.forEach((h, i) => h.addEventListener("keydown", (e) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key], [a, b] = lim(i), to = d ? val[i] + d * STEP : { Home: a, End: b }[e.key]; if (to !== undefined) { e.preventDefault(); put(i, to, false); } }));
put(0, 60, false); put(1, 220, false);
(function draw() {
  const t = settle.now(), a = toX(pos[0].value(t)), b = toX(pos[1].value(t));
  hs[0].style.transform = `translateX(${a}px)`; hs[1].style.transform = `translateX(${b}px)`; fill.style.left = a + 6 + "px"; fill.style.width = b - a + "px"; requestAnimationFrame(draw);
})();
</script>
```

## Volume

Follows the hand. The value sits exactly under the pointer; pulled past either end, the whole pill stretches like rubber, since it is an object that can stretch; let go, and it returns on a spring that starts at the hand's speed.

```html recipe
<div class="vo" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60" aria-valuetext="60%"><i class="vo-f"></i></div>
<style>
.vo { position: relative; width: 260px; height: 44px; overflow: hidden; border-radius: var(--round); background: var(--inset); touch-action: none; cursor: pointer; }
.vo-f { position: absolute; left: 0; top: 0; bottom: 0; background: var(--ink); }
</style>
<script type="module">
const R = settle.register(), vo = document.querySelector(".vo"), fill = vo.firstElementChild, W = vo.offsetWidth;
const level = settle.track(0.6, R.morph), give = settle.track(0, R.throw);
let hand = null, x0 = 0;
const say = () => { const p = Math.round(level.target * 100); vo.setAttribute("aria-valuenow", p); vo.setAttribute("aria-valuetext", p + "%"); };
function follow(e) {
  const t = settle.now(), x = e.clientX - x0, over = x < 0 ? x : x > W ? x - W : 0;
  level.hold(Math.min(1, Math.max(0, x / W)), t); give.hold(settle.rubber(over, 40), t); say();
}
vo.addEventListener("pointerdown", (e) => { if (hand !== null) return; hand = e.pointerId; x0 = vo.getBoundingClientRect().left - Math.min(0, give.value(settle.now())); vo.setPointerCapture(hand); follow(e); });
vo.addEventListener("pointermove", (e) => { if (e.pointerId === hand) follow(e); });
for (const ev of ["pointerup", "pointercancel"]) vo.addEventListener(ev, (e) => { if (e.pointerId !== hand) return; hand = null; const t = settle.now(); level.release(t, level.target); give.release(t, 0); });
vo.addEventListener("keydown", (e) => {
  const d = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05 }[e.key], to = d ? level.target + d : { Home: 0, End: 1 }[e.key];
  if (to !== undefined) { e.preventDefault(); level.set(Math.round(Math.min(1, Math.max(0, to)) * 100) / 100, settle.now()); say(); }
});
(function draw() {
  const t = settle.now(), g = give.value(t), l = Math.min(1, Math.max(0, level.value(t)));
  vo.style.width = W + Math.abs(g) + "px"; vo.style.translate = `${g / 2}px 0`;   // the far edge stays put
  fill.style.width = l * W + (l > 0.999 && g > 0 ? g : 0) + "px";
  requestAnimationFrame(draw);
})();
</script>
```

## Throw

Follows the hand. A card follows the finger exactly; on release it leaves at the hand's speed when the flick is fast enough or the card is past 40 % of its width, and otherwise springs home. Delete does the same from the keyboard.

```html recipe
<div class="th" tabindex="0" role="group" aria-label="Card payment £3.60, Monmouth Coffee. Swipe away or press Delete." aria-keyshortcuts="Delete"><b>Card payment £3.60</b><span>Monmouth Coffee, Borough</span></div>
<button class="th-b" type="button" style="visibility: hidden">Bring it back</button>
<style>
.th { width: min(300px, 100%); padding: 16px 18px; display: grid; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); touch-action: pan-y; cursor: grab; -webkit-user-select: none; user-select: none; }
.th span { color: var(--muted); font-size: 13px; }
.th-b { margin-top: 12px; padding: 12px 16px; border: 0; background: none; color: var(--muted); cursor: pointer; }
html, body { overflow-x: clip; } /* a card thrown off the side must not widen the page */
</style>
<script type="module">
const R = settle.register(), card = document.querySelector(".th"), back = document.querySelector(".th-b"), x = settle.track(0, R.throw), W = card.offsetWidth;
let hand = null;
function away(dir, t, byKey) { x.release(t, dir * (W + 80)); card.inert = true; back.style.visibility = ""; if (byKey) back.focus(); }   // the button's room is kept, so nothing shifts
card.addEventListener("pointerdown", (e) => { if (hand) return; const t = settle.now(); hand = { id: e.pointerId, dx: e.clientX - x.value(t) }; card.setPointerCapture(e.pointerId); x.hold(x.value(t), t); });
card.addEventListener("pointermove", (e) => { if (hand?.id === e.pointerId) x.hold(e.clientX - hand.dx, settle.now()); });
for (const ev of ["pointerup", "pointercancel"]) card.addEventListener(ev, (e) => {
  if (hand?.id !== e.pointerId) return;
  hand = null; const t = settle.now(), v = x.velocity(t), p = x.value(t);
  if (e.type === "pointerup" && (Math.abs(p) > 0.4 * W || Math.abs(v) > 600)) away(Math.sign(Math.abs(v) > 600 ? v : p), t); else x.release(t, 0);
});
card.addEventListener("keydown", (e) => { if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); away(1, settle.now(), true); } });
back.addEventListener("click", (e) => { x.set(0, settle.now()); card.inert = false; back.style.visibility = "hidden"; if (!e.detail) card.focus(); });
(function draw() {
  const p = x.value(settle.now());
  card.style.transform = `translateX(${p}px)`; card.style.opacity = 1 - Math.min(1, Math.abs(p) / (W + 80));
  requestAnimationFrame(draw);
})();
</script>
```

## Reorder

Moves or reorders. A row lifts to the hand by its grip and the others close the gap on springs; let go, it springs into its slot at the hand's speed. The arrow keys move a row one place, and the page order follows the screen order so Tab still walks the list top to bottom. A click that ends no drag lifts the row and a second click, Escape or leaving drops it, so a screen reader that sends click can start a move.

```html recipe
<ol class="rq" aria-label="Up next"><li><span>Harbour Lights</span><button class="rq-g" type="button" aria-pressed="false" aria-label="Move Harbour Lights">≡</button></li><li><span>Slow Weather</span><button class="rq-g" type="button" aria-pressed="false" aria-label="Move Slow Weather">≡</button></li><li><span>Glass Orchard</span><button class="rq-g" type="button" aria-pressed="false" aria-label="Move Glass Orchard">≡</button></li><li><span>Night Bus Home</span><button class="rq-g" type="button" aria-pressed="false" aria-label="Move Night Bus Home">≡</button></li></ol>
<p class="sr" aria-live="polite"></p>
<style>
.rq { position: relative; width: min(300px, 100%); height: 220px; margin: 0; padding: 0; list-style: none; }
.rq li { position: absolute; left: 0; right: 0; top: 0; height: 52px; display: flex; align-items: center; justify-content: space-between; padding-left: 16px; background: var(--surface); border-radius: calc(var(--radius) / 2); box-shadow: var(--shadow); }
.rq-g { width: 44px; height: 44px; border: 0; background: none; color: var(--muted); font-size: 20px; cursor: grab; touch-action: none; }
</style>
<script type="module">
const R = settle.register(), list = document.querySelector(".rq"), rows = [...list.children], live = document.querySelector(".rq + .sr"), H = 56;
const ys = rows.map((_, i) => settle.track(i * H, R.morph)), lift = rows.map(() => settle.track(0, R.pop)), grips = rows.map((r) => r.querySelector("button"));
let order = rows.slice(), held = null, picked = -1, dragged = -1;
const say = (r, what = "", then = "") => (live.textContent = `${r.firstChild.textContent}${what}, ${order.indexOf(r) + 1} of ${rows.length}${then}`);
function place(r, k) { order.splice(order.indexOf(r), 1); order.splice(k, 0, r); order.forEach((o, s) => o !== held?.row && ys[rows.indexOf(o)].set(s * H, settle.now())); say(r); }
// the lift a click gives, for the arrow keys; -1 drops it
function pick(k) { const t = settle.now(); if (picked !== -1) { lift[picked].set(0, t); grips[picked].setAttribute("aria-pressed", "false"); } picked = k; if (k !== -1) { lift[k].set(1, t); grips[k].setAttribute("aria-pressed", "true"); } }
rows.forEach((r, i) => {
  const g = grips[i];
  g.addEventListener("pointerdown", (e) => { if (held) return; if (picked !== i) pick(-1); const t = settle.now(); held = { row: r, id: e.pointerId, dy: e.clientY - ys[i].value(t), y0: e.clientY }; g.setPointerCapture(e.pointerId); ys[i].hold(ys[i].value(t), t); lift[i].set(1, t); });
  g.addEventListener("pointermove", (e) => { if (held?.id !== e.pointerId) return; held.moved ||= Math.abs(e.clientY - held.y0) > 4; const y = Math.min((rows.length - 1) * H, Math.max(0, e.clientY - held.dy)); ys[i].hold(y, settle.now()); if (Math.round(y / H) !== order.indexOf(r)) place(r, Math.round(y / H)); });
  // a mouse fires click right after a drag ends; the timeout clears the mark before any later click. Only a drag
  // re-appends the rows: moving the pressed grip out of the page sends its click to the list instead
  for (const ev of ["pointerup", "pointercancel"]) g.addEventListener(ev, (e) => { if (held?.id !== e.pointerId) return; const moved = held.moved; if (moved) { dragged = i; setTimeout(() => (dragged = -1)); if (picked === i) pick(-1); } held = null; const t = settle.now(); ys[i].release(t, order.indexOf(r) * H); lift[i].set(0, t); if (moved) list.append(...order); });
  // focus first: Safari leaves a clicked button unfocused, and the arrow keys need it
  g.addEventListener("click", () => { if (dragged === i) return; g.focus(); pick(picked === i ? -1 : i); picked === i ? say(r, " lifted", ". The arrow keys move it.") : say(r, " dropped"); });
  // a key move re-appends the rows and takes focus back, so only a focus that stays away drops the lift
  g.addEventListener("blur", () => setTimeout(() => { if (picked === i && document.activeElement !== g) { pick(-1); say(r, " dropped"); } }));
  g.addEventListener("keydown", (e) => { if (e.key === "Escape" && picked === i) { pick(-1); return say(r, " dropped"); } const d = { ArrowUp: -1, ArrowDown: 1 }[e.key]; if (!d || held) return; e.preventDefault(); place(r, Math.min(rows.length - 1, Math.max(0, order.indexOf(r) + d))); list.append(...order); g.focus(); });
});
(function draw() {
  const t = settle.now();
  rows.forEach((r, i) => { const l = Math.max(0, lift[i].value(t)); r.style.transform = `translateY(${ys[i].value(t)}px) scale(${1 + 0.03 * l})`; r.style.zIndex = l > 0.01 ? 2 : 1; r.style.boxShadow = l > 0.5 ? "var(--shadow-lift)" : ""; });
  requestAnimationFrame(draw);
})();
</script>
```

## List filter

Moves or reorders. Typing filters a list: rows that leave blur away and the rest close the gap. Each row answers the pointer across its whole width, a press keeps focus in the field so the arrow keys keep working, and the field is 16 px so phones don't zoom into it.

```html recipe
<div class="lf"><input class="lf-q" type="text" role="combobox" aria-expanded="true" aria-controls="lf-l" aria-autocomplete="list" aria-label="Type a command" placeholder="Type a command…" autocomplete="off"><ul class="lf-l" id="lf-l" role="listbox" aria-label="Commands"><li role="option" id="o0">New note</li><li role="option" id="o1">Export as PDF</li><li role="option" id="o2">Word count</li><li role="option" id="o3">Focus mode</li><li role="option" id="o4">Share link</li></ul><p class="sr" aria-live="polite"></p></div>
<style>
.lf { width: min(300px, 100%); padding: 8px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.lf-q { width: 100%; height: 44px; padding: 0 12px; border: 0; background: none; font-size: 16px; outline-offset: -2px; }
.lf-l { position: relative; height: 220px; margin: 0; padding: 0; list-style: none; }
.lf-l li { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 12px; display: flex; align-items: center; border-radius: calc(var(--radius) / 2); cursor: pointer; }
.lf-l li[aria-selected="true"] { background: var(--inset); }
</style>
<script type="module">
const R = settle.register(), q = document.querySelector(".lf-q"), rows = [...document.querySelectorAll(".lf-l li")], live = document.querySelector(".lf .sr");
const ys = rows.map((_, i) => settle.track(i * 44, R.morph)), shown = rows.map(() => settle.track(1, R.fade)); let list = rows.slice(), active = 0;
const mark = () => { rows.forEach((r) => r.setAttribute("aria-selected", r === list[active])); q.setAttribute("aria-activedescendant", list[active]?.id || ""); };
const pick = (r) => { if (r) live.textContent = `${r.textContent} picked`; };
q.addEventListener("input", () => {
  const s = q.value.trim().toLowerCase(), t = settle.now(); list = rows.filter((r) => r.textContent.toLowerCase().includes(s)); active = 0;
  rows.forEach((r, i) => { const k = list.indexOf(r); shown[i].set(k < 0 ? 0 : 1, t); if (k >= 0) ys[i].set(k * 44, t); }); mark(); // leavers blur away, the rest close the gap
});
q.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : list.length - 1)) % Math.max(1, list.length); mark(); } else if (e.key === "Enter") pick(list[active]);
});
rows.forEach((r) => {
  r.addEventListener("pointerdown", (e) => e.preventDefault()); // a press keeps focus in the field
  r.addEventListener("pointermove", () => { const k = list.indexOf(r); if (k >= 0 && k !== active) { active = k; mark(); } });
  r.addEventListener("click", () => pick(list.includes(r) ? r : null));
}); mark();
(function draw() {
  const t = settle.now(); rows.forEach((r, i) => { const o = Math.min(1, Math.max(0, shown[i].value(t))); r.style.transform = `translateY(${ys[i].value(t)}px)`; r.style.opacity = o; settle.blur(r, (1 - o) * 6); r.style.pointerEvents = o > 0.5 ? "" : "none"; });
  requestAnimationFrame(draw);
})();
</script>
```

## Ticker

Changes a value. A big number rolls digit by digit in tabular figures: only the columns that change turn, and they come to rest from left to right. Each window clips its strip at the top and bottom only, so a figure tightened past its window keeps its edges. The digit strips are hidden from screen readers and the value is given as text.

```html recipe
<p class="tk"><span class="tk-n" aria-hidden="true"></span><span class="sr" aria-live="polite"></span><small>views this month</small></p>
<button class="tk-b" type="button">Add a day</button>
<style>
.tk { margin: 0; display: grid; justify-items: center; } .tk small { color: var(--muted); font-size: 13px; }
.tk-n { display: flex; font-size: 56px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; font-variant-numeric: tabular-nums; }
.tk-n span { height: 1em; clip-path: inset(0 -0.25em); } .tk-n b { display: block; font-weight: inherit; } .tk-n i, .tk-n em { display: block; height: 1em; font-style: normal; }
.tk-b { margin-top: 12px; padding: 12px 18px; border: 0; border-radius: var(--round); background: var(--inset); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), el = document.querySelector(".tk-n"), live = document.querySelector(".tk .sr"), P = 5;
el.innerHTML = Array.from({ length: P }, (_, k) => (k && (P - k) % 3 === 0 ? "<em>,</em>" : "") + `<span><b>${"01234567890".replace(/./g, "<i>$&</i>")}</b></span>`).join("");
const wins = [...el.querySelectorAll("span")], total = settle.track(84320, R.count);
const say = () => (live.textContent = `${Math.round(total.target).toLocaleString("en")} views this month`);
document.querySelector(".tk-b").addEventListener("click", () => { total.set(total.target + 2875, settle.now()); say(); });
say();
(function draw() {
  const n = Math.max(0, total.value(settle.now()));
  settle.odometer(n, P).forEach((p, k) => {
    wins[k].firstChild.style.transform = `translateY(${-p}em)`;
    wins[k].style.display = k === P - 1 || n >= 10 ** (P - 1 - k) || p > 0.01 ? "" : "none";
  });
  requestAnimationFrame(draw);
})();
</script>
```

## Count-up

Changes a value. A smaller figure, such as a temperature, steps through whole values; a half-rolled digit at small sizes reads as a broken glyph.

```html recipe
<p class="cu"><span class="cu-n" aria-hidden="true">21°</span><span class="sr" aria-live="polite">21 degrees</span><small>Lisbon</small></p>
<button class="cu-b" type="button">Noon</button>
<style>
.cu { margin: 0; display: grid; justify-items: center; } .cu small { color: var(--muted); font-size: 13px; }
.cu-n { font-size: 40px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.cu-b { margin-top: 12px; padding: 12px 18px; border: 0; border-radius: var(--round); background: var(--inset); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), el = document.querySelector(".cu-n"), live = document.querySelector(".cu .sr"), deg = settle.track(21, R.count);
document.querySelector(".cu-b").addEventListener("click", (e) => {
  const to = deg.target === 21 ? 25 : 21;
  deg.set(to, settle.now()); live.textContent = `${to} degrees`; e.currentTarget.textContent = to === 21 ? "Noon" : "Morning";
});
(function draw() { el.textContent = `${Math.round(deg.value(settle.now()))}°`; requestAnimationFrame(draw); })();
</script>
```

## Bars

Updates its data. Switching the year retargets every bar mid-flight, one after another from the left; a bar keeps its speed when its target moves again.

```html recipe
<div class="ba"><div class="ba-y" role="radiogroup" aria-label="Year"><button role="radio" aria-checked="false" tabindex="-1">2024</button><button role="radio" aria-checked="true">2025</button></div><div class="ba-p" role="img"></div></div>
<style>
.ba { width: min(320px, 100%); padding: 16px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.ba-y { display: flex; gap: 4px; } .ba-y button { min-height: 44px; padding: 0 14px; border: 0; border-radius: var(--round); background: none; cursor: pointer; } .ba-y [aria-checked="true"] { background: var(--inset); }
.ba-p { display: grid; grid-template-columns: repeat(12, 1fr); align-items: end; gap: 4px; height: 140px; margin-top: 12px; } .ba-p i { background: var(--ink); border-radius: min(3px, var(--radius)) min(3px, var(--radius)) 0 0; }
</style>
<script type="module">
const R = settle.register(), plot = document.querySelector(".ba-p"), years = [...document.querySelectorAll(".ba-y button")];
const DATA = { 2024: [84, 121, 88, 52, 31, 14, 0, 3, 47, 92, 98, 113], 2025: [118, 96, 41, 77, 38, 9, 2, 6, 29, 104, 131, 61] };
plot.innerHTML = "<i></i>".repeat(12);
const bars = [...plot.children], hs = bars.map(() => settle.track(0, R.morph));
function pick(y, t = settle.now()) {
  hs.forEach((h, i) => h.set(DATA[y][i], t + settle.stagger(i, 0.02)));
  years.forEach((b) => { const on = b.textContent === String(y); b.setAttribute("aria-checked", on); b.tabIndex = on ? 0 : -1; });
  plot.setAttribute("aria-label", `Rain in Lisbon, ${y}: ${DATA[y].reduce((a, b) => a + b)} mm in all`);
}
years.forEach((b, i) => {
  b.addEventListener("click", () => pick(+b.textContent));
  b.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const o = years[1 - i]; o.focus(); pick(+o.textContent); } });
});
pick(2025, settle.now() + 0.1);
(function draw() { const t = settle.now(); bars.forEach((el, i) => (el.style.height = (Math.max(0, hs[i].value(t)) / 140) * 100 + "%")); requestAnimationFrame(draw); })();
</script>
```

## Draw-in

Updates its data. A line draws itself and the area under it follows with a clip of the same progress. Progress rides `count`, so the line never draws past its end.

```html recipe
<svg class="dw" viewBox="0 0 300 120" role="img" aria-label="Views rose from 2,100 to 2,870 over twelve days"><defs><clipPath id="dw-c"><rect width="0" height="120"/></clipPath></defs><path class="dw-a" clip-path="url(#dw-c)"/><path class="dw-l" d="M10 96 C40 90 60 70 90 74 S140 52 170 58 S230 30 290 22" pathLength="1"/></svg>
<button class="dw-b" type="button">Draw again</button>
<style>
.dw { width: min(300px, 100%); overflow: visible; } .dw-a { fill: color-mix(in srgb, var(--ink) 8%, transparent); }
.dw-l { fill: none; stroke: var(--ink); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 1 1; }
.dw-b { margin-top: 12px; padding: 12px 18px; border: 0; background: none; color: var(--muted); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), line = document.querySelector(".dw-l"), area = document.querySelector(".dw-a"), clip = document.querySelector(".dw rect");
area.setAttribute("d", line.getAttribute("d") + " L290 120 L10 120 Z");
let at = settle.now() + 0.2;
document.querySelector(".dw-b").addEventListener("click", () => (at = settle.now()));
(function draw() {
  const p = Math.min(1, Math.max(0, settle.move(settle.now() - at, R.count, 0, 1)));
  line.style.strokeDashoffset = 1 - p; clip.setAttribute("width", 300 * p);
  requestAnimationFrame(draw);
})();
</script>
```

## Route

Updates its data. A route draws in with a dot at its leading end, and the minutes left count down in whole steps until the dot arrives. A drive is story time, so it has a length of its own on the eased glide.

```html recipe
<div class="rt"><svg viewBox="0 0 300 170" role="img" aria-label="Route to Rua Augusta, 6 minutes"><path class="rt-p" d="M30 150 C80 150 70 90 120 90 S190 120 200 70 S250 30 270 30" pathLength="1"/><circle class="rt-e" cx="270" cy="30" r="6"/><circle class="rt-d" r="7"/></svg><p class="rt-t" aria-hidden="true"></p><button class="rt-b" type="button">Drive again</button></div>
<style>
.rt { width: min(300px, 100%); display: grid; justify-items: center; } .rt svg { width: 100%; overflow: visible; }
.rt-p { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 1 1; } .rt-e { fill: none; stroke: var(--muted); stroke-width: 2; } .rt-d { fill: var(--ink); }
.rt-t { margin: 4px 0 0; font-weight: 600; font-variant-numeric: tabular-nums; } .rt-b { padding: 12px 16px; border: 0; background: none; color: var(--muted); cursor: pointer; }
</style>
<script type="module">
const path = document.querySelector(".rt-p"), dot = document.querySelector(".rt-d"), label = document.querySelector(".rt-t"), L = path.getTotalLength();
const DRIVE = { duration: 2.4, curve: [0.45, 0, 0.15, 1] };
let at = settle.now() + 0.3;
document.querySelector(".rt-b").addEventListener("click", () => (at = settle.now()));
(function draw() {
  const p = settle.calm ? 1 : Math.min(1, Math.max(0, settle.move(settle.now() - at, DRIVE, 0, 1))), c = path.getPointAtLength(L * p);
  path.style.strokeDashoffset = 1 - p; dot.setAttribute("cx", c.x); dot.setAttribute("cy", c.y);
  label.textContent = p < 1 ? `${Math.ceil(6 * (1 - p))} min` : "You're here";
  requestAnimationFrame(draw);
})();
</script>
```

## Readout

Updates its data. A readout is hidden at rest. It appears on hover with a mouse or pen, on a tap with touch, and on keyboard focus, where the arrow keys move it. It always snaps to the nearest point: it names the day and shows that day's exact value, pinned above the tallest mark so it never covers the line. A mouse leaving, a press outside the plot, Escape and blur hide it. A touch scroll never selects; a sideways drag that starts on the plot scrubs once it has moved 8 px more sideways than down.

```html recipe
<div class="rd"><p class="rd-t" aria-hidden="true"></p><div class="rd-p" role="slider" tabindex="0" aria-label="Views by day" aria-valuemin="1" aria-valuemax="12"><svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="rd-l"/></svg><i class="rd-g"></i><b class="rd-d"></b></div></div>
<style>
.rd { position: relative; width: min(300px, 100%); padding-top: 34px; } .rd-p { position: relative; height: 100px; touch-action: pan-y; }
.rd-t { position: absolute; top: 0; left: 0; margin: 0; padding: 4px 10px; border-radius: var(--round); background: var(--ink); color: var(--on-ink); font-size: 13px; font-weight: 600; white-space: nowrap; font-variant-numeric: tabular-nums; }
.rd svg { width: 100%; height: 100%; overflow: visible; } .rd-l { fill: none; stroke: var(--ink); stroke-width: 2.5; vector-effect: non-scaling-stroke; }
.rd-g { position: absolute; top: 0; bottom: 0; left: 0; width: 1px; background: var(--muted); } .rd-d { position: absolute; left: -5px; top: -5px; width: 10px; height: 10px; border-radius: 50%; background: var(--ink); }
</style>
<script type="module">
const R = settle.register(), box = document.querySelector(".rd-p"), tip = document.querySelector(".rd-t"), guide = document.querySelector(".rd-g"), dot = document.querySelector(".rd-d");
const VIEWS = [2104, 2251, 2160, 2388, 2310, 2472, 2533, 2490, 2615, 2702, 2688, 2870], fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const day = (i) => fmt.format(new Date(2026, 9, 8 + i)), lo = 2000, hi = 2900, X = (i) => (i / 11) * 100, Y = (v) => 100 - ((v - lo) / (hi - lo)) * 100;
document.querySelector(".rd-l").setAttribute("points", VIEWS.map((v, i) => `${X(i) * 3},${Y(v)}`).join(" "));
let i = 11, w = box.clientWidth, tw = 0, on = false, tp = null; const at = settle.track(11, R.pop), vis = settle.track(0, R.fade); // keys start on the latest day
addEventListener("resize", () => (w = box.clientWidth));
const show = (v) => { on = v; vis.set(+v, settle.now()); };
function go(k) {
  const t = settle.now(); i = Math.min(11, Math.max(0, k)); if (on) at.set(i, t); else { at.hold(i, t); at.release(t, i); } show(true); // a hidden readout jumps, a shown one glides
  tip.textContent = `${day(i)} · ${VIEWS[i].toLocaleString("en")}`; tw = tip.offsetWidth; box.setAttribute("aria-valuenow", i + 1); box.setAttribute("aria-valuetext", `${day(i)}, ${VIEWS[i]} views`);
}
const near = (e) => Math.round(((e.clientX - box.getBoundingClientRect().left) / box.clientWidth) * 11), mine = (e) => tp && tp.id === e.pointerId;
box.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "touch") return go(near(e));
  if (mine(e) && !tp.s && Math.abs(e.clientX - tp.x) - Math.abs(e.clientY - tp.y) > 8) tp.s = 1; // a scroll never selects
  if (mine(e) && tp.s) go(near(e));
});
box.addEventListener("pointerleave", (e) => e.pointerType !== "touch" && show(false));
box.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") tp = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
box.addEventListener("pointerup", (e) => { if (mine(e) && !tp.s && Math.hypot(e.clientX - tp.x, e.clientY - tp.y) < 8) go(near(e)); if (mine(e)) tp = null; });
box.addEventListener("pointercancel", () => (tp = null));
document.addEventListener("pointerdown", (e) => box.contains(e.target) || show(false));
box.addEventListener("focus", () => box.matches(":focus-visible") && go(i)); box.addEventListener("blur", () => show(false));
box.addEventListener("keydown", (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); go(i + d); } if (e.key === "Escape") show(false); });
(function draw() {
  const t = settle.now(), u = at.value(t), x = (u / 11) * w, k = Math.min(10, Math.max(0, Math.floor(u))), y = Y(VIEWS[k] + (VIEWS[k + 1] - VIEWS[k]) * (u - k)), o = Math.min(1, Math.max(0, vis.value(t)));
  guide.style.transform = `translateX(${x}px)`; dot.style.transform = `translate(${x}px, ${y}px)`;
  tip.style.transform = `translateX(${Math.min(w - tw, Math.max(0, x - tw / 2))}px)`; tip.style.opacity = guide.style.opacity = dot.style.opacity = o;
  requestAnimationFrame(draw);
})();
</script>
```

## Time sweep

Waits. A line runs down a day's schedule from 08:00 to 17:00 with the time beside it in the mono face; the line rides `count`, so it never runs past five.

```html recipe
<div class="tw" role="img" aria-label="Today from 08:00 to 17:00"><ol aria-hidden="true"><li style="--h: 8.5">08:30 Stand-up</li><li style="--h: 10">10:00 Design review</li><li style="--h: 13">13:00 Focus</li><li style="--h: 15.5">15:30 Team sync</li></ol><i class="tw-l"></i><b class="tw-t" aria-hidden="true">08:00</b></div>
<button class="tw-b" type="button">Run the day</button>
<style>
.tw { position: relative; width: min(300px, 100%); height: 240px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); } .tw ol { margin: 0; padding: 0; list-style: none; }
.tw li { position: absolute; left: 76px; right: 16px; top: calc(12px + (var(--h) - 8) / 9 * 216px); font-size: 13px; }
.tw-l { position: absolute; left: 66px; right: 12px; top: 12px; height: 2px; background: var(--accent); } .tw-t { position: absolute; left: 14px; top: 5px; font: 600 13px/16px var(--mono); color: var(--accent); }
.tw-b { margin-top: 12px; padding: 12px 16px; border: 0; background: none; color: var(--muted); cursor: pointer; }
</style>
<script type="module">
const R = settle.register(), line = document.querySelector(".tw-l"), label = document.querySelector(".tw-t");
let at = settle.now() + 0.3;
document.querySelector(".tw-b").addEventListener("click", () => (at = settle.now()));
(function draw() {
  const u = Math.min(1, Math.max(0, settle.move(settle.now() - at, R.count, 0, 1))), m = Math.floor(480 + u * 540);
  line.style.transform = label.style.transform = `translateY(${u * 216}px)`;
  label.textContent = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  requestAnimationFrame(draw);
})();
</script>
```

## Check

Confirms and waits. A button narrows into a loader and the loader becomes a check that draws itself; then the button comes back. Each phase is a function of time from the press, and a screen reader hears "Paying" and then "Paid".

```html recipe
<button class="ck" type="button"><span>Pay £3.60</span><svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="11"/><path d="M-8 0 L-2.5 5.5 L8 -6" pathLength="1"/></svg></button>
<p class="sr" aria-live="polite"></p>
<style>
.ck { position: relative; width: 160px; height: 52px; padding: 0; overflow: hidden; border: 0; border-radius: var(--round); background: var(--ink); color: var(--on-ink); font-weight: 600; cursor: pointer; }
.ck > * { position: absolute; left: 50%; top: 50%; translate: -50% -50%; white-space: nowrap; }
.ck svg { width: 40px; height: 40px; fill: none; stroke: var(--on-ink); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
.ck circle { stroke-dasharray: 52 17; transform-box: fill-box; transform-origin: center; } .ck path { stroke-dasharray: 1 1; }
</style>
<script type="module">
const R = settle.register(), b = document.querySelector(".ck"), label = b.querySelector("span"), ring = b.querySelector("circle"), tick = b.querySelector("path"), live = document.querySelector(".ck + .sr");
const W = settle.track(160);
let t0 = -Infinity, said = 0;
const phase = (t) => (t < t0 || t >= t0 + 2.6 ? 0 : t < t0 + 1.2 ? 1 : 2);   // button, loader, check
b.addEventListener("click", () => { const t = settle.now(); if (phase(t)) return; t0 = t; W.set(52, t); W.set(160, t + 2.6, R.morph); });
(function draw() {
  const t = settle.now(), p = phase(t), w = W.value(t);
  if (p !== said) { said = p; live.textContent = ["", "Paying", "Paid"][p]; b.setAttribute("aria-busy", p === 1); }
  b.style.width = w + "px";
  label.style.opacity = p ? 0 : Math.min(1, Math.max(0, (w - 52) / 108));
  ring.style.opacity = p === 1 ? 1 : 0; ring.style.transform = `rotate(${(t * 420) % 360}deg)`;
  tick.style.opacity = p === 2 ? 1 : 0; tick.style.strokeDashoffset = 1 - Math.min(1, Math.max(0, settle.move(t - t0 - 1.2, R.count, 0, 1)));
  requestAnimationFrame(draw);
})();
</script>
```

## Camera

Changes screen, in a reel. The camera sizes each state to about 70 % of the frame, moves to the next on the register's `morph`, edges closer by 2 % a second while a state holds, and drifts by a pixel or two. The drift's waves divide the loop evenly and stay away from 0.2 Hz, a rate people find uncomfortable, so the reel ends on its opening frame.

```html recipe
<div class="cm" role="img" aria-label="A camera framing three cards in turn"><div class="cm-w"><i style="left: 20px; top: 40px; width: 90px; height: 56px"></i><i style="left: 170px; top: 20px; width: 130px; height: 110px"></i><i style="left: 60px; top: 190px; width: 220px; height: 80px"></i></div></div>
<style>
.cm { position: relative; width: 300px; height: 300px; overflow: hidden; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.cm-w { position: absolute; left: 0; top: 0; width: 300px; height: 300px; transform-origin: 0 0; } .cm-w i { position: absolute; border-radius: calc(var(--radius) / 2); background: var(--ink); }
</style>
<script type="module">
const R = settle.register(), world = document.querySelector(".cm-w"), boxes = [...world.children].map((b) => [b.offsetLeft, b.offsetTop, b.offsetWidth, b.offsetHeight]);
const HOLD = 1.5, N = boxes.length, D = N * HOLD, CREEP = 0.02;
const frame = (i, k) => { const [x, y, w, h] = boxes[(i + N) % N]; return { s: Math.min(300 / w, 300 / h) * 0.7 * (1 + CREEP * k), x: x + w / 2, y: y + h / 2 }; };
const reel = settle.timeline(D, (t) => {
  const i = Math.floor(t / HOLD) % N, k = t - i * HOLD, a = frame(i - 1, HOLD), b = frame(i, k), u = settle.move(k, R.morph, 0, 1);
  const s = a.s + (b.s - a.s) * u, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, w = (2 * Math.PI) / D;
  const fx = settle.calm ? 0 : 1.2 * Math.sin(2 * w * t) + 0.6 * Math.sin(3 * w * t + 1), fy = settle.calm ? 0 : 0.9 * Math.sin(2 * w * t + 2);
  world.style.transform = `translate(${150 - x * s + fx}px, ${150 - y * s + fy}px) scale(${s})`;
});
window.reel = reel;
</script>
```

## Scene handoff

Changes screen, in a reel. The old scene stays on screen, untouched, while the new one floods out of a dot inside it; nothing in the new scene moves until the flood is complete. The loop returns the same way, so the reel ends on its opening frame.

```html recipe
<div class="sh" role="img" aria-label="The word Packed hands over to the word Delivered, and back"><div class="sh-a"><b>Packed</b><i></i></div><div class="sh-b"><b>Delivered</b><i></i></div></div>
<style>
.sh { position: relative; width: 300px; height: 200px; overflow: hidden; border-radius: var(--radius); box-shadow: var(--shadow); }
.sh > div { position: absolute; inset: 0; display: grid; place-items: center; font-size: 34px; font-weight: 700; letter-spacing: -0.03em; }
.sh-a { background: var(--accent); color: var(--on-accent); } .sh-b { background: var(--surface); color: var(--ink); }
.sh i { position: absolute; width: 14px; height: 14px; border-radius: var(--round); background: currentColor; } .sh-a i { left: 236px; top: 92px; } .sh-b i { left: 50px; top: 92px; }
</style>
<script type="module">
const R = settle.register(), [A, B] = document.querySelectorAll(".sh > div"), D = 4, FAR = Math.hypot(300, 200); // covers the far corner from anywhere
const open = (el, at, t) => { const p = settle.move(t - at, R.fade, 0, 1), o = el.querySelector("i"); el.style.clipPath = `circle(${settle.flood(p, FAR)}px at ${o.offsetLeft + 7}px ${o.offsetTop + 7}px)`; };
const reel = settle.timeline(D, (t) => {
  if (t < 3.5) { B.style.zIndex = 1; A.style.zIndex = 0; A.style.clipPath = "none"; open(B, 1.5, t); }   // B floods out of A's dot
  else { A.style.zIndex = 1; B.style.zIndex = 0; B.style.clipPath = "none"; open(A, 3.5, t); }           // and A floods back out of B's
});
window.reel = reel;
</script>
```

## Credits

The release speed, the momentum threshold and the rubber band follow Emil Kowalski's apple-design and review-animations skills ([emilkowalski/skills](https://github.com/emilkowalski/skills), MIT). The split between moves that may overshoot and colour that never does follows Material Design's motion physics, and the 0.2 Hz caution Apple's Human Interface Guidelines on motion.
