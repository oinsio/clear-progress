## ADDED Requirements

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
