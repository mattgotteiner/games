## Why

Phone review approved Brick Burst, but the player reported that it feels slow
paced. The current ball starts at 300 units/second on Medium and gains only
2% after every eight brick hits. Losing a ball adds a 600 ms pause, and clearing
a level adds a 900 ms pause.

Raise the pace from the first serve, let successful rallies build speed sooner,
and reduce the waits between rallies. These are proposed tuning values; their
feel still needs a phone review.

## What Changes

### Review fixes (implement these first)

A code review of the committed implementation (`44efaa2`) found defects. They
are part of this change, and they come **before** any tuning. Several of them
make the faster pace worse (see `design.md` §0 and `tasks.md` section 0):

1. A held Left/Right key or button stops steering after a ball-loss or
   level-clear freeze, until it is released and pressed again.
2. At browser zoom below 100% (`devicePixelRatio < 1`), the canvas is
   resized and reallocated on every animation frame.
3. The brick tie-break keeps the last tied candidate. The spec requires the
   lower row, then the lower column.
4. The rally speed cap repeats the level-speed formula instead of calling
   `levelSpeed()`. This change edits exactly that formula.
5. `matchMedia` runs on the simulation hot path, and every mouse
   `pointermove` causes an extra full-canvas draw.
6. Brick Burst imports math and canvas helpers from Block Drop's renderer
   internals instead of `src/games/shared/`.
7. Small cleanups:
   - an inline catalog style
   - a duplicated game-ID list
   - an inaudible lives span
   - an unused `crackFlash` path

### Pace tuning

| Setting | Current | Proposed |
| --- | --- | --- |
| Base ball speed | 300 units/s | 390 units/s (+30%) |
| Rally acceleration | +2% every 8 brick hits | +4% every 4 brick hits |
| Rally speed cap | 1.6 × level speed | 1.6 × level speed |
| Held keyboard/button paddle speed | 420 units/s | 540 units/s |
| Ball-loss feedback | 600 ms | 400 ms |
| Level-clear feedback | 900 ms | 650 ms |

The paddle increase accompanies the faster ball. Relative touch drag stays at
1:1, and mouse steering still follows the pointer. Easy, Medium, and Hard keep
their existing speed and score multipliers. Difficulty changes continue to
apply at the next serve. Scoring, lives, layouts, and saved preferences retain
their current rules.

The design compares other ideas: a shorter field, help with the last few
bricks, time-based acceleration, and multiball or piercing power-ups. Those
change more of the game and are deferred from this first tuning pass.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `brick-burst`: held steering that survives feedback freezes, the brick
  tie-break as specified, no per-frame resizing when zoomed out, faster ball
  and held steering, earlier rally acceleration,
  shorter transition feedback, and collision coverage at the new maximum speed.

## Impact

- Fixes review defects in `controller.ts`, `rules.ts`, `renderer.ts`,
  `BrickBurst.tsx`, `App.tsx`, `app.css`, and `game-navigation.ts`. Moves the shared
  helpers into `src/games/shared/`.
- Updates the tuning constants and acceleration cadence in `rules.ts`.
- Keeps the 240 Hz simulation; the proposed maximum speed is 1092 units/s,
  or 4.55 units per step. Collision tests must verify the new bound.
- Synchronizes Canvas feedback and the DOM level-clear callout with the shorter
  durations; updates the active art reference for those effects.
- Updates rules, controller, and browser tests and captures fresh phone states.
- Adds no dependencies, assets, storage keys, or settings.
- This change is a proposal. The committed game retains the approved tuning
  until this change is implemented and reviewed.
