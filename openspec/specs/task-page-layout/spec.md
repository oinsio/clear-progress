# Capability: Task Page Layout

## Purpose

Shared layout and hooks for task pages (Inbox, Active Tasks, Completed). Provides split-pane layout with detail panel, collapsible task sections, task selection state management, and completion handling.

## Requirements

### Requirement: TaskPageLayout provides shared split-pane layout

TaskPageLayout SHALL render a split-pane layout containing: main content area (children), optional `commandBar` slot, TaskDetailPanel (when a task is selected), resize handle (desktop only), and Sidebar. The layout SHALL use `usePanelSplit` for resize, `usePanelSide` for sidebar placement, `usePanelOpen` for sidebar toggle, `useIsDesktop` for responsive behavior, and `useDetailPanelPinned` for pinned detail panel state. When `isDetailPanelPinned` is `true` and viewport is desktop, the detail panel column and resize handle SHALL always be rendered regardless of task selection state. When no task is selected in pinned mode, an empty state placeholder SHALL be shown in the detail panel area. TaskPageLayout accepts an optional `commandBar` React node prop that is rendered inside the main column (before the scrollable `<main>` area), ensuring CommandBar is constrained to the content area and never overlaps the Sidebar. No padding or CSS variable is needed for overlap prevention. Implements FR6 of refactor-task-pages. Implements FR17 of command-bar. Implements FR3, FR4, FR5 of pin-task-detail-panel.

#### Scenario: Desktop layout with selected task
- **WHEN** a task is selected on desktop
- **THEN** main content and TaskDetailPanel are shown side-by-side with a draggable resize handle

#### Scenario: Mobile layout with selected task
- **WHEN** a task is selected on mobile
- **THEN** main content is hidden and TaskDetailPanel takes full screen

#### Scenario: No task selected without pinning
- **WHEN** no task is selected and detail panel is not pinned
- **THEN** only main content is shown, TaskDetailPanel is not rendered

#### Scenario: Sidebar mode highlights active page
- **WHEN** TaskPageLayout receives sidebarMode="inbox"
- **THEN** Sidebar highlights the inbox filter item

#### Scenario: CommandBar rendered inside main column via commandBar prop
- **WHEN** TaskPageLayout receives a commandBar prop
- **THEN** CommandBar is rendered inside the main column, before the scrollable content, constrained by the Sidebar

#### Scenario: Pinned detail panel with no task selected on desktop
- **WHEN** detail panel is pinned, no task is selected, and viewport is desktop
- **THEN** the detail panel column shows an empty state placeholder
- **AND** the resize handle is visible between main content and detail panel area

#### Scenario: Pinned detail panel with task selected on desktop
- **WHEN** detail panel is pinned, a task is selected, and viewport is desktop
- **THEN** TaskDetailPanel renders in the pinned column as usual

#### Scenario: Pinned mode ignored on mobile
- **WHEN** detail panel is pinned and viewport is mobile
- **THEN** layout behaves identically to unpinned mode (detail panel only on task selection, full-screen)

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

### Requirement: TaskDetailPanel pin button (desktop only)

TaskDetailPanel header SHALL include a pin/unpin toggle button between the delete and close buttons. The button SHALL only be rendered when `useIsDesktop()` returns `true`. Clicking the button SHALL toggle the `detail_panel_pinned` preference via `useDetailPanelPinned`. The pin button SHALL use `Pin` icon when unpinned and `PinOff` icon when pinned (from lucide-react). The button SHALL have `aria-label` reflecting current state. Implements FR6, NFR-A1, NFR-R1 of pin-task-detail-panel.

#### Scenario: Pin button visible on desktop

- **WHEN** TaskDetailPanel is rendered on desktop
- **THEN** a pin/unpin button is visible in the header

#### Scenario: Pin button hidden on mobile

- **WHEN** TaskDetailPanel is rendered on mobile
- **THEN** the pin/unpin button is not rendered

#### Scenario: Pin button toggles preference

- **WHEN** user clicks the pin button
- **THEN** the `detail_panel_pinned` preference toggles between `true` and `false`

#### Scenario: Pin button shows correct icon

- **WHEN** detail panel is unpinned
- **THEN** pin button shows `Pin` icon with aria-label for pinning
- **WHEN** detail panel is pinned
- **THEN** pin button shows `PinOff` icon with aria-label for unpinning

### Requirement: Settings toggle for detail panel pinned

SettingsPage SHALL include a toggle switch for "Pin detail panel" preference, following the same pattern as the "Panel always open" toggle. The toggle SHALL use `useDetailPanelPinned` hook. Implements FR7 of pin-task-detail-panel.

#### Scenario: Settings toggle reflects current state

- **WHEN** detail panel is pinned
- **THEN** the toggle switch is in the "on" position

#### Scenario: Settings toggle changes preference

- **WHEN** user toggles the "Pin detail panel" switch
- **THEN** the `detail_panel_pinned` preference is updated

### Requirement: TaskDetailPanel pin button works across all page types

The pin button in TaskDetailPanel SHALL work identically on all pages where TaskDetailPanel is rendered: TaskPageLayout (inbox, active tasks, completed), GoalDetailPage, CategoryDetailPage, and ContextDetailPage. The button SHALL only render on desktop viewport (`useIsDesktop()` returns true) and SHALL toggle the global `detail_panel_pinned` preference via `useDetailPanelPinned` hook. The button SHALL use `Pin` icon when unpinned and `PinOff` icon when pinned, with appropriate aria-label. Implements FR7, NFR-A1 of extend-pin-to-entity-pages.

#### Scenario: Pin button visible on all desktop pages with TaskDetailPanel

- **WHEN** TaskDetailPanel is rendered on desktop within any page type (task pages, goal detail, category detail, context detail)
- **THEN** the pin/unpin button is visible in the TaskDetailPanel header

#### Scenario: Pin button toggles global preference from any page

- **WHEN** user clicks pin button on any page with TaskDetailPanel
- **THEN** the `detail_panel_pinned` preference toggles globally
- **AND** all pages with TaskDetailPanel reflect the new pinned state

#### Scenario: Pin button hidden on mobile across all pages

- **WHEN** TaskDetailPanel is rendered on mobile within any page type
- **THEN** the pin/unpin button is not rendered

#### Scenario: Pin button shows correct icon across all pages

- **WHEN** detail panel is unpinned on any page
- **THEN** pin button shows `Pin` icon with aria-label for pinning
- **WHEN** detail panel is pinned on any page
- **THEN** pin button shows `PinOff` icon with aria-label for unpinning
