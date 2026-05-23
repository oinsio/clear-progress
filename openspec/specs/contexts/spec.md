# Capability: Contexts

## Purpose

Contexts for task filtering by location or situation (@home, @work, @errands). Contexts are a flat list with manual sort order and cross-device sync.

## Requirements

### Requirement: User can create a context

User SHALL be able to create a context by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false. The `sort_order` MUST default to the count of active contexts (appended to end). Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix.

#### Scenario: Create context with name
- **WHEN** user creates a context with name "@home"
- **THEN** context is persisted with name "@home", revision 0, needsSync true, is_deleted false

#### Scenario: Sort order defaults to end of list
- **GIVEN** 3 active contexts exist
- **WHEN** user creates a new context
- **THEN** new context has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates a context
- **THEN** context.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates a context
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active contexts

User SHALL be able to view a list of active (non-deleted) contexts sorted by `sort_order` ascending. Soft-deleted contexts MUST NOT appear in the active list.

#### Scenario: List sorted by sort_order
- **GIVEN** contexts exist with sort_order 2, 0, 1
- **WHEN** user views the contexts list
- **THEN** contexts are returned in order: sort_order 0, 1, 2

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

User SHALL be able to reorder contexts via drag-and-drop. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only contexts whose `sort_order` actually changed MUST be marked for sync (`needsSync` = true). All changed contexts MUST share the same `updated_at` timestamp (batch operation). Empty array MUST be a no-op. If order is unchanged, no database write occurs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** contexts A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed contexts marked for sync
- **GIVEN** contexts A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** contexts A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs, no contexts marked for sync
