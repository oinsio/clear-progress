# fix-goal-status-edit-mode

## Why

On the goal edit page (`GoalDetailPage`), when changing status to "Completed" or "Cancelled", the change is written to IndexedDB immediately via `goalService.updateStatus()`, without waiting for the "Save" button to be pressed. The self-healing mechanism in `useFocusedGoals` (polling every 100ms) detects the changed status and removes the goal from focus before saving. This violates the `goal-focus` specification (Requirement: Auto-cleanup of invalid focused goals), which explicitly requires that focus should be reset **only after saving** to IndexedDB.

## What Changes

- **MODIFIED**: `GoalDetailPage` — `handleStatusChange` in edit mode will save status to local form state, not write to DB directly. Writing to DB — only when "Save" is pressed. On "Cancel" — revert to original status.

## Goals

- **G1**: Changing goal status in edit mode should not be saved to DB until "Save" is pressed
- **G2**: Focus on a goal with "Completed"/"Cancelled" status should be reset only after saving

## Non-Goals

- **NG1**: Changing self-healing logic in `useFocusedGoals` — it works correctly, the problem is premature DB write
- **NG2**: Changing status behavior outside edit mode (e.g., via sync)

## Users & Scenarios

- **U1**: User opens edit mode for a focused goal, changes status to "Completed", changes their mind and presses "Cancel" — goal remains in focus with previous status
- **U2**: User opens edit mode for a focused goal, changes status to "Cancelled", presses "Save" — goal is saved with new status, focus is reset

## Requirements

### Functional

- **FR1**: In edit mode, goal status change MUST be saved to component local state, not to IndexedDB
- **FR2**: When "Save" is pressed, local status MUST be written to IndexedDB along with other form fields
- **FR3**: When "Cancel" is pressed, local status MUST be reset to the value from IndexedDB

### Non-Functional

- No additional NFRs — the fix doesn't change UX pattern, only corrects the timing of the write

## UX Acceptance Criteria

- **UX1**: When changing status to "Completed"/"Cancelled" in edit mode, focus icon remains active, goal stays in navigation
- **UX2**: After pressing "Save" with new status "Completed"/"Cancelled", focus is reset, goal disappears from navigation
- **UX3**: After pressing "Cancel", status returns to original, focus doesn't change

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

- `goal-focus`: Requirements are already described in spec.md (Requirement: Auto-cleanup of invalid focused goals, scenarios on lines 113-123). Specification is correct — implementation doesn't match. Delta spec is not needed — only implementation fix is needed.

## Impact

- `packages/client/src/pages/GoalDetailPage.tsx` — `handleStatusChange` and `handleSaveEdit`
- `packages/client/src/hooks/useGoal.ts` — may need to remove `updateGoalStatus` from public hook API or make it optional
- Existing BDD tests in `goal_focus_auto_removal` — need to ensure tests check the right moment (after save, not after status change)

## Behavior

Scenarios are already described in `openspec/specs/goal-focus/spec.md`:
- "Status changed to completed/cancelled during editing (not saved yet)"
- "Status changed to completed/cancelled, then edit cancelled"
- "Status changed to completed/cancelled, then saved"

## Success Metrics

- **M1**: BDD tests for all three scenarios from spec.md pass
- **M2**: Mutation testing score ≥ 95% for changed files

## Open Questions

No open questions — behavior is fully described in existing specification.
