## ADDED Requirements

### Requirement: Purge requires strict confirmation
The server SHALL reject purge requests unless the payload contains `confirm` set to exactly `true` (boolean). Truthy values other than `true` (e.g., `1`, `"true"`, `{}`) SHALL be rejected with error code `INVALID_PAYLOAD`.

#### Scenario: Purge with confirm true succeeds
- **WHEN** purge is called with `confirm = true`
- **THEN** server processes the purge and returns `ok = true`

#### Scenario: Purge without confirm is rejected
- **WHEN** purge is called without `confirm` field
- **THEN** server returns error `INVALID_PAYLOAD`

#### Scenario: Purge with confirm false is rejected
- **WHEN** purge is called with `confirm = false`
- **THEN** server returns error `INVALID_PAYLOAD`

#### Scenario: Purge with truthy non-boolean confirm is rejected
- **WHEN** purge is called with `confirm = 1` or `confirm = "true"`
- **THEN** server returns error `INVALID_PAYLOAD`

### Requirement: Purge removes all soft-deleted records from server
The server SHALL physically delete all records with `is_deleted = true` across all 6 entity types: tasks, goals, contexts, categories, checklist_items, ideas. Records with `is_deleted = false` SHALL NOT be affected.

#### Scenario: Soft-deleted records are removed
- **WHEN** server has tasks with `is_deleted = true` and tasks with `is_deleted = false`
- **AND** purge is called with `confirm = true`
- **THEN** only records with `is_deleted = true` are physically deleted
- **AND** records with `is_deleted = false` remain unchanged

#### Scenario: Purge across all entity types
- **WHEN** each entity type (tasks, goals, contexts, categories, checklist_items, ideas) has at least one soft-deleted record
- **AND** purge is called with `confirm = true`
- **THEN** all soft-deleted records across all 6 types are removed

#### Scenario: Purge with no soft-deleted records
- **WHEN** no records have `is_deleted = true`
- **AND** purge is called with `confirm = true`
- **THEN** response returns zero counts for all entity types
- **AND** purge_revision is still incremented

### Requirement: Purge returns counts per entity type
The server SHALL return a `PurgeResponse` containing `ok: boolean`, `purged` object with counts for each of the 6 entity types, and `purge_revision` number.

#### Scenario: Response contains correct purge counts
- **WHEN** server has 3 soft-deleted tasks, 1 soft-deleted goal, and no other soft-deleted entities
- **AND** purge is called
- **THEN** response contains `purged.tasks = 3`, `purged.goals = 1`, and zero for other types

### Requirement: Purge increments purge_revision
After a successful purge, the server SHALL increment `purge_revision` by 1. The new value SHALL be returned in the response. This revision enables cross-device purge detection via the pull protocol.

#### Scenario: purge_revision increments after purge
- **WHEN** current `purge_revision` is 2
- **AND** purge is called with `confirm = true`
- **THEN** response contains `purge_revision = 3`
- **AND** subsequent pull responses include `purge_revision = 3`

#### Scenario: purge_revision increments even with no soft-deleted records
- **WHEN** no records have `is_deleted = true`
- **AND** purge is called with `confirm = true`
- **THEN** `purge_revision` is still incremented

### Requirement: Purge error handling
If an internal error occurs during purge (e.g., sheet operation failure), the server SHALL return error code `INTERNAL_ERROR` with the error message.

#### Scenario: Internal error during purge
- **WHEN** a sheet operation throws an error during purge
- **THEN** server returns `ok = false` with error code `INTERNAL_ERROR`
