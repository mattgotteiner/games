## Context

Block Drop currently combines deterministic rules, a Canvas controller that advances and draws the board, and semantic Preact UI for status, score, preview, and controls. Row removal is atomic in the rules layer, so the controller sees only the collapsed board; the current header also owns the score and preview, which keeps them visually subordinate. See `proposal.md` for motivation and `specs/block-drop/spec.md` for observable behavior.

The design must preserve deterministic state transitions, the fixed scoring contract, phone portrait and short-landscape fit, Canvas sharpness, keyboard/touch parity, teardown, and offline operation.

## Goals / Non-Goals

**Goals:**

- Establish a responsive playfield-plus-HUD composition with score and preview as primary game information.
- Add line-clear feedback without inserting browser time into deterministic game state.
- Prevent gameplay and gravity from racing ahead while a clear effect is visible.
- Make button hierarchy and interaction states consistent, accessible, and touch friendly.
- Keep animation and input timing directly testable without real-time sleeps.

**Non-Goals:**

- New scoring, levels, combos, hold pieces, ghost pieces, sound, vibration, or persisted high scores.
- Particle systems, animation libraries, or a generalized game-effects framework.
- Changing tetromino generation, board dimensions, gravity speed, or game-over rules.
- Redesigning the catalog beyond the shared button treatment and Block Drop launch control.

## Decisions

### Separate deterministic transition results from transient presentation effects

Extend the rules transition path to return the next immutable `BlockDropState` plus optional line-clear event data containing the completed row indexes and a renderable pre-collapse board snapshot. Existing state-returning helpers remain available and delegate to the event-producing transition so rules tests and replay semantics continue to compare only deterministic state.

The controller consumes the event and owns a short-lived line-clear effect. Browser timestamps, animation progress, and reduced-motion preferences never enter `BlockDropState`. Reconstructing cleared rows in the controller was rejected because it would duplicate lock and clear rules; adding a timed `clearing` rules status was rejected because identical logical actions could then produce different deterministic states depending on browser timing.

### Draw the clear effect inside the existing Canvas loop

When a transition reports completed rows, retain the pre-collapse board as a presentation snapshot and render a brief, approximately 180 ms high-contrast flash/fade across the exact rows. The current animation frame loop redraws effect progress and then returns to the already computed collapsed state. No new timer or animation dependency is introduced.

While the effect is active, gravity accumulation is reset and movement, rotation, drop, and pause actions are ignored. Restart cancels the effect and resets immediately; catalog navigation continues to unmount the controller normally. The controller publishes whether clear feedback is active with the current state so Preact can expose a readable "Clearing lines" status and disable controls consistently. Delaying the rules transition until the animation ends was rejected because it would couple scoring and piece generation to presentation time.

### Treat reduced motion as a zero-duration presentation path

Read `prefers-reduced-motion` through an injectable controller option. When enabled, skip the animated snapshot, publish the final state immediately, and reset gravity timing exactly as after the animated path. A slower fade was rejected because even opacity animation can be distracting and does not honor the strongest interpretation of the preference.

### Use a board-centered responsive grid with a dedicated HUD region

Restructure the play screen into a compact top bar, a board-centered game stage, a semantic HUD, and grouped controls. At wider breakpoints the stage uses a playfield column plus a fixed-range right rail. The HUD presents a small uppercase label over a large tabular score value, followed by a larger preview card and status. The preview remains a semantic four-by-four DOM grid using shared tetromino colors.

On narrow portrait screens the HUD becomes a compact horizontal card above the board. On short landscape screens it remains to the right, with controls in a separate compact column. CSS `minmax()`, `clamp()`, container bounds, and the existing Canvas resize logic preserve the no-scroll viewport requirement. Keeping score and preview in the title header was rejected because their hierarchy and placement become dependent on title wrapping.

### Introduce explicit button roles and stable interaction states

Keep the native `button` element and establish shared base styles plus primary, secondary, quiet, and control variants. Use `:focus-visible` for a high-contrast outline, pointer-capable hover styles, an inset/transform-free pressed treatment, and reduced opacity plus cursor changes for disabled controls. All variants keep a minimum 44 px target.

Group lateral movement, rotation/soft drop, hard drop, and session actions semantically and visually. Text remains present for actions that icons alone could obscure; arrow glyphs retain accessible labels. Restart stays visually secondary to avoid accidental activation. A custom button component was rejected because the application has few buttons and variants can remain clear through classes without adding an abstraction.

### Verify layout and motion at behavior boundaries

Add focused rules tests for line-clear event metadata, controller tests with injected frames and reduced-motion preference, component tests for HUD/status/control semantics, and browser tests for right-rail placement, constrained viewport fit, focus/disabled states, and animation gating. Avoid screenshot-only assertions; use geometry, accessibility state, deterministic frame advancement, and Canvas calls so failures identify behavior rather than antialiasing differences.

## Risks / Trade-offs

- [The pre-collapse snapshot increases transition data size] -> Keep it ephemeral, allocate it only when at least one row clears, and never store it in `BlockDropState`.
- [A clear effect can swallow an intentional input] -> Keep the effect brief, visibly disable gameplay controls, expose clearing status, and reset gravity so no hidden catch-up occurs.
- [The right rail can reduce board size on borderline widths] -> Enable it only when both minimum board and HUD widths fit; otherwise use the compact HUD.
- [Global button cleanup can unintentionally affect update notices or future controls] -> Apply a small shared base and explicit variants, then cover the catalog and game surfaces in component/browser tests.
- [Canvas flashes may be hard to perceive for some users] -> Use luminance and shape/row-wide treatment rather than tetromino color alone, plus readable clearing status.

## Migration Plan

1. Add transition event metadata while preserving existing state-returning rule APIs and deterministic tests.
2. Add controller-owned clear feedback, input gating, reduced-motion handling, and presentation publication.
3. Recompose the Block Drop DOM and CSS into the responsive stage, HUD, and grouped controls; apply button variants.
4. Extend focused component, controller, and browser coverage, then run the repository check.
5. Roll back by redeploying the previous static artifact; there is no persisted data or schema migration.
