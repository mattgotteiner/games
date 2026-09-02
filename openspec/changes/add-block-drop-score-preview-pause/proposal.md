## Why

Block Drop is playable, but it does not yet communicate progress, show what
piece is coming, or let a player safely interrupt a session. Adding these three
features makes the game easier to read and use while keeping persistence,
levels, and broader lifecycle hardening separate.

## What Changes

- Add a deterministic score that starts at zero, rewards manual drop distance,
  and uses a fixed table for one through four rows cleared together.
- Display the current score as semantic text throughout play and preserve the
  final score in the game-over state.
- Show the exact next tetromino in an originally styled preview with a readable
  text label, updating it whenever a new active piece spawns.
- Add visible and keyboard-accessible pause/resume controls that freeze gravity
  and gameplay input without replacing the current board, piece, preview, or
  score.
- Verify score transitions, next-piece sequencing and rendering, paused timing,
  equivalent controls, responsive layout, and offline production behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Add scoring, next-piece preview, paused session state, and the
  corresponding semantic presentation and keyboard/touch controls.

## Impact

- Extends the deterministic Block Drop state and actions without changing its
  seed contract or board dimensions.
- Updates the game controller, Canvas/DOM presentation, responsive styles, and
  focused unit, component, and production-browser tests.
- Adds no dependency, storage schema, level progression, high-score behavior,
  automatic visibility pause, or generalized game-session abstraction.
