# React and Next.js stack notes

Format after ui-ux-pro-max (MIT): one guideline per heading, with its fields beneath. All entries: react 19.3.1, next 16.4.2 (npm `latest`, checked 2026-10-20) unless a line says otherwise.

### 1. Piece file
- **Category** Structure · **Severity** High · **Docs** https://nextjs.org/docs/app/getting-started/project-structure
- **Do** One file per piece, named for what it is, in the project's components folder and style (`src/components/Switch.tsx`, PascalCase). TypeScript when the project has a `tsconfig.json`.
- **Don't** Add a `settle/` folder, a provider, or a hook package. The piece is one component.

### 2. Client only
- **Category** Rendering · **Severity** High · **Docs** https://nextjs.org/docs/app/api-reference/directives/use-client
- **Do** Put `"use client"` first in the piece. It still renders to HTML on the server, so build the static markup with no browser calls and start motion inside `useEffect`.
- **Don't** Read `window`, `matchMedia`, `performance` or call `requestAnimationFrame` while rendering.
- Importing the kernel on the server is safe: at import it only builds tables and sets `globalThis.settle`. Browser APIs run at call time (`matchMedia` is guarded, `requestAnimationFrame` is used only by `timeline`).

### 3. The kernel
- **Category** Setup · **Severity** High
- **Do** Copy `assets/kernel.js` whole to `src/lib/settle.js` once. Import the default. Name the register once, in the effect, never at module top.
- **Don't** Paste it into each piece, or add a package for it.
```tsx
import settle from "@/lib/settle"; // the project's alias; a relative path otherwise
// in useEffect: const R = settle.register("crisp");
```
- If TypeScript rejects the `.js` import (`allowJs` off; create-next-app's default is unverified), add `src/lib/settle.d.ts`: `declare const settle: any; export default settle;`

### 4. One loop, no frame state
- **Category** Motion · **Severity** High
- **Do** Build tracks, listeners and the loop inside one `useEffect(..., [])`. Handlers call `track.set(v, settle.now())`; the loop writes `el.style` through refs; the cleanup cancels the frame and removes the listeners.
- **Don't** `setState` per frame, or tracks created during render (a track keeps its preset from creation, so make it after `register()`).
```tsx
useEffect(() => {
  const R = settle.register("crisp"), el = ref.current!, dip = settle.track(1, R.pop);
  const ac = new AbortController(), o = { signal: ac.signal };
  el.addEventListener("pointerdown", () => dip.set(0.97, settle.now()), o);
  el.addEventListener("pointerup", () => dip.set(1, settle.now()), o);
  let raf = 0;
  const draw = () => { el.style.transform = `scale(${dip.value(settle.now())})`; raf = requestAnimationFrame(draw); };
  draw();
  return () => { cancelAnimationFrame(raf); ac.abort(); };
}, []);
```
- Strict Mode runs the effect twice in development; the cleanup above makes that harmless. A reel's `timeline()` runs its own frame loop: call its `stop()` in the cleanup.

### 5. Pointer, touch, keys
- **Category** Input · **Severity** High
- **Do** `<button type="button">` for actions, `role="switch"` with `aria-checked` for toggles, `<input type="range">` or `role="slider"` for sliders. Act on `click`. Drags use pointer events, `el.setPointerCapture(e.pointerId)` on down, `touch-action` set on the element. Keep `:focus-visible` in the stylesheet.
- **Don't** Use `div onClick`, mouse-only or touch-only handlers. A value that flips on click (`aria-checked`) may live in `useState`; a value that moves per frame may not.

### 6. The sheet
- **Category** Look · **Severity** High · **Docs** https://tailwindcss.com/docs/theme (tailwindcss 4.3.3)
- **Do** Paste the dealt `:root { --ground: ...; }` block into the global stylesheet (`app/globals.css`). Pieces read `var(--ink)` and the rest.
- In a project with its own tokens, do not add a second palette. Point the sheet's names at the project's: `--ground: var(--background); --ink: var(--foreground);`. For the colours it lacks (`--inset`, `--muted`), derive them with `color-mix` from the two it has.
- With Tailwind 4, expose them as utilities with `@theme inline { --color-ground: var(--ground); }`; `inline` is what makes a utility read the variable you point at.
- **Don't** Hard-code hex values in the piece.

### 7. The font
- **Category** Type · **Severity** Medium · **Docs** https://nextjs.org/docs/app/api-reference/components/font
- **Do** Load the dealt face with `next/font/google` in `app/layout.tsx`, with `variable` and the sheet's named system font as `fallback`; put the class on `<html>`; set `--font` to the variable.
- **Don't** Add a `<link>` to Google Fonts in a Next.js app.
```tsx
const face = Epilogue({ subsets: ["latin"], variable: "--face", fallback: ["ui-sans-serif", "system-ui"] });
// <html className={face.variable}>   css: :root { --font: var(--face), ui-sans-serif, system-ui; }
```

### 8. The project's motion library
- **Category** Motion · **Severity** Medium · **Docs** https://motion.dev/docs/react-transitions (npm `motion` 14.4.0)
- **Do** If the project already uses Motion for React, keep settle's timing in it. For a spring preset, `visualDuration = duration / 1.2` and `bounce` unchanged. Checked in motion-dom 14.4.0 `getSpringOptions`: it sets the undamped angular frequency to 2π / (1.2 · visualDuration) and the damping ratio to 1 − bounce for bounce ≥ 0, which is settle's `terms()`.
- For a curve preset use a tween: `{ duration, ease: [x1, y1, x2, y2] }` (the docs show `ease` as a four-number array).
- Read the preset from `settle.register()`, then convert it: under reduced motion it is the calm one (duration 0.001), so the same conversion lands at once.
- **Don't** Mix the two in one piece: either settle's loop drives the node or Motion does. Never install Motion for a piece that has none.
```tsx
const p = settle.register().morph; // the dealt register's morph, or the calm one
<motion.div animate={{ width }} transition={{ type: "spring", visualDuration: p.duration / 1.2, bounce: p.bounce }} />
```

### 9. Reduced motion
- **Category** Access · **Severity** High
- **Do** Nothing extra. `settle.register()` returns the calm set under `prefers-reduced-motion`; take every preset from it.
- **Don't** Add a `useReducedMotion` branch or a second code path. Call `register()` in the effect (the browser decides at call time); the server cannot know.

### 10. Hydration
- **Category** Rendering · **Severity** Medium
- **Do** Render the first state's markup exactly, and let the loop set transforms only after mount. Set initial inline styles in the markup when the first frame must not jump.
- **Don't** Render `Math.random()`, `Date.now()` or `settle.now()` into markup; it differs between server and browser.
