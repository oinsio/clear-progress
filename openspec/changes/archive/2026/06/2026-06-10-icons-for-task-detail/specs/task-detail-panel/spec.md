## ADDED Requirements

### Requirement: DrillDownRow icon support

DrillDownRow SHALL accept an optional `icon` prop of type LucideIcon. When provided, the icon SHALL be rendered to the left of the label text with `w-4 h-4` size and `text-gray-500` color. The icon SHALL have `aria-hidden="true"` since it is decorative. Implements FR1 of icons-for-task-detail.

#### Scenario: DrillDownRow renders icon when provided

- **WHEN** DrillDownRow is rendered with an icon prop
- **THEN** the icon is displayed to the left of the label text
- **AND** the icon has `aria-hidden="true"` attribute

#### Scenario: DrillDownRow renders without icon when not provided

- **WHEN** DrillDownRow is rendered without an icon prop
- **THEN** only the label text is displayed (no icon space reserved)

### Requirement: Goal field icon

Goal DrillDownRow SHALL display the `Target` icon. Implements FR2 of icons-for-task-detail.

#### Scenario: Goal field shows Target icon

- **WHEN** task detail panel is open with goals available
- **THEN** the Goal DrillDownRow displays the Target icon

### Requirement: Context field icon

Context DrillDownRow SHALL display the `MapPin` icon. Implements FR3 of icons-for-task-detail.

#### Scenario: Context field shows MapPin icon

- **WHEN** task detail panel is open with contexts available
- **THEN** the Context DrillDownRow displays the MapPin icon

### Requirement: Category field icon

Category DrillDownRow SHALL display the `Tag` icon. Implements FR4 of icons-for-task-detail.

#### Scenario: Category field shows Tag icon

- **WHEN** task detail panel is open with categories available
- **THEN** the Category DrillDownRow displays the Tag icon

### Requirement: Repeat field icon

Repeat DrillDownRow SHALL display the `Repeat` icon. Implements FR5 of icons-for-task-detail.

#### Scenario: Repeat field shows Repeat icon

- **WHEN** task detail panel is open
- **THEN** the Repeat DrillDownRow displays the Repeat icon

### Requirement: Hide until field icon

Hide until DrillDownRow SHALL display the `EyeOff` icon. Implements FR6 of icons-for-task-detail.

#### Scenario: Hide until field shows EyeOff icon

- **WHEN** task detail panel is open and task has no repeat rule
- **THEN** the Hide until DrillDownRow displays the EyeOff icon

### Requirement: Description field icon

Description field label SHALL display the `FileText` icon to the left of the label text with `w-4 h-4` size. Implements FR7 of icons-for-task-detail.

#### Scenario: Description label shows FileText icon

- **WHEN** task detail panel Details tab is open
- **THEN** the Description label displays the FileText icon to the left of the text

### Requirement: Duplicate button icon

Duplicate task button SHALL display the `Copy` icon to the left of the button text. Implements FR8 of icons-for-task-detail.

#### Scenario: Duplicate button shows Copy icon

- **WHEN** task detail panel Details tab is open
- **THEN** the Duplicate button displays the Copy icon to the left of the text

### Requirement: Tab button icons

Details tab button SHALL display `AlignLeft` icon, Checklist tab button SHALL display `ListChecks` icon, Attachments tab button SHALL display `Paperclip` icon. All icons SHALL be to the left of the tab text with `w-4 h-4` size. Implements FR9, FR10, FR11 of icons-for-task-detail.

#### Scenario: Details tab shows AlignLeft icon

- **WHEN** task detail panel is open
- **THEN** the Details tab button displays the AlignLeft icon

#### Scenario: Checklist tab shows ListChecks icon

- **WHEN** task detail panel is open
- **THEN** the Checklist tab button displays the ListChecks icon

#### Scenario: Attachments tab shows Paperclip icon

- **WHEN** task detail panel is open
- **THEN** the Attachments tab button displays the Paperclip icon
