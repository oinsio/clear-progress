# Design: fix-recurring-completion-error-masking

Context: driven by FR1–FR7 from `proposal.md`.

## Context

`TaskService.complete()` (`packages/client/src/services/TaskService.ts`) parses the repeat rule and, on success, calculates the next date and creates/updates a recurring copy — all inside one `try/catch`. Two distinct failure modes currently collapse into one return value:

1. `parseRepeatRule()` returns `null` → early return `{ status: 'skipped_invalid_rule' }` (the rule genuinely can't be parsed).
2. Anything *after* a successful parse throws (date math, `findHiddenRecurringTask`, `createRecurringCopy` → `create()` → `generateTopKey()`, checklist copy, a Dexie write) → the broad `catch` returns the **same** `{ status: 'skipped_invalid_rule' }`.

The `RecurringResult` union has three members (`created` | `skipped_invalid_rule` | `not_recurring`). Three live completion callers (`useTasks`, `useInboxTasks`, `useTaskMutations`) map `skipped_invalid_rule` → a `repeat_rule_invalid` alert, which renders the "Rule not recognized / could not be recognized" dialog. So mode (2) tells the user their (valid) rule is broken. A fourth hook, `useTask`, carries the same block but is dead code (no importers outside its own test) — removed by this change, see D5.

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

The live hooks currently do `if (recurringResult.status === 'skipped_invalid_rule') addAlerts([{ type: 'repeat_rule_invalid', ... }])`. That condition is already exact-match on `skipped_invalid_rule`, so **it needs no change to stop firing** for `error_creating_copy` — but each site gets a characterization test pinning "error status → no alert", and a short comment, so the behavior is intentional and guarded rather than incidental.

- **Alternative considered:** add a truthful generic alert for the error path. Deferred (NG1/Q1) to keep the change surgical; silent-but-logged matches the pre-existing "don't interrupt completion" intent, only without the *wrong* message.

### D3 — Extract a shared `useTaskCompletionAlerts` helper (FR5, FR6)

The impact scan (task 1.1) found the `if (recurringResult.status === 'skipped_invalid_rule') addAlerts(...)` block copy-pasted, with minor variations, across four completion hooks (`useTasks`, `useInboxTasks`, `useTaskMutations`, plus the dead `useTask` — removed per D5) — and found a further call site, `SearchPage.tsx`, that discards `recurringResult` entirely and never alerts at all. This is the concrete "same action, different behavior per page" symptom the user flagged.

Extract a single helper, `packages/client/src/hooks/useTaskCompletionAlerts.ts` (100–200 lines, alongside the existing `useMutationHelpers.ts`), that takes `recurringResult` + the task name and calls `addAlerts` exactly once, with the `error_creating_copy` case producing no alert (per D2) and `skipped_invalid_rule` producing the existing `repeat_rule_invalid` alert. The three live hooks replace their inline block with a call to this helper; `SearchPage.tsx`'s `handleCompleteTask` is updated to call it too, closing the silent-failure gap.

- **Why extract now, not defer:** the duplication is what let the sites drift and let `SearchPage.tsx` skip alerting entirely undetected. Fixing FR1–FR4 without touching the duplication would just add one more place (`error_creating_copy` handling) to keep in sync by hand.
- **Why not a bigger refactor:** `useGoalTasks.ts` already composes `useTaskMutations(...)` rather than reimplementing it — this follows the same existing composition pattern instead of introducing a new architecture (e.g. no `hooks/index.ts` barrel, no change to how `completeTask` is threaded through components). See NG5.
- **Naming:** `useTaskCompletionAlerts` — it's a hook only insofar as it may call `useAlerts()` internally; call sites use it as `raiseCompletionAlerts(recurringResult, taskName)` or similar plain function returned from the hook.

### D4 — Spec deltas mark the intent change

`invalid-repeat-rule-detection` and `repeating-tasks` deltas convert the "exception → skipped_invalid_rule" scenarios to "exception → error_creating_copy" and add "error path shows no invalid-rule alert". This is the source-of-truth change; the code follows it.

### D5 — Delete the dead `useTask` hook instead of refactoring it (FR7)

A follow-up usage scan (recorded in task 2.1) found `useTask.ts` has no importers anywhere in `packages/client/src` — only `useTask.test.ts` references it. No page or component consumes the hook; its functionality is covered by `useTaskMutations`/`useTasks`.

Delete `useTask.ts` + `useTask.test.ts` early (section 2 of tasks, before the union extension), so FR3/FR5 and the mutation-testing scope cover only live code.

- **Alternative — refactor it along with the live hooks:** rejected; spending TDD + mutation-testing effort (>=95% score) on code no user path can reach is waste.
- **Alternative — a separate removal change:** rejected; the file is one of the copy-pasted alert sites, squarely inside this change's blast radius. Deleting it first shrinks this change instead of coordinating two changes over the same lines.

## Risks / Trade-offs

- [A consumer does a non-exhaustive `switch` on `recurringResult.status` and silently drops the new case] → TypeScript's discriminated union + the existing `not_recurring`/`created` handling make the live call sites explicit; a repo grep for `recurringResult.status` / `skipped_invalid_rule` in the tasks confirms every consumer is reviewed.
- [`useTask` is secretly used (dynamic import, planned feature) and its deletion breaks something] → the grep in task 2.1 (word-boundary, whole `src`) found zero importers; `pnpm run build` + the unit suite after deletion are the guard. If a future feature needs a single-task hook, it can be recreated on top of `useTaskCompletionAlerts`.
- [Silent failure: the next occurrence isn't created and the user sees nothing] → Same visibility as today for the error path (it was already swallowed); the only change is removing a *false* explanation. Q1 tracks a future truthful alert.
- [Type change ripples to the in-memory adapter or contract types] → `RecurringResult` is a client-local type in `TaskService.ts`; verify no re-export in `packages/contract`. If it is shared, extend there too (task 1.x covers the grep).
- [`SearchPage.tsx` behavior changes user-visibly for the first time — a genuinely invalid rule now alerts there when it silently didn't before] → intentional per FR6/U3; guarded by a characterization test showing prior silent behavior, then a test showing the new alert.

## Migration Plan

Pure additive type change + branch split, plus an extraction of existing duplicated logic into one helper (no behavior change to the three live hooks; `SearchPage.tsx` gains alerting it previously lacked) and deletion of the dead `useTask` hook (no runtime impact — nothing imports it). No data migration, no persisted-shape change, no server change. Rollback = revert the commit. Deploys with the normal client build.

## Open Questions

- Q1 (from proposal): whether `error_creating_copy` should later surface a truthful "couldn't create the next occurrence" alert. Out of scope here.
