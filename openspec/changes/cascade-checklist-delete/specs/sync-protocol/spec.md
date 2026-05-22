## ADDED Requirements

### Requirement: Cascading soft-delete for checklist items
When a task is soft-deleted, the system SHALL also soft-delete all checklist_items belonging to that task. Each cascaded checklist_item SHALL have `is_deleted = true`, `needsSync = true`, and `updated_at` set to the current timestamp.

#### Scenario: Soft-delete task cascades to its checklist items
- **WHEN** user soft-deletes task T1 which has checklist items C1 and C2
- **THEN** T1 has `is_deleted = true`, `needsSync = true`
- **AND** C1 has `is_deleted = true`, `needsSync = true`
- **AND** C2 has `is_deleted = true`, `needsSync = true`

#### Scenario: Soft-delete task with no checklist items
- **WHEN** user soft-deletes task T1 which has no checklist items
- **THEN** only T1 has `is_deleted = true`
- **AND** no error occurs

#### Scenario: Soft-delete task with already-deleted checklist items
- **WHEN** user soft-deletes task T1 which has C1 (`is_deleted = false`) and C2 (`is_deleted = true`)
- **THEN** C1 has `is_deleted = true`, `needsSync = true`
- **AND** C2 remains `is_deleted = true` with `needsSync = true` and updated `updated_at`

### Requirement: Cascading restore for checklist items
When a task is restored, the system SHALL restore ALL checklist_items belonging to that task, regardless of whether they were manually deleted before the task was deleted.

#### Scenario: Restore task restores all checklist items
- **WHEN** user restores task T1 which has checklist items C1 and C2 (both `is_deleted = true`)
- **THEN** T1 has `is_deleted = false`, `needsSync = true`
- **AND** C1 has `is_deleted = false`, `needsSync = true`
- **AND** C2 has `is_deleted = false`, `needsSync = true`

#### Scenario: Restore task with no checklist items
- **WHEN** user restores task T1 which has no checklist items
- **THEN** only T1 has `is_deleted = false`
- **AND** no error occurs

#### Scenario: Restore task restores previously manually deleted checklist items
- **WHEN** user had manually deleted C1 before deleting task T1
- **AND** user restores task T1
- **THEN** C1 has `is_deleted = false` (restored along with all other checklist items)

### Requirement: Self-healing removes orphaned checklist items before push
Before sending push data to the server, the system SHALL detect checklist_items whose `task_id` references a task that does not physically exist in IndexedDB. Such orphaned checklist_items SHALL be hard-deleted from IndexedDB and excluded from push data.

#### Scenario: Orphaned checklist item is removed before push
- **WHEN** push collects checklist item C1 with `task_id = T99`
- **AND** task T99 does not exist in IndexedDB
- **THEN** C1 is hard-deleted from IndexedDB
- **AND** C1 is NOT included in push data
- **AND** a warning is logged: `"Orphaned checklist item C1 references missing task T99"`

#### Scenario: Checklist item with existing task is not affected
- **WHEN** push collects checklist item C1 with `task_id = T1`
- **AND** task T1 exists in IndexedDB (regardless of `is_deleted` flag)
- **THEN** C1 is included in push data normally

#### Scenario: Self-healing with incremental push
- **WHEN** incremental push (`force = false`) collects checklist item C1 with `task_id = T1`
- **AND** T1 is NOT in push data (not dirty) but EXISTS in IndexedDB
- **THEN** C1 is included in push data normally (T1 already on server or will be)

#### Scenario: Self-healing with no orphans
- **WHEN** push collects checklist items and all have valid task_id references
- **THEN** no items are removed and no warnings are logged

### Requirement: ChecklistRepository provides getByTaskId method
The ChecklistRepository SHALL provide a method `getByTaskId(taskId: string)` that returns all checklist_items (including soft-deleted) for the given task.

#### Scenario: Get checklist items by task ID
- **WHEN** `getByTaskId("T1")` is called
- **AND** T1 has checklist items C1 (`is_deleted = false`) and C2 (`is_deleted = true`)
- **THEN** result contains both C1 and C2

#### Scenario: Get checklist items for task with none
- **WHEN** `getByTaskId("T1")` is called
- **AND** T1 has no checklist items
- **THEN** result is an empty array
