# Capability: Sidebar Hover Expand

## Purpose

Defines the hover-to-expand behavior for the sidebar in hover-ready state. The sidebar expands as an overlay on mouse hover with debounce delays, and collapses when the mouse leaves.

## Requirements

### Requirement: Hover expands sidebar as overlay

In hover-ready state, hovering the mouse over the collapsed sidebar SHALL expand it as an overlay (positioned over content, not pushing it) after a debounce delay of `SIDEBAR_HOVER_OPEN_DELAY_MS` (~250ms). The overlay SHALL have higher z-index than main content but no backdrop. Implements FR5, NFR-R3 of improve-sidebar-ux.

#### Scenario: Hover expands sidebar after debounce
- **WHEN** effective state is `hover-ready`
- **AND** user moves mouse over the collapsed sidebar
- **AND** mouse stays over sidebar for >= 250ms
- **THEN** sidebar expands as overlay showing icons and labels

#### Scenario: Brief hover does not expand
- **WHEN** effective state is `hover-ready`
- **AND** user moves mouse over the collapsed sidebar
- **AND** mouse leaves before 250ms
- **THEN** sidebar remains collapsed (no expansion)

#### Scenario: Hover-expanded sidebar does not push content
- **WHEN** sidebar is hover-expanded
- **THEN** sidebar renders as overlay (absolute/fixed positioning)
- **AND** main content position does not shift

### Requirement: Mouse leave collapses hover-expanded sidebar

Moving the mouse out of the hover-expanded sidebar SHALL collapse it after a debounce delay of `SIDEBAR_HOVER_CLOSE_DELAY_MS` (~150ms). The shorter close delay allows brief overshoot without collapsing. Implements FR5 of improve-sidebar-ux.

#### Scenario: Mouse leave collapses after debounce
- **WHEN** sidebar is hover-expanded
- **AND** user moves mouse out of the sidebar
- **AND** mouse stays outside for >= 150ms
- **THEN** sidebar collapses back to icons only

#### Scenario: Brief mouse leave does not collapse
- **WHEN** sidebar is hover-expanded
- **AND** user moves mouse briefly outside the sidebar
- **AND** mouse returns within 150ms
- **THEN** sidebar remains expanded

### Requirement: Navigation click in hover-expanded mode does not collapse

In hover-expanded state, clicking a navigation item SHALL navigate to the selected route WITHOUT collapsing the sidebar. The sidebar stays expanded as long as the cursor remains inside. Implements FR6 of improve-sidebar-ux.

#### Scenario: Nav click in hover-expanded keeps sidebar open
- **WHEN** sidebar is hover-expanded
- **AND** user clicks the "Goals" navigation item
- **THEN** app navigates to the goals route
- **AND** sidebar remains hover-expanded

#### Scenario: Sidebar collapses only when mouse leaves after nav click
- **WHEN** sidebar is hover-expanded
- **AND** user clicks a navigation item
- **AND** then moves mouse out of sidebar
- **AND** mouse stays outside for >= 150ms
- **THEN** sidebar collapses

### Requirement: Hover expand only when hover capability is available

Hover expand behavior SHALL only be active when `@media (hover: hover)` matches (hover capability available). On devices without hover capability, hover-ready state falls back to collapsed (handled by state matrix). Implements NFR-R3 of improve-sidebar-ux.

#### Scenario: Hover expand active with mouse
- **WHEN** `@media (hover: hover)` matches
- **AND** effective state is `hover-ready`
- **THEN** hover expand listeners are attached

#### Scenario: Hover expand inactive without mouse
- **WHEN** `@media (hover: hover)` does NOT match
- **THEN** no hover expand listeners are attached
- **AND** state matrix resolves to `collapsed` instead of `hover-ready`
