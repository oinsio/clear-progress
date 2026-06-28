## 1. Contract: Wire schema strengthening

- [x] 1.1 Strengthen FK fields in Wire schemas (`goal_id`, `context_id`, `category_id`, `original_task_id`): `z.string()` → `z.union([UUIDSchema, z.literal("")])` — FR2
- [x] 1.2 Ensure `PushItemResult` contains `reason?: string` — FR3

## 2. Client: needsSync → syncStatus refactoring

- [x] 2.1 Define `SyncStatus = "synced" | "pending" | "rejected"` type in `types/` — FR6
- [x] 2.2 Add Dexie migration v2: `needsSync: true` → `syncStatus: "pending"`, `false` → `"synced"` — FR6
- [x] 2.3 Replace `needsSync: boolean` with `syncStatus: SyncStatus` in all entity types — FR6
- [x] 2.4 Update all repository methods: `getNeedingSync()` → filter by `syncStatus: "pending"`, `update` with `syncStatus` — FR6
- [x] 2.5 Update SyncService: `stripDirty()`, `_applyEntityPushResults()`, `_applyPushResults()` — FR6
- [x] 2.6 Update all UI components using `needsSync` — FR6
- [x] 2.7 Run all existing tests — no regressions — FR6

## 3. Client: Zod validation of outgoing payload + self-healing

- [x] 3.1 Write unit tests for self-healing logic (TDD red phase) — FR1
- [x] 3.2 Implement self-healing functions for each healable case (table from decisions) — FR1
- [x] 3.3 Integrate Zod validation into SyncService before push — FR1
- [x] 3.4 Run unit tests (TDD green phase) — FR1

## 4. Server: Edge Function — per-record Zod + logging

- [x] 4.1 Add Zod validation of incoming records in push Edge Function — FR9
- [x] 4.2 Implement `console.warn` logging of rejected records — FR9

## 5. Server: RPC — per-record exception handling

- [x] 5.1 Add `SET CONSTRAINTS ALL IMMEDIATE` to beginning of `push_records` RPC — FR3
- [x] 5.2 Wrap each record in loop with `BEGIN...EXCEPTION WHEN OTHERS` — FR3
- [x] 5.3 Build structured `reason` from SQLSTATE and constraint name — FR3

## 6. Server: Purge — bump revision of dependent records

- [x] 6.1 In purge RPC: before DELETE, update dependent records (FK = NULL, revision = next_rev, updated_at = NOW()) — FR4
- [x] 6.2 Cover: goals → tasks.goal_id, contexts → tasks.context_id, categories → tasks.category_id, tasks → checklist_items.task_id — FR4

## 7. Client: rejected handling + self-healing + retry

- [x] 7.1 Write unit tests for server rejection handling (TDD red phase) — FR5
- [x] 7.2 Implement `status: "rejected"` handling in `_applyEntityPushResults` — FR5
- [x] 7.3 Implement self-healing for server rejections (by reason) — FR5
- [x] 7.4 Implement retry (max 2) after self-healing — FR5
- [x] 7.5 Run unit tests (TDD green phase) — FR5

## 8. Client: UI — rejected indicator + SyncAlertDialog

- [x] 8.1 Add red left border (`border-l-red-500`) for records with `syncStatus: "rejected"` — FR7
- [x] 8.2 Add amber left border (`border-l-amber-400`) for `syncStatus: "pending"` — FR7
- [x] 8.3 Create `SyncAlertDialog` component — FR8
- [x] 8.4 Create `SyncAlertQueue` for showing multiple dialogs sequentially — FR8, UX4
- [x] 8.5 Reset `syncStatus` to `"pending"` when editing a rejected record — UX2
- [x] 8.6 Add i18n keys for rejected messages and dialogs — FR8

## 9. Integration tests

- [x] 9.1 `push-poison-pill-fk.spec.ts`: purge goal on device A → push task with stale goal_id on B → self-heal → retry — M1
- [x] 9.2 `push-poison-pill-batch.spec.ts`: goal + task in one push, goal rejected → task FK-healed — M1
- [x] 9.3 `push-poison-pill-format.spec.ts`: corrupted fields → Zod catches → self-heal → push succeeds — M2
- [x] 9.4 `push-poison-pill-check.spec.ts`: invalid box/status → rejected → red border — M3
- [x] 9.5 `push-rejected-indicator.spec.ts`: rejected → red border → edit → amber → sync → transparent — M3
- [x] 9.6 `push-retry-limit.spec.ts`: self-heal + retry max 2 → rejected — M1

## 10. Verification

- [x] 10.1 `pnpm run build` — project builds without errors
- [x] 10.2 Mutation testing on changed files — target >=95%
- [x] 10.3 Existing unit tests pass without regressions (7222/7222, 15 E2E excluded)
