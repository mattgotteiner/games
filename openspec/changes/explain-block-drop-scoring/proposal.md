## Why

Block Drop's score changes when players manually move a piece downward, but the
game only displays the total and gives no explanation for those increases. The
implemented formula is intentional and matches common modern falling-block
scoring, so the defect is one of clarity rather than score calculation.

## What Changes

- Add an in-game scoring guide to the Game information HUD.
- Explain that a successful soft-drop row earns 1 point, each hard-drop row
  earns 2 points, and automatic gravity earns no drop points.
- Show the 100, 300, 500, and 800 point awards for clearing one through four
  lines at once.
- Keep the guide readable and discoverable without causing the game to overflow
  on portrait or short-landscape phone viewports.
- Preserve the existing deterministic score formula.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Make the complete scoring formula visible and understandable in
  the Game information HUD while preserving existing score behavior.

## Impact

- Shared scoring metadata in the Block Drop rules module, with no scoring
  behavior change.
- Block Drop HUD markup and responsive styles.
- Component and browser coverage for scoring-guide content, semantics, and
  responsive fit.
- No persistence, API, or dependency changes.
