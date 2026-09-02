## 1. Deterministic Score Seam

- [x] 1.1 Add score to immutable game state; award successful soft-drop rows,
  hard-drop distance, and simultaneous line clears using the specified fixed
  values; reset on restart and preserve the final game-over value; display the
  score semantically and verify focused rules and component tests cover every
  scoring and reset path.

## 2. Next-Piece Preview Seam

- [x] 2.1 Keep one deterministic generated piece ahead of the active piece
  across bag boundaries, expose shared initial-orientation shape/color metadata,
  and render an accessible four-by-four next-piece visualization; verify unit
  tests prove exact active/preview promotion and seeded sequencing while
  component and browser tests prove the label and visualization update after a
  lock.

## 3. Pause and Resume Seam

- [x] 3.1 Add deterministic paused state and pause action, ignore gameplay
  actions while paused, reset controller gravity timing across pause/resume,
  and add equivalent visible and `P` keyboard controls with semantic status;
  verify rules, controller, component, and browser tests prove frozen state and
  time, fresh resume timing, restart while paused, and unchanged teardown.

## 4. Production Integration

- [x] 4.1 Fit score, preview, state, and controls with the complete board at
  phone portrait and short landscape sizes, extend the service-worker-controlled
  production flow to exercise score, preview, and pause while offline, and run
  the repository's locked `npm run check` command.
