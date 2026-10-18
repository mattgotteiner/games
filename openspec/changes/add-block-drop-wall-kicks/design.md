## Context

`applyActionWithEvents` handles `rotate` with `tryActive(state, piece => ({ ...piece, rotation: (rotation + 1) % 4 }))`. `rotatedCells` turns each shape inside its local 3×3 or 4×4 box, and the O piece never changes. `HANDOFF.md` defers "advanced rotation kicks". See `proposal.md` and `specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Make rotation next to walls and the stack succeed in the common cases.
- Keep the rule small, deterministic, and easy to explain.

**Non-Goals:**

- Full SRS kick tables, upward kicks, or T-spin detection.
- Counter-clockwise rotation.
- Lock delay, or resetting it on rotation.

## Decisions

### Fixed horizontal kick sequence

Add a `KICK_OFFSETS` table: `[0, +1, −1]` for J, L, S, T, and Z, and `[0, +1, −1, +2, −2]` for I. Rotation takes the next rotation and returns the first candidate `{ x: piece.x + dx }` that `isValidPiece` accepts. If none is accepted, it returns the unchanged state. The O piece keeps its current behaviour: rotation leaves its cells unchanged and succeeds in place.

The order is fixed so results are deterministic. Trying right before left is an arbitrary choice, but it's documented and tested. Smaller shifts come before larger ones, so the piece moves as little as possible. The I piece needs ±2: a vertical I against the left wall needs +2 to turn flat, and against the right wall it needs −1 or −2 depending on its rotation.

Full SRS was rejected for now. Its value is advanced techniques that this game doesn't score, and it needs per-transition tables and their tests. Upward kicks were rejected because they let pieces climb the stack, which changes the game's balance.

## Risks / Trade-offs

- [A kick can move a piece in a direction the player didn't expect] -> Offsets are at most one cell, or two for the I piece, and the landing preview from `add-block-drop-ghost-piece` shows the result immediately.
- [Fixtures that assert a refused rotation now pass] -> Update those fixtures so that every offset is blocked.

## Migration Plan

1. Add the kick table and rotation logic with rules tests.
2. Run `npm run check`. Roll back by reverting `rules.ts`; no data migration is needed.
