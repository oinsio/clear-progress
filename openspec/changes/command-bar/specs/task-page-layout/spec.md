## MODIFIED Requirements

### Requirement: TaskPageLayout provides shared split-pane layout

TaskPageLayout SHALL render a split-pane layout containing: main content area (children), TaskDetailPanel (when a task is selected), resize handle (desktop only), and Sidebar. The layout SHALL use `usePanelSplit` for resize, `usePanelSide` for sidebar placement, `usePanelOpen` for sidebar toggle, and `useIsDesktop` for responsive behavior. The main content area SHALL apply padding based on `--command-bar-height` CSS variable to prevent CommandBar overlap. TaskPageLayout SHALL NOT render toolbars — CommandBar is rendered independently by each page. Implements FR17 of command-bar. Modifies FR6 of refactor-task-pages.

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

#### Scenario: Content has padding for bottom CommandBar
- **WHEN** CommandBar is positioned at bottom and has height 56px
- **THEN** main content has padding-bottom of 56px (from --command-bar-height)

#### Scenario: Content has padding for top CommandBar
- **WHEN** CommandBar is positioned at top and has height 56px
- **THEN** main content has padding-top of 56px (from --command-bar-height)

### Requirement: InboxPage displays only inbox tasks

InboxPage (`/inbox`) SHALL display only tasks from the inbox box. It SHALL use TaskPageLayout with sidebarMode="inbox". It SHALL render CommandBar with entityIcon=CheckSquare, eyeToggle, no filter, and placeholder for inbox tasks. Implements FR1 of refactor-task-pages. Modified by command-bar.

#### Scenario: InboxPage shows inbox tasks
- **WHEN** user navigates to /inbox
- **THEN** page shows tasks from inbox box only

#### Scenario: InboxPage has CommandBar for task creation
- **WHEN** user is on InboxPage
- **THEN** CommandBar is visible with CheckSquare icon and inbox placeholder

#### Scenario: InboxPage has no filter in CommandBar
- **WHEN** user is on InboxPage
- **THEN** CommandBar does not show filter section

#### Scenario: InboxPage has eye toggle in CommandBar
- **WHEN** user is on InboxPage
- **THEN** CommandBar shows eye toggle for hidden tasks

### Requirement: ActiveTasksPage displays tasks by time-box

ActiveTasksPage (`/tasks`) SHALL display tasks grouped by time-box (today/week/later) using TaskSection components. It SHALL render CommandBar with filter (4 boxes: today/week/later/all), eyeToggle, entityIcon=CheckSquare. When filter is "all", it SHALL show sections for today, week, later plus a "completed today" section. It SHALL use TaskPageLayout with sidebarMode="tasks". Implements FR2 of refactor-task-pages. Modified by command-bar.

#### Scenario: All tasks view shows three sections plus completed today
- **WHEN** user navigates to /tasks with filter "all"
- **THEN** page shows TaskSections for today, week, later and a "completed today" section

#### Scenario: Filtering by specific box
- **WHEN** user selects "today" in CommandBar filter
- **THEN** only today tasks are shown

#### Scenario: CommandBar with filter is present
- **WHEN** user is on ActiveTasksPage
- **THEN** CommandBar is rendered with box filter, eye toggle, and CheckSquare icon

### Requirement: CompletedPage displays completed tasks grouped by date

CompletedPage (`/completed`) SHALL display all completed tasks grouped by date (today, yesterday, this week, this month, earlier) using TaskSection components. It SHALL NOT render CommandBar. It SHALL use TaskPageLayout with sidebarMode="completed". Implements FR3 of refactor-task-pages.

#### Scenario: Completed tasks grouped by date
- **WHEN** user navigates to /completed
- **THEN** page shows TaskSections grouped by date periods

#### Scenario: No CommandBar
- **WHEN** user is on CompletedPage
- **THEN** CommandBar is not rendered

#### Scenario: Empty state
- **WHEN** there are no completed tasks
- **THEN** page shows "no completed tasks" message

## REMOVED Requirements

### Requirement: Top and bottom toolbars
**Reason**: Replaced by CommandBar component with `position: fixed`. CommandBar is rendered by each page independently, not via layout slots.
**Migration**: Pages that used `topToolbar`/`bottomToolbar` props now render `<CommandBar>` directly. Content padding is handled via `--command-bar-height` CSS variable.
