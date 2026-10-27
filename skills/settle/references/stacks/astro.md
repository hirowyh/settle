# Astro stack notes

Format after ui-ux-pro-max (MIT): one guideline per heading, with its fields beneath. All entries: astro 7.4.1 (npm `latest`, checked 2026-10-20) unless a line says otherwise.

### 1. Piece file
- **Category** Structure · **Severity** High · **Docs** https://docs.astro.build/en/guides/client-side-scripts
- **Do** One `.astro` component per piece, PascalCase, in `src/components/` (`Switch.astro`): markup, a `<style>` block and a `<script>` block in the one file. If the page already uses a React, Vue or Svelte island for this kind of thing, write the piece in that framework instead and follow its stack note.
- **Don't** Add an integration or a framework to the project just for a piece.

### 2. Client only
- **Category** Rendering · **Severity** High · **Docs** https://docs.astro.build/en/guides/client-side-scripts
- **Do** The `.astro` frontmatter and template render at build or request time and send HTML. Motion goes in a plain `<script>`, which runs only in the browser. Astro bundles it, treats it as TypeScript, adds `type="module"`, and lets you import local files from it.
- **Don't** Read `document` or `window` in the frontmatter. Do not add `is:inline`: that skips bundling, so the kernel `import` would not resolve.

### 3. The kernel
- **Category** Setup · **Severity** High
- **Do** Copy `assets/kernel.js` whole to `src/lib/settle.js` once. Import the default inside the piece's `<script>`. Name the register once there.
- **Don't** Paste it into each component.
```astro
<script>
  import settle from "../lib/settle.js";
  settle.register("crisp");
</script>
```
- If the type checker rejects the `.js` import, add `src/lib/settle.d.ts`: `declare const settle: any; export default settle;`

### 4. One loop, no frame state
- **Category** Motion · **Severity** High · **Docs** https://docs.astro.build/en/guides/client-side-scripts
- **Do** A component's `<script>` is deduplicated: it is included once even when the component appears many times on a page. Loop over every instance (`querySelectorAll("[data-switch]")`) and give each its own tracks and its own loop. Handlers call `track.set(v, settle.now())`; the loop writes `el.style` straight on the node.
- **Don't** Use `document.querySelector` for one node and miss the rest, or write per-frame state to a store or signal.
```astro
<button class="pr" data-press type="button">Save draft</button>
<script>
  import settle from "../lib/settle.js";
  const R = settle.register("crisp");
  document.querySelectorAll<HTMLElement>("[data-press]").forEach((el) => {
    const dip = settle.track(1, R.pop);
    el.addEventListener("pointerdown", () => dip.set(0.97, settle.now()));
    el.addEventListener("pointerup", () => dip.set(1, settle.now()));
    const draw = () => { el.style.transform = `scale(${dip.value(settle.now())})`; requestAnimationFrame(draw); };
    draw();
  });
</script>
```
- The loop never stops, which suits a page that is thrown away on navigation. With `<ClientRouter />` (view transitions) the old nodes are swapped out: keep the frame id and `cancelAnimationFrame` on the `astro:before-swap` event, and run the setup again on `astro:page-load`. Both events are in the docs' event list (https://docs.astro.build/en/guides/view-transitions/); their exact timing was not read.
- On a page with `<ClientRouter />`, a reel's `timeline()` keeps running after the page swaps: call its `stop()` in `astro:before-swap`.

### 5. Pointer, touch, keys
- **Category** Input · **Severity** High
- **Do** `<button type="button">` for actions, `role="switch"` with `aria-checked` for toggles, `<input type="range">` for sliders. Act on `click`. Drags use pointer events and `el.setPointerCapture(e.pointerId)` on down, with `touch-action` set on the element. Keep `:focus-visible` in the stylesheet.
- **Don't** Use `<div>` with a click handler, or mouse-only and touch-only handlers.

### 6. The sheet
- **Category** Look · **Severity** High
- **Do** Paste the dealt `:root { --ground: ...; }` block into a global stylesheet (`src/styles/global.css`) and import it in the layout's frontmatter: `import "../styles/global.css";`. Put the base styles (body, `:focus-visible`) there too.
- **Don't** Put `:root` in a component `<style>`: Astro scopes those styles to the component. Do not hard-code hex values in a piece.
- In a project with its own tokens or a Tailwind theme, do not add a second palette. Point the sheet's names at the project's (`--ground: var(--color-bg);`) and derive the missing ones (`--inset`, `--muted`) with `color-mix`.

### 7. The font
- **Category** Type · **Severity** Medium · **Docs** https://docs.astro.build/en/guides/fonts/
- **Do** Add the dealt face's one Google Fonts `<link>` in the layout's `<head>`, and set `--font: "Epilogue", ui-sans-serif, system-ui;` in the sheet, with the named system fallback the sheet gives.
- If the project already configures Astro's `fonts` option, use it: register the face in `astro.config.mjs`, put `<Font cssVariable="--font-x" />` from `astro:assets` in the head, and set `--font` to that variable. The docs page still marks parts of this API as experimental, so do not add it to a project that lacks it.
- **Don't** `@import` a font from a component's `<style>`.

### 8. The project's motion library
- **Category** Motion · **Severity** Medium
- **Do** Astro has no motion library of its own. If the piece is an island in React, Vue or Svelte, use that stack's note and its library mapping. For a plain `.astro` piece, settle's own loop is the motion.
- **Don't** Install a motion package for a piece.

### 9. Reduced motion
- **Category** Access · **Severity** High
- **Do** Nothing extra. `settle.register()` returns the calm set under `prefers-reduced-motion`; take every preset from it. Call it in the browser `<script>`; the frontmatter runs on the server and cannot know.
- **Don't** Add a second code path or a `matchMedia` branch.

### 10. Islands
- **Category** Rendering · **Severity** Medium · **Docs** https://docs.astro.build/en/guides/client-side-scripts
- **Do** Use an island only when the piece needs a framework's state. Give it the client directive that fits (`client:visible` for a piece below the fold, `client:load` above it), and inside it follow the framework's note: motion in its mount hook.
- **Don't** Hydrate a framework component for a piece a `<script>` can drive.
