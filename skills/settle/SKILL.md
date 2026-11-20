---
name: settle
description: Builds one finished piece of interface that moves well from a plain description, in a look dealt fresh for each request. It makes a control such as a switch or a slider, an animated chart, a widget or card, a screen or page inside someone's app, or a short looping animation that demos an app. It writes the piece into the person's project in its own framework, or as one self-contained HTML file when there is no project, and adds motion to a piece the person already has. Use it whenever someone wants such a piece to look and feel good, even in a beginner's loose words like "make it pop" or "feels nice to click", and even when they never mention motion. Whole websites and landing pages belong to page-design skills, and settle builds only the moving piece inside one; video editing and title sequences belong to video tools, and reviews of existing animation code to animation-review skills.
---

# settle

Turn a request like "a switch that feels really nice to click" or "a short looping animation that shows off my todo app" into a live piece with motion that settles the way physical things do. The motion craft is the same on every piece; the look is dealt fresh for each request, or inherited from the person's project.

Paths below are relative to this file's folder. Run every script from the working folder (the project's root, or the folder the piece goes in) by its full path, `node <this folder>/scripts/deal.mjs …`: the scripts write their files where you run them.

## How a request runs

1. **Read the context.** Find out whether you are in a project: a `package.json` that names a framework, or a folder of HTML pages. In a project, note how it writes styles, the look its tokens or theme set, and any motion library it already uses. Then read the request: which structure in `references/kinds/` it is, whether it is a showcase or part of a product, and what its beginner's words ask for, which `references/words.md` translates.
2. **Deal or inherit the look.**
   - A project with a look of its own keeps it: map that look onto the sheet's variables, and deal only what it lacks with `--keep palette,type`.
   - Otherwise deal: `node scripts/deal.mjs --brief "<the request in one line>" --kind <control, data-view, composite or flow>`, with the flags `references/words.md` gives for the request's words, and `--project` when you are in a project, so later pieces there inherit the look. Build look 1, the dealt look: `--pick 1`. Take look 2 or 3 only when look 1 clashes with the subject, and name the clash: `--pick 2 --because "a dark ground for a breakfast menu"`. `references/tokens.md` has the rules.
   - A dealt look has a direction, which dresses the piece; the request sets its form. Read its section in `references/directions.md`, and Every direction at the top, before the brief.
3. **Write the brief, or a storyboard.**
   - For a control, a data view or a composite, state the brief in two lines and build straight away: what it is, what the direction becomes for this subject, the look, the signature moment, and the defaults you chose. "A Pomodoro timer for a study site. Instrument: the timer is a kitchen timer's face, minute ticks round a bezel; look 1, putty and black; signature: the Start button becomes the bar that drains; 25 minutes, 5-minute breaks."
   - For a flow over time, or a request that could mean two very different things, show a storyboard (`references/kinds/flow.md` has the format) and wait for a yes.
   - Before building, picture what any similar request would get. Change each part of the brief that matches that picture.
4. **Build it where the piece goes.**
   - **No project:** one HTML file built on `assets/page.html`, or `assets/reel.html` for a reel. It holds the sheet, the direction's page rules, the kernel (`assets/kernel.js`) pasted whole into the head's module script, and the recipes from `references/motion.md` that the piece needs.
   - **A project:** a component in the project's framework and styling, the kernel copied in once as a module, the sheet in the project's global stylesheet. `references/stacks/` has one note per stack.
   - **Motion for a piece that already exists:** keep its markup and its look, and give each of its changes the move the grammar names (`references/craft.md`, section 3), through the gate.
   - The structure's file in `references/kinds/` says which recipes to start from, by the kind of change each part makes.
5. **Check it.** Lint the file and shoot frames with snap.mjs as `references/review.md` describes, on the file or on the project's dev server. Fix what reads wrong in the contact sheet and shoot again, three rounds at most. A check that misbehaves, such as a drag snap cannot land or a server that will not start, gets two tries; then hand over with it named as unchecked.
6. **Hand it over** (below).

## What to read

| File                                                                            | Read when                                                                                                      |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `references/craft.md`                                                           | Every build: the rules every move follows, the banned list and the gotchas                                     |
| `references/tokens.md`                                                          | Every build: how a look is dealt or inherited, and how it is used                                              |
| `references/directions.md`                                                      | Every build with no project: the dealt direction's section                                                     |
| `references/motion.md`                                                          | Every build: the sheet, the base page and the recipes, one per motion                                          |
| `references/kinds/control.md`, `data-view.md`, `composite.md`, `flow.md`        | The piece's structure: its anatomy and the recipes to start from                                               |
| `references/stacks/html.md`, `react-next.md`, `vue.md`, `svelte.md`, `astro.md` | Where the piece goes: `html.md` for a standalone file, the project's stack otherwise                           |
| `references/words.md`                                                           | The request describes a feeling, such as "make it pop"                                                         |
| `references/review.md`                                                          | The check step                                                                                                 |

## Hard rules

- **The piece goes where the person works.** In a project: the project's framework and styling, no new package, and the project's own motion library when it has one, carrying settle's timing. With no project: one self-contained HTML file with the kernel pasted in, whose only outside request is the look's one font link; it must still hold in the system font. A photo fetched on request sits beside it.
- **The request sets the form.** A control stays at its real size, a widget stays one card or panel, and a full screen comes only when the request asks for a screen. A request for a whole landing page or website gets only the moving piece in it, such as the app's slideshow, built to drop into the page, and the hand-over leaves the page to a page-design skill. The ground around the piece stays plain.
- **The look comes from the sheet and the direction.** Every visual value comes from the sheet's variables or tints of them, with one ground, one ink and one or two accents. The dealt direction dresses the piece, and a dark ground is for a subject that happens in the dark.
- **Motion from the kernel.** Every move that answers a person, and every state change, runs on `settle.track`, `settle.stretch` or `settle.move` with a preset from the look's register, `settle.register()`.
- **Time from `settle.now()`.** Handlers set targets; one `requestAnimationFrame` loop draws every moving style from the current time. snap.mjs stops that clock to check frames.
- **The shape carries over.** Each new state is made from the shape already on screen, changed text passes through a brief blur, and a new container opens from behind whatever stays.
- **The hand leads.** Dragged values sit exactly under the pointer; past a limit they follow a rubber band; releases keep the hand's speed.
- **Real content.** Plausible specifics, and an action keeps its name through a flow. Photos come from the person, or, when they ask for a real photo and have none, from `scripts/photo.mjs` with its credit in the piece; otherwise draw in code only what code draws crisply, never a landscape (`references/directions.md`, Pictures).
- **One signature moment**, and everything around it quiet.
- **Banned unless the request names it:** everything on the banned list in `references/craft.md`, which the lint flags.
- **For everyone.** It works by pointer, touch and keyboard, with visible focus and 44 px targets. It fits a 360 px screen with no text under 11 px, and under reduced motion its springs land at once.
- **Cost counts.** Every tool call spends the person's usage. Build once, check in three rounds at most, give a misbehaving check two tries, and leave the scripts themselves undebugged: name what went unchecked in the hand-over.

## Showcase or product

A showcase, such as a reel for a landing page, gets the full motion. A control inside a working product moves less the more often a person sees it: none for something used a hundred times a day, fast and slight for something used tens of times. `references/craft.md` has the table (Emil Kowalski's frequency rule).

## Where the file goes

With no project, write it in the working folder under a short name from its subject, such as `tea-timer.html`, unless the person names a path. In a project, put it where the stack note says, named in the project's own style, and show it somewhere the person can open: a page or route of its own when the request names none. Keep the piece's tunable numbers together at the top of its script: the data, and any timing the register does not set.

## Hand-over

Reply with:

- Where the piece is, how to open it (the file, or the route and the command that starts the dev server), and one line on what it is and its signature moment.
- Two or three things to try: "drag the knob past the end", "press Tab, then the arrow keys".
- Two knobs to tweak, named as they appear at the top of the script.
- Where their photo goes, when a drawing stands in for one: the element to swap for an `<img>` of theirs.
- What went unchecked, if anything, such as Safari on a real phone.
- An offer to re-deal one part of the look (`node scripts/deal.mjs --redeal palette`), and for a vague request three variants behind a switcher.

For a reel, offer the video export: `node scripts/export.mjs reel.html --out reel.mp4` renders it with ffmpeg at 60 fps in the reel's own shape, one sample per frame; `--gif` adds a GIF beside the MP4, `--once` makes that GIF play once, and `--samples 4` adds motion blur at four times the render time.

## Scripts

| Script                                                                                            | Does                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/deal.mjs --brief "…" [--tone …] [--register …] [--dark] [--project]`                     | Deals three looks; `--pick <n>` prints the chosen sheet (and keeps it as the project's look with `--project`); `--redeal <part>` deals one part again; `--check` checks the library                                                                                                          |
| `scripts/lint.mjs <file>`                                                                         | Static checks of a standalone file; exits 1 on a FAIL                                                                                                                                                                                                                                        |
| `scripts/snap.mjs <file or url> --out <dir> --sheet [--size WxH] [--times …] [--do "…"] [--calm]` | Frames on a stopped clock with real input and a contact sheet, then the checks of the settled page that its header lists                                                                                                                                                                     |
| `scripts/export.mjs <reel> [--out reel.mp4] [--gif] [--once]`                                     | A reel to MP4 in its own shape, from one lossless render; `--gif` adds a GIF beside it, `--once` plays that GIF once, `--samples 4` adds motion blur                                                                                                                                         |
| `scripts/photo.mjs "<what it shows>" [--out photo.jpg]`                                           | One openly licensed photo (CC0, public domain or CC BY) saved where it runs, with the credit line for the piece; only when the person asks for a real photo                                                                                                                                  |

They need Node 22 or later and a Chromium browser: snap.mjs finds Chrome, Chromium, Edge or Brave in its usual place, and any other through `CHROME`. When none is found, it says so in one line: review the code against `references/review.md` and name the frames as unchecked. Export also needs ffmpeg, and photo.mjs a network. Nothing to install.

## With no shell

Where scripts cannot run, as in a chat with no shell: read `library/directions.json`, `library/palettes.json` and `library/type.json`, keep the entries whose kinds and tones fit the request, and take the entry at the position given by the request's length in characters, counted around each list, so different requests land on different looks. Build from the same files, review the code against the rubric in `references/review.md`, and say in the hand-over that the frames went unchecked.

## Credits

- [Emil Kowalski's skills](https://github.com/emilkowalski/skills) (MIT, © 2026 Emil Kowalski): the frequency rule, the easing bans, the material rules of the Glass direction (apple-design) and the structure of a skill like this one.
- [taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT, © 2026 Leonxlnx): most palettes and faces in `library/`, `scripts/deal.mjs`, adapted from its `draw.mjs`, the model for the lint, the three levels of a drawn picture, and the open-collection search `scripts/photo.mjs` adapts from its `assets.mjs`.
- [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT, © 2024 Next Level Builder): faces from its font pairings, and the format of the stack notes.
- [impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0): the small-piece detectors in the lint and in snap.mjs.
- [Vercel's web interface guidelines](https://github.com/vercel-labs/web-interface-guidelines) (MIT): the markup checks in the lint.
- [Anthropic's frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache 2.0): the subject choosing the look, one committed direction, the brief checked against the default answer, and the list of where generated pages cluster.
- Google Stitch's DESIGN.md format: the order of each direction's section. Apple's iOS 27 and macOS 27 UI kits, as a reference for the Glass and System directions; settle ships none of their assets.

The licence texts are in `NOTICE.md`.
