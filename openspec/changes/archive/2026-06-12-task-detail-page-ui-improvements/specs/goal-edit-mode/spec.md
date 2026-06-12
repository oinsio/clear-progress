# Capability: Goal Edit Mode (delta)

## MODIFIED Requirements

### Requirement: Goal Details tab icon

Goal Details tab button SHALL display the `AlignLeft` icon. When the tab is **active**, the icon SHALL be followed by the translated "Details" label text. When the tab is **inactive**, only the icon SHALL be shown without label text. Implements FR5 of task-detail-page-ui-improvements.

#### Scenario: Active details tab shows icon and label

- **WHEN** the Details tab is active in goal edit mode
- **THEN** the tab button displays the AlignLeft icon and the translated "Details" label

#### Scenario: Inactive details tab shows only icon

- **WHEN** the Details tab is inactive in goal edit mode
- **THEN** the tab button displays only the AlignLeft icon without label text

### Requirement: Goal Attachments tab icon

Goal Attachments tab button SHALL display the `Paperclip` icon. When the tab is **active**, the icon SHALL be followed by the translated "Attachments" label text and count badge (if > 0). When the tab is **inactive**, only the icon and count badge (if > 0) SHALL be shown. Implements FR4, FR5 of task-detail-page-ui-improvements.

#### Scenario: Active attachments tab shows icon and label

- **WHEN** the Attachments tab is active in goal edit mode
- **THEN** the tab button displays the Paperclip icon and the translated "Attachments" label

#### Scenario: Inactive attachments tab with files shows icon and count

- **WHEN** the Attachments tab is inactive in goal edit mode
- **AND** the goal has 3 attachments
- **THEN** the tab button displays only the Paperclip icon and "3" badge
