## 1. Fix TaskDetailsTab box change (FR3, FR4)

- [ ] 1.1 Add `onMove: (id: string, box: Box) => Promise<void>` prop to TaskDetailsTab interface
- [ ] 1.2 Change `handleBoxChange` in TaskDetailsTab to call `onMove(task.id, box)` instead of `onUpdate(task.id, { box })`
- [ ] 1.3 Thread `onMove` prop from TaskDetailPanel to TaskDetailsTab (TaskDetailPanel already receives move capability from parent)
- [ ] 1.4 Write unit test: box change via TaskDetailsTab calls onMove, not onUpdate
- [ ] 1.5 Verify existing `useTaskMutations.move.test.ts` still passes

## 2. Fix box filter on GoalDetailPage (FR1)

- [ ] 2.1 In `useGoalDetailState`, filter `tasksByBox` by `activeBox` — when `activeBox !== BOX_FILTER_ALL`, return only the selected box's tasks
- [ ] 2.2 In GoalDetailPage, conditionally render: `BoxSectionList` when "All", `TaskList` when specific box is selected
- [ ] 2.3 Wire reorder and other handlers for the single-box TaskList view
- [ ] 2.4 Write unit test: selecting a specific box filter shows only tasks from that box
- [ ] 2.5 Write unit test: selecting "All" shows all boxes grouped (regression)

## 3. Fix box filter on EntityDetailLayout (FR2)

- [ ] 3.1 In EntityDetailLayout, apply same filtering pattern: when `activeBox !== BOX_FILTER_ALL`, render single-box TaskList instead of BoxSectionList
- [ ] 3.2 Wire reorder and handlers for the single-box view
- [ ] 3.3 Write unit test: CategoryDetailPage filters tasks by selected box
- [ ] 3.4 Write unit test: ContextDetailPage filters tasks by selected box

## 4. Verification

- [ ] 4.1 Run `pnpm run build` to verify no type errors
- [ ] 4.2 Run existing test suites for affected hooks and components
- [ ] 4.3 Run Stryker mutation testing on changed files (up to 5 files)
