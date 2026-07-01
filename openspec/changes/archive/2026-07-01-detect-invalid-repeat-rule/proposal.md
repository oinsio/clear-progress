# Detect Invalid Repeat Rule

## Why

When a task's `repeat_rule` JSON fails Zod validation (corrupted data, future schema version from a newer client), the recurring chain silently breaks: `TaskService.complete()` skips copy creation, and the detail panel shows "No repeat" instead of the actual (unparseable) rule. The user has no way to discover the problem until they notice the missing recurrence — which may be days later.

## What Changes

- ADDED: `AlertProvider` — universal alert system replacing per-feature alert state in SyncProvider
- ADDED: `isRepeatRuleInvalid()` — shared validator used across service, UI, and sync layers
- MODIFIED: `TaskService.complete()` — returns discriminated union instead of `Task | null` for recurring result
- MODIFIED: Task detail panel — shows "Rule not recognized" when `repeat_rule` is non-empty but unparseable
- ADDED: Alert dialog after pull — checks diff tasks for invalid repeat rules and shows grouped alert
- ADDED: Alert dialog on completion — warns user when recurring copy was not created due to invalid rule
- MODIFIED: Alert navigation — paginated `1/N` with back/next buttons instead of sequential queue

## Capabilities

### New Capabilities

- `alert-provider`: Universal alert provider with paginated navigation (1/N with back/next), replacing SyncProvider alert state. Supports multiple alert types rendered by type-specific components.
- `invalid-repeat-rule-detection`: Detection and user notification of unparseable repeat rules — shared validator, discriminated union from complete(), detail panel indicator, post-pull diff check, completion-time warning.

### Modified Capabilities

- `sync-alert-dialog`: Alert queue replaced by paginated navigation in AlertProvider. SyncAlertDialog component reused but rendered via AlertProvider instead of SyncProvider state.
- `repeating-tasks`: `complete()` return type changes from `{ completed: Task; recurring: Task | null }` to discriminated union with `status: 'created' | 'skipped_invalid_rule' | 'not_recurring'`.

## Goals

- G1: User discovers invalid repeat rules within one interaction (detail panel or completion), not days later
- G2: Universal alert system eliminates per-feature alert plumbing and supports future alert types

## Non-Goals

- NG1: Auto-repair or migration of invalid repeat rules — user must manually reconfigure
- NG2: Notification for deleted or completed tasks with invalid rules — only active incomplete tasks
- NG3: Server-side validation of repeat rules — client-only detection

## Users & Scenarios

- U1: User with a task whose repeat_rule was corrupted during sync — opens task detail, sees "Rule not recognized", reconfigures repeat
- U2: User completing a task with invalid rule — sees alert explaining no recurrence was created and how to fix it
- U3: User after pull receives tasks with invalid rules from another client version — sees grouped alert listing affected tasks

## Requirements

### Functional

- FR1: `isRepeatRuleInvalid(task)` returns true when `repeat_rule !== ""` and `parseRepeatRule()` returns null. Single source of truth for all detection points.
- FR2: `TaskService.complete()` returns `recurringResult` as discriminated union: `{ status: 'created'; task: Task }`, `{ status: 'skipped_invalid_rule' }`, `{ status: 'not_recurring' }`.
- FR3: Task detail panel shows localized "Rule not recognized" label and warning styling when `isRepeatRuleInvalid(task)` is true, instead of "No repeat".
- FR4: On task completion, if `recurringResult.status === 'skipped_invalid_rule'`, an alert is shown: problem description, how to fix, task name.
- FR5: After pull, system checks diff (new/changed) active incomplete tasks for invalid repeat rules. If found, shows one grouped alert: problem description, how to fix, list of task names.
- FR6: `AlertProvider` manages a typed alert queue. Components register alert renderers by type. Provider exposes `addAlerts()` and `dismissAlerts()`.
- FR7: Alert overlay shows paginated navigation: counter `1/N`, "Next" button when more alerts follow, "Back" button when previous alerts exist, "Understood" button on the last alert (or when single alert). Order: sync alerts first, then repeat rule alerts.
- FR8: SyncProvider delegates alert state to AlertProvider — `pendingSyncAlerts` and `clearSyncAlerts` removed from SyncProvider.
- FR9: Post-pull check only processes tasks from the current diff batch. If a task with invalid rule appears in a subsequent diff, it is shown again. No localStorage persistence of "already shown" state.

### Non-Functional

#### Accessibility — NFR-A1
Alert dialog must trap focus, handle Escape, support `aria-labelledby` and `aria-describedby`. Navigation buttons must have descriptive `aria-label` (e.g., "Alert 1 of 2, go to next").

#### Responsive — NFR-R1
Alert dialog must be usable on viewports from 320px. Task list in grouped alert must scroll if it exceeds viewport height.

## UX Acceptance Criteria

- UX1: In task detail, "Rule not recognized" row uses warning color (amber) to distinguish from normal "No repeat"
- UX2: Completion alert is dismissible with a single tap — does not block the completion flow
- UX3: Grouped post-pull alert lists task names so user can find and fix them
- UX4: Paginated navigation shows position (1/2) and allows moving back and forward between alerts without losing state
- UX5: Alert dialog text follows the order: problem → how to fix → list of affected entities

## Behavior

Reference to `features/invalid-repeat-rule-detection.feature` and `features/alert-provider.feature` with tags `@detect-invalid-repeat-rule`.

## Visual Reference

No Figma. Reuse existing `SyncAlertDialog` styling (white card, backdrop, rounded corners). Add amber accent for warning state in detail panel.

## Affected IA

No IA changes — alerts are overlay components, detail panel row is existing UI.

## Success Metrics

- M1: 100% of active tasks with invalid repeat_rule are surfaced to user (detail panel + post-pull alert)
- M2: 0 silent chain breaks — every completion of a task with invalid rule produces a user-visible alert
- M3: SyncProvider alert state fully migrated to AlertProvider with no behavioral regression

## Open Questions

None — all questions resolved during exploration.
