# Tasks: fix-checklist-fk-self-heal

## 1. RPC fix (in-place edit)

- [x] 1.1 `003_create_push_rpc.sql`: in all 8 `WHEN '23503'` branches, replace the regexp `^.*?_(.+?)_fkey$` with the underscore-safe `^.*_([a-z]+_id)_fkey$` so `checklist_items_task_id_fkey` yields `task_id` (FR1, FR3, FR4)
- [x] 1.2 Confirm no other SQL logic changes in `003`; FK constraint names in `001_create_tables.sql` are unchanged (NG1, FR4)

## 2. Test updates

- [x] 2.1 `packages/integration/src/tests/push-poison-pill-cross-tenant.spec.ts`: change the checklist FK case expectation from `fk_violation:items_task_id` to `fk_violation:task_id` and remove the now-obsolete "table name underscore" explanatory note (FR1, M1)
- [x] 2.2 Add a server-backstop integration assertion: a checklist item referencing a non-existent/foreign task is rejected `fk_violation:task_id`; re-pushing it as a tombstone (`is_deleted: true`, same foreign `task_id`) is **still** rejected `fk_violation:task_id` (the composite NOT NULL FK is enforced on INSERT regardless of `is_deleted`, so the orphan is never persisted server-side); pull confirms absence. The true end-to-end client heal is already covered by `cascade_checklist_self_healing.feature` / `pushRejectionHandler.test.ts` / `SyncService.self-healing.test.ts` (U1, U2, FR1, FR5)

## 3. Verification

- [x] 3.1 Run only the cross-tenant spec to confirm the four `fk_violation:<field>` reasons, including `task_id` for checklist (M1, M2) — 5/5 passed (34.9s)
- [x] 3.2 Run the entire existing integration suite once, at the end — no regressions (M3, NFR-P1) — 82/82 passed (3.9m)
- [x] 3.3 Confirm migration file count is still 4 and no client code changed (M4, FR4, FR5) — 4 migrations; only `003` + integration spec changed, no client diff

## 4. Manual follow-up (user)

- [x] 4.1 Recreate environments manually: `bash scripts/reset.sh dev|qa` (+ prod if needed) — outside the agent's scope
