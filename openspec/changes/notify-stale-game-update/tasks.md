## 1. Application Update Lifecycle

- [x] 1.1 Add unit tests for first installation, stale-copy download, waiting-worker activation, rejected/redundant workers, and duplicate control events; verify the focused tests fail against the current registration behavior
- [x] 1.2 Implement the typed application-update controller and change the generated PWA to application-coordinated activation; verify the controller tests pass and a replacement reload is guarded to occur exactly once

## 2. Update Notification Experience

- [x] 2.1 Add an application update notice with explicit downloading, loading, and failure copy plus live-region semantics; verify component tests cover the text and accessibility role for every state
- [x] 2.2 Mount the notice above catalog and active-game views and add responsive styling that does not obscure controls; verify App tests show the same notice in both views while leaving the current content usable
- [x] 2.3 Connect controller state to the notice and enforce a short readable loading interval before activation; verify fake-timer tests prove the loading message renders before activation begins

## 3. Production Lifecycle Validation

- [x] 3.1 Extend the production-browser harness to serve two sequential builds at `/games/` and verify Playwright observes the out-of-date download notice, the loading notice, and one reload into the second build
- [x] 3.2 Cover update failure and first-install behavior at the highest practical browser/controller seams, then run `npm run check` to verify update handling does not regress normal startup, deep links, gameplay, or offline reloads
