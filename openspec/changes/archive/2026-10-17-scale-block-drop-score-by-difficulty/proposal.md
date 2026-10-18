## Why

The pause-menu difficulty already changes gravity speed to 0.5×, 1×, or 1.5×,
but all three modes currently award the same points. Matching score awards to
the selected speed gives faster play a higher reward while keeping Easy
accessible. The existing level multiplier remains part of line-clear scoring.

## What Changes

- Multiply every score award by the selected difficulty speed: soft-drop rows,
  hard-drop rows, and line clears.
- Keep the level multiplier on line clears, using the level before the clear:
  `base points × level × difficulty speed`.
- Keep automatic gravity worth zero points.
- Preserve half-point scores, which occur on Easy soft drops, and accept them in
  the score display and saved best score.
- Update the scoring guide to show how difficulty and level affect each award.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Score awards use the selected difficulty speed multiplier;
  line clears continue to use the level multiplier.

## Impact

- `BlockDropState` will include the selected difficulty so the rules can score
  each action deterministically. Changing difficulty while paused updates this
  state; restart preserves the selected mode.
- Easy soft drops award 0.5 points per row; Hard soft drops award 1.5. Hard
  drops award 1, 2, or 3 points per row on Easy, Medium, and Hard. Line-clear
  points are the clear's base value multiplied by the level before the clear
  and the current difficulty speed.
- Existing integer best scores remain valid. The score parser and display will
  also accept half points.
- No new dependencies or external data. The best score remains a per-device
  personal record; faster modes can earn more points by design.

## Dependencies

- `add-block-drop-levels`, which introduced the level multiplier and the
  Easy/Medium/Hard speed setting, is implemented and archived.
