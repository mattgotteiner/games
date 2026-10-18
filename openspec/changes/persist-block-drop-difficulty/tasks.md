## 1. Difficulty Preference

- [x] 1.1 Allow a selected difficulty when creating a new rules state while keeping Medium as the default.
- [x] 1.2 Read and validate the saved difficulty; pass it into the controller on launch and persist slider changes. Storage failures fall back safely.
- [x] 1.3 Show the current difficulty and multiplier in the HUD across phone and desktop layouts.
- [x] 1.4 Keep the difficulty name and multiplier in fixed-width HUD columns so changing modes does not shift nearby text.

## 2. Verification

- [x] 2.1 Cover default, saved, invalid, and unavailable preference behavior, plus slider persistence and HUD labels.
- [x] 2.2 Add browser coverage for selecting a mode, reloading, and confirming the HUD and pause slider restore it.
- [x] 2.3 Run `npm run check` and verify type checking, unit/component tests, production build, and browser flows.
- [ ] 2.4 Review the difficulty indicator and persistence E2E on a phone.
