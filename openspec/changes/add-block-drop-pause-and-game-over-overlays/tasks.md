## 1. Canvas States

- [ ] 1.1 Draw a dimming veil over the playfield while paused and stop drawing game-over text, keeping the game-over dim; verify controller tests assert the veil while paused, none while playing, and no `fillText` call at game over.

## 2. Pause Panel and Game-Over Card

- [ ] 2.1 Show a labelled pause panel over the playfield with Resume and Restart, and move focus to Resume on pause and back to the playfield on resume; verify component tests for presence, labels, focus, and dispatched actions.
- [ ] 2.2 Show a game-over card with the final score, best score, a "New best" indication when beaten, Play again, and Back to catalog, with focus on Play again; verify component tests for each value, the indication, focus, and both actions.
- [ ] 2.3 Remove restart from the header, leaving it in the pause panel and game-over card, and keep the keyboard shortcut working in every state; verify component tests assert where restart appears in playing, paused, and game-over states and that `R` restarts from each.

## 3. Best Score and Visibility

- [ ] 3.1 Read and write the best score under `games.block-drop.best-score`, tolerating missing, malformed, and throwing storage; verify component tests with a stubbed storage for each case.
- [ ] 3.2 Pause automatically when the document becomes hidden during play and stay paused when it becomes visible; verify component tests that dispatch `visibilitychange` and assert the listener is removed on unmount.

## 4. Integrated Verification

- [ ] 4.1 Extend browser flows to top out a seeded game and assert the card, Play again, and a best score that survives a reload and offline relaunch, then run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
