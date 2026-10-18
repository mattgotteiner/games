## 1. Rotation Kicks

- [x] 1.1 Add the kick-offset table and try each offset in order when rotating; verify rules tests for an I piece against each wall in both vertical rotations, a T piece against each wall, and a J piece beside the stack.
- [x] 1.2 Keep a rotation refused when every offset collides, and keep O-piece rotation unchanged; verify rules tests for a fully enclosed piece and for the O piece.
- [x] 1.3 Update any existing fixture that relied on a refused rotation that now kicks; verify the seeded replay test still produces identical states for identical actions.

## 2. Integrated Verification

- [x] 2.1 Run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
