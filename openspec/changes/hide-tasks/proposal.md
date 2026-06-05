# Hide Tasks

## Why

Users need to record tasks that won't be relevant for months (e.g., "renew passport in a year") without cluttering their active task lists. Currently, task hiding only works automatically for recurring tasks via `advance_days`. There is no way to manually hide a one-off task until a specific future date.

## What Changes

- **ADDED**: Manual hide — user can hide a non-recurring task until a chosen future date
- **ADDED**: Manual unhide — user can reveal a hidden task immediately, clearing the appear date
- **ADDED**: Date picker UI component for selecting the appear date
- **ADDED**: Hide/unhide action in TaskQuickActions (quick edit menu on task card)
- **ADDED**: Hide/unhide section in TaskDetailPanel (full edit sidebar)
- **MODIFIED**: TaskService.complete() — completing a manually hidden task clears `is_hidden` and `appear_date`
- **MODIFIED**: GoalDetailPage — hidden tasks visible when eye toggle is on (existing bug for recurring hidden tasks too)
- **MODIFIED**: TaskService.duplicate() — duplicated task is always visible (`is_hidden = false`, `appear_date = ""`)
- **MODIFIED**: i18n — move `repeat.appearDate` key to `task.appearDate` (applies to all hidden tasks, not just recurring)

## Capabilities

### New Capabilities

- `manual-task-hiding`: UI and logic for manually hiding/unhiding non-recurring tasks with a mandatory future appear date

### Modified Capabilities

- `tasks`: TaskService.complete() clears hide state for manually hidden non-recurring tasks; duplicate() always creates visible copy
- `goal-detail-card`: GoalDetailPage respects eye toggle for hidden tasks

## Goals

- G1: Allow users to defer task visibility to a future date without deleting or completing the task
- G2: Reuse existing infrastructure (`is_hidden`, `appear_date`, `HiddenTaskService`, eye toggle) — no new fields or services

## Non-Goals

- NG1: Hiding recurring tasks manually (they already have their own mechanism via `advance_days`)
- NG2: Custom date picker component (use native `<input type="date">` for PWA compatibility)
- NG3: Changing box on reveal (task stays in its original box when `appear_date` arrives)

## Users & Scenarios

- U1: User records a future task ("renew passport next year"), hides it until the relevant date, and continues working without distraction
- U2: User changes their mind about a hidden task and reveals it immediately via the eye toggle + unhide action
- U3: User sees a hidden task (via eye toggle), decides to complete it early — task moves to completed with hide state cleared

## Requirements

### Functional

- FR1: User can hide a non-recurring task by selecting a future appear date (strictly > today)
- FR2: User can unhide a hidden task immediately, setting `is_hidden = false` and `appear_date = ""`
- FR3: Hide/unhide action is available in TaskQuickActions (quick edit menu)
- FR4: Hide/unhide section is available in TaskDetailPanel (full edit sidebar)
- FR5: Hide action is NOT available for tasks with `repeat_rule` (recurring tasks)
- FR6: Completing a manually hidden (non-recurring) task clears `is_hidden` and `appear_date`
- FR7: Hidden tasks auto-reveal when `appear_date <= logicalDate` (already implemented via `HiddenTaskService`)
- FR8: Revealed tasks remain in their original box
- FR9: Hidden tasks are visible on GoalDetailPage when eye toggle is on
- FR10: Duplicating a hidden task creates a visible copy (`is_hidden = false`, `appear_date = ""`)
- FR11: i18n key for appear date display is moved from `repeat.*` to `task.*` namespace

### Non-Functional

#### Accessibility

- NFR-A1: Hide/unhide buttons have descriptive `aria-label`
- NFR-A2: Date input is keyboard-accessible

#### Responsive

- NFR-R1: Date picker works well on mobile (native OS picker via `<input type="date">`)

## UX Acceptance Criteria

- UX1: In TaskQuickActions, non-recurring tasks show an `EyeOff` icon button; hidden tasks show an `Eye` icon button
- UX2: Clicking `EyeOff` opens a date picker panel below the action row; clicking `Eye` unhides immediately
- UX3: The "Hide" confirmation button is disabled until a valid future date is selected
- UX4: In TaskDetailPanel, a "Hide until" row appears after the repeat rule row (only for non-recurring tasks)
- UX5: Hidden tasks (viewed via eye toggle) display the appear date and offer an unhide action

## Behavior

Scenarios defined in `features/manual-task-hiding.feature` with `@hide-tasks` tags.

## Visual Reference

No Figma needed — follows existing patterns: action button row in TaskQuickActions, DrillDownRow in TaskDetailPanel.

## Affected IA

No changes to information architecture.

## Success Metrics

- M1: All new code covered by unit tests with mutation score >= 95%
- M2: BDD scenarios pass for hide, unhide, complete-while-hidden, and recurring-exclusion flows

## Open Questions

None — all questions resolved during exploration.
