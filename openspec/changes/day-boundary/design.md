## Context

Hidden tasks appear at midnight local time, but some users (night owls, shift workers) consider their day to end later. The app needs a configurable "day boundary" — the time when the logical day starts. This affects task reveal, recurring task calculations, and completed task grouping.

Current state: `useHiddenTasksReveal` schedules a timer for midnight and uses `clock.plainDateISO()` as "today". `TaskService.complete()` and `groupCompletedTasks()` also use calendar date and midnight as the day boundary. All these are hardcoded to `"00:00"`.

Driven by FR1–FR11 from proposal.

## Goals / Non-Goals

**Goals:**
- Introduce `getLogicalDate(clock, dayBoundary)` as the single source of truth for "what day is it now"
- Thread `logicalDate` through services as a parameter — services stay pure and testable
- Use existing Settings sync infrastructure for the new setting
- Maintain full backward compatibility when boundary is "00:00"

**Non-Goals:**
- Modifying the `Clock` interface — it's a low-level abstraction, day boundary is business logic
- Creating a DayBoundaryProvider — prop threading from pages is sufficient for now
- Server-side changes — settings are generic key-value pairs, no new server code needed

## Decisions

### D1: Logical date as parameter, not injected dependency
**Decision:** Services (`HiddenTaskService`, `TaskService`) receive `logicalDate` as an optional parameter. Callers (hooks, pages) compute it from `getLogicalDate(clock, dayBoundary)`.

**Rationale:** Keeps services pure — no async setting reads inside business logic, easy to test by passing any date. The alternative (injecting `SettingsService`) adds async I/O and mocking complexity to every service test.

**Trade-off:** Every call site must know to pass `logicalDate`. Acceptable because there are only 3-4 callers.

### D2: Custom event for cross-boundary communication
**Decision:** `useSettings` dispatches `DAY_BOUNDARY_CHANGED_EVENT` when setting changes. `useHiddenTasksReveal` listens for it.

**Rationale:** `useHiddenTasksReveal` runs in `App.tsx` outside `SyncProvider`, so it cannot use `useSettings()`. Reading from `localStorage` on mount + listening for custom events follows the existing pattern (`sync_complete` event).

**Alternative considered:** Moving `useHiddenTasksReveal` inside `SyncProvider` — rejected because it requires restructuring the component tree for one setting.

### D3: Native `<input type="time">` for UI
**Decision:** Use `<input type="time">` for the day boundary picker.

**Rationale:** Platform-native UX, built-in HH:mm validation, accessible by default, no custom component needed. Consistent with the app's minimal UI philosophy.

### D4: Grouping functions receive `dayBoundary` string, not `logicalDate`
**Decision:** `groupCompletedTasks`, `getDayBoundaries`, `formatCompletedAt`, `formatShortDateTime` receive `dayBoundary: string` parameter (not a pre-computed logical date).

**Rationale:** These functions need both the boundary time AND the logical date to compute group boundaries correctly. They use `dayBoundary` as `plainTime` in `toZonedDateTime()` calls AND call `getLogicalDate` internally to determine "today". Passing just `logicalDate` would lose the boundary time needed for group boundaries.

### D5: Storage format is HH:mm string
**Decision:** Store day boundary as `"HH:mm"` string (e.g., `"02:00"`, `"00:00"`).

**Rationale:** Directly usable with `Temporal.PlainTime.from()` and `<input type="time">`. No conversion needed at any layer. Minutes granularity covers all reasonable use cases.

## Risks / Trade-offs

- **[Risk] Timer drift after timezone change** → Mitigated: `visibilitychange` handler already recalculates timer. Adding `dayBoundary` to the calculation doesn't change this behavior.
- **[Risk] Reveal is irreversible** → If user shifts boundary forward after midnight (e.g., 00:00→02:00 at 01:00), tasks already revealed at midnight stay visible. This is acceptable — reveal sets `is_hidden=false` and syncs. No "un-reveal" mechanism exists or is needed.
- **[Risk] SettingsPage already 710 lines** → Mitigated by extracting `DayBoundarySection` as a separate component. Does not reduce SettingsPage size but prevents growth.
- **[Trade-off] Prop threading vs Provider** → Passing `dayBoundary` as props from pages to components is slightly verbose but avoids adding a new React context. Can be upgraded to a provider later if more consumers appear.
