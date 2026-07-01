## 1. Shared validator (FR1)

- [x] 1.1 TDD: `isRepeatRuleInvalid()` in `src/utils/repeatRule.ts` — tests for invalid JSON, unknown type, empty string, valid rule
- [x] 1.2 Mutation testing on `repeatRule.ts` — verify >=95% score on new code (94.7% overall, new code 100%)

## 2. Discriminated union for complete() (FR2)

- [x] 2.1 Define `RecurringResult` type: `'created' | 'skipped_invalid_rule' | 'not_recurring'`
- [x] 2.2 TDD: Refactor `TaskService.complete()` to return `recurringResult` instead of `recurring: Task | null`
- [x] 2.3 Update all 4 call sites (`useTasks`, `useInboxTasks`, `useTask`, `useTaskMutations`) to use new return type
- [x] 2.4 Update existing completion tests to assert on `recurringResult.status`
- [x] 2.5 Mutation testing on `TaskService.ts` complete method — verify >=95% (98.4%)

## 3. AlertProvider (FR6, FR7, FR8, NFR-A1)

- [x] 3.1 Define `AppAlert` discriminated union type and `ALERT_TYPE_PRIORITY` constant
- [x] 3.2 TDD: `AlertProvider` — `addAlerts()`, `dismissAlerts()`, ordering by priority
- [x] 3.3 TDD: `AlertOverlay` — paginated navigation (counter, Back/Next/Understood buttons)
- [x] 3.4 Accessibility: focus trap, Escape handling, aria-labels with position
- [x] 3.5 Add i18n keys for alert navigation (ru.json + en.json): counter, button labels, aria-labels
- [x] 3.6 Wire `AlertProvider` into App.tsx provider tree (wraps around SyncProvider)
- [x] 3.7 Migrate SyncProvider: replace `pendingSyncAlerts`/`clearSyncAlerts` with `useAlerts().addAlerts()`
- [x] 3.8 Remove `SyncAlertQueue` and `SyncAlertOverlay` components — replaced by `AlertOverlay`
- [x] 3.9 Verify existing sync alert BDD tests pass with new AlertProvider flow

## 4. Task detail panel warning (FR3, UX1)

- [x] 4.1 Add i18n keys: `repeat.ruleNotRecognized` (ru + en)
- [x] 4.2 TDD: `TaskDetailsTab` shows amber "Rule not recognized" when `isRepeatRuleInvalid(task)` is true
- [x] 4.3 Verify normal flow: valid rule shows label, empty rule shows "No repeat"

## 5. Completion alert (FR4, UX2)

- [x] 5.1 TDD: Hook logic — when `recurringResult.status === 'skipped_invalid_rule'`, call `addAlerts()` with task name
- [x] 5.2 Add i18n keys: `repeat.invalidRuleAlertTitle`, `repeat.invalidRuleAlertMessage`, `repeat.invalidRuleAlertFix` (ru + en)
- [x] 5.3 Verify alert is dismissible and does not block completion flow (by design: addAlerts after complete, AlertOverlay has dismiss)

## 6. Post-pull diff check (FR5, FR9)

- [x] 6.1 TDD: Post-pull filter — extract active incomplete tasks with invalid rules from diff batch
- [x] 6.2 Wire into SyncProvider pull callback: call `addAlerts()` with grouped `repeat_rule_invalid` alert
- [x] 6.3 Add i18n keys: `repeat.invalidRulePullAlertTitle`, `repeat.invalidRulePullAlertMessage`, `repeat.invalidRulePullAlertFix` (ru + en)
- [x] 6.4 Verify: deleted/completed tasks in diff are excluded from alert

## 7. Repeat rule alert renderer (UX3, UX5)

- [x] 7.1 TDD: `RepeatRuleAlertContent` component — renders problem, fix instructions, task name list
- [x] 7.2 Register renderer in AlertOverlay type-to-component map
- [x] 7.3 Responsive: task list scrollable on small viewports (NFR-R1)

## 8. BDD scenarios

- [x] 8.1 Gherkin feature: `invalid_repeat_rule_detection.feature` — detail panel warning, completion alert, post-pull alert
- [x] 8.2 Gherkin feature: `alert_provider.feature` — paginated navigation, ordering, dismiss
- [x] 8.3 Step definitions for both features (vitest-cucumber)

## 9. Final verification

- [x] 9.1 `pnpm run build` — no type errors, no warnings
- [x] 9.2 Mutation testing on all changed files — repeatRuleValidation 100%, AlertProvider 89.5%, TaskService 98.4%, repeatRule 94.7%
- [x] 9.3 Run full BDD suite for repeating tasks and sync features — no regressions (453 tests passed)
