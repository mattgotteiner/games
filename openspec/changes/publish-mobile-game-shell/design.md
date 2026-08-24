## Context

The directory contains OpenSpec planning files but no application or Git
history. GitHub Pages will host static files under the `/games/` repository
path. See `proposal.md` for why this increment excludes games and offline
behavior.

## Goals / Non-Goals

**Goals:**

- Establish the smallest typed, component-based application that satisfies the
  `mobile-game-shell` requirements.
- Exercise the complete local-build, CI, and GitHub Pages deployment path.
- Leave an uncomplicated base for the next independently specified increment.

**Non-Goals:**

- Install metadata, service workers, offline caching, or update coordination.
- A game registry, game lifecycle contract, persistence layer, or game code.
- Client routing, browser-test infrastructure, or reusable abstractions without
  a current consumer.

## Decisions

### Use Preact, TypeScript, and Vite without routing

Use Preact for the single catalog view, strict TypeScript for application code,
and Vite for development and production builds. Configure Vite's production
base as `/games/`.

This preserves the lightweight component model selected for the broader product
while avoiding a router until a second view exists. React would add runtime
weight without benefiting this shell; vanilla TypeScript would save a
dependency but provide a less representative foundation for later catalog UI.

### Render an explicit empty state from a static catalog

Represent the initial catalog as an empty typed collection and render a clear
"No games yet" state. Do not introduce lazy loaders, runtime services, storage,
or placeholder play controls.

This validates catalog composition without guessing at the contract a real game
will need. The first game change can evolve the static collection using
concrete requirements.

### Keep mobile styling small and platform-native

Use global CSS with a responsive content width, dynamic viewport units,
safe-area padding, readable typography, and visible focus styling. Avoid a
component library or design system in this increment.

### Use minimal automated gates

Add formatting-independent linting only if it is part of the scaffolded project
baseline, strict type checking, a production build, and one component test that
covers application identity and the empty state. Do not add Playwright until
there is an interaction or offline behavior that benefits from browser-level
coverage.

### Deploy validated main builds through GitHub Actions

Run the minimal checks in CI and deploy the built artifact through the official
GitHub Pages actions. The deployment uses repository-relative assets derived
from the Vite base configuration.

## Risks / Trade-offs

- [The empty shell proves delivery but not gameplay architecture] -> Keep the
  increment intentionally short and use the first game as the evidence for that
  architecture.
- [Skipping browser tests leaves deployment-path behavior less exercised
  locally] -> Verify the public URL directly in this increment and add
  production-preview browser coverage when offline behavior is introduced.
- [The `/games/` base path can break absolute asset URLs] -> Centralize the
  Vite base setting and avoid origin-root asset references.

## Migration Plan

1. Initialize the existing directory without replacing OpenSpec files.
2. Build and validate the shell locally.
3. Create the public repository, push `main`, and enable the Pages workflow.
4. Verify the deployed desktop and phone layouts.
5. Roll back a faulty deployment by redeploying the previous known-good commit.
