# fix-completed-task-detail

## Why

Completed tasks cannot be opened for detail view and editing. Clicking a completed task instantly closes the detail panel because `useTaskSelection` resets the selection for completed tasks in Focus Mode (enabled by default). The user cannot view details, edit the description, or reactivate the task.

## What Changes

- **MODIFIED**: `useTaskSelection` logic — remove the block that prevents opening completed tasks in Focus Mode. Focus Mode should only affect visual presentation (opacity), not block interaction.

## Goals

- **G1**: User can open any completed task for detail view and editing

## Non-Goals

- **NG1**: Changing Focus Mode visual behavior (opacity remains as is)
- **NG2**: Changing task filtering logic on pages

## Users & Scenarios

- **U1**: User on the Completed page wants to view or edit a completed task
- **U2**: User on the Active page wants to view a today's completed task

## Requirements

### Functional

- **FR1**: Clicking a completed task SHALL open the detail panel regardless of Focus Mode state
- **FR2**: The detail panel for a completed task SHALL allow editing all fields (same as for active tasks)

### Non-Functional

#### Accessibility

- **NFR-A1**: Completed tasks SHALL be accessible via keyboard navigation and panel opening

## UX Acceptance Criteria

- **UX1**: Clicking a completed task opens the detail panel with the same editing capabilities as for active tasks

## Behavior

Scenarios are covered by existing feature files for task selection. No new Gherkin required — fixing the behavior is sufficient.

## Affected IA

No changes.

## Success Metrics

- **M1**: All completed tasks open for detail view (0 failures)
- **M2**: Existing selection/focus mode tests continue to pass

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `task-detail-panel`: Remove the block on opening completed tasks — panel should open for tasks in any status

## Impact

- `packages/client/src/hooks/useTaskSelection.ts` — remove lines 58-60 (completed task block in Focus Mode)
- Existing `useTaskSelection` tests — update/remove tests that verify the blocking behavior

## Open Questions

None.
