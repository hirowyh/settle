# A composite

Several parts working together on one card or panel: a music player, a timer, a weather card, a to-do list. Requests sound like "a small music player card" or "pomodoro timer for my study site that i can start, pause and reset".

## What comes back

One card or panel on the look's ground, about 320–380px wide at phone size, as one page or as a component in the person's project, holding real content such as song titles and times. It does the job the person named. A timer counts, a list reorders, a player scrubs.

## Anatomy

- **The card** stands off the ground by the dealt material: a soft shadow, or a tone step from the ground, which is how every dark look does it. Its corners are the sheet's `--radius`; no border.
- **A headline element**: the big number or title the widget exists for (the time left).
- **One primary action**, and every other control quieter than it.
- **Something live**: a time that ticks on `settle.now()`, a progress that fills, a value the hand drags. A widget that sits still until hovered reads as a picture of a widget.
- **Every state change by the rules**: the primary action morphs into what it starts (a Start button becomes the draining bar), content swaps through a blur, numbers roll, rows arrive in order.
- **Keys and touch** for every control; aria-live for changes the person cannot see happen.

## The signature moment

- The action becomes the thing it starts: Start becomes the timer's bar (Morph, Count-up).
- A row lifts to the hand and the list opens a gap under it (Reorder).
- The route draws itself and the plane glides to where the flight is now (Route, Ticker).
- The stack fans out, and a fling keeps the hand's speed (Throw, Arrive).
- A small pill grows into the whole player and back (Morph).

## Imagery

Photos come from the person: cover art. Without them, draw in code as `references/directions.md` (Pictures) says: a few SVG marks on the tile colour, or a route on a grid. Emoji stand in for nothing.

## Pitfalls

From the baseline's widgets:

- The motion and depth die once it loads: flat cards, hover-only effects, nothing ticks.
- The SaaS card kit: identical rounded panels under one grey shadow, an icon in a circle on each.
- Placeholder content: "Song Title", "Artist Name", 00:00, round numbers.
- A countdown that cannot be tested: read time from `settle.now()` so snap.mjs can jump to the end.
- Controls crammed into 360px. Drop the least useful control before shrinking anything below 44px.

## Recipes to start from

By the kind of change each part makes (`references/craft.md`, section 3), so a request nobody wrote a recipe for still finds its moves.

| The parts | Kind of change | Recipes in `references/motion.md` |
| --- | --- | --- |
| an action becomes what it starts | grows into something else | Morph, Count-up |
| content that swaps in place | swaps its content | Blur swap |
| items that reorder or filter | moves or reorders | Reorder, List filter |
| something that travels or progresses | updates its data | Route, Ticker |
| items that arrive, leave or are flung | appears or leaves, follows the hand | Arrive, Throw |
| a time that runs | waits | Time sweep, Count-up |
