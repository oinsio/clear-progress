## Context

Two bugs exist in the task management UI on detail pages:

1. **Box filter ignores displayed tasks**: GoalDetailPage and EntityDetailLayout (Category/Context) use `activeBox` only to determine `targetBox` for new task creation. The `BoxSectionList` always receives all tasks grouped by box, regardless of filter selection. ActiveTasksPage correctly branches on `activeBox === BOX_FILTER_ALL` to show all sections vs. a single box.

2. **TaskDetailsTab bypasses moveToBox**: `TaskDetailsTab.handleBoxChange` calls `onUpdate(task.id, { box })` which maps to `TaskService.update()` — a generic field update that does not recalculate `sort_order`. The correct path is `TaskService.moveToBox()` which generates a new `sort_order` above the destination box's maximum. `TaskQuickActions` already uses `onMove` correctly.

## Goals / Non-Goals

**Goals:**
- FR1/FR2: Box filter on detail pages filters the task list display
- FR3/FR4: Box change in TaskDetailsTab uses `moveToBox()` for correct sort_order

**Non-Goals:**
- Changing `TaskService.moveToBox()` logic (already correct)
- Changing `BoxSectionList` component API (it stays as-is, the filtering happens before it)
- Changing ActiveTasksPage (already correct)

## Decisions

### D1: Filter tasksByBox before rendering, not inside BoxSectionList

**Decision**: Apply box filtering in the state hooks (`useGoalDetailState`, `EntityDetailLayout`) before passing `tasksByBox` to `BoxSectionList`. When `activeBox !== BOX_FILTER_ALL`, filter the `tasksByBox` record to include only the selected box.

**Rationale**: BoxSectionList is a presentation component used in multiple places. Keeping filtering in the parent (where `activeBox` state lives) avoids adding filter props to BoxSectionList and matches the pattern in ActiveTasksPage where filtering happens at the page level.

**Alternatives considered**:
- Add `activeBox` prop to BoxSectionList → rejected: violates single responsibility, BoxSectionList shouldn't know about filters
- Create a `useFilteredTasksByBox` hook → rejected: over-engineering for a simple conditional

### D2: Add onMove prop to TaskDetailsTab

**Decision**: Add `onMove: (id: string, box: Box) => Promise<void>` prop to `TaskDetailsTab`. Change `handleBoxChange` to call `onMove` instead of `onUpdate` when the box changes. Thread `onMove` from `TaskDetailPanel` through to `TaskDetailsTab`.

**Rationale**: `TaskDetailPanel` already receives `onUpdate` for field changes and implicitly needs `onMove` for box changes. Separating the two follows the existing pattern in `TaskQuickActions` which has both `onUpdate` and `onMove` props. The `onMove` callback maps to `TaskService.moveToBox()` which correctly recalculates `sort_order`.

**Alternatives considered**:
- Make `onUpdate` detect box changes and call moveToBox internally → rejected: leaky abstraction, update should remain a generic field setter
- Handle in TaskDetailPanel orchestrator → rejected: TaskDetailsTab owns the box selector UI, it should call the right handler

### D3: GoalDetailPage uses the same pattern as EntityDetailLayout

**Decision**: GoalDetailPage has its own `useGoalDetailState` hook (not EntityDetailLayout). Apply the same filtering logic in `useGoalDetailState` where `tasksByBox` is computed. When `activeBox !== BOX_FILTER_ALL`, return only the selected box in the `tasksByBox` record.

## Risks / Trade-offs

- **[Low] BoxSectionList shows empty when filtered box has no tasks** → Already handled: BoxSectionList renders "no tasks" prompt when all boxes are empty.
- **[Low] Reorder within filtered view** → Reorder already scoped per box in BoxSectionList (each BoxSection has its own TaskList with onReorder), no change needed.
