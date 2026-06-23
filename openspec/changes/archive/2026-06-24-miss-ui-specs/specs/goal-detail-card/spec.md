## ADDED Requirements

### Requirement: GoalCoverPicker provides cover selection and removal UI

GoalCoverPicker SHALL render a circular button (48x48) that displays either a preview image (when `previewSrc` is provided) or a default SVG placeholder. Clicking the button SHALL open the browser file picker filtered to `image/*`. When a file is selected, the `onFileSelect` callback SHALL be called with the selected `File` object. The file input SHALL be reset after each selection to allow re-selecting the same file. When `previewSrc` is provided, a remove button (X icon) SHALL appear positioned at the top-right corner of the circle. Clicking the remove button SHALL call the `onRemove` callback. The picker button SHALL have `aria-label` for accessibility. The default SVG placeholder SHALL have `aria-hidden="true"`. Implements FR4, FR5, FR6, FR7, FR8, NFR-A2, UX2, UX3 of miss-ui-specs.

#### Scenario: Default cover shown when no preview

- **WHEN** GoalCoverPicker is rendered with `previewSrc` as null
- **THEN** the default SVG placeholder is displayed
- **AND** no remove button is visible

#### Scenario: Preview image shown when previewSrc provided

- **WHEN** GoalCoverPicker is rendered with a `previewSrc` URL
- **THEN** the preview image is displayed with the provided URL
- **AND** the remove button is visible

#### Scenario: File picker opens on button click

- **WHEN** user clicks the cover picker button
- **THEN** the hidden file input is triggered (click event)

#### Scenario: File selection triggers callback

- **WHEN** user selects an image file via the file picker
- **THEN** `onFileSelect` is called with the selected File object

#### Scenario: No callback when no file selected

- **WHEN** file picker is opened but no file is selected
- **THEN** `onFileSelect` is not called

#### Scenario: Input reset after file selection

- **WHEN** user selects a file
- **THEN** the file input value is reset to empty string
- **AND** selecting the same file again triggers `onFileSelect`

#### Scenario: Remove button calls onRemove

- **WHEN** user clicks the remove button
- **THEN** `onRemove` callback is called

#### Scenario: Accessibility attributes are correct

- **WHEN** GoalCoverPicker is rendered
- **THEN** the picker button has an `aria-label`
- **AND** the default SVG has `aria-hidden="true"`
- **AND** the remove button (when visible) has an `aria-label`
