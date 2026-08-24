## Purpose

Provide an installable, responsive application shell that reliably opens on supported mobile and desktop browsers and remains available after connectivity is lost.

## ADDED Requirements

### Requirement: Installable application identity
The application SHALL provide valid web application metadata, original application icons, a standalone display mode, theme colors, and a launch URL scoped to the deployed GitHub Pages application.

#### Scenario: Browser evaluates installation
- **WHEN** a supported browser loads the deployed application over HTTPS
- **THEN** the browser can recognize the site as an installable web application named for the game catalog

#### Scenario: User launches an installed application
- **WHEN** a user opens the application from a home-screen icon
- **THEN** the application opens within its deployment scope using a standalone presentation

### Requirement: Offline shell availability
After one successful online load, the application SHALL make the shell and catalog available without a network connection.

#### Scenario: Returning user launches while offline
- **WHEN** a user has previously loaded the current application shell and later launches it without connectivity
- **THEN** the application displays the catalog without requiring a network request

#### Scenario: First visit occurs offline
- **WHEN** a device that has never loaded the application navigates to it without connectivity
- **THEN** the browser reports that the application is unavailable rather than the application presenting a false successful state

### Requirement: Mobile-responsive presentation
The application SHALL remain usable in portrait and landscape phone layouts, account for device safe areas and dynamic viewport dimensions, and preserve browser zoom accessibility outside active game gestures.

#### Scenario: Application runs on a notched phone
- **WHEN** the application is displayed in standalone mode on a device with safe-area insets
- **THEN** navigation, catalog content, and game controls remain visible and operable outside obscured regions

#### Scenario: Device orientation changes
- **WHEN** the user rotates the device while the application is open
- **THEN** the active screen reflows without losing application or game state

### Requirement: Non-disruptive application updates
The application SHALL detect a newly available application version and SHALL NOT replace the executing version during an active game session.

#### Scenario: Update arrives in the catalog
- **WHEN** a newer version becomes available while no game session is active
- **THEN** the application offers a clear action to load the newer version

#### Scenario: Update arrives during play
- **WHEN** a newer version becomes available during an active game session
- **THEN** the current session continues on its existing version until the user leaves or explicitly accepts the update

