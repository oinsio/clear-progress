## Purpose

Client-side and server-side validation to prevent poison-pill records from blocking sync. Includes pre-push Zod validation, self-healing for healable errors, and server-side rejection logging.

## Requirements

### Requirement: Client validates outgoing records with Zod before push
The client SHALL validate each record through the corresponding Wire Zod schema (`WireTaskSchema.safeParse()`, etc.) before including it in the push request. Records that fail validation SHALL be processed locally via self-healing or marked as rejected.

#### Scenario: Valid record passes validation and is sent
- **WHEN** a task with valid fields is queued for push
- **THEN** the task passes Zod validation and is included in the push request

#### Scenario: Record with invalid timestamp is self-healed
- **WHEN** a task has `created_at = "yesterday"` (invalid ISO timestamp)
- **THEN** Zod validation fails
- **AND** `created_at` is replaced with current ISO timestamp
- **AND** the task is re-validated and sent

#### Scenario: Record with invalid FK is self-healed
- **WHEN** a task has `goal_id = "abc"` (not UUID and not empty string)
- **THEN** Zod validation fails
- **AND** `goal_id` is set to `""`
- **AND** the task is re-validated and sent

#### Scenario: Record with invalid enum is marked rejected
- **WHEN** a task has `box = "archive"` (not in allowed values)
- **THEN** Zod validation fails
- **AND** the task is marked `syncStatus: "rejected"`
- **AND** the task is NOT included in the push request

### Requirement: Wire schemas enforce UUID-or-empty for FK fields
Wire Zod schemas for FK fields (`goal_id`, `context_id`, `category_id`, `original_task_id`) SHALL use `z.union([UUIDSchema, z.literal("")])` instead of `z.string()`.

#### Scenario: Valid UUID passes FK field validation
- **WHEN** `goal_id` is `"550e8400-e29b-41d4-a716-446655440000"`
- **THEN** validation passes

#### Scenario: Empty string passes FK field validation
- **WHEN** `goal_id` is `""`
- **THEN** validation passes

#### Scenario: Non-UUID non-empty string fails FK field validation
- **WHEN** `goal_id` is `"abc123"`
- **THEN** validation fails

### Requirement: Client processes rejected records from server with self-healing
The client SHALL handle `status: "rejected"` in push results. For healable cases (stale FK, invalid formats), the client SHALL apply self-healing corrections, set `syncStatus: "pending"`, and retry push (maximum 2 retries). For unhealable cases (invalid enum, corrupted ID), the client SHALL set `syncStatus: "rejected"`.

#### Scenario: Stale goal_id is healed and retried
- **WHEN** server rejects a task with `reason: "fk_violation:goal_id"`
- **THEN** client sets `goal_id = ""`
- **AND** sets `syncStatus: "pending"`
- **AND** retries push

#### Scenario: Stale task_id on checklist item is healed
- **WHEN** server rejects a checklist item with `reason: "fk_violation:task_id"`
- **THEN** client sets `is_deleted = true`
- **AND** sets `syncStatus: "pending"`
- **AND** retries push

#### Scenario: Invalid enum is not healable
- **WHEN** server rejects a task with `reason: "check_violation:status"`
- **THEN** client sets `syncStatus: "rejected"`
- **AND** does NOT retry

#### Scenario: Retry limit prevents infinite loop
- **WHEN** a record is rejected after 2 retry attempts
- **THEN** client sets `syncStatus: "rejected"`
- **AND** stops retrying

### Requirement: Server Edge Function logs rejected records
The push Edge Function SHALL log rejected records via `console.warn` with user ID, record count, entity type, record ID, and rejection reason.

#### Scenario: Zod-rejected records are logged
- **WHEN** 2 tasks fail Zod validation on server
- **THEN** server logs `[push] User <id>: 2 records rejected` with field-level details

#### Scenario: RPC-rejected records are logged
- **WHEN** 1 task is rejected by RPC with FK violation
- **THEN** server logs `[push] User <id>: 1 record rejected by RPC` with reason

### Requirement: Server extracts the fk_violation field name correctly for all tables
The `push_records` RPC SHALL derive the structured rejection reason `fk_violation:<field>` from the violated FK constraint name in a way that is correct even when the **table name contains underscores**. The extracted `<field>` SHALL be the FK reference column (the trailing `<word>_id` segment of the `<table>_<field>_fkey` constraint name), so that client self-healing (`pushRejectionHandler`) receives a field name it recognizes. Implements FR1, FR2, FR3 of fix-checklist-fk-self-heal.

#### Scenario: Checklist item FK violation yields task_id
- **WHEN** a `checklist_items` insert violates `checklist_items_task_id_fkey` (SQLSTATE 23503)
- **THEN** `push_records` returns `status: "rejected"` with `reason: "fk_violation:task_id"`
- **AND** NOT `reason: "fk_violation:items_task_id"`

#### Scenario: Task FK violations still yield their reference field
- **WHEN** a `tasks` insert violates `tasks_goal_id_fkey`, `tasks_context_id_fkey`, or `tasks_category_id_fkey`
- **THEN** `push_records` returns `reason: "fk_violation:goal_id"`, `"fk_violation:context_id"`, or `"fk_violation:category_id"` respectively

#### Scenario: Orphaned checklist item is healable (server backstop) and self-heals client-side
- **WHEN** the client pushes a checklist item whose `task_id` references a task that does not exist on the server (purged or foreign)
- **THEN** the server backstop rejects it with the healable `reason: "fk_violation:task_id"` (not the unhealable `"fk_violation:items_task_id"`)
- **AND** the client recognizes `task_id` as a delete-FK field, sets `is_deleted = true`, `syncStatus: "pending"`, and retries
- **AND** because the composite NOT NULL FK is enforced on INSERT regardless of `is_deleted`, the server never persists the dangling orphan — the item is instead removed client-side (SyncService orphan removal hard-deletes it before the next push, per cascade-checklist-delete FR3), so it is not left permanently `rejected`

Note: the end-to-end client-side heal is covered by `cascade_checklist_self_healing.feature`, `pushRejectionHandler.test.ts`, and `SyncService.self-healing.test.ts`. This change only corrects the server backstop's reason string, verified by the integration assertions above.
