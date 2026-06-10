## 1. Fix TaskDetailsTab box change (FR3, FR4)

- [x] 1.1 Add `onMove: (id: string, box: Box) => Promise<void>` prop to TaskDetailsTab interface
- [x] 1.2 Change `handleBoxChange` in TaskDetailsTab to call `onMove(task.id, box)` instead of `onUpdate(task.id, { box })`
- [x] 1.3 Thread `onMove` prop from TaskDetailPanel to TaskDetailsTab (TaskDetailPanel already receives move capability from parent)
- [x] 1.4 Write unit test: box change via TaskDetailsTab calls onMove, not onUpdate
- [x] 1.5 Verify existing `useTaskMutations.move.test.ts` still passes

## 2. Fix box filter on GoalDetailPage (FR1)

- [x] 2.1 In `useGoalDetailState`, filter `tasksByBox` by `activeBox` — when `activeBox !== BOX_FILTER_ALL`, return only the selected box's tasks
- [x] 2.2 In GoalDetailPage, conditionally render: `BoxSectionList` when "All", `TaskList` when specific box is selected
- [x] 2.3 Wire reorder and other handlers for the single-box TaskList view
- [x] 2.4 Write unit test: selecting a specific box filter shows only tasks from that box
- [x] 2.5 Write unit test: selecting "All" shows all boxes grouped (regression)

## 3. Fix box filter on EntityDetailLayout (FR2)

- [x] 3.1 In EntityDetailLayout, apply same filtering pattern: when `activeBox !== BOX_FILTER_ALL`, render single-box TaskList instead of BoxSectionList
- [x] 3.2 Wire reorder and handlers for the single-box view
- [x] 3.3 Write unit test: CategoryDetailPage filters tasks by selected box
- [x] 3.4 Write unit test: ContextDetailPage filters tasks by selected box

## 4. Verification

- [x] 4.1 Run `pnpm run build` to verify no type errors
- [x] 4.2 Run existing test suites for affected hooks and components
- [x] 4.3 Run Stryker mutation testing on changed files (up to 5 files)
