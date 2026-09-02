## Context

Block Drop currently has a pure seeded rules state, a Canvas controller with
fixed gravity, and semantic Preact controls and status. See `proposal.md` for
motivation and `specs/block-drop/spec.md` for the exact behavior changes.

The score and preview must remain part of deterministic state, while pause must
coordinate pure actions with elapsed browser time without broadening the
concrete controller into a generalized runtime.

## Goals / Non-Goals

**Goals:**

- Keep score and next-piece sequencing reproducible from seed and actions.
- Make score, preview identity, and paused state available without reading
  Canvas pixels.
- Freeze both rules input and gravity timing while paused.
- Preserve phone portrait, short landscape, teardown, and offline behavior.

**Non-Goals:**

- Levels, changing gravity speed, high-score persistence, score multipliers, or
  combo rules.
- Automatic pause on visibility loss, navigation confirmation, or persisted
  paused sessions.
- Hold-piece behavior, multiple preview pieces, or a generalized HUD/runtime.

## Decisions

### Store score and a guaranteed next piece in rules state

Add `score` and `next` to the immutable game state. Piece generation will keep
one generated piece ahead of the active piece, refilling and advancing the
seeded bag as needed. Spawning promotes `next` to active and immediately
generates its successor.

Computing the preview independently from random state was rejected because it
could consume randomness inconsistently or diverge from the actual spawn order.

### Calculate score inside the transitions that earn it

Have row clearing return both the resulting board and number of rows removed.
Soft drop adds one point only when it moves; hard drop counts successful rows
before locking and adds two per row; gravity uses the same downward transition
without a manual-drop award. Locking then adds the fixed line-clear award.

Calculating score in the controller was rejected because replaying the same
rules actions without a browser would no longer reproduce the complete state.
Level multipliers and combos are deferred.

### Model pause as a deterministic rules status and toggle action

Extend game status with `paused` and add a `pause` action that toggles between
playing and paused. While paused, the pure rules layer ignores every action
except pause and restart. Game-over remains non-pausable.

A controller-only flag was rejected because state equality, tests, semantic UI,
and replay behavior could disagree about whether the game is paused.

### Reset controller timing across pause transitions

When pause or resume is dispatched, clear accumulated gravity time and restart
frame timing. The animation frame continues only to detect rendering/DPR
changes, but it does not advance rules while paused. Resuming grants a complete
gravity interval rather than applying pre-pause or suspended elapsed time.

Preserving a partial gravity interval was rejected because it makes an
immediate post-resume descent surprising and complicates the no-catch-up
contract.

### Render the preview as low-frequency semantic DOM

Render the initial-orientation tetromino in a fixed four-by-four CSS grid using
the same shape/color metadata as the board, accompanied by visible "Next" text
and the piece identifier. The preview updates only when rules state changes.

A second Canvas was rejected because the preview changes infrequently and DOM
cells make responsive sizing and accessible labeling simpler. To avoid
duplicating shape knowledge, expose a rules helper that returns initial local
piece cells and share presentation colors from a game-local module.

### Extend the existing compact game HUD

Keep score, state, and next preview adjacent to the board. Add a pause/resume
button and map `P` to the same logical action; keep `R` for restart. Disable
movement/drop/rotation controls while paused while leaving resume, restart, and
catalog available.

Hiding controls while paused was rejected because maintaining layout and
showing how to resume is clearer on touch devices.

## Risks / Trade-offs

- [Scoring constants may need later balancing] -> Keep the fixed table in one
  rules constant and specify it explicitly so changes require a deliberate spec
  update.
- [Generating one piece ahead changes the internal bag representation] -> Test
  complete bag membership and exact active/preview sequences across boundaries.
- [Pause can accidentally retain elapsed gravity] -> Reset both accumulator and
  previous frame time on each pause transition and test long paused intervals.
- [The preview crowds short landscape layouts] -> Use the existing responsive
  side layout and verify board, HUD, and controls at both phone orientations.
- [DOM preview colors can drift from Canvas colors] -> Share one game-local
  tetromino color map between both renderers.

## Migration Plan

1. Extend deterministic state, queueing, score transitions, and pause actions
   with focused unit coverage.
2. Add semantic score and next-piece presentation plus pause/resume controls and
   controller timing behavior.
3. Extend component and production-browser flows across touch, keyboard,
   orientations, and offline play; run the locked repository check.
4. Roll back by redeploying the prior static artifact; no persisted data or
   migration is introduced.
