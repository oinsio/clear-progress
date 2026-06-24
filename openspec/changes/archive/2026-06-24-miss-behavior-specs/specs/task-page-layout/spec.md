## ADDED Requirements

### Requirement: CompletedPage groups tasks by completion date

CompletedPage SHALL group completed tasks into five date-based sections using `groupCompletedTasks`: today, yesterday, this week (2-7 days ago), this month (8-30 days ago), and earlier (>30 days ago). Grouping SHALL use `completed_at` timestamp compared against day boundary. Sections with zero tasks SHALL NOT be rendered. Implements FR1 of miss-behavior-specs.

#### Scenario: Task completed today appears in today section
- **WHEN** a task has `completed_at` after today's day boundary
- **THEN** it is grouped into the today section

#### Scenario: Task completed yesterday appears in yesterday section
- **WHEN** a task has `completed_at` between yesterday's and today's day boundary
- **THEN** it is grouped into the yesterday section

#### Scenario: Task completed 3 days ago appears in week section
- **WHEN** a task has `completed_at` between 7 days ago and yesterday's day boundary
- **THEN** it is grouped into the week section

#### Scenario: Task completed 15 days ago appears in month section
- **WHEN** a task has `completed_at` between 30 days ago and 7 days ago day boundary
- **THEN** it is grouped into the month section

#### Scenario: Task completed 60 days ago appears in earlier section
- **WHEN** a task has `completed_at` more than 30 days before today's day boundary
- **THEN** it is grouped into the earlier section

#### Scenario: Empty sections are not rendered
- **WHEN** no tasks were completed yesterday
- **THEN** the yesterday section is not present in the output

### Requirement: CompletedPage shows empty state when no completed tasks

CompletedPage SHALL display an empty state message when there are no completed tasks. The message SHALL use the `task.emptyCompleted` i18n key. Implements FR2 of miss-behavior-specs.

#### Scenario: No completed tasks shows empty message
- **WHEN** there are no completed tasks
- **THEN** the page displays the empty completed tasks message

### Requirement: CompletedPage routes operations to original box handler

CompletedPage SHALL route task operations (update, move, delete, duplicate) to the handler matching the task's original `box` field. If the box is not recognized, the today box handler SHALL be used as fallback. After duplicating a task, the duplicated task SHALL be selected. After deleting a task, selection SHALL be cleared. Implements FR3 of miss-behavior-specs.

#### Scenario: Update dispatches to task's original box
- **WHEN** a completed task with box "inbox" is updated
- **THEN** the update is routed to the inbox box handler

#### Scenario: Move dispatches to task's original box
- **WHEN** a completed task with box "week" is moved to "today"
- **THEN** the move is routed to the week box handler

#### Scenario: Delete clears selection and dispatches to original box
- **WHEN** a completed task with box "later" is deleted
- **THEN** selection is cleared
- **AND** the delete is routed to the later box handler

#### Scenario: Duplicate selects the new task
- **WHEN** a completed task is duplicated
- **THEN** the new task becomes selected

#### Scenario: Unknown box falls back to today handler
- **WHEN** a completed task has an unrecognized box value
- **THEN** the operation is routed to the today box handler
