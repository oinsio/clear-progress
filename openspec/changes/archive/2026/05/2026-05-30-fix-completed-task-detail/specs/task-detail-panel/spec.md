## REMOVED Requirements

### Requirement: Focus mode deselects completed tasks

**Reason**: Blocking completed task selection in Focus Mode makes it impossible to view and edit them. Focus Mode SHALL only affect visual presentation (opacity), NOT the ability to interact with tasks.

**Migration**: Remove the `isFocusMode && foundTask.is_completed` check from `useTaskSelection`. Delete or update existing tests that verify this behavior.

## ADDED Requirements

### Requirement: Completed tasks can be selected for detail view

useTaskSelection SHALL allow selecting completed tasks regardless of Focus Mode state. The detail panel SHALL open for completed tasks with the same capabilities as for active tasks. Implements FR1, FR2 of fix-completed-task-detail.

#### Scenario: Completed task selected in Focus Mode

- **WHEN** Focus Mode is enabled and user selects a completed task
- **THEN** the task is selected and detail panel opens with full editing capabilities

#### Scenario: Completed task selected without Focus Mode

- **WHEN** Focus Mode is disabled and user selects a completed task
- **THEN** the task is selected and detail panel opens with full editing capabilities
