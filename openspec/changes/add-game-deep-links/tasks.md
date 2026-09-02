## 1. URL Navigation Boundary

- [x] 1.1 Add typed parsing and URL mutation helpers for catalog and supported
  game selections; preserve pathname, unrelated parameters, and fragments; verify
  focused unit tests cover valid, absent, empty, invalid, and repository-scoped
  URLs.

## 2. Application History Integration

- [ ] 2.1 Initialize the mounted view from the current URL, push canonical URLs
  for launch and catalog return, replace invalid game selections, and react to
  `popstate`; verify component tests cover direct entry, URL updates,
  Back/Forward-equivalent transitions, controller cleanup, canonicalization, and
  listener teardown.

## 3. Production and Offline Verification

- [ ] 3.1 Extend browser coverage for direct repository-scoped entry and
  Back/Forward navigation, extend the service-worker-controlled flow for offline
  deep-link loads and history traversal, and run the repository's locked
  `npm run check` command.
