## Context

The movement control array currently renders left, rotate, right, and soft drop; short landscape CSS then wraps those controls into two columns. The next-piece preview always renders the raw initial coordinates into a four-by-four grid, so empty rows or columns encoded in shape definitions influence apparent alignment. See `proposal.md` for motivation and `specs/block-drop/spec.md` for the updated behavior.

## Goals / Non-Goals

**Goals:**

- Keep left and right adjacent, with rotate immediately following right, across every responsive control layout.
- Center all seven initial-orientation tetromino silhouettes around one stable preview midpoint.
- Preserve equal preview cell sizing, semantic labels, touch targets, viewport fit, and existing action dispatch.
- Make shape normalization and control order directly testable without screenshots.

**Non-Goals:**

- Changing keyboard mappings, piece rotations, board spawn coordinates, or tetromino definitions.
- Adding hold pieces, multiple previews, preview animation, or gameplay changes.
- Reworking the HUD dimensions or control visual variants beyond what the new order requires.

## Decisions

### Make control order explicit in data and responsive grids

Order movement-control data as left, right, rotate, and soft drop so DOM reading order, keyboard tab order, and default visual order agree. Keep four columns when space allows. In short landscape, use a three-column first row for left, right, and rotate, then place soft drop on the following row without inserting another control between the required trio.

Using CSS `order` was rejected because it could make visual order disagree with DOM and keyboard order. Retaining the two-column short-landscape grid was rejected because rotate would wrap away from the adjacent left/right pair.

### Normalize occupied bounds into a nested preview grid

Derive the minimum and maximum x/y values from each initial piece, translate occupied cells to a zero-based tight bounding box, and render them in a nested shape grid sized to those bounds. Center that nested grid with CSS inside a square preview frame based on six equal cell units. The frame provides a full cell of horizontal room around the four-wide I piece, while CSS centering allows both odd- and even-width shapes to share the exact frame midpoint.

Expanding the existing flat grid alone was rejected because no integer grid parity can exactly center both three-cell and four-cell widths. Per-piece hard-coded offsets were rejected because they duplicate shape knowledge and are easy to drift when shapes change.

### Keep presentation normalization local to the preview

Use the existing initial-cell helper as the source of truth and add a small preview-local bounds calculation that returns normalized cells plus width and height. Do not change `getInitialPieceCells`, because rules rotation and spawn behavior rely on its current local coordinates.

Moving preview-only bounds into deterministic rules state was rejected because the values are derived presentation metadata, not game state.

### Verify structure before responsive geometry

Component tests will publish each supported tetromino and assert four occupied cells, normalized bounds, correct nested-grid dimensions, unchanged accessible names, and movement DOM order. Browser tests will assert left/right/rotate adjacency and a common preview center for representative odd- and even-width pieces at portrait, wide, and short-landscape sizes.

## Risks / Trade-offs

- [A larger preview frame can crowd compact HUD layouts] -> Preserve the current outer responsive size clamps and increase logical frame capacity by reducing cell size rather than expanding the HUD.
- [Nested-grid rounding can shift a shape by a fraction of a pixel] -> Center the entire tight grid with layout alignment and compare midpoint tolerance rather than individual pixel edges.
- [Three short-landscape columns can narrow captions] -> Keep 44 px targets, compact gaps, and existing accessible labels while allowing soft drop to occupy the next row.
- [Normalizing raw coordinates could accidentally affect rules] -> Keep normalization inside the preview component and cover the original shape helper with existing rules tests.

## Migration Plan

1. Add preview bounds normalization and component coverage for all seven tetrominoes.
2. Reorder movement data and update default/short-landscape grids with order and target-size coverage.
3. Extend responsive browser geometry checks and run the repository check.
4. Roll back by restoring the prior component/CSS bundle; no persisted data migration is required.
