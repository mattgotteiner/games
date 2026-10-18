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

## Risks / Trade-offs

- [Touch players cannot restart mid-run without pausing] -> This is intended. Pause is one tap in the header, and Restart is beside Resume.
- [A veil hides the board, so the player cannot study it while paused] -> This is the standard choice in falling-block games and stops pause from being used to plan moves. The veil is not fully opaque, so the game is still recognisable.
- [`visibilitychange` can fire during the iOS app switcher] -> Pausing on any hide is the safe outcome.
- [Storage can be cleared by the browser] -> The best score is a convenience, and losing it is acceptable.

## Migration Plan

1. Add the paused veil and remove Canvas game-over text, with controller tests.
2. Add the pause panel and game-over card with focus management, and move restart, with component tests.
3. Add best-score storage and visibility pause with component tests.
4. Update the browser flows and run `npm run check`. Roll back by reverting. The leftover storage key is harmless.
