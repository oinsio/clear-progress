## MODIFIED Requirements

### Requirement: Sidebar renders in three effective states

The sidebar SHALL support three effective visual states: **expanded** (icons + labels, `w-52`, pushes content), **collapsed** (icons only, `w-14`, pushes content), and **hover-ready** (icons only, `w-14`, expands as overlay on hover — see sidebar-hover-expand spec). The effective state is determined by the state resolution matrix (see sidebar-state-matrix spec). Implements FR1, FR8 of improve-sidebar-ux.

#### Scenario: Sidebar renders expanded state
- **WHEN** effective state is `expanded`
- **THEN** sidebar shows icons and labels
- **AND** sidebar width is `w-52`
- **AND** sidebar pushes main content

#### Scenario: Sidebar renders collapsed state
- **WHEN** effective state is `collapsed`
- **THEN** sidebar shows icons only
- **AND** sidebar width is `w-14`
- **AND** sidebar pushes main content

#### Scenario: Sidebar renders hover-ready state (not hovering)
- **WHEN** effective state is `hover-ready`
- **AND** mouse is NOT hovering over sidebar
- **THEN** sidebar shows icons only (same as collapsed)
- **AND** sidebar width is `w-14`

### Requirement: Collapsed sidebar icon click navigates directly

In collapsed and hover-ready (not hovering) states, clicking a navigation icon SHALL navigate to the corresponding route immediately without expanding the sidebar. Implements FR7, FR10 of improve-sidebar-ux.

#### Scenario: Clicking icon in collapsed sidebar navigates
- **WHEN** effective state is `collapsed`
- **AND** user clicks the "Goals" navigation icon
- **THEN** app navigates to the goals route
- **AND** sidebar remains collapsed

#### Scenario: Clicking icon in hover-ready sidebar navigates
- **WHEN** effective state is `hover-ready`
- **AND** sidebar is not hover-expanded
- **AND** user clicks a navigation icon
- **THEN** app navigates to the corresponding route
- **AND** sidebar remains in hover-ready state

### Requirement: Expanded sidebar navigation click does not collapse

In expanded state (not drawer), clicking a navigation item SHALL navigate without collapsing the sidebar. Implements FR1 of improve-sidebar-ux.

#### Scenario: Clicking nav item in expanded sidebar keeps sidebar open
- **WHEN** effective state is `expanded`
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** sidebar remains expanded

### Requirement: Sidebar uses accessible markup

The sidebar filter list SHALL be wrapped in a `<nav>` element with an `aria-label`. Each filter button SHALL have an `aria-label` and `aria-pressed` attribute. The sidebar container SHALL NOT have `role="button"`, `tabIndex`, or toggle-related `aria-label` in any state. Implements NFR-A1 of improve-sidebar-ux.

#### Scenario: Nav element has aria-label
- **WHEN** sidebar is rendered
- **THEN** filter navigation is wrapped in a nav element with aria-label

#### Scenario: Filter buttons have aria-pressed
- **WHEN** sidebar is rendered with an active mode
- **THEN** the active filter button has `aria-pressed="true"`
- **AND** inactive filter buttons have `aria-pressed="false"`

#### Scenario: Sidebar container has no button role
- **WHEN** sidebar is rendered in any state
- **THEN** the sidebar container does NOT have `role="button"`
- **AND** the sidebar container does NOT have `tabIndex`

## REMOVED Requirements

### Requirement: Toggle button in expanded sidebar header

**Reason**: Toggle buttons (`ChevronLeft`/`ChevronRight`) are replaced by the sidebar control popover with three modes (see sidebar-control spec). Implements FR4 of improve-sidebar-ux.

### Requirement: Collapsed strip click opens sidebar

**Reason**: Clicking the collapsed strip to open sidebar is removed. Navigation icons handle their own clicks directly (FR7). Sidebar mode is changed via the sidebar control popover (FR2). Implements FR4 of improve-sidebar-ux.

### Requirement: Collapsed strip is keyboard accessible

**Reason**: Collapsed strip no longer acts as a toggle button. Navigation icons are individually keyboard accessible. Implements FR4 of improve-sidebar-ux.

### Requirement: Always-open mode overrides toggle

**Reason**: Redundant — replaced by three-mode system (`expanded`/`collapsed`/`expand-on-hover`). Already removed in previous iteration.
