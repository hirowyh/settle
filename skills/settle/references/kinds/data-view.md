# A data view

Numbers drawn so a person can read them: bars, a line, a ring, a donut, a heatmap, a calendar of days, one big figure. They draw in and answer the pointer. Requests sound like "show my sales for the last 12 months, make it pop" or "a ring showing how close I am today to typing 10,000 characters".

## What comes back

The data as a plain array in the piece's script, or from the project's own source, plausible and specific (amounts with units). When the person gives numbers, use theirs exactly. When they give none, invent believable ones and say so in the hand-over.

## Anatomy

- **A headline number**: the one figure the chart exists to show, big and tight, over a small grey label that names it ("712 mm" over "fell in 2025"). It ticks to its value on arrival.
- **The plot**: marks in the ink, the accent on the mark in focus. Three faint gridlines at most, with 11–12px labels. No frame around the plot.
- **A readout**: hidden at rest; hovering with a mouse, a tap with touch or keyboard focus selects a mark, and a tap outside hides it. A small pill names the mark ("Nov · 131 mm") and its number ticks between marks. The readout follows the pointer exactly and springs between marks under the keyboard. A touch scroll never selects. Keep it on a line where it covers no other mark. Only marks that carry a value take it; gridlines and ornament take none.
- **One control when the data has a second axis**: a period or a metric, as a segmented pill whose indicator stretches. Switching retargets every mark mid-flight.
- **Keys**: the plot is one focus stop, `role="slider"` over the marks, with `aria-valuetext` in words.

## Arrival

| Chart | Arrives as |
| --- | --- |
| Bars | each bar rises from the baseline in order, 37 ms apart, on the morph spring |
| Line | the line draws itself on the glide curve; the area below follows with a clip |
| Ring | the arc draws from the top to its value while the number ticks |
| Donut | segments draw in order around the ring; the centre number ticks |
| Heatmap | cells pop in a diagonal wave from the first day |

## Colour

- Marks are the ink, or the ink at stepped strengths (100, 70, 45, 25 %) when categories need telling apart. The accent goes on the mark in focus or the one category that matters.
- A donut of five categories is five ink steps with gaps between segments; the focused segment takes the accent, moves out 3px and puts its number in the centre.
- A second series, when the chart compares two, takes the second accent or a dashed ink line.
- Every shade stands for something in the data. A range of values, such as a heatmap's, steps one colour from light to dark. Past five categories, label the marks and add no more steps.

## Honest marks

- A bar's length is its value: bars start at zero, and the axis never breaks. When one value dwarfs the rest, let its bar run tall and label it.
- A circle's area is its value, so its radius grows with the square root.
- When each mark counts a unit, the label under the headline says so: "one dot = 2 incidents".

## The signature moment

- Bars that retarget mid-flight when the period changes, keeping their speed.
- A ring that runs past its goal into a second lap in a deeper shade.
- A headline number that rolls to each new total as the marks change.
- A wave of cells arriving across a year.

## Pitfalls

These made the baseline's charts its worst pages:

- Gradient fills and rainbow palettes. Flat ink with one accent reads stronger.
- Glow on lines and dots.
- A legend far from the data. Label the marks, or put the legend's words in the readout.
- Tooltips that lag behind the pointer, or that cover the marks next to the one they name.
- Axis labels under 11px, and labels on every gridline.
- 3D, drop shadows on bars, and bars with heavily rounded tops.

## Recipes to start from

By the kind of change each part makes (`references/craft.md`, section 3), so a request nobody wrote a recipe for still finds its moves.

| The view | Kind of change | Recipes in `references/motion.md` |
| --- | --- | --- |
| marks that change with a period or a filter | updates its data | Bars, Readout |
| a line over time | updates its data | Draw-in, Readout, Ticker |
| progress toward a goal | changes a value | Draw-in, Ticker |
| one figure that changes | changes a value | Ticker, or Count-up when it is small |
| a grid of days or cells | appears or leaves | Arrive, Readout |
| marks behind a control the hand moves | follows the hand | Range, Bars |
