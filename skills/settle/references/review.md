# Review

The check step. Run it on every piece before handing it over, and fix what it finds.

## 1. Lint

```bash
node scripts/lint.mjs piece.html
```

Static checks on a standalone file: it is self-contained, carries the kernel, handles reduced motion, takes every colour, face and corner from the dealt sheet, and uses no banned CSS. Its markup must work for a keyboard and a screen reader (no clickable divs, images with alt, focus that shows, zoom allowed). Fix every FAIL. A WARN needs a reason the request gives, or a fix. In a project, the frames below carry the check.

## 2. Frames

```bash
node scripts/snap.mjs piece.html --out /tmp/settle-snaps/phone --size 390x844 --sheet --times 0,0.1,0.2,0.4,0.8,1.5,1.55,1.62,1.75,2.4 --do "1.5 click #start"
node scripts/snap.mjs piece.html --out /tmp/settle-snaps/wide --size 1280x800 --sheet --times 0.4,2.4 --do "1.5 click #start"
node scripts/snap.mjs piece.html --out /tmp/settle-snaps/calm --size 390x844 --sheet --calm --times 0.2,1.6 --do "1.5 click #start"
```

The frames go to a folder outside the person's project, so the check leaves nothing behind. In a project, start its dev server and shoot the page that shows the piece: `node scripts/snap.mjs http://localhost:3000/<route> --out /tmp/settle-snaps/phone --size 390x844 --sheet …`.

snap.mjs stops the page clock and plays real clicks, drags and keys at the times given, so a shot 0.05 s after a click shows exactly that moment. Below 768 px wide it emulates a phone. After the frames it checks the settled page and prints one line per check:

- console errors, requests to hosts other than Google Fonts, sideways overflow, and the smallest text;
- text contrast against the surface behind it (4.5:1, or 3:1 from 24 px), and targets under 44 px, an invisible margin included;
- focus that falls to the page after a step, and, in a standalone file, controls whose `click()` changes nothing;
- digit runs in the accessibility tree, text hidden at rest or cut by its box, and fields under 16 px;
- the idle cost per frame with the CPU slowed four times;
- for a reel, the loop seam: frame 0 against the last frame;
- at 768 px or wider, a mouse pass: a press on each row's words slid off the piece and let go outside it, then a move with no button held, and a hover over every control; it flags what follows the pointer and text whose colour stays after the pointer leaves;
- with Google Fonts, one more frame with the fonts blocked, `fallback.png`, which must still fit.

The rest of `references/craft.md`'s gotchas are checked by eye on the frames. Shoot:

- **Arrival**: 0, 0.1, 0.2, 0.4 and 0.8 s.
- **Each interaction**: just before it, 0.05 and 0.12 s after it (mid-move), and 0.6 s after it (settled). Drags: `drag <selector> dx,dy seconds`, with shots during the drag and after the release.
- **At rest**: one frame after everything has settled.
- **A reel**: frame 0, the middle of each morph, each held state, and `DURATION − 0.01`.

Open `sheet.png` and look at it. Judge the frames against the rubric below, fix, and shoot again. When no browser is available, read the code against the rubric and say in the hand-over that the frames went unchecked.

## 3. The rubric

A piece passes when every line holds.

| Criterion | Holds when | Fails when |
| --- | --- | --- |
| Hierarchy | One element is clearly first: a big number, a title, the primary action. The eye lands there at rest | Everything has the same weight; the headline competes with labels |
| Colour restraint | One ground, one ink, one or two accents; the accent marks the one thing that matters now | Gradients, glows, rainbow categories, a second accent with no job |
| Motion feel | Each state is made from the last, springs settle after a slight overshoot or none, retargets keep their speed, the hand leads | Cuts, crossfades, wobble, linear slides, lag behind the pointer, everything at once |
| Interaction | Pointer, touch and keys all work; focus is visible; every control answers a press | A control that only hovers, a drag that ignores touch, no keyboard path |
| Real content | Plausible names, values, dates and times; the action keeps its name | Placeholders, round numbers, emoji as icons |
| Signature moment | One physical touch that surprises and reads at once | None, or five competing for attention |
| Legibility at rest | The settled frame reads at phone size: text 11px or more, contrast 4.5:1 for labels, nothing clipped | Grey on grey, text cut by its container, a tooltip over the data |

## 4. Instant fails

From a review of 24 pages a capable model built with no skill. Any one of these fails the piece unless the request asked for it by name:

- A template layout, such as a hero over identical cards.
- Garish gradients: several hues in a fill, a chart or a text.
- A black or loud pink ground for a subject that does not call for it.
- A frosted panel over coloured blobs.
- Confetti or particles.
- Motion with no depth: flat slides with no spring, no shadow and no change of light.

## 5. What reads wrong, and the fix

| In the frames | Fix |
| --- | --- |
| A shape passes through a muddy grey on its way from black to white | Keep each shape's colour. Grow the new container out from behind the old shape, or change colour with a flood from a point |
| Corners balloon or squash mid-morph | Spring the real radius; a pill's radius is half its height. Never animate from a 999px sentinel |
| Content pops or cuts between states | Lay each state's content out inside the shape at its final size; swap it through a blur |
| A fold shows a plain slab | Blur the content out first, then shrink the container; let the persistent object carry on |
| Everything lands at once | Stagger arrivals 37 ms (rows) or 67 ms (labels) |
| The overshoot wobbles | Bounce 0.2 or less; 0.3 for the signature moment only |
| Numbers crossfade or jiggle | Odometer columns in tabular figures; only the changing columns turn |
| A readout covers its neighbours | Pin it to a line above the tallest mark and move it along that line |
| Text under 11px at phone width | Reflow the layout at 360px or drop words; scaling a whole scene down shrinks its text |
| The page scrolls sideways on a phone | Let rows wrap, cap widths with `max-width: 100%`, check fixed pixel widths |
| The piece looks frozen until hovered | Add the live element: a draw-in on arrival, a ticking value, a readout that follows the pointer |
| Shadows look grey and dirty | Use the sheet's `--shadow` and `--shadow-lift`, below the object only |
| The ground looks like every generated page | Redeal the palette, or take the subject's own colours; check the brief against what any similar request would get |
| The focus ring is missing, or a heavy rectangle | 2px in the ink, offset 3–4px, rounded to match the element |
| A reel's interface is small in a big frame | Size each state to 60–80 % of the frame with the camera |
| A reel's loop jumps | Make the last state fold back into the first; compare frame 0 with `DURATION − 0.01` |
| Under reduced motion things still slide | Take every preset from `settle.register()`, which returns the calm set under reduced motion; arrivals become 0.15 s fades |
