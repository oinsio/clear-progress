# Capability: Tasks

## MODIFIED Requirements

### Requirement: User can complete a task
# implements FR3 of task-core-specs

User SHALL be able to mark a task as completed. System MUST set `is_completed` to true and `completed_at` to current timestamp. If the task has a repeat_rule, system MUST create a recurring copy as specified in the `repeating-tasks` capability (FR9 of repeating-tasks-specs).

#### Scenario: Complete a task
- **GIVEN** active task "Buy groceries" exists
- **WHEN** user completes the task
- **THEN** is_completed is true, completed_at is set to current timestamp

#### Scenario: Complete nonexistent task throws error
- **WHEN** user attempts to complete a task with a nonexistent ID
- **THEN** system throws error "Task not found"

#### Scenario: Complete a repeating task creates recurring copy
- **GIVEN** active task "Morning routine" with repeat_rule exists
- **WHEN** user completes the task
- **THEN** is_completed is true, completed_at is set
- **AND** a recurring copy is created per repeating-tasks spec FR9
