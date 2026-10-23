# Games Platform Handoff

## Current State

The public application is a responsive, installable Preact, TypeScript, and
Vite game catalog deployed at:

- Repository: `https://github.com/mattgotteiner/games`
- Application: `https://mattgotteiner.github.io/games/`
- GitHub Pages deploys from pushes to `main`.

Block Drop is the first playable game. It includes deterministic seven-piece-bag
rules, scoring, next-piece preview, pause/resume, game over and restart,
keyboard/touch controls, responsive high-DPI Canvas rendering, explicit resource
cleanup, and production offline coverage.

The catalog and Block Drop are URL-addressable:

- Catalog: `https://mattgotteiner.github.io/games/`
- Block Drop: `https://mattgotteiner.github.io/games/?game=block-drop`

Game launch and catalog return update browser history. Direct entry,
Back/Forward navigation, invalid-game recovery, repository-path preservation,
and service-worker-controlled offline deep links are covered.

## Validation

Difficulty persistence was reviewed on a phone, archived, and pushed in
`e3434bd`; the user confirmed the saved choice survives reload. Wall kicks
were reviewed on a phone and pushed to `main`. Hold was reviewed in the
portrait phone layout; the user approved the behavior and spacing. The Hold
feature is archived and pushed. SRS rotation was reviewed on a phone and the
user found no issues. It passes `npm run check`: typechecking, 215
unit/component tests, the production build, and all 13 Chromium flows. Hold
remains centered between movement and action controls with at least 16 px of
clearance on each side; Rotate and Hard drop are restored to their original
stack.
The consolidated Help dialog and its mobile scrollbar clearance were reviewed
on a phone and approved. The Help change is archived and pushed.

## Completed OpenSpec Changes

- `add-installable-offline-shell`
  - `openspec/changes/archive/2026-09-01-add-installable-offline-shell`
- `add-minimal-block-drop`
  - `openspec/changes/archive/2026-09-01-add-minimal-block-drop`
- `add-block-drop-score-preview-pause`
  - `openspec/changes/archive/2026-09-01-add-block-drop-score-preview-pause`
- `add-game-deep-links`
  - `openspec/changes/archive/2026-09-01-add-game-deep-links`
- `compact-block-drop-mobile-layout`
  - `openspec/changes/archive/2026-10-17-compact-block-drop-mobile-layout`
- `add-block-drop-ghost-piece`
  - `openspec/changes/archive/2026-10-17-add-block-drop-ghost-piece`
- `add-block-drop-touch-repeat`
  - `openspec/changes/archive/2026-10-17-add-block-drop-touch-repeat`
- `add-block-drop-pause-and-game-over-overlays`
  - `openspec/changes/archive/2026-10-17-add-block-drop-pause-and-game-over-overlays`
- `add-block-drop-levels`
  - `openspec/changes/archive/2026-10-17-add-block-drop-levels`
- `scale-block-drop-score-by-difficulty`
  - `openspec/changes/archive/2026-10-17-scale-block-drop-score-by-difficulty`
- `persist-block-drop-difficulty`
  - `openspec/changes/archive/2026-10-18-persist-block-drop-difficulty`
- `add-block-drop-wall-kicks`
  - `openspec/changes/archive/2026-10-18-add-block-drop-wall-kicks`
- `add-block-drop-srs-rotation-kicks`
  - `openspec/changes/archive/2026-10-18-add-block-drop-srs-rotation-kicks`
- `consolidate-block-drop-help`
  - `openspec/changes/archive/2026-10-18-consolidate-block-drop-help`

Synchronized capability specs:

- `openspec/specs/offline-installation/spec.md`
- `openspec/specs/block-drop/spec.md`
- `openspec/specs/game-deep-links/spec.md`

## OpenSpec

OpenSpec 1.10.0 is installed globally at:

`C:\Users\magottei\AppData\Local\pnpm\bin\openspec.ps1`

The original `bootstrap-offline-game-platform` change remains as a historical
41-task all-in-one plan. Do not apply it; continue using small changes with
end-to-end-verifiable seams. `publish-mobile-game-shell` is also a superseded
completed change retained for history.

## OpenSpec Change History

Eleven incremental Block Drop changes were applied one at a time. Later changes
modified requirements introduced by earlier ones, so each was archived before
applying the next. The original ten changes and the Help consolidation are
implemented, reviewed, and archived. During
implementation of `add-block-drop-touch-repeat`, mobile E2E
uncovered page panning when dragging from game elements; the fix is recorded in
that archived change and the canonical Block Drop spec. During E2E review of
`add-block-drop-pause-and-game-over-overlays`, the user reported page zoom after
rapid taps on the visible disabled controls below the board overlay. Apple
documents Safari double-tap zooming to fit an HTML block element, making that
a plausible explanation; the exact Safari gesture path was not captured. The
research and hit-testing fix are documented in
`openspec/changes/archive/2026-10-17-add-block-drop-pause-and-game-over-overlays/`.
The fix keeps the controls visible but makes their children untargetable while
inactive, so taps land on the wide controls container. Mobile Playwright
emulation confirmed the hit target and that a Drop tap still works immediately
after resume; user E2E review confirmed the reported zoom stopped. Pinch zoom
is blocked over paused/game-over controls and during the brief post-resume
gesture guard, while remaining available elsewhere. `add-block-drop-levels`
adds line and level tracking, level-scaled line-clear scoring, a progress HUD,
line-clear feedback, and an Easy/Medium/Hard pause-menu speed slider. Easy is
half speed, Medium is the default pace, and Hard is 1.5× faster. The user
reviewed the slider E2E and confirmed the feature works. Scoring is also scaled
by difficulty, and the selected difficulty and multiplier appear in the HUD
and persist on the same device. The user confirmed persistence after reload.
The last full automated check, before the active change, passed 215
unit/component tests, a production build, and all 13 Chromium flows.

The Help dialog keeps beginner instructions, scoring, and controls in one
pause-menu entry. Browser coverage verifies its content order, dismissal, focus
return, and internal scrolling at narrow viewports. Phone review confirmed the
mobile scrollbar has adequate clearance from the text.

1. `compact-block-drop-mobile-layout`: compact header, scoring guide moved
   into a help dialog, playfield-first layout (at least 540 px tall at 390 by
   844), session actions moved away from Drop, and one live announcer.
2. `add-block-drop-ghost-piece`: landing preview, grid drawn under cells,
   and cell edge shading.
3. `add-block-drop-touch-repeat`: press-to-act, hold-to-repeat, thumb
   clusters, and optional haptics.
4. `add-block-drop-pause-and-game-over-overlays`: pause veil and panel,
   game-over card, best score in `localStorage`, and pause when hidden.
5. `add-block-drop-levels`: lines, levels, a gravity curve, a level score
   multiplier, a line-clear callout, and an Easy/Medium/Hard pause-menu speed
   slider. Implemented, user-reviewed, and archived.
6. `scale-block-drop-score-by-difficulty`: apply the selected 0.5×, 1×, or
   1.5× difficulty speed multiplier to awarded points while retaining the
   level multiplier on line clears. Implemented, reviewed, and archived.
7. `persist-block-drop-difficulty`: show the selected difficulty and multiplier
   in the HUD and restore the user's device preference on launch. Implemented,
   reviewed, and archived.
8. `add-block-drop-wall-kicks`: basic horizontal rotation kicks (not full
   SRS); implemented, reviewed on a phone, and archived.
9. `add-block-drop-hold-piece`: one hold slot, once per piece, with a phone
   control, C-key shortcut, and compact hold/next previews; implemented,
   reviewed, archived, and pushed to `main`.
10. `add-block-drop-srs-rotation-kicks`: use standard SRS kick tables for
    clockwise rotations, including upward kicks for supported transitions;
    implemented, automated E2E passing, reviewed on a phone, archived, and
    pushed to `main`.
11. `consolidate-block-drop-help`: combine beginner rules with the scoring and
    controls reference in one pause-menu dialog; implemented, reviewed on a
    phone, archived, and pushed to `main`.

Changes 2 and 6 are independent and can ship at any point. The design
rationale and before screenshots are in `plans/block-drop/PLAN.md` in
`mattgotteiner/claude-design-examples`.

## Deferred Work

A generalized game registry/runtime remains deferred.
Introduce shared platform abstractions only after another game exposes
concrete duplication.

The remaining active change folders are `remove-block-drop-catalog-buttons`,
`add-block-drop-themes`, and `increase-brick-burst-pace`, described below. Brick Burst is complete and archived.
It extracts only the small helpers that both games duplicate. The game registry
and runtime stay deferred.

## Active OpenSpec Change

`remove-block-drop-catalog-buttons` removes both the game-over `Back to
catalog` action and the header `Catalog` button. Browser Back remains the way
to return to the catalog after launch, and the spec plus implementation are
committed and pushed in `a0358f0`. CI and the GitHub Pages deployment passed,
and the public app returned HTTP 200. A phone review is still pending.

`add-block-drop-themes` adds six cosmetic themes: Classic (default), Tron,
Chocolate, Nature, Sketchbook, and Stained Glass. Each theme has its own
line-clear animation. A Theme picker in the pause menu saves the choice under
`games.block-drop.theme`. Only the spec and art direction are written so far.
Start with `design.md`, `art-direction.md`, and the runnable reference
`art-direction/preview.html`, then follow `tasks.md` in order.

`increase-brick-burst-pace` is a proposal following the approved Brick Burst
implementation (`44efaa2`). **Start with its `tasks.md` section 0.** A code
review found defects in `44efaa2`, and they must be fixed and tested before any
tuning. A held steering key dies after a ball-loss or level-clear freeze. The
canvas resizes every frame below 100% zoom. The brick tie-break is reversed.
The level-speed formula is duplicated. There is also hot-path `matchMedia` and
redraw work, Brick Burst imports Block Drop renderer internals, and there are
small cleanups. See `design.md` §0 and the new spec scenarios. It recommends base ball speed 390 units/s, +4%
every four brick hits, held paddle speed 540 units/s, and 400/650 ms loss/clear
feedback. Difficulty multipliers, scoring, layouts, and touch gain retain their
rules. The design compares additional pacing ideas and defines collision and
phone-review checks at the proposed 1092 units/s maximum. The proposal passes
strict OpenSpec validation; its implementation tasks are all unchecked. The
Tailscale server still runs the approved original tuning.

## Completed Brick Burst

`add-brick-burst` adds Brick Burst, a brick breaker and the catalog's second
game (`?game=brick-burst`). It has:

- deterministic fixed-step rules and five repeating layouts
- tough bricks and three lives
- Easy, Medium, and Hard difficulty
- relative thumb-drag steering
- the Block Drop Classic chrome

Brick Burst was implemented on `spec/add-brick-burst`, based on
`5257e1c` (which includes `main` at `d36b439`). It has pure seeded
240 Hz rules, the five layouts, Classic Canvas art and effects, mouse/keyboard
and relative touch controls, accessible chrome, difficulty/best-score storage,
catalog launch, deep links, and offline play. Block Drop now uses the three
shared helpers with its existing tests unchanged.

Automated coverage includes rules, controller timing and cleanup, renderer
determinism, component accessibility, browser navigation, real touch gestures,
responsive layouts, lives/restart, persistence, offline launch, and a 4× CPU
rendering benchmark. Phone review screenshots are generated under ignored
`test-results/brick-burst/`. The user approved the game and requested a commit
on 2026-10-22. The completed change is archived at
`openspec/changes/archive/2026-10-22-add-brick-burst/`, and the canonical
capability is `openspec/specs/brick-burst/spec.md`. The last full check passed
323 unit/component tests, the production build, and all 34 Chromium flows; all
6 Brick Burst phone flows also passed. Faster pacing is specified in the active
`increase-brick-burst-pace` proposal. Brick Burst themes are a separate follow-up.

## Most Recent OpenSpec Change

`add-brick-burst` is implemented, approved, and archived. Its rules, controls,
Classic rendering, shared helpers, navigation, and offline play are covered by
the validation recorded above. The existing Tailscale review server remains at
`https://matt-srv.tail18ced3.ts.net:10000/games/?game=brick-burst`.
