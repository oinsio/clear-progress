# Add Goal Focus

## Why

Users frequently switch between goals they are currently focused on. To quickly access tasks of a priority goal, a "focus" mechanism is needed — select 1-2 goals and get quick access to them from the navigation panel. Focused goals must sync across devices.

## What Changes

- **ADDED**: Ability to mark 1-2 goals as "focused"
- **ADDED**: Focused goals block in the navigation panel (RightFilterPanel)
- **ADDED**: New MenuMode `"focused_goals"` — a single movable block in menu order settings
- **MODIFIED**: GoalDetailPage — focus toggle icon in action bar (similar to the show/hide completed tasks icon)
- **MODIFIED**: Settings entity — two new keys `focused_goal_1`, `focused_goal_2` (synced via IndexedDB)

## Goals

- G1: Navigate to focused goal's tasks in 1 click from any screen
- G2: Focused goals are identical across all user's devices

## Non-Goals

- NG1: Automatic goal selection for focus (manual only)
- NG2: More than 2 goals in focus (hard limit to prevent losing focus)
- NG3: Changing GoalDetailPage — goal task display remains the same
- NG4: Focused goals in BottomNav (mobile navigation stays unchanged)

## Users & Scenarios

- U1: User selects goal "Write a book" for focus → sees it in the navigation panel → navigates to its tasks with one click
- U2: User tries to add a 3rd goal to focus → sees a dialog with current focused goals → replaces one of them or cancels
- U3: User removes a goal from focus → it disappears from the navigation panel
- U4: User adds a goal to focus on phone → opens the app on laptop → sees the same goal in navigation

## Requirements

### Functional

- FR1: User can add a goal to focus via a toggle icon on GoalDetailPage
- FR2: Maximum 2 goals in focus simultaneously (hard limit)
- FR3: When attempting to add a 3rd goal, a replacement dialog is shown: current focused goals + choice to replace one or cancel
- FR4: Focused goals are displayed in RightFilterPanel as separate navigation items
- FR5: Clicking a focused goal in navigation leads to `/goals/:id` (GoalDetailPage)
- FR6: `"focused_goals"` — a single MenuMode in menuOrder, moves as one block in menu order settings
- FR7: If there are 0 focused goals, the `"focused_goals"` block takes no space in navigation
- FR8: Focused goals are stored in Settings IndexedDB (keys `focused_goal_1`, `focused_goal_2`) and synced across devices
- FR9: If a focused goal is deleted (soft delete) or completed/cancelled — it is automatically removed from focus
- FR10: User can remove a goal from focus via the same toggle icon on GoalDetailPage
- FR11: If `focused_goal_1` or `focused_goal_2` contains invalid data (not UUID v4 or goal not found on client) — the value is cleared to `""`, slots are compacted, and the corrected data is synced to server

### Non-Functional

#### Performance

- NFR-P1: Focus toggle (add/remove) — response < 100ms (optimistic UI)

#### Accessibility

- NFR-A1: Focus toggle icon is keyboard accessible (Tab, Enter/Space)
- NFR-A2: Icon has aria-label reflecting current state ("Add to focus" / "Remove from focus")
- NFR-A3: Replacement dialog is keyboard accessible, focus is managed correctly

#### Responsive

- NFR-R1: Focused goals are displayed in RightFilterPanel on all screen sizes (expanded and collapsed modes)

## UX Acceptance Criteria

- UX1: Focus icon is visually similar to the show/hide completed tasks icon on GoalDetailPage (same style, placement in action bar)
- UX2: In navigation, focused goals show a circle with the goal's cover image. If no cover — a circle with the default goal image
- UX3: The 3rd goal replacement dialog clearly shows current focused goals and offers specific actions: replace Goal A, replace Goal B, or cancel
- UX4: When removing a goal from focus, it smoothly disappears from navigation (no UI jank)

## UI States Matrix

| Focused goals                  | Navigation (RightFilterPanel) | Icon on GoalDetailPage                         |
|--------------------------------|-------------------------------|------------------------------------------------|
| 0                              | focused_goals block is hidden | Inactive icon                                  |
| 1                              | One item with goal name       | Active icon for this goal, inactive for others |
| 2                              | Two items with goal names     | Active for focused, inactive for others        |
| 2 + attempt to add             | Replacement dialog            | —                                              |
| Focused goal deleted/completed | Item disappears               | Inactive icon                                  |

## Behavior

See `features/goal_focus.feature` (tags `@add-goal-focus`)

## Affected IA

No changes. No new routes are added — focused goals lead to the existing `/goals/:id`.

## Success Metrics

- M1: Average number of clicks to navigate to a priority goal's tasks decreases from 3 (Menu → Goals → Goal) to 1 (Menu → Focused goal)

## Open Questions

_All questions resolved._

- ~Q1: Focus icon only on GoalDetailPage. Not on GoalItem (`/goals`) for now. Will add later if the feature proves popular.~
- ~Q2: Yes — navigation shows a circle with goal's cover image (instead of standard icon). If no cover — a circle with default goal image.~

## Capabilities

### New Capabilities

- `goal-focus`: Mechanism for selecting 1-2 goals for quick access from navigation with cross-device sync

### Modified Capabilities

_No changes to existing specs._

## Impact

- `packages/contract` — new MenuMode `"focused_goals"` in MenuModeSchema, new Settings keys
- `packages/client` — useMenuOrder, RightFilterPanel, GoalDetailPage, useSettings, replacement dialog
- `packages/adapter-gas` / `packages/adapter-inmemory` — no changes (Settings already support arbitrary keys)
