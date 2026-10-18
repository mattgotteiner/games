## 1. Rules

- [ ] 1.1 Add `lines` and `level` to `BlockDropState`, initialise them in `createGame`, update them in `lockActive`, and reset them on restart; verify rules tests for 0, 9, 10, and 19 lines, multi-line clears that cross a level boundary, and restart.
- [ ] 1.2 Export `getGravityInterval(level)` with the documented curve and floor; verify rules tests for levels 1, 2, 10, 14, 15, and 30.
- [ ] 1.3 Multiply line-clear points by the level before the clear; verify score tests for each clear size at levels 1 and 3 and for a clear that crosses into a new level, and confirm soft-drop and hard-drop points are unchanged.
- [ ] 1.4 Verify the existing seeded replay test still produces identical states, including `lines` and `level`.

## 2. Controller

- [ ] 2.1 Replace the fixed gravity constant with the level-based interval and a per-tick catch-up bound; verify controller tests that gravity steps at 700 ms on level 1 and at the shorter interval after a fixture reaches level 2.

## 3. Presentation

- [ ] 3.1 Show level and lines in the HUD at every layout, with a one-shot highlight on change that reduced motion disables; verify component tests for values and the highlight class, and browser tests that the portrait strip still fits.
- [ ] 3.2 Show an `aria-hidden` line-clear callout with the points and clear name; verify component tests for each clear size and its timed removal.
- [ ] 3.3 Add the level to line-clear announcements when a level is reached, and update the scoring guide to explain the level multiplier; verify component tests for the announcement text and guide content.

## 4. Integrated Verification

- [ ] 4.1 Run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
