## 1. Shared Scoring Definition

- [x] 1.1 Introduce immutable scoring metadata for gravity, soft drop, hard drop, and one-through-four-line clears, refactor existing calculations to consume it, and verify the scoring unit tests preserve every current award.

## 2. HUD Scoring Guide

- [x] 2.1 Render an always-visible, semantically labeled scoring definition list in the Game information HUD from the shared scoring metadata, and verify component tests cover every action/value association.
- [x] 2.2 Add wide, portrait, and short-landscape scoring-guide styles, and verify browser tests show the complete guide without clipping or page scrolling at 1280 by 720, 390 by 844, and 568 by 320.

## 3. Integrated Verification

- [x] 3.1 Run the repository check and verify type checking, all unit tests, production build, responsive Block Drop flows, update behavior, and offline play pass without new dependencies or changed score values.
