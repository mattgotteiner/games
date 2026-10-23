# Faster Brick Burst implementation review

Implementation and automated validation are complete. After the native drag
fix, the user said "Good. Approved, merge" on 2026-10-23 UTC. This accepts the
reviewed build and closes acceptance for specification synchronization and
archival. The user did not supply a per-difficulty physical-device review matrix;
automated results do not establish that coverage.

## Implemented behavior

- Base ball speed 390 units/s; held paddle speed 540 units/s.
- Rally acceleration 4% every four brick hits, including tough-brick damage,
  with the existing 1.6× cap and serve-locked difficulty/scoring multipliers.
- Ball-loss/level-clear feedback 400/650 ms, synchronized with the Canvas
  feedback and the DOM callout duration.
- Held steering survives freezes, pause/resume, and restart. Direction controls
  use `aria-disabled` during freezes so pointer holds can still be tracked;
  rules prevent movement until serving/play resumes. Serve stays natively disabled.
- Effective-DPR comparisons avoid repeated allocation at browser zoom below 100%.
- Motion preference is cached and observed; input rendering is coalesced into
  animation frames. Canvas helpers are shared by both games, and the renderer
  owns tough-brick flashes. Brick ties favor lower row/column indices.

## Automated checks

- Review fixes passed the full gate before tuning: 337 unit/component tests,
  production build, and 35 Chromium browser flows. New regressions were observed
  failing before their fixes; logs are `/tmp/brick-pace-0*-before.log`.
- Final `npm run check`: 351 unit/component tests, production/PWA build, and all
  37 Chromium browser flows passed. Existing Block Drop unit tests are unchanged.
- All 9 Brick Burst phone Chromium flows passed, including offline play.
  Three additional phone flows against Tailscale HTTPS passed: navigation, real
  touch steering, and the sustained/capped/reduced-motion capture flow.
- Full-board plus eight-pop profile at 4× CPU slowdown: 60 frames, maximum
  4.2 ms, p95 3.8 ms, no frames at or above 16 ms.
- Collision checks cover the 1092 units/s maximum, brick faces/corners/seams,
  paddle center/edges, wall clamping and deterministic tie-breaking. The
  200-seed × 20,000-step no-flat-path campaign passes.
- The active [art reference](art-direction/preview.html) renders correctly and
  describes the revised loss/clear timings. Archived art files are unchanged.

## Fixed-seed timing comparison

Both builds use seed 41, level 1, and an immediate serve with no steering before
first contact. Values are simulation time, quantized to a 1/240-second step.
The baseline includes the review fixes and precedes pace tuning.

| Difficulty | Before first contact | After first contact | Time reduction |
| --- | --- | --- | --- |
| Easy | 1650.00 ms | 1270.83 ms | 23.0% |
| Medium | 1237.50 ms | 954.17 ms | 22.9% |
| Hard | 991.67 ms | 762.50 ms | 23.1% |

A second replay ran the same timed action list for 10 seconds on each difficulty.
The inputs and complete event sequences are preserved with the observation JSON.
Different travel speeds change subsequent bounces and losses; these scripted
outcomes are reproducibility observations, not a measure of human success or
level completion time.

Baseline screenshots and JSON are preserved outside Playwright's cleared output
at `/home/matt/Documents/Codex/2026-10-22/pull-latest-games-and-implement-the/brick-burst-pace-baseline/`.
The comparison script is saved there as `compare-observations.mjs`.
New phone captures and observation JSON belong under ignored
`test-results/brick-burst/pace/`, including serving, normal/sustained/capped
rallies on Easy/Medium/Hard, ball loss, level clear, pause, game over, and reduced
motion. The 10-second input list is identical across the two observation JSON files.

## Phone review

Review the live build at
[Brick Burst](https://matt-srv.tail18ced3.ts.net:10000/games/?game=brick-burst).
Check the first serve and late-rally control on all three difficulties, held
Left/Right and keyboard steering, and feedback readability with reduced motion.
The user accepted the reviewed build after the drag fix, without requesting
further numerical adjustments.

## Dragging the page during phone play

Phone feedback reported the page or board moving under the finger. Gesture
listeners previously covered only the Canvas and control bar; blank space around
the board did not steer, and native touch/drag defaults were not explicitly
cancelled. Two controller regressions and a real-touch padding regression failed
before the fix.

The layout now provides one captured gesture surface, including board padding
and layout gaps. Local non-passive touch listeners cancel browser gestures, and
CSS disables gameplay selection, callouts, native Canvas dragging, and root
overscroll while Brick Burst is open. The slider and buttons retain native
activation; Help remains outside the gesture surface.

Validation: 353 unit/component tests, all 39 desktop browser flows, typecheck,
production/PWA build, and strict OpenSpec validation passed. Horizontal/diagonal
real-touch checks cover the field,
padding, and a layout gap with deliberate document overflow so page panning is
observable. They verify paddle displacement, fixed board bounds, unchanged
scroll/zoom, and no accidental serve. Native drag cancellation, a real-touch
difficulty slider, and Help scrolling also pass. All 10 applicable Brick Burst
phone flows passed through Tailscale; the production-only offline flow is skipped
on that dev server and checked in the desktop production suite. Physical iPhone
verification was not performed by the agent. The user's subsequent approval is
the acceptance decision.
