# Game Deep Links Specification

## Purpose

Make each catalog game directly addressable, shareable, and compatible with
browser history while preserving repository-scoped static hosting and offline
operation.

## Requirements

### Requirement: Stable game URLs
The application SHALL represent an active game with its stable catalog
identifier in the `game` query parameter and SHALL represent the catalog by
omitting that parameter.

#### Scenario: Launch a game from the catalog
- **WHEN** the user launches Block Drop from the catalog
- **THEN** Block Drop starts and the current URL contains `game=block-drop`

#### Scenario: Return to the catalog
- **WHEN** the user activates the catalog return control from a game
- **THEN** the game is destroyed, the catalog is shown, and the `game` query parameter is absent

### Requirement: Direct game entry
The application SHALL select a supported game from the URL during initial load
without requiring the catalog launch control to be activated first.

#### Scenario: Load a valid game deep link
- **WHEN** the application loads with `game=block-drop`
- **THEN** a new Block Drop session is shown directly

#### Scenario: Load a deep link under the repository deployment path
- **WHEN** the repository-scoped production URL loads with `game=block-drop`
- **THEN** the application preserves its deployment path and shows Block Drop

### Requirement: Browser history synchronization
Game launches and catalog returns SHALL create browser history entries, and the
application SHALL update the active view when the user traverses those entries
without a document reload.

#### Scenario: Navigate back from a launched game
- **WHEN** the user launches Block Drop from the catalog and activates browser Back
- **THEN** the active Block Drop session is destroyed and the catalog is shown

#### Scenario: Navigate forward to a game
- **WHEN** browser Forward restores a valid game URL
- **THEN** a new session for that game is shown

### Requirement: Unsupported game recovery
The application SHALL recover an unsupported or empty game identifier to the
catalog and SHALL remove only the invalid `game` parameter by replacing the
current history entry.

#### Scenario: Load an unsupported game identifier
- **WHEN** the application loads with a `game` value that is not a supported catalog identifier
- **THEN** the catalog is shown and the URL no longer contains the `game` parameter

#### Scenario: Preserve unrelated URL data during recovery
- **WHEN** an invalid `game` parameter is removed from a URL containing other query parameters or a fragment
- **THEN** the unrelated query parameters, deployment path, and fragment remain unchanged

### Requirement: Offline deep-link navigation
A game URL SHALL remain directly loadable and history navigation SHALL remain
functional after the current production application has been successfully
loaded online and connectivity is removed.

#### Scenario: Load a cached game URL offline
- **WHEN** the production application is service-worker controlled, connectivity is removed, and the browser loads the repository URL with `game=block-drop`
- **THEN** Block Drop is shown and accepts gameplay input without a network error

#### Scenario: Traverse game history offline
- **WHEN** the service-worker-controlled application is offline and the user traverses between catalog and game history entries
- **THEN** the corresponding view is shown without a network request or document reload
