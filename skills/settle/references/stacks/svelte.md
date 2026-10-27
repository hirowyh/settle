# Svelte stack notes

Format after ui-ux-pro-max (MIT): one guideline per heading, with its fields beneath. All entries: svelte 5.57.2 (npm `latest`, checked 2026-10-20) unless a line says otherwise.

### 1. Piece file
- **Category** Structure · **Severity** High · **Docs** https://svelte.dev/docs/svelte/lifecycle-hooks
- **Do** One component per piece, PascalCase, in the project's components folder (SvelteKit: `src/lib/components/Switch.svelte`). Add `lang="ts"` to `<script>` when the project uses TypeScript. Write Svelte 5 syntax if the project is on 5, and match an older project's syntax if not.
- **Don't** Add a store, an action library or a wrapper for the piece.

### 2. Client only
- **Category** Rendering · **Severity** High · **Docs** https://svelte.dev/docs/svelte/lifecycle-hooks
- **Do** Start motion in `onMount`. The docs say it does not run inside a component rendered on the server, and that a function it returns runs when the component unmounts.
- **Don't** Read `window`, `matchMedia` or call `requestAnimationFrame` at the top of `<script>`.
- Importing the kernel on the server is safe: at import it only builds tables and sets `globalThis.settle`. Browser APIs run at call time.

### 3. The kernel
- **Category** Setup · **Severity** High
- **Do** Copy `assets/kernel.js` whole to `src/lib/settle.js` once. Import the default. Name the register once, inside `onMount`.
- **Don't** Paste it into each component.
```js
import settle from "$lib/settle"; // SvelteKit alias; a relative path in plain Svelte
```
- If the type checker rejects the `.js` import, add `src/lib/settle.d.ts`: `declare const settle: any; export default settle;`

### 4. One loop, no frame state
- **Category** Motion · **Severity** High
- **Do** Build tracks, listeners and the loop inside `onMount`. Handlers call `track.set(v, settle.now())`; the loop writes `el.style` on a `bind:this` node; the function `onMount` returns cancels the frame.
- **Don't** Assign a `$state` value each frame, or bind the moving style with `style:transform={...}`: every write re-runs the template effect. A value that changes on click (`aria-checked`) may be `$state`.
```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import settle from "$lib/settle";
  let btn: HTMLButtonElement;
  onMount(() => {
    const R = settle.register("crisp"), dip = settle.track(1, R.pop);
    const ac = new AbortController(), o = { signal: ac.signal };
    btn.addEventListener("pointerdown", () => dip.set(0.97, settle.now()), o);
    btn.addEventListener("pointerup", () => dip.set(1, settle.now()), o);
    let raf = 0;
    const draw = () => { btn.style.transform = `scale(${dip.value(settle.now())})`; raf = requestAnimationFrame(draw); };
    draw();
    return () => { cancelAnimationFrame(raf); ac.abort(); };
  });
</script>
<button bind:this={btn} type="button">Save draft</button>
```
- Tracks are made after `register()`, because a track keeps its preset from creation. A reel's `timeline()` runs its own frame loop: call its `stop()` in the function `onMount` returns.

### 5. Pointer, touch, keys
- **Category** Input · **Severity** High
- **Do** `<button type="button">` for actions, `role="switch"` with `aria-checked` for toggles, `<input type="range">` for sliders. Act on `click`. Drags use pointer events and `el.setPointerCapture(e.pointerId)` on down, with `touch-action` set on the element. Keep `:focus-visible` in the stylesheet.
- **Don't** Use `<div onclick>`, or mouse-only and touch-only handlers.

### 6. The sheet
- **Category** Look · **Severity** High
- **Do** Paste the dealt `:root { --ground: ...; }` block into the project's global stylesheet (SvelteKit: `src/app.css`, imported by `+layout.svelte`). Svelte scopes a component's `<style>`, so a `:root` rule there needs `:global(:root)`; the global file avoids that.
- In a project with its own tokens or a Tailwind theme, do not add a second palette. Point the sheet's names at the project's (`--ground: var(--color-bg);`) and derive the missing ones (`--inset`, `--muted`) with `color-mix`.
- **Don't** Hard-code hex values in the piece.

### 7. The font
- **Category** Type · **Severity** Medium
- **Do** Svelte has no font loader. Add the dealt face's one Google Fonts `<link>` to the document head (SvelteKit: `src/app.html`), and set `--font: "Epilogue", ui-sans-serif, system-ui;` in the sheet, with the named system fallback the sheet gives.
- **Don't** `@import` the font from a component's `<style>`.

### 8. The project's motion library
- **Category** Motion · **Severity** Medium · **Docs** https://svelte.dev/docs/svelte/svelte-motion (`Spring` since 5.8.0)
- **Do** If the project already uses `Spring` or `spring` from `svelte/motion`, keep settle's timing in it. Its options are `stiffness` and `damping`, each clamped to 0-1 in `spring.js`. They are per-frame numbers: the step runs in units of one 60 Hz frame, with acceleration `stiffness * delta - damping * velocity`.
- Starting values from that definition, with `p = settle.register().morph` (or the preset the move uses): `s = 2π / (60 · p.duration)`, `stiffness = s²`, `damping = 2 · (1 - p.bounce) · s`.
- **This mapping is approximate.** The definition is read from the source; but the per-frame step is discrete, and a simulation of it against `settle.spring` differed by up to 0.12 of the move (it loses most of the overshoot). Treat the numbers as a start, check by eye, and for exact timing keep settle's loop.
- **Don't** Use `Spring` for a curve preset (soft, smooth), and do not read `prefersReducedMotion`: `settle.register()` already covers it. Never install a package.

### 9. Reduced motion
- **Category** Access · **Severity** High
- **Do** Nothing extra. `settle.register()` returns the calm set under `prefers-reduced-motion`; take every preset from it.
- **Don't** Add a second code path. Call `register()` inside `onMount`; the server cannot know.

### 10. Several instances
- **Category** Structure · **Severity** Medium
- **Do** Keep each instance's tracks, loop and listeners inside its own `onMount`, so two copies never share one. Keep the register name in one place; every piece on the page shares it.
- **Don't** Put tracks in `<script module>`: that runs once for all instances.
