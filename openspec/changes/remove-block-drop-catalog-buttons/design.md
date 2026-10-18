## Context

Block Drop provides a `Catalog` control in the game header and a second
`Back to catalog` button in the game-over card. Both duplicate browser-history
navigation. The card's primary action is `Play again`, which already receives
focus when the game ends.

## Goals / Non-Goals

**Goals:**

- Remove both catalog buttons from the game UI.
- Make `Play again` the only button in the game-over card, centered with its
  current focus behavior.
- Preserve browser Back navigation to the catalog after an in-app launch.

**Non-Goals:**

- Change URL formats, browser-history behavior, or game resource cleanup.
- Change restart keyboard shortcuts or scoring.

## Decisions

### Use browser history for catalog navigation

The app already pushes the game route when the player launches from the
catalog and listens for browser history changes. Removing the in-game buttons
leaves browser Back as the return path and lets the existing cleanup run when
the game view unmounts.

### Center the remaining game-over action

The pause panel still has two actions and retains its two-column layout. Give
the game-over action group a single centered column so `Play again` does not
occupy one half of the former two-button layout.

## Risks / Trade-offs

- Players use the browser's Back control to leave a game and return to the
  catalog after launching it there.

## Validation

Update the existing game-over and offline browser flows to verify no in-game
catalog buttons are present and use browser Back/Forward for navigation.
