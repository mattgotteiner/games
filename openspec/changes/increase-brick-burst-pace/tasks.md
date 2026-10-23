## 1. Faster deterministic rules

- [ ] 1.1 Set `BASE_SPEED` to 390 and held `PADDLE_SPEED` to 540. Preserve the level curve, difficulty multipliers, serve-angle rules, 24-unit nudge, and 1:1 touch movement.
- [ ] 1.2 Introduce named rally constants: four brick hits per increase, 1.04 factor, 1.6× cap. Count tough-brick damage hits; preserve direction and the serve-locked speed/scoring multipliers.
- [ ] 1.3 Cover level 1 speeds 292.5/390/487.5, the level curve and 1092 units/s maximum, hit boundaries 3/4 and 7/8, the cap at hit 48, lost-ball reset, and difficulty changes during a paused rally.
- [ ] 1.4 Run brick/paddle no-tunneling tests at 1092 units/s, including faces, corners, seams, and paddle edges. Retain tie-break, wall clamping, 200-seed no-flat-path coverage, and deterministic replay.

## 2. Shorter feedback and synchronized art

- [ ] 2.1 Set ball-loss feedback to 400 ms (96 steps) and level-clear feedback to 650 ms (156 steps). Test the final frozen step, next transition, pause/resume, and last-life game over.
- [ ] 2.2 Derive the DOM callout duration from `LEVEL_CLEAR_MS`; verify the controller's normalized glow/sweep/settle and reduced-motion behavior use the same interval.
- [ ] 2.3 Create an active art reference from the archived Classic reference and update its loss/clear timing descriptions and runnable scenes. Keep the archived reference unchanged.
- [ ] 2.4 Update hard-coded controller/browser fixtures and help or other text only where the changed tuning makes it inaccurate. Preserve point awards, storage keys, controls, and announcements.

## 3. Integration and phone review

- [ ] 3.1 Verify 60/120 Hz state equivalence, the 100 ms frame cap, pause timing, continuous button/keyboard steering, and touch mapping at two board sizes.
- [ ] 3.2 Run `npm run check`, including the full Block Drop regression suite, production/offline checks, and 4× CPU frame-budget coverage below 16 ms.
- [ ] 3.3 Run the phone Chromium Brick Burst flows and smoke-test the Tailscale review URL. Preserve baseline captures outside the test runner's cleared output directory; save new serving, sustained/capped rally, ball-loss, and level-clear phone captures under ignored `test-results/brick-burst/pace/`.
- [ ] 3.4 Compare identical seeds/inputs at the first serve and during a reproducible rally segment; record timing observations and review Easy, Medium, and Hard on a physical phone, including held controls and reduced motion.
- [ ] 3.5 Record phone review and any accepted tuning adjustment, then synchronize the capability spec and archive the change after implementation is accepted.
