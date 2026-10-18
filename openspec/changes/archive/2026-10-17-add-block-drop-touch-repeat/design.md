## Context

After `compact-block-drop-mobile-layout`, the gameplay controls are four movement buttons (left, right, rotate, soft drop) and hard drop, each calling `controller.dispatch` from `onClick`. The controller already gates actions during line-clear feedback, pause, and game over, and it ignores gameplay keys while a button has focus. See `proposal.md` and `specs/block-drop/spec.md`.

## Goals / Non-Goals

**Goals:**

- Remove the release latency from touch and mouse input.
- Make long horizontal moves and controlled soft drops possible by holding a button.
- Give each thumb its own cluster on portrait phones.
- Keep one logical action per activation for keyboard and assistive-technology activation of the buttons.

**Non-Goals:**

- Swipe or gesture input on the playfield, which conflicts with page scrolling and the iOS back-swipe gesture.
- Configurable repeat timings.
- Changing keyboard repeat, which stays with the operating system.

## Decisions

### Press-driven pointer handling with click fallback

Each gameplay button handles `pointerdown` for primary pointers: it calls `setPointerCapture`, dispatches the action immediately, and for repeatable actions (left, right, soft drop) starts a repeat. `pointerup`, `pointercancel`, and `lostpointercapture` stop the repeat. A `click` whose `detail` is 0 (keyboard or assistive-technology activation) dispatches once. Clicks that follow a handled `pointerdown` are ignored so the action is not dispatched twice.

Using only `touchstart` was rejected because mouse and pen input should behave the same way. Keeping `onClick` alone was rejected because its latency is the problem being fixed.

### Repeat timer owned by the component

A small `useHoldRepeat` hook owns one `setTimeout` for the 170 ms initial delay, then one `setInterval` at 50 ms per held button. Each tick dispatches the action only while `controller.getState().status` is `playing` and no line clear is in progress. Otherwise it stops the repeat, so the player has to press again after a pause, clear, or game over. The timers are cleared on unmount, which also satisfies the session-cleanup requirement. Each button tracks its own pointer, so holding left while tapping rotate works.

Moving the repeat into the controller's animation-frame loop was rejected. It would couple DOM pointer state to the controller, and its timing would depend on frame rate.

### Thumb clusters on portrait phones

Below the `42rem` breakpoint, the controls become a two-column grid. The left cluster holds left and right side by side with soft drop centered under them. The right cluster holds rotate above a larger hard-drop button. Targets are at least 56 by 56 CSS pixels in this layout. The DOM and reading order is left, right, soft drop, rotate, hard drop, so the visual order matches the tab order. Wide and short-landscape layouts keep their single control column in the same order with 44 px targets.

### Haptics are best effort

On a piece lock or line clear, call `navigator.vibrate?.(10)` or `(20)` respectively, unless the user prefers reduced motion. iOS Safari does not support vibration, so there it does nothing, and the spec makes the feedback optional.

## Risks / Trade-offs

- [Pointer capture can be lost when the page scrolls or a system gesture starts] -> Treat `pointercancel` and `lostpointercapture` as release. The game screen does not scroll after `compact-block-drop-mobile-layout`.
- [50 ms repeat can overshoot for new players] -> The 170 ms initial delay lets a quick tap move exactly one cell. Fake-timer tests pin both timings.
- [Changing the movement order breaks the existing requirement and tests] -> This change modifies that requirement and updates the order tests in the same PR.

## Migration Plan

1. Add the hold-repeat hook and pointer handling with component tests using fake timers.
2. Rework the portrait control grid and update the order and target-size browser checks.
3. Add the haptic calls behind feature detection and the reduced-motion check.
4. Run `npm run check`. Roll back by reverting the component and CSS; no data migration is needed.
