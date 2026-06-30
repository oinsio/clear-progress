## ADDED Requirements

### Requirement: Daily early completion preserves today-based computation
# implements FR7 of add-recurring-edge-case-tests

When a daily task is completed early (via advance_days, previousNextDate > today), the system MUST return `today + interval`, ignoring the original scheduled date. Daily tasks always count from the execution date, not from an abstract schedule.

#### Scenario: Daily early completion via advance_days
- **WHEN** previous next_date is "2026-07-05" and today is "2026-07-03" (task visible early due to advance_days)
- **THEN** system calculates next date with daily interval 1 as "2026-07-04" (today + 1, ignores original schedule)

### Requirement: Daily skip logic exact alignment still uses today
# implements FR8 of add-recurring-edge-case-tests

When a daily task has been inactive and the skip calculation would land exactly on a schedule-aligned date, the system MUST still return `today + interval`, not the schedule-aligned result. This confirms Model A behavior: daily never uses schedule alignment.

#### Scenario: Daily skip logic exact alignment — result still uses today
- **WHEN** previous next_date is "2026-01-01" and today is "2026-01-07"
- **THEN** system calculates next date with daily interval 3 as "2026-01-10" (today + 3, not schedule-aligned 2026-01-07)

### Requirement: Weekly early completion preserves schedule rhythm
# implements FR4, FR12 of add-recurring-edge-case-tests

When a weekly task is completed early (via advance_days, previousNextDate > today), the system MUST return the nearest scheduled weekday strictly after today, preserving the original schedule rhythm. The system SHALL NOT reset the rhythm to count from the completion date.

#### Scenario: Weekly early completion — next Monday still in future
- **WHEN** previous next_date is "2026-07-06" (Monday) and weekdays [1] and today is "2026-07-04" (Saturday)
- **THEN** system calculates next date with weekly interval 1 as "2026-07-06" (the scheduled Monday, still in future — task for current period not yet due)

#### Scenario: Weekly early completion — biweekly rhythm preserved
- **WHEN** previous next_date is "2026-07-06" (Monday) and weekdays [1] and today is "2026-07-04" (Saturday)
- **THEN** system calculates next date with weekly interval 2 as "2026-07-06" (same as interval 1 — the next Monday from prev is still in the future, no interval skip needed)

### Requirement: Monthly early completion preserves schedule rhythm
# implements FR5, FR13 of add-recurring-edge-case-tests

When a monthly task is completed early (via advance_days, previousNextDate > today), the system MUST return the nearest scheduled day_of_month strictly after today, preserving the original schedule rhythm. If the scheduled date has not yet arrived, the system SHALL return it as-is.

#### Scenario: Monthly early completion — 15th not yet arrived
- **WHEN** previous next_date is "2026-07-15" and day_of_month 15 and today is "2026-07-12"
- **THEN** system calculates next date with monthly interval 1 as "2026-07-15" (15th has not arrived, task for current period still due)

#### Scenario: Monthly early completion — 1st not yet arrived
- **WHEN** previous next_date is "2026-08-01" and day_of_month 1 and today is "2026-07-28"
- **THEN** system calculates next date with monthly interval 1 as "2026-08-01" (next month's 1st, still in future)

### Requirement: Yearly early completion preserves schedule rhythm
# implements FR6, FR14 of add-recurring-edge-case-tests

When a yearly task is completed early (via advance_days, previousNextDate > today), the system MUST return the nearest scheduled month_and_day strictly after today, preserving the original schedule rhythm.

#### Scenario: Yearly early completion — scheduled date still in future
- **WHEN** previous next_date is "2026-12-25" and month_and_day {month: 12, day: 25} and today is "2026-12-20"
- **THEN** system calculates next date with yearly interval 1 as "2026-12-25" (Dec 25 not yet arrived)

### Requirement: Monthly clamping preserves original day_of_month across months
# implements FR9, FR10, FR11, FR15, FR16 of add-recurring-edge-case-tests

When day_of_month exceeds the number of days in a target month, the system MUST clamp to the last day of that month. In subsequent months, the system MUST return to the original day_of_month if it fits. The original day_of_month value SHALL be preserved in the repeat rule and not mutated by clamping.

#### Scenario: Monthly day=31 clamping chain — Feb then back to Mar
- **WHEN** previous next_date is "2026-02-28" (clamped from day=31) and day_of_month 31 and today is "2026-02-28"
- **THEN** system calculates next date with monthly interval 1 as "2026-03-31" (March has 31 days, return to original)

#### Scenario: Monthly day=30 in February
- **WHEN** previous next_date is "2026-01-30" and day_of_month 30 and today is "2026-01-30"
- **THEN** system calculates next date with monthly interval 1 as "2026-02-28" (February 2026 has 28 days, clamp)

#### Scenario: Monthly day=30 returns to 30 after February
- **WHEN** previous next_date is "2026-02-28" (clamped from day=30) and day_of_month 30 and today is "2026-02-28"
- **THEN** system calculates next date with monthly interval 1 as "2026-03-30" (March has 30+, return to original)
