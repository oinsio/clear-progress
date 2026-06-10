## ADDED Requirements

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
