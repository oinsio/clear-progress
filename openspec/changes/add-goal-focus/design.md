# Design: Add Goal Focus

## Context

User wants quick access to 1-2 priority goals from the navigation panel. Current path to a goal's tasks: RightFilterPanel → Goals → specific goal (3 clicks). Need to reduce to 1 click.

Existing mechanisms:
- **Settings (IndexedDB)** — key-value store, synced via pull/push. Keys: `default_box`, `accent_color`, `custom_accent_light`, `custom_accent_dark`.
- **MenuMode + useMenuOrder** — manages menu item order and visibility. Stored in localStorage. Type `MenuMode` defined in `packages/contract`.
- **RightFilterPanel** — renders menu by `menuOrder`. Each mode → one item.
- **GoalDetailPage** — action bar with icons (show completed tasks, etc.).

## Goals / Non-Goals

**Goals:**
- Minimal changes to existing architecture
- Use Settings for synchronization (FR8)
- Fit focused goals into the existing menuOrder system (FR6)

**Non-Goals:**
- New IndexedDB tables
- Server API changes
- BottomNav changes

## Decisions

### D1: Storage — Settings IndexedDB with two keys

**Decision:** Two keys in Settings: `focused_goal_1` and `focused_goal_2`. Value — `goal_id` (UUID v4) or `""` (empty).

**Ordering invariant:** `focused_goal_1` is always filled first. No gaps allowed — if `focused_goal_1` is empty, then `focused_goal_2` is also empty. When removing from position 1 — value from position 2 shifts up. New goal is always added to the last free position (`focused_goal_2`, or `focused_goal_1` if both are empty). When replacing via dialog: remaining goal shifts to `focused_goal_1`, new goal goes to `focused_goal_2`.

**Why:** Settings already sync via pull/push without backend changes. Arbitrary keys are supported. Two separate keys are simpler than a JSON array — no parsing needed, standard sync cycle.

**Alternative — JSON array in one key:** `focused_goals = '["id1","id2"]'`. Rejected: requires parsing, serialization, error handling for invalid JSON.

**Alternative — `is_focused` field in Goal entity:** Rejected: changes Goal contract, requires backend changes, violates "max 2" constraint at the data level.

### D2: MenuMode `"focused_goals"` — single block

**Decision:** Add `"focused_goals"` to `MenuModeSchema` (`packages/contract`). In `useMenuOrder` it behaves as a single element for drag-drop. In `RightFilterPanel` it renders as 0, 1, or 2 navigation items depending on the number of focused goals.

**Why:** Fits into the existing system with minimal changes. One mode = one block in menu order settings, preventing focused goals from being split by other items.

### D3: Hook `useFocusedGoals`

**Decision:** New hook that:
- Reads `focused_goal_1` and `focused_goal_2` from Settings (via existing `useSettings` or directly from Dexie liveQuery)
- Provides `focusedGoalIds: string[]` (0-2 elements)
- Provides `addGoalToFocus(goalId)` — adds, returns `'added' | 'limit_reached'`
- Provides `removeGoalFromFocus(goalId)` — removes
- Provides `isGoalFocused(goalId): boolean`
- Auto-cleanup: if goal is deleted/completed/cancelled — automatically removes from focus (FR9)

### D4: Replacement dialog at limit

**Decision:** When `addGoalToFocus` returns `'limit_reached'`, GoalDetailPage shows a dialog (FR3). Dialog shows names of current focused goals and offers:
- Replace Goal A with the new goal
- Replace Goal B with the new goal
- Cancel

Implementation: `FocusGoalReplacementDialog` component — uses existing dialog patterns in the project.

### D5: Focus icon on GoalDetailPage

**Decision:** Toggle icon in action bar next to existing icons (e.g., next to the show completed tasks icon). Use `Star` / `StarOff` icon from lucide-react (or equivalent from the icon library in use).

## Risks / Trade-offs

**[Risk] Deleted/completed goal remains in focus** → Mitigation: `useFocusedGoals` checks goal status on every render. If goal is `is_deleted`, `completed`, or `cancelled` — automatically clears the Settings key (FR9).

**[Risk] Desync between menuOrder and focused goals** → Mitigation: If `"focused_goals"` mode is missing from menuOrder (first launch after update), the hook adds it to the end with `visible: true`. No migration needed — `useMenuOrder` already handles unknown modes via fallback.

**[Risk] Race condition during sync — two devices set different goals** → Mitigation: Last-write-wins (standard Settings sync behavior). Acceptable for this use-case.

## Closed Questions

- ~Q1: Focus icon only on GoalDetailPage. Not on GoalItem for now.~
- ~Q2: Yes — circle with goal's cover image in navigation. Without cover — circle with default goal image.~
