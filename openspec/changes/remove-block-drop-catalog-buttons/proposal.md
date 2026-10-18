## Why

Block Drop currently provides two in-game ways to leave: the header `Catalog`
button and the game-over card's `Back to catalog` button. Remove both so the
game offers `Play again` at game over and browser Back returns to the catalog.

## What Changes

- Remove all in-game catalog buttons, including the header `Catalog` control
  and the game-over card's `Back to catalog` button.
- Keep `Play again` as the game-over card's only button and center it.
- Preserve browser-history navigation so browser Back returns to the catalog
  after a game was launched there.

## Capabilities

### Modified Capabilities

- `block-drop`: catalog navigation and game-over actions.

## Impact

- Changes the game header, game-over card, and browser navigation coverage.
- Does not change URL formats, scoring, or restart shortcuts.
