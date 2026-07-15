# Tasks: fix-checklist-fk-self-heal

## 1. RPC fix (in-place edit)

- [ ] 1.1 `003_create_push_rpc.sql`: in all 8 `WHEN '23503'` branches, replace the regexp `^.*?_(.+?)_fkey$` with the underscore-safe `^.*_([a-z]+_id)_fkey$` so `checklist_items_task_id_fkey` yields `task_id` (FR1, FR3, FR4)
- [ ] 1.2 Confirm no other SQL logic changes in `003`; FK constraint names in `001_create_tables.sql` are unchanged (NG1, FR4)

## 2. Test updates

- [ ] 2.1 `packages/integration/src/tests/push-poison-pill-cross-tenant.spec.ts`: change the checklist FK case expectation from `fk_violation:items_task_id` to `fk_violation:task_id` and remove the now-obsolete "table name underscore" explanatory note (FR1, M1)
- [ ] 2.2 Add an end-to-end integration assertion: a checklist item referencing a non-existent/foreign task is rejected `fk_violation:task_id`, then a self-heal push with `is_deleted: true` succeeds (U1, U2, FR5)

## 3. Verification

- [ ] 3.1 Run only the cross-tenant spec to confirm the four `fk_violation:<field>` reasons, including `task_id` for checklist (M1, M2)
- [ ] 3.2 Run the entire existing integration suite once, at the end — no regressions (M3, NFR-P1)
- [ ] 3.3 Confirm migration file count is still 4 and no client code changed (M4, FR4, FR5)

## 4. Manual follow-up (user)

- [ ] 4.1 Recreate environments manually: `bash scripts/reset.sh dev|qa` (+ prod if needed) — outside the agent's scope
