## ADDED Requirements

### Requirement: TaskPageLayout provides shared split-pane layout

TaskPageLayout SHALL render a split-pane layout containing: main content area (children), optional top/bottom toolbars, TaskDetailPanel (when a task is selected), resize handle (desktop only), and Sidebar. The layout SHALL use `usePanelSplit` for resize, `usePanelSide` for sidebar placement, `usePanelOpen` for sidebar toggle, and `useIsDesktop` for responsive behavior. Implements FR6 of refactor-task-pages.

#### Scenario: Desktop layout with selected task
- **WHEN** a task is selected on desktop
- **THEN** main content and TaskDetailPanel are shown side-by-side with a draggable resize handle

#### Scenario: Mobile layout with selected task
- **WHEN** a task is selected on mobile
- **THEN** main content is hidden and TaskDetailPanel takes full screen

#### Scenario: No task selected
- **WHEN** no task is selected
- **THEN** only main content is shown, TaskDetailPanel is not rendered

#### Scenario: Sidebar mode highlights active page
- **WHEN** TaskPageLayout receives sidebarMode="inbox"
- **THEN** Sidebar highlights the inbox filter item

#### Scenario: Top and bottom toolbars
- **WHEN** TaskPageLayout receives topToolbar and bottomToolbar
- **THEN** topToolbar renders above the scrollable area and bottomToolbar renders below

### Requirement: TaskSection renders collapsible task list section

TaskSection SHALL render a collapsible section with a header (label + task count), using `useSectionCollapse` for persistence. When expanded, it SHALL render a TaskList with all task operation callbacks. When collapsed, the TaskList SHALL be hidden. Implements FR7 of refactor-task-pages.

#### Scenario: Section renders with label and count
- **WHEN** TaskSection receives label="Today" and 3 tasks
- **THEN** header shows "Today (3)"

#### Scenario: Section is collapsible
- **WHEN** user clicks the section header
- **THEN** section toggles between collapsed and expanded

#### Scenario: Collapse state persists
- **WHEN** user collapses a section and reloads the page
- **THEN** section remains collapsed

#### Scenario: Empty section with message
- **WHEN** TaskSection has 0 tasks and emptyMessage is provided
- **THEN** the empty message is displayed

#### Scenario: Empty section hidden when configured
- **WHEN** TaskSection has 0 tasks and hideEmptyState is true
- **THEN** section is not rendered

### Requirement: useTaskSelection manages task selection state

useTaskSelection SHALL manage: selectedTaskId, expandedTaskId, selectedTask (resolved), handleTaskSelect (toggle), handleTaskExpand, handleDetailPanelClose. It SHALL resolve selectedTask from provided task arrays, falling back to `defaultTaskService.getById` for newly created tasks. Implements FR8 of refactor-task-pages.

#### Scenario: Selecting a task sets selectedTaskId
- **WHEN** user selects a task
- **THEN** selectedTaskId is set to that task's id and selectedTask is resolved

#### Scenario: Selecting same task deselects
- **WHEN** user selects the already-selected task
- **THEN** selectedTaskId is set to null

#### Scenario: Task resolved from arrays
- **WHEN** selectedTaskId matches a task in provided arrays
- **THEN** selectedTask is set to that task

#### Scenario: Task resolved from database fallback
- **WHEN** selectedTaskId does not match any task in arrays
- **THEN** selectedTask is fetched from defaultTaskService.getById

#### Scenario: Closing detail panel clears selection
- **WHEN** handleDetailPanelClose is called
- **THEN** selectedTaskId and selectedTask are set to null

### Requirement: useTaskCompletion provides parameterized completion handler

useTaskCompletion SHALL accept a completion function and return a callback. The callback SHALL: call the completion function, handle recurring tasks (set selectedTaskId to new recurring id), clear selectedTaskId if completed task was selected, clear expandedTaskId if completed task was expanded. Implements FR9 of refactor-task-pages.

#### Scenario: Completing a non-recurring task clears selection
- **WHEN** a selected non-recurring task is completed
- **THEN** selectedTaskId is cleared to null

#### Scenario: Completing a recurring task selects new instance
- **WHEN** a recurring task is completed and returns a new recurring id
- **THEN** selectedTaskId is set to the new recurring id

#### Scenario: Completing a non-selected task preserves selection
- **WHEN** a task that is not selected is completed
- **THEN** selectedTaskId remains unchanged

#### Scenario: Completing an expanded task clears expansion
- **WHEN** a task with expandedTaskId matching is completed
- **THEN** expandedTaskId is cleared to null

### Requirement: InboxPage displays only inbox tasks

InboxPage (`/inbox`) SHALL display only tasks from the inbox box. It SHALL use TaskPageLayout with sidebarMode="inbox". It SHALL provide AddTaskInput for creating tasks. It SHALL NOT show BoxFilterBar. Implements FR1 of refactor-task-pages.

#### Scenario: InboxPage shows inbox tasks
- **WHEN** user navigates to /inbox
- **THEN** page shows tasks from inbox box only

#### Scenario: InboxPage has add task capability
- **WHEN** user is on InboxPage
- **THEN** AddTaskInput is available for creating new inbox tasks

#### Scenario: InboxPage has no BoxFilterBar
- **WHEN** user is on InboxPage
- **THEN** BoxFilterBar is not rendered

### Requirement: ActiveTasksPage displays tasks by time-box

ActiveTasksPage (`/tasks`) SHALL display tasks grouped by time-box (today/week/later) using TaskSection components. It SHALL include BoxFilterBar for filtering by specific box or all. When filter is "all", it SHALL show sections for today, week, later plus a "completed today" section. It SHALL use TaskPageLayout with sidebarMode="tasks". Implements FR2 of refactor-task-pages.

#### Scenario: All tasks view shows three sections plus completed today
- **WHEN** user navigates to /tasks with filter "all"
- **THEN** page shows TaskSections for today, week, later and a "completed today" section

#### Scenario: Filtering by specific box
- **WHEN** user selects "today" in BoxFilterBar
- **THEN** only today tasks are shown

#### Scenario: BoxFilterBar is present
- **WHEN** user is on ActiveTasksPage
- **THEN** BoxFilterBar is rendered

### Requirement: CompletedPage displays completed tasks grouped by date

CompletedPage (`/completed`) SHALL display all completed tasks grouped by date (today, yesterday, this week, this month, earlier) using TaskSection components. It SHALL NOT include BoxFilterBar or AddTaskInput. It SHALL use TaskPageLayout with sidebarMode="completed". Implements FR3 of refactor-task-pages.

#### Scenario: Completed tasks grouped by date
- **WHEN** user navigates to /completed
- **THEN** page shows TaskSections grouped by date periods

#### Scenario: No BoxFilterBar or AddTaskInput
- **WHEN** user is on CompletedPage
- **THEN** BoxFilterBar and AddTaskInput are not rendered

#### Scenario: Empty state
- **WHEN** there are no completed tasks
- **THEN** page shows "no completed tasks" message
