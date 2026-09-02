# Games Platform Handoff

## Current State

The original all-in-one plan remains at:

`bootstrap-offline-game-platform`

Do not apply that change first. It combines repository setup, offline behavior,
a reusable game platform, Block Drop, extensive testing, and publication in one
41-task increment.

The smaller first OpenSpec change is complete:

`publish-mobile-game-shell`

First-change location:

`openspec/changes/publish-mobile-game-shell`

All four tasks are complete. The public repository and deployed shell are live:

- Repository: `https://github.com/mattgotteiner/games`
- Application: `https://mattgotteiner.github.io/games/`
- Published commit: `aa3d9be`

The deployed application is a responsive, installable Preact, TypeScript, and
Vite shell with application identity and an honest "No games yet" catalog
state. CI and GitHub Pages deployment are configured. The `main` branch is
synchronized with `origin/main`.

## Resume

The completed `publish-mobile-game-shell` change remains ready to archive.

The `add-installable-offline-shell` change is complete and archived at:

`openspec/changes/archive/2026-09-01-add-installable-offline-shell`

Both tasks are complete. The implementation passed CI, deployed, and was
verified through the public URL, including desktop Chromium offline reload and
physical-phone installation and offline reopening on iPhone Air with Safari.
The synchronized main capability spec is at:

`openspec/specs/offline-installation/spec.md`

The next product increment is a separate OpenSpec change for Minimal Block
Drop. Do not apply the original 41-task bootstrap change.

## Completed First Increment

- Public repository: `mattgotteiner/games`
- Deployment: GitHub Pages at the `/games/` repository path
- Shell: Preact, TypeScript, and Vite
- UI: Responsive application identity and honest empty catalog state
- Testing: Type checking, production build, and one component test
- Automation: Minimal CI plus GitHub Pages deployment from `main`
- Explicitly deferred: Games, routing, persistence, and a generalized game
  runtime

## Completed Apply Scope

The apply workflow contains four tasks:

1. Initialize Git and the minimal Preact/TypeScript/Vite toolchain.
2. Build and test the responsive empty catalog shell.
3. Add CI and GitHub Pages deployment.
4. Publish the repository and verify the deployed shell.

## Implementation History

The four tasks were implemented as validated increments rather than one large
batch. The deployed application was checked through the real public path.

For future OpenSpec planning, define top-level task boundaries only at seams
that can be validated end to end. Work that cannot produce an independently
E2E-testable outcome belongs as a subtask within the next testable increment,
not as its own completion checkpoint.

1. **Toolchain checkpoint:** Initialize the repository and scaffold only. Run
   the configured type check, test, and production build before adding shell
   behavior.
2. **Shell checkpoint:** Add the identity and empty catalog. Run the focused
   component test, then serve the production build under the `/games/` base
   path and confirm the real page loads with its styles and assets.
3. **Automation checkpoint:** Add CI and Pages workflows only after the local
   production artifact works. Confirm the workflows execute the same locked
   validation commands used locally.
4. **Publication checkpoint:** Push and deploy only after the earlier
   checkpoints pass. Load the public `/games/` URL rather than treating a green
   Actions run as proof; verify the identity, "No games yet" state, styles, and
   assets at desktop and phone portrait and landscape sizes.

## Next Increment

Plan and implement each product increment as a separate OpenSpec change. The
completed and archived `add-installable-offline-shell` increment added manifest
metadata, shell-only caching, offline reload coverage, and physical-phone
verification. It preserves the honest empty catalog and does not add a game,
persistence, or generalized game runtime.

Its two implementation seams are:

1. Produce and locally exercise the installable production artifact through a
   real browser, including an offline reload under `/games/`.
2. Run that seam in CI, deploy it, then install and reopen it offline on a
   supported physical phone.

Continue with separate OpenSpec changes in this order:

1. **Minimal Block Drop:** Add only the deterministic core, Canvas rendering,
   keyboard/touch controls, and the smallest mount/destroy boundary discovered
   from the real game.
2. **Block Drop hardening:** Add scoring, levels, persistence, lifecycle
   hardening, broader tests, and release tagging.
3. **Shared platform abstractions:** Defer until a second game exposes concrete
   duplication or incompatible needs.
