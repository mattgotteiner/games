**Complete section 0 before section 1.** Each fix needs a test that fails
before it and passes after. Commit the fixes separately from the tuning. The
details are in `design.md` §0.

## 0. Review fixes (before any tuning)

- [x] 0.1 Held steering survives freezes. Record held keys and buttons regardless of status, and resend `steer` whenever the status enters `serving` or `playing`. Controller tests:
  - hold ← through `ball-lost` into `serving`: the paddle moves on the first serving step
  - the same through `level-clear`
  - press during the freeze or pause and keep holding: it moves once play allows
  - release stops it
  - Brick Burst E2E: hold ArrowLeft across a seeded lost ball, and the paddle x decreases after serving resumes
- [x] 0.2 Compare the clamped `effectiveRatio()` in `tick()`. Test that `devicePixelRatio: () => 0.9` over 10 frames sizes the canvas once.
- [x] 0.3 Change the tie-break to `distance < closest`. Add rules tests for exact horizontal-seam and vertical-seam ties, where the lower column or row is hit and the neighbor is unchanged.
- [x] 0.4 Add `levelSpeedFor(level, multiplier)` as the single formula, used by `levelSpeed()` and the rally cap. Test that the cap after a mid-rally difficulty change uses the served multiplier.
- [x] 0.5 Cache the reduced-motion `MediaQueryList` with a `change` listener that is removed on destroy. Defer `dispatch()` drawing to the frame loop while it runs. Test that 20 mouse `paddle-to` dispatches within one frame cause one draw.
- [x] 0.6 Move `hash`, `ease`, `clamp01`, and `roundRect` (plus `mix`/`alpha` if used) to `src/games/shared/canvas.ts`, and update both games' imports. Block Drop renderer tests must pass unchanged.
- [x] 0.7 Cleanups (design §0.7):
  - move the `.game-list` style into `app.css`
  - derive `GameId` from a `GAME_IDS` const with an `isGameId` guard
  - remove the inaudible lives span
  - route the tough-brick flash through `crackFlash`, or delete it
- [x] 0.8 Run `npm run check`. All Block Drop and Brick Burst suites must pass before starting section 1.

## 1. Faster deterministic rules

- [x] 1.1 Set `BASE_SPEED` to 390 and held `PADDLE_SPEED` to 540. Preserve the level curve, difficulty multipliers, serve-angle rules, 24-unit nudge, and 1:1 touch movement.
- [x] 1.2 Introduce named rally constants, and keep using `levelSpeedFor` from 0.4 for the cap: four brick hits per increase, 1.04 factor, 1.6× cap. Count tough-brick damage hits; preserve direction and the serve-locked speed/scoring multipliers.
- [x] 1.3 Cover level 1 speeds 292.5/390/487.5, the level curve and 1092 units/s maximum, hit boundaries 3/4 and 7/8, the cap at hit 48, lost-ball reset, and difficulty changes during a paused rally.
- [x] 1.4 Run brick/paddle no-tunneling tests at 1092 units/s, including faces, corners, seams, and paddle edges. Retain tie-break, wall clamping, 200-seed no-flat-path coverage, and deterministic replay.

## 2. Shorter feedback and synchronized art

- [x] 2.1 Set ball-loss feedback to 400 ms (96 steps) and level-clear feedback to 650 ms (156 steps). Test the final frozen step, next transition, pause/resume, and last-life game over.
- [x] 2.2 Derive the DOM callout duration from `LEVEL_CLEAR_MS`; verify the controller's normalized glow/sweep/settle and reduced-motion behavior use the same interval.
- [x] 2.3 Create an active art reference from the archived Classic reference and update its loss/clear timing descriptions and runnable scenes. Keep the archived reference unchanged.
- [x] 2.4 Update hard-coded controller/browser fixtures and help or other text only where the changed tuning makes it inaccurate. Preserve point awards, storage keys, controls, and announcements.

## 3. Integration and phone review

- [x] 3.1 Verify 60/120 Hz state equivalence, the 100 ms frame cap, pause timing, continuous button/keyboard steering, and touch mapping at two board sizes.
- [x] 3.2 Run `npm run check`, including the full Block Drop regression suite, production/offline checks, and 4× CPU frame-budget coverage below 16 ms.
- [x] 3.3 Run the phone Chromium Brick Burst flows and smoke-test the Tailscale review URL. Preserve baseline captures outside the test runner's cleared output directory; save new serving, sustained/capped rally, ball-loss, and level-clear phone captures under ignored `test-results/brick-burst/pace/`.
- [x] 3.4 Compare identical seeds/inputs at the first serve and during a reproducible rally segment; record timing observations and user acceptance of the reviewed build. The user approved the build after the touch fix on 2026-10-23 UTC. A physical review matrix for every difficulty, held control, and reduced-motion combination was not supplied; no such coverage is claimed.
- [x] 3.5 Record review acceptance and the drag fix, synchronize the capability spec, and archive the accepted change.

## Implementation validation

Sections 0–2 and automated integration are complete. The review fixes were
committed separately from tuning. After the drag fix, validation passed 353
unit/component tests, the production build, and all 39 Chromium flows. All 10
applicable Brick Burst phone flows passed against Tailscale HTTPS; the
production-only offline flow passed in the desktop suite. Updated sustained-rally
captures are also verified on Chromium and phone Chromium.

See `review.md` for collision/performance results, seeded before/after timing,
new captures, the preserved baseline location, and the user's approval to merge.
Automated checks do not establish physical-device coverage.
