# Capability: Checklists

## Purpose

Checklist items are subtasks within a task. Users can create, complete, reorder, and delete checklist items. Progress (completed/total) is calculated in real-time. Soft delete with sync support. Cascade delete/restore is handled by the Tasks capability.

## ADDED Requirements

### Requirement: User can create a checklist item
# implements FR1 of add-checklist-specs

User SHALL be able to create a checklist item by providing a task ID and name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, `is_completed` to false. The `sort_order` MUST default to the count of existing active checklist items for that task. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix.

#### Scenario: Create checklist item with defaults
- **GIVEN** task has 0 checklist items
- **WHEN** user creates a checklist item with name "Buy milk"
- **THEN** item is persisted with name "Buy milk", is_completed false, is_deleted false, revision 0, needsSync true

#### Scenario: Sort order defaults to end of list
- **GIVEN** task has 3 active checklist items
- **WHEN** user creates a new checklist item
- **THEN** new item has sort_order = 3

#### Scenario: UUID generated client-side
- **WHEN** user creates a checklist item
- **THEN** item.id is a valid UUID v4

#### Scenario: Timestamps set on creation
- **WHEN** user creates a checklist item
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can read checklist items by task
# implements FR1 of add-checklist-specs

User SHALL be able to retrieve all active (non-deleted) checklist items for a task, sorted by `sort_order` ascending.

#### Scenario: Get items by task sorted by sort_order
- **GIVEN** task has items with sort_order 2, 0, 1
- **WHEN** user gets checklist items by task ID
- **THEN** items are returned in order: sort_order 0, 1, 2

#### Scenario: Soft-deleted items excluded
- **GIVEN** task has 2 active items and 1 soft-deleted item
- **WHEN** user gets checklist items by task ID
- **THEN** only 2 active items are returned

#### Scenario: Empty checklist
- **GIVEN** task has no checklist items
- **WHEN** user gets checklist items by task ID
- **THEN** an empty array is returned

### Requirement: User can read a checklist item by ID
# implements FR1 of add-checklist-specs

User SHALL be able to retrieve a single checklist item by its ID. System MUST return the item if it exists, or undefined if not found.

#### Scenario: Read existing item
- **GIVEN** checklist item "Buy milk" exists with a known ID
- **WHEN** user reads item by that ID
- **THEN** system returns the item with all fields

#### Scenario: Read nonexistent item
- **WHEN** user reads item by a nonexistent ID
- **THEN** system returns undefined

### Requirement: User can toggle checklist item completion
# implements FR2 of add-checklist-specs

User SHALL be able to toggle `is_completed` on a checklist item. If the item is incomplete, it becomes completed; if completed, it becomes incomplete. System MUST update `updated_at` and set `needsSync` to true.

#### Scenario: Toggle incomplete to completed
- **GIVEN** incomplete checklist item "Buy milk" exists
- **WHEN** user toggles the item
- **THEN** is_completed is true, needsSync is true, updated_at is refreshed

#### Scenario: Toggle completed to incomplete
- **GIVEN** completed checklist item "Buy milk" exists
- **WHEN** user toggles the item
- **THEN** is_completed is false, needsSync is true, updated_at is refreshed

#### Scenario: Toggle nonexistent item throws error
- **WHEN** user attempts to toggle a nonexistent checklist item
- **THEN** system throws error "ChecklistItem not found"

### Requirement: User can update a checklist item name
# implements FR3 of add-checklist-specs

User SHALL be able to update the name of a checklist item. System MUST use smart dirty flag: if the update contains identical data, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed.

#### Scenario: Update item name
- **GIVEN** checklist item "Buy milk" exists
- **WHEN** user updates name to "Buy oat milk"
- **THEN** item name is "Buy oat milk", needsSync is true, updated_at is refreshed

#### Scenario: No-op update does not trigger sync
- **GIVEN** checklist item "Buy milk" exists with needsSync false
- **WHEN** user updates name to "Buy milk" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent item throws error
- **WHEN** user attempts to update a nonexistent checklist item
- **THEN** system throws error "ChecklistItem not found"

### Requirement: User can soft-delete and restore a checklist item
# implements FR4 of add-checklist-specs

User SHALL be able to soft-delete a checklist item (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the item for sync. Soft-deleted items MUST NOT appear in task's checklist or progress calculation.

#### Scenario: Soft-delete a checklist item
- **GIVEN** active checklist item "Buy milk" exists
- **WHEN** user soft-deletes the item
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted checklist item
- **GIVEN** soft-deleted checklist item "Buy milk" exists
- **WHEN** user restores the item
- **THEN** is_deleted is false, needsSync is true

### Requirement: User can reorder checklist items
# implements FR5 of add-checklist-specs

User SHALL be able to reorder checklist items. System MUST assign sequential `sort_order` values (0, 1, 2...) based on position. Only items whose `sort_order` actually changed MUST be marked for sync. All changed items MUST share the same `updated_at` timestamp. Empty array MUST be a no-op. If order is unchanged, no database write occurs.

#### Scenario: Reorder assigns sequential sort_order
- **GIVEN** items A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to B, C, A
- **THEN** B has sort_order=0, C has sort_order=1, A has sort_order=2

#### Scenario: Only changed items marked for sync
- **GIVEN** items A (sort_order=0), B (sort_order=1), C (sort_order=2)
- **WHEN** user reorders to A, C, B
- **THEN** A has needsSync=false (unchanged), C has needsSync=true, B has needsSync=true

#### Scenario: Empty reorder is no-op
- **WHEN** user reorders with an empty array
- **THEN** no database write occurs

#### Scenario: Same order is no-op
- **GIVEN** items A (sort_order=0), B (sort_order=1)
- **WHEN** user reorders to A, B (same order)
- **THEN** no database write occurs

### Requirement: User can get checklist progress for a task
# implements FR6 of add-checklist-specs

System SHALL provide progress counts (completed and total) for a task's active checklist items. Soft-deleted items MUST NOT be counted.

#### Scenario: Progress with mixed completion
- **GIVEN** task has 3 active items: 2 completed, 1 incomplete
- **WHEN** user gets checklist progress
- **THEN** progress is { completed: 2, total: 3 }

#### Scenario: Progress with no items
- **GIVEN** task has no checklist items
- **WHEN** user gets checklist progress
- **THEN** progress is { completed: 0, total: 0 }

#### Scenario: Soft-deleted items excluded from progress
- **GIVEN** task has 2 active completed items and 1 soft-deleted completed item
- **WHEN** user gets checklist progress
- **THEN** progress is { completed: 2, total: 2 }
