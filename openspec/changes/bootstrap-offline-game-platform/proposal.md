## Why

Create a lightweight, installable home for mobile-first web games that remains useful without a network connection and can grow without coupling every game to one UI framework or rendering engine. Establishing the platform contract and first playable game together provides a complete vertical slice for validating installation, offline behavior, touch interaction, testing, and GitHub Pages delivery.

## What Changes

- Establish a responsive single-page application that can be installed or pinned on supported phones.
- Make the application shell and catalog available offline after an initial successful visit.
- Add a catalog that lists available games, communicates offline readiness, and launches lazy-loaded game modules.
- Define a framework-independent lifecycle and services contract so each game can choose an appropriate renderer or engine.
- Add an originally branded falling-block puzzle game with deterministic rules, touch and keyboard controls, scoring, pause/resume behavior, and local high-score persistence.
- Establish version boundaries for application releases, game rules, and persisted data.
- Add the repository, TypeScript/Vite/Preact toolchain, automated tests, and GitHub Pages build and deployment workflows needed to operate the public application.

## Capabilities

### New Capabilities

- `offline-app-shell`: Installable, responsive PWA shell, offline startup, update handling, and mobile lifecycle behavior.
- `game-catalog`: Discovery, launch, lazy loading, and offline-readiness presentation for registered games.
- `game-runtime`: Framework-independent game registration, lifecycle, input, storage, and versioning contract.
- `games/block-drop`: Rules and user experience for the initial falling-block puzzle game.

### Modified Capabilities

None.

## Impact

- Creates the initial application and repository structure under a public `mattgotteiner/games` GitHub repository.
- Introduces Preact, TypeScript, Vite, PWA/Workbox integration, Vitest, Testing Library, Playwright, and ESLint.
- Adds browser-managed offline caches and versioned local persistence.
- Adds GitHub Actions for continuous integration and GitHub Pages deployment at the repository subpath.
- Establishes the extension boundary future games must implement while allowing game-specific rendering libraries to remain lazy-loaded.
