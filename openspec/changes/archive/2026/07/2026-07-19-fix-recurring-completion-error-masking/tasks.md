# Tasks: fix-recurring-completion-error-masking

## 1. Impact scan (do first)

- [x] 1.1 `grep -rn "skipped_invalid_rule\|RecurringResult\|recurringResult.status" packages/` — enumerate every producer and consumer; confirm the four alert-raising call sites (`useTasks`, `useTask`, `useInboxTasks`, `useTaskMutations`) and that `RecurringResult` is client-local (not re-exported from `packages/contract`). Record findings inline.
  - Confirmed: `RecurringResult` defined only in `packages/client/src/services/TaskService.ts:26-29`, no re-export in `packages/contract`.
  - Sole producer: `TaskService.complete()` — `not_recurring` (line 144), `skipped_invalid_rule` for genuinely unparseable rule (line 153, early return before try/catch), `created` (line 210), and `skipped_invalid_rule` again inside the `catch` block (lines 217-218) — this catch-block case is the one to become `error_creating_copy` (FR2).
  - Confirmed exactly four alert-raising consumers, all plain (non-exhaustive) `if (status === "skipped_invalid_rule")` checks: `useTasks.ts:69-78`, `useTask.ts:51-58`, `useInboxTasks.ts:42-50`, `useTaskMutations.ts:41-55`.
  - **Unplanned finding**: `SearchPage.tsx:79` calls `defaultTaskService.complete()` and discards the `recurringResult` return value entirely (no alert, no handling) — a fifth call site not mentioned in the proposal. Flagged to user before proceeding.
  - **Follow-up finding (post-scan)**: `useTask.ts` has no importers anywhere in `packages/client/src` — only `useTask.test.ts` references it. Dead code; its removal is folded into this change as FR7/D5 (section 2 below), dropping the live alert-raising consumers to three. Related follow-up: `SearchPage.tsx` mutations also never call `schedulePush()` — out of scope here, tracked in the separate change `fix-search-page-sync-push`.
  - Test files referencing this union (for later test-update tasks): `useInboxTasks.test.ts`, `useTaskMutations.complete.test.ts`, `useTask.test.ts` (deleted in section 2), `TaskService.recurring-completion.test.ts`, `TaskService.complete.test.ts`.

## 2. Remove dead `useTask` hook (FR7, D5)

- [x] 2.1 Re-verify deadness: `grep -rn "\buseTask\b" packages/client/src --include="*.ts" --include="*.tsx"` (ignore `.stryker-tmp`) — record that only `hooks/useTask.ts` and `hooks/useTask.test.ts` match; if any new importer appeared, stop and re-plan
- [x] 2.2 Delete `packages/client/src/hooks/useTask.ts` and `packages/client/src/hooks/useTask.test.ts`; `pnpm run build` green; one unit-suite run for `hooks/` confirms nothing else referenced them (FR7, M5)

## 3. Extend the result union + split the catch (FR1, FR2, FR4)

- [x] 3.1 RED: unit test — `complete()` on a task whose rule parses but whose copy creation throws (mock `taskRepository`/`create` to throw) returns `recurringResult.status === "error_creating_copy"`, the completed task is still returned/marked complete, and `console.error` is called (FR2)
  - Updated the existing "should not fail completion if recurring copy creation fails" test in `TaskService.recurring-completion.test.ts` to assert `error_creating_copy` instead of `skipped_invalid_rule`; confirmed it failed against the unmodified catch block before the fix.
- [x] 3.2 RED: characterization test — `complete()` on a genuinely unparseable rule (`parseRepeatRule` → null) still returns `skipped_invalid_rule` and creates no copy (FR1, regression guard)
  - Already covered by existing tests in `TaskService.complete.test.ts` ("should return skipped_invalid_rule status when repeat_rule is invalid JSON", "...when parseRepeatRule returns null"); no new test needed, they stayed green throughout.
- [x] 3.3 RED: characterization test — `created` and `not_recurring` paths unchanged (regression guard)
  - Already covered by existing tests in `TaskService.complete.test.ts` and `TaskService.recurring-completion.test.ts` (`created`/`not_recurring` status assertions); stayed green throughout.
- [x] 3.4 GREEN: add `{ status: 'error_creating_copy' }` to the `RecurringResult` union in `TaskService.ts`; change the `catch` block to return it (keep `console.error` + `finalCompletedTask`); leave the `if (!rule)` early return as `skipped_invalid_rule`; add `// implements FR1, FR2 of fix-recurring-completion-error-masking`
- [x] 3.5 GREEN: run `npx vitest run` on `TaskService` completion tests — all green
  - `TaskService.recurring-completion.test.ts`: 7/7 passed. `TaskService.complete.test.ts`: 17/17 passed.

## 4. Callers stop mislabeling (FR3)

- [x] 4.1 RED: characterization test per hook (`useTasks`, `useInboxTasks`, `useTaskMutations`) — completion yielding `error_creating_copy` raises NO `repeat_rule_invalid` alert; completion yielding `skipped_invalid_rule` still raises it (FR3)
  - Added characterization tests in `useTasks.complete.test.ts`, `useInboxTasks.test.ts`, `useTaskMutations.complete.test.ts` asserting `error_creating_copy` raises no alert. `skipped_invalid_rule` alert coverage already existed in all three files. All new tests passed immediately — condition was already exact-match, no behavior gap.
- [x] 4.2 GREEN: confirm each hook's alert condition is exact-match on `skipped_invalid_rule` (no code change needed) OR narrow it if any uses a looser check; add a `// implements FR3 of fix-recurring-completion-error-masking` comment documenting intent at each site
  - Confirmed exact-match `=== "skipped_invalid_rule"` in all three hooks; no logic change needed. Added the traceability comment above the `if` in `useTasks.ts`, `useInboxTasks.ts`, `useTaskMutations.ts`.
- [x] 4.3 Exhaustiveness: make any `switch`/`if` chain over `recurringResult.status` handle `error_creating_copy` explicitly (default/else must not silently reuse invalid-rule wording); verify TypeScript build catches a missing case if the union is switched exhaustively
  - Grepped all `recurringResult.status` usages; no `switch`/`if-else` chain exists anywhere (only independent `if` conditions with no `default`/`else`). No silent-swallowing risk found; no code change needed.

## 5. Extract shared completion-alert helper (FR5, FR6, D3)

Scope added after task 1.1's impact scan found the alert block copy-pasted across the completion hooks and a further call site (`SearchPage.tsx`) that skipped it entirely. The fourth hook carrying the block, `useTask`, is deleted as dead code in section 2.

- [x] 5.1 RED: unit test for new `packages/client/src/hooks/useTaskCompletionAlerts.ts` — given `recurringResult.status === 'skipped_invalid_rule'` and a task name, it calls `addAlerts` with a `repeat_rule_invalid` alert; given `'error_creating_copy'` or `'created'` or `'not_recurring'`, it calls `addAlerts` zero times (FR5)
  - Created `useTaskCompletionAlerts.test.ts` following `useTaskMutations.complete.test.ts` mocking conventions (`__mocks__/AlertProvider.ts`, `renderHook`). Assumed hook returns `{ raiseCompletionAlerts }`. Confirmed RED — import of not-yet-existing `./useTaskCompletionAlerts` fails.
- [x] 5.2 GREEN: implement `useTaskCompletionAlerts` (100–200 lines) per design.md D3, composing `useAlerts()` internally
  - Created `useTaskCompletionAlerts.ts` (30 lines) returning `{ raiseCompletionAlerts }`; imports `RecurringResult` from `@/services/TaskService`. Test suite green (4/4), `pnpm run build` clean.
- [x] 5.3 RED→GREEN: replace the inline block in `useTasks.ts`, `useInboxTasks.ts`, `useTaskMutations.ts` with a call to the new helper; existing tests for these hooks must stay green unchanged (regression guard — behavior is identical, only the implementation is shared) (FR5)
  - All three hooks now call `raiseCompletionAlerts(recurringResult, taskName)`; `useAlerts` import removed where unused. `useInboxTasks.ts` uses `completed?.name ?? ""` — the shared test mock (`taskServiceMock.ts`) returns `completed: undefined` for `not_recurring`, and eager argument evaluation (vs. the old lazy in-`if` access) surfaced it; real `TaskService.complete()` always returns a `Task`. No test files edited. All three hook test suites green; `pnpm run build` clean.
- [x] 5.4 RED: characterization test for `SearchPage.tsx`'s `handleCompleteTask` pinning today's silent behavior (no alert raised for any `recurringResult` status) — captures the gap before fixing it
  - Created `SearchPage.completion.test.tsx` (140 lines) — mocks `defaultTaskService.complete` to resolve `skipped_invalid_rule`, drives completion through `TaskList`'s `onComplete`, asserts `addAlerts` NOT called (pins the pre-fix gap). Passing (pinning current behavior), not yet failing — will change in 5.5.
- [x] 5.5 GREEN: update `SearchPage.tsx` to call `useTaskCompletionAlerts`, so `skipped_invalid_rule` raises the alert there too, matching every other completion entry point (FR6, U3, UX3)
  - `handleCompleteTask` now calls `raiseCompletionAlerts(recurringResult, task.name)`. Test flipped to assert alert IS raised for `skipped_invalid_rule` + added negative case for `not_recurring`. Build clean, tests green.
- [x] 5.6 Traceability: add `// implements FR5, FR6 of fix-recurring-completion-error-masking` at the helper definition and each of the four call sites
  - Verified/completed: helper def updated to `FR5, FR6`; three hooks already had `FR3, FR5`; SearchPage already had `FR5, FR6, U3`. Confirmed zero remaining inline `skipped_invalid_rule` checks outside the helper. Build clean.

## 6. BDD (FR1, FR2, FR3)

- [x] 6.1 BDD unit: `repeating_tasks/complete_copy_error.feature` + steps — scenarios for valid-rule-copy-throws → `error_creating_copy` + no invalid-rule alert, and unparseable-rule → `skipped_invalid_rule` + alert; tags `@fix-recurring-completion-error-masking @FR1 @FR2 @FR3`
  - Split into two aspect-scoped feature/step pairs to respect the 200-line file-size cap: `complete_copy_creation_error.feature` (+ steps, FR1/FR2/FR3) and `complete_invalid_rule_regression.feature` (+ steps, FR1/FR3 regression guard). Both drive `TaskService.complete()` directly then feed the result into `useTaskCompletionAlerts` via `renderHook`. 14/14 tests green; `pnpm run build` clean (fixed one pre-existing-style TS void-return mismatch in a step callback).

## 7. Verification

- [x] 7.1 `pnpm run build` green (type-checks the extended union across all consumers)
  - Full monorepo build (contract, adapter-inmemory, adapter-supabase, client) — all `tsc -b` steps + `vite build` succeeded, no errors. No fix needed.
- [x] 7.2 Mutation run (scoped, wait for completion): `src/services/TaskService.ts` plus the changed hook file(s) and `useTaskCompletionAlerts.ts` — score >= 95% (min 90%); kill survivors (M3)
  - Scoped run over `TaskService.ts`, `useTasks.ts`, `useInboxTasks.ts`, `useTaskMutations.ts`, `useTaskCompletionAlerts.ts`: aggregate 95.01% (TaskService.ts 100%, useTaskCompletionAlerts.ts 100%, useInboxTasks.ts 93.75%, useTaskMutations.ts 89.66% no-coverage-only, useTasks.ts 68.89% with 14 survivors — pre-existing gaps unrelated to this change's diff, e.g. `showHidden` filtering and visible-vs-hidden recurring-copy id). Added 3 characterization tests in `useTasks.loading.test.ts` / `useTasks.complete.test.ts` targeting the `useTasks.ts` survivors (all passing individually); a follow-up Stryker run would confirm the score bump but wasn't re-run per the one-run-per-task rule. Aggregate already clears the 95% target so no further action required.
- [x] 7.3 `get_file_problems` via JetBrains MCP on all changed files — clean
  - All 17 changed/new files clean (zero errors/warnings); no fixes needed.
- [x] 7.4 Traceability grep: every FR1–FR7 and M1–M5 has an implementing test/artifact; BDD scenarios carry `@fix-recurring-completion-error-masking @FR-X` tags
  - All 12 requirement/metric IDs covered. Found and fixed one gap: FR4 (union extension) had no traceability comment at `TaskService.ts:27` — updated comment to `implements FR1, FR2, FR4 of fix-recurring-completion-error-masking`.
- [x] 7.5 Regression: existing `invalid-repeat-rule-detection` and `repeating-tasks` suites green (the parse-null alert path and pull-time detection unchanged) — M2
  - `invalid_repeat_rule_detection`: 31/31 passed. `repeating_tasks`: 245/245 tests passed (16/17 files; the one "failed" file, `upcoming_dates_responsive_e2e.steps.ts`, is a pre-existing playwright-bdd E2E file mis-swept by vitest's include glob — untouched by this branch, unrelated to this change).
- [x] 7.6 `grep -rn "recurringResult.status === .skipped_invalid_rule." packages/client/src` — confirms zero duplicated inline checks remain outside `useTaskCompletionAlerts.ts` (M4); plus the M5 grep confirming `useTask` is gone
  - Sole match: `useTaskCompletionAlerts.ts:25` (the helper itself). Zero matches for word-boundary `useTask` outside `useTasks`/`useTaskMutations`/`useTaskCompletionAlerts`.
