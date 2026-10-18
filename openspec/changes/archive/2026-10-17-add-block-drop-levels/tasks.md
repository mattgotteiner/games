## 1. Rules

- [x] 1.1 Add `lines` and `level` to `BlockDropState`, initialise them in `createGame`, update them in `lockActive`, and reset them on restart; rules tests cover 0, 9, 10, and 19 lines, multi-line clears that cross a level boundary, and restart.
- [x] 1.2 Export `getGravityInterval(level, difficulty = 'medium')` with the documented curve and floor; rules tests cover levels 1, 2, 10, 14, 15, and 30 at the default difficulty.
- [x] 1.3 Multiply line-clear points by the level before the clear; score tests cover each clear size at levels 1 and 3 and a clear that crosses into a new level, and confirm soft-drop and hard-drop points are unchanged.
- [x] 1.4 Verify seeded replay deterministically produces identical states, including `lines` and `level`, through a level transition.

## 2. Controller

- [x] 2.1 Replace the fixed gravity constant with the level-based interval and a per-tick catch-up bound; controller tests cover 700 ms at level 1 and 595 ms at level 2.

## 3. Presentation

- [x] 3.1 Show level and lines in the HUD at every layout, with a one-shot highlight on change that reduced motion disables; component tests cover values and the highlight class, and the browser flow checks portrait fit.
- [x] 3.2 Show an `aria-hidden` line-clear callout with the points and clear name; component tests cover each clear size and timed removal.
- [x] 3.3 Add the level to line-clear announcements when a level is reached, and update the scoring guide to explain the level multiplier; component tests cover the announcement text and guide content.

## 4. Integrated Verification

- [x] 4.1 Run `npm run check` for the levels-only implementation; type checking, 137 unit/component tests, the production build, and all 9 Chromium browser flows passed without new dependencies.

## 5. Difficulty Selection

- [x] 5.1 Add Easy (0.5×), Medium (1×), and Hard (1.5×) gravity settings while preserving the level curve and 80 ms minimum.
- [x] 5.2 Add a labelled, three-position difficulty slider to the pause menu; retain the selection on restart in the current session.
- [x] 5.3 Document that difficulty changes gravity only and leaves line progression and level-based scoring unchanged.
- [x] 5.4 The user reviewed the difficulty slider E2E and confirmed the feature works. The last full `npm run check` preceded the slider addition.
