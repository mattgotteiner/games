## Purpose

Provide a scalable catalog through which users can discover, launch, and understand the offline availability of independently packaged games.

## ADDED Requirements

### Requirement: Registered games are discoverable
The catalog SHALL display each released game from the application registry with its title, original artwork, concise description, and available actions.

#### Scenario: User opens the catalog
- **WHEN** the application shell starts successfully
- **THEN** every registered game is represented once with enough information to distinguish and launch it

#### Scenario: No games are registered
- **WHEN** the registry contains no released games
- **THEN** the catalog displays an intentional empty state rather than an error or blank screen

### Requirement: Games load independently
The catalog SHALL load a game's executable resources only when the user launches or explicitly downloads that game.

#### Scenario: User visits the catalog
- **WHEN** the catalog renders before any game is selected
- **THEN** optional rendering engines and executable resources belonging only to unselected games are not loaded

#### Scenario: User launches a game
- **WHEN** the user activates a playable catalog entry
- **THEN** the application loads that game's module and transitions to its game screen

### Requirement: Offline readiness is visible
The catalog SHALL indicate whether each game is expected to launch with the device offline.

#### Scenario: Game resources have been cached
- **WHEN** all resources required by a game are stored for offline use
- **THEN** the catalog identifies the game as offline-ready

#### Scenario: Offline user selects an unavailable game
- **WHEN** the device is offline and the selected game's required resources are not cached
- **THEN** the catalog keeps the user in a recoverable state and explains that the game must first be loaded or downloaded online

### Requirement: Game loading failures are recoverable
The catalog SHALL surface game loading failures without making the application shell unusable.

#### Scenario: Game module fails to load
- **WHEN** a selected game module cannot be loaded
- **THEN** the user sees an actionable error and can return to or continue using the catalog

