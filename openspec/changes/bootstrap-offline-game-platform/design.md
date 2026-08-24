## Context

The repository currently contains OpenSpec configuration but no application or Git history. `responses-chat` demonstrates the owner's preferred React/Vite, mobile CSS, CI, and GitHub Pages patterns; however, it provides install metadata without a service worker and therefore is not an offline implementation. See `proposal.md` for the product motivation and the capability specs for behavioral contracts.

GitHub Pages provides static hosting under a repository path, so the client must not depend on server-side route fallback or runtime services. The catalog is expected to grow, making initial bundle size, cache growth, game isolation, and update behavior important from the first release.

## Goals / Non-Goals

**Goals:**

- Keep the initial shell small while retaining component-oriented UI development.
- Prevent shell rendering choices from constraining game loops or rendering technologies.
- Make game behavior deterministic and testable independently of browsers and frame rate.
- Support installable, offline-capable operation without a backend.
- Establish explicit version boundaries and automated deployment checks.

**Non-Goals:**

- A shared entity-component system, physics engine, or universal game engine.
- Accounts, cloud synchronization, multiplayer, leaderboards, telemetry, or a backend.
- Downloading every future game during the first application visit.
- Deterministic replay storage or compatibility across different game-rules versions.
- Replication of third-party branding, artwork, sound, or proprietary presentation.

## Decisions

### Use Preact for the application shell

Use Preact with TypeScript and Vite for the catalog, navigation, dialogs, status UI, and application lifecycle. Preact keeps a React-like component and hooks model while reducing the permanent shell runtime. Tests can use Testing Library through Preact's testing integration.

Alternatives considered:

- React is mature and familiar but adds runtime weight without improving the intended shell.
- Svelte provides excellent compiled output but introduces a different component ecosystem without a clear project-specific advantage.
- Vanilla TypeScript minimizes dependencies but would require hand-built UI composition and state conventions as the catalog grows.

### Keep game execution outside the component render cycle

The shell mounts each game into a provided host element. A game returns a session object supporting `pause`, `resume`, and `destroy`. High-frequency simulation and rendering stay inside the game; the shell receives only low-frequency status events.

The game definition contains stable identity, display metadata, rules version, capabilities, and a lazy module loader. Shared services provide namespaced persistence, audio preferences, lifecycle notifications, and navigation callbacks. The contract does not expose Preact types, allowing games to use Canvas, DOM, WebGL, Phaser, PixiJS, or another specialized implementation.

### Use hash navigation under the GitHub Pages base path

Vite builds for `/games/`, and application views use hash-based locations such as `#/games/block-drop`. Hash navigation supports direct links and refreshes without requiring a server-side fallback document. Asset and service-worker URLs derive from the configured base path rather than assuming origin-root deployment.

### Cache the shell eagerly and games on demand

Use `vite-plugin-pwa` with Workbox. Precache the versioned application shell, catalog metadata, icons, and minimal error UI. A game's lazy chunks and assets enter a versioned runtime cache when opened or explicitly downloaded. The catalog derives offline readiness from completion of that game's declared asset set.

Do not activate a waiting worker over an active session. The shell surfaces an update action and activates the waiting version only after the user accepts it or no game is active. Old versioned caches are removed after successful activation.

Precaching every game was rejected because installation cost and cache usage would grow with the catalog.

### Use a pure deterministic model and Canvas 2D for Block Drop

The Block Drop rules engine is a pure TypeScript state transition system. It receives seeded randomness, elapsed fixed simulation steps, and logical actions; it does not read browser time, input events, or rendering state directly.

The presentation uses a high-DPI-aware Canvas 2D surface sized from its container. `requestAnimationFrame` drives presentation while an elapsed-time accumulator advances fixed simulation steps. Preact renders surrounding controls and semantic status text, not individual animation frames.

A full game engine is unnecessary for this puzzle. Future games may lazy-load Phaser for complete 2D game facilities, PixiJS for high-throughput custom 2D rendering, or Three.js/Babylon.js for 3D without changing the shell contract.

### Separate release, rules, and persistence versions

- Git tags identify deployed application releases using semantic versions.
- Each game definition identifies its rules version for behavioral compatibility.
- Each namespaced persistence payload identifies its own schema version.
- OpenSpec changes and Git history provide specification lineage; specs do not receive an unrelated manually incremented version for every edit.

Persistence is validated before use. The initial release uses localStorage for settings and small game records. IndexedDB remains available if later games need larger saves or replay data.

### Use layered automated tests

- Vitest tests deterministic rules, registration validation, storage migrations, and PWA-related helpers.
- Testing Library tests shell, catalog, controls, and accessible status behavior.
- Playwright tests production builds at phone viewports, keyboard and touch flows, direct hash navigation, service-worker installation, and reload while offline.
- CI runs lint, type checking, unit/component tests, browser smoke tests, and the production build.

Deployment uses the official GitHub Pages actions after CI succeeds. Pages configuration failure is fatal rather than silently skipping deployment.

### Publish original presentation

The public catalog calls the initial game Block Drop and uses original icons, visual styling, sounds, and text. Tetromino mechanics are described behaviorally without presenting the project as an official Tetris product.

## Risks / Trade-offs

- [Preact compatibility differs at the edges of the React ecosystem] -> Prefer framework-neutral libraries and verify any compatibility-layer dependency before adoption.
- [Service-worker updates can strand incompatible cached chunks] -> Use content-hashed assets, versioned caches, atomic worker activation, and an offline upgrade browser test.
- [On-demand caching can leave an unplayed game unavailable offline] -> Show explicit readiness state and provide a download action rather than implying all games are installed.
- [Mobile browsers suspend timers and audio unpredictably] -> Pause on visibility changes and restore only after an explicit lifecycle transition.
- [Canvas content is not inherently accessible] -> Keep controls and game status semantic in the surrounding DOM and avoid color-only distinctions.
- [A shared runtime can become an accidental universal engine] -> Limit it to lifecycle and cross-cutting services; keep simulation, rendering, and game-specific dependencies inside each game.
- [GitHub Pages repository paths can break absolute URLs] -> Centralize base-path handling and cover deployed-path behavior in production-build tests.

## Migration Plan

1. Initialize the existing directory as the `mattgotteiner/games` repository and establish the Preact/Vite toolchain.
2. Build and test the shell, catalog, runtime boundary, and Block Drop vertical slice locally.
3. Create the public GitHub repository, push the main branch, and enable GitHub Pages through Actions.
4. Deploy the first release, verify installation and offline reload on a phone, and tag it `v0.1.0`.
5. Roll back a faulty release by redeploying the last known-good commit; content-hashed assets and cache cleanup keep the rollback isolated from incomplete builds.
