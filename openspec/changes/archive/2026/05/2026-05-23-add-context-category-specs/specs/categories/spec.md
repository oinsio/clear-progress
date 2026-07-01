# Capability: Categories

## Purpose

Task categories for thematic grouping of tasks. Categories are a flat list with manual sort order and cross-device sync.

## Requirements

### Requirement: User can create a category

User SHALL be able to create a category by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false. The `sort_order` MUST default to the count of active categories (appended to end). Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix.

#### Scenario: Create category with name
- **WHEN** user creates a category with name "Work"
- **THEN** category is persisted with name "Work", revision 0, needsSync true, is_deleted false

#### Scenario: Sort order defaults to end of list
- **GIVEN** 3 active categories exist
- **WHEN** user creates a new category
- **THEN** new category has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates a category
- **THEN** category.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates a category
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active categories

User SHALL be able to view a list of active (non-deleted) categories sorted by `sort_order` ascending. Soft-deleted categories MUST NOT appear in the active list.

#### Scenario: List sorted by sort_order
- **GIVEN** categories exist with sort_order 2, 0, 1
- **WHEN** user views the categories list
- **THEN** categories are returned in order: sort_order 0, 1, 2

#### Scenario: Empty list
- **GIVEN** no categories exist
- **WHEN** user views the categories list
- **THEN** an empty array is returned

#### Scenario: Soft-deleted categories excluded
- **GIVEN** 2 active categories and 1 soft-deleted category exist
- **WHEN** user views the categories list
- **THEN** only 2 active categories are returned

### Requirement: User can update a category

User SHALL be able to update category name. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change.

#### Scenario: Update category name
- **GIVEN** category "Work" exists
- **WHEN** user updates name to "Personal"
- **THEN** category name is "Personal", needsSync is true, updated_at is refreshed

#### Scenario: No-op update does not trigger sync
- **GIVEN** category "Work" exists with needsSync false
- **WHEN** user updates name to "Work" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent category throws error
- **WHEN** user attempts to update a category with a nonexistent ID
- **THEN** system throws error "Category not found"

### Requirement: User can soft-delete and restore a category

User SHALL be able to soft-delete a category (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the category for sync.

#### Scenario: Soft-delete a category
- **GIVEN** active category "Work" exists
- **WHEN** user soft-deletes the category
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted category
- **GIVEN** soft-deleted category "Work" exists
- **WHEN** user restores the category
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted category excluded from active list
- **GIVEN** category "Work" is soft-deleted
- **WHEN** user views the categories list
- **THEN** "Work" does not appear

### Requirement: User can reorder categories

User SHALL be able to reorder categories via drag-and-drop. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only categories whose `sort_order` actually changed MUST be marked for sync (`needsSync` = true). All changed categories MUST share the same `updated_at` timestamp (batch operation). Empty array MUST be a no-op. If order is unchanged, no database write occurs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** categories A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed categories marked for sync
- **GIVEN** categories A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** categories A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs, no categories marked for sync
