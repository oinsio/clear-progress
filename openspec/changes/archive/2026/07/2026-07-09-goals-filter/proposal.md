# goals-filter

## Why

Goals page shows all goals regardless of status, mixing active work with completed and cancelled goals. Users need to focus on current goals without visual clutter. A status filter in the CommandBar (analogous to box filter for tasks) lets users quickly switch views.

## What Changes

- **ADDED**: Goal status filter with 4 groups: active (planning + in_progress), paused, finished (completed + cancelled), all (default)
- **MODIFIED**: CommandBarFilter generalized from BoxFilter-specific to generic, accepting any filter type via props
- **ADDED**: `useGoalFilter` hook persisting selected filter in localStorage via `usePreference`
- **ADDED**: Specific empty state messages per filter group on GoalsPage

## Capabilities

### New Capabilities

- `goal-status-filter`: Goal status filter type, constants, hook, filter logic, and GoalsPage integration

### Modified Capabilities

- `command-bar`: CommandBarFilter generalized to accept generic filter items with icons and labels via props instead of hardcoded BoxFilter icons

## Goals

- G1: Let users focus on goals in a specific status group without distraction
- G2: Reuse CommandBarFilter pattern for non-task entities

## Non-Goals

- NG1: Per-status filtering (5 individual statuses) — groups are sufficient
- NG2: Multi-select filters (e.g., active + paused at once)
- NG3: Filter on GoalDetailPage — only GoalsPage list

## Users & Scenarios

- U1: User with 10+ goals wants to see only active work — selects "active" filter
- U2: User wants to review completed goals — selects "finished" filter
- U3: User returns to app — filter persists from last session

## Requirements

### Functional

- FR1: GoalsPage SHALL display a filter in CommandBar with 4 options: active, paused, finished, all
- FR2: Default filter value SHALL be "all", showing all non-deleted goals
- FR3: "active" filter SHALL show goals with status planning or in_progress
- FR4: "paused" filter SHALL show goals with status paused
- FR5: "finished" filter SHALL show goals with status completed or cancelled
- FR6: Selected filter SHALL persist in localStorage and restore on page load
- FR7: CommandBarFilter SHALL accept generic filter items (value, icon, label) instead of hardcoded BoxFilter icons
- FR8: GoalsPage SHALL show filter-specific empty state messages when no goals match the selected filter
- FR9: Filter icons: Play (active), Pause (paused), Check (finished), AllBoxesIcon (all)
- FR10: CommandBar on GoalsPage SHALL NOT show eyeToggle — filter replaces it

### Non-Functional

#### Accessibility

- NFR-A1: Each filter button SHALL have an aria-label with translated filter name
- NFR-A2: Active filter button SHALL be visually distinguishable (bg-accent text-white)

#### Responsive

- NFR-R1: Filter SHALL work on mobile — collapsed by default, expands on tap (same as BoxFilter behavior)

## UX Acceptance Criteria

- UX1: Filter collapsed state shows active filter icon + chevron, consistent with task box filter
- UX2: Filter expanded state shows all 4 icons in a row
- UX3: Tapping a filter icon selects it, collapses the filter, and updates the goal list
- UX4: Active filter button uses accent color (bg-accent text-white), inactive buttons are gray
- UX5: Empty state messages are specific: "Нет активных целей", "Нет целей на паузе", "Нет завершённых целей"

## UI States Matrix

| Filter | Goals exist | Goals absent | UI |
|---|---|---|---|
| all | Show all non-deleted goals | "Нет ни одной цели" | Standard empty |
| active | Show planning + in_progress | "Нет активных целей" | Filter-specific empty |
| paused | Show paused only | "Нет целей на паузе" | Filter-specific empty |
| finished | Show completed + cancelled | "Нет завершённых целей" | Filter-specific empty |

## Affected IA

No changes — GoalsPage structure remains the same, filter is added to existing CommandBar.

## Success Metrics

- M1: All 4 filter options work correctly, filtering goals by status group
- M2: Filter selection persists across page navigations and app restarts
- M3: CommandBarFilter is reusable — ActiveTasksPage continues to work with BoxFilter unchanged
- M4: Mutation testing score >= 95% on new code

## Open Questions

None — design decisions made during exploration.
