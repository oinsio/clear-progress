## ADDED Requirements

### Requirement: GoalDetailPage integrates pin functionality for detail panel

GoalDetailPage SHALL integrate `useDetailPanelPinned` hook and render the detail panel column when `isDesktop && (isDetailPanelPinned || selectedTask)`. When `isDetailPanelPinned` is `true` and viewport is desktop, the detail panel column and resize handle SHALL always be rendered regardless of task selection state. When no task is selected in pinned mode, an empty state placeholder SHALL be shown in the detail panel area. The pin button in TaskDetailPanel SHALL work identically to other pages. Implements FR4, FR5, FR6, FR7 of extend-pin-to-entity-pages.

#### Scenario: Desktop layout with selected task

- **WHEN** a task is selected on desktop within GoalDetailPage
- **THEN** goal content and TaskDetailPanel are shown side-by-side with a draggable resize handle

#### Scenario: Mobile layout with selected task

- **WHEN** a task is selected on mobile within GoalDetailPage
- **THEN** goal content is hidden and TaskDetailPanel takes full screen

#### Scenario: No task selected without pinning

- **WHEN** no task is selected and detail panel is not pinned on GoalDetailPage
- **THEN** only goal content is shown, TaskDetailPanel is not rendered

#### Scenario: Pinned detail panel with no task selected on desktop

- **WHEN** detail panel is pinned, no task is selected, and viewport is desktop on GoalDetailPage
- **THEN** the detail panel column shows an empty state placeholder
- **AND** the resize handle is visible between goal content and detail panel area

#### Scenario: Pinned detail panel with task selected on desktop

- **WHEN** detail panel is pinned, a task is selected, and viewport is desktop on GoalDetailPage
- **THEN** TaskDetailPanel renders in the pinned column as usual

#### Scenario: Pinned mode ignored on mobile

- **WHEN** detail panel is pinned and viewport is mobile on GoalDetailPage
- **THEN** layout behaves identically to unpinned mode (detail panel only on task selection, full-screen)

#### Scenario: Pin button works in goal context

- **WHEN** user clicks pin button in TaskDetailPanel on GoalDetailPage
- **THEN** the `detail_panel_pinned` preference toggles and layout updates accordingly
