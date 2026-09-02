## Why

Individual games cannot currently be bookmarked, shared, or restored through
browser navigation because the selected view exists only in component state.
Repository-safe deep links make every game directly addressable without
requiring server-side route rewrites from GitHub Pages.

## What Changes

- Give each game a stable URL identifier carried in the `game` query parameter.
- Open a valid game deep link directly and keep the URL synchronized when users
  launch a game or return to the catalog.
- Integrate with browser Back and Forward navigation without reloading the app.
- Recover invalid or unavailable game identifiers to the catalog and canonical
  catalog URL.
- Preserve repository-scoped deployment paths and offline navigation.

## Capabilities

### New Capabilities

- `game-deep-links`: URL selection, canonicalization, history navigation, and
  repository-safe direct entry for catalog games.

### Modified Capabilities

None.

## Impact

- Affects application-level catalog/game selection in `src/App.tsx` and its
  component/browser coverage.
- Extends production and service-worker-controlled offline navigation tests.
- Introduces no new runtime dependency or server configuration.
