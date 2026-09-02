## Why

The catalog is installable and reliable offline but still has no game to play.
The next smallest product increment is one complete falling-block game that
proves the real simulation, rendering, input, and lifecycle seams before the
project introduces reusable game-platform abstractions.

## What Changes

- Add Block Drop as the catalog's first playable game with an originally styled
  ten-by-twenty falling-block board.
- Add a deterministic, browser-independent rules core with seven tetrominoes,
  gravity, movement, rotation, dropping, locking, row clearing, game over, and
  restart behavior.
- Render the game with a responsive high-DPI Canvas and expose equivalent
  keyboard and touch controls.
- Add only the mount/destroy boundary needed to launch Block Drop from the
  catalog, return safely, and release its timers, animation frame, and input
  listeners.
- Verify deterministic rules, user controls, responsive rendering, cleanup, and
  production offline play without adding scoring, levels, persistence, update
  coordination, or a generalized game runtime.

## Capabilities

### New Capabilities

- `block-drop`: Covers deterministic falling-block gameplay, Canvas
  presentation, keyboard and touch controls, catalog launch, session cleanup,
  offline play, game over, and restart.

### Modified Capabilities

None.

## Impact

- Adds game-specific rules, rendering, controls, UI, styles, and tests beneath
  the existing Preact application.
- Replaces the empty catalog state with one playable Block Drop entry while
  preserving the existing application identity and `/games/` deployment path.
- Extends production-browser coverage so the game remains playable from the
  generated offline artifact.
- Adds no runtime dependency and does not establish a shared registry,
  persistence service, routing system, or universal session interface.
