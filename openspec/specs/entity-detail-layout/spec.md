# Capability: Entity Detail Layout

## Purpose

Shared layout component for entity detail pages (Categories, Contexts). Provides split-pane layout with task list, detail panel, command bar, and sidebar navigation. Implements pin functionality for detail panel.

## Requirements

### Requirement: EntityDetailLayout provides split-pane layout with pin support

EntityDetailLayout SHALL render a split-pane layout containing: header with back button and entity name, task list grouped by box, TaskDetailPanel (when a task is selected or panel is pinned), resize handle (desktop only), and Sidebar. The layout SHALL use `usePanelSplit` for resize, `usePanelSide` for sidebar placement, `usePanelOpen` for sidebar toggle, `useIsDesktop` for responsive behavior, and `useDetailPanelPinned` for pinned detail panel state. When `isDetailPanelPinned` is `true` and viewport is desktop, the detail panel column and resize handle SHALL always be rendered regardless of task selection state. When no task is selected in pinned mode, an empty state placeholder SHALL be shown in the detail panel area. Implements FR1, FR2, FR3 of extend-pin-to-entity-pages.

#### Scenario: Desktop layout with selected task

- **WHEN** a task is selected on desktop
- **THEN** main content and TaskDetailPanel are shown side-by-side with a draggable resize handle

#### Scenario: Mobile layout with selected task

- **WHEN** a task is selected on mobile
- **THEN** main content is hidden and TaskDetailPanel takes full screen

#### Scenario: No task selected without pinning

- **WHEN** no task is selected and detail panel is not pinned
- **THEN** only main content is shown, TaskDetailPanel is not rendered

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

### Requirement: EntityDetailLayout supports entity editing

EntityDetailLayout SHALL allow inline editing of the entity name. When user clicks the edit button, the name field becomes editable. When user saves, the `onSaveEntity` callback is invoked. When user cancels, changes are discarded. The entity name SHALL show unsynced indicator (amber left border) when `entity.needsSync` is true.

#### Scenario: Edit entity name

- **WHEN** user clicks edit button and modifies entity name
- **THEN** the name input becomes editable and save/cancel buttons appear

#### Scenario: Save entity name

- **WHEN** user clicks save button after editing
- **THEN** `onSaveEntity` is called with the new name and edit mode exits

#### Scenario: Cancel entity name edit

- **WHEN** user clicks cancel button during editing
- **THEN** changes are discarded and edit mode exits

#### Scenario: Unsynced indicator

- **WHEN** entity has `needsSync: true`
- **THEN** the entity card shows an amber left border

### Requirement: EntityDetailLayout supports entity deletion

EntityDetailLayout SHALL provide a delete button that opens a confirmation dialog. When user confirms, the `onDeleteEntity` callback is invoked and navigation returns to the entity list page.

#### Scenario: Delete entity with confirmation

- **WHEN** user clicks delete button and confirms in dialog
- **THEN** `onDeleteEntity` is called and user is navigated to entity list page

#### Scenario: Cancel deletion

- **WHEN** user clicks delete button but cancels in dialog
- **THEN** no deletion occurs and dialog closes

### Requirement: Box filter filters displayed task list on detail pages

When a specific box is selected in the filter on a detail page (GoalDetailPage, CategoryDetailPage, ContextDetailPage), only tasks from that box SHALL be displayed in a flat TaskList (no section headers). When "All" is selected, tasks SHALL be grouped by box with section headers as currently implemented via BoxSectionList. The filter state SHALL be managed at the page/hook level, not inside BoxSectionList. Implements FR1, FR2 of fix-box-filter-and-move-sort.

#### Scenario: Filter by specific box shows only that box's tasks

- **GIVEN** goal has 2 tasks in "today" and 3 tasks in "later"
- **WHEN** user selects "today" in the box filter
- **THEN** only 2 "today" tasks are displayed
- **AND** no section headers are shown

#### Scenario: "All" filter shows all boxes grouped

- **GIVEN** goal has tasks in "today" and "later"
- **WHEN** user selects "All" in the box filter
- **THEN** tasks are grouped by box with section headers (current behavior)

#### Scenario: Filter by empty box shows empty state

- **GIVEN** goal has 0 tasks in "inbox" and 3 tasks in "today"
- **WHEN** user selects "inbox" in the box filter
- **THEN** empty state message is displayed

#### Scenario: Filter applies to EntityDetailLayout (Category/Context)

- **GIVEN** category has tasks in "today" and "week"
- **WHEN** user selects "week" in the box filter on category detail page
- **THEN** only "week" tasks are displayed

#### Scenario: Creating a task in filtered view

- **GIVEN** user has selected "today" filter on goal detail page
- **WHEN** user creates a new task via command bar
- **THEN** new task is created in "today" box
- **AND** new task appears in the filtered list
