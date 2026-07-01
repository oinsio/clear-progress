## MODIFIED Requirements

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

## ADDED Requirements

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
