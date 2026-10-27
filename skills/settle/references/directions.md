# Directions

A direction dresses the piece: its material, where it sits on the page, and its one ornament. The request sets the piece's form, and no direction changes it. The dealer deals Card, Instrument and Cut paper; Card and Cut paper also frame reels. The rest come only when the request asks for them (`references/words.md`, `--direction`): Whole screen for a screen, In place for a piece whose place the request names, Glass for glass, Scene for a reel set in a place, and System, Editorial, Split and Stationery for their contexts. Build from the dealt direction's section below. The sheet still supplies every colour, face, corner and shadow. A direction adds layout, drawing and tints of the sheet's own colours.

## Every direction

- **The subject's idea comes first.** In the brief, say what this direction becomes for this subject: Instrument for a plant shop's price filter is a ruler of prices with a tick every £5; Stationery for a booking reel is the restaurant's printed menu. Two pieces in one direction still differ because their subjects differ.
- **The request sets the form.** The structure's file in `references/kinds/` says what comes back: a control at its real size, a composite as one card or panel. No direction changes that: a widget stays one widget, and a full screen comes only when the request asks for a screen. The ground around the piece stays plain, and pictures go inside the piece, where its content needs them. Variety comes from the look and from how the parts sit inside the piece.
- **Tints come only from the sheet**: `color-mix(in srgb, var(--accent) 18%, var(--ground))`, or ink, surface and inset mixed the same way, at 6 to 40 %. No new hues, and no gradients across hues.
- **The direction owns the page.** Its `body` and `#piece` rules replace the base page's centring.
- **Phone first.** Every layout holds at 360 px, and two columns stack below 720 px.
- **The motion stays the recipes'.** One signature moment; what the direction draws stays still while the piece moves, unless the drawing is the signature.
- **Pictures.** The dealt imagery mode says how they are drawn: flat shapes, lines, pixels, or the person's photos. With no photo, draw only what code draws crisply: the subject's place as a map or a plan, its own words or numbers set very large, or its objects as flat shapes. Draw in three levels: big shapes that read at a glance, middle ones that say what the thing is, and two or three small details that reward a closer look (after taste-skill). Never a landscape: hills, skies, water and piers drawn in code read as clip art. Put the drawing where the person's photo can replace it, and name that element in the hand-over. When the person asks for a real photo and has none, `scripts/photo.mjs` fetches one openly licensed photo of the subject's world, and the piece shows its credit line; it never stands in for the person's own product, place or people. Glass and Scene, which paint a picture behind the piece, come only when the request asks for them.
- **Reduced motion and reduced transparency** hold in every direction.

## Card

- **Composition.** One card centred on the ground, at the size it would have in a product: a switch row 320 to 360 px wide, a chart 560 to 720 px. One line of context above it says what it is for ("Notifications, desk app"). A reel keeps the interface at its real size on the plain ground, and the camera frames each state (`references/kinds/flow.md`).
- **Picture and colour.** The piece only; the ground stays plain.
- **Type.** The token table in `tokens.md`.
- **Ornament.** None: the card is quiet, so the signature carries it.
- **Avoid.** A card inside a card; a title that repeats the request.

```css
body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; }
#piece { width: min(360px, 100%); padding: 20px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
```

## In place

- **Composition.** A cropped slice of the screen or page the piece belongs to: the settings list around a switch, the report around a chart, the study page beside a timer. Two to four neighbours with real content, and the piece among them at its real size, whole in view. The slice starts near the top left and on a wide screen runs off the right edge, as a crop of a larger page does.
- **Picture and colour.** Neighbours in ink and muted on the sheet's surfaces; the accent and every move belong to the piece.
- **Type.** The token table; a neighbour's heading takes the title size.
- **Ornament.** None: the neighbours are the context.
- **Avoid.** A neighbour that looks pressable and does nothing; grey bars standing in for text; a drawn status bar, nav bar or sidebar of filler links; rows of identical cards.

```css
body { margin: 0; min-height: 100dvh; overflow-x: clip; padding: 28px 16px 40px; }
#piece { display: grid; gap: 12px; align-content: start; max-width: 560px; }
@media (min-width: 720px) { body { padding: 64px 0 64px 10vw; } #piece { max-width: none; width: calc(90vw + 120px); } }
```

## Whole screen

- **Composition.** No card: the piece fills the page edge to edge, as an app's full screen does. Its headline element, such as the time left, the total or the track's name, is set very large in the upper part, and its controls sit along the bottom, in thumb reach on a phone. On a wide screen the content keeps to 720 px from a line a tenth of the way in, and the field still fills the window.
- **Picture and colour.** One field: the ground, or the accent 8 to 16 % into it. The accent marks only the live value or the primary action.
- **Type.** The headline element on one line at 360 px, weight 700, tight; everything else at token sizes.
- **Ornament.** None: the scale is the ornament.
- **Avoid.** A card floating in the field; controls spread across a wide screen; a headline element that wraps.

```css
body { margin: 0; }
#piece { min-height: 100dvh; width: min(720px, 100%); display: grid; grid-template-rows: 1fr auto; gap: 24px; padding: 32px 20px 28px; }
.big { font-size: clamp(56px, 20vw, 160px); line-height: 0.95; letter-spacing: -0.04em; font-weight: 700; font-variant-numeric: tabular-nums; }
@media (min-width: 820px) { #piece { margin-left: 10vw; padding: 56px 0; } }
```

## Scene

- **Composition.** For a reel: the stage is a drawn place from the subject, such as a desk with a phone for an app's flow. The interface is one object in it at its real size, such as the phone's screen. On a phone, crop the place from the bottom centre so the object stays in view.
- **Picture and colour.** Four to six flat tints: the accent at 12 to 30 % into the ground for far planes, ink at 6 to 18 % for near ones, the surface for lit faces. Large simple shapes such as a tabletop or a wall. Outlines only when the imagery mode is lines.
- **Type.** Only in the piece; the place carries no words.
- **Ornament.** One detail that names the place, such as a candle, in the same tints.
- **Avoid.** Clip-art people and faces, emoji, hills, skies and water, a scene busier than the piece.

```html
<main id="piece" class="scene">
  <svg class="place" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><!-- the place, back to front --></svg>
  <div class="spot"><!-- the piece, where it would really sit --></div>
</main>
```
```css
body { margin: 0; }
.scene { position: relative; min-height: 100dvh; display: grid; place-items: center; overflow: hidden; }
.place { position: absolute; inset: 0; width: 100%; height: 100%; }
.place .far { fill: color-mix(in srgb, var(--accent) 16%, var(--ground)); }
.place .near { fill: color-mix(in srgb, var(--ink) 10%, var(--ground)); }
.place .lit { fill: var(--surface); }
.spot { position: relative; width: min(340px, calc(100% - 32px)); }
```


## Editorial

- **Composition.** A magazine page about the subject: a kicker, a headline at display size, a standfirst, the piece as Fig. 1 with a caption, then two short paragraphs of real copy. On a wide screen the figure may break out of the text column.
- **Picture and colour.** The piece is the figure. A second figure only from the person's photos or a line drawing.
- **Type.** Headline 34 to 64 px, weight 700, tracking −0.03 em; standfirst 19 px in muted; body 17 px with 1.6 leading, about 62 characters a line.
- **Ornament.** Hairline rules, a folio ("Page 14") and the figure number.
- **Avoid.** Placeholder copy, or copy about the design; a headline naming the component. Write about the subject.

```css
body { margin: 0; padding: 32px 20px 56px; }
#piece { width: min(680px, 100%); margin: 0 auto; }
.kicker { font-size: 13px; color: var(--muted); }
.head { margin: 8px 0 12px; font-size: clamp(34px, 9vw, 64px); line-height: 1.02; letter-spacing: -0.03em; font-weight: 700; text-wrap: balance; }
.stand { margin: 0; max-width: 36ch; font-size: 19px; line-height: 1.45; color: var(--muted); }
figure { margin: 28px 0 24px; }
figcaption { margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--inset); font-size: 13px; color: var(--muted); }
.body p { max-width: 62ch; font-size: 17px; line-height: 1.6; }
```


## Instrument

- **Composition.** The piece is the face of a measuring instrument: a bezel around the face, a scale with ticks along the edge the value moves on, and an index or needle at the value. The scale takes the shape of the subject's own instrument, such as an arc for a gauge, a ring for a dial or a column for a thermometer; a straight rule suits only a subject that is measured along a line.
- **Picture and colour.** Line work in ink at 25 to 45 %; the accent only on the needle or the live value.
- **Type.** Scale numbers in the text face at 11 to 12 px with tabular figures; the live value large.
- **Ornament.** A tick every unit, a longer one every five, and the bezel.
- **Avoid.** Screws, rivets, fake metal or leather; monospace for the scale, which `tokens.md` keeps for time codes.

```css
body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 16px; }
#piece { position: relative; width: min(380px, 100%); padding: 24px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
#piece::before { content: ""; position: absolute; inset: 8px; border-radius: max(0px, calc(var(--radius) - 8px)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ink) 16%, transparent); pointer-events: none; }
.scale { display: flex; justify-content: space-between; align-items: flex-start; height: 12px; }
.scale i { width: 1px; height: 6px; background: color-mix(in srgb, var(--ink) 40%, transparent); }
.scale i:nth-child(5n + 1) { height: 12px; background: var(--ink); }
```

## Cut paper

- **Composition.** The piece is the top of a small stack of paper: two or three sheets under it, each a different tint, offset a few pixels and turned by at most 1.5°. Flat shapes cut from paper carry the picture, such as leaves, a plate or a record.
- **Picture and colour.** Tints of the accent at 18 to 35 % and of ink at 8 % for the lower sheets; the top sheet is the surface.
- **Type.** Token sizes; a heading may sit on a paper tab.
- **Ornament.** One paper tab or strip of tape, in a tint.
- **Avoid.** Shadows beyond the material's; torn-edge clip-art; more than three layers; a turned sheet that holds text.

```css
body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 32px 20px; }
#piece { position: relative; width: min(360px, 100%); isolation: isolate; }
.sheet { position: relative; padding: 22px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.layer { position: absolute; inset: 0; z-index: -1; border-radius: var(--radius); box-shadow: var(--shadow); }
.layer.one { translate: 8px 10px; rotate: 1.2deg; background: color-mix(in srgb, var(--accent) 28%, var(--ground)); }
.layer.two { translate: -7px 18px; rotate: -1deg; background: color-mix(in srgb, var(--ink) 8%, var(--ground)); }
```

## Stationery

- **Composition.** The piece is printed on a real object that belongs to the subject: a restaurant's menu card or a ticket with a stub. It sits on the ground under the material's shadow.
- **Picture and colour.** Printed details in ink and the accent; the paper is the surface.
- **Type.** The object's own hierarchy, such as a menu's dish names or a ticket's seat and time, at token sizes.
- **Ornament.** One printed detail: a perforated stub with a notch at each end, a stamp in the accent, or a tag's hole and string.
- **Avoid.** Handwriting faces, stains, fake wear; ruled lines as repeating gradients. Draw rules as row borders or in SVG.

```css
body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; }
#piece { position: relative; width: min(360px, 100%); padding: 24px 22px 28px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }
.stub { position: relative; margin: 20px -22px 0; padding: 16px 22px 0; border-top: 2px dashed color-mix(in srgb, var(--ink) 28%, transparent); }
.stub::before, .stub::after { content: ""; position: absolute; top: -10px; width: 18px; height: 18px; border-radius: 50%; background: var(--ground); }
.stub::before { left: -9px; } .stub::after { right: -9px; }
.stamp { display: inline-block; padding: 2px 8px; border: 2px solid currentColor; border-radius: 6px; color: var(--accent); font-weight: 700; rotate: -4deg; }
```


## Split

- **Composition.** For a chart going into a presentation: one half holds the takeaway as one large line, the other the chart. The takeaway says what the chart shows ("Priya closed the most tickets, 31", "Sales up 18 % on last year"), so it never repeats a number the piece already shows on its own. On a phone the takeaway stacks above the chart.
- **Picture and colour.** The statement on a tint of the accent, 10 to 16 % into the ground, or on the surface; the piece on the ground.
- **Type.** The takeaway at 32 to 64 px, weight 700, tight, in two lines at most; it updates with the chart through a blur swap.
- **Ornament.** None.
- **Avoid.** A takeaway that repeats the chart's label or one of its numbers bare; centring it. Set it to the bottom left.

```css
body { margin: 0; }
#piece { min-height: 100dvh; display: grid; grid-template-rows: auto 1fr; }
.say { display: grid; align-content: end; gap: 8px; padding: 32px 20px 24px; background: color-mix(in srgb, var(--accent) 12%, var(--ground)); }
.say b { font-size: clamp(32px, 8vw, 64px); line-height: 1.05; letter-spacing: -0.03em; font-weight: 700; text-wrap: balance; }
.work { display: grid; place-items: center; padding: 28px 16px; }
@media (min-width: 820px) { #piece { grid-template-rows: none; grid-template-columns: 1fr 1fr; } .say { padding: 56px; } }
```

## Glass

- **Composition.** A full-bleed picture fills the viewport: the person's photo, or one drawn in tints of the palette as Pictures (above) says, such as a map of the subject's street or its own words set very large. The piece's surfaces are glass panels over it, after Liquid Glass in Apple's iOS 27 kit (its Materials page). The picture comes from the subject: abstract colour blobs under glass are banned.
- **Picture and colour.** The drawn picture in four to six tints of the accent and ink into the ground, with one large light area where the glass sits, so text keeps its contrast.
- **Type.** The system face, dealt with this direction: San Francisco on Apple devices. Labels over glass take weight 600 and full ink.
- **Rules from Apple's material guidance**, as the apple-design skill sets them out: one layer of glass, never glass on glass; a bigger panel blurs more; text over glass a step heavier; with reduced transparency the panels turn solid. A slider's thumb is a white capsule that swells into a clear lens while held, as in the kit.
- **Ornament.** The glass is the material.
- **Avoid.** Glass over a flat ground, where it reads as grey; rainbow edges; stacked panels; body text on glass.

```css
body { margin: 0; }
#piece { position: relative; min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px; overflow: hidden; }
.picture { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; } /* their photo as an <img>, or an <svg> drawn in tints */
.glass { position: relative; background: color-mix(in srgb, var(--surface) 58%, transparent); -webkit-backdrop-filter: blur(22px) saturate(1.7); backdrop-filter: blur(22px) saturate(1.7); border-radius: var(--radius); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.55), var(--shadow); } /* settle-allow: glass big-blur (the one pane this direction allows) */
@media (prefers-reduced-transparency: reduce) { .glass { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; } }
```

## System

- **Composition.** The piece as it would ship in an iPhone app, after Apple's iOS 27 kit: a large title, then grouped surfaces, rounded groups of rows on the grouped background. The piece is a row, a group or a sheet in it.
- **Picture and colour.** None. The accent is the app's tint: the selected segment, the slider's fill, the primary button.
- **Type.** The system face: large title 34 px bold, row labels 17 px, footnotes 13 px in muted.
- **Controls, from the kit.** A segmented control is a capsule track in the inset colour with a capsule thumb in the surface and a soft shadow. A slider's thumb is a white capsule about 38 by 24 px that swells into a clear lens while held. Switches and buttons are capsules.
- **Ornament.** None; separators between rows start at the text's left edge.
- **Avoid.** A drawn status bar or home indicator; Apple's symbols copied as images (draw simple SVG icons); dark mode the subject didn't ask for.

```css
body { margin: 0; background: color-mix(in srgb, var(--inset) 55%, var(--ground)); }
#piece { width: min(440px, 100%); margin: 0 auto; padding: 56px 16px 32px; }
.title { margin: 0 4px 18px; font-size: 34px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.group { padding: 4px 0 4px 16px; background: var(--surface); border-radius: 26px; }
.row { min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-right: 16px; box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--ink) 10%, transparent); }
.row:last-child { box-shadow: none; }
```

## Sources

The sections follow the order of a DESIGN.md file, the format Google Stitch introduced for handing an agent a design. Glass and System follow Apple's iOS 27 and macOS 27 UI kits (Materials, Sliders, Segmented Controls) and the material rules in Emil Kowalski's apple-design skill (MIT); settle ships none of Apple's assets. Scene and Editorial put into practice the frontend-design skill's advice to commit to one direction drawn from the subject (Anthropic, Apache 2.0).
