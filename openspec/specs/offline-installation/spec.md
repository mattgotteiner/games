# Offline Installation Specification

## Purpose

Make the deployed mobile catalog installable and keep its application shell
available after a successful online visit when the network is unavailable.

## Requirements

### Requirement: Installable application identity
The application SHALL provide install metadata and icons scoped to the
deployed `/games/` path so a supported phone browser can add it to the user's
device and launch it with the Games identity in standalone display mode.

#### Scenario: Install from a supported phone browser
- **WHEN** a user visits the deployed application in a supported phone browser and adds it to the device
- **THEN** the installed application uses the Games name and icon and launches within the `/games/` scope

### Requirement: Shell available offline after first load
The application SHALL cache the files required to display the current catalog
shell after they have been loaded successfully online.

#### Scenario: Reload after losing connectivity
- **WHEN** a user successfully loads the deployed catalog online, then loses network connectivity and reloads it
- **THEN** the application displays its identity and current catalog shell without a network error

#### Scenario: Reopen an installed shell offline
- **WHEN** a user installs the application after a successful online load and later opens it without network connectivity
- **THEN** the installed application displays the current catalog shell

### Requirement: Honest offline catalog
Offline capability SHALL NOT imply that unavailable games can be launched or
that content not previously cached is available.

#### Scenario: Empty catalog is opened offline
- **WHEN** the current shell is opened offline with no games registered
- **THEN** the user sees the same "No games yet" state with no play control

### Requirement: Deployment-path-safe offline assets
Install and offline resources SHALL resolve within the GitHub Pages `/games/`
deployment scope rather than relying on origin-root URLs.

#### Scenario: Load the production artifact under its repository path
- **WHEN** the built application is served from the `/games/` base path
- **THEN** its manifest, icons, application assets, and offline shell requests resolve without leaving that path
