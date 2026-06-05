## ADDED Requirements

### Requirement: Goal edit mode with tabs

Goal edit mode SHALL show cover + name at top (always visible), then two tab buttons: Details, Attachments. The Details tab SHALL contain the description field and status selector. The Attachments tab SHALL show the attachment list with an attach file button. Footer buttons (Delete, Cancel, Save) SHALL remain visible at the bottom regardless of active tab. Implements UX2 of add-file-attachments.

#### Scenario: Two tabs visible in goal edit mode

- **WHEN** user enters goal edit mode
- **THEN** cover circle and name are visible at top
- **AND** two tab buttons are visible: Details, Attachments
- **AND** footer buttons (Delete, Cancel, Save) are visible at bottom

#### Scenario: Details tab shows description and status

- **WHEN** user is on the Details tab in goal edit mode
- **THEN** the description field and status selector are displayed

#### Scenario: Attachments tab shows attachment list

- **WHEN** user clicks the Attachments tab in goal edit mode
- **THEN** the attachment list for the current goal is displayed with an attach file button

#### Scenario: Cover and name remain visible across tabs

- **WHEN** user switches between Details and Attachments tabs
- **THEN** the cover circle and name textarea remain visible at top

#### Scenario: Footer buttons remain visible across tabs

- **WHEN** user switches between Details and Attachments tabs
- **THEN** Delete, Cancel, and Save buttons remain visible at bottom

### Requirement: Unified collapsible details section in view mode

Goal view mode SHALL use a single chevron to collapse/expand the description and attachments together. When collapsed, the description SHALL be truncated to 2 lines (existing `line-clamp-2` behavior) and the attachment list SHALL be hidden. When expanded, the full description and the attachment list (below the description) SHALL both be visible. The section SHALL be collapsed by default. The chevron SHALL appear when the description overflows OR when the goal has attachments. Implements UX3 of add-file-attachments.

#### Scenario: Details section collapsed by default with long description and attachments

- **GIVEN** a goal with a long description and 3 attachments
- **WHEN** user views the goal detail card
- **THEN** the description is truncated to 2 lines
- **AND** the attachment list is hidden
- **AND** a collapse chevron is visible

#### Scenario: Expand details section shows full description and attachments

- **GIVEN** the details section is collapsed
- **WHEN** user clicks the chevron
- **THEN** the full description text is shown
- **AND** the attachment list is shown below the description

#### Scenario: Collapse details section hides attachments and truncates description

- **GIVEN** the details section is expanded
- **WHEN** user clicks the chevron
- **THEN** the description is truncated to 2 lines
- **AND** the attachment list is hidden

#### Scenario: Chevron visible when only attachments exist (short description)

- **GIVEN** a goal with a short description (fits in 2 lines) and 2 attachments
- **WHEN** user views the goal detail card
- **THEN** the chevron is visible (because attachments exist)
- **AND** the attachment list is hidden until expanded

#### Scenario: Chevron visible when only description overflows (no attachments)

- **GIVEN** a goal with a long description and no attachments
- **WHEN** user views the goal detail card
- **THEN** the chevron is visible (because description overflows)
- **AND** expanding shows only the full description

#### Scenario: No chevron when short description and no attachments

- **GIVEN** a goal with a short description and no attachments
- **WHEN** user views the goal detail card
- **THEN** no chevron is rendered

#### Scenario: Preview attachment from expanded details

- **GIVEN** the details section is expanded showing attachments
- **WHEN** user clicks on an attachment item
- **THEN** the file lightbox opens for preview

#### Scenario: Download attachment from expanded details

- **GIVEN** the details section is expanded showing attachments
- **WHEN** user clicks the download button on an attachment
- **THEN** a confirmation dialog is shown before downloading
