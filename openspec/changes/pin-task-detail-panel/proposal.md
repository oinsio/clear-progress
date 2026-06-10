# Pin Task Detail Panel

## Why

On desktop, the task detail panel disappears when no task is selected, causing layout shift and loss of spatial context.
Power users who work in a three-column layout (Sidebar + Task List + Detail Panel) want the detail panel to always
occupy its space, showing an empty state placeholder when no task is selected.

## What Changes

- ADDED: New local preference `detail_panel_pinned` (boolean, default `false`) stored in localStorage
- ADDED: Pin/unpin button in TaskDetailPanel header (desktop only)
- ADDED: Empty state placeholder when detail panel is pinned but no task is selected
- MODIFIED: TaskPageLayout and EntityDetailLayout always render the detail panel column when pinned on desktop
- MODIFIED: SettingsPage gets a new toggle for "Pin detail panel"

## Goals

- G1: Provide stable three-column desktop layout without layout shifts when navigating between tasks
- G2: Follow the existing local preferences pattern (localStorage + usePreference hook)

## Non-Goals

- NG1: Syncing the pin preference to the server
- NG2: Changing mobile behavior (detail panel remains full-screen overlay on mobile)
- NG3: Adding the pin option for EntityDetailLayout on entity detail pages (Goal, Context, Category) in this change

## Users & Scenarios

- U1: Desktop power user who frequently switches between tasks and wants a persistent detail panel
- U2: Desktop user who prefers the current behavior (panel appears/disappears) and keeps the default

## Requirements

### Functional

- FR1: The system SHALL store the `detail_panel_pinned` preference as a boolean in localStorage via
  `LocalPreferencesService` under key `STORAGE_KEYS.DETAIL_PANEL_PINNED`. Default value SHALL be `false`.
- FR2: `useDetailPanelPinned` hook SHALL return `[isDetailPanelPinned, setDetailPanelPinned]` using
  `usePreference<boolean>`.
- FR3: When `isDetailPanelPinned` is `true` and viewport is desktop, `TaskPageLayout` SHALL always render the detail
  panel column (right side of split-pane) with the resize handle visible.
- FR4: When `isDetailPanelPinned` is `true`, no task is selected, and viewport is desktop, the detail panel area SHALL
  show an empty state placeholder.
- FR5: When `isDetailPanelPinned` is `true` and a task is selected, `TaskDetailPanel` SHALL render as usual in the
  pinned column.
- FR6: `TaskDetailPanel` header SHALL include a pin/unpin toggle button (desktop only) that toggles the
  `detail_panel_pinned` preference.
- FR7: `SettingsPage` SHALL include a toggle switch for "Pin detail panel" preference, following the same pattern as "
  Panel always open".
- FR8: Corrupted localStorage values for `detail_panel_pinned` SHALL self-heal to `false`.

### Non-Functional

#### Accessibility — NFR-A1

- NFR-A1: The pin button SHALL have an appropriate `aria-label` that reflects current state ("Pin detail panel" / "Unpin
  detail panel").

#### Responsive — NFR-R1

- NFR-R1: The pin button and pinned behavior SHALL only apply on desktop viewports. Mobile layout SHALL remain
  unchanged.

## UX Acceptance Criteria

- UX1: When pinned, switching between tasks SHALL NOT cause layout shifts — the detail panel column stays in place.
- UX2: The empty state placeholder SHALL convey that the user can select a task to see its details (e.g., an icon +
  short text).
- UX3: The pin button SHALL visually indicate the current pinned/unpinned state (e.g., filled pin icon vs outlined pin
  icon).
- UX4: Toggling pin via the TaskDetailPanel button or Settings toggle SHALL have the same immediate effect.

## UI States Matrix

| Pinned | Task Selected | Desktop | Detail Panel Shows          |
|--------|---------------|---------|-----------------------------|
| false  | false         | yes     | Hidden (current behavior)   |
| false  | true          | yes     | TaskDetailPanel             |
| true   | false         | yes     | Empty state placeholder     |
| true   | true          | yes     | TaskDetailPanel             |
| any    | false         | no      | Hidden (mobile)             |
| any    | true          | no      | Full-screen TaskDetailPanel |

## Behavior

Scenarios defined in BDD features will be tagged `@pin-task-detail-panel`.

## Visual Reference

No Figma needed — follows existing toggle patterns (Settings) and icon button patterns (TaskDetailPanel header).

## Affected IA

No changes.

## Success Metrics

- M1: Pin preference persists across page reloads (localStorage)
- M2: No layout shift when selecting/deselecting tasks while pinned (measured by stable column widths)
- M3: Mutation testing score >= 95% on new hook and preference code

## Open Questions

None.
