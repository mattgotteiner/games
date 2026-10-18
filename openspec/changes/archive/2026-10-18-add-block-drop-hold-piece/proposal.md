## Why

Block Drop currently gives players no way to save a useful piece for a later
board opening. A one-piece hold slot adds a familiar planning choice without
changing the board, scoring, or piece-bag rules.

## What Changes

- Add one hold slot, usable once for each active piece.
- Holding into an empty slot stores the active piece and spawns the queued next
  piece. Holding again after the current piece locks swaps with the saved piece.
- Show an accessible hold preview and provide touch, keyboard, and visible
  control inputs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: deterministic hold and swap behavior, hold availability, and
  readable held-piece preview.

## Impact

- Adds a hold action and hold state to the rules, controller, and game HUD.
- Seeded games remain deterministic for identical action sequences. Replays
  without hold actions keep their existing piece queue.
- No new dependencies or persisted data.
