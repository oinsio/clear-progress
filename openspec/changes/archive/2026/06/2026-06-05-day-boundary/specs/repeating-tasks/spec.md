## MODIFIED Requirements

### Requirement: System manages hidden state of recurring copies
# implements FR10 of repeating-tasks-specs, FR7 of day-boundary

A recurring copy MUST be created with is_hidden=true if appear_date is after the logical date. Copy MUST be created with is_hidden=false if appear_date is on or before the logical date. Hidden tasks MUST NOT appear in box lists, search, or association queries. `TaskService.complete()` SHALL accept an optional `logicalDate` parameter; when provided, it SHALL use that date for the `shouldReveal` comparison instead of `clock.plainDateISO()`.

#### Scenario: Recurring copy hidden when appear_date is future
- **GIVEN** logical date is "2026-01-15" and calculated appear_date is "2026-01-20"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden true

#### Scenario: Recurring copy visible when appear_date is today
- **GIVEN** logical date is "2026-01-15" and calculated appear_date is "2026-01-15"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden false

#### Scenario: Recurring copy visible when appear_date is past
- **GIVEN** logical date is "2026-01-20" and calculated appear_date is "2026-01-15"
- **WHEN** system creates a recurring copy
- **THEN** copy has is_hidden false

#### Scenario: Logical date used when day boundary is non-midnight
- **GIVEN** day boundary is "02:00" and current time is 01:30 on June 5 (logical date June 4) and appear_date is "2026-06-05"
- **WHEN** system creates a recurring copy with logicalDate "2026-06-04"
- **THEN** copy has is_hidden true (appear_date > logicalDate)

#### Scenario: Backward compatibility without logicalDate
- **GIVEN** `complete()` is called without logicalDate parameter
- **WHEN** system evaluates shouldReveal
- **THEN** calendar date from `clock.plainDateISO()` is used

### Requirement: System reveals hidden tasks when appear date arrives
# implements FR11 of repeating-tasks-specs, FR4 of day-boundary

System MUST reveal hidden tasks (set is_hidden=false, mark for sync) when appear_date <= logical date. Reveal MUST be triggered on: app mount, day boundary transition (instead of midnight), sync_complete event, return from background (visibility change), and day boundary setting change.

#### Scenario: Reveal tasks whose appear_date has arrived
- **GIVEN** hidden task with appear_date "2026-01-15" and logical date is "2026-01-15"
- **WHEN** system runs reveal check
- **THEN** task has is_hidden false, needsSync true

#### Scenario: Do not reveal tasks whose appear_date is future
- **GIVEN** hidden task with appear_date "2026-01-20" and logical date is "2026-01-15"
- **WHEN** system runs reveal check
- **THEN** task remains hidden

#### Scenario: Reveal triggered on app mount
- **WHEN** app mounts
- **THEN** system runs reveal check with current logical date

#### Scenario: Reveal triggered at day boundary
- **WHEN** clock passes the configured day boundary time
- **THEN** system runs reveal check with new logical date

#### Scenario: Reveal triggered on day boundary change
- **WHEN** user changes the day boundary setting
- **THEN** system immediately runs reveal check with recalculated logical date
