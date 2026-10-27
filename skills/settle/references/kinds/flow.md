# A flow over time

States that play by themselves, one after another: most often a looping demo reel of an app's flow driven by a scripted cursor, which a person posts on X or puts in a landing page's hero; sometimes a story in kinetic type and drawn objects. Requests sound like "a short looping animation that shows off my todo app" or "10 second promo animation for my habit tracker app, to post on twitter".

## Storyboard first

A reel is a story, and a wrong story wastes the whole build. Before building, show a storyboard and wait for a yes:

```
Booking a table, a dealt look, 1:1, 10 s loop
0.0  "Book a table" pill holds, framed large
1.0  cursor presses; the card grows out from behind the pill
2.5  taps 19:30; the indicator stretches to it
3.75 taps + twice; guests roll 2 → 4
5.0  presses "Book for 4 at 19:30"; the card folds back to a pill: Booking, then Booked
7.0  the pill widens into the toast "Table for 4 at 19:30, Friday"; the camera edges closer
8.75 back to "Book a table" (frame 0)
Signature: the black pill is one object the whole way.
```

Times sit on the 0.25 s grid. Name the look and the shape. One line says what the reel proves about the app.

## Anatomy

- **The shell**: `assets/reel.html`. Set `WORLD` (1080 × 1080 for square, 1920 × 1080 for 16:9), `DURATION` (8–14 s), the `CAMERA` keys and the `CURSOR` keys, and write the scene in `render(t)`. Each frame's styles depend only on `t`, so the scrubber and `window.reel.seek` can show any frame.
- **One object** that persists from the first frame to the last, the app's primary action. Containers grow out from behind it and fold back into it; it changes its label, never its identity.
- **The cursor** is the actor: it arrives, presses on the grid, and the pressed control dips with it. Aim it with `project(x, y, t)`.
- **The camera** sizes each state to 60–80 % of the frame and edges closer, 1–3 % a second, while a state holds.
- **Text** arrives by a mask rise, by typing behind a caret, or as rolling digits.
- **The loop**: the last frame equals the first. Check `seek(0)` against `seek(DURATION - 0.01)`.

## Look

A dealt look by default (`scripts/deal.mjs`). Dark grounds (`--dark`) only when the app's subject happens in the dark (a cinema, sleep) or the person asks for it. When the app has a world of its own (a tea shop), the dealt look takes that world's colours (`references/tokens.md`).

## The signature moment

- The primary action growing into the whole flow and folding back, one object the whole way (Morph, Mask rise, Camera).
- A flood of colour from the pressed button turning one state into the next (Flood, Scene handoff, Camera).
- A number rolling to its total as the flow completes.

## Export

The live page is the deliverable. When the person wants a video (for X), `scripts/export.mjs` renders the reel to MP4 or GIF with ffmpeg, four sub-frames per frame for motion blur.

## Pitfalls

From the baseline's reels:

- A black or loud pink ground, chosen for drama. The subject sets the ground.
- Confetti or particles at the end. The flow's own result is the ending: the check, the toast, the ticket.
- Headlines that crossfade, and states that slide in from the side with a cut between them.
- A small interface in the middle of a large empty frame: frame each state.
- No cursor, so the reel reads as a slideshow.
- A reel that reads positions from the page, so a block lands in the wrong slot on an iPhone, where WebKit enlarges the text in a wide layout. Keep the shell's `-webkit-text-size-adjust: 100%`, and place everything from the reel's own world numbers.
- Motion with no reason: floating blobs, spinning rings, drifting gradients.

## Recipes to start from

By the kind of change each part makes (`references/craft.md`, section 3), so a request nobody wrote a recipe for still finds its moves.

| The flow | Kind of change | Recipes in `references/motion.md` |
| --- | --- | --- |
| an app's states, one after another | changes screen | Morph, Mask rise, Camera |
| colour that carries one scene into the next | grows into something else | Flood, Scene handoff, Camera |
| words that arrive | appears | Typing, Letters on a beat, Mask rise |
| a picture that opens | grows into something else | Iris |
| a control showing its states | confirms | Check, Press, Morph, then the reel |
