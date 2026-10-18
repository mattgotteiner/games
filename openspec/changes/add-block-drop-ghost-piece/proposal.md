## Why

Block Drop does not show where the active piece will land. Hard drop is the fastest move and earns the most points, but without a landing preview the player has to count columns and rows by eye. The playfield is also harder to read than it needs to be. `draw()` strokes the grid after the cells, so grid lines cross every block. Cells are flat fills, so I and J, and Z and L, are hard to tell apart at small sizes.

## What Changes

- Add a landing preview (ghost piece): an outline of the active piece at the position hard drop would lock it in.
- Add a `getLandingPiece` rules helper and have hard drop reuse it, so the preview and the drop cannot disagree.
- Draw the grid beneath occupied cells instead of over them.
- Give each occupied cell a light leading edge and a dark trailing edge, scaled to cell size.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Adds a landing-preview requirement and a playfield-readability requirement for Canvas rendering.

## Impact

- Affects `rules.ts` (new pure helper, `hardDrop` refactor), `controller.ts` drawing, and rules, controller, and browser tests.
- Game state, scoring, seeds, replay determinism, and the controller API are unchanged. The landing position is derived for drawing and is never stored.
- No new dependencies, APIs, or persisted data.
- Second of six planned Block Drop changes. It does not depend on `compact-block-drop-mobile-layout` and can ship in either order.
