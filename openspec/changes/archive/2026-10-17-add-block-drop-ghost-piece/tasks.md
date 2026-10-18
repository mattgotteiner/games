## 1. Landing Calculation

- [x] 1.1 Add `getLandingPiece` to `rules.ts`; add rules cases for every tetromino on an empty board, over an uneven stack, already resting, and with no active piece.
- [x] 1.2 Refactor `hardDrop` to use `getLandingPiece` without changing score or lock behavior; preserve the existing hard-drop and score assertions, and add a seeded property test that hard drop locks exactly the cells previously returned by `getLandingPiece`.

## 2. Playfield Rendering

- [x] 2.1 Reorder drawing to background, grid, locked cells, ghost, active cells, then overlays; add controller assertions that the grid stroke happens before occupied-cell drawing.
- [x] 2.2 Draw the ghost as outlined, faintly filled cells at the landing position, and skip it during line-clear feedback, at game over, and when it coincides with the active piece; add controller assertions for visible and skipped cases.
- [x] 2.3 Add the leading-edge highlight and trailing-edge shade to `drawCell`, scaled to cell size; add controller assertions for edge rectangles at two device pixel ratios.

## 3. Integrated Verification

- [x] 3.1 Add a browser check that samples Canvas pixels at the expected ghost cells for a seeded game; the check is in place and the user reviewed the game E2E. The automated suite was not run in this turn.
