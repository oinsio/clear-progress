# Tasks: fix-recurring-completion-error-masking

## 1. Impact scan (do first)

- [ ] 1.1 `grep -rn "skipped_invalid_rule\|RecurringResult\|recurringResult.status" packages/` — enumerate every producer and consumer; confirm the four alert-raising call sites (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) and that `RecurringResult` is client-local (not re-exported from `packages/contract`). Record findings inline.

## 2. Extend the result union + split the catch (FR1, FR2, FR4)

- [ ] 2.1 RED: unit test — `complete()` on a task whose rule parses but whose copy creation throws (mock `taskRepository`/`create` to throw) returns `recurringResult.status === "error_creating_copy"`, the completed task is still returned/marked complete, and `console.error` is called (FR2)
- [ ] 2.2 RED: characterization test — `complete()` on a genuinely unparseable rule (`parseRepeatRule` → null) still returns `skipped_invalid_rule` and creates no copy (FR1, regression guard)
- [ ] 2.3 RED: characterization test — `created` and `not_recurring` paths unchanged (regression guard)
- [ ] 2.4 GREEN: add `{ status: 'error_creating_copy' }` to the `RecurringResult` union in `TaskService.ts`; change the `catch` block to return it (keep `console.error` + `finalCompletedTask`); leave the `if (!rule)` early return as `skipped_invalid_rule`; add `// implements FR1, FR2 of fix-recurring-completion-error-masking`
- [ ] 2.5 GREEN: run `npx vitest run` on `TaskService` completion tests — all green

## 3. Callers stop mislabeling (FR3)

- [ ] 3.1 RED: characterization test per hook (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) — completion yielding `error_creating_copy` raises NO `repeat_rule_invalid` alert; completion yielding `skipped_invalid_rule` still raises it (FR3)
- [ ] 3.2 GREEN: confirm each hook's alert condition is exact-match on `skipped_invalid_rule` (no code change needed) OR narrow it if any uses a looser check; add a `// implements FR3 of fix-recurring-completion-error-masking` comment documenting intent at each site
- [ ] 3.3 Exhaustiveness: make any `switch`/`if` chain over `recurringResult.status` handle `error_creating_copy` explicitly (default/else must not silently reuse invalid-rule wording); verify TypeScript build catches a missing case if the union is switched exhaustively

## 4. BDD (FR1, FR2, FR3)

- [ ] 4.1 BDD unit: `repeating_tasks/complete_copy_error.feature` + steps — scenarios for valid-rule-copy-throws → `error_creating_copy` + no invalid-rule alert, and unparseable-rule → `skipped_invalid_rule` + alert; tags `@fix-recurring-completion-error-masking @FR1 @FR2 @FR3`

## 5. Verification

- [ ] 5.1 `pnpm run build` green (type-checks the extended union across all consumers)
- [ ] 5.2 Mutation run (scoped, wait for completion): `src/services/TaskService.ts` plus the changed hook file(s) — score >= 95% (min 90%); kill survivors (M3)
- [ ] 5.3 `get_file_problems` via JetBrains MCP on all changed files — clean
- [ ] 5.4 Traceability grep: every FR1–FR4 and M1–M3 has an implementing test/artifact; BDD scenarios carry `@fix-recurring-completion-error-masking @FR-X` tags
- [ ] 5.5 Regression: existing `invalid-repeat-rule-detection` and `repeating-tasks` suites green (the parse-null alert path and pull-time detection unchanged) — M2
