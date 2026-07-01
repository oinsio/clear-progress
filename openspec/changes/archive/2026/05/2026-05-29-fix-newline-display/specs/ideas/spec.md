## MODIFIED Requirements

### Requirement: User can view active ideas

User SHALL be able to view a list of active (non-deleted) ideas sorted by `sort_order` ascending. Soft-deleted ideas MUST NOT appear in the active list. Idea description in the list item SHALL preserve newline characters by applying `white-space: pre-line` CSS property. Implements FR3 of fix-newline-display.

#### Scenario: List sorted by sort_order
- **GIVEN** ideas exist with sort_order 2, 0, 1
- **WHEN** user views the ideas list
- **THEN** ideas are returned in order: sort_order 0, 1, 2

#### Scenario: Empty list
- **GIVEN** no ideas exist
- **WHEN** user views the ideas list
- **THEN** an empty array is returned

#### Scenario: Soft-deleted ideas excluded
- **GIVEN** 2 active ideas and 1 soft-deleted idea exist
- **WHEN** user views the ideas list
- **THEN** only 2 active ideas are returned

#### Scenario: Description preserves newlines in list view
- **GIVEN** idea with description "Line one\nLine two" exists
- **WHEN** user views the ideas list
- **THEN** the description element has CSS class `whitespace-pre-line`
