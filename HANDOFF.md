# Games Platform Handoff

## Current State

The public application is a responsive, installable Preact, TypeScript, and
Vite game catalog deployed at:

- Repository: `https://github.com/mattgotteiner/games`
- Application: `https://mattgotteiner.github.io/games/`
- Published commit: `52d418a`

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

The locked `npm run check` command passes:

- TypeScript project typecheck
- 45 Vitest unit/component tests
- Production Vite/PWA build
- 3 Chromium production flows covering responsive play, direct/history
  navigation, and offline deep-link play

## Completed OpenSpec Changes

- `add-installable-offline-shell`
  - `openspec/changes/archive/2026-09-01-add-installable-offline-shell`
- `add-minimal-block-drop`
  - `openspec/changes/archive/2026-09-01-add-minimal-block-drop`
- `add-block-drop-score-preview-pause`
  - `openspec/changes/archive/2026-09-01-add-block-drop-score-preview-pause`
- `add-game-deep-links`
  - `openspec/changes/archive/2026-09-01-add-game-deep-links`

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

## Deferred Work

Levels, score persistence/high scores, automatic visibility pause, hold pieces,
advanced rotation kicks, and a generalized game registry/runtime remain
deferred. Introduce shared platform abstractions only after another game exposes
concrete duplication.
