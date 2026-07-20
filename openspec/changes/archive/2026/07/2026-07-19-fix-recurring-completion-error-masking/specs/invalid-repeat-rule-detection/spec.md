# Capability: Invalid Repeat Rule Detection (delta)

## MODIFIED Requirements

### Requirement: Completion returns discriminated union for recurring result

`TaskService.complete()` SHALL return `recurringResult` as a discriminated union with four statuses: `created` (with the new task), `skipped_invalid_rule` (`repeat_rule` is non-empty but `parseRepeatRule()` returned `null`), `error_creating_copy` (the rule parsed successfully but an exception was thrown while calculating dates or creating/updating the copy), `not_recurring` (no `repeat_rule`). The `try/catch` block SHALL still prevent completion from failing, and SHALL log any caught exception to the console. `skipped_invalid_rule` SHALL be returned ONLY for a genuine parse failure — never for a thrown exception.

#### Scenario: Successful recurring copy creation
- **WHEN** user completes a task with valid repeat_rule
- **THEN** `recurringResult` has status "created" and includes the new task

#### Scenario: Invalid rule returns skipped status
- **WHEN** user completes a task with invalid repeat_rule (parsing returns null)
- **THEN** `recurringResult` has status "skipped_invalid_rule"
- **AND** the task is still marked as completed

#### Scenario: Non-recurring task returns not_recurring status
- **WHEN** user completes a task with empty repeat_rule
- **THEN** `recurringResult` has status "not_recurring"

#### Scenario: Exception during copy creation returns error status
- **WHEN** user completes a task with valid repeat_rule but copy creation throws
- **THEN** `recurringResult` has status "error_creating_copy"
- **AND** the task is still marked as completed
- **AND** the error is logged to console

### Requirement: Alert shown on completion when recurring copy skipped due to invalid rule

When `recurringResult.status === 'skipped_invalid_rule'`, the system SHALL add an alert of type `repeat_rule_invalid` with the completed task's name, shown via AlertProvider. For any other status — including `error_creating_copy` — the system SHALL NOT add a `repeat_rule_invalid` alert on completion.

#### Scenario: Completion of task with invalid rule shows alert
- **WHEN** user completes task "Buy groceries" with invalid repeat_rule
- **THEN** an alert is shown with type "repeat_rule_invalid" containing task name "Buy groceries"

#### Scenario: Completion of task with valid rule shows no alert
- **WHEN** user completes task "Buy groceries" with valid repeat_rule
- **THEN** no repeat_rule_invalid alert is shown

#### Scenario: Completion where copy creation errors shows no invalid-rule alert
- **WHEN** user completes task "Buy groceries" with a valid repeat_rule but copy creation throws
- **THEN** `recurringResult` has status "error_creating_copy"
- **AND** no repeat_rule_invalid alert is shown
