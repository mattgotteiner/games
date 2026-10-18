## 1. Landing Calculation

- [ ] 1.1 Add `getLandingPiece` to `rules.ts`; verify rules tests cover every tetromino on an empty board, over an uneven stack, already resting, and with no active piece.
- [ ] 1.2 Refactor `hardDrop` to use `getLandingPiece` without changing score or lock behavior; verify existing hard-drop and score tests pass unchanged, and add a seeded property test that hard drop locks exactly the cells previously returned by `getLandingPiece`.

## 2. Playfield Rendering

- [ ] 2.1 Reorder drawing to background, grid, locked cells, ghost, active cells, then overlays; verify controller tests with the fake context assert the grid stroke happens before any cell fill.
- [ ] 2.2 Draw the ghost as outlined, faintly filled cells at the landing position, and skip it during line-clear feedback, at game over, and when it coincides with the active piece; verify controller tests assert ghost drawing calls for a floating piece and none for each skipped case.
- [ ] 2.3 Add the leading-edge highlight and trailing-edge shade to `drawCell`, scaled to cell size; verify controller tests assert the edge rectangles for a known cell at two device pixel ratios.

## 3. Integrated Verification

- [ ] 3.1 Add a browser check that samples Canvas pixels at the expected ghost cells for a seeded game, then run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
