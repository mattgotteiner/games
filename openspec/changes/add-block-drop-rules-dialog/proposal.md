## Why

New players may not know what to do with the falling pieces. The existing
scoring and controls guide explains points and keyboard shortcuts, but does not
offer a short, friendly introduction to the basic goal and play pattern from
the pause menu.

## What Changes

- Add a clearly labelled Rules button to the pause menu.
- Open a compact beginner guide in a modal box, describing how to move and turn
  pieces, clear complete lines, avoid filling the board to the top, and use
  Drop and Hold.
- Provide an explicit × close button. Closing the guide returns to the pause
  menu without resuming play.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: add access to a beginner-oriented rules guide from the pause
  menu.

## Impact

- Adds a pause-menu action and a separate rules dialog.
- Leaves scoring, keyboard help, and game rules unchanged.
- No new dependencies or persisted data.
