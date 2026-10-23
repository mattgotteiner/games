## MODIFIED Requirements

### Requirement: Stable game URLs
The application SHALL represent an active game with its stable catalog
identifier in the `game` query parameter and SHALL represent the catalog by
omitting that parameter. The supported identifiers SHALL be `block-drop` and
`brick-burst`.

#### Scenario: Launch a game from the catalog
- **WHEN** the user launches Block Drop from the catalog
- **THEN** Block Drop starts and the current URL contains `game=block-drop`

#### Scenario: Launch Brick Burst from the catalog
- **WHEN** the user launches Brick Burst from the catalog
- **THEN** Brick Burst starts and the current URL contains `game=brick-burst`

#### Scenario: Return to the catalog
- **WHEN** the user activates the catalog return control from a game
- **THEN** the game is destroyed, the catalog is shown, and the `game` query parameter is absent

### Requirement: Direct game entry
The application SHALL select a supported game from the URL during initial load
without requiring the catalog launch control to be activated first.

#### Scenario: Load a valid game deep link
- **WHEN** the application loads with `game=block-drop`
- **THEN** a new Block Drop session is shown directly

#### Scenario: Load a Brick Burst deep link
- **WHEN** the application loads with `game=brick-burst`
- **THEN** a new Brick Burst session is shown directly, waiting to serve

#### Scenario: Load a deep link under the repository deployment path
- **WHEN** the repository-scoped production URL loads with `game=block-drop` or `game=brick-burst`
- **THEN** the application preserves its deployment path and shows that game
