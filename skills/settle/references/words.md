# Words

Beginners describe what they want in feelings. This map turns their words into the moves that produce the feeling. Read the request's adjectives, find them below, and write the moves into the brief. Where a row names a tone, a register or `--dark`, pass it to `scripts/deal.mjs` when you deal the look (`--tone luxury`, `--register smooth`, `--dark`). When two words pull in different directions ("fun" and "professional"), the subject decides: a bank stays calm, a game can play.

## Feel

| They write | They mean | Do |
| --- | --- | --- |
| smooth, fluid, buttery | nothing jumps, everything continues | One object morphs between states; content swaps through a blur; the smooth register; nothing cuts |
| snappy, fast, quick, responsive | it reacts the instant I touch it | The press lands at once (0.97 on pointerdown); the crisp register; stagger 37 ms or less |
| satisfying, feels nice to click, tactile, juicy | my action has weight | A press that dips, a release that springs with bounce 0.2–0.3, one signature moment such as a knob that stretches; colour follows the motion |
| alive, make it look alive, dynamic, animated | it moves on its own and answers me | It draws itself on arrival, numbers tick, the readout follows the pointer exactly; a reel's camera creeps |
| fun, playful, delightful, cute | a moment that makes me smile | `--tone playful`. One playful signature with bounce 0.3 on the object itself; everything else calm. Fun comes from the object's physics |
| pop, make it pop, eye-catching, stand out | it should not look dull | `--tone bold`. Contrast and hierarchy: a big number, one accent on the thing that matters, arrival in order. Flat colour, no gradients, no glow |
| fancy, impressive, wow, presentation-ready | it should look expensive | Choreography: an orchestrated arrival, a ticking total, a camera that frames; generous space; restraint everywhere else |
| premium, high-end, Apple-like, like on a Mac | quiet confidence | `--tone luxury`. Wide, faint shadows; the smooth register; blur swaps; nothing decorative |
| like an iPhone app, iOS style, native | it should feel like it ships on the phone | `--direction system`: the system face, capsule controls, grouped surfaces |
| glassy, Liquid Glass, translucent | glass over something beautiful | `--direction glass`, over the person's photo or a map or words drawn from the subject; never over a flat ground |
| for my article, blog post, report, newsletter (a chart) | it sits in a page of copy | `--direction editorial`: the chart as a captioned figure |
| for a presentation, a slide, a pitch (a chart) | the room should get the point at once | `--direction split`: the takeaway in one large line beside the chart |
| a ticket, menu, receipt, label, boarding pass | the thing is paper in real life | `--direction stationery`: printed on that object |
| a screen, a full screen, an app screen, a page in my app | it is a whole view | `--direction whole-screen`: the piece fills the page |
| on my settings page, in my dashboard, in my sidebar (with no project to put it in) | it lives among other things | `--direction in-place`: a slice of that page around the piece |
| set on a desk, in a café, in a kitchen (a reel) | the reel happens somewhere | `--direction scene`: a drawn place, as Pictures in `references/directions.md` allows |
| clean, minimal, simple, modern | nothing extra | `--tone quiet`. Fewer elements, one accent or none, motion only where it explains a change; space and type carry the hierarchy |
| natural, organic, physical, real | it behaves like an object | Springs everywhere, the hand leads, rubber bands at limits, throws keep their speed, depth from light |
| calm, gentle, relaxing | no surprises | `--tone quiet`. The soft register; no stagger longer than 50 ms |

## Look

| They write | Do |
| --- | --- |
| dark, dark mode, night | `--dark`. Lit objects on the night ground; depth from lighter surfaces |
| glassy, glass, frosted | One small frosted panel over a real picture (a photo, a map drawn from the subject). Frosting over coloured blobs reads as a template |
| gradient, colourful, vibrant | `--tone bold`, and a flood of the accent for the signature moment. A gradient they insist on stays one hue, on one element |
| neon, glow, cyberpunk | Only when asked: `--dark`, one accent, the glow kept to the one element they named |
| retro, pixel, 8-bit | `--tone editorial`. Pixel drawings on a 16 × 16 grid, whatever imagery the deal names |
| like iOS, like iPhone, Dynamic Island | A black pill that morphs into each state; the crisp register; blur swaps |
| like a dashboard, analytics | `--tone technical`. One chart that matters most, large; the rest as small, quiet numbers. Many identical cards read as a template |
| professional, corporate, serious | `--tone quiet`; no playful bounce |

## Purpose

| They write | Do |
| --- | --- |
| for my landing page, hero, website header | A showcase: full motion; a reel or a live piece at hero scale; calm loop |
| for twitter, X, product hunt, promo, launch | A reel, square (1:1) unless they name a shape, 8–12 s, looping, ending on the product's name; offer the MP4 export |
| for a presentation, for my boss, for a pitch | Large type, 16:9 if it is a reel, a clear headline number; arrival choreography |
| for my app, in my app, settings screen | Product motion: Emil Kowalski's frequency rule (`craft.md`) decides how much moves |
| for my portfolio | A showcase: one signature moment, built to be looked at closely |
| looping, loop, on repeat | A reel whose last frame matches its first |
| interactive, I can click, I can drag | Every part reacts to pointer, touch and keys; the readout or state follows the hand |

## Things they ask for by name

| They write | Do |
| --- | --- |
| confetti, celebrate, party | The object celebrates itself: a check that draws, or a flood of the accent from the point of success. Confetti only when they insist |
| sparkles, particles | Treat as "make it feel special": one signature moment |
| a real photo, a real picture, use a photo (and none of their own) | `node scripts/photo.mjs "<what it shows>"` fetches one openly licensed photo; deal with `--have photos`, and show its credit line in the piece |
| bounce, bouncy | Bounce 0.3 on the signature moment only |
| progress bar, loading | A bar or ring that fills on a spring, then the object morphs into the done state, with the action's name kept ("Upload" becomes "Uploaded") |
| counter, number goes up | The odometer: digits roll and land from left to right, in tabular figures |
| typing, typewriter | Characters arrive in bursts behind a caret, with pauses at spaces and longer ones after punctuation |
