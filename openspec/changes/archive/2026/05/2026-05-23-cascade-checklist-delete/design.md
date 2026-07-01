## Context

When a task is soft-deleted (`TaskService.softDelete`), its checklist_items are not cascaded. After purge, the task is physically removed from IndexedDB while its checklist_items remain as "orphans". During push, orphans cause an FK violation on the Supabase server.

Current code:
- `TaskService.softDelete(id)` — only sets `is_deleted = true` on the task + recurring chain logic
- `TaskService.restore(id)` — only sets `is_deleted = false` on the task
- `ChecklistService` — unaware of the task lifecycle relationship
- `SyncService._push()` — does not verify FK integrity before sending
- `ChecklistRepository` — no method to retrieve items by task_id

## Goals / Non-Goals

**Goals:**
- Cascading soft-delete/restore of checklist_items via TaskService (FR1, FR2)
- Self-healing before push to hard-delete orphans (FR3)
- `getByTaskId` method in ChecklistRepository (FR4)

**Non-Goals:**
- Server-side cascade enforcement (NG1)
- Post-pull integrity check (NG2)

## Decisions

### D1: Cascade is implemented in TaskService, not ChecklistService

**Decision**: TaskService calls ChecklistRepository for cascade operations.

**Alternative**: Event-based (TaskService emits event, ChecklistService subscribes). Rejected — overengineering for a single relationship, adds implicit coupling.

**Alternative**: ChecklistRepository.softDeleteByTaskId(). Rejected — violates SRP: repository should not contain cascade business logic.

### D2: Self-healing uses hard-delete, not soft-delete

**Decision**: Orphans (checklist_items with task_id pointing to a physically absent task) are deleted from IndexedDB without sending to the server.

**Rationale** (FR3): soft-delete + needsSync=true would send the orphan to the server, causing another FK violation. soft-delete + needsSync=false would leave garbage until purge. Hard-delete is the only clean solution.

### D3: Self-healing uses batch lookup

**Decision** (NFR-P1): Collect unique task_ids from checklist_items, subtract task_ids already present in push data, verify the rest with a single `db.tasks.bulkGet()`.

### D4: TaskService receives ChecklistRepository via dependency injection

**Decision**: TaskService already accepts dependencies through its constructor. Add ChecklistRepository as a new parameter.

## Risks / Trade-offs

- [Risk] Restore recovers manually deleted checklist items → Accepted as a deliberate decision. User can re-delete them. The alternative (tracking deletion reason) is too complex.
- [Risk] Self-healing hard-delete is irreversible → Mitigation: console.warn with details for debugging. Orphans are useless without their task; data loss is minimal.
- [Risk] Changing the TaskService constructor breaks existing tests → Mitigation: add as optional parameter or update tests.
