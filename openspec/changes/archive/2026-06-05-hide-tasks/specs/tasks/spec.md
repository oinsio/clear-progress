## MODIFIED Requirements

### Requirement: Completing a task handles hidden state
When completing a task that is manually hidden (non-recurring), the system SHALL clear the hide state by setting `is_hidden = false` and `appear_date = ""` in addition to the standard completion fields (`is_completed = true`, `completed_at`). This ensures completed tasks are not stuck in a hidden state. Implements FR6.

#### Scenario: Completing a manually hidden task clears hide state
- **WHEN** user completes a task where `is_hidden = true` and `repeat_rule = ""`
- **THEN** the task's `is_completed` is set to `true`
- **AND** `is_hidden` is set to `false`
- **AND** `appear_date` is cleared to `""`

#### Scenario: Completing a recurring hidden task does not clear hide state
- **WHEN** user completes a task where `is_hidden = true` and `repeat_rule` is non-empty
- **THEN** the existing recurring completion logic runs unchanged
- **AND** the hide state is managed by the recurring task mechanism, not cleared

### Requirement: Duplicating a task always creates a visible copy
When duplicating a task, the system SHALL always create the copy with `is_hidden = false` and `appear_date = ""`, regardless of the original task's hidden state. Implements FR10.

#### Scenario: Duplicating a hidden task creates a visible copy
- **WHEN** user duplicates a task where `is_hidden = true` and `appear_date = "2027-01-15"`
- **THEN** the duplicate task has `is_hidden = false` and `appear_date = ""`
- **AND** the duplicate is immediately visible in the task list
