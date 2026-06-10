# fix-box-filter-and-move-sort

## Why

Two bugs degrade task management on detail pages. First, the box filter (inbox/today/week/later) on Goal, Category, and Context detail pages only changes which box new tasks are created in, but does not filter the displayed task list — unlike ActiveTasksPage where the filter works correctly. Second, changing a task's box via TaskDetailPanel uses `TaskService.update()` instead of `TaskService.moveToBox()`, so the task keeps its old `sort_order` and appears at the wrong position in the destination box instead of at the top.

## What Changes

- **MODIFIED**: Box filter on entity detail pages (GoalDetailPage, EntityDetailLayout) will filter displayed tasks by selected box, matching ActiveTasksPage behavior
- **MODIFIED**: TaskDetailsTab box change will use `moveToBox()` to recalculate sort_order, placing the task at the top of the destination box

## Goals

- G1: Box filter on detail pages filters the displayed task list, not just the target box for new tasks
- G2: Changing a task's box from TaskDetailPanel places the task at the top of the destination box

## Non-Goals

- NG1: Changing box filter behavior on ActiveTasksPage or InboxPage (already correct)
- NG2: Changing sort_order logic in TaskService.moveToBox (already correct)
- NG3: Changing TaskQuickActions box change (already uses onMove correctly)

## Users & Scenarios

- U1: User on Goal Detail page selects "Today" filter — expects to see only Today tasks, but sees all boxes
- U2: User on Goal Detail page changes task box from Later to Today via detail panel — expects task at top of Today, but it appears at bottom

## Requirements

### Functional

- FR1: When a specific box is selected in the filter on GoalDetailPage, only tasks from that box SHALL be displayed. When "All" is selected, tasks SHALL be grouped by box as currently
- FR2: When a specific box is selected in the filter on EntityDetailLayout (Category/Context detail), only tasks from that box SHALL be displayed. When "All" is selected, tasks SHALL be grouped by box as currently
- FR3: TaskDetailsTab box selector SHALL call `onMove(task.id, box)` instead of `onUpdate(task.id, { box })` to ensure sort_order is recalculated via `TaskService.moveToBox()`
- FR4: TaskDetailsTab SHALL receive an `onMove` prop of type `(id: string, box: Box) => Promise<void>`

### Non-Functional

#### Accessibility

- NFR-A1: Filtered task list must remain keyboard-navigable and screen-reader accessible

## UX Acceptance Criteria

- UX1: Selecting a box filter on a detail page immediately shows only tasks in that box (no page reload)
- UX2: Selecting "All" shows all boxes grouped with section headers (current behavior)
- UX3: Moving a task to another box via detail panel places it at the top of the destination box list

## Behavior

Reference to existing BDD scenarios:
- `tasks_boxes.feature` — "Moved task appears at top of destination box" (already passes at service level)
- New scenarios needed for UI-level box filtering on detail pages

## Affected IA

No changes to information architecture.

## Success Metrics

- M1: Box filter on detail pages filters task list (verified by BDD unit tests)
- M2: Box change via TaskDetailPanel recalculates sort_order (verified by existing + new unit tests)
- M3: Zero regressions in existing task service tests

## Open Questions

None — root causes are identified and fixes are straightforward.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `entity-detail-layout`: Box filter must filter displayed tasks, not just set target box for new tasks (FR1, FR2)
- `task-detail-panel`: Box change must use moveToBox instead of update to recalculate sort_order (FR3, FR4)

## Impact

- `packages/client/src/pages/GoalDetailPage.tsx` — pass activeBox to filtering logic
- `packages/client/src/hooks/useGoalDetailState.ts` — filter tasksByBox by activeBox
- `packages/client/src/components/tasks/EntityDetailLayout.tsx` — filter tasksByBox by activeBox
- `packages/client/src/components/tasks/TaskDetailsTab.tsx` — add onMove prop, use it for box change
- `packages/client/src/components/tasks/TaskDetailPanel.tsx` — pass onMove through to TaskDetailsTab
