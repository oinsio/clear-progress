# Extend Pin Functionality to Entity Detail Pages

## Why

Pin functionality (detail panel pinning) is implemented only for task pages (`TaskPageLayout`), but does not work on goal, category, and context detail pages. Users working with tasks through these pages cannot pin the detail panel, which breaks UX consistency.

## What Changes

- **MODIFIED**: `EntityDetailLayout` receives integration with `useDetailPanelPinned` and panel pinning logic
- **MODIFIED**: `GoalDetailPage` receives integration with `useDetailPanelPinned` and panel pinning logic
- **MODIFIED**: `TaskDetailPanel` in entity pages context receives pin/unpin button (desktop only)

## Capabilities

### New Capabilities

No new capabilities — all necessary infrastructure already exists (`useDetailPanelPinned` hook, storage key, i18n).

### Modified Capabilities

- `entity-detail-layout`: adding support for detail panel pinning via `useDetailPanelPinned`
- `task-page-layout`: clarification that pin button must work on all pages with `TaskDetailPanel`, including entity pages

## Impact

**Affected components:**
- `packages/client/src/components/tasks/EntityDetailLayout.tsx` — add `useDetailPanelPinned`, `showDetailColumn` logic, empty state placeholder
- `packages/client/src/pages/GoalDetailPage.tsx` — add `useDetailPanelPinned`, `showDetailColumn` logic, empty state placeholder
- `packages/client/src/components/tasks/TaskDetailPanel.tsx` — pin button already implemented, but needs verification in entity pages context

**Behavior:**
- On desktop with pinned panel: detail column always visible, even without selected task (empty state shown)
- On mobile: pinning is ignored (same as in `TaskPageLayout`)
- Pin button in `TaskDetailPanel` works identically on all pages

**No changes:**
- `useDetailPanelPinned` hook already exists
- `DETAIL_PANEL_PINNED` storage key already exists
- i18n keys already exist
- `SettingsPage` logic already exists

## Goals

- **G1**: UX consistency — panel pinning works identically on all pages with tasks
- **G2**: Zero surprises — user pins panel in settings or on task page, it stays pinned everywhere

## Non-Goals

- **NG1**: Separate pinning for different page types (global setting applies everywhere)
- **NG2**: Changing pin button design or behavior
- **NG3**: Changing empty state placeholder (reuses existing one from `TaskPageLayout`)

## Users & Scenarios

- **U1**: User works with task list on goal page, pins detail panel — it stays pinned when switching between tasks
- **U2**: User pinned panel in settings, opens category page — panel is already pinned
- **U3**: User on mobile opens context page — pinning is ignored, panel works in fullscreen mode

## Requirements

### Functional

- **FR1**: EntityDetailLayout SHALL integrate `useDetailPanelPinned` hook and render detail column when `isDesktop && (isDetailPanelPinned || selectedTask)`
- **FR2**: EntityDetailLayout SHALL show empty state placeholder in pinned detail column when no task is selected (desktop only)
- **FR3**: EntityDetailLayout SHALL always render resize handle when detail column is visible (desktop only)
- **FR4**: GoalDetailPage SHALL integrate `useDetailPanelPinned` hook and render detail column when `isDesktop && (isDetailPanelPinned || selectedTask)`
- **FR5**: GoalDetailPage SHALL show empty state placeholder in pinned detail column when no task is selected (desktop only)
- **FR6**: GoalDetailPage SHALL always render resize handle when detail column is visible (desktop only)
- **FR7**: Pin button in TaskDetailPanel SHALL work identically on entity detail pages (goals, categories, contexts) and task pages

### Non-Functional

#### Performance

- **NFR-P1**: No performance degradation — pin logic uses existing hook without additional DB queries

#### Accessibility

- **NFR-A1**: Pin button remains accessible with proper aria-label on all pages

#### Responsive

- **NFR-R1**: Pinned mode ignored on mobile for all entity pages (consistent with TaskPageLayout)

## UX Acceptance Criteria

- **UX1**: User pins panel on goal page → switches between tasks → panel stays visible
- **UX2**: User pins panel in settings → opens category page → panel is already pinned
- **UX3**: User deselects task with pinned panel → panel shows empty state, does not disappear
- **UX4**: User on mobile with pinned panel → opens context page → panel works in fullscreen mode (pinning is ignored)

## UI States Matrix

| Viewport | Pin State | Task Selected | Detail Column Visible | Content                      |
|----------|-----------|---------------|-----------------------|------------------------------|
| Desktop  | Unpinned  | No            | No                    | —                            |
| Desktop  | Unpinned  | Yes           | Yes                   | TaskDetailPanel              |
| Desktop  | Pinned    | No            | Yes                   | Empty state placeholder      |
| Desktop  | Pinned    | Yes           | Yes                   | TaskDetailPanel              |
| Mobile   | Any       | No            | No                    | —                            |
| Mobile   | Any       | Yes           | Yes (fullscreen)      | TaskDetailPanel (fullscreen) |

## Behavior

Existing BDD scenarios from `pin-task-detail-panel` apply to entity pages:
- `@pin-task-detail-panel @FR6 @NFR-A1 @NFR-R1` — pin button behavior
- `@pin-task-detail-panel @FR3 @FR4 @FR5` — layout behavior with pinned panel

No new Gherkin scenarios needed — implementation must pass existing tests when applied to `EntityDetailLayout` and `GoalDetailPage`.

## Visual Reference

No Figma changes — reuses existing pin button and empty state from `TaskPageLayout`.

## Affected IA

No changes to Information Architecture.

## Success Metrics

- **M1**: Pin button functions on all 4 page types: task pages, goal detail, category detail, context detail
- **M2**: Panel pinning persists when navigating between any pages with tasks
- **M3**: Empty state correctly displays with pinned panel when no task is selected on all entity pages

## Open Questions

No open questions — all infrastructure already implemented in `pin-task-detail-panel`.
