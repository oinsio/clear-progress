# Delta: push-poison-pill-protection — fix-checklist-fk-self-heal

## ADDED Requirements

### Requirement: Server extracts the fk_violation field name correctly for all tables
The `push_records` RPC SHALL derive the structured rejection reason `fk_violation:<field>` from the violated FK constraint name in a way that is correct even when the **table name contains underscores**. The extracted `<field>` SHALL be the FK reference column (the trailing `<word>_id` segment of the `<table>_<field>_fkey` constraint name), so that client self-healing (`pushRejectionHandler`) receives a field name it recognizes. Implements FR1, FR2, FR3 of fix-checklist-fk-self-heal.

#### Scenario: Checklist item FK violation yields task_id
- **WHEN** a `checklist_items` insert violates `checklist_items_task_id_fkey` (SQLSTATE 23503)
- **THEN** `push_records` returns `status: "rejected"` with `reason: "fk_violation:task_id"`
- **AND** NOT `reason: "fk_violation:items_task_id"`

#### Scenario: Task FK violations still yield their reference field
- **WHEN** a `tasks` insert violates `tasks_goal_id_fkey`, `tasks_context_id_fkey`, or `tasks_category_id_fkey`
- **THEN** `push_records` returns `reason: "fk_violation:goal_id"`, `"fk_violation:context_id"`, or `"fk_violation:category_id"` respectively

#### Scenario: Orphaned checklist item self-heals end-to-end
- **WHEN** the client pushes a checklist item whose `task_id` references a task that does not exist on the server (purged or foreign)
- **THEN** the server rejects it with `reason: "fk_violation:task_id"`
- **AND** the client sets `is_deleted = true`, `syncStatus: "pending"`, and retries
- **AND** the retried push settles (the orphaned checklist item is soft-deleted, not left permanently rejected)
