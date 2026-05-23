## Context

The `tasks.original_task_id` column has a FK constraint `REFERENCES tasks(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED`. This is a self-referencing FK — a task references another task in the same table. The field is used by the client to link recurring task clones to their original.

During incremental push, the client only sends dirty records. A clone with `original_task_id` can end up in a push without the original → FK violation → 500 error. This issue is specific to self-references: cross-table FKs (goal_id, context_id, category_id) work correctly thanks to dependency order processing.

Driven by FR1, FR3 from proposal.

## Goals / Non-Goals

**Goals:**
- Eliminate FK violation when pushing tasks with `original_task_id`
- Minimal change — only remove the constraint

**Non-Goals:**
- Modifying the `push_records` RPC function (not needed after FK removal)
- Changing client-side logic
- Removing other FK constraints

## Decisions

### D1: Remove FK instead of adding EXISTS check in RPC

**Decision**: Remove the FK constraint from `original_task_id`.

**Alternative**: Add an EXISTS check in the `push_records` RPC — if the original is not found, substitute NULL.

**Why remove FK**:
- The server does not use `original_task_id` — no JOINs, no filtering. The FK provides no practical value.
- An EXISTS check masks an architectural mismatch: FK implies server-side validation, but in client-first architecture the source of truth is the client.
- Soft delete (`is_deleted = true`) means `ON DELETE SET NULL` will never fire — records are never physically deleted.
- Removing FK is a one-line migration change, with no changes needed in RPC or client.

### D2: Edit existing migration 001

**Decision**: Modify `001_create_tables.sql` directly (pre-production, migrations are not yet finalized).

**Alternative**: Create a new migration 004 with `ALTER TABLE ... DROP CONSTRAINT`.

**Why edit 001**: The project is in pre-production with no deployed databases depending on the current migration version. Direct editing is simpler and avoids unnecessary migration files.

## Risks / Trade-offs

- [Loss of referential integrity on server] → Acceptable: the server is a storage layer, the client is the source of truth. An `original_task_id` with a non-existent UUID will not cause issues on the server.
- [Garbage data from client bug] → Low risk: the value is only written in `createRecurringCopy` and `softDelete`, both functions are covered by tests.
