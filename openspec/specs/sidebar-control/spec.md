# Capability: Sidebar Control

## Purpose

Defines the sidebar control popover that allows users to switch between three sidebar modes (expanded, collapsed, expand on hover), with matching settings page integration and accessibility.

## Requirements

### Requirement: Sidebar control popover with three modes

A sidebar control icon button SHALL render in the bottom area of the sidebar (above search, above the divider line). Clicking it SHALL open a popover with three options: Expanded, Collapsed, Expand on hover. The active mode SHALL be visually indicated with a radio-style selection indicator. Clicking an option SHALL change `sidebarMode` in localStorage via `useSidebarMode`. Implements FR2 of improve-sidebar-ux.

#### Scenario: Popover opens on icon click
- **WHEN** user clicks the sidebar control icon
- **THEN** a popover appears with three options: Expanded, Collapsed, Expand on hover

#### Scenario: Active mode is visually indicated
- **WHEN** sidebar mode is `"collapsed"`
- **AND** popover is open
- **THEN** the "Collapsed" option is visually marked as active

#### Scenario: Clicking option changes mode
- **WHEN** popover is open
- **AND** user clicks "Expand on hover"
- **THEN** `sidebarMode` in localStorage is set to `"expand-on-hover"`
- **AND** sidebar state updates according to the state matrix

#### Scenario: Popover closes after mode selection
- **WHEN** user selects a mode in the popover
- **THEN** the popover closes

### Requirement: Sidebar control icon matches sidebar side

The sidebar control icon SHALL be `PanelLeft` when sidebar is on the left side, `PanelRight` when sidebar is on the right side. Implements FR2 of improve-sidebar-ux.

#### Scenario: PanelLeft icon for left-side sidebar
- **WHEN** sidebar side is "left"
- **THEN** the control icon is `PanelLeft`

#### Scenario: PanelRight icon for right-side sidebar
- **WHEN** sidebar side is "right"
- **THEN** the control icon is `PanelRight`

### Requirement: Sidebar control hidden on narrow screen without hover

The sidebar control popover trigger SHALL NOT render when screen is narrow and hover capability is not available (`isNarrow && !hasHover`). The sidebar mode setting does not apply in mobile mode — state matrix handles it automatically. Implements FR18 of improve-sidebar-ux.

#### Scenario: Control icon hidden on mobile
- **WHEN** screen is narrow and hover is not available
- **THEN** the sidebar control icon is NOT rendered

#### Scenario: Control icon visible on wide screen
- **WHEN** screen is wide
- **THEN** the sidebar control icon is rendered

#### Scenario: Control icon visible on narrow screen with hover
- **WHEN** screen is narrow and hover IS available
- **THEN** the sidebar control icon is rendered

### Requirement: Same sidebar control in Settings page

The same three-mode sidebar setting SHALL be available on the Settings page in the "Workspace" section. Both the sidebar popover and settings page SHALL read/write the same `SIDEBAR_MODE` localStorage key via `useSidebarMode`, ensuring they are always in sync. Implements FR3 of improve-sidebar-ux.

#### Scenario: Settings page shows sidebar mode selector
- **WHEN** user opens Settings page "Workspace" section
- **THEN** a sidebar mode selector is visible with three options

#### Scenario: Changing mode in settings updates sidebar
- **WHEN** user changes sidebar mode to "Collapsed" in settings
- **THEN** sidebar immediately reflects collapsed state

#### Scenario: Sidebar popover and settings are in sync
- **WHEN** user changes sidebar mode via popover to "Expand on hover"
- **AND** user opens Settings page
- **THEN** "Expand on hover" is shown as active in settings

### Requirement: Sidebar control is accessible

The sidebar control button SHALL have `aria-label` (localized), `role="button"`, and be keyboard accessible (Enter/Space to open). The popover SHALL be keyboard navigable: arrow keys to move between options, Enter to select, Escape to close. Implements NFR-A1, NFR-A2 of improve-sidebar-ux.

#### Scenario: Control button has aria-label
- **WHEN** sidebar control button is rendered
- **THEN** it has `aria-label` with localized text (e.g., "Sidebar settings")

#### Scenario: Popover navigable with arrow keys
- **WHEN** popover is open
- **AND** user presses arrow down
- **THEN** focus moves to the next option

#### Scenario: Enter selects option in popover
- **WHEN** focus is on "Expanded" option
- **AND** user presses Enter
- **THEN** sidebar mode changes to `"expanded"`
- **AND** popover closes

#### Scenario: Escape closes popover
- **WHEN** popover is open
- **AND** user presses Escape
- **THEN** popover closes
- **AND** focus returns to the control button
