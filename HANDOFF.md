# Games Platform Handoff

## Current State

The original all-in-one plan remains at:

`bootstrap-offline-game-platform`

Do not apply that change first. It combines repository setup, offline behavior,
a reusable game platform, Block Drop, extensive testing, and publication in one
41-task increment.

Planning is complete for the smaller first OpenSpec change:

`publish-mobile-game-shell`

First-change location:

`openspec/changes/publish-mobile-game-shell`

All required artifacts are complete and pass strict OpenSpec validation:

- `proposal.md`
- `design.md`
- `specs/mobile-game-shell/spec.md`
- `tasks.md`

No application code has been implemented yet.

## Resume

Open Copilot CLI in this repository and run:

`/openspec-apply-change publish-mobile-game-shell`

Alternatively, ask:

`Apply the publish-mobile-game-shell change.`

Do not use `/opsx-apply`; the installed skill in this workspace is
`/openspec-apply-change`.

## First Increment

- Public repository: `mattgotteiner/games`
- Deployment: GitHub Pages at the `/games/` repository path
- Shell: Preact, TypeScript, and Vite
- UI: Responsive application identity and honest empty catalog state
- Testing: Type checking, production build, and one component test
- Automation: Minimal CI plus GitHub Pages deployment from `main`
- Explicitly deferred: Games, routing, installability, offline caching,
  persistence, Playwright, and a generalized game runtime

## Expected Apply Scope

The apply workflow contains four tasks:

1. Initialize Git and the minimal Preact/TypeScript/Vite toolchain.
2. Build and test the responsive empty catalog shell.
3. Add CI and GitHub Pages deployment.
4. Publish the repository and verify the deployed shell.

## Implementation Checkpoints

Implement the four tasks as validated increments rather than one large batch.
Do not assume that type checking, unit tests, or a successful build prove the
real application path.

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

If a checkpoint fails, fix and revalidate that increment before building later
work on top of it. Complete all four tasks in this change unless a concrete
blocker or an approval boundary prevents continuation.

## After the First Increment

Stop after the deployed empty shell is verified. Do not fold the next product
increment into the current apply workflow.

Create and review separate OpenSpec changes in this order:

1. **Installable offline shell:** Add manifest metadata, shell-only caching, an
   offline reload test, and physical-phone verification.
2. **Minimal Block Drop:** Add only the deterministic core, Canvas rendering,
   keyboard/touch controls, and the smallest mount/destroy boundary discovered
   from the real game.
3. **Block Drop hardening:** Add scoring, levels, persistence, lifecycle
   hardening, broader tests, and release tagging.
4. **Shared platform abstractions:** Defer until a second game exposes concrete
   duplication or incompatible needs.

GitHub publication requires valid GitHub authentication and permission to
create repositories under `mattgotteiner`.
