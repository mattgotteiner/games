## 1. Rules

- [x] 1.1 Add difficulty to `BlockDropState`, default it to Medium, and preserve it across restart; cover difficulty changes in deterministic replay.
- [x] 1.2 Scale soft-drop, hard-drop, and line-clear awards by difficulty; keep automatic gravity at zero and line-clear level scaling based on the level before the clear.
- [x] 1.3 Cover Easy, Medium, and Hard scoring, including 0.5-point drop awards and combined difficulty/level multipliers.

## 2. Presentation and Persistence

- [x] 2.1 Keep the score HUD, final score, callout, and live announcements accurate for fractional points.
- [x] 2.2 Update best-score parsing to accept non-negative half-point values while preserving existing integer records.
- [x] 2.3 Update the scoring guide to explain all difficulty multipliers and show combined line-clear scoring.

## 3. Integrated Verification

- [x] 3.1 Verify that changing difficulty while paused affects future score awards without changing the current score, board, lines, or level.
- [x] 3.2 Run `npm run check`; type checking, unit/component tests, production build, and browser flows pass.
- [x] 3.3 Review scoring and difficulty changes E2E on a phone.
