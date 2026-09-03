## 1. Centered Tetromino Preview

- [x] 1.1 Add a preview-local bounds normalizer that translates each initial tetromino to a zero-based tight grid and reports its width and height; verify component tests cover normalized bounds and exactly four occupied cells for all seven tetrominoes.
- [x] 1.2 Render the normalized cells in a tight nested grid centered inside a six-cell-square preview frame while preserving accessible piece names; verify component tests cover grid dimensions, identifiers, and no clipping for the four-wide I piece.
- [x] 1.3 Update wide, portrait, and short-landscape preview CSS without enlarging the HUD; verify browser geometry checks show representative odd- and even-width pieces share the frame midpoint within rounding tolerance.

## 2. Movement Control Order

- [x] 2.1 Reorder movement controls to left, right, rotate, and soft drop in DOM and visual order; verify component tests assert control-group order and unchanged action dispatch.
- [x] 2.2 Change the short-landscape movement grid to keep left, right, and rotate together on its first row and soft drop after them while retaining 44 px targets; verify browser tests cover adjacency, order, target size, and viewport fit at 568 by 320.

## 3. Integrated Verification

- [x] 3.1 Run the repository check and verify type checking, all unit tests, production build, responsive Block Drop flows, update behavior, and offline play pass without new dependencies.
