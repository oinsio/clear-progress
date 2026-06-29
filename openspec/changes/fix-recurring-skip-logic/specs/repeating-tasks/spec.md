## MODIFIED Requirements

### Requirement: System calculates next date for fixed daily frequency
# implements FR1, FR2 of fix-recurring-skip-logic

System MUST calculate `next_date` as `today + interval` for daily frequency, regardless of the previous next_date. This applies to all daily scenarios: normal completion, skip (user was inactive), and early completion (via advance_days). The previous next_date is not used in the calculation.

This differs from weekly/monthly/yearly which use schedule-based computation. Daily tasks represent habits where the interval counts from the last execution date, not from an abstract schedule.

#### Scenario: Daily interval 1 normal completion
- **WHEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **THEN** system calculates next date with daily interval 1 as "2026-01-16"

#### Scenario: Daily interval 3 normal completion
- **WHEN** previous next_date is "2026-01-15" and today is "2026-01-15"
- **THEN** system calculates next date with daily interval 3 as "2026-01-18"

#### Scenario: Daily skip logic — interval 1, inactive 6 days
- **WHEN** previous next_date is "2026-04-10" and today is "2026-04-16"
- **THEN** system calculates next date with daily interval 1 as "2026-04-17" (today + 1, not schedule-aligned 2026-04-16)

#### Scenario: Daily skip logic — interval 3, inactive 10 days
- **WHEN** previous next_date is "2026-04-10" and today is "2026-04-20"
- **THEN** system calculates next date with daily interval 3 as "2026-04-23" (today + 3, not schedule-aligned 2026-04-22)

#### Scenario: Daily early completion via advance_days
- **WHEN** previous next_date is "2026-07-05" and today is "2026-07-03" (task visible early due to advance_days)
- **THEN** system calculates next date with daily interval 1 as "2026-07-04" (today + 1, ignores original schedule)

#### Scenario: Daily skip logic exact alignment — result still uses today
- **WHEN** previous next_date is "2026-01-01" and today is "2026-01-07"
- **THEN** system calculates next date with daily interval 3 as "2026-01-10" (today + 3, not schedule-aligned 2026-01-07)

### Requirement: System calculates next date for fixed yearly frequency
# implements FR3 of fix-recurring-skip-logic

System MUST advance by interval years to the specified month_and_day. If day_of_month exceeds days in target month, system MUST clamp to last day (e.g., Feb 29 in non-leap year becomes Feb 28). Skip logic MUST skip past years if target year is in the past. If the calculated date equals today, system MUST advance by one more interval (strictly after today).

#### Scenario: Yearly interval 1 normal completion
- **WHEN** previous next_date is "2026-03-20" and month_and_day {month: 3, day: 20} and today is "2026-03-20"
- **THEN** result is "2027-03-20" (today is the scheduled date, advance to next year)

#### Scenario: Yearly Feb 29 in non-leap year
- **WHEN** previous next_date is "2024-02-29" and month_and_day {month: 2, day: 29} and today is "2024-02-29"
- **THEN** result is "2025-02-28" (2025 is not a leap year, clamp to 28)

#### Scenario: Yearly skip logic skips past years
- **WHEN** previous next_date is "2024-06-15" and month_and_day {month: 6, day: 15} and today is "2027-01-01"
- **THEN** result is "2027-06-15"

#### Scenario: Yearly skip logic — today equals scheduled date
- **WHEN** previous next_date is "2024-03-15" and month_and_day {month: 3, day: 15} and today is "2026-03-15"
- **THEN** result is "2027-03-15" (today is the date, strictly after today means next year)

#### Scenario: Yearly Feb 29 skip — non-leap year clamps and still strictly after today
- **WHEN** previous next_date is "2024-02-29" and month_and_day {month: 2, day: 29} and today is "2026-04-16"
- **THEN** result is "2027-02-28" (nearest future year, clamped)
