## Why

When Block Drop is paused, the board stays fully visible and only a small status dot changes, so the game doesn't look paused. Game over is the text `GAME OVER` drawn in `system-ui` on the Canvas. It doesn't show the final score, and there's no "Play again" where the player is already looking. Nothing records a best score, so the player has nothing to beat. On a phone, a notification or switching apps keeps the game running, so the run is lost.

## What Changes

- While paused, cover the playfield with a veil and a pause panel offering Resume (focused) and Restart.
- At game over, show a card over the playfield with the final score, the best score, a "New best" indication when it was beaten, Play again (focused), and Back to catalog. The Canvas no longer draws game-over text.
- Store the best score on the device and keep it across reloads and offline use.
- Pause automatically when the page becomes hidden.
- Restart moves out of the header. It appears only in the pause panel and on the game-over card, and the keyboard shortcut still works at any time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: The pause and game-over requirements gain visible overlays, the session-action placement limits restart to the pause and game-over surfaces, and new requirements add best-score persistence and automatic pause when hidden.

## Impact

- Affects `BlockDrop.tsx` (overlays, best score, visibility listener), `controller.ts` (removes Canvas game-over text and adds a paused veil), `app.css`, and component and browser tests.
- Adds one `localStorage` key, `games.block-drop.best-score`. No other persisted data, dependencies, or APIs.
- Rules, scoring, and keyboard mappings are unchanged.
- Fourth of six planned Block Drop changes. It assumes `compact-block-drop-mobile-layout` (header session actions and announcer).
