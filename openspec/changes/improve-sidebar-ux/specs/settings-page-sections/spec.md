## MODIFIED Requirements

### Requirement: Accordion allows all sections collapsed

The settings accordion SHALL allow all sections to be collapsed simultaneously. Clicking the currently expanded section SHALL collapse it, resulting in no sections expanded. The accordion state type SHALL be `string | null` where `null` means all collapsed. Retained from previous iteration of improve-sidebar-ux.

#### Scenario: Clicking expanded section collapses it
- **WHEN** the "Workspace" section is expanded
- **AND** user clicks the "Workspace" section header
- **THEN** the "Workspace" section collapses
- **AND** no sections are expanded

#### Scenario: Clicking collapsed section while all collapsed
- **WHEN** no sections are expanded
- **AND** user clicks the "Tasks" section header
- **THEN** the "Tasks" section expands

#### Scenario: Clicking different section still switches
- **WHEN** the "Workspace" section is expanded
- **AND** user clicks the "Tasks" section header
- **THEN** the "Tasks" section expands
- **AND** the "Workspace" section collapses

### Requirement: Settings page opens with all sections collapsed

When the settings page is opened without a deep-link, all accordion sections SHALL be collapsed by default. The persisted accordion state SHALL default to `null` (all collapsed). Retained from previous iteration of improve-sidebar-ux.

#### Scenario: All sections collapsed on initial open
- **WHEN** user navigates to settings page
- **AND** no deep-link section is specified
- **THEN** all accordion sections are collapsed

#### Scenario: Persisted state null means all collapsed
- **WHEN** localStorage accordion state is null or absent
- **THEN** all sections are collapsed on page load

### Requirement: Deep-link opens specific section

The settings accordion SHALL accept an `initialExpandedSection` prop. When provided, the specified section SHALL be expanded on mount, overriding the default all-collapsed state. The deep-link is a one-time effect — subsequent user interactions control the accordion normally. Retained from previous iteration of improve-sidebar-ux.

#### Scenario: Deep-link expands Account & Sync section
- **WHEN** user navigates to settings with `expandSection` state set to "account-sync"
- **THEN** the "Account & Sync" section is expanded on page load

#### Scenario: Deep-link does not prevent normal interaction
- **WHEN** settings opened with deep-link to "account-sync"
- **AND** user clicks the "Account & Sync" header
- **THEN** the section collapses normally

#### Scenario: No deep-link means all collapsed
- **WHEN** user navigates to settings without `expandSection` state
- **THEN** all sections are collapsed
