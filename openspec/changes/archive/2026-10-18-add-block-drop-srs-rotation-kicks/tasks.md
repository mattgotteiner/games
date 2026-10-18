## 1. SRS Rotation Rules

- [x] 1.1 Add the five ordered SRS kick tests for each clockwise transition for I and JLSTZ pieces.
- [x] 1.2 Allow active cells above the visible ceiling and end the game safely when a piece locks above it.
- [x] 1.3 Cover all transition tables, candidate ordering, upward kicks, blocked rotations, top-out, and O-piece no-op behavior.

## 2. Integrated Verification

- [x] 2.1 Add an end-to-end flow that rotates pieces at the side walls and near the floor, then continues play.
- [x] 2.2 Run `npm run check` and verify type checking, 215 unit/component tests, production build, and all 13 Chromium flows.
- [x] 2.3 Review the rotation flow on a phone.
