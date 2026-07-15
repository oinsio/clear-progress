# Design: fix-checklist-fk-self-heal

## Context

Driven by FR1–FR3 of the proposal. `push_records` (`003_create_push_rpc.sql`) turns a `23503` foreign-key violation into a structured reason string:

```sql
WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*?_(.+?)_fkey$', '\1')
```

The pattern `^.*?_(.+?)_fkey$` uses a lazy prefix `.*?_` that matches up to the **first** underscore, then captures everything before `_fkey`. This silently assumes the table name is a single token with no underscore:

- `tasks_goal_id_fkey` → prefix `tasks_`, capture `goal_id` ✓
- `checklist_items_task_id_fkey` → prefix `checklist_`, capture **`items_task_id`** ✗ (wanted `task_id`)

The client `pushRejectionHandler` matches the extracted field against `DELETE_FK_FIELDS = {task_id}`; `items_task_id` matches nothing, so the orphaned checklist item is left permanently `rejected` instead of soft-deleted. The existing `push-poison-pill-protection` spec already documents the intended client behavior ("Stale task_id on checklist item is healed" → `fk_violation:task_id`), so the client side is already correct — only the server's field extraction is wrong.

This regexp was already present before `add-composite-tenant-pk`; that change (correctly) named the composite FK `checklist_items_task_id_fkey` per the `<table>_<field>_fkey` convention, which is the same name Postgres auto-generated for the old inline FK. So the bug predates the composite-PK work and is unchanged by it — this change fixes it.

## Goals / Non-Goals

**Goals:**

- Correct FK-field extraction for table names containing underscores (FR1, FR3), without renaming constraints or changing the client (FR4, FR5, NG1–NG2).

**Non-Goals:**

- Renaming FK constraints; changing the client; changing the clearable/deletable field sets; data migration; the GAS backend (NG1–NG5 from the proposal).

## Decisions

### D1: Underscore-safe regexp anchored on the trailing `<field>_id` segment

Implements FR1, FR2, FR3. Replace the pattern in all 8 inline `WHEN '23503'` branches with:

```sql
WHEN '23503' THEN 'fk_violation:' || regexp_replace(v_constraint_name, '^.*_([a-z]+_id)_fkey$', '\1')
```

The greedy prefix `^.*_` consumes as much as possible, so the capture `([a-z]+_id)` binds to the **last** `<word>_id` segment immediately before `_fkey`:

- `checklist_items_task_id_fkey` → `task_id` ✓
- `tasks_goal_id_fkey` → `goal_id` ✓
- `tasks_context_id_fkey` → `context_id` ✓
- `tasks_category_id_fkey` → `category_id` ✓

This keeps the `<table>_<field>_fkey` naming convention intact and requires no client change. All FK reference fields in the schema follow the `<word>_id` shape, so the pattern is exhaustive for the current model. If a constraint name does not match (e.g. a future FK field not ending in `_id`), `regexp_replace` returns the name unchanged — the same fallback behavior as today, so no regression.

### D2: Edit all 8 occurrences in place; no shared helper (this change)

The regexp is duplicated inline across the eight per-entity exception handlers. Replacing all eight identically is a minimal, low-risk diff. Extracting a shared plpgsql helper (`parse_fk_field(constraint_name)`) would reduce duplication but expands the diff and surface area; noted as a possible future refactor, out of scope here.

### D3: In-place migration edit, manual environment recreation

Implements FR4. Consistent with `add-composite-tenant-pk`: no production data yet, so `003_create_push_rpc.sql` is edited in place (file count stays 4, M4) and the user recreates environments via `scripts/reset.sh`.

## Risks / Trade-offs

- [Pattern assumes FK fields end in `_id`] → all current FK fields (`goal_id`, `context_id`, `category_id`, `task_id`) match; non-matching names fall back to the raw constraint name (no worse than today). Verified by the integration assertions.
- [Editing an already-applied migration diverges from deployed environments] → deliberate; the user re-runs `scripts/reset.sh` (same as the composite-PK change). Visible in git history.
- [Regexp change could accidentally alter the `tasks` FK reasons] → covered by the existing cross-tenant integration assertions for `goal_id`/`context_id`/`category_id` plus a full suite run (M2, M3).

## Migration Plan

1. Update the 8 `WHEN '23503'` branches in `003_create_push_rpc.sql`.
2. Update the checklist assertion in `push-poison-pill-cross-tenant.spec.ts` to expect `fk_violation:task_id`, and add an end-to-end self-heal assertion for an orphaned checklist item.
3. Run the integration suite once (Testcontainers rebuilds the schema).
4. The user recreates environments (`bash scripts/reset.sh <env>`).

Rollback: git revert of the migration edit + re-reset of environments.

## Open Questions

_none._
