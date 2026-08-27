## Context

The application is a static Preact and Vite site deployed by GitHub Actions to
GitHub Pages under `/games/`. It has no manifest, icons, service worker, or
browser-test runner. The production build emits content-hashed assets, and the
existing component test covers the shell's honest empty state.

The offline contract begins only after a successful online load. GitHub Pages
cannot supply server-side fallbacks, so installation and offline behavior must
be contained in the static artifact and remain safe under the repository base
path.

## Goals / Non-Goals

**Goals:**

- Produce one deployable artifact whose shell is installable and reloadable
  offline under `/games/`.
- Exercise the service worker through a real production server and browser
  rather than treating build output as proof of offline behavior.
- Keep cache contents and lifecycle behavior small enough to understand before
  games introduce independently downloadable resources or active sessions.

**Non-Goals:**

- Runtime caching, per-game download state, or an offline fallback for
  uncached content.
- Update prompts, active-game update coordination, or cache-schema migration.
- Platform-specific install instructions or a custom installation button.
- Background sync, notifications, persistence, or a generalized game runtime.

## Decisions

### Use `vite-plugin-pwa` with generated service-worker precaching

Add `vite-plugin-pwa` as a development dependency and use its generated
Workbox service worker to precache the HTML entry point, content-hashed
application assets, manifest, and icons. The plugin integrates URLs with
Vite's `/games/` base and avoids maintaining a handwritten asset list.

A custom service worker was considered, but it would add lifecycle and cache
bookkeeping before the product has behavior that requires that control.

### Limit this increment to build-time shell resources

The service worker will precache only the static files emitted for the current
shell. It will not add runtime caching routes or claim that future games are
available offline. This keeps the cache contract aligned with the empty
catalog and leaves per-game acquisition to the change that introduces games.

Cache-first runtime rules were considered, but they would establish policies
for content that does not exist yet and make an offline success difficult to
distinguish from an accidental broad cache.

### Register automatically but do not introduce update UI

The shell will register its service worker during normal startup. Generated
revisions will update through the plugin's standard service-worker lifecycle;
this increment will not add an application-level update prompt. There are no
active game sessions to protect yet. The first change that introduces a game
must revisit activation coordination before relying on long-lived sessions.

Adding an update prompt now was considered, but it creates UI and state whose
important consumer—an active game—does not exist.

### Add one production-browser offline seam

Add Playwright with a focused Chromium test that starts the production preview
at the `/games/` path, waits until the page is service-worker controlled,
switches the browser context offline, reloads, and asserts the application
identity and honest empty state. The existing component test remains
responsible for detailed shell semantics.

Mocking Cache Storage or service-worker registration in Vitest was considered,
but that would not validate emitted asset URLs, registration scope, control,
or an actual offline navigation.

### Treat physical-phone installation as release acceptance

After deployment, use one supported physical phone to add the public site to
the device, launch it in standalone mode online, disable connectivity, and
reopen it. This manual check covers browser and operating-system installation
behavior that desktop automation does not faithfully reproduce.

## Risks / Trade-offs

- **[A newly installed worker may not control the first page immediately]** →
  The browser test waits for control and allows the normal one-time reload
  needed to establish it before simulating offline use.
- **[Generated service-worker behavior can hide an incorrect `/games/`
  scope]** → Run the browser test against the production build at the actual
  base path and inspect manifest and worker requests within that scope.
- **[Automatic lifecycle behavior will become insufficient once games have
  active sessions]** → Keep update coordination explicitly deferred and make
  it a prerequisite decision when a game session is introduced.
- **[Physical-phone installation varies by browser and operating system]** →
  Record the tested phone/browser during acceptance and require the observable
  installed/offline result rather than a browser-specific prompt.

## Migration Plan

1. Add the manifest, icons, service-worker generation, registration, and
   production-browser offline test behind the existing build.
2. Run existing checks plus the production-browser test before deployment.
3. Deploy through the current GitHub Pages workflow and verify the public site
   online before installing it on a physical phone.
4. Install, open, disconnect, and reopen the deployed application on the phone.
5. If deployment regresses, redeploy the prior static artifact; its pages are
   still usable online, and the generated cache revision can be replaced by a
   later corrected deployment.
