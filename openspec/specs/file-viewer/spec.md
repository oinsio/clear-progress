# Capability: File Viewer

## Purpose

Lightbox-based file preview for attached images, PDFs, and text files with accessibility (focus trap) and keyboard navigation.

## Requirements

### Requirement: Image preview in lightbox

The system SHALL display attached images in a full-screen lightbox modal using an `<img>` tag with a blob URL. The lightbox SHALL show a dimmed backdrop, center the image scaled to fit the viewport, and provide a close button. Implements FR9 of add-file-attachments.

#### Scenario: Open image attachment in lightbox

- **WHEN** user clicks on an attached image (MIME type image/*)
- **THEN** a lightbox modal opens with the full-size image centered on a dimmed backdrop

#### Scenario: Close lightbox via close button

- **GIVEN** the file lightbox is open
- **WHEN** user clicks the X close button
- **THEN** the lightbox closes and focus returns to the attachment list item

#### Scenario: Close lightbox via backdrop click

- **GIVEN** the file lightbox is open
- **WHEN** user clicks the dimmed backdrop outside the content
- **THEN** the lightbox closes

#### Scenario: Close lightbox via Escape key

- **GIVEN** the file lightbox is open
- **WHEN** user presses Escape
- **THEN** the lightbox closes and focus returns to the attachment list item

### Requirement: PDF preview in lightbox

The system SHALL display attached PDFs in the lightbox using react-pdf (canvas-based rendering via pdf.js). PDF pages are rendered onto `<canvas>` elements — no browser PDF plugin or iframe is used. The pdf.js worker SHALL be lazy-loaded only when a PDF is opened. Implements FR10 of add-file-attachments.

#### Scenario: Open PDF attachment in lightbox

- **WHEN** user clicks on an attached PDF file
- **THEN** a lightbox modal opens with the PDF pages rendered on canvas

#### Scenario: PDF is rendered securely via canvas

- **WHEN** a PDF is displayed in the lightbox
- **THEN** the PDF content is rendered on `<canvas>` elements (no script execution from PDF content)

#### Scenario: Multipage PDF navigation

- **WHEN** a multipage PDF is displayed in the lightbox
- **THEN** all pages are rendered and the content area is scrollable

#### Scenario: PDF is viewable on mobile

- **WHEN** a PDF is displayed on a mobile viewport
- **THEN** pages are scaled to fit the viewport width and the content is scrollable vertically

### Requirement: Text preview in lightbox

The system SHALL display attached text files in the lightbox using a `<pre>` block with the file content read via `Blob.text()`. The text SHALL be displayed with monospace font and horizontal scroll for long lines. Implements FR11 of add-file-attachments.

#### Scenario: Open text attachment in lightbox

- **WHEN** user clicks on an attached text file
- **THEN** a lightbox modal opens with the file content in a monospace `<pre>` block

#### Scenario: Long lines are horizontally scrollable

- **WHEN** text file contains lines longer than viewport width
- **THEN** the `<pre>` block is horizontally scrollable

### Requirement: Focus trap in lightbox

The file lightbox SHALL trap keyboard focus. Tab SHALL cycle only between interactive elements within the lightbox. Focus SHALL move to the close button on open and return to the trigger element on close. Implements NFR-A1 of add-file-attachments.

#### Scenario: Tab does not escape lightbox

- **GIVEN** the file lightbox is open
- **WHEN** user presses Tab repeatedly
- **THEN** focus stays within the lightbox elements

#### Scenario: Focus returns to trigger on close

- **GIVEN** the file lightbox was opened by clicking attachment A1
- **WHEN** user closes the lightbox
- **THEN** focus returns to the A1 list item
