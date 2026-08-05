## ADDED Requirements

### Requirement: Reactive current logical date source
# implements FR1, FR2 of fix-completed-today-stale-on-day-rollover

The system SHALL provide a shared reactive source of the current logical date that exposes the logical date (computed via `getLogicalDate` in the user's timezone and configured day boundary) to React as state via `useSyncExternalStore`. The source SHALL update its value when the logical day changes while the app stays mounted, by scheduling a single self-rescheduling day-boundary timer. It SHALL also recompute on `visibilitychange` → visible, on `pageshow` when persisted, and on `DAY_BOUNDARY_CHANGED_EVENT`. It SHALL emit a change to subscribers only when the logical date value actually changes.

#### Scenario: Value updates when boundary is crossed while mounted
- **WHEN** a component subscribes to the source, current logical date is June 4, and the clock advances past the day boundary into June 5
- **THEN** the source emits and its value becomes June 5 without any remount

#### Scenario: No emit when re-armed but date unchanged
- **WHEN** the source recomputes (e.g. on visibilitychange) but the logical date is unchanged
- **THEN** no change is emitted to subscribers

#### Scenario: Recompute on return to visibility after boundary passed
- **WHEN** the tab was hidden while the clock crossed the boundary and then becomes visible
- **THEN** the source recomputes immediately and reflects the new logical date

#### Scenario: Recompute on day boundary setting change
- **WHEN** `DAY_BOUNDARY_CHANGED_EVENT` fires and the new boundary changes the current logical date
- **THEN** the source recomputes and emits the new logical date

### Requirement: Single boundary timer regardless of subscriber count
# implements NFR-P1, FR2 of fix-completed-today-stale-on-day-rollover

The reactive logical-date source SHALL maintain at most one day-boundary timer and one set of global re-arm listeners regardless of how many components are subscribed. The timer and listeners SHALL be created when the first subscriber registers and torn down when the last subscriber unsubscribes.

#### Scenario: Many subscribers share one timer
- **WHEN** many list items subscribe to the source
- **THEN** exactly one boundary timer and one set of re-arm listeners exist

#### Scenario: Teardown on last unsubscribe
- **WHEN** the last subscriber unsubscribes
- **THEN** the boundary timer is cleared and the re-arm listeners are removed

### Requirement: Today-relative displays react to day rollover without remount
# implements FR3, FR4, FR5, FR6, FR7 of fix-completed-today-stale-on-day-rollover

Every "today"-relative display surface SHALL recompute or re-render when the reactive logical date changes, without requiring a remount. This applies to: the ActiveTasksPage "completed today" section, the CompletedPage grouping, the TaskItem completed-at label, the GoalItem date label, and the TaskDetailsTab next-date label.

#### Scenario: Completed-today section clears yesterday's tasks at boundary
- **WHEN** the ActiveTasksPage is mounted showing a task completed on the previous logical day, and the clock crosses the day boundary
- **THEN** the task is removed from the "completed today" section without a remount

#### Scenario: Completed page grouping rebuckets at boundary
- **WHEN** the CompletedPage is mounted and the clock crosses the day boundary
- **THEN** a task previously in the "Today" group moves to the "Yesterday" group without a remount

#### Scenario: TaskItem label updates at boundary
- **WHEN** a TaskItem shows a "completed today" label and the clock crosses the day boundary
- **THEN** the label re-renders to the "completed yesterday" (previous-day) form without a remount

#### Scenario: GoalItem label updates at boundary
- **WHEN** a GoalItem shows a "Today" date label and the clock crosses the day boundary
- **THEN** the label re-renders to the "Yesterday" form without a remount

#### Scenario: TaskDetailsTab next-date label updates at boundary
- **WHEN** a TaskDetailsTab shows a next-date "Today"/"Tomorrow" label and the clock crosses the day boundary
- **THEN** the label re-renders to the correct relative form without a remount

#### Scenario: Custom day boundary respected for rollover
- **WHEN** the day boundary is "04:00" and the app is mounted with a task completed at 10:00 on June 4, and the clock advances to 04:00 on June 5
- **THEN** the task leaves the "completed today" section exactly at the 04:00 rollover, not at midnight

### Requirement: Shared boundary-timer helper reused by hidden-task reveal
# implements FR8 of fix-completed-today-stale-on-day-rollover

The day-boundary timer math SHALL be extracted into a reusable `scheduleNextBoundary(clock, dayBoundary, onFire)` helper and reused by both `useHiddenTasksReveal` and the reactive logical-date source. The extraction SHALL NOT change the observable reveal behavior of `useHiddenTasksReveal`.

#### Scenario: Reveal behavior unchanged after extraction
- **WHEN** the hidden-task reveal runs across a day boundary using the extracted helper
- **THEN** hidden tasks are revealed at the boundary exactly as before the refactor

#### Scenario: Helper schedules next boundary for non-midnight time
- **WHEN** `scheduleNextBoundary` is called with day boundary "02:00" and current time 23:00
- **THEN** the scheduled fire time is the next 02:00 occurrence (plus the boundary buffer)
