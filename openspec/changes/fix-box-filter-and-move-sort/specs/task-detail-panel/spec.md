# Delta Spec: Task Detail Panel
# implements FR3, FR4 of fix-box-filter-and-move-sort

## ADDED Requirements

### Requirement: Box change in TaskDetailsTab uses moveToBox

TaskDetailsTab SHALL receive an `onMove` prop of type `(id: string, box: Box) => Promise<void>`. When user changes the box via the box selector in TaskDetailsTab, the component SHALL call `onMove(task.id, box)` instead of `onUpdate(task.id, { box })`. This ensures `TaskService.moveToBox()` is invoked, which recalculates `sort_order` as a key above the current maximum in the destination box. The `setSelectedBox` local state update SHALL still be called for optimistic UI. TaskDetailPanel SHALL thread the existing `onMove` (or equivalent) callback through to TaskDetailsTab.

#### Scenario: Box change via detail panel recalculates sort_order

- **GIVEN** task "Buy groceries" is in "later" with sort_order "a1"
- **AND** "today" box has tasks with sort_order "a5", "a3"
- **WHEN** user changes box to "today" via TaskDetailsTab
- **THEN** task sort_order is recalculated to be greater than "a5"
- **AND** task appears first in "today" box

#### Scenario: Box change to same box is no-op

- **GIVEN** task is in "today"
- **WHEN** user selects "today" again via TaskDetailsTab
- **THEN** sort_order remains unchanged
- **AND** needsSync remains unchanged

#### Scenario: TaskDetailsTab receives onMove prop

- **WHEN** TaskDetailPanel renders TaskDetailsTab
- **THEN** TaskDetailsTab receives an `onMove` callback
- **AND** box selector buttons call `onMove` on click
