# HTML stack notes

Format after ui-ux-pro-max (MIT): one guideline per heading, with its fields beneath. HTML has no version number. These entries come from `assets/kernel.js` and `references/motion.md`; no MDN page was read, so platform claims are unverified against docs (2026-10-20).

### 1. The default: one file
- **Category** Structure · **Severity** High
- **Do** With no project, write one self-contained `.html` file named for the piece (`switch.html`), from `assets/page.html`. The sheet goes in a `<style>`, the kernel in a `<script type="module">` in the head, so it runs before every module script in the body, the recipes' own scripts included.
- **Don't** Split it into `.css` and `.js` files, add a build step, or link a CDN library.
```html
<head>
  <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700&display=swap" rel="stylesheet">
  <style>:root { /* the dealt sheet */ } /* base page styles */</style>
  <script type="module">/* assets/kernel.js, pasted whole */ settle.register("crisp");</script>
</head>
<body>
  <!-- markup -->
  <script type="module">const R = settle.register(); /* the piece */</script>
</body>
```

### 2. Order of scripts
- **Category** Setup · **Severity** High
- **Do** Keep the kernel script first, in the head. Module scripts run in document order, and the kernel sets `globalThis.settle`, so every later script reads `settle` as a global, as the recipes do. Name the register once, right after the kernel.
- **Don't** Put the piece's code in a classic `<script>`: classic scripts run before module scripts, so `settle` is not defined yet.

### 3. Paste the kernel whole
- **Category** Setup · **Severity** High
- **Do** Paste `assets/kernel.js` unchanged, comments included. Its `export default` is allowed in an inline module script.
- **Don't** Trim functions to save space; the recipes use any of them.

### 4. One loop
- **Category** Motion · **Severity** High
- **Do** One `requestAnimationFrame` loop for the whole page; it reads every track and writes `style` on the nodes. Handlers only call `track.set(value, settle.now())`. Query the nodes once, before the loop, and keep them in variables.
- **Don't** Start a loop per element, query the DOM inside the loop, or animate with CSS `transition` or `@keyframes` next to the loop on the same property.
```html
<script type="module">
  const R = settle.register("crisp"), b = document.querySelector(".pr"), dip = settle.track(1, R.pop);
  b.addEventListener("pointerdown", () => dip.set(0.97, settle.now()));
  b.addEventListener("pointerup", () => dip.set(1, settle.now()));
  (function draw() { b.style.transform = `scale(${dip.value(settle.now())})`; requestAnimationFrame(draw); })();
</script>
```
- A single page that is never torn down needs no cancel. A page that removes the piece from the DOM keeps the frame id and calls `cancelAnimationFrame`.

### 5. Pointer, touch, keys
- **Category** Input · **Severity** High
- **Do** `<button type="button">` for actions, `role="switch"` with `aria-checked` for toggles, `<input type="range">` for sliders. Act on `click`; it fires from pointer, keys and assistive tools. Drags use pointer events and `el.setPointerCapture(e.pointerId)` on down, with `touch-action` set on the element. Keep `:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }` from the base page.
- **Don't** Use `<div onclick>`, `mousedown`/`touchstart` pairs, or `outline: none`.

### 6. The sheet and the base page
- **Category** Look · **Severity** High
- **Do** Paste the dealt `:root { --ground: ...; }` block, then the base page styles from `references/motion.md` ("The base page"), into the one `<style>`. Pieces read `var(--ink)` and the other names and never a hex value.
- **Don't** Add a second palette, or colours outside the sheet.

### 7. The font
- **Category** Type · **Severity** Medium
- **Do** One Google Fonts `<link rel="stylesheet">` for the dealt face, with only the weights the piece uses and `display=swap`. Set `--font: "Epilogue", ui-sans-serif, system-ui;` in the sheet, ending in the named system fallback the sheet gives. Numbers that change take `font-variant-numeric: tabular-nums`.
- **Don't** Add a second font link, or `@import` inside the `<style>`.

### 8. A multi-page site
- **Category** Structure · **Severity** High
- **Do** When the project is plain HTML with several pages, copy `assets/kernel.js` once to the project's script folder (`js/settle.js`). Each page has one `<script type="module" src="js/home.js">`, and that file starts with `import settle from "./settle.js";`. Put the sheet in the site's shared stylesheet, once, with a `<link rel="stylesheet">` on each page.
- **Don't** Paste the kernel into every page, or give two pages two different registers: name it once, in one shared place.
- Module files fetched by URL need a web server. A page opened from disk blocks them in most browsers (not checked here), so for a file the person double-clicks, use the one-file default.

### 9. Reduced motion
- **Category** Access · **Severity** High
- **Do** Nothing extra. `settle.register()` returns the calm set under `prefers-reduced-motion`; take every preset from it.
- **Don't** Add a `@media (prefers-reduced-motion)` block or a second code path for the same motion.

### 10. The project's motion library
- **Category** Motion · **Severity** Low
- **Do** A plain HTML project has none to keep. If the page already loads one, use settle's `duration` and `bounce` as that library's inputs where it takes them, and say in the brief that the mapping is unchecked. For Motion's spring options the verified mapping is in `react-next.md`.
- **Don't** Load a library for a piece.
