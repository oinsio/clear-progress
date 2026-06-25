## MODIFIED Requirements

### Requirement: Sidebar toggles between expanded and collapsed states

The sidebar SHALL support two visual states: expanded (showing icons + labels, `w-52`) and collapsed (showing icons only, `w-14`). In expanded state, a toggle button in the header SHALL close the sidebar. Clicking the collapsed strip SHALL open the sidebar. The container of the expanded sidebar SHALL NOT be clickable for toggling. The state SHALL persist in localStorage.

#### Scenario: Sidebar opens from collapsed state
- **WHEN** sidebar is collapsed
- **AND** user clicks the collapsed strip
- **THEN** sidebar expands to show icons and labels

#### Scenario: Sidebar closes via toggle button
- **WHEN** sidebar is expanded
- **AND** user clicks the toggle button in the header
- **THEN** sidebar collapses to show icons only

#### Scenario: Clicking empty area in expanded sidebar does nothing
- **WHEN** sidebar is expanded
- **AND** user clicks on empty space inside the sidebar (not on a button or nav item)
- **THEN** sidebar remains expanded

#### Scenario: Toggle state persists across page reloads
- **WHEN** user opens the sidebar via toggle button (setting `isPanelOpen=true`)
- **AND** page is reloaded
- **THEN** sidebar remains open

### Requirement: Toggle button renders in expanded sidebar header

The expanded sidebar header SHALL render a toggle button as its first element. The button SHALL display `ChevronLeft` icon when sidebar is on the right, `ChevronRight` when sidebar is on the left (pointing toward the closing edge). Implements FR1 of improve-sidebar-ux.

#### Scenario: Toggle button shows ChevronLeft for right-side sidebar
- **WHEN** sidebar is expanded
- **AND** sidebar side is "right"
- **THEN** toggle button displays ChevronLeft icon

#### Scenario: Toggle button shows ChevronRight for left-side sidebar
- **WHEN** sidebar is expanded
- **AND** sidebar side is "left"
- **THEN** toggle button displays ChevronRight icon

#### Scenario: Toggle button not rendered in collapsed state
- **WHEN** sidebar is collapsed
- **THEN** no toggle button is rendered

### Requirement: Sidebar uses accessible markup

The sidebar filter list SHALL be wrapped in a `<nav>` element with an `aria-label`. Each filter button SHALL have an `aria-label` and `aria-pressed` attribute. The toggle button SHALL have `aria-label` (localized "Close sidebar" / "Open sidebar"), `role="button"`, and be keyboard accessible (Enter/Space). The expanded sidebar container SHALL NOT have `role="button"`, `tabIndex`, or toggle-related `aria-label`. Implements NFR-A1 of improve-sidebar-ux.

#### Scenario: Nav element has aria-label
- **WHEN** sidebar is rendered
- **THEN** filter navigation is wrapped in a nav element with aria-label

#### Scenario: Filter buttons have aria-pressed
- **WHEN** sidebar is rendered with an active mode
- **THEN** the active filter button has `aria-pressed="true"`
- **AND** inactive filter buttons have `aria-pressed="false"`

#### Scenario: Toggle button is keyboard accessible
- **WHEN** sidebar is expanded
- **THEN** the toggle button has `aria-label` with localized "Close sidebar" text
- **AND** pressing Enter on the toggle button collapses the sidebar

#### Scenario: Expanded container has no button role
- **WHEN** sidebar is expanded
- **THEN** the sidebar container does NOT have `role="button"`
- **AND** the sidebar container does NOT have `tabIndex`

#### Scenario: Collapsed strip is keyboard accessible
- **WHEN** sidebar is collapsed
- **THEN** the collapsed strip has `role="button"` and `tabIndex={0}`
- **AND** pressing Enter on the strip expands the sidebar

## REMOVED Requirements

### Requirement: Always-open mode overrides toggle

**Reason**: Redundant after implementing modal/standard drawer distinction. `isPanelOpen=true` in localStorage provides the same behavior as always-open mode — sidebar stays expanded and does not auto-collapse on navigation. Implements FR10 of improve-sidebar-ux.

**Migration**: Users with `isPanelAlwaysOpen=true` will have `isPanelOpen` set to `true` automatically. The always-open toggle is removed from settings UI.
