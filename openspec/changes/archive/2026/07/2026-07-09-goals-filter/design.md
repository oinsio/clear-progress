## Context

GoalsPage shows all non-deleted goals without status filtering. CommandBarFilter is tightly coupled to BoxFilter type with hardcoded icons from BoxIcons.tsx. Users need to filter goals by status groups, and CommandBarFilter needs to become generic to support this.

Existing patterns: `useHandedness`, `usePanelSide`, `useFilterBarPosition` — all use `usePreference` with enum config for localStorage persistence. `ShowHiddenProvider` uses a Context provider, but simple hooks are the dominant pattern.

Driven by FR1-FR10 from proposal.

## Goals / Non-Goals

**Goals:**
- Generic CommandBarFilter that works with any string-based filter type (FR7)
- Goal status filter with localStorage persistence (FR1, FR6)
- Zero regressions in ActiveTasksPage box filter (M3)

**Non-Goals:**
- Changing the visual style of CommandBarFilter
- Adding filter to GoalDetailPage

## Decisions

### D1: Generic CommandBarFilter via props-driven icons/labels

**Decision**: Make CommandBarFilter accept a generic `items` array with `{ value, icon, label }` objects instead of hardcoded `BOX_FILTER_ICONS` map.

**Alternatives considered**:
- Separate `GoalStatusFilter` component — duplicates expand/collapse logic, outside click handling, styling
- Render props — overengineered for icon swapping

**Rationale**: Minimal API change, maximum reuse. ActiveTasksPage builds the items array from BoxFilter constants, GoalsPage builds from GoalFilter constants. CommandBarFilter becomes entity-agnostic.

### D2: useGoalFilter hook (no provider)

**Decision**: Create `useGoalFilter` hook using `usePreference` with `type: "enum"`, following `useHandedness` pattern. No React Context provider.

**Alternatives considered**:
- `ShowFinishedGoalsProvider` with Context — adds provider nesting to App.tsx for a single-page concern
- Local `useState` — doesn't persist across navigations

**Rationale**: `usePreference` already handles localStorage read/write, cross-component sync via storage events, and self-healing for corrupted values. A provider adds no value here.

### D3: GoalFilter type as union of 4 group values

**Decision**: `type GoalFilter = "active" | "paused" | "finished" | "all"`. Map each to GoalStatus arrays in constants.

**Rationale**: Groups match user mental model better than raw statuses. "active" = planning + in_progress (both mean "working on it"). "finished" = completed + cancelled (both mean "done with it").

### D4: Lucide icons for goal filter, AllBoxesIcon reused for "all"

**Decision**: Use `Play`, `Pause`, `Check` from lucide-react for active/paused/finished. Reuse existing `AllBoxesIcon` SVG component for "all".

**Rationale**: Play/Pause/Check already used in GoalEditDetailsTab for individual statuses — visual consistency. AllBoxesIcon (three circles) already means "show everything" in task filter.

### D5: FINISHED_GOAL_STATUSES moved to constants

**Decision**: Move `FINISHED_GOAL_STATUSES` from `GoalItem.tsx` to `constants/index.ts` and add `GOAL_FILTER_STATUS_MAP` mapping each GoalFilter to its GoalStatus array.

**Rationale**: GoalItem.tsx uses it for display logic, GoalsPage will use it for filtering — shared constant avoids duplication.

## Risks / Trade-offs

- [CommandBarFilter API change] → All existing usages (ActiveTasksPage, InboxPage tests) must be updated. Risk: missed callsite. Mitigation: TypeScript will catch missing props at compile time.
- [Default "all" shows finished goals] → Users who previously didn't see finished goals (because they were sorted to the bottom) now explicitly see them as default. Trade-off: consistency over hiding — user can switch to "active" and it persists.
