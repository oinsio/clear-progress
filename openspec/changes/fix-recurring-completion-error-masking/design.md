# Design: fix-recurring-completion-error-masking

Context: driven by FR1–FR4 from `proposal.md`.

## Context

`TaskService.complete()` (`packages/client/src/services/TaskService.ts`) parses the repeat rule and, on success, calculates the next date and creates/updates a recurring copy — all inside one `try/catch`. Two distinct failure modes currently collapse into one return value:

1. `parseRepeatRule()` returns `null` → early return `{ status: 'skipped_invalid_rule' }` (the rule genuinely can't be parsed).
2. Anything *after* a successful parse throws (date math, `findHiddenRecurringTask`, `createRecurringCopy` → `create()` → `generateTopKey()`, checklist copy, a Dexie write) → the broad `catch` returns the **same** `{ status: 'skipped_invalid_rule' }`.

The `RecurringResult` union has three members (`created` | `skipped_invalid_rule` | `not_recurring`). Four completion callers (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) map `skipped_invalid_rule` → a `repeat_rule_invalid` alert, which renders the "Rule not recognized / could not be recognized" dialog. So mode (2) tells the user their (valid) rule is broken.

The `invalid-repeat-rule-detection` and `repeating-tasks` specs both currently *codify* this conflation ("Exception during copy creation returns skipped status"), so the specs must change too, not just the code.

## Goals / Non-Goals

**Goals:**
- Give the exception path its own status so callers can distinguish it and not lie to the user.
- Keep `skipped_invalid_rule` a truthful signal (parse-failure only).
- Preserve every other observable of completion: the task is still completed, the error is still swallowed and logged.

**Non-Goals:**
- No new user-facing alert type for the error path (NG1) — logged only.
- No changes to pull-time detection, the detail-panel warning, or recurrence math.
- Not fixing the underlying throwers.

## Decisions

### D1 — Add a fourth union member `error_creating_copy` (vs. reusing `skipped_invalid_rule` or a boolean flag)

Extend `RecurringResult` with `{ status: 'error_creating_copy' }`. The early `if (!rule)` return keeps `skipped_invalid_rule`; the `catch` block returns `error_creating_copy` (still `console.error`-logging, still returning `finalCompletedTask`).

- **Why a new member:** it makes the two causes type-distinct, so every `switch`/`if` over `recurringResult.status` is forced (by the discriminated union) to consider the new case — surfacing exactly the four caller sites that need review. Reusing `skipped_invalid_rule` can't fix the mislabel; a side boolean (`wasError`) would bypass exhaustiveness and re-introduce drift.
- **Naming:** `error_creating_copy` reads as "the copy couldn't be created due to an error", parallel to the existing snake_case statuses.

### D2 — Callers ignore `error_creating_copy` for alerting (no new alert)

The four hooks currently do `if (recurringResult.status === 'skipped_invalid_rule') addAlerts([{ type: 'repeat_rule_invalid', ... }])`. That condition is already exact-match on `skipped_invalid_rule`, so **it needs no change to stop firing** for `error_creating_copy` — but each site gets a characterization test pinning "error status → no alert", and a short comment, so the behavior is intentional and guarded rather than incidental.

- **Alternative considered:** add a truthful generic alert for the error path. Deferred (NG1/Q1) to keep the change surgical; silent-but-logged matches the pre-existing "don't interrupt completion" intent, only without the *wrong* message.

### D3 — Spec deltas mark the intent change

`invalid-repeat-rule-detection` and `repeating-tasks` deltas convert the "exception → skipped_invalid_rule" scenarios to "exception → error_creating_copy" and add "error path shows no invalid-rule alert". This is the source-of-truth change; the code follows it.

## Risks / Trade-offs

- [A consumer does a non-exhaustive `switch` on `recurringResult.status` and silently drops the new case] → TypeScript's discriminated union + the existing `not_recurring`/`created` handling make the four call sites explicit; a repo grep for `recurringResult.status` / `skipped_invalid_rule` in the tasks confirms every consumer is reviewed.
- [Silent failure: the next occurrence isn't created and the user sees nothing] → Same visibility as today for the error path (it was already swallowed); the only change is removing a *false* explanation. Q1 tracks a future truthful alert.
- [Type change ripples to the in-memory adapter or contract types] → `RecurringResult` is a client-local type in `TaskService.ts`; verify no re-export in `packages/contract`. If it is shared, extend there too (task 1.x covers the grep).

## Migration Plan

Pure additive type change + branch split; no data migration, no persisted-shape change, no server change. Rollback = revert the commit. Deploys with the normal client build.

## Open Questions

- Q1 (from proposal): whether `error_creating_copy` should later surface a truthful "couldn't create the next occurrence" alert. Out of scope here.
