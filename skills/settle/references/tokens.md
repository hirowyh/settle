# Tokens

How a piece takes its look, and the rules for accent, shape, depth and type that hold in every look. The colours, faces, shapes, materials, imagery modes and registers live in `library/`, and `scripts/deal.mjs` deals them.

## Dealing a look

1. **Inside a project, inherit its look.** Deal with `--project` from the project's root: the first look picked there is saved in `.settle/look.json`, and every later deal with `--project` prints that look again. A project with colours or fonts of its own keeps them: add `--keep palette`, `--keep type` or both, and map the project's colours onto the sheet's variables. Outside a project, every request gets a fresh look.
2. **Otherwise deal one.** `node scripts/deal.mjs --brief "a small music player card"` prints three looks. Add `--tone` when the request names a feeling (`references/words.md` maps the words to tones), and `--dark` when the subject happens in the dark or the request asks for dark: night or sleep. Nothing else starts dark. The library has no loud single-colour grounds: a bold request gets a strong accent on a calm ground, and the colour can flood the scene for one moment.
3. **Build look 1**, the dealt look, with `--pick 1`. The seed deals it: a model left to choose takes the most striking option every time, and settle's early test pieces converged on it. Take look 2 or 3 only when look 1 clashes with the subject, naming the clash with `--because`. `--pick` prints the sheet to paste into the page's head. When one part clashes, `--redeal direction` (or `palette`, `type`, `shape`, `material`, `imagery`, `register`) deals that part again. Every part avoids what the last six deals used most.
4. **A subject with colours of its own** (rain, tea, a cinema, a bank's brand) keeps the dealt proportions and takes its own colours: the ground from its light or material, ink 7:1 on every surface, muted 4.5:1, and the accent 3:1 against everything it sits on.

Write the choice into the brief: "Instrument: the timer is a kitchen timer's face, minute ticks round a bezel; look 1, putty and black, Hanken Grotesk, tone steps." The direction's section in `references/directions.md` sets the page's composition, drawing and type scale.

**Where generated pages cluster.** In settle's own test, 24 beginner requests built by a capable model with no skill: 17 pages used gradients, 14 glow shadows and 1 spring code; most sat on a dark ground with blue or violet accents and system fonts. Anthropic's frontend-design skill (Apache 2.0) lists more defaults that appear whatever the subject: a warm cream ground with a serif display and a terracotta accent; identical rounded cards under the same soft grey shadow; tracked capital labels above headings; meta strings joined with middle dots; tinted near-black standing in for black; monospace for small labels; an arrow appended to links. Before building, write the brief, then picture what any similar request would get, and change each part of the brief that matches that picture.

## Accent

One accent marks the one thing that matters now: the selected bar or the primary action. Everything else is ink and greys. A chart that compares two series may use a second accent. Categories beyond two get ink at stepped strengths (100, 70, 45 and 25 %), with the accent on the one in focus. On a dark look, small category marks such as a dot may take soft colours at one lightness, never large fills.

## Shape

- **Cards take `--radius`, controls `--round`.** With round controls a pill is a full pill: its radius is half its height.
- **Rows inside a card** round by a quarter of their height, and never more than `--radius`.
- **Nested corners**: inner radius = outer radius − padding, so the gap stays even.
- **One shape grows into the next.** A pill that opens into a card springs its radius from the pill's to the card's. Spring the real width, height and radius, because scaling a pill into a card stretches its corners.

## Depth

The dealt material sets `--shadow` and `--shadow-lift`. Shadows fall below objects only, with a tight dark core and a wide, faint spread, and the ground above an object stays clean. In numbers: black shapes darken the ground by 55–61 levels just below them and fade out by 66–125px; white cards darken it by 19–21 levels and fade out by about 100px. Edges come from contrast alone: no borders on cards. A held object rises on `--shadow-lift` and scales to 1.02–1.03.

Under tone steps, and on every dark look, depth comes from lightness: ground, surface, inset, each a step apart. Shadows cannot be seen on a dark ground, and glows are banned.

Glass (`backdrop-filter` blur with a light tint) belongs to the Glass direction, over the person's photo or a picture drawn from the subject, such as a map. A frosted page over coloured blobs is banned.

## Type

The dealt type entry gives one face for text and numbers and one for time codes, from a single Google Fonts link, each with a named system font behind it, so every piece still reads well in the fallback. Every face in the library has tabular figures.

| Role | Size at phone width | Weight | Tracking | Notes |
| --- | --- | --- | --- | --- |
| Big number | 40–64px | 700 | −0.035em | line-height 1; about 3.2 times its label's size; Split and Whole screen set theirs larger |
| Title | 17px | 600 | −0.01em | sentence case |
| Body | 15px | 400 | 0 | line-height 1.4 |
| Label | 13px | 400–500 | 0 | `--muted`, under the number it names |
| Time code | 13px | 400 | 0 | `--mono`; track times, schedule times, durations |

- The hierarchy comes from size and weight: a big, tight number above a small grey label.
- Every number that changes uses tabular figures: `font-variant-numeric: tabular-nums`.
- Monospace is for time codes only. Small data labels stay in the text face.
- Sentence case everywhere. Labels in tracked-out capitals above a heading are template chrome.
- Nothing smaller than 11px. A label that needs to be smaller needs less text.

## Timing

A look names one motion register, `crisp`, `soft` or `smooth` (`references/craft.md`, section 2). The kernel holds every duration and spring, so a look never copies a number.
