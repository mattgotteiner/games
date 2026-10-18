## 1. Press and Repeat Input

- [ ] 1.1 Add a hold-repeat hook with a 170 ms initial delay and a 50 ms interval for left, right, and soft drop; verify fake-timer component tests assert one action at press, none before 170 ms, then one per 50 ms, and none after release, `pointercancel`, or lost capture.
- [ ] 1.2 Dispatch rotate and hard drop once on `pointerdown` without repeat, and dispatch every control once for keyboard and assistive-technology clicks while ignoring the click that follows a handled press; verify component tests cover pointer, keyboard Enter and Space, and programmatic click activation.
- [ ] 1.3 Stop repeating when the game pauses, starts line-clear feedback, reaches game over, or unmounts; verify component tests for each case and that no timer remains after unmount.
- [ ] 1.4 Let separate buttons be held and pressed at the same time; verify a component test holding left while pressing rotate dispatches both.

## 2. Thumb Layout

- [ ] 2.1 Order the gameplay controls left, right, soft drop, rotate, hard drop in the DOM and lay them out as left and right thumb clusters on portrait viewports; verify browser tests at 390 by 844 assert cluster positions, reading order, and targets of at least 56 by 56 CSS pixels.
- [ ] 2.2 Keep single-column control layouts in the same order at wide and short-landscape sizes; verify browser tests at 568 by 320 and 1440 by 900 assert the order, 44 px targets, and no page scrolling.

## 3. Haptic Feedback

- [ ] 3.1 Vibrate briefly on lock and line clear where supported, skipping it under reduced motion; verify component tests with a stubbed `navigator.vibrate` assert the calls, and that nothing is called when vibration is unsupported or reduced motion is preferred.

## 4. Integrated Verification

- [ ] 4.1 Run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
