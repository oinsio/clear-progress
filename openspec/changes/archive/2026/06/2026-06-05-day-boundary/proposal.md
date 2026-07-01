# Day Boundary

## Why

Hidden (deferred) tasks currently appear at midnight local time. Some users consider their day to end later — a person who goes to bed at 3 AM sees tasks for "tomorrow" pop up while still awake. Letting users configure when their logical day starts improves the experience for night owls and shift workers.

## What Changes

- **ADDED**: User-configurable "day boundary" setting (HH:mm) that defines when the logical day starts
- **MODIFIED**: Hidden task reveal logic uses logical date instead of calendar date
- **MODIFIED**: Completed tasks grouping (Today/Yesterday/Week/Month) respects day boundary
- **MODIFIED**: Recurring task next-date calculation uses logical date
- **MODIFIED**: Settings page gets a new "Day start time" section

## Goals

- G1: Users can set a custom day start time (00:00–23:59) that shifts when deferred tasks appear
- G2: All date-dependent features consistently use the logical date derived from the boundary

## Non-Goals

- NG1: Per-task day boundary overrides — one global setting is enough
- NG2: Server-side scheduling — all reveal logic runs on the client
- NG3: Changing how `completed_at` timestamps are stored — only display grouping changes

## Users & Scenarios

- U1: Night owl (boundary 02:00) — completes a task at 01:30, it groups under the previous logical day. Deferred task for "tomorrow" doesn't appear until 02:00.
- U2: Early riser (boundary 00:00, default) — no change in behavior, everything works as before.
- U3: Shift worker (boundary 08:00) — tasks for "today" appear at 8 AM when the work shift starts.

## Requirements

### Functional

- FR1: Add `day_boundary` setting stored as HH:mm string (e.g., "02:00"), default "00:00"
- FR2: Setting syncs to server via existing Settings key-value infrastructure
- FR3: `getLogicalDate(clock, dayBoundary)` utility returns previous calendar day if current time < boundary, else current day
- FR4: Hidden task reveal uses logical date: tasks with `appear_date <= logicalDate` are revealed
- FR5: Reveal timer fires at the day boundary time instead of midnight
- FR6: On boundary change: recalculate timer + immediate reveal check
- FR7: `TaskService.complete()` uses logical date for `shouldReveal` check and next-date context
- FR8: Completed tasks grouping (Today/Yesterday/Week/Month/Earlier) uses day boundary for group boundaries
- FR9: `formatCompletedAt` and `formatShortDateTime` use day boundary for Today/Yesterday labels
- FR10: Settings page shows "Day start time" section with `<input type="time">`
- FR11: Validation rejects invalid values (not HH:mm, out of range)
- FR12: Self-healing: if an invalid day_boundary value is read from storage, fallback to "00:00" and overwrite the invalid value with the default (mark needsSync for server correction)

### Non-Functional

#### Performance

- NFR-P1: `getLogicalDate` is a pure computation — must complete in <1ms

#### Accessibility

- NFR-A1: Time input has accessible label and description

#### Responsive

- NFR-R1: Day boundary setting renders correctly on mobile (320px+)

## UX Acceptance Criteria

- UX1: Default value is "00:00" — existing users see no change
- UX2: Setting appears on Settings page after "Default box" section
- UX3: Time picker uses native `<input type="time">` for platform-native UX
- UX4: Change takes effect immediately — no restart or refresh needed
- UX5: Setting label clearly communicates what it controls

## Behavior

- Reference: `features/day-boundary.feature` (@day-boundary tags)
- Reference: `features/day-boundary-grouping.feature` (@day-boundary tags)

## Visual Reference

No Figma needed — uses native `<input type="time">` in existing Settings page layout.

## Affected IA

No IA changes — setting added to existing Settings page.

## Capabilities

### New Capabilities

- `day-boundary`: Configurable day start time that shifts the logical date for task reveal, grouping, and recurring task calculations

### Modified Capabilities

- `repeating-tasks`: Recurring task next-date and shouldReveal logic uses logical date instead of calendar date
- `settings`: New `day_boundary` key added to synced settings

## Impact

- **Client services**: `HiddenTaskService`, `TaskService`, grouping utils in `shared/lib/utils.ts`
- **Client hooks**: `useHiddenTasksReveal`, `useSettings`
- **Client UI**: `SettingsPage`, `CompletedPage`, components using `formatCompletedAt`/`formatShortDateTime`
- **Constants**: New `SETTING_KEYS.DAY_BOUNDARY`, `DEFAULT_DAY_BOUNDARY`
- **Server**: No changes — uses existing Settings key-value sync
- **Dependencies**: None new

## Success Metrics

- M1: All existing tests pass without modification (backward compatibility via "00:00" default)
- M2: Mutation testing score >=95% on `getLogicalDate` and modified services
- M3: Hidden task reveal respects day boundary in unit and BDD tests

## Open Questions

None — all questions resolved during exploration phase.
