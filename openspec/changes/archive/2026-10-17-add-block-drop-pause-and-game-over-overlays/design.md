## Context

After `compact-block-drop-mobile-layout`, the header holds pause/resume, help, and restart, and a status announcer reports pause, resume, and game over. The controller dims the board and draws "GAME OVER" text at game over, and draws nothing extra while paused. There is no persistence in Block Drop today. The platform already relies on the service worker and Cache Storage for offline play. See `proposal.md` and `specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Make paused and game-over states obvious, and make their next action one tap away in the place the player is already looking.
- Keep a best score per device that survives reloads and offline use.
- Stop the game from running while the page is hidden.
- Keep restart away from the gameplay controls and the header.

**Non-Goals:**

- High-score tables, names, or syncing between devices.
- A confirmation dialog before restart. Restart now lives on surfaces the player opens deliberately.
- Saving and resuming a game in progress across reloads.

## Decisions

### Overlays are DOM, the veil is Canvas

The pause panel and game-over card are DOM elements absolutely positioned over the board frame, so they get real text, focus, and accessible names. The controller draws a dimming veil when paused, opaque enough to hide the piece layout (about 85%). It keeps the existing dim for game over but stops drawing text. The panel is a labelled `role="group"` rather than a modal dialog, so the header's return and help controls stay reachable.

Drawing buttons on the Canvas was rejected because they would need their own hit-testing and accessibility.

### Focus management

When the state becomes paused, focus moves to Resume. When it becomes game over, focus moves to Play again. When play resumes or restarts, focus moves to the playfield container (`tabindex="-1"`). This keeps keyboard shortcuts working, because the controller ignores gameplay keys while a button has focus.

### Best score storage

Read `games.block-drop.best-score` once on mount and parse it as a non-negative integer, falling back to 0. At game over, if the final score is higher, write it and mark the card "New best". Wrap all storage access in `try`/`catch` so that private-mode or quota errors only drop persistence. Keep the storage helper local to Block Drop until another game needs one, in line with the handoff's guidance on shared abstractions.

### Automatic pause on hide

Listen for `visibilitychange` on `document`. When it becomes `hidden` while playing, dispatch `pause`. Do nothing on return; the pause panel is already there. Remove the listener on unmount.

### Restart placement

Remove restart from the header. It appears in the pause panel next to Resume and on the game-over card as Play again. The `R` shortcut still restarts in any state. During the brief line-clear feedback, restart stays reachable by keyboard, and the catalog stays reachable from the header, which keeps the line-clear requirement satisfied.

### Inactive controls and reported iOS page zoom

During mobile E2E review, the user narrowed the remaining page-zoom report to rapid taps on the disabled gameplay controls that remain visible below the pause and game-over board overlays. Earlier fixes disabled text selection and applied `touch-action: none` to the controls, but did not stop the report.

The research points to a plausible explanation, but does not establish the exact Safari gesture path on the user's device. [Apple's archived Safari guide](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/AdjustingtheTextSize/AdjustingtheTextSize.html) says double-tapping an HTML block such as a `div` can scale the viewport to fit that block, which could explain zoom near the control labels. The [Pointer Events specification](https://www.w3.org/TR/pointerevents3/#the-touch-action-css-property) says `touch-action` controls viewport panning and zooming, separately from text selection and highlighting. This explains why preventing selection alone need not prevent viewport zoom. WebKit's [iOS tapping guidance](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/) says `touch-action: manipulation` allows panning and pinch zoom while excluding double-tap gestures. A [July 2026 WebKit change](https://commits.webkit.org/317443@main) records that the iOS implementation previously only suppressed double-tap zoom for `touch-action: none` and changed it to honor `manipulation`; this documents a platform mismatch, but does not identify the Safari/WebKit version involved in this E2E report.

Keep the controls visible but remove their child text and button boxes as pointer hit targets while paused or game over: `.game-controls.controls-inactive > *` receives `pointer-events: none`, leaving the wide `.game-controls` container itself as the target. The container has `touch-action: none`, so taps there cannot start viewport panning or zooming. This also means pinch zoom is unavailable when a gesture starts over the inactive controls, and during the brief post-resume/restart gesture guard; pinch zoom remains available on the board and other unlocked regions. The guard does not set `controls-inactive`, so the first Drop tap after resume still reaches its button. Mobile Playwright emulation confirmed that an inactive-state tap hit the controls container and that an immediate hard-drop tap after resume still worked. The user confirmed the reported zoom stopped in E2E review. Chromium cannot emulate Safari's native viewport zoom, so the browser emulation verifies hit-testing and gameplay action delivery, not Safari's zoom recognizer.

## Risks / Trade-offs

- [Touch players cannot restart mid-run without pausing] -> This is intended. Pause is one tap in the header, and Restart is beside Resume.
- [A veil hides the board, so the player cannot study it while paused] -> This is the standard choice in falling-block games and stops pause from being used to plan moves. The veil is not fully opaque, so the game is still recognisable.
- [`visibilitychange` can fire during the iOS app switcher] -> Pausing on any hide is the safe outcome.
- [Storage can be cleared by the browser] -> The best score is a convenience, and losing it is acceptable.
- [Pinch zoom is unavailable when it begins over paused or game-over controls, or during the short post-resume/restart gesture guard] -> This is limited to the gameplay-control region; pinch zoom remains available on the board and other unlocked game regions.

## Migration Plan

1. Add the paused veil and remove Canvas game-over text, with controller tests.
2. Add the pause panel and game-over card with focus management, and move restart, with component tests.
3. Add best-score storage and visibility pause with component tests.
4. Update the browser flows and run `npm run check`. Roll back by reverting. The leftover storage key is harmless.
