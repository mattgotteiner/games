## 1. Deterministic Hold Rules

- [x] 1.1 Add held-piece state and implement empty-slot hold using the queued next piece.
- [x] 1.2 Implement occupied-slot swaps without consuming the queue or changing scoring, and reset hold availability after lock.
- [x] 1.3 Cover blocked spawns, paused/game-over behavior, restart, and deterministic replay.

## 2. Player Controls and Preview

- [x] 2.1 Map C (case-insensitive) to hold and cover keyboard dispatch.
- [x] 2.2 Add a visible Hold piece control that disables after use until the next piece spawns.
- [x] 2.3 Add an empty/occupied hold preview with readable labels and compact phone layout.
- [x] 2.4 Add end-to-end coverage for keyboard hold, touch hold, and phone layout.

## 3. Integrated Verification

- [x] 3.1 Run `npm run check` and verify type checking, 174 unit/component tests, production build, and all 12 Chromium flows.
- [x] 3.2 Review hold behavior and layout on a phone.
