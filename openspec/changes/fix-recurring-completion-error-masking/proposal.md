# fix-recurring-completion-error-masking

## Why

`TaskService.complete()` wraps recurring-copy creation in a broad `try/catch` that returns `{ status: 'skipped_invalid_rule' }` for **any** thrown error — even when the `repeat_rule` parsed fine and the failure was something else entirely (a DB write error, an invalid `sort_order` key, etc.). Completion hooks then show the user a "Rule not recognized / could not be recognized" alert, blaming the repeat rule for an unrelated failure. During the `fix-stale-sync-overwrites` work this misleading dialog actively masked the real cause of a failure (an invalid seeded sort key throwing in `generateKeyBetween`), costing debugging time and confusing the user with a wrong diagnosis.

## What Changes

- **MODIFIED**: `TaskService.complete()` returns a new, distinct `recurringResult` status for an unexpected exception during copy creation, separate from the genuine "rule failed to parse" case. `skipped_invalid_rule` is returned **only** when `parseRepeatRule()` returns `null`.
- **MODIFIED**: Completion callers (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) no longer raise the `repeat_rule_invalid` alert for the exception path — that alert stays reserved for genuinely invalid rules. The exception is still caught (completion never fails) and logged.
- **UNCHANGED (guarded by tests)**: Completion always succeeds regardless of `recurringResult`; the pull-time invalid-rule detection (`SyncProvider` → `filterTaskNamesWithInvalidRepeatRules`) and the task-detail-panel "Rule not recognized" warning are untouched; recurrence math is untouched.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `invalid-repeat-rule-detection`: "Completion returns discriminated union for recurring result" — the exception-during-copy-creation path returns a distinct status (not `skipped_invalid_rule`); "Alert shown on completion when recurring copy skipped due to invalid rule" — the `repeat_rule_invalid` alert fires only for genuinely invalid rules, not for the exception path.
- `repeating-tasks`: "System creates a recurring copy on task completion" — the `recurringResult` union gains a status for the copy-creation-error path; `skipped_invalid_rule` no longer covers "an exception occurred during copy creation".

## Goals

- G1: A completion where the repeat rule is valid but copy creation throws never tells the user their repeat rule is invalid.
- G2: `skipped_invalid_rule` (and its "Rule not recognized" alert) is a truthful signal — it appears if and only if `parseRepeatRule()` returned `null`.
- G3: Completion behavior is otherwise byte-for-byte unchanged: the task is still marked complete, the error is still swallowed (never interrupts completion) and logged.

## Non-Goals

- NG1: No new user-facing alert/dialog for the copy-creation-failure path. The unexpected error is logged (`console.error`) and completion proceeds silently; surfacing a dedicated "couldn't create the next occurrence" alert is a possible follow-up, out of scope here.
- NG2: No change to pull-time invalid-rule detection or the task-detail-panel warning label.
- NG3: No change to recurrence math, skip logic, or next-date/appear-date calculation.
- NG4: Not fixing the underlying throwers (e.g. invalid `sort_order` keys) — this change only stops mislabeling them; the sort-key seeding fix already landed in `fix-stale-sync-overwrites`.

## Users & Scenarios

- U1: A user completes a recurring task whose repeat rule is perfectly valid, but an internal error prevents the next occurrence from being created. The task is marked complete and the user is NOT shown a false "Rule not recognized" message.
- U2: A user completes a task whose repeat rule really is corrupt (unparseable). They still see the truthful "Rule not recognized" alert — unchanged from today.

## Requirements

### Functional

- FR1: `TaskService.complete()` SHALL return `{ status: 'skipped_invalid_rule' }` only when `parseRepeatRule(existingTask.repeat_rule)` returns `null`.
- FR2: When an exception is thrown after the rule parsed successfully (during next-date calculation or copy creation/update), `TaskService.complete()` SHALL catch it, log it via `console.error`, and return a distinct status `{ status: 'error_creating_copy' }` (name finalized in design). The completed task SHALL still be returned and marked complete.
- FR3: Completion callers that currently map `skipped_invalid_rule` → `repeat_rule_invalid` alert (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) SHALL NOT raise that alert for `error_creating_copy`.
- FR4: The `RecurringResult` discriminated union SHALL be extended (not repurposed) so exhaustive `switch`/`if` handling stays type-safe; existing `created` / `not_recurring` handling is unchanged.

### Non-Functional

#### Performance

- Not applicable — no new queries or loops.

#### Accessibility

- Not applicable — no new UI; a misleading alert is suppressed, not added.

#### Responsive

- Not applicable — no UI layout change.

## UX Acceptance Criteria

- UX1: After completing a recurring task whose rule is valid, the user never sees a "Rule not recognized" / "Repeat rule issue" alert caused by an unrelated internal error.
- UX2: After completing a task whose rule is genuinely unparseable, the "Rule not recognized" alert still appears exactly as before.

## UI States Matrix

No UI states change. The only user-visible effect is the ABSENCE of a wrong alert on the exception path; existing loading/error/empty/offline states are unaffected.

## Behavior

Scenarios live in feature files tagged `@fix-recurring-completion-error-masking @FR-X`:

- `packages/client/src/test/features/repeating_tasks/complete_copy_error.feature` — FR1, FR2, FR3 (unit BDD, vitest-cucumber): valid-rule-but-copy-throws → `error_creating_copy`, no invalid-rule alert; unparseable-rule → `skipped_invalid_rule` + alert.

## Visual Reference

Not applicable — no UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: Unit test proves an exception thrown during copy creation with a valid rule yields `error_creating_copy` and raises no `repeat_rule_invalid` alert.
- M2: Existing `skipped_invalid_rule` scenarios (parse returns null) stay green unchanged — the truthful alert path is preserved.
- M3: Mutation score on the changed `complete()` catch/branch and the caller alert mapping >= 95% (minimum acceptable 90%).

## Open Questions

- Q1: Should `error_creating_copy` eventually surface a truthful, generic "couldn't create the next occurrence" alert instead of failing silently? Deferred to NG1; revisit if users report silent failures.
