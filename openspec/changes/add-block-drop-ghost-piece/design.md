## Context

`rules.ts` already computes the landing row inside `hardDrop()`, which moves the piece down one row at a time until `tryActive` refuses. `controller.ts` `draw()` fills the board background, draws locked cells and active cells with `drawCell` (a flat inset `fillRect`), then strokes the full grid, then draws line-clear and game-over overlays. Controller tests use a fake 2D context whose methods are `vi.fn()` spies. See `proposal.md` and `specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Show exactly where hard drop will lock the active piece, using the same calculation as hard drop.
- Keep grid lines out of occupied cells.
- Make adjacent cells and similar hues distinguishable by edge treatment as well as fill color.

**Non-Goals:**

- Changing the piece palette, board background, or line-clear effect.
- Adding a setting to turn the ghost off. This can be added later if players ask for it.
- Pause and game-over presentation (see `add-block-drop-pause-and-game-over-overlays`).

## Decisions

### `getLandingPiece` is the single source of truth

Add `getLandingPiece(state): ActivePiece | null` to `rules.ts`. It returns `null` without an active piece, and otherwise returns the active piece moved to its lowest valid row. Refactor `hardDrop` to use it, computing the distance as `landing.y - active.y` and keeping the score and lock behavior unchanged. A property test over many seeds and random action sequences asserts that hard drop locks exactly the cells `getLandingPiece` returned just before.

Computing the landing row only in the controller was rejected, because two drop loops could drift apart.

### Ghost style

Draw the ghost before the active piece, and only when its cells differ from the active piece's cells. Each cell is a stroked inset square in the piece's color at about 45% alpha, with a 2 CSS pixel line scaled by device pixel ratio, plus a faint fill at about 8% alpha. An outline reads as "not yet placed" in every piece color, and the faint fill helps on dense stacks. The ghost is not drawn during line-clear feedback or game over, which is already the case for the active piece. While paused it is drawn with the active piece.

A solid translucent fill was rejected because it can be confused with locked cells of the same hue.

### Draw order and cell edges

The new order is: board background, grid, locked cells, ghost, active cells, then line-clear and game-over overlays. `drawCell` keeps its inset fill and adds a top and left highlight (white at about 28% alpha) and a bottom and right shade (black at about 22% alpha). Each is `max(1, round(size * 0.08))` CSS pixels thick, drawn as thin `fillRect`s so the existing fake context can observe them.

## Risks / Trade-offs

- [The ghost can clutter a nearly full board] -> The outline-only style keeps it light. It is hidden whenever it overlaps the active piece.
- [Extra `fillRect` calls per cell] -> At most 200 cells with three rectangles each per frame is negligible for Canvas 2D. Drawing only happens on state changes and during the clear effect.
- [Existing controller tests count or order draw calls] -> Update those assertions to the new order in the same change.

## Migration Plan

1. Add `getLandingPiece`, refactor `hardDrop`, and add rules tests.
2. Change the draw order and cell edges, and add the ghost, with controller tests.
3. Add browser pixel checks and run `npm run check`. Roll back by reverting `rules.ts` and `controller.ts`; no data migration is needed.
