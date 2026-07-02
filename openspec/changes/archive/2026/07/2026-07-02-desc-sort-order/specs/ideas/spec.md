## MODIFIED Requirements

### Requirement: User can create an idea

User SHALL be able to create an idea by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, and `description` to empty string. The `sort_order` MUST be generated via `generateTopKey()` — a fractional index key above the current maximum. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR2, FR5 of desc-sort-order.

#### Scenario: Create idea with name only
- **WHEN** user creates an idea with name "Voice UI for calendar"
- **THEN** idea is created with the provided name, UUID v4 id, revision=0, needsSync=true, is_deleted=false

#### Scenario: New idea sort_order above maximum
- **GIVEN** 3 active ideas exist with sort keys "a0", "a1", "a2"
- **WHEN** user creates a new idea
- **THEN** new idea has sort_order above "a2"

#### Scenario: UUID generated client-side
- **WHEN** user creates an idea
- **THEN** id is a valid UUID v4 generated via crypto.randomUUID()

### Requirement: User can view active ideas

User SHALL be able to view a list of active (non-deleted) ideas sorted by `sort_order` descending (highest key first). Soft-deleted ideas MUST NOT appear in the active list. Idea description in the list item SHALL preserve newline characters by applying `white-space: pre-line` CSS property. Implements FR2 of desc-sort-order.

#### Scenario: List sorted by sort_order descending
- **GIVEN** ideas exist with sort_order "a0", "a1", "a2"
- **WHEN** user views the ideas list
- **THEN** ideas are returned in order: sort_order "a2", "a1", "a0"

#### Scenario: Empty list
- **GIVEN** no active ideas exist
- **WHEN** user views the ideas list
- **THEN** empty list is returned

### Requirement: User can reorder ideas

User SHALL be able to reorder ideas via drag-and-drop. System MUST use fractional indexing to generate a new `sort_order` key between neighbors. Only the dragged idea MUST be updated. The moved idea MUST be marked for sync (`needsSync` = true). Drag-and-drop neighbor logic MUST use DESC semantics: index 0 = highest key, last index = lowest key. Implements FR6, FR7 of desc-sort-order.

#### Scenario: Reorder updates only dragged item
- **GIVEN** ideas A, B, C sorted DESC
- **WHEN** user drags C to position between A and B
- **THEN** only C gets a new sort_order between A and B, A and B are unchanged

#### Scenario: Reorder marks moved item for sync
- **GIVEN** ideas A, B, C sorted DESC
- **WHEN** user drags C to a new position
- **THEN** C has needsSync=true, A and B have unchanged needsSync

#### Scenario: Rebalancing with DESC sort
- **GIVEN** ideas sorted DESC with a sort key exceeding rebalance threshold
- **WHEN** rebalancing is triggered
- **THEN** all ideas receive new evenly-distributed keys maintaining DESC visual order
