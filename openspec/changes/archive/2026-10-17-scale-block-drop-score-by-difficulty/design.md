## Context

The current difficulty setting lives in the controller and affects gravity
only. Rules state contains the score, level, and board, but not the selected
difficulty. Score awards are calculated in the rules, and best scores are
stored as integers in local storage. The canonical requirements are in
`openspec/specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Make every awarded point reflect the selected speed multiplier.
- Keep line-clear awards multiplied by the level before the clear.
- Keep score totals and best-score persistence accurate when they contain half
  points.
- Keep identical seeded games deterministic when they receive the same actions
  and difficulty changes.

**Non-Goals:**

- Changing gravity intervals, difficulty labels, or the level curve.
- Awarding points for automatic gravity.
- Separate best-score lists by difficulty.

## Decisions

### Difficulty is part of rules state

Add the selected difficulty to `BlockDropState`, defaulting to Medium. The
controller updates it when the user changes the pause-menu slider, and the
rules use it when awarding points. This keeps score transitions deterministic:
the same seed, actions, and difficulty selections produce the same state.
Restart resets the board, lines, level, and score while retaining the chosen
difficulty for the current session.

Keeping difficulty outside rules state was adequate while it affected only
gravity. It is no longer sufficient once difficulty changes rule-based scores.

### Apply the multiplier to each score award

The selected difficulty's speed value is also its score multiplier:

| Award | Easy (0.5×) | Medium (1×) | Hard (1.5×) |
|---|---:|---:|---:|
| Soft drop, per row | 0.5 | 1 | 1.5 |
| Hard drop, per row | 1 | 2 | 3 |
| Single clear, Level 1 | 50 | 100 | 150 |

For a line clear, multiply the base clear value by the level before the clear
and by difficulty. Do not retroactively recalculate earlier points when the
player changes difficulty while paused; each action uses the selected mode at
the time that action is scored. Automatic gravity continues to award zero.

### Preserve half-point precision

Easy and Hard soft drops produce fractional point totals (0.5 and 1.5 per row).
Keep these values in the score rather than rounding each award, display the
resulting `.5` when present, and allow the best-score parser to read
non-negative half-point values. Existing integer local-storage values remain
valid.

### Keep one personal best

Continue using one per-device best score. Higher-speed modes intentionally earn
more points, so this record rewards both play and selected pace rather than
comparing difficulty modes separately.

## Risks / Trade-offs

- [The higher Hard multiplier could make the best score favor Hard] -> This is
  intended: selecting a faster pace earns a larger reward.
- [Fractional values might be rounded by display or persistence code] -> Keep
  score values as numbers and update the parser, score labels, and tests for
  half-point values.
- [Changing difficulty during a run could make scoring unclear] -> Apply the
  selected multiplier only to points earned after the change and explain the
  formula in the scoring guide.

## Migration Plan

1. Add difficulty to deterministic rules state and preserve it on restart.
2. Scale soft-drop, hard-drop, and line-clear awards by difficulty; retain the
   pre-clear level multiplier.
3. Update score display, best-score parsing, line-clear callouts, and the
   scoring guide.
4. Add rules, controller, component, and browser coverage, then run
   `npm run check`. Existing best-score integers remain readable.
