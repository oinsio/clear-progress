## MODIFIED Requirements

### Requirement: System calculates next date for fixed weekly frequency
# implements FR1, FR2, FR5 of unify-next-date-calculation

System MUST calculate `next_date` for weekly frequency using two modes:

**Mode `nearest-match`** (first creation, rule change): System SHALL find the earliest weekday from the weekdays list that is strictly after today, scanning up to 7 days from tomorrow. The `interval` parameter SHALL NOT affect the first jump — it only defines the rhythm for subsequent completions. This ensures consistent behavior between first creation and rule change paths.

**Mode `from-schedule`** (subsequent completions): System SHALL compute `nextDay = previousNextDate + 1`, find the next matching weekday respecting the interval (every N weeks). Skip logic SHALL align to the nearest future week period if the candidate is in the past. Weekdays use ISO 8601 (1=Monday, 7=Sunday). The two-step algorithm (current week first, then advance by interval) is unchanged.

The dead branch `!previousNextDate` in `calculateNextDateWeekly` SHALL be removed — it is unreachable through the public API.

#### Scenario: Weekly nearest-match with interval 1
- **WHEN** mode is `nearest-match`, today is "2026-05-31" (Sunday), weekdays=[1] (Monday), interval=1
- **THEN** result is "2026-06-01" (nearest Monday)

#### Scenario: Weekly nearest-match with interval 2 finds nearest day (bug fix)
- **WHEN** mode is `nearest-match`, today is "2026-05-30" (Saturday), weekdays=[1] (Monday), interval=2
- **THEN** result is "2026-06-01" (nearest Monday, NOT 2026-06-08)

#### Scenario: Weekly nearest-match same result as rule change
- **WHEN** mode is `nearest-match`, today is "2026-06-08" (Monday), weekdays=[5] (Friday), interval=3
- **THEN** result is "2026-06-12" (nearest Friday, interval ignored for first jump)

#### Scenario: Weekly from-schedule with interval 2 single weekday
- **WHEN** mode is `from-schedule`, previousNextDate is "2026-06-01" (Monday), weekdays=[1], interval=2, today is "2026-06-01"
- **THEN** result is "2026-06-15" (Monday two weeks later — interval respected)

#### Scenario: Weekly from-schedule with interval 2 multiple weekdays same week
- **WHEN** mode is `from-schedule`, previousNextDate is "2026-06-01" (Monday), weekdays=[1,3], interval=2, today is "2026-06-01"
- **THEN** result is "2026-06-03" (Wednesday of same week — no interval skip within active week)

#### Scenario: Weekly from-schedule skip logic
- **WHEN** mode is `from-schedule`, previousNextDate is "2026-01-06", weekdays=[1], interval=1, today is "2026-02-01"
- **THEN** result is the nearest Monday on or after "2026-02-01"

### Requirement: System recalculates next_date when repeat rule changes
# implements FR1, FR3 of unify-next-date-calculation

When a user changes the repeat_rule of a task, the system MUST recalculate next_date using the `nearest-match` mode of the unified algorithm. The anchor date is the date of the change. This ensures identical behavior to first creation: the nearest future date matching the new rule is selected, regardless of interval.

#### Scenario: Rule change to weekly with interval 2 finds nearest day
- **WHEN** user changes to weekly weekdays=[3] (Wednesday), interval=2 on "2026-06-08" (Monday)
- **THEN** next_date is "2026-06-10" (nearest Wednesday, same as first creation would produce)

#### Scenario: Rule change to monthly finds nearest day_of_month
- **WHEN** user changes to monthly day_of_month=15 on "2026-06-08"
- **THEN** next_date is "2026-06-15" (nearest 15th)

#### Scenario: Rule change to daily uses interval
- **WHEN** user changes to daily interval=3 on "2026-06-08"
- **THEN** next_date is "2026-06-11" (change date + 3)

## REMOVED Requirements

### Requirement: Dead branch for weekly first creation without previousNextDate
# implements FR4 of unify-next-date-calculation

**Reason**: The `!previousNextDate` branch in `calculateNextDateWeekly` is unreachable — `calculateNextDate` always provides `previousNextDate` (derived from `completedAt` when not supplied by caller). First creation now uses the `nearest-match` mode instead.

**Migration**: No external API changes. Internal function signature updated — `previousNextDate` parameter is required in `from-schedule` mode.
