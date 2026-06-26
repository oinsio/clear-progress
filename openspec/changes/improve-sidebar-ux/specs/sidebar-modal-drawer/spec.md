## MODIFIED Requirements

### Requirement: Drawer opens via swipe on narrow screen without hover

On narrow screen without hover capability (`isNarrow && !hasHover`), the sidebar SHALL open as a drawer (full expanded view with backdrop) only via swipe gesture. The drawer state (`isDrawerOpen`) SHALL be tracked via React state, NOT persisted to localStorage. Implements FR9 of improve-sidebar-ux.

#### Scenario: Swipe opens drawer on mobile
- **WHEN** screen is narrow and hover is not available
- **AND** user swipes from the sidebar edge
- **THEN** sidebar opens as drawer with backdrop
- **AND** `sidebarMode` in localStorage does not change

#### Scenario: Drawer state is not persisted
- **WHEN** sidebar is open as drawer
- **AND** user reloads the page
- **THEN** sidebar is collapsed (transient drawer state lost)

### Requirement: Drawer auto-collapses on navigation item click

In drawer mode (narrow + no hover), clicking a navigation item SHALL navigate to the selected route AND close the drawer. Implements FR11 of improve-sidebar-ux.

#### Scenario: Clicking nav item in drawer closes drawer
- **WHEN** sidebar is open as drawer
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** drawer closes

#### Scenario: Clicking search in drawer closes drawer
- **WHEN** sidebar is open as drawer
- **AND** user clicks the search button
- **THEN** app navigates to the search route
- **AND** drawer closes

## REMOVED Requirements

### Requirement: Modal drawer opens temporarily without persisting state

**Reason**: The `isTemporarilyOpen` concept and collapsed strip click to open modal drawer are removed. On desktop, hover-expand replaces modal drawer. On mobile (narrow + no hover), drawer opens only via swipe. Implements FR4, FR5, FR9 of improve-sidebar-ux.

### Requirement: Standard drawer stays open on navigation item click

**Reason**: Replaced by three-mode system. In expanded mode, sidebar stays open on navigation (see sidebar-navigation spec). Drawer behavior is now scoped to narrow + no hover only. Implements FR1 of improve-sidebar-ux.
