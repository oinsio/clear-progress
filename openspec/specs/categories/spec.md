# Capability: Categories

## Purpose

Task categories for thematic grouping of tasks. Categories are a flat list with manual sort order and cross-device sync.

## Requirements

### Requirement: User can create a category

User SHALL be able to create a category by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false. The `sort_order` MUST be generated via `generateTopKey()` — a fractional index key above the current maximum. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR4, FR5 of desc-sort-order.

#### Scenario: Create category with name
- **WHEN** user creates a category with name "Health"
- **THEN** category is created with the provided name, UUID v4 id, revision=0, needsSync=true, is_deleted=false

#### Scenario: New category sort_order above maximum
- **GIVEN** 3 active categories exist with sort keys "a0", "a1", "a2"
- **WHEN** user creates a new category
- **THEN** new category has sort_order above "a2"

#### Scenario: UUID generated client-side
- **WHEN** user creates a category
- **THEN** id is a valid UUID v4 generated via crypto.randomUUID()

#### Scenario: Timestamps set on creation
- **WHEN** user creates a category
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active categories

User SHALL be able to view a list of active (non-deleted) categories sorted by `sort_order` descending (highest key first). Soft-deleted categories MUST NOT appear in the active list. Implements FR4 of desc-sort-order.

#### Scenario: List sorted by sort_order descending
- **GIVEN** categories exist with sort_order "a0", "a1", "a2"
- **WHEN** user views the categories list
- **THEN** categories are returned in order: sort_order "a2", "a1", "a0"

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

User SHALL be able to reorder categories via drag-and-drop. System MUST use fractional indexing to generate a new `sort_order` key between neighbors. Only the dragged category MUST be updated. The moved category MUST be marked for sync (`needsSync` = true). Drag-and-drop neighbor logic MUST use DESC semantics: index 0 = highest key, last index = lowest key. Implements FR6, FR7 of desc-sort-order.

#### Scenario: Reorder updates only dragged item
- **GIVEN** categories A, B, C sorted DESC
- **WHEN** user drags C to position between A and B
- **THEN** only C gets a new sort_order between A and B, A and B are unchanged

#### Scenario: Reorder marks moved item for sync
- **GIVEN** categories A, B, C sorted DESC
- **WHEN** user drags C to a new position
- **THEN** C has needsSync=true, A and B have unchanged needsSync

#### Scenario: Rebalancing with DESC sort
- **GIVEN** categories sorted DESC with a sort key exceeding rebalance threshold
- **WHEN** rebalancing is triggered
- **THEN** all categories receive new evenly-distributed keys maintaining DESC visual order
