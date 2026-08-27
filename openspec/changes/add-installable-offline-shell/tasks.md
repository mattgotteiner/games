## 1. Locally Verified Installable Offline Shell

- [ ] 1.1 Add the PWA dependency, original manifest icons, `/games/`-scoped
  manifest and generated service worker, automatic registration, and a focused
  Playwright production-browser test; preserve the honest empty catalog, run
  the existing checks, and prove that the built shell becomes controlled and
  reloads offline from the repository base path.

## 2. Deployed Phone Installation

- [ ] 2.1 Run the offline browser seam in CI before Pages deployment, publish
  the validated artifact, confirm the public site remains correct online, then
  install it from the public URL on a supported physical phone and prove that
  it launches with the Games identity and reopens to "No games yet" while the
  phone is offline.
