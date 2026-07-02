## MODIFIED Requirements

### Requirement: User can create a context

User SHALL be able to create a context by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false. The `sort_order` MUST be generated via `generateTopKey()` — a fractional index key above the current maximum. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR3, FR5 of desc-sort-order.

#### Scenario: Create context with name
- **WHEN** user creates a context with name "@home"
- **THEN** context is created with the provided name, UUID v4 id, revision=0, needsSync=true, is_deleted=false

#### Scenario: New context sort_order above maximum
- **GIVEN** 3 active contexts exist with sort keys "a0", "a1", "a2"
- **WHEN** user creates a new context
- **THEN** new context has sort_order above "a2"

#### Scenario: UUID generated client-side
- **WHEN** user creates a context
- **THEN** id is a valid UUID v4 generated via crypto.randomUUID()

### Requirement: User can view active contexts

User SHALL be able to view a list of active (non-deleted) contexts sorted by `sort_order` descending (highest key first). Soft-deleted contexts MUST NOT appear in the active list. Implements FR3 of desc-sort-order.

#### Scenario: List sorted by sort_order descending
- **GIVEN** contexts exist with sort_order "a0", "a1", "a2"
- **WHEN** user views the contexts list
- **THEN** contexts are returned in order: sort_order "a2", "a1", "a0"

#### Scenario: Empty list
- **GIVEN** no active contexts exist
- **WHEN** user views the contexts list
- **THEN** empty list is returned

### Requirement: User can reorder contexts

User SHALL be able to reorder contexts via drag-and-drop. System MUST use fractional indexing to generate a new `sort_order` key between neighbors. Only the dragged context MUST be updated. The moved context MUST be marked for sync (`needsSync` = true). Drag-and-drop neighbor logic MUST use DESC semantics: index 0 = highest key, last index = lowest key. Implements FR6, FR7 of desc-sort-order.

#### Scenario: Reorder updates only dragged item
- **GIVEN** contexts A, B, C sorted DESC
- **WHEN** user drags C to position between A and B
- **THEN** only C gets a new sort_order between A and B, A and B are unchanged

#### Scenario: Reorder marks moved item for sync
- **GIVEN** contexts A, B, C sorted DESC
- **WHEN** user drags C to a new position
- **THEN** C has needsSync=true, A and B have unchanged needsSync

#### Scenario: Rebalancing with DESC sort
- **GIVEN** contexts sorted DESC with a sort key exceeding rebalance threshold
- **WHEN** rebalancing is triggered
- **THEN** all contexts receive new evenly-distributed keys maintaining DESC visual order
