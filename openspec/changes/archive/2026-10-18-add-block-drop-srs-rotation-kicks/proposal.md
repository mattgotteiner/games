## Why

Block Drop currently tries only a few horizontal offsets when a rotation
collides. That misses the standard SRS transitions that move pieces vertically
or use different offsets depending on the current orientation.

## What Changes

- Apply the five ordered Super Rotation System (SRS) kick tests to each
  clockwise transition for I and JLSTZ pieces.
- Allow an active piece to occupy space above the visible board after an
  upward kick, and end the game if it locks before returning fully into view.
- Keep O-piece rotation unchanged and keep counter-clockwise rotation out of
  scope.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: orientation-specific clockwise SRS kicks, including vertical
  offsets and above-board active positions.

## Impact

- Updates deterministic rotation rules and top-out handling.
- Extends rules tests and adds an end-to-end rotation flow.
- No change to scoring, bag generation, or persisted data.
