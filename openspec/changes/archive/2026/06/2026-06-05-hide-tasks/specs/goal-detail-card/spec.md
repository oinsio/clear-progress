## MODIFIED Requirements

### Requirement: GoalDetailPage respects eye toggle for hidden tasks
The GoalDetailPage SHALL display hidden tasks in the goal's task list when the eye toggle (`showHidden`) is active. Currently, `TaskRepository.getByGoalId()` hard-filters `!is_hidden`, making hidden tasks invisible even with the eye toggle on. Implements FR9.

#### Scenario: Hidden tasks visible on goal page with eye toggle on
- **WHEN** user enables the eye toggle on GoalDetailPage
- **AND** a hidden task is assigned to the displayed goal
- **THEN** the hidden task appears in the goal's task list with reduced opacity and hidden indicator

#### Scenario: Hidden tasks invisible on goal page with eye toggle off
- **WHEN** user has eye toggle off on GoalDetailPage
- **AND** a hidden task is assigned to the displayed goal
- **THEN** the hidden task does NOT appear in the goal's task list
