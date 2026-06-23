# Capability: Goal Detail Card

## Purpose

Goal detail card component for displaying and editing goal information. Provides view mode with cover lightbox, collapsible description, and recomposed three-row layout, plus edit mode for modifying goal properties.

## Requirements

### Requirement: Cover lightbox in view mode

When viewing a goal that has a real cover image (non-empty `cover_hash`), the user SHALL be able to click the cover circle to open a lightbox overlay displaying the full-size image. The lightbox SHALL render a dimmed backdrop with the image centered and scaled to fit the viewport. The user SHALL be able to close the lightbox by clicking the close (X) button, clicking the backdrop outside the image, or pressing Escape. The cover circle SHALL show a hover cue (subtle scale) when a real cover exists. When the goal has no cover (default SVG), the circle SHALL NOT be clickable and SHALL NOT show hover cue. Implements FR1, FR2, UX1, UX2 of goal-detail-card-refactor.

#### Scenario: Open lightbox for goal with cover

- **GIVEN** a goal with a non-empty cover_hash
- **WHEN** user clicks the cover circle
- **THEN** a lightbox overlay opens with the full-size cover image centered on a dimmed backdrop

#### Scenario: Close lightbox via close button

- **GIVEN** the cover lightbox is open
- **WHEN** user clicks the X close button
- **THEN** the lightbox closes and focus returns to the cover circle

#### Scenario: Close lightbox via backdrop click

- **GIVEN** the cover lightbox is open
- **WHEN** user clicks the dimmed backdrop (outside the image)
- **THEN** the lightbox closes

#### Scenario: Close lightbox via Escape key

- **GIVEN** the cover lightbox is open
- **WHEN** user presses Escape
- **THEN** the lightbox closes and focus returns to the cover circle

#### Scenario: Default cover is not clickable

- **GIVEN** a goal with empty cover_hash (default SVG)
- **WHEN** user views the goal detail card
- **THEN** the cover circle does not respond to clicks and shows no hover cue

#### Scenario: Focus trap in lightbox

- **GIVEN** the cover lightbox is open
- **WHEN** user presses Tab
- **THEN** focus stays on the close button (does not escape to elements behind the overlay)

### Requirement: Collapsible description in view mode

Goal description in view mode SHALL be truncated to 2 visible lines using CSS line-clamp when the text exceeds 2 lines. A toggle icon (chevron) SHALL appear when the description is truncated. Clicking the toggle SHALL expand the description to show all text; clicking again SHALL collapse it back to 2 lines. The expand/collapse transition SHALL be smooth. The toggle icon SHALL rotate to indicate current state (down = collapsed, up = expanded). When the description fits within 2 lines, no toggle icon SHALL be shown. When description is empty, the description row SHALL not render. Implements FR3, FR4, UX3, UX4 of goal-detail-card-refactor.

#### Scenario: Short description shows fully without toggle

- **GIVEN** a goal with a description that fits within 2 lines
- **WHEN** user views the goal detail card
- **THEN** the full description is visible and no toggle icon appears

#### Scenario: Long description is truncated to 2 lines

- **GIVEN** a goal with a description that exceeds 2 lines
- **WHEN** user views the goal detail card
- **THEN** the description is truncated to 2 lines and a chevron-down toggle icon appears

#### Scenario: Expand truncated description

- **GIVEN** the description is truncated (collapsed)
- **WHEN** user clicks the toggle icon
- **THEN** the full description is shown and the icon changes to chevron-up

#### Scenario: Collapse expanded description

- **GIVEN** the description is expanded
- **WHEN** user clicks the toggle icon
- **THEN** the description collapses back to 2 lines and the icon changes to chevron-down

#### Scenario: Empty description hides row

- **GIVEN** a goal with no description (empty string)
- **WHEN** user views the goal detail card
- **THEN** no description row is rendered

#### Scenario: Toggle has correct aria attributes

- **GIVEN** a goal with a long description
- **WHEN** the description is collapsed
- **THEN** the toggle icon has `aria-expanded="false"` and appropriate `aria-label`
- **WHEN** the description is expanded
- **THEN** the toggle icon has `aria-expanded="true"` and appropriate `aria-label`

### Requirement: View mode layout recomposition

The goal detail card in view mode SHALL use a three-row layout. Row 1 SHALL contain the cover circle (left), the goal status badge (center-left, next to cover), and action buttons (right-aligned): focus toggle, completed tasks toggle, edit button. Row 2 SHALL contain the goal name. Row 3 SHALL contain the collapsible description (if present). Edit mode layout SHALL remain unchanged. Implements FR5 of goal-detail-card-refactor.

#### Scenario: Three-row layout with all elements

- **GIVEN** a goal with cover, name, status, and description
- **WHEN** user views the goal detail card in view mode
- **THEN** row 1 shows cover circle + status badge + action buttons, row 2 shows name, row 3 shows description

#### Scenario: Two-row layout without description

- **GIVEN** a goal with cover, name, and status but no description
- **WHEN** user views the goal detail card in view mode
- **THEN** row 1 shows cover circle + status badge + action buttons, row 2 shows name, no row 3

#### Scenario: Edit mode unchanged

- **WHEN** user enters edit mode on the goal detail card
- **THEN** the edit form layout is identical to the current implementation

### Requirement: Goal edit mode with tabs

Goal edit mode SHALL show cover + name at top (always visible), then two tab buttons: Details, Attachments. The Details tab SHALL contain the description field and status selector. The Attachments tab SHALL show the attachment list with an attached file button. Footer buttons (Delete, Cancel, Save) SHALL remain visible at the bottom regardless of active tab. Implements UX2 of add-file-attachments.

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
- **THEN** the attachment list for the current goal is displayed with an attached file button

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

### Requirement: GoalDetailPage respects eye toggle for hidden tasks

The GoalDetailPage SHALL display hidden tasks in the goal's task list when the eye toggle (`showHidden`) is active. Currently, `TaskRepository.getByGoalId()` hard-filters `!is_hidden`, making hidden tasks invisible even with the eye toggle on. Implements FR9 of hide-tasks.

#### Scenario: Hidden tasks visible on goal page with eye toggle on

- **GIVEN** a hidden task is assigned to the displayed goal
- **WHEN** user enables the eye toggle on GoalDetailPage
- **THEN** the hidden task appears in the goal's task list with reduced opacity and hidden indicator

#### Scenario: Hidden tasks invisible on goal page with eye toggle off

- **GIVEN** a hidden task is assigned to the displayed goal
- **WHEN** user has eye toggle off on GoalDetailPage
- **THEN** the hidden task does NOT appear in the goal's task list

### Requirement: GoalDetailPage integrates pin functionality for detail panel

GoalDetailPage SHALL integrate `useDetailPanelPinned` hook and render the detail panel column when `isDesktop && (isDetailPanelPinned || selectedTask)`. When `isDetailPanelPinned` is `true` and viewport is desktop, the detail panel column and resize handle SHALL always be rendered regardless of task selection state. When no task is selected in pinned mode, an empty state placeholder SHALL be shown in the detail panel area. The pin button in TaskDetailPanel SHALL work identically to other pages. Implements FR4, FR5, FR6, FR7 of extend-pin-to-entity-pages.

#### Scenario: Desktop layout with selected task

- **WHEN** a task is selected on desktop within GoalDetailPage
- **THEN** goal content and TaskDetailPanel are shown side-by-side with a draggable resize handle

#### Scenario: Mobile layout with selected task

- **WHEN** a task is selected on mobile within GoalDetailPage
- **THEN** goal content is hidden and TaskDetailPanel takes full screen

#### Scenario: No task selected without pinning

- **WHEN** no task is selected and detail panel is not pinned on GoalDetailPage
- **THEN** only goal content is shown, TaskDetailPanel is not rendered

#### Scenario: Pinned detail panel with no task selected on desktop

- **WHEN** detail panel is pinned, no task is selected, and viewport is desktop on GoalDetailPage
- **THEN** the detail panel column shows an empty state placeholder
- **AND** the resize handle is visible between goal content and detail panel area

#### Scenario: Pinned detail panel with task selected on desktop

- **WHEN** detail panel is pinned, a task is selected, and viewport is desktop on GoalDetailPage
- **THEN** TaskDetailPanel renders in the pinned column as usual

#### Scenario: Pinned mode ignored on mobile

- **WHEN** detail panel is pinned and viewport is mobile on GoalDetailPage
- **THEN** layout behaves identically to unpinned mode (detail panel only on task selection, full-screen)

#### Scenario: Pin button works in goal context

- **WHEN** user clicks pin button in TaskDetailPanel on GoalDetailPage
- **THEN** the `detail_panel_pinned` preference toggles and layout updates accordingly

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
