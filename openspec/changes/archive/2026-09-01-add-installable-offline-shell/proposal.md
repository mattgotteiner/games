## Why

The deployed catalog currently depends on a network connection and cannot be
installed as an app. The next smallest user-visible milestone is to make the
existing shell installable and reliably reloadable offline before adding a game
or designing broader runtime abstractions.

## What Changes

- Add install metadata and original application icons for standalone display
  from the deployed `/games/` scope.
- Cache only the current application shell so a user who has loaded it online
  can reopen or reload it without a network connection.
- Add browser coverage for the deployed-base-path and offline-reload behavior.
- Verify installation and offline reopening through the real GitHub Pages site
  on a physical phone.
- Keep the existing honest empty catalog; games, game-resource downloads,
  persistence, update prompts, and generalized runtime behavior remain
  deferred.

## Capabilities

### New Capabilities

- `offline-installation`: Installation metadata, shell caching, and
  offline-after-first-load behavior for the deployed mobile application.

### Modified Capabilities

None.

## Impact

- Adds PWA build configuration, manifest and icon assets, service-worker
  registration, and browser-test infrastructure.
- Extends package scripts and GitHub Actions so offline behavior is checked
  before deployment.
- Changes the static GitHub Pages artifact while preserving the current
  catalog UI and `/games/` deployment path.
