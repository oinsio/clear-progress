# implements FR1, FR2, FR3, FR4, FR5, FR7 of repeating-task-rule-change

## ADDED Requirements

### Requirement: System recalculates next_date when repeat rule changes

When a user changes the repeat_rule of a task, the system MUST recalculate next_date from the date of the change (not from the old next_date). This ensures the new rhythm starts from the moment the user made the change. The system MUST also recalculate appear_date based on the new next_date and advance_days.

#### Scenario: Daily interval change recalculates from date of change
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes interval to 5 on "2026-06-08"
- **THEN** next_date becomes "2026-06-13" (date of change + 5)

#### Scenario: Daily interval change with later completion preserves rhythm from change date
- **WHEN** task has daily interval=3 and next_date="2026-06-08"
- **AND** user changes interval to 5 on "2026-06-08"
- **AND** user completes the task on "2026-06-10"
- **THEN** new copy next_date is "2026-06-18" (2026-06-13 + 5, rhythm from change date)

#### Scenario: Frequency change from daily to weekly
- **WHEN** task has daily interval=1 and next_date="2026-06-08" (Monday)
- **AND** user changes to weekly weekdays=[3] (Wednesday) on "2026-06-08"
- **THEN** next_date becomes "2026-06-10" (nearest Wednesday from change date)

#### Scenario: Frequency change from daily to monthly
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes to monthly day_of_month=15 on "2026-06-08"
- **THEN** next_date becomes "2026-06-15" (nearest 15th from change date)

#### Scenario: Frequency change from daily to yearly
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes to yearly month_and_day={month:12, day:25} on "2026-06-08"
- **THEN** next_date becomes "2026-12-25" (nearest Dec 25 from change date)

#### Scenario: Weekly weekdays change
- **WHEN** task has weekly weekdays=[1] (Monday) and next_date="2026-06-08"
- **AND** user changes weekdays to [5] (Friday) on "2026-06-08"
- **THEN** next_date becomes "2026-06-12" (nearest Friday from change date)

#### Scenario: Frequency change from weekly to daily
- **WHEN** task has weekly weekdays=[1] and next_date="2026-06-08"
- **AND** user changes to daily interval=3 on "2026-06-08"
- **THEN** next_date becomes "2026-06-11" (change date + 3)

#### Scenario: Frequency change from monthly to daily
- **WHEN** task has monthly day_of_month=15 and next_date="2026-06-15"
- **AND** user changes to daily interval=2 on "2026-06-08"
- **THEN** next_date becomes "2026-06-10" (change date + 2)

### Requirement: System sets next_date to empty when changing to after_completion type

When a user changes repeat_rule type from fixed to after_completion, the system MUST set next_date to empty string because the next date is unknown until the task is completed.

#### Scenario: Fixed to after_completion clears next_date
- **WHEN** task has daily interval=1 and next_date="2026-06-08"
- **AND** user changes type to after_completion with delay_days=7
- **THEN** next_date becomes ""

#### Scenario: After_completion delay_days change keeps next_date empty
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes delay_days to 14
- **THEN** next_date remains ""

### Requirement: System calculates next_date when changing from after_completion to fixed

When a user changes repeat_rule type from after_completion to fixed, the system MUST calculate next_date from the date of the change using the new fixed rule.

#### Scenario: After_completion to fixed daily
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes to daily interval=3 on "2026-06-08"
- **THEN** next_date becomes "2026-06-11" (change date + 3)

#### Scenario: After_completion to fixed weekly
- **WHEN** task has after_completion delay_days=7 and next_date=""
- **AND** user changes to weekly weekdays=[3] (Wednesday) on "2026-06-08" (Monday)
- **THEN** next_date becomes "2026-06-10" (nearest Wednesday from change date)

### Requirement: System preserves next_date when only advance_days or target_box changes

When a user changes only advance_days or target_box (without changing frequency, interval, weekdays, day_of_month, month_and_day, or type), the system MUST NOT recalculate next_date. Only appear_date SHALL be recalculated when advance_days changes.

#### Scenario: Advance_days change only recalculates appear_date
- **WHEN** task has daily interval=3 and next_date="2026-06-11" and advance_days=0
- **AND** user changes advance_days to 2
- **THEN** next_date remains "2026-06-11"
- **AND** appear_date becomes "2026-06-09" (next_date - 2)

#### Scenario: Target_box change preserves next_date and appear_date
- **WHEN** task has daily interval=3 and next_date="2026-06-11" and target_box="today"
- **AND** user changes target_box to "week"
- **THEN** next_date remains "2026-06-11"
- **AND** appear_date remains unchanged

### Requirement: System shows confirmation dialog on repeat rule change

When a user changes the repeat rule and the change affects next_date, the system MUST show a confirmation dialog displaying the calculated next date. The user MUST be able to cancel the change.

#### Scenario: Dialog shown with calculated date
- **WHEN** user changes daily interval from 1 to 5
- **THEN** system shows dialog with the new calculated next date
- **AND** user can confirm or cancel

#### Scenario: Dialog not shown for advance_days-only change
- **WHEN** user changes only advance_days
- **THEN** system saves the change without showing a dialog
