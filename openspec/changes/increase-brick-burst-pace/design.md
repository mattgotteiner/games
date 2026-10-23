## Context

Brick Burst's initial implementation is approved and committed in `44efaa2`.
The review feedback is that the game feels slow paced. The values below come
from the committed `src/games/brick-burst/rules.ts`:

- Medium starts at 300 units/s; Easy and Hard use 0.75× and 1.25×.
- Each level multiplies speed by `min(1.4, 1 + 0.06 × (level − 1))`.
- Every eighth brick hit multiplies rally speed by 1.02, capped at 1.6× level
  speed. The first hit on a tough brick counts toward this cadence.
- Ball-loss and level-clear feedback freeze play for 600 and 900 ms.
- Held keyboard/button movement is 420 units/s. Touch drag is relative at 1:1.

These identify useful tuning controls; they do not establish which one caused
all of the reported feel. A phone comparison will test the proposed combination.

## Goals / Non-Goals

**Goals:**

- Make the first serve more active and let a successful rally build momentum.
- Shorten transitions while keeping ball loss and level clear readable.
- Keep held paddle movement usable with the faster ball.
- Preserve deterministic rules and verify collisions at the new speed bound.

**Non-Goals:**

- Adding a pace setting beside Difficulty, changing difficulty multipliers or
  point awards, or resetting saved best scores.
- Changing layouts, tough-brick health, field geometry, paddle size, bounce
  angles, the 30° minimum angle from horizontal, or touch gain.
- Adding automatic serves, aiming assistance, power-ups, or new art.

## Ideas considered

| Idea | Expected benefit | Trade-off and decision |
| --- | --- | --- |
| Raise base ball speed | Shorter travel from the first serve, including sparse boards | Select +30%; review whether Easy remains approachable |
| Accelerate rallies sooner | Reward sustained contact with a more active rally | Select +4% every four hits; retain the 1.6× cap |
| Shorten feedback pauses | Less waiting after losses and level clears | Select 400/650 ms; retain player-triggered serving |
| Increase held paddle speed | Faster button/keyboard traversal with the faster ball | Select 540 units/s; retain precise 1:1 touch drag |
| Accelerate with elapsed rally time | Build speed even without hitting bricks | Defer; idle rallies would become harder without successful contact |
| Move the bricks lower or shorten the field | Shorter trips without raising speed | Defer; changes geometry and requires broader layout/art review |
| Guide bounces toward the last few bricks | May reduce late-level searching | Defer; changes the relationship between paddle contact and aim |
| Add multiball or piercing power-ups | More simultaneous hits and board clearing | Defer; adds mechanics and balance work beyond a tuning pass |

The expected benefits are design hypotheses. This proposal does not claim a
measured improvement in completion time or player success.

## Decisions

### 1. Start the ball 30% faster

Set `BASE_SPEED = 390`. Keep the difficulty multipliers and level curve:

```
levelSpeed(level, difficulty) =
  390 × difficultyMultiplier × min(1.4, 1 + 0.06 × (level − 1))
```

| Difficulty | Current level 1 serve | Proposed level 1 serve |
| --- | --- | --- |
| Easy | 225 units/s | 292.5 units/s |
| Medium | 300 units/s | 390 units/s |
| Hard | 375 units/s | 487.5 units/s |

For a fixed path, +30% speed reduces travel time by about 23% (`1 − 1/1.3`).
This is a travel-time calculation, not a prediction of level-clear time.
Proposed Easy starts close to the previous Medium pace; review it explicitly.

### 2. Build speed after every four brick hits

Introduce named tuning constants for the cadence, factor, and cap:

```
RALLY_HITS_PER_INCREASE = 4
RALLY_SPEED_FACTOR = 1.04
RALLY_SPEED_CAP = 1.6
```

On each brick hit, including a first hit on a tough brick, increment
`rallyHits`. On each fourth hit, multiply speed by 1.04, capped at 1.6× the
level speed locked at the serve. Rescale both velocity components by the same
factor so acceleration preserves direction.

A level 1 Medium rally is 390 units/s at serve, 405.6 at hit 4, and 421.824 at
hit 8. It reaches its 624 units/s cap at hit 48. The current tuning would need
192 hits to reach its 1.6× cap. This comparison describes the rules; it is not
an observed rally length.

Reset the rally counter and speed for the next serve after a loss. Changing
Difficulty while paused changes the selection and next serve, while the current
ball's speed, acceleration cap, and scoring multiplier stay locked to its serve.

### 3. Keep held steering responsive

Set `PADDLE_SPEED = 540`. Crossing the paddle's full 320-unit center range takes
about 0.59 s rather than 0.76 s. This only changes held Left/Right, A/D, and
visible button movement. The 24-unit keyboard/assistive activation nudge,
relative touch movement, mouse following, capture, release, and cancellation
retain their existing behavior.

### 4. Reduce transition waits together with their presentation

Set `BALL_LOST_MS = 400` and `LEVEL_CLEAR_MS = 650`. The rules continue to freeze
ball, paddle, and brick movement during feedback. These durations equal 96 and
156 simulation steps. Pause freezes the remaining timer, and resume discards
paused wall-clock time.

The controller already normalizes its glow and sweep progress using those
constants. Keep using normalized progress. Bind the DOM level-clear animation
duration to `LEVEL_CLEAR_MS` instead of a separate hard-coded 900 ms value.
The sweep occupies the first 60% of the 650 ms interval; the cosmetic paddle
settle occupies the last 40%. The 300 ms lost-life pip transition still fits
inside the new 400 ms feedback interval.

The next ball still waits for an explicit serve. Reduced motion keeps the
same feedback durations and readable level callout, with the existing motion
omissions. Brick pops (240 ms), crack/paddle flashes (120 ms), and layout fade-in
(160 ms plus 30 ms per row) retain their existing durations.

The archived art direction remains a historical record. When implementing,
create an active `art-direction.md` and runnable `art-direction/preview.html`
from the archived reference, update its loss/clear timings, and link the current
reference from the handoff. Do not rewrite the archived reference.

### 5. Verify the higher collision bound

The maximum proposed speed is:

```
390 × 1.25 × 1.4 × 1.6 = 1092 units/s
1092 / 240 = 4.55 units per step
```

That step distance remains below the 5-unit ball radius, 10-unit paddle height,
and 16-unit brick height. Keep the 240 Hz step and 100 ms catch-up cap. This
step-size argument supports retaining the current collision approach; it does
not replace tests of corners, seams, or paddle edges.

Replace tests fixed at the old 840 units/s maximum with the new bound. Cover
brick faces and corners, adjacent-brick seams, paddle center and edges, wall
clamping, the one-brick-per-step tie-break, and the no-flat-path property.
Retain the same seed/input determinism and 60/120 Hz equivalence guarantees.
Trajectories will differ from the previous version because speed has changed.

### 6. Preserve stored preferences and score rules

Keep the existing `games.brick-burst.difficulty` and
`games.brick-burst.best-score` keys and their validation. No migration or best
score reset is needed for this change. Point awards, level bonuses, lives,
and the 0.75×/1×/1.25× score multipliers retain their rules. The existing pause
menu and HUD still describe the selected difficulty multiplier.

## Risks / Trade-offs

- The combination of a higher starting speed and earlier acceleration may be
  too demanding on a phone. Review both the first serve and a capped rally on
  Easy, Medium, and Hard before treating the tuning as accepted.
- Faster held movement may overshoot a target. Include held Left/Right and
  keyboard checks in phone/desktop review; touch gain stays at 1:1.
- Sparse end-of-level boards may still require several aiming attempts. Faster
  travel does not solve target selection; evaluate that separately if reported.
- The shorter level sweep must leave the callout readable, including with
  reduced motion. Compare the DOM callout and Canvas feedback at the same progress.
- The higher collision bound needs the expanded tests above. Do not infer
  collision correctness solely from the smaller-than-radius step distance.

## Implementation and review

1. Update the tuning constants and focused rules tests, including max speed.
2. Synchronize the DOM/Canvas timings and active art reference.
3. Run `npm run check` and the phone Brick Burst flows; retain existing Block
   Drop coverage and the 4× CPU frame budget below 16 ms.
4. Use fixed seeds and identical inputs to capture first serve, sustained/capped
   rally, ball lost, and level clear. Record first-contact time and a reproducible
   rally segment where practical; compare timings as gameplay evidence, not as
   a benchmark of player success. Preserve baseline screenshots separately from
   the new screenshots.
5. Review the revised game on a physical phone, focusing on initial pace,
   late-rally control, and readability. The proposed numbers remain provisional
   until that review; any adjustment must update this change and its tests.
