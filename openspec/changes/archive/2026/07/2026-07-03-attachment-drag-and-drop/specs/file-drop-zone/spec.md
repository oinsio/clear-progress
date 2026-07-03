# Capability: File Drop Zone

## Purpose

Desktop drag-and-drop UI for attaching files to entities. Provides a drop zone overlay, multi-file handling with partial success reporting, and shared file validation utility.

## ADDED Requirements

### Requirement: Drop zone activation on file drag

`FileDropZone` SHALL display a dashed-border overlay when files are dragged over the component. The overlay SHALL only appear when `dataTransfer.types` includes `"Files"` — non-file drags (text, elements) SHALL be ignored. Implements FR1, FR2 of attachment-drag-and-drop.

#### Scenario: Overlay appears on file drag

- **WHEN** user drags files from OS over the drop zone area
- **THEN** a dashed-border overlay with instructional text appears

#### Scenario: Overlay does not appear on non-file drag

- **WHEN** user drags a text selection or HTML element over the drop zone area
- **THEN** no overlay appears

#### Scenario: Overlay disappears on drag leave

- **WHEN** user drags files away from the drop zone area
- **THEN** the overlay disappears

#### Scenario: Overlay disappears after drop

- **WHEN** user drops files onto the drop zone
- **THEN** the overlay disappears and files are processed

### Requirement: Multi-file drop with partial success

`FileDropZone` SHALL accept multiple files in a single drop operation. Each file SHALL be validated individually. Valid files SHALL be attached sequentially. Rejected files SHALL be reported by filename in an error message that auto-dismisses after 5 seconds. Implements FR3, FR6, FR7 of attachment-drag-and-drop.

#### Scenario: All files valid

- **GIVEN** user drops 3 valid PNG files
- **WHEN** all files pass validation
- **THEN** all 3 files are attached to the entity

#### Scenario: Some files rejected

- **GIVEN** user drops 5 files: 3 valid PNGs and 2 invalid ZIPs
- **WHEN** files are validated
- **THEN** 3 PNGs are attached
- **AND** error message shows rejected filenames: "archive1.zip, archive2.zip"

#### Scenario: All files rejected

- **GIVEN** user drops 2 ZIP files
- **WHEN** both files fail validation
- **THEN** no files are attached
- **AND** error message shows both rejected filenames

#### Scenario: Error auto-dismisses

- **GIVEN** an error message is shown for rejected files
- **WHEN** 5 seconds elapse
- **THEN** the error message disappears

### Requirement: Shared file validation utility

A `validateFile` utility function SHALL validate a single file using the same pipeline as `AttachFileButton`: magic bytes detection via `detectMimeType`, MIME allowlist check, and size limit check. The function SHALL return a result indicating success (with the file) or failure (with filename and error key). Implements FR4, FR5 of attachment-drag-and-drop.

#### Scenario: Valid JPEG passes validation

- **WHEN** a 2 MB JPEG file is validated
- **THEN** result indicates valid with the file object

#### Scenario: ZIP file rejected by MIME check

- **WHEN** a ZIP file is validated
- **THEN** result indicates invalid with filename and error key for unsupported type

#### Scenario: Oversized file rejected

- **WHEN** a 6 MB PNG file is validated
- **THEN** result indicates invalid with filename and error key for size limit

#### Scenario: Unrecognized binary format rejected

- **WHEN** a file with unknown magic bytes and non-text browser type is validated
- **THEN** result indicates invalid with filename and error key for unrecognized format

### Requirement: Hidden on touch devices

`FileDropZone` SHALL NOT render on touch-only devices. Visibility SHALL be controlled via CSS `@media (pointer: fine)` to avoid rendering the drop zone where it cannot be used. Implements FR8 of attachment-drag-and-drop.

#### Scenario: Drop zone visible on desktop

- **WHEN** device has a fine pointer (mouse)
- **THEN** drop zone is rendered and functional

#### Scenario: Drop zone hidden on touch device

- **WHEN** device has only coarse pointer (touch)
- **THEN** drop zone is not rendered

### Requirement: Drop zone accessibility

Drop zone overlay SHALL have sufficient color contrast (WCAG 2.1 AA) and include descriptive text. Error messages for rejected files SHALL use `role="alert"` for screen reader announcement. Implements NFR-A1 of attachment-drag-and-drop.

#### Scenario: Overlay has accessible text

- **WHEN** the drop zone overlay is visible
- **THEN** it contains text describing the action (e.g., "Drop files here")

#### Scenario: Rejection error announced to screen reader

- **WHEN** files are rejected after a drop
- **THEN** the error message element has `role="alert"`

### Requirement: Coexistence with attach button

The drop zone SHALL coexist with the existing `AttachFileButton`. Both methods of attaching files SHALL remain available. Implements UX5 of attachment-drag-and-drop.

#### Scenario: Attach button still works alongside drop zone

- **GIVEN** the drop zone is active
- **WHEN** user clicks the attachment button
- **THEN** file picker opens normally
