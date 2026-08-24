## 1. Repository and Toolchain

- [ ] 1.1 Initialize the existing project directory as a Git repository with `main` as the default branch and add repository metadata, MIT licensing, ignore rules, and Node version files.
- [ ] 1.2 Scaffold a strict TypeScript, Preact, and Vite application without replacing the existing OpenSpec files.
- [ ] 1.3 Configure ESLint, Vitest, Testing Library, and Playwright with scripts for development, type checking, linting, unit tests, browser tests, builds, and previews.
- [ ] 1.4 Configure Vite assets and navigation for the `/games/` GitHub Pages base path and production source maps.
- [ ] 1.5 Populate OpenSpec project context with the selected stack, architecture boundaries, validation commands, and specification-versioning conventions.

## 2. Application Shell

- [ ] 2.1 Build the Preact application frame with hash navigation between the catalog and game routes.
- [ ] 2.2 Add responsive global styles using dynamic viewport units, safe-area insets, accessible focus states, and phone portrait and landscape layouts.
- [ ] 2.3 Add original application identity assets and install metadata for standalone display under the GitHub Pages deployment scope.
- [ ] 2.4 Implement document visibility and navigation lifecycle coordination so active sessions pause and are destroyed at the required times.
- [ ] 2.5 Add recoverable shell-level error presentation for failed game loading or startup.

## 3. Game Runtime and Catalog

- [ ] 3.1 Define framework-independent game definition, capability, service, status event, and session lifecycle types.
- [ ] 3.2 Implement and test a registry that validates unique game definitions and exposes lazy game entry points.
- [ ] 3.3 Implement namespaced, schema-versioned local storage with validation and clean handling of incompatible or malformed values.
- [ ] 3.4 Build catalog cards, the empty state, game launch flow, and transition back to the catalog.
- [ ] 3.5 Isolate partial startup and runtime failures so the active session is cleaned up and the catalog remains usable.
- [ ] 3.6 Display each game's offline readiness and prevent unrecoverable navigation when an unavailable game is selected offline.

## 4. Block Drop Rules

- [ ] 4.1 Implement typed board, piece, action, status, score, level, and seeded random-generator state without browser dependencies.
- [ ] 4.2 Implement the seven-piece shuffled generator and deterministic new-game initialization.
- [ ] 4.3 Implement collision detection, horizontal movement, gravity, soft drop, hard drop, rotation, bounded wall kicks, and lock delay.
- [ ] 4.4 Implement simultaneous completed-row removal, score calculation, line tracking, level progression, and increasing gravity.
- [ ] 4.5 Implement spawning, game-over detection, pause/resume, restart, and serializable state transitions.
- [ ] 4.6 Add exhaustive deterministic unit tests for piece generation, movement boundaries, rotation kicks, locking, clearing, scoring, levels, pause, and game over.

## 5. Block Drop Presentation

- [ ] 5.1 Implement a high-DPI Canvas 2D board renderer with responsive sizing and original visual styling.
- [ ] 5.2 Implement a `requestAnimationFrame` presentation loop with fixed-step simulation and safe elapsed-time bounds after suspension.
- [ ] 5.3 Add keyboard and touch adapters that emit the same logical actions and scope gesture suppression to the active game controls.
- [ ] 5.4 Build semantic score, level, line, high-score, pause, and game-over UI with accessible control names and non-color state cues.
- [ ] 5.5 Persist and restore the versioned local high score and register Block Drop metadata, capabilities, rules version, and lazy entry point.
- [ ] 5.6 Add component and integration tests for controls, lifecycle cleanup, status output, high scores, resizing, and orientation changes.

## 6. Offline Installation and Updates

- [ ] 6.1 Configure the PWA service worker to precache the shell, catalog, manifest, icons, and offline error resources using deployment-safe URLs.
- [ ] 6.2 Implement on-demand game resource caching and a verifiable offline-ready state for each catalog entry.
- [ ] 6.3 Implement waiting-worker detection and user-controlled activation that never replaces code during an active session.
- [ ] 6.4 Add cache-version cleanup and verify that a failed or interrupted update leaves a usable prior application version.

## 7. End-to-End Quality

- [ ] 7.1 Add Playwright flows for catalog launch, Block Drop keyboard play, touch controls, direct hash navigation, pause/resume, and return-to-catalog cleanup.
- [ ] 7.2 Add production-preview tests for service-worker installation, offline shell reload, cached game launch, uncached-game recovery, and application update behavior.
- [ ] 7.3 Run lint, type checking, unit/component tests, browser tests, and the production build; resolve all failures.
- [ ] 7.4 Test the production build at representative phone portrait and landscape sizes and verify install metadata and original asset attribution.

## 8. Automation and Publication

- [ ] 8.1 Add a pull-request and main-branch CI workflow that installs locked dependencies and runs lint, type checking, tests, and the production build.
- [ ] 8.2 Add a GitHub Pages workflow that deploys only validated `main` builds and fails clearly when Pages is not configured.
- [ ] 8.3 Document local development, mobile-device testing, validation commands, game-module extension points, offline semantics, and the release/version model.
- [ ] 8.4 Create the public `mattgotteiner/games` GitHub repository, push `main`, enable Pages through GitHub Actions, and verify the deployed `/games/` URL.
- [ ] 8.5 Verify installation and offline launch on a physical phone, record any platform-specific limitations, and tag the validated deployment as `v0.1.0`.
