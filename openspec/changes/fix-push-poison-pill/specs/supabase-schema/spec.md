## MODIFIED Requirements

### Requirement: RPC push_records uses per-record exception handling
The `push_records` RPC SHALL use `SET CONSTRAINTS ALL IMMEDIATE` at the beginning of execution. Each record in the processing loop SHALL be wrapped in `BEGIN...EXCEPTION WHEN OTHERS` to catch per-record errors without rolling back the entire transaction. Records that cause exceptions SHALL be returned with `status: "rejected"` and a structured `reason`.

#### Scenario: Valid records processed normally
- **WHEN** all records in a push batch are valid
- **THEN** all records are inserted/updated with status `created` or `accepted`

#### Scenario: One invalid record does not block others
- **WHEN** a batch contains 5 tasks, 1 with FK violation
- **THEN** 4 tasks are processed successfully
- **AND** 1 task is returned with `status: "rejected"` and `reason: "fk_violation:goal_id"`

#### Scenario: FK violation reason includes field name
- **WHEN** a task references non-existent goal via `goal_id`
- **THEN** rejected reason is `"fk_violation:goal_id"`

#### Scenario: CHECK violation reason includes constraint name
- **WHEN** a task has invalid `box` value
- **THEN** rejected reason is `"check_violation:box"`

### Requirement: Purge bumps revision of dependent records
Before deleting parent records during purge, the system SHALL update dependent records: set FK field to NULL, bump `revision` to `next_revision`, and set `updated_at` to `NOW()`. This applies to: goals → tasks.goal_id, contexts → tasks.context_id, categories → tasks.category_id, tasks → checklist_items.task_id.

#### Scenario: Purge goal bumps dependent tasks
- **WHEN** goal "G1" is purged
- **THEN** all tasks with `goal_id = "G1"` have `goal_id` set to NULL
- **AND** their `revision` and `updated_at` are bumped

#### Scenario: Bumped records are delivered via pull
- **WHEN** tasks are bumped due to goal purge
- **THEN** other devices receive the updated tasks in their next pull
- **AND** the tasks show `goal_id = ""` (empty)

#### Scenario: Purge context bumps dependent tasks
- **WHEN** context "C1" is purged
- **THEN** all tasks with `context_id = "C1"` have `context_id` set to NULL
- **AND** their `revision` and `updated_at` are bumped
