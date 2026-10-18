## 1. Press and Repeat Input

- [x] 1.1 Add a hold-repeat hook with a 170 ms initial delay and a 50 ms interval for left, right, and soft drop; fake-timer component coverage asserts one action at press, none before 170 ms, then one per 50 ms, and none after release, `pointercancel`, or lost capture.
- [x] 1.2 Dispatch rotate and hard drop once on `pointerdown` without repeat, and dispatch every control once for keyboard and assistive-technology clicks while ignoring the click that follows a handled press; component coverage exercises pointer, Enter, Space, and programmatic click activation.
- [x] 1.3 Stop repeating when the game pauses, starts line-clear feedback, reaches game over, or unmounts; component coverage checks each case and verifies timer cleanup.
- [x] 1.4 Let separate buttons be held and pressed at the same time; component coverage holds left while pressing rotate and hard drop.

## 2. Thumb Layout

- [x] 2.1 Order the gameplay controls left, right, soft drop, rotate, hard drop in the DOM and lay them out as left and right thumb clusters on portrait viewports; browser coverage at 390 by 844 checks cluster positions, reading order, and targets of at least 56 by 56 CSS pixels.
- [x] 2.2 Keep single-row control layouts in the same order at wide and short-landscape sizes; browser coverage at 568 by 320 and 1440 by 900 checks order, 44 px targets, and no page scrolling.
- [x] 2.3 Prevent one-finger page panning from drags that begin anywhere in the game screen while preserving pinch zoom; mobile browser coverage drags horizontally and vertically across the heading, board, HUD, preview, and controls against a scrollable page.

## 3. Haptic Feedback

- [x] 3.1 Vibrate briefly on lock and line clear where supported, skipping it under reduced motion; component coverage checks the calls and verifies unsupported vibration and reduced motion suppress them.

## 4. Integrated Verification

- [x] 4.1 Run `npm run check` and verify type checking, 106 unit tests, the production build, and all 8 browser flows pass without new dependencies; user E2E review approved the result.
