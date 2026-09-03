## 1. Deterministic Clear Events

- [x] 1.1 Add a rules transition result that reports completed row indexes and a pre-collapse board only when a lock clears rows, while preserving the existing state-returning APIs; verify focused rules tests cover single/multiple clears, no-clear transitions, scores, and unchanged deterministic replay.
- [x] 1.2 Update the Canvas controller to consume rules transition events without duplicating row-clear logic; verify existing controller and rules tests still pass before adding presentation timing.

## 2. Line-Clear Presentation

- [x] 2.1 Add controller presentation state for active clear feedback, injectable reduced-motion detection, and a frame-driven approximately 180 ms clear effect over the exact completed rows; verify controller tests advance injected frames and assert snapshot rendering, completion, and the zero-duration reduced-motion path.
- [x] 2.2 Gate gravity plus movement, rotation, drop, and pause actions during clear feedback, reset elapsed gravity when feedback ends, and let restart cancel immediately; verify controller tests cover ignored input, no gravity catch-up, restart, and teardown during an active effect.
- [x] 2.3 Publish clearing presentation state to Block Drop and render a polite readable "Clearing lines" status while disabling unavailable gameplay and pause controls; verify component tests assert status text, semantic disabled states, and restart availability.

## 3. HUD and Control Cleanup

- [x] 3.1 Recompose the Block Drop markup into a compact top bar, semantic game stage, dedicated HUD, and labeled control groups, with the score value and next-piece preview promoted in the HUD; verify component tests locate the HUD by accessible name and retain all existing score, preview, status, and control semantics.
- [x] 3.2 Implement wide right-rail, narrow portrait, and short-landscape layouts with an enlarged score and preview while preserving Canvas bounds and no page scrolling; verify Playwright geometry assertions cover wide desktop, phone portrait, and phone landscape viewports.
- [x] 3.3 Add shared native-button base styles and explicit primary, secondary, quiet, and gameplay-control variants for catalog, navigation, and Block Drop actions; verify component and browser tests cover labels, 44 by 44 CSS pixel minimum targets, visible focus, disabled state, and stable pressed styling.
- [x] 3.4 Group directional, drop, and session controls with clear text/icon treatment and responsive spacing; verify keyboard and touch browser flows still map every visible control to the documented logical action.

## 4. Integrated Verification

- [x] 4.1 Extend the Block Drop browser flow to produce a deterministic line clear and verify exact-row feedback appears, gameplay is gated until it ends, and final board, score, and next piece remain correct.
- [x] 4.2 Run `npm run check` and verify type checking, unit tests, production build, phone orientation tests, offline behavior, and the complete end-to-end suite pass without new dependencies.
