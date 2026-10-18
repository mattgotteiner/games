## Why

Block Drop's touch controls act like form buttons. Each one fires on `click`, which happens when the finger lifts, so movement feels late. Holding a button does nothing, so moving a piece five columns takes five separate taps, while keyboard players get operating-system key repeat. All the buttons are about the same size and read left to right in rows, so on a phone neither thumb has a clear area of its own.

## What Changes

- Touch and pointer gameplay controls act on press rather than on release.
- Holding left, right, or soft drop repeats the action: an initial delay of 170 ms, then every 50 ms. Repeat stops on release, on cancel, or when the game leaves active play.
- On portrait phones, split the gameplay controls into two thumb clusters: left, right, and soft drop on the left, and rotate and hard drop on the right, with larger targets.
- Where the device supports it, give a short vibration when a piece locks and when lines clear. This is skipped when reduced motion is preferred.
- Prevent one-finger page panning from drags that begin anywhere in the game screen while preserving pinch zoom.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `block-drop`: Touch input acts on press and supports hold-to-repeat, and the control hierarchy defines the thumb-cluster layout. Adds an optional haptic-feedback requirement.

## Impact

- Affects `BlockDrop.tsx` (pointer handling and a repeat timer), `app.css` (cluster layout), and component and browser tests.
- `rules.ts`, keyboard mappings, and the controller's logical actions are unchanged. Repeats dispatch the existing `GameAction` values.
- No new dependencies, APIs, or persisted data.
- Third of six planned Block Drop changes. It assumes `compact-block-drop-mobile-layout` has already moved pause and restart out of the gameplay controls.

## Implementation Note

During implementation and mobile E2E review, dragging from multiple game elements exposed browser page panning. This was not in the original plan. The game-wide gesture policy now prevents one-finger panning while preserving pinch zoom, with a regression test across the heading, board, HUD, preview, and controls.
