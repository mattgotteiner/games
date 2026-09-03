## Why

The automatically updating service worker can briefly show a stale game and then
reload without warning, making the reset look like lost progress or a crash.
Users need a clear, accessible explanation before the application replaces an
out-of-date copy with the newly downloaded version.

## What Changes

- Detect when the running application is out of date and a replacement service
  worker is downloading or ready.
- Show persistent, accessible update status while a new copy is being downloaded
  and loaded.
- Reload into the new copy only after clearly notifying the user, while keeping
  the update automatic and avoiding duplicate reloads.
- Surface update failures instead of leaving the application in an unexplained
  stale state.
- Add automated coverage for downloading, activation, reload, and failure states.

## Capabilities

### New Capabilities

- `application-updates`: Defines how the application communicates and completes
  service-worker-driven replacement of an out-of-date running copy.

### Modified Capabilities

None.

## Impact

- Service worker registration and update lifecycle handling in the Preact entry
  point.
- Application-level update state, notification UI, and responsive styling.
- Component and production-browser tests for service worker update transitions.
- The generated PWA remains based on `vite-plugin-pwa`; no new runtime dependency
  or backend service is required.
