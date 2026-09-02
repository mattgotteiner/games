## Context

The application is a small Preact and Vite shell deployed under `/games/`. Its
generated service worker precaches the production artifact, and its catalog
currently contains no games. See `proposal.md` for motivation and
`specs/block-drop/spec.md` for the behavior contract.

This increment must discover a useful seam from one real game without
prematurely creating the registry, routing, persistence, or generalized runtime
described by the deferred bootstrap change.

## Goals / Non-Goals

**Goals:**

- Keep simulation deterministic and testable without DOM, Canvas, timers, or
  frame rate.
- Keep high-frequency drawing outside Preact rendering.
- Make one game usable across keyboard and touch phone layouts.
- Make session teardown explicit and verifiable.
- Preserve the existing production-build and offline deployment behavior.

**Non-Goals:**

- Scoring, levels, high scores, persistence, pause/resume, lock delay, advanced
  rotation kicks, or rules-version compatibility.
- A game registry, lazy-module contract, shared service container, hash router,
  or reusable game engine.
- Sound, haptics, replay storage, or configurable controls.

## Decisions

### Use a pure game-specific state transition core

Represent the board, active piece, shuffled bag, generator state, and status as
immutable TypeScript data. Expose game-specific operations to create a seeded
game, apply a logical action, and advance one gravity step. Locking, row
clearing, spawning, and game over happen inside those transitions.

This keeps deterministic tests independent of browser behavior. A mutable class
was rejected because timer and input state would become entangled with rules.

### Use a seeded seven-piece bag with simple rotation rejection

Use a small project-owned seeded generator and Fisher-Yates shuffle to produce
groups containing all seven tetrominoes. Define each piece as four local cells
and rotate clockwise around its game-specific origin. Accept a rotation only
when every resulting cell is valid; wall kicks are deferred to hardening.

`Math.random` was rejected because failures could not be reproduced. Implementing
full guideline rotation and lock-delay rules now was rejected because it would
expand the first playable seam without affecting the architecture being proved.

### Drive fixed gravity from a Canvas session controller

Create one Block Drop controller that owns the current rules state, Canvas 2D
renderer, `requestAnimationFrame` loop, elapsed-time accumulator, keyboard
listener, and container resize observer. Advance gravity at one fixed interval
and cap elapsed frame time so browser suspension cannot trigger an unbounded
catch-up loop.

The controller exposes only the mount-time callbacks needed by the Preact view
and an idempotent `destroy()` operation. A generalized `GameSession` interface
is deliberately deferred until another game creates evidence for shared shape.

### Keep application navigation local and explicit

Let the application own a catalog/game view state. Launching Block Drop mounts
its component; returning to the catalog unmounts it, which invokes the
controller's `destroy()` cleanup. The catalog has one concrete entry rather
than a registry abstraction.

Adding hash navigation was rejected for this increment because there is only
one game and direct-link behavior is not required by the capability spec.

### Normalize keyboard and visible controls into logical actions

Map documented keys and pointer-safe buttons to the same action union before
calling the rules core. Suppress default scrolling only for handled keys while
the game is active. Use normal semantic buttons for touch so controls remain
operable without gesture-specific APIs.

Global touch interception was rejected because it would interfere with page
navigation and browser gestures.

### Render responsively at device-pixel resolution

Size the Canvas CSS box from its container while preserving the ten-by-twenty
board aspect ratio. Scale its backing dimensions by device pixel ratio and draw
the board, locked cells, active piece, grid, and game-over treatment using
project-owned colors and shapes. Keep game name, status, and controls in the
surrounding DOM.

Rendering individual cells through Preact was rejected because it would couple
animation frequency to component reconciliation.

### Extend the existing production offline seam

Keep Block Drop code in the Vite artifact so the existing generated service
worker precaches it. Extend Playwright coverage to load the production build
online, establish service-worker control, go offline, launch the game, and
exercise one input.

Adding runtime caching or per-game download state was rejected because the
single game is part of the current application artifact and those policies
belong to a later multi-game platform change.

## Risks / Trade-offs

- [Simple rejected rotations feel less forgiving near walls] -> Keep rotation
  deterministic and add bounded kicks during the planned hardening increment.
- [A concrete mount/destroy seam may not generalize] -> Treat it as evidence,
  not a platform contract, and extract only after a second game exposes shared
  needs.
- [Animation suspension can advance too much state] -> Clamp frame elapsed time
  and process a bounded number of fixed gravity steps.
- [Canvas cannot expose cell state semantically] -> Keep control and session
  state in labeled DOM content and avoid making pixel inspection necessary for
  operating the game.
- [Phone landscape height can crowd controls] -> Use responsive layout rules
  that place controls beside the board when width permits and verify both phone
  orientations in Playwright.
- [Input handlers can survive navigation] -> Make destruction idempotent and
  test listener, animation-frame, and resize-observer cleanup on unmount.

## Migration Plan

1. Add and exhaustively unit-test the deterministic rules core.
2. Add the concrete catalog launch, Block Drop view, controller, Canvas
   renderer, and normalized controls.
3. Extend component and production-browser coverage, including offline launch
   and teardown, then run the existing locked validation command.
4. Roll back by redeploying the prior static artifact; no persisted game data or
   schema migration is introduced.
