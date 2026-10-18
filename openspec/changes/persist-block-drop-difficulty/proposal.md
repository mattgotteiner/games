## Why

The selected difficulty is only shown in the pause menu, so it is easy to lose
track of the current speed and score multiplier during play. A new game also
returns to Medium after a reload, even when the player has chosen another mode.

## What Changes

- Show the active difficulty and its multiplier in the game HUD.
- Save the selected difficulty on the device and restore it when Block Drop is
  opened again, including after a page reload.
- Use Medium when there is no valid saved preference or device storage is
  unavailable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: The active difficulty is visible throughout play and persists
  between game launches.

## Impact

- Adds a difficulty preference to local storage and passes it into initial game
  state.
- Adds a compact difficulty label to the existing HUD progress row.
- No new dependencies or changes to scoring and gravity rules.
