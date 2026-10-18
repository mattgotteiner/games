## 1. Header and Session Actions

- [ ] 1.1 Replace the kicker and large heading with a single compact header row containing return, the game name, and pause/resume, help, and restart buttons with accessible names; verify component tests find each header control by role and name.
- [ ] 1.2 Remove pause and restart from the gameplay action group so hard drop is the only action beside movement; verify component tests assert the gameplay control groups contain no session action and that every action still dispatches once.

## 2. Scoring and Controls Dialog

- [ ] 2.1 Render the scoring guide and a keyboard-controls list inside a native dialog opened from the help button; verify component tests assert every value from `BLOCK_DROP_SCORING` is present and labelled and that Escape closes the dialog and returns focus to the help button.
- [ ] 2.2 Pause on opening the dialog during play and leave the game paused on close; verify component tests assert the dispatched actions for playing, paused, and game-over starting states.

## 3. Playfield-First Layout

- [ ] 3.1 Lay out score, state, and next piece as one compact strip on portrait viewports; verify browser tests at 390 by 844 measure the strip at no more than 64 CSS pixels tall with all three items visible.
- [ ] 3.2 Move the visible board frame onto a wrapper sized by the canvas while the controller keeps observing the outer container; verify browser tests show frame and canvas widths within 4 CSS pixels at 390 by 844, 568 by 320, and 1440 by 900.
- [ ] 3.3 Hide the key-help line for coarse pointers; verify the browser touch-context test does not show it and the desktop test does.
- [ ] 3.4 Verify browser tests show a playfield at least 540 CSS pixels tall at 390 by 844, with no document scrolling and every control visible at 320 by 568, 390 by 844, 568 by 320, 844 by 390, and 1440 by 900.

## 4. Live Announcements

- [ ] 4.1 Remove the score's live region and add one visually hidden status announcer for line clears, pause, resume, and game over; verify component tests assert soft-drop score changes produce no announcement and each event produces one message.

## 5. Integrated Verification

- [ ] 5.1 Update existing component and browser assertions that expect the always-visible scoring guide or the Drop/Pause/Restart group, then run `npm run check` and verify type checking, unit tests, the production build, and all browser flows pass without new dependencies.
