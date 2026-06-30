## ADDED Requirements

### Requirement: Shared validator detects invalid repeat rules
The system SHALL provide `isRepeatRuleInvalid(task: Task): boolean` that returns `true` when `task.repeat_rule` is a non-empty string AND `parseRepeatRule(task.repeat_rule)` returns `null`. The function SHALL return `false` when `repeat_rule` is empty or when parsing succeeds.

#### Scenario: Non-empty repeat_rule that fails parsing
- **WHEN** task has repeat_rule `{"type":"unknown"}` (fails Zod validation)
- **THEN** `isRepeatRuleInvalid` returns true

#### Scenario: Non-empty repeat_rule with corrupted JSON
- **WHEN** task has repeat_rule `{not valid json}`
- **THEN** `isRepeatRuleInvalid` returns true

#### Scenario: Empty repeat_rule
- **WHEN** task has repeat_rule `""`
- **THEN** `isRepeatRuleInvalid` returns false

#### Scenario: Valid repeat_rule
- **WHEN** task has repeat_rule `{"type":"fixed","frequency":"daily","interval":1,"target_box":"today","advance_days":0}`
- **THEN** `isRepeatRuleInvalid` returns false

### Requirement: Task detail panel shows warning for invalid repeat rule
When `isRepeatRuleInvalid(task)` is true, the repeat rule row in the task detail panel SHALL display a localized "Rule not recognized" label with amber warning styling instead of the normal repeat label or "No repeat".

#### Scenario: Invalid rule shows warning label
- **WHEN** user opens detail panel for a task with invalid repeat_rule
- **THEN** the repeat row shows "Rule not recognized" with amber styling

#### Scenario: Valid rule shows normal label
- **WHEN** user opens detail panel for a task with valid repeat_rule
- **THEN** the repeat row shows the formatted rule label (e.g., "Every 1 day")

#### Scenario: No rule shows "No repeat"
- **WHEN** user opens detail panel for a task with empty repeat_rule
- **THEN** the repeat row shows "No repeat"

### Requirement: Completion returns discriminated union for recurring result
`TaskService.complete()` SHALL return `recurringResult` as a discriminated union with three statuses: `created` (with the new task), `skipped_invalid_rule` (rule exists but parsing failed), `not_recurring` (no repeat_rule). The `try/catch` block SHALL still prevent completion from failing.

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

#### Scenario: Exception during copy creation returns skipped status
- **WHEN** user completes a task with valid repeat_rule but copy creation throws
- **THEN** `recurringResult` has status "skipped_invalid_rule"
- **AND** the error is logged to console

### Requirement: Alert shown on completion when recurring copy skipped due to invalid rule
When `recurringResult.status === 'skipped_invalid_rule'`, the system SHALL add an alert of type `repeat_rule_invalid` with the completed task's name. The alert SHALL be shown via AlertProvider.

#### Scenario: Completion of task with invalid rule shows alert
- **WHEN** user completes task "Buy groceries" with invalid repeat_rule
- **THEN** an alert is shown with type "repeat_rule_invalid" containing task name "Buy groceries"

#### Scenario: Completion of task with valid rule shows no alert
- **WHEN** user completes task "Buy groceries" with valid repeat_rule
- **THEN** no repeat_rule_invalid alert is shown

### Requirement: Post-pull check detects invalid repeat rules in diff
After a pull batch is applied, the system SHALL check all new or changed active incomplete tasks in the diff for invalid repeat rules. If any are found, the system SHALL add one grouped alert of type `repeat_rule_invalid` with all affected task names. Only tasks where `is_deleted === false` AND `is_completed === false` AND `isRepeatRuleInvalid() === true` SHALL be included.

#### Scenario: Pull diff contains task with invalid rule
- **WHEN** pull batch includes task "Water plants" with invalid repeat_rule, is_deleted=false, is_completed=false
- **THEN** a repeat_rule_invalid alert is added with taskNames ["Water plants"]

#### Scenario: Pull diff contains multiple tasks with invalid rules
- **WHEN** pull batch includes "Task A" and "Task B" both with invalid repeat_rule
- **THEN** one repeat_rule_invalid alert is added with taskNames ["Task A", "Task B"]

#### Scenario: Pull diff contains only valid rules
- **WHEN** pull batch includes tasks all with valid or empty repeat_rule
- **THEN** no repeat_rule_invalid alert is added

#### Scenario: Deleted task with invalid rule is ignored
- **WHEN** pull batch includes task with invalid repeat_rule and is_deleted=true
- **THEN** no repeat_rule_invalid alert is added for that task

#### Scenario: Completed task with invalid rule is ignored
- **WHEN** pull batch includes task with invalid repeat_rule and is_completed=true
- **THEN** no repeat_rule_invalid alert is added for that task

#### Scenario: Same task appears in subsequent diff
- **WHEN** task "Water plants" with invalid rule appeared in a previous diff and was shown
- **AND** the same task appears in a new diff (updated again)
- **THEN** the alert is shown again for "Water plants"
