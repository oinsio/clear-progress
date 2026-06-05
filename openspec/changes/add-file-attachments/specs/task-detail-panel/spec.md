## ADDED Requirements

### Requirement: Attachments tab in task detail panel

The task detail panel SHALL have three tab buttons: Details, Checklist, Attachments. The Attachments tab SHALL show the attachment list for the current task with an attach file button. Tab switching SHALL follow the existing pill button pattern. Implements UX1 of add-file-attachments.

#### Scenario: Three tabs visible in task detail panel

- **WHEN** user opens the task detail panel
- **THEN** three tab buttons are visible: Details, Checklist, Attachments

#### Scenario: Switch to Attachments tab

- **WHEN** user clicks the Attachments tab button
- **THEN** the attachments list for the current task is displayed
- **AND** the Details and Checklist content is hidden

#### Scenario: Attachment count shown in tab label

- **GIVEN** task has 3 active attachments
- **WHEN** user views the task detail panel
- **THEN** the Attachments tab label shows the count (e.g., "Attachments (3)")

#### Scenario: Empty attachments tab

- **GIVEN** task has no attachments
- **WHEN** user switches to the Attachments tab
- **THEN** an empty state message is shown with an attach file button

### Requirement: TaskDetailPanel refactoring

TaskDetailPanel.tsx SHALL be split into smaller components before adding the Attachments tab: TaskDetailPanel (orchestrator), TaskDetailsTab, TaskChecklistTab, TaskAttachmentsTab. Each component SHALL be under 300 lines. Implements process invariant (file size limit).

#### Scenario: Panel orchestrator delegates to tab components

- **WHEN** user switches between tabs
- **THEN** the orchestrator renders the appropriate tab component
- **AND** each tab component is a separate file under 300 lines
