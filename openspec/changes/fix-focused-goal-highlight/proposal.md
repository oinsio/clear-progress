# fix-focused-goal-highlight

## Why

When navigating to a specific goal page (`/goals/{id}`) that is in focus, the right panel highlights the "Goals" menu item instead of the specific focused goal. This breaks the visual connection between what the user clicked in the panel and where they landed. The user cannot tell which focused goal is currently being viewed.

## What Changes

- **MODIFIED**: RightFilterPanel highlights the specific focused goal (instead of "Goals") when viewing a focused goal's detail page
- **MODIFIED**: FocusedGoalNavItem gains active state styling
- **MODIFIED**: GoalDetailPage dynamically switches between highlighting "Goals" and a specific focused goal based on whether the current goal is in focus
- Fallback to "Goals" highlight when the goal is not in focus or when `focused_goals` block is hidden in menu settings

## Goals

- G1: Active focused goal is visually distinguishable in the right panel when its detail page is open

## Non-Goals

- NG1: Changing how focused goals work in navigation on non-goal pages (InboxPage, etc.)
- NG2: Adding new focused goal functionality beyond highlight behavior

## Users & Scenarios

- U1: User clicks a focused goal in the right panel, lands on its detail page, and sees that specific goal highlighted in the panel
- U2: User is on a focused goal's page and toggles focus off — highlight moves to "Goals"
- U3: User is on a focused goal's page and toggles focus on — highlight moves from "Goals" to the specific focused goal
- U4: User has `focused_goals` hidden in menu settings and navigates to a focused goal — "Goals" is highlighted (fallback)

## Requirements

### Functional

- FR1: When on `/goals/{id}` and the goal is in focus and `focused_goals` is visible in menu → highlight that specific focused goal in the panel, do NOT highlight "Goals"
- FR2: When on `/goals/{id}` and the goal is NOT in focus → highlight "Goals" as before
- FR3: When on `/goals/{id}` and the goal is in focus but `focused_goals` is hidden in menu settings → highlight "Goals" (fallback)
- FR4: When on `/goals` (list page) → highlight "Goals" as before (no change)
- FR5: Highlight must reactively update when focus state changes (add/remove focus on GoalDetailPage)
- FR6: Only the current goal's nav item is highlighted, not all focused goals

### Non-Functional

#### Accessibility

- NFR-A1: Active focused goal nav item must have `aria-pressed="true"` or equivalent accessible state

## UX Acceptance Criteria

- UX1: Active focused goal uses the same highlight style as other active panel items (`bg-white/20 text-white` for expanded, `bg-white/20 text-white` for collapsed)
- UX2: Transition between "Goals" highlight and focused goal highlight is instant (no animation delay)

## Behavior

See `src/test/features/goal_focus/goal_focus_navigation.feature` (@fix-focused-goal-highlight tags)

## Affected IA

No changes.

## Success Metrics

- M1: When on a focused goal's page, the correct focused goal is highlighted in the panel (not "Goals")

## Open Questions

None.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-focus`: Adding highlight/active state for focused goal nav items in the right panel

## Impact

- `GoalDetailPage.tsx` — conditional mode and activeFocusedGoalId prop
- `RightFilterPanel.tsx` — new `activeFocusedGoalId` prop, pass through to FocusedGoalsBlock
- `FocusedGoalsBlock.tsx` — new `activeGoalId` prop, pass through to FocusedGoalNavItem
- `FocusedGoalNavItem.tsx` — new `isActive` prop with highlight styling
