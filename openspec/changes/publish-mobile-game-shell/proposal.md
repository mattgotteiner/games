## Why

Before building a game or an offline platform, validate the smallest complete
delivery path: a public, mobile-friendly game catalog that can be built,
tested, and deployed reliably. This isolates repository, responsive-layout,
CI, and GitHub Pages risks from later product complexity.

## What Changes

- Create a responsive single-page shell with an honest empty catalog state.
- Establish the minimal TypeScript application toolchain and automated checks
  needed to keep the shell deployable.
- Publish the shell under the `/games/` GitHub Pages repository path.
- Explicitly defer games, installability, offline behavior, persistence, and a
  generalized game runtime to separate changes.

## Capabilities

### New Capabilities

- `mobile-game-shell`: Responsive application startup, catalog presentation,
  and empty-state behavior under the deployed repository path.

### Modified Capabilities

None.

## Impact

- Creates the initial Preact, TypeScript, and Vite application structure.
- Adds minimal component testing, type checking, continuous integration, and
  GitHub Pages deployment.
- Creates and publishes the public `mattgotteiner/games` repository.
- Does not add service workers, game code, game-engine dependencies, local
  persistence, or browser-test infrastructure.
