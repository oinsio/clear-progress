# Design: fix-focused-goal-highlight

## Context

Currently, `GoalDetailPage` passes a hardcoded `mode="goals"` to `RightFilterPanel`. This always highlights the "Goals" menu item, even when the user navigated to the page via a focused goal in the panel. `FocusedGoalNavItem` has no `isActive` prop — all focused goals look the same regardless of which page is open.

The data needed to fix this already exists: `GoalDetailPage` knows the current `goalId` (from `useParams`) and the list of focused goals (from `useFocusedGoals`). The fix is purely a prop-threading change through 4 components.

## Goals / Non-Goals

**Goals:**
- Thread active focused goal state from GoalDetailPage through the panel component tree (FR1-FR6)
- Fallback to "Goals" highlight when focused_goals block is hidden in menu (FR3)

**Non-Goals:**
- No new data model changes, no new hooks, no new state management
- No changes to other pages (InboxPage, GoalsPage, etc.)

## Decisions

### Decision 1: New `activeFocusedGoalId` prop vs new mode value

**Chosen: New `activeFocusedGoalId?: string` prop on RightFilterPanel.**

Adding a new mode value (e.g., `"focused_goal"`) would conflate two concerns: which section is active vs which specific item is active. The focused goal highlight is item-level, not section-level.

With the prop approach:
- `mode=null` + `activeFocusedGoalId=id` → highlights specific focused goal (FR1)
- `mode="goals"` + no `activeFocusedGoalId` → highlights "Goals" (FR2, FR3, FR4)

**Alternative rejected**: Adding `mode="focused_goal:{id}"` — requires parsing, violates the existing type system.

### Decision 2: Visibility check for focused_goals in menu

GoalDetailPage needs to check if `focused_goals` is visible in `menuOrder` to implement the fallback (FR3). This uses the existing `useMenuOrder` hook — no new infrastructure needed.

```
const { menuOrder } = useMenuOrder();
const isFocusedGoalsVisible = menuOrder.some(
  c => c.mode === "focused_goals" && c.visible
);
```

### Decision 3: Prop threading path

```
GoalDetailPage
  └─ RightFilterPanel (activeFocusedGoalId?: string)
       └─ FocusedGoalsBlock (activeGoalId?: string)
            └─ FocusedGoalNavItem (isActive: boolean)
```

Each layer passes the minimum needed. `FocusedGoalsBlock` compares `activeGoalId === goal.id` to derive the boolean for each `FocusedGoalNavItem`.

## Risks / Trade-offs

- **[Low risk]** Adding a prop to RightFilterPanel that only GoalDetailPage uses. Other pages pass `undefined` (default). This is acceptable for a targeted fix — no over-abstraction needed.