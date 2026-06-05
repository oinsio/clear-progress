## Context

The Task entity already has `is_hidden` (boolean) and `appear_date` (ISO date string) fields, used exclusively by the recurring task system. `HiddenTaskService.revealHiddenTasks()` auto-reveals tasks when `appear_date <= logicalDate`. The CommandBar eye toggle and `useTasks` filtering already handle hidden task visibility. The only missing piece is UI for manual hide/unhide of non-recurring tasks.

Key existing files:
- `packages/client/src/services/TaskService.ts` — `update()` already accepts `is_hidden` and `appear_date`
- `packages/client/src/services/HiddenTaskService.ts` — auto-reveal logic
- `packages/client/src/hooks/useHiddenTasksReveal.ts` — reveal triggers (app open, sync, day boundary)
- `packages/client/src/components/tasks/TaskQuickActions.tsx` — quick edit menu (424 lines)
- `packages/client/src/components/tasks/TaskDetailPanel.tsx` — full edit panel (~770 lines)

## Goals / Non-Goals

**Goals:**
- Reuse existing `is_hidden`/`appear_date` infrastructure for manual hiding (FR1, FR2)
- Add hide/unhide UI to both TaskQuickActions (FR3) and TaskDetailPanel (FR4)
- Clear hide state when completing a manually hidden task (FR6)

**Non-Goals:**
- No new database fields or schema changes (NG2 from proposal — G2)
- No custom calendar widget — native `<input type="date">` (NG2)
- No changes to `HiddenTaskService` reveal logic (FR7, FR8 already work)

## Decisions

### D1: Native `<input type="date">` for date picker

**Decision**: Use native HTML date input wrapped in a thin `DatePickerInput` component.

**Alternatives considered**:
- Custom calendar component — significant effort, out of scope
- Third-party library (react-datepicker, etc.) — adds dependency, bundle size

**Rationale**: Native input works excellently on mobile PWAs (uses OS date picker), returns `YYYY-MM-DD` matching our `ISODate` format, is accessible by default, and requires zero dependencies. Addresses NFR-A2, NFR-R1.

### D2: Shared `HideTaskPanel` component

**Decision**: Extract hide/unhide UI into `HideTaskPanel.tsx`, used by both TaskQuickActions and TaskDetailPanel.

**Rationale**: Both parent components already exceed the 200-line file size target. A shared component avoids duplication and keeps each file focused. The panel has two modes:
- Non-hidden task: date picker + "Hide" button (disabled until valid future date)
- Hidden task: formatted appear date + "Unhide" button

### D3: Exclude recurring tasks from manual hide UI

**Decision**: Hide/unhide controls are only rendered when `!task.repeat_rule`. Driven by FR5.

**Rationale**: Recurring tasks already manage `is_hidden` and `appear_date` through their own `advance_days` mechanism in `TaskService.complete()`. Allowing manual override would create conflicting state.

### D4: Clear hide state on completion of manually hidden task

**Decision**: In `TaskService.complete()`, if `task.is_hidden && !task.repeat_rule`, additionally set `is_hidden = false` and `appear_date = ""`. Driven by FR6.

**Rationale**: A completed task should not remain hidden — it moves to the completed list. The condition `!task.repeat_rule` ensures we don't interfere with the recurring task completion flow.

### D5: Validation is UI-only

**Decision**: Future-date validation lives in `HideTaskPanel` (Temporal comparison + native `min` attribute). No validation in `TaskService.update()`.

**Rationale**: `TaskService.update()` is a generic method accepting any partial changes. Adding hide-specific validation there couples the service to UI concerns. The `min` attribute on the native input provides browser-level enforcement, and the "Hide" button is disabled until validation passes.

### D6: GoalDetailPage respects eye toggle for hidden tasks

**Decision**: Add `showHidden` support to `useGoalTasks` / `TaskRepository.getByGoalId()`. When eye toggle is on, hidden tasks appear in goal task lists. Driven by FR9.

**Alternatives considered**:
- Leave as-is (hidden tasks invisible on goal page) — inconsistent with ActiveTasksPage behavior
- Separate change — delays fix, but this is a pre-existing bug for recurring hidden tasks too

**Rationale**: The eye toggle already exists on GoalDetailPage but has no effect because `getByGoalId()` hard-filters `!is_hidden` at the repository level. Two approaches:
1. Add `includeHidden` parameter to `getByGoalId()` — repository returns all, hook filters
2. Separate `getByGoalIdIncludingHidden()` method

Approach 1 is cleaner: `getByGoalId(goalId, { includeHidden?: boolean })`. The `useGoalTasks` hook reads `showHidden` from context and passes it through. Same pattern can later apply to `getByCategoryId`/`getByContextId` if needed.

### D7: Duplicate always creates visible copy

**Decision**: `TaskService.duplicate()` explicitly sets `is_hidden = false` and `appear_date = ""` on the copy. Driven by FR10.

**Rationale**: Duplicating a hidden task is likely done to create a working copy while keeping the original deferred. Creating a hidden duplicate with the same `appear_date` would be confusing — user would see two identical tasks appear on the same date.

### D8: Move `repeat.appearDate` i18n key to `task.appearDate`

**Decision**: Rename the i18n key from `repeat.appearDate` to `task.appearDate` since it now applies to all hidden tasks, not just recurring ones. Driven by FR11.

**Rationale**: The key is used in `TaskItem.tsx` for ALL hidden tasks. Keeping it under `repeat.*` namespace is semantically incorrect for manually hidden non-recurring tasks. Update both `en.json`, `ru.json`, and all usage sites.

## Risks / Trade-offs

- **[Native date picker styling]** Appearance varies by browser/OS on desktop. Mobile PWA experience is excellent. → Acceptable for MVP; can replace with custom component later.
- **[No server-side validation]** A malicious or buggy client could set `appear_date` to a past date. → Low risk for a personal app. Server can add validation if needed.
