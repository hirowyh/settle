# Craft

The motion craft every piece follows, whatever its look. A look deals the colours, the type, the shape and one motion register; nothing in this file changes with it. The numbers live in `assets/kernel.js`; `references/motion.md` holds a recipe for each kind of change.

Where a source disagrees with this craft, the craft wins: springs up to 0.85 s carry a reel's large moves past a 300 ms cap, a bounce of up to 0.2 stays where some skills ban bounce, labels stay in sentence case, and Geist is one face the dealer may deal.

## 1. The gate

Before anything moves, name its purpose: feedback, a state change, where something came from, an explanation, or delight. A move with no purpose doesn't happen, and data a person is reading doesn't move for style. Then ask how often a person will see it (Emil Kowalski's frequency rule):

| Seen | Motion |
| --- | --- |
| A showcase: a portfolio piece, a demo, any reel | The full register |
| 100 or more times a day: a shortcut, a palette opening | None; it changes at once |
| Tens of times a day: hover, moving through a list | Fast and slight, 0.2 s or less, or none |
| Now and then: a sheet, a toast, a filter | The register |
| Rarely: a goal reached, a first run | The signature moment lives here |

An action started from the keyboard inside a working product changes at once. A person can always interrupt: no input waits for an animation to finish.

## 2. Registers

A register sets tempo and curve. The dealer picks one per look and a piece names it once (`settle.register("soft")`); every recipe reads its presets.

| Register | Feel |
| --- | --- |
| `crisp` | Quick springs on every move, overshooting slightly: a morph takes 0.365 s with bounce 0.185 |
| `soft` | Eased moves near 0.5 s that start slowly; arrivals glide, none spring |
| `smooth` | Eased grows near 0.7 s; folds and arrivals settle on springs |

Every register has the same presets: `morph` and `fold` for a shape growing and folding back, `front` and `back` for an indicator's two edges, `pop` for something appearing, `fade` for colour and opacity, `count` for a shown number, `throw` for a value the hand lets go. Moves may overshoot a little; colour, opacity and shown numbers never do (Material Design's split between spatial and effects springs). A release always rides a spring, because only a spring can carry the hand's speed. Under reduced motion, `settle.register()` returns the calm set by itself: moves land at once, colour and opacity keep a 0.15 s fade, numbers show their final value. Durations live only in the kernel; a look names its register and never copies a number.

## 3. The motion grammar

Any interface breaks into eleven kinds of change. Each kind has one answer, so a request nobody wrote a recipe for, such as a kanban board, breaks into changes settle already knows.

| Kind | The move | Presets | Interrupted | Calm | Recipes |
| --- | --- | --- | --- | --- | --- |
| Appears or leaves | From a short blur with a small rise; a group arrives in order, rows 37 ms apart and labels 67 ms; it leaves the way it came, faster | `fade` for opacity, `pop` for the rise | Retargets from where it is | A 0.15 s fade | Arrive, Mask rise, Typing, Letters on a beat |
| Moves or reorders | Every item springs to its new slot; the gap closes | `morph` | Keeps its speed | Lands at once | Reorder, List filter |
| Grows into something else | The shape on screen takes the next state's width, height and radius; the old content blurs out and the new blurs in at its final size; a new container grows from behind the object that stays; colour across a scene floods from what caused it; a picture opens in a circle from a point | `morph`, `fold`, `fade` | Keeps its speed | Lands at once, content fades | Morph, Iris, Flood, Pixel morph |
| Swaps its content | The old label blurs out, then the new one blurs in; the two never overlap | `pop` | Reverses from where it is | A short cross-fade | Blur swap |
| Changes a value | A big number rolls per column and lands left to right; a small one steps through whole values; a dragged value sits under the hand | `count`, `morph` | Keeps its speed | The final value | Ticker, Count-up, Range, Volume |
| Changes the selection | The indicator's front edge leads on the faster spring; labels take its colours where it covers them | `front`, `back`, `fade` | Keeps its speed | Lands at once | Stretch, Toggle |
| Updates its data | Marks retarget mid-flight, one after another; a line draws in; a readout snaps to the nearest point | `morph`, `count`, `pop` | Keeps its speed | Lands at once | Bars, Draw-in, Route, Readout |
| Follows the hand | Exactly under the pointer from where it was grabbed; past a limit, an object that stretches as a whole follows a rubber band; let go, it carries the hand's speed into a spring | `throw` | The hand takes over | Follows the hand; no throw | Volume, Throw, Range |
| Confirms | A pressed control dips to 0.97 and springs back; the action runs on `click`; a check draws itself | `pop`, `count` | Retargets | No dip | Press, Check |
| Waits | A loader turns at a steady rate; time and progress move linearly or on `count` | linear, `count` | Shows the new state | Static | Check, Time sweep |
| Changes screen | In a reel, the camera sizes each state and moves to the next; a new scene grows out of something in the old one; the reel ends on its opening frame | `morph`, `fade` | Seekable at any frame | The first frame, paused | Camera, Scene handoff |

Material Design's transition patterns map onto these: its container transform is "grows into something else", and its enter and exit expand away from the edge a component belongs to.

## 4. Fixed rules

1. **The shape carries over.** The shape already on screen becomes the next state's container. Two separate cards never crossfade, and nothing slides in from nowhere.
2. **Every move settles.** Bounce stays at 0.2 or less, 0.3 for a signature moment; nothing wobbles. A move whose target changes mid-flight keeps its speed. In numbers: state-to-state springs of 0.35–0.39 s; pop-ins of 0.26–0.34 s with bounce 0.05; scripted grows on cubic-bezier(.45,0,.15,1) over 0.48–0.84 s.
3. **Front edge first.** A moving indicator's front edge runs on a spring about 1.75 times faster than its back edge (0.24 s against 0.42 s), so a 354 px indicator stretches to 467–470 px and settles.
4. **The hand leads.** A dragged value stays within a few pixels of the pointer (2.5–5.5 px) from where it was grabbed; past a limit it follows `96 · tanh(over / 96)`; a release hands over the speed of the last 0.1 s of samples, and none after 0.1 s of stillness. A flick dismisses when it passes 600 px/s or 40 % of its width.
5. **Words and numbers move at reading speed.** A total ticks for about half a second and its digits land left to right within 0.12 s; a temperature steps every 0.133 s; a mask rise takes 0.27–0.33 s; typing runs 7.6–25.6 characters a second in bursts. A changed label goes through a blur swap.
6. **Groups arrive in order.** Rows 37 ms apart, tab labels 67 ms; stagger only arrivals, never more than 80 ms an item.
7. **Restraint and depth.** One ground, one ink, one or two accents; hierarchy from size, a big tight number above a small label; colour across a scene changes by a flood, inside a control it tweens.
   **Depth from light.** Shadows fall below an object, never around it; something the hand holds rises to 1.02–1.03 on the lift shadow. On a dark look, depth is a lighter step.
8. **Real content.** Plausible names, values, dates and times; weekdays computed from their dates; an action keeps its name through a flow, so "Book for 4" becomes "Booked" and then "Table for 4 at 19:30"; related numbers agree. Imagery is the person's own photos or drawn in code.
9. **One signature moment.** One physical touch belongs to the subject and reads at once, such as a Start button that drains into the timer's bar; everything around it stays quiet.
10. **Reels move on a grid.** Events start on a 0.25 s grid, eighth notes at 120 BPM; the camera sizes each state to 60–80 % of the frame and edges closer, 1.2–3.3 % a second, while it holds; the reel ends on its opening frame.
11. **For everyone.** Pointer, touch and keys all work; focus shows; targets are 44 px; at 360 px wide nothing scrolls sideways and no text is under 11 px; under reduced motion state changes stay and travel goes.

**Banned on every piece unless the request names it:** gradients across hues on grounds, charts, buttons or text; glows and coloured shadows; a black ground for a subject that doesn't happen in the dark, or a loud pink one; frosted panels over coloured blobs; confetti, particles and sparkles; attention loops such as pulsing dots, bouncing arrows and cursors that blink forever; labels in tracked capitals, or a label above every heading; flat motion with no spring and no change of light; template layouts; `transition: all`, entrances from `scale(0)`, `ease-in` on interface motion; fake motion blur on a live page.

## 5. Gotchas

Faults already found once in earlier builds and try-outs, each with the rule that keeps it out and the check that catches it.

**Shape and motion**
- Corners balloon when a pill opens into a card. Spring the real radius; a pill's radius is half its height. *Check:* frames mid-morph.
- A dark shape passes through grey on its way to a light one. Keep each shape's colour: grow the new container from behind, or flood; under reduced motion the colour lands with the state. *Check:* frames mid-change.
- Two labels overlap mid-swap, or a label is gone before it can be read while its card grows. The old text clears before the new text enters, and the new text waits until the shape has room for it. *Check:* frames.
- The edge of the card below shows past a picture or shape while it grows. Whatever grows covers its source completely at every frame. *Check:* frames mid-grow.
- A container's height springs ahead of its folding items, so what sits below slides under them. The height follows the last moving item. *Check:* frames.
- A drained flood leaves a dot behind, a flood still shrinking overlaps the next scene, or a flood that starts at full speed looks like a jump. Floods ease in, complete before the next state, and close all the way (the kernel counts the last 0.2 % as closed). *Check:* frames after a drain.
- A picture jumps as its circular reveal completes. Place the picture at its resting position from the first frame and animate the clip alone. *Check:* frames.
- Text goes soft while the camera zooms. Layers the camera scales get no `will-change`, so the browser redraws their text at each size. *Check:* search the code for `will-change`.
- A loop hitches at the seam. The final frame repeats the opening frame exactly, down to where the cursor is and how fast it is moving. *Check:* compare a reel's first and last frames.
- A drag let go after a pause flings, or a burst of samples throws it. The release speed spans 0.1 s of samples and is zero after 0.1 s of stillness (kernel). *Check:* drag, hold still, let go.

**Values and data**
- Every digit rolls when one changes. Only changing columns turn. *Check:* frames.
- Half-rolled digits under about 24 px read as broken glyphs. Small figures step through whole values. *Check:* frames.
- A shown number overshoots its value. Numbers ride `count`, which never overshoots. *Check:* frames.
- A readout shows at rest, or a scroll moves it. Nothing shows at load; hover, a tap and keyboard focus show it, a touch scroll never selects, and a tap outside hides it. *Check:* load, scroll past with touch, tap outside.
- Every sample item says "now", so nothing shows which came first. Sample items start with their times already spread out (2 min, 1 h, yesterday), and only new ones say "now". *Check:* the times at load.
- A readout invents values between points. It snaps to the nearest point, names it and shows its exact value. *Check:* eye on the readout.
- A switch changes half the view. It updates everything that depends on it, the headline included. *Check:* eye.
- Two handles cross or leave their line. Each stops one step from the other and at the end of its track, and a handle draws small with a 44 px target; a rubber band belongs only to an object that stretches whole. *Check:* drag one into the other and past the end.
- A range cannot select a small range. It can select a range as small as one step, one histogram bar, and the track sits below the bars so no handle covers one. *Check:* set the two handles one step apart.
- A press on a slider's track does nothing. The nearest handle comes to the press. *Check:* click the track.
- A fill doesn't stretch with its stretching container. At full value the fill stretches too. *Check:* drag past the end.
- Shades that must be told apart sit too close. Marks for different states differ by 3:1 from each other and from the ground (WCAG 1.4.11). *Check:* contrast of state colours.

**Input and access**
- A second finger leaves a control stuck. Track each pointer by its `pointerId`. *Check:* two-finger drag.
- A row sticks to the mouse with no button held. A drag that starts only after the pointer moves a few pixels never hears a release outside the piece, so the next move over the list picks the row up. Capture the pointer on `pointerdown`, and start a drag only while `e.buttons` holds a button. *Check:* with a mouse, press on a row's words, slide off the piece sideways, let go, then move over the list.
- A label vanishes from a row the highlight has left. Chrome keeps the old value of text tinted with `color-mix()` of `currentColor` when script changes its parent's colour, so a country code stayed light on its light row. Tint such text from the sheet's colours, or dim it with `opacity`. *Check:* lint, then hover across a menu's rows with a mouse.
- A control ignores a plain click. Every action runs on `click`; pointer and key handlers only add the feel. *Check:* `element.click()` changes state.
- A drag leaves the keyboard focus ring behind. Script moves focus only on keyboard paths (a keyboard `click` has `detail` 0). *Check:* `:focus-visible` after a mouse drag.
- Focus drops to the page when the focused control goes away. Focus moves to what takes its place; an open overlay keeps focus inside or closes when it leaves. *Check:* `document.activeElement` after each step.
- A page shortcut overrides the focused button. Shortcuts skip focused buttons and fields. *Check:* Space on each button.
- Shortcut hints that do nothing. Show a shortcut only when it works, and never one the browser keeps: ⌘N, ⌘T, ⌘W and ⌘L. *Check:* eye.
- A list row answers only over its text. The whole row is the target, and a press keeps focus in the field. *Check:* click the row's blank part.
- An outside tap doesn't close what a tap opened on a phone, where iOS keeps focus. An outside tap closes it; only keyboard focus opens things on focus. *Check:* tap outside on a phone.
- Rolling digits read as "0 1 2 3 4 5 6 7 8 9 0 0 1 2…". Digit strips are `aria-hidden` and the value is text. *Check:* the accessibility tree.
- A card that is one big button may hide its facts from screen readers. The expand control is a button inside the card. *Check:* VoiceOver.
- Touch targets under 44 px. Size them up or add an invisible hit area. *Check:* measure at 390 px.
- Muted text fails contrast off its home surface. Check it on every surface it sits on, 4.5:1 under 24 px. *Check:* contrast probe.
- A control or icon says one thing and does another. It does what its name and icon say. *Check:* eye.
- A date names the wrong weekday. Compute weekdays from dates with `Intl.DateTimeFormat`. *Check:* each weekday-and-date pair against the year the piece implies.

**Fitting**
- A label hides the lines behind it with a box of the background's colour, or a count floating over the page lands on the text behind it. Place labels where no line or other label crosses them, and a line may stop short of its label; text that floats over other content stands on its own surface. *Check:* eye on every label, with the lines drawn and everything open.
- On an iPhone, a reel's text grows on its own and its blocks land in the wrong slots. WebKit enlarges text inside a wide layout (text autosizing), so positions read at load differ from what is drawn: the shells set `-webkit-text-size-adjust: 100%`, and a reel places everything from its own world numbers and reads no layout. *Check:* the reel in WebKit on an iPhone, and a search of the reel for `offsetLeft` and `getBoundingClientRect`.
- A list that grows past its room leaves the rest out of reach: a fanned stack showed four notifications and hid the others. The list scrolls inside its own box, so every item can be reached. *Check:* add items until they pass the screen, then scroll to the oldest on a phone.
- The piece collapses to its narrowest part when its width sits inside `#piece`. Give `#piece` the width itself. *Check:* the piece's width at 390 px.
- A value read from layout goes stale when the web font arrives. Read it again on fonts ready and on resize, and apply it again to everything drawn from it. *Check:* throttle the network and compare the indicator with the label.

**Phones and performance**
- A piece laid out at a fixed size and scaled by script opens too big on a phone with its left side cut off, and its labels shrink under 11 px. Lay it out at its real size in CSS and reflow at 360 px; never size from `innerWidth`. *Check:* overflow with phone emulation on, and the smallest text.
- A thrown card widens the page. The page or its container clips sideways overflow. *Check:* overflow after a throw.
- A field under 16 px makes iOS zoom the page. Fields are 16 px or more. *Check:* computed font size.
- A piece at rest keeps working every frame (3.2 ms a frame on a slowed CPU). Once every value has settled, the loop skips its writes or stops until input. *Check:* idle cost with the CPU slowed.
- Layout read in the frame loop. Measure once and on resize. *Check:* review.
- A thin purple line along the edge of text while it blurs, seen in Safari on iPhones running iOS 27, which draws stray lines along a blur it paints in place. Every blur goes through `settle.blur(el, px)`, which gives the element a layer of its own while it is blurred. *Check:* lint, then the piece in Safari on an iPhone; the simulator on a Mac does not show the line.
- On an iPhone a rolling figure loses its right edge, and a hairline marks the cut. A figure tightened past its window overflows it, and `overflow: hidden` cuts it there. A window that clips moving text, a digit's or a mask's, clips only at the top and bottom: `clip-path: inset(0 -0.25em)`. *Check:* the figure at rest in Safari; the simulator shows the cut.
- A dashed line drawn as one border of an empty box shows in Safari as a single dash: a chart's vertical average line drew only its top end. Draw a line as a box with its own width and height filled by a repeating gradient, or as an SVG line with `stroke-dasharray`. *Check:* the piece in Safari; the simulator shows it.
- A tap flashes a grey box over a control on an iPhone, out of step with the control's own press. Each control turns the flash off itself with `-webkit-tap-highlight-color: transparent`, since a page in the person's project lacks the base page's reset. *Check:* a tap in Safari on a phone or in the simulator.

**Tools**
- Checks that inherit the Mac's Reduce Motion show every frame calm. Set `prefers-reduced-motion` explicitly; snap.mjs does.
- A hidden browser pane or a window behind others throttles frames, so live timing there lies. Judge timing on a stopped clock, as snap.mjs does.
- State a piece keeps in its draw loop changes only at shot times on a stopped clock. snap.mjs plays the frames between steps; pieces still work out styles from time and keep state changes in handlers.

## 6. Sources

- [Emil Kowalski's skills](https://github.com/emilkowalski/skills) (MIT): the gate and the frequency rule, the purposes, springs for anything interruptible, the release speed from a short history of samples, the flick threshold, rubber-banding, ignoring extra fingers, hover gated to fine pointers, the bans on `scale(0)`, `transition: all` and `ease-in`, staggers of 30–80 ms, leaving the way it came, and reduced motion as fewer, gentler moves.
- [impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0): content hidden at rest, text covered by another element, a clipping container that cuts a tooltip, undersized text, low contrast, and attention loops.
- [Vercel's web interface guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT): honour reduced motion, animate transform and opacity, set the transform origin (`transform-box: fill-box` in SVG), keep animations interruptible, give autoplay over 5 s a pause, stop decorative loops under reduced motion, read no layout in the frame loop, offer tap and keyboard alternatives to gestures, and format dates with `Intl`.
- Apple's [Human Interface Guidelines on motion](https://developer.apple.com/design/human-interface-guidelines/motion): motion with a purpose, brief feedback, less motion on frequent interactions, motion people can cancel, feedback that follows the gesture's direction, and no sustained oscillation near 0.2 Hz.
- Google's [Material Design motion](https://m3.material.io/styles/motion/overview/how-it-works): moves may overshoot while colour and opacity don't, larger areas move more slowly, entering takes longer than leaving, and the container transform.
