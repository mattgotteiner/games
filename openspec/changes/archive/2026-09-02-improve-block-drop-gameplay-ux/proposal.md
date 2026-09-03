## Why

Block Drop is fully playable, but its score and next-piece information are visually secondary, completed rows disappear without feedback, and controls lack the hierarchy and interaction polish expected of a modern falling-block game. Improving these cues will make play easier to scan, more satisfying, and more usable across pointer, keyboard, and touch input.

## What Changes

- Recompose the play screen around the board with a prominent right-side game HUD that enlarges the score and next-piece preview while preserving a compact, complete phone layout.
- Add a short line-clear animation before completed rows collapse and play continues, including a reduced-motion alternative.
- Clean up the catalog, navigation, and gameplay buttons with consistent sizing, visual hierarchy, hover/pressed/focus/disabled feedback, clearer grouping, and touch-friendly targets.
- Extend component, controller, and browser coverage for the responsive HUD, transient clear feedback, input behavior during the animation, and accessible motion and controls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Strengthen the responsive and accessible presentation, provide visible feedback when rows clear, and improve the clarity and interaction states of game controls.

## Impact

- Affects the Block Drop Preact presentation, shared application and game CSS, Canvas controller rendering/timing, and focused component, controller, and end-to-end tests.
- The deterministic board, piece sequence, scoring rules, pause behavior, persisted data, and offline architecture remain unchanged.
- No new runtime dependencies or external APIs are required.
