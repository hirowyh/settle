# A control

One thing a person flips, picks, sets or starts: a switch, a button, tabs, a slider, a range filter. Requests sound like "a switch that feels really nice to click" or "a download button that shows the progress and then says it's done".

## What comes back

The control at its real size on the look's ground, as one page or as a component in the person's project. When the control acts on something, show that too, at its smallest: tabs with the panel they switch, a dropdown with the field it fills.

## Anatomy

- Every state the control has: rest, hover (pointer devices only, `@media (hover: hover)`), pressed, focused (a visible `:focus-visible` ring), the changed state, and disabled when the control can be.
- A touch target of at least 44 × 44px, even when the drawn control is smaller.
- The native role and keys: `role="switch"` with `aria-checked` and Space; tabs with arrows, Home and End; sliders with arrows, PageUp, PageDown, Home and End and an `aria-valuetext` in words.
- A press that dips to 0.97 and springs back.

## The signature moment

Pick one and build it properly:

- **Stretch**: a knob or an indicator whose front edge leads (Toggle, Stretch).
- **Rubber band**: a value pulled past its limit follows on resistance and springs back (Volume).
- **Morph to done**: the control becomes its own result: a button turns into a progress ring and then into "Saved" (Check, Press).
- **Rolling digits**: a stepper or a counter whose digits roll in the right direction.
- **Sweep**: a range filter's bars change colour as the knob passes over them (Range, Bars).

A heart that is liked can squash on the press, spring up with bounce 0.3 and roll its count from 41 to 42. That is the fun; a burst of particles around it is decoration.

## Pitfalls

- The control animates on every hover. Hover gets a tint at most; motion answers presses and changes.
- Labels change by fading. A label that changes goes through a blur swap or a mask rise, and keeps the action's name ("Download", "Downloading", "Downloaded").
- The control lives in a product and is used all day. Then the frequency rule applies: a tab switch in settings moves fast and slightly; a command palette opened from the keyboard opens at once.
- Colour carries the state alone. Pair it with position, shape or a word.

## Recipes to start from

By the kind of change each part makes (`references/craft.md`, section 3), so a request nobody wrote a recipe for still finds its moves.

| The control | Kind of change | Recipes in `references/motion.md` |
| --- | --- | --- |
| flips between two states | changes the selection | Toggle |
| picks one of several | changes the selection | Stretch |
| sets a value under the hand | follows the hand, changes a value | Volume, Range |
| starts something and shows its progress | confirms, waits | Press, Check |
| opens into a list or a panel | grows into something else | Morph, List filter |
