## 1. Canvas States

- [x] 1.1 Draw a dimming veil over the playfield while paused and stop drawing game-over text, keeping the game-over dim; controller tests assert the veil while paused, no veil while playing, and no `fillText` call at game over.

## 2. Pause Panel and Game-Over Card

- [x] 2.1 Show a labelled pause panel over the playfield with Resume and Restart, and move focus to Resume on pause and back to the playfield on resume or restart; component tests verify labels, focus, and dispatched actions.
- [x] 2.2 Show a game-over card with final and best scores, a "New best" indication when beaten, Play again, and Back to catalog, with focus on Play again; component and browser tests verify each value, the indication, focus, and actions.
- [x] 2.3 Remove restart from the header, leaving it in the pause panel and game-over card, and keep the keyboard shortcut working in every state; component/controller tests verify restart placement and `R` from playing, paused, and game-over.

## 3. Best Score and Visibility

- [x] 3.1 Read and write the best score under `games.block-drop.best-score`, tolerating missing, malformed, and throwing storage; component tests cover stored scores, invalid values, and storage errors.
- [x] 3.2 Pause automatically when the document becomes hidden during play and stay paused when it becomes visible; component tests dispatch `visibilitychange`, cover paused/game-over states, and assert listener cleanup on unmount.

## 4. Integrated Verification

- [x] 4.1 Extend browser flows to top out a seeded game and assert the card, Play again, and a best score that survives a reload and offline relaunch; `npm run check` passes typechecking, 120 Vitest tests, the production build, and all 9 Playwright flows without new dependencies.
- [x] 4.2 During E2E review, the game-over overlay still allowed double-tap zoom; explicitly apply `touch-action: manipulation` across the game screen and directly to the overlay and card while the game shell continues to block one-finger page panning and allow pinch zoom.
- [x] 4.3 Remove the board focus ring and suppress focus highlighting on overlay actions for touch input, while retaining visible keyboard focus indicators.
- [x] 4.4 During E2E review, a touch drag could select control text; disable selection across the control group and cancel `selectstart` there.
- [x] 4.5 During continued tapping after game over, a zoom action was still reported; disable selection across the game-over overlay and cancel its native `dblclick` default while retaining the existing touch-action rule. Later E2E review narrowed the remaining report to the gameplay controls.
- [x] 4.6 E2E review narrowed the remaining page-zoom report to the visible disabled gameplay controls below the pause/game-over overlay; set `touch-action: none` on the control group in those states.
- [x] 4.7 Rapid taps could still zoom in the brief transition from an overlay back to play; keep the gameplay controls gesture-locked for 500 ms after resume or restart. Mobile emulation confirms the lock and that an immediate Drop tap still works.
- [x] 4.8 Hypothesis: Safari may be zooming to the small text hit target on disabled controls; the exact gesture path was not captured. Keep controls visible but route inactive-state taps to their wide gesture-locked container. Mobile hit-testing emulation confirms the hit target, and user E2E review confirms the reported zoom stopped. Pinch zoom is consequently unavailable over locked controls.
