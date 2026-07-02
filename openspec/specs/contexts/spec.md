# Capability: Contexts

## Purpose

Contexts for task filtering by location or situation (@home, @work, @errands). Contexts are a flat list with manual sort order and cross-device sync.

## Requirements

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

#### Scenario: Timestamps set on creation
- **WHEN** user creates a context
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active contexts

User SHALL be able to view a list of active (non-deleted) contexts sorted by `sort_order` descending (highest key first). Soft-deleted contexts MUST NOT appear in the active list. Implements FR3 of desc-sort-order.

#### Scenario: List sorted by sort_order descending
- **GIVEN** contexts exist with sort_order "a0", "a1", "a2"
- **WHEN** user views the contexts list
- **THEN** contexts are returned in order: sort_order "a2", "a1", "a0"

#### Scenario: Empty list
- **GIVEN** no contexts exist
- **WHEN** user views the contexts list
- **THEN** an empty array is returned

#### Scenario: Soft-deleted contexts excluded
- **GIVEN** 2 active contexts and 1 soft-deleted context exist
- **WHEN** user views the contexts list
- **THEN** only 2 active contexts are returned

### Requirement: User can update a context

User SHALL be able to update context name. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change.

#### Scenario: Update context name
- **GIVEN** context "@home" exists
- **WHEN** user updates name to "@office"
- **THEN** context name is "@office", needsSync is true, updated_at is refreshed

#### Scenario: No-op update does not trigger sync
- **GIVEN** context "@home" exists with needsSync false
- **WHEN** user updates name to "@home" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent context throws error
- **WHEN** user attempts to update a context with a nonexistent ID
- **THEN** system throws error "Context not found"

### Requirement: User can soft-delete and restore a context

User SHALL be able to soft-delete a context (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the context for sync.

#### Scenario: Soft-delete a context
- **GIVEN** active context "@home" exists
- **WHEN** user soft-deletes the context
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted context
- **GIVEN** soft-deleted context "@home" exists
- **WHEN** user restores the context
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted context excluded from active list
- **GIVEN** context "@home" is soft-deleted
- **WHEN** user views the contexts list
- **THEN** "@home" does not appear

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
