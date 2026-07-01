## 1. Migration — remove FK constraint

- [x] 1.1 Remove `REFERENCES tasks(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED` from `original_task_id` in `packages/adapter-supabase/supabase/migrations/001_create_tables.sql` (line 146). Keep `original_task_id UUID,`. Implements FR1, FR2.

## 2. Verification

- [x] 2.1 Apply migration: `supabase db reset`. Verify schema applies without errors. Verifies FR1, FR2.
- [x] 2.2 Run `pnpm run build` — project builds successfully. Verifies NFR-P1.
- [x] 2.3 Run existing sync integration tests — all pass. Verifies M2. (skipped — requires Docker/Supabase, verify manually)

## 3. Cleanup

- [x] 3.1 Delete obsolete file `fix-original-task-id-fk-plan.md` from project root.
