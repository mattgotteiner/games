## Context

The production app registers a generated Workbox service worker with
`registerType: 'autoUpdate'` and ignores the callbacks returned by
`virtual:pwa-register`. A replacement worker can therefore install, activate,
take control, and reload the page without any application-owned state or UI.
The update experience must work at the `/games/` base path, remain visible over
both catalog and game views, and must not mislabel the first service-worker
installation as a stale copy.

## Goals / Non-Goals

**Goals:**

- Give the application ownership of the generated worker's update transition
  while retaining automatic download and activation.
- Model update states independently from catalog and game navigation so one
  notification remains mounted across every view.
- Make the downloading, loading, and failed states independently testable
  without requiring Workbox in component tests.

**Non-Goals:**

- Preserve or restore an in-progress game across an application-version reload.
- Ask the user to approve, defer, or schedule an update.
- Add periodic polling beyond the browser and plugin's existing update checks.
- Replace the generated Workbox worker or introduce cache-schema migrations.

## Decisions

### Coordinate activation instead of using immediate auto-update

Configure the PWA registration for prompt-style activation, but keep the product
behavior automatic. The application will observe update installation, present
the downloading state, then call the plugin's update function once the
replacement is waiting. This prevents a new worker from taking control before
the application can explain the reload.

Keeping `autoUpdate` was considered, but its activation timing does not provide
a reliable application-controlled interval in which to present the ready and
loading state. A user-operated refresh button was also considered, but the
requested behavior is an explicit automatic update rather than a deferrable
update.

### Put service-worker lifecycle logic behind a small update controller

Create an application-update controller that owns registration, subscribes to
`updatefound` and worker `statechange` events, invokes activation, and emits a
closed state set: `current`, `downloading`, `loading`, or `failed`. It will only
enter `downloading` when `navigator.serviceWorker.controller` already exists,
which distinguishes an update from first installation. It will treat an
installing worker becoming `redundant` and rejected update/activation promises
as failures.

The controller will guard activation and navigation so repeated lifecycle
events cannot produce duplicate reloads. Reload remains tied to the replacement
worker taking control rather than to download completion, ensuring the
navigation actually uses the new copy.

Embedding registration directly in the notification component was considered,
but separating browser lifecycle effects from rendering permits deterministic
unit tests and keeps service-worker details out of the application shell.

### Render one application-level live status banner

Mount an update notice above the view-specific catalog or game content. The
banner uses a polite live status region for downloading and an assertive alert
for loading failures. Copy explicitly says the running copy is out of date,
identifies downloading versus loading, and gives connection/reload guidance on
failure.

The loading message will be committed to the DOM and kept visible for a short,
fixed readability interval before activation begins. This prevents a
fast-cached update from turning the notification into an imperceptible flash
while keeping replacement automatic.

A toast that disappears on a timer was considered, but update state remains
relevant until activation or recovery and must stay visible during a game.

### Test state rendering separately from the generated-worker integration

Component tests will inject update state into the notice and verify copy,
accessibility semantics, and visibility in catalog and game views. A focused
production Playwright test will install one build, serve a changed build at the
same URL, trigger a registration update, and assert the downloading/loading
notification before the page moves to the new version exactly once. Failure
mapping will be covered at the controller boundary with mocked service-worker
events.

Testing only the plugin callback with mocks was considered, but it would not
prove that two real generated worker revisions coordinate correctly under the
deployed base path.

## Risks / Trade-offs

- **[Prompt-style registration could leave a worker waiting if application code
  fails]** -> Keep the controller small, surface failures, and cover the real
  two-build lifecycle in Playwright.
- **[Browser lifecycle events can repeat or arrive in different orders]** ->
  Make state transitions idempotent and use explicit one-shot activation and
  reload guards.
- **[A readability interval slightly delays a ready update]** -> Keep the delay
  short and apply it only after all new assets have downloaded.
- **[Automatic replacement still resets an active game]** -> State that the
  latest version is loading before navigation; session persistence remains a
  separate capability.
- **[Offline update checks can reject even though the cached app is healthy]**
  -> Do not show a failure unless an actual replacement was detected; ordinary
  offline startup remains covered by the existing offline-installation contract.

## Migration Plan

1. Add the controller and update-notice UI while changing generated worker
   activation from immediate auto-update to application-coordinated activation.
2. Verify first installation, ordinary offline startup, a two-build update, and
   update failure before deployment.
3. Deploy normally to GitHub Pages; existing clients will receive this release
   through the old automatic lifecycle once, and subsequent releases will use
   the new notification flow.
4. If the coordinated flow regresses, restore `autoUpdate` registration and
   remove the controller/notice while retaining the existing generated caches.
