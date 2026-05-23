# Capability: Ideas

## Purpose

Lightweight capture and management of ideas with drag-and-drop ordering, inline search, and cross-device sync. Ideas are a flat list (no hierarchy) with manual sort order.

## Requirements

### Requirement: User can create an idea

User SHALL be able to create an idea by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, and `description` to empty string. The `sort_order` MUST default to the count of active ideas (appended to end). Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR1, FR8 of add-ideas-specs.

#### Scenario: Create idea with name only
- **WHEN** user creates an idea with name "Learn Rust"
- **THEN** idea is persisted with name "Learn Rust", description "", revision 0, needsSync true, is_deleted false

#### Scenario: Create idea with name and description
- **WHEN** user creates an idea with name "Learn Rust" and description "Systems programming"
- **THEN** idea is persisted with both name and description preserved

#### Scenario: Sort order defaults to end of list
- **GIVEN** 3 active ideas exist
- **WHEN** user creates a new idea
- **THEN** new idea has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates an idea
- **THEN** idea.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates an idea
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active ideas

User SHALL be able to view a list of active (non-deleted) ideas sorted by `sort_order` ascending. Soft-deleted ideas MUST NOT appear in the active list. Implements FR2 of add-ideas-specs.

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

### Requirement: User can update an idea

User SHALL be able to update idea name and description. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change. Implements FR3, FR9 of add-ideas-specs.

#### Scenario: Update idea name
- **GIVEN** idea "Learn Rust" exists
- **WHEN** user updates name to "Learn Go"
- **THEN** idea name is "Learn Go", needsSync is true, updated_at is refreshed

#### Scenario: Update idea description
- **GIVEN** idea with description "Old" exists
- **WHEN** user updates description to "New"
- **THEN** description is "New", needsSync is true

#### Scenario: No-op update does not trigger sync
- **GIVEN** idea "Learn Rust" exists with needsSync false
- **WHEN** user updates name to "Learn Rust" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent idea throws error
- **WHEN** user attempts to update an idea with a nonexistent ID
- **THEN** system throws error "Idea not found"

### Requirement: User can soft-delete and restore an idea

User SHALL be able to soft-delete an idea (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the idea for sync. Implements FR4, FR5 of add-ideas-specs.

#### Scenario: Soft-delete an idea
- **GIVEN** active idea "Learn Rust" exists
- **WHEN** user soft-deletes the idea
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted idea
- **GIVEN** soft-deleted idea "Learn Rust" exists
- **WHEN** user restores the idea
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted idea excluded from active list
- **GIVEN** idea "Learn Rust" is soft-deleted
- **WHEN** user views the ideas list
- **THEN** "Learn Rust" does not appear

### Requirement: User can reorder ideas

User SHALL be able to reorder ideas via drag-and-drop. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only ideas whose `sort_order` actually changed MUST be marked for sync (`needsSync` = true). All changed ideas MUST share the same `updated_at` timestamp (batch operation). Empty array MUST be a no-op. If order is unchanged, no database write occurs. Implements FR6, FR10 of add-ideas-specs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** ideas A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed ideas marked for sync
- **GIVEN** ideas A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** ideas A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs, no ideas marked for sync

### Requirement: User can search ideas

User SHALL be able to search ideas by name and description. Search MUST be case-insensitive and match partial strings. Results MUST be sorted by `updated_at` descending (most recently updated first). Only active ideas are searched. Implements FR7 of add-ideas-specs.

#### Scenario: Search by name
- **GIVEN** ideas "Learn Rust", "Learn Go", "Write book" exist
- **WHEN** user searches for "learn"
- **THEN** "Learn Rust" and "Learn Go" are returned

#### Scenario: Search by description
- **GIVEN** idea with name "Project" and description "Learn new frameworks" exists
- **WHEN** user searches for "framework"
- **THEN** "Project" is returned

#### Scenario: Case-insensitive search
- **GIVEN** idea "Learn RUST" exists
- **WHEN** user searches for "rust"
- **THEN** "Learn RUST" is returned

#### Scenario: Results sorted by updated_at descending
- **GIVEN** idea "A" updated at 10:00 and idea "B" updated at 11:00, both matching query
- **WHEN** user searches
- **THEN** "B" appears before "A"

#### Scenario: No matches returns empty
- **GIVEN** idea "Learn Rust" exists
- **WHEN** user searches for "python"
- **THEN** empty array is returned
