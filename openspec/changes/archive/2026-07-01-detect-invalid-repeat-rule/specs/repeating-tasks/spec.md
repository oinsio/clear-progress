## MODIFIED Requirements

### Requirement: System creates a recurring copy on task completion
When a task with repeat_rule is completed, the system MUST: parse the repeat_rule, calculate next_date and appear_date, create or update a recurring copy. The `complete()` method SHALL return a `recurringResult` discriminated union instead of `recurring: Task | null`:
- `{ status: 'created'; task: Task }` — copy created or updated successfully
- `{ status: 'skipped_invalid_rule' }` — repeat_rule is non-empty but parsing failed, OR an exception occurred during copy creation
- `{ status: 'not_recurring' }` — repeat_rule is empty

The completion itself SHALL NOT be interrupted regardless of recurringResult status.

#### Scenario: Complete repeating task creates a copy
- **GIVEN** active task "Morning routine" with a valid daily repeat_rule
- **WHEN** user completes the task
- **THEN** a new task is created with same name, box, description, repeat_rule
- **AND** `recurringResult` has status "created" with the new task
- **AND** new task has a different ID, is_completed false, completed_at empty

#### Scenario: Complete task with invalid repeat_rule returns skipped status
- **GIVEN** active task "Morning routine" with repeat_rule `{"type":"unknown"}`
- **WHEN** user completes the task
- **THEN** the task is marked as completed
- **AND** `recurringResult` has status "skipped_invalid_rule"
- **AND** no recurring copy is created

#### Scenario: Complete non-recurring task returns not_recurring status
- **GIVEN** active task "Morning routine" with empty repeat_rule
- **WHEN** user completes the task
- **THEN** `recurringResult` has status "not_recurring"

#### Scenario: Exception during copy creation returns skipped status
- **GIVEN** active task with valid repeat_rule but copy creation fails with an error
- **WHEN** user completes the task
- **THEN** the task is marked as completed
- **AND** `recurringResult` has status "skipped_invalid_rule"
- **AND** the error is logged

#### Scenario: Recurring copy preserves original_task_id chain
- **GIVEN** task A (id="a", original_task_id="") is completed creating task B (original_task_id="a")
- **WHEN** task B is completed
- **THEN** task C has original_task_id="a" (chain origin, not "b")

#### Scenario: Recurring copy includes checklist items
- **GIVEN** task "Morning routine" has 3 checklist items (2 completed, 1 incomplete)
- **WHEN** user completes the task
- **THEN** new task has 3 checklist items with new IDs and all is_completed false
