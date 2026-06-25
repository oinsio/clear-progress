## ADDED Requirements

### Requirement: Modal drawer opens temporarily without persisting state

When `isPanelOpen` is `false` in localStorage and user opens the sidebar via collapsed strip click, the sidebar SHALL open in modal (temporary) mode. Modal mode SHALL be tracked via React state (`isTemporarilyOpen`), NOT persisted to localStorage. Implements FR4 of improve-sidebar-ux.

#### Scenario: Clicking collapsed strip opens modal drawer
- **WHEN** `isPanelOpen` is `false` in localStorage
- **AND** user clicks the collapsed strip
- **THEN** sidebar expands (modal mode)
- **AND** `isPanelOpen` in localStorage remains `false`

#### Scenario: Modal state is not persisted
- **WHEN** sidebar is open in modal mode
- **AND** user reloads the page
- **THEN** sidebar is collapsed (transient state lost)

### Requirement: Modal drawer closes on navigation item click

In modal mode, clicking a navigation item SHALL navigate to the selected route AND close the sidebar. Implements FR5 of improve-sidebar-ux.

#### Scenario: Clicking menu item in modal mode navigates and closes
- **WHEN** sidebar is open in modal mode
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** sidebar collapses

#### Scenario: Clicking search in modal mode navigates and closes
- **WHEN** sidebar is open in modal mode
- **AND** user clicks the search button
- **THEN** app navigates to the search route
- **AND** sidebar collapses

### Requirement: Standard drawer stays open on navigation item click

When `isPanelOpen` is `true` in localStorage (standard drawer mode), clicking a navigation item SHALL navigate but NOT close the sidebar. Implements FR6 of improve-sidebar-ux.

#### Scenario: Clicking menu item in standard mode navigates without closing
- **WHEN** `isPanelOpen` is `true` in localStorage
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** sidebar remains expanded

#### Scenario: Standard mode persists across page reloads
- **WHEN** `isPanelOpen` is `true` in localStorage
- **AND** user reloads the page
- **THEN** sidebar is expanded
