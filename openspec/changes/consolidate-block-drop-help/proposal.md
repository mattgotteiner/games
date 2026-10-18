## Why

New players may not know what to do with the falling pieces. The existing Help
control opens a detailed scoring and keyboard reference from the game header,
while the proposed Rules guide would add a second place to look. One Help
dialog in the pause menu can serve both needs, with a short beginner
introduction first and the existing detailed reference after it.

## What Changes

- Move the Help entry from the game header into the pause menu, leaving one
  clearly labelled Help button.
- Open one modal dialog containing a concise beginner `How to play` section
  first, followed by the existing `Scoring and controls` reference.
- Provide an explicit × close button. Closing the dialog returns to the pause
  menu without resuming play.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: consolidate the beginner rules, scoring explanation, and
  keyboard reference in one Help dialog opened from the pause menu.

## Impact

- Removes the separate header Help control and adds one Help action to the
  pause menu.
- Combines beginner rules with the existing scoring and keyboard reference.
- Leaves scoring calculations, keyboard mappings, and game rules unchanged.
- No new dependencies or persisted data.
