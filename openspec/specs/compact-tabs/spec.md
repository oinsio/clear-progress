# Capability: Compact Tabs

## Purpose

Responsive tab switcher rendering where the active tab shows icon+label at full width and inactive tabs collapse to icon+optional count badge, saving horizontal space on narrow screens.

## Requirements

### Requirement: Active tab renders with icon and label

The active tab button SHALL render with the tab icon and translated label text. The active tab SHALL use `flex-1` to fill available horizontal space. Implements FR1 of task-detail-page-ui-improvements.

#### Scenario: Active details tab shows icon and label

- **WHEN** the Details tab is active
- **THEN** the tab button displays the AlignLeft icon and the translated "Details" label text
- **AND** the tab button has `flex-1` width

#### Scenario: Active checklist tab shows icon and label with progress

- **WHEN** the Checklist tab is active
- **THEN** the tab button displays the ListChecks icon and the translated checklist label with progress

#### Scenario: Active attachments tab shows icon and label with count

- **WHEN** the Attachments tab is active
- **THEN** the tab button displays the Paperclip icon, the translated "Attachments" label, and count if > 0

### Requirement: Inactive tab renders with icon only

An inactive tab button SHALL render with only the tab icon and no label text. The inactive tab SHALL NOT use `flex-1` — it SHALL use auto width with horizontal padding. Implements FR2 of task-detail-page-ui-improvements.

#### Scenario: Inactive details tab shows only icon

- **WHEN** the Details tab is inactive
- **THEN** the tab button displays only the AlignLeft icon without label text
- **AND** the tab button does not stretch to fill available space

### Requirement: Inactive checklist tab shows progress badge

When the checklist has items (total > 0), the inactive checklist tab SHALL display a progress badge showing "completed/total" next to the icon. When the checklist is empty (total = 0), no badge SHALL be shown. Implements FR3 of task-detail-page-ui-improvements.

#### Scenario: Inactive checklist tab with items shows badge

- **WHEN** the Checklist tab is inactive
- **AND** the checklist has 3 completed out of 9 total items
- **THEN** the tab button displays the ListChecks icon and "3/9" badge

#### Scenario: Inactive checklist tab with no items shows only icon

- **WHEN** the Checklist tab is inactive
- **AND** the checklist has 0 total items
- **THEN** the tab button displays only the ListChecks icon without a badge

### Requirement: Attachments tab shows count badge in both states

When attachments exist (count > 0), the attachments tab SHALL display a count badge next to the icon in both active and inactive states. When no attachments exist, no badge SHALL be shown. Implements FR4 of task-detail-page-ui-improvements.

#### Scenario: Inactive attachments tab with files shows count

- **WHEN** the Attachments tab is inactive
- **AND** there are 2 attachments
- **THEN** the tab button displays the Paperclip icon and "2" badge

#### Scenario: Active attachments tab with files shows count

- **WHEN** the Attachments tab is active
- **AND** there are 2 attachments
- **THEN** the tab button displays the Paperclip icon, the "Attachments" label, and "2" badge

#### Scenario: Inactive attachments tab with no files shows only icon

- **WHEN** the Attachments tab is inactive
- **AND** there are 0 attachments
- **THEN** the tab button displays only the Paperclip icon without a badge

### Requirement: Compact tabs do not overflow on narrow screens

The tab switcher with compact rendering SHALL NOT overflow or wrap on viewports as narrow as 320px. Implements NFR-R1 of task-detail-page-ui-improvements.

#### Scenario: Tabs fit within 320px viewport

- **WHEN** the viewport width is 320px
- **AND** the Details tab is active
- **THEN** all three tab buttons are visible within the container without horizontal overflow or line wrapping
