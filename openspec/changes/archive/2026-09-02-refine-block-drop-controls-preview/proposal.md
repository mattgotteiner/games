## Why

The refreshed Block Drop controls separate left and right with rotate in between, which works against the expected directional scan order. The next-piece frame also uses raw four-by-four shape coordinates, so pieces with different occupied bounds do not share a consistent visual center.

## What Changes

- Place movement controls in the visual and reading order left, right, rotate, then soft drop, keeping left and right adjacent and rotate immediately to the right of right wherever those controls are presented.
- Center every next tetromino by its occupied-cell bounds inside a preview frame large enough to preserve equal surrounding space without clipping the four-cell I piece.
- Extend component and browser coverage for control order and centered preview geometry across all seven tetrominoes and responsive layouts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Tighten the control-hierarchy and next-piece presentation requirements so directional controls scan naturally and every preview shape is geometrically centered.

## Impact

- Affects Block Drop control ordering, responsive control-grid CSS, next-piece DOM/CSS geometry, and focused component/browser tests.
- Gameplay action mappings, tetromino definitions, Canvas rendering, scoring, animation, and accessibility labels remain unchanged.
- No new dependencies, APIs, or persisted data are introduced.
