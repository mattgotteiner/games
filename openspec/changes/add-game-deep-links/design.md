## Context

The app currently stores `'catalog' | 'block-drop'` only in `App` component
state. Production is hosted below a repository path on GitHub Pages, where
arbitrary path routes do not have a server-side SPA fallback. The existing PWA
does provide a navigation fallback after installation. See `proposal.md` for
motivation and `specs/game-deep-links/spec.md` for observable behavior.

## Goals / Non-Goals

**Goals:**

- Keep the URL and mounted view synchronized from initial load through browser
  history traversal.
- Preserve the repository deployment path, unrelated query parameters, and
  fragments when changing game selection.
- Keep routing logic deterministic and independently unit-testable.

**Non-Goals:**

- Add a routing dependency, server rewrite configuration, or path-based routes.
- Introduce a generalized game runtime or change Block Drop session state
  persistence.
- Restore an in-progress game after history traversal or page reload; opening a
  game URL starts a new session.

## Decisions

### Use a query parameter for game selection

The canonical Block Drop URL is the current deployment URL with
`?game=block-drop`. Query selection works at both the local root and the
repository-scoped GitHub Pages path because it does not alter the pathname the
static host resolves. Hash routing was considered but produces less conventional
share URLs and competes with document fragments. Path routing was rejected
because direct uncached GitHub Pages requests would return 404 without an
additional fallback deployment mechanism.

### Isolate URL parsing and mutation from rendering

A small navigation module will own the supported game identifier type, parse a
`URL` into a catalog or game selection, and produce URLs with only the `game`
parameter changed. `App` will use those functions for initial state, launch,
return, and `popstate`. This keeps browser APIs at the application edge and lets
unit tests cover validation and preservation behavior without introducing a
router.

The first implementation recognizes only `block-drop`; adding a catalog game
requires adding its stable identifier to this explicit routing boundary. A
generalized game registry remains deferred until multiple games make that
abstraction useful.

### Use pushState for user navigation and replaceState for canonicalization

Launching a game and using its catalog return control will call `pushState` so
Back and Forward reproduce those user-visible transitions. Initial or popped
URLs with an unsupported/empty `game` value will render the catalog and use
`replaceState` to remove only that parameter. Replacement prevents invalid URLs
from trapping history traversal in repeated equivalent catalog entries.

### Derive popped views from the live URL

`App` will subscribe to `popstate`, parse `window.location`, and update the
mounted view. Component unmounting continues to destroy the active controller.
History state payloads are not authoritative, which keeps bookmarked, manually
edited, and browser-restored URLs equivalent.

## Risks / Trade-offs

- [Query URLs are less visually hierarchical than path routes] -> Prefer static
  hosting reliability; path routes can be introduced later with a migration
  redirect if hosting capabilities change.
- [Back after an explicit catalog return reopens the prior game] -> This is
  standard push-history behavior and keeps Forward/Back transitions reversible.
- [Manually changing the address bar reloads and starts a fresh game] -> Session
  persistence is explicitly outside this change; deterministic direct entry is
  sufficient.
- [Tests can leak browser history between cases] -> Reset the URL in test setup
  and verify listener cleanup on unmount.

## Migration Plan

Deploy as a backward-compatible enhancement: URLs without `game` continue to
open the catalog. Rollback requires only reverting the application navigation
code; query-bearing links then fall back to the catalog as they do today.
