## Why

On a 390 by 844 phone viewport the Block Drop playfield renders at about 164 by 329 CSS pixels, so each cell is roughly 16 pixels wide. Most of the screen goes to other content: the always-visible scoring guide takes about 40% of the height, the title block is sized like a landing-page heading, and the board frame spans the full width around a much narrower canvas. Restart also sits one button away from hard drop, so a slip ends the run.

## What Changes

- Replace the two-line title block with one compact header row holding return, the game name, and the pause/resume, help, and restart session actions.
- Move the scoring guide out of the HUD into a modal help dialog, opened from the header, that also lists the keyboard controls. Opening it during play pauses the game.
- On portrait phones, show score, state, and next piece in a single compact strip between the header and the playfield.
- Size the visible board frame to the playfield instead of the full available width, and give the playfield the largest share of space (at least 540 CSS pixels tall at 390 by 844).
- Take pause and restart out of the gameplay control rows so no session action is next to hard drop.
- Hide the keyboard help line on coarse-pointer devices; it remains in the help dialog.
- Replace the score's live region with one announcer for line clears, pause, resume, and game over, so individual drop points are no longer announced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: The scoring explanation becomes on-demand rather than always visible, the responsive presentation gives the playfield priority with a compact header and portrait strip, session actions move away from gameplay controls, and live announcements cover game events rather than every score change.

## Impact

- Affects `BlockDrop.tsx`, `app.css`, the Block Drop component tests, and the responsive Block Drop browser flows.
- Gameplay rules, scoring values, keyboard mappings, Canvas drawing, and the controller API remain unchanged.
- No new dependencies, APIs, or persisted data.
- First of six planned Block Drop changes: this one, then `add-block-drop-ghost-piece`, `add-block-drop-touch-repeat`, `add-block-drop-pause-and-game-over-overlays`, `add-block-drop-levels`, and `add-block-drop-wall-kicks`. Later changes assume this layout.
