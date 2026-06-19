## Purpose

Defines the accordion-based grouping of settings into collapsible sections on the Settings page, including section contents, ordering, persistence, accessibility, sync indicators, and responsive layout.

## Requirements

### Requirement: Settings grouped into accordion sections

The settings page SHALL display settings organized into 4 collapsible accordion sections. Each section SHALL have a header with an icon, a translatable title, and a chevron indicator showing expand/collapse state.

#### Scenario: All four sections are rendered
- **WHEN** the settings page is displayed
- **THEN** four accordion sections are visible: "Look & Feel", "Workspace", "Tasks", "Account & Sync"

#### Scenario: Section headers show icons
- **WHEN** the settings page is displayed
- **THEN** each section header displays its corresponding icon (palette, monitor, clipboard, link)

#### Scenario: Section headers show chevron
- **WHEN** a section is collapsed
- **THEN** its header shows a right-pointing chevron
- **WHEN** a section is expanded
- **THEN** its header shows a down-pointing chevron

### Requirement: Look & Feel section contents

The Look & Feel section SHALL contain Theme, Accent color, Interface scale, and Language settings in this order.

#### Scenario: Look & Feel section displays all settings
- **WHEN** the Look & Feel section is expanded
- **THEN** it displays Theme, Accent color, Interface scale, and Language settings

#### Scenario: Look & Feel settings order
- **WHEN** the Look & Feel section is expanded
- **THEN** Theme appears first, followed by Accent color, Interface scale, and Language

### Requirement: Workspace section contents

The Workspace section SHALL contain Panel side, Always expanded, Pin detail panel, Handedness, Filter position, and Menu items settings in this order. A visual separator SHALL appear before Menu items.

#### Scenario: Workspace section displays all settings
- **WHEN** the Workspace section is expanded
- **THEN** it displays Panel side, Always expanded, Pin detail panel, Handedness, Filter position, and Menu items

#### Scenario: Menu items separated from other settings
- **WHEN** the Workspace section is expanded
- **THEN** a visual divider appears between Filter position and Menu items

### Requirement: Tasks section contents

The Tasks section SHALL contain Default box, Day start time, Focus mode, and Focus strength settings in this order. A visual separator SHALL appear between Day start time and Focus mode.

#### Scenario: Tasks section displays all settings
- **WHEN** the Tasks section is expanded
- **THEN** it displays Default box, Day start time, Focus mode, and Focus strength

#### Scenario: Focus settings separated from task settings
- **WHEN** the Tasks section is expanded
- **THEN** a visual divider appears between Day start time and Focus mode

### Requirement: Account & Sync section contents

The Account & Sync section SHALL contain the server connection UI (existing ServerSection component).

#### Scenario: Account & Sync section displays server connection
- **WHEN** the Account & Sync section is expanded
- **THEN** it displays the server connection interface

### Requirement: Default expanded section

The first section (Look & Feel) SHALL be expanded by default when no accordion state is persisted.

#### Scenario: First visit shows Look & Feel expanded
- **WHEN** the user opens settings for the first time (no persisted state)
- **THEN** the Look & Feel section is expanded
- **AND** the other three sections are collapsed

#### Scenario: All sections collapsed falls back to default
- **WHEN** all accordion sections are collapsed in persisted state
- **THEN** the Look & Feel section is expanded as default

### Requirement: Accordion state persistence

The accordion expand/collapse state SHALL be persisted in localStorage. When the user returns to the settings page, the previously expanded section SHALL remain expanded.

#### Scenario: Expanded section persists across navigation
- **WHEN** the user expands the Workspace section and navigates away
- **AND** the user returns to the settings page
- **THEN** the Workspace section is expanded

#### Scenario: Collapsed state persists
- **WHEN** the user collapses all sections (triggering default) and then expands Tasks
- **AND** the user navigates away and returns
- **THEN** the Tasks section is expanded

### Requirement: Single-expand accordion behavior

Only one accordion section SHALL be expanded at a time. Expanding a section SHALL collapse the previously expanded section.

#### Scenario: Expanding one section collapses the other
- **WHEN** the Look & Feel section is expanded
- **AND** the user clicks on the Workspace section header
- **THEN** the Workspace section expands
- **AND** the Look & Feel section collapses

#### Scenario: Clicking expanded section collapses it
- **WHEN** the Workspace section is expanded
- **AND** the user clicks on the Workspace section header
- **THEN** the Workspace section collapses
- **AND** the Look & Feel section expands as default fallback

### Requirement: Sync indicator on synced settings

A cloud icon SHALL be displayed next to the label of settings that synchronize with the server: accent_color, custom accent colors, default_box, and day_boundary. The icon SHALL have an accessible label.

#### Scenario: Synced settings show cloud icon
- **WHEN** the settings page is displayed
- **THEN** Accent color, Default box, and Day start time labels show a cloud icon

#### Scenario: Local-only settings have no cloud icon
- **WHEN** the settings page is displayed
- **THEN** Theme, Interface scale, Language, Panel side, and other local settings do NOT show a cloud icon

#### Scenario: Cloud icon has accessible label
- **WHEN** a cloud icon is rendered next to a synced setting
- **THEN** it has an aria-label explaining it syncs across devices

### Requirement: Sync legend at page bottom

A legend explaining the cloud icon meaning SHALL be displayed at the bottom of the settings page, below all sections and the share banner.

#### Scenario: Legend is visible
- **WHEN** the settings page is displayed
- **THEN** a legend with the cloud icon and text "syncs across devices" is visible at the bottom

### Requirement: Share banner outside accordion

The ShareAppSection SHALL be rendered as a standalone banner below all accordion sections, not inside any section.

#### Scenario: Share banner appears below accordion sections
- **WHEN** the settings page is displayed
- **THEN** the share banner appears after the last accordion section
- **AND** it is not inside any accordion section

### Requirement: Accordion accessibility

Accordion section headers SHALL use appropriate ARIA attributes: `role="button"`, `aria-expanded`, and `aria-controls` referencing the content panel. Section headers SHALL be activatable via Enter and Space keys.

#### Scenario: Aria-expanded reflects section state
- **WHEN** a section is expanded
- **THEN** its header has `aria-expanded="true"`
- **WHEN** a section is collapsed
- **THEN** its header has `aria-expanded="false"`

#### Scenario: Keyboard toggle with Enter
- **WHEN** focus is on a collapsed section header
- **AND** the user presses Enter
- **THEN** the section expands

#### Scenario: Keyboard toggle with Space
- **WHEN** focus is on a collapsed section header
- **AND** the user presses Space
- **THEN** the section expands

### Requirement: Accordion responsive layout

The accordion layout SHALL render correctly on all supported viewports from 375px to 2560px width. Section content SHALL not overflow horizontally.

#### Scenario: Accordion on mobile viewport
- **WHEN** viewport width is 375px
- **THEN** all accordion sections render without horizontal overflow

#### Scenario: Accordion on desktop viewport
- **WHEN** viewport width is 1440px
- **THEN** all accordion sections render with appropriate width constraints
