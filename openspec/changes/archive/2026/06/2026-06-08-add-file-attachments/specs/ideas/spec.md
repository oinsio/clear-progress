## ADDED Requirements

### Requirement: Attachments section in idea detail panel

The idea detail panel SHALL show an attachments section below the description field. The section SHALL contain an attachment list and an attached file button. Users SHALL be able to attach, preview, download, and delete files from this section. Implements UX4 of add-file-attachments.

#### Scenario: Attachments section visible in idea detail panel

- **WHEN** user opens the idea detail panel
- **THEN** an attachments section is visible below the description field
- **AND** an attached file button is available

#### Scenario: Attach file to idea

- **WHEN** user clicks the attached file button in the idea detail panel
- **THEN** a native file picker opens filtered to allowed MIME types
- **AND** on file selection, the file is validated and attached to the idea

#### Scenario: View attachment list for idea

- **GIVEN** idea I1 has 2 attachments
- **WHEN** user opens the idea detail panel for I1
- **THEN** the attachment list shows 2 items with file type icon, filename, size, download and delete buttons

#### Scenario: Preview attachment from idea panel

- **WHEN** user clicks on an attachment item in the idea detail panel
- **THEN** the file lightbox opens for preview

#### Scenario: Empty attachments state

- **GIVEN** idea I1 has no attachments
- **WHEN** user opens the idea detail panel for I1
- **THEN** an empty state message is shown with an attached file button
