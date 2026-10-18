## Why

Rotation in Block Drop tries only the piece's current position. Next to a wall or the stack, the rotated shape often overlaps by one cell, so the rotation is refused with no feedback. A vertical I piece against either wall can't turn flat at all. To the player, especially on touch, this feels like a missed input.

## What Changes

- When a rotation doesn't fit in place, try shifting the rotated piece one cell right, then one cell left. For the I piece, also try two cells right, then two cells left. Use the first position that fits.
- Refuse the rotation only if none of these positions fit.
- There are no upward or downward kicks. Full SRS (the Super Rotation System used in modern official games) remains deferred.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Clockwise rotation tries a fixed, deterministic sequence of horizontal offsets before refusing.

## Impact

- Affects the `rotate` case in `rules.ts` and the rules tests. The landing preview, controller, and presentation pick up the change automatically.
- Seeded replay stays deterministic. Replays recorded under the old rules may diverge after a rotation that now succeeds.
- No new dependencies, APIs, or persisted data.
- A focused Block Drop rules change. It does not depend on the difficulty preference or persistence work.
