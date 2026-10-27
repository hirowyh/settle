# Vue stack notes

Format after ui-ux-pro-max (MIT): one guideline per heading, with its fields beneath. All entries: vue 3.5.44 (npm `latest`, checked 2026-10-20) unless a line says otherwise.

### 1. Piece file
- **Category** Structure · **Severity** High · **Docs** https://vuejs.org/api/composition-api-lifecycle
- **Do** One single-file component per piece in the project's components folder, PascalCase (`src/components/SwitchToggle.vue`), `<script setup lang="ts">` when the project uses TypeScript, otherwise plain `<script setup>`. Match the project's `<style>` habit (scoped or not).
- **Don't** Add a plugin, a composable library or a store for the piece. If the project uses Nuxt, the file goes in `components/`; Nuxt specifics are unverified here.

### 2. Client only
- **Category** Rendering · **Severity** High · **Docs** https://vuejs.org/api/composition-api-lifecycle
- **Do** Start motion in `onMounted`. The docs say this hook is not called during server-side rendering, so the server only renders the static template.
- **Don't** Read `window`, `matchMedia` or call `requestAnimationFrame` in `<script setup>` top level or in the template.
- Importing the kernel on the server is safe: at import it only builds tables and sets `globalThis.settle`. Browser APIs run at call time.

### 3. The kernel
- **Category** Setup · **Severity** High
- **Do** Copy `assets/kernel.js` whole to `src/lib/settle.js` once. Import the default. Name the register once, inside `onMounted`.
- **Don't** Paste it into each component.
```ts
import settle from "@/lib/settle"; // the project's alias; a relative path otherwise
```
- If the type checker rejects the `.js` import, add `src/lib/settle.d.ts`: `declare const settle: any; export default settle;`

### 4. One loop, no frame state
- **Category** Motion · **Severity** High
- **Do** Build tracks, listeners and the loop inside `onMounted`. Handlers call `track.set(v, settle.now())`; the loop writes `el.style` through template refs; `onUnmounted` cancels the frame.
- **Don't** Write a `ref()` or `reactive()` value each frame, or bind the moving style in the template (`:style`): every write re-renders. A value that changes on click (`aria-checked`) may be reactive.
```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import settle from "@/lib/settle";
const btn = ref<HTMLButtonElement>();
let raf = 0, ac: AbortController;
onMounted(() => {
  const R = settle.register("crisp"), el = btn.value!, dip = settle.track(1, R.pop);
  ac = new AbortController(); const o = { signal: ac.signal };
  el.addEventListener("pointerdown", () => dip.set(0.97, settle.now()), o);
  el.addEventListener("pointerup", () => dip.set(1, settle.now()), o);
  const draw = () => { el.style.transform = `scale(${dip.value(settle.now())})`; raf = requestAnimationFrame(draw); };
  draw();
});
onUnmounted(() => { cancelAnimationFrame(raf); ac?.abort(); });
</script>
<template><button ref="btn" type="button"><slot /></button></template>
```
- Tracks are made after `register()`, because a track keeps its preset from creation. A reel's `timeline()` runs its own frame loop: call its `stop()` in `onUnmounted`.

### 5. Pointer, touch, keys
- **Category** Input · **Severity** High
- **Do** `<button type="button">` for actions, `role="switch"` with `:aria-checked` for toggles, `<input type="range">` for sliders. Act on `@click`. Drags use pointer events and `el.setPointerCapture(e.pointerId)` on down, with `touch-action` set on the element. Keep `:focus-visible` in the stylesheet.
- **Don't** Use `<div @click>`, or mouse-only and touch-only handlers.

### 6. The sheet
- **Category** Look · **Severity** High
- **Do** Paste the dealt `:root { --ground: ...; }` block into the project's global stylesheet (the one `main.ts` imports). Do not put it in a `scoped` block: `:root` there gets rewritten.
- In a project with its own tokens or a Tailwind theme, do not add a second palette. Point the sheet's names at the project's (`--ground: var(--color-bg);`) and derive the missing ones (`--inset`, `--muted`) with `color-mix`.
- **Don't** Hard-code hex values in the piece.

### 7. The font
- **Category** Type · **Severity** Medium
- **Do** Vue has no font loader. Add the dealt face's one Google Fonts `<link>` to `index.html` (or Nuxt's `app.head`; unverified), and set `--font: "Epilogue", ui-sans-serif, system-ui;` in the sheet, with the named system fallback the sheet gives.
- **Don't** `@import` the font from a component's `<style>`.

### 8. The project's motion library
- **Category** Motion · **Severity** Medium
- **Do** If the project already has a Vue motion library, keep settle's timing in it: use settle's `duration` and `bounce` as the library's inputs where it takes them. **The exact mapping is unverified**: this note did not check any Vue library's definition of its spring options (`motion-v` 2.8.0 is on npm; its options were not read). Say so in the brief and leave settle's own loop in place.
- **Don't** Install a library for a piece that has none.

### 9. Reduced motion
- **Category** Access · **Severity** High
- **Do** Nothing extra. `settle.register()` returns the calm set under `prefers-reduced-motion`; take every preset from it.
- **Don't** Add a `matchMedia` branch or a second code path. Call `register()` in `onMounted`; the server cannot know.

### 10. Several instances
- **Category** Structure · **Severity** Medium
- **Do** Keep each instance's tracks, loop and listeners inside its own `onMounted`, so two copies of the component never share one. Keep the register name in one place; it is shared by every piece on the page.
- **Don't** Put tracks at module level of `<script setup>` outside the hook, or in a plain `<script>` block shared by instances.
