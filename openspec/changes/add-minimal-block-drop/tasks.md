## 1. Deterministic Rules Seam

- [x] 1.1 Implement the immutable seeded Block Drop rules core for the
  ten-by-twenty board, seven-piece shuffled bags, movement, clockwise rotation,
  gravity, soft and hard drop, locking, simultaneous row clearing, spawning,
  game over, and restart; verify focused unit tests prove bag completeness,
  repeatability, valid and rejected actions, clearing, game over, and fresh
  restart without browser APIs.

## 2. Playable Catalog Seam

- [x] 2.1 Replace the empty catalog with one concrete Block Drop entry and add
  catalog launch/return, the responsive high-DPI Canvas controller and renderer,
  semantic game state, equivalent keyboard and visible touch controls, and
  idempotent mount/destroy cleanup; verify component and browser tests exercise
  launch, both input paths, portrait and landscape sizing, game-over restart,
  return to catalog, and release of animation, keyboard, and resize resources.

## 3. Production Offline Seam

- [x] 3.1 Extend the production Playwright flow to establish service-worker
  control under `/games/`, remove connectivity, launch Block Drop, and prove a
  gameplay action still renders without a network error; run the repository's
  complete locked `npm run check` command and confirm the generated application
  preserves the Games identity and deployment-scoped install assets.
