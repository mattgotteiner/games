## Context

`ActivePiece.rotation` stores four clockwise states, and `rotatedCells` turns
each tetromino within its existing 3×3 or 4×4 rotation box. The board has 20
visible rows, while `isValidPiece` currently rejects every cell above row 0.
The current kick rule tries fixed horizontal offsets and does not account for
which orientation transition is being made.

## Goals / Non-Goals

**Goals:**

- Use the ordered SRS kick tests for all four clockwise orientation
  transitions for I and JLSTZ pieces.
- Support upward kicks at the top of the visible field and detect top-out if a
  piece locks while any of its cells remain above the board.
- Preserve deterministic rotation, the existing piece centers, and O-piece
  behavior.

**Non-Goals:**

- Counter-clockwise or 180-degree rotation, T-spin detection, or spin scoring.
- A change to piece spawn coordinates, line clearing, or the seven-piece bag.

## Decisions

- Store five `(x, y)` offsets for each clockwise transition: `0→R`, `R→2`,
  `2→L`, and `L→0`. The first offset is the unshifted rotation; candidates are
  tested in table order and the first valid position wins.
- Use the standard I and JLSTZ transition-specific tables. The source tables
  describe positive Y as upward; invert their Y offsets to match the game's
  board coordinates, where positive Y is downward. The ordered tests and
  coordinate convention are listed in Tables 2 and 3 of the primary SRS model
  description: [Tetris with Few Piece Types](https://erikdemaine.org/papers/TetrisPieces_FUN2024/paper.pdf).
- Keep the current square-box pivots. The existing local shapes already use
  the SRS rotation centers: the middle cell for JLSTZ and the center of the
  4×4 box for I.
- Treat cells above visible row 0 as empty while validating an active piece.
  Canvas clipping hides those cells. If gravity, soft drop, or hard drop locks
  a piece with any cell above row 0, end the game without writing outside the
  board.
- Keep O-piece rotation as a no-op.

## Risks / Trade-offs

- Upward kicks can briefly move a piece partly beyond the visible board. This
  is needed for SRS and remains playable through the existing controls.
- A piece can top out while part of it is still above the board; handle this
  before writing locked cells.
- SRS permits advanced rotations, but the game does not recognize or score
  spins.

## Migration Plan

1. Add transition-specific kick tables and rotation selection.
2. Support above-board active cells and safe top-out on lock.
3. Cover every clockwise transition, ordered candidate selection, upward kicks,
   blocked rotations, O-piece behavior, and the integrated keyboard flow.
4. Run the integrated checks and review the E2E game flow before archival.
