## ADDED Requirements

### Requirement: GoalFilter type defines 4 filter groups

System SHALL define a `GoalFilter` type with values: `"active"`, `"paused"`, `"finished"`, `"all"`. Each value maps to a set of GoalStatus values: active = [planning, in_progress], paused = [paused], finished = [completed, cancelled], all = all statuses. Mapping SHALL be defined as `GOAL_FILTER_STATUS_MAP` constant. Implements FR1, FR3, FR4, FR5 of goals-filter.

#### Scenario: Active filter maps to planning and in_progress
- **WHEN** filter is "active"
- **THEN** it maps to GoalStatus values ["planning", "in_progress"]

#### Scenario: Paused filter maps to paused
- **WHEN** filter is "paused"
- **THEN** it maps to GoalStatus values ["paused"]

#### Scenario: Finished filter maps to completed and cancelled
- **WHEN** filter is "finished"
- **THEN** it maps to GoalStatus values ["completed", "cancelled"]

#### Scenario: All filter maps to all statuses
- **WHEN** filter is "all"
- **THEN** it maps to all 5 GoalStatus values

### Requirement: useGoalFilter hook persists filter in localStorage

`useGoalFilter` hook SHALL use `usePreference` with `type: "enum"`, key `STORAGE_KEYS.GOAL_FILTER`, values `GOAL_FILTER_OPTIONS`, and `defaultValue: "all"`. It SHALL return `{ goalFilter, setGoalFilter }`. Implements FR2, FR6 of goals-filter.

#### Scenario: Default filter is all
- **WHEN** no value stored in localStorage
- **THEN** goalFilter returns "all"

#### Scenario: Filter persists across page loads
- **GIVEN** user selects "active" filter
- **WHEN** user navigates away and returns to GoalsPage
- **THEN** goalFilter is "active"

#### Scenario: Corrupted localStorage value self-heals
- **GIVEN** localStorage contains invalid value "invalid" for goal_filter key
- **WHEN** useGoalFilter reads the value
- **THEN** it returns default "all" and removes corrupted value

### Requirement: GoalsPage filters goals by selected filter group

GoalsPage SHALL filter goals using the selected GoalFilter value. Only goals whose status is in the corresponding `GOAL_FILTER_STATUS_MAP` entry SHALL be displayed. Deleted goals (is_deleted = true) SHALL always be excluded regardless of filter. Implements FR1, FR3, FR4, FR5 of goals-filter.

#### Scenario: Active filter hides completed goals
- **GIVEN** goals with statuses: planning, in_progress, completed, cancelled, paused
- **WHEN** filter is "active"
- **THEN** only planning and in_progress goals are shown

#### Scenario: All filter shows all non-deleted goals
- **GIVEN** goals with all 5 statuses, one is_deleted
- **WHEN** filter is "all"
- **THEN** all non-deleted goals are shown (4 of 5)

#### Scenario: Finished filter shows completed and cancelled
- **GIVEN** goals with statuses: planning, in_progress, completed, cancelled
- **WHEN** filter is "finished"
- **THEN** only completed and cancelled goals are shown

### Requirement: GoalsPage shows filter-specific empty state messages

GoalsPage SHALL display a specific empty message per filter group when no goals match: all = "goal.empty", active = "goal.emptyActive", paused = "goal.emptyPaused", finished = "goal.emptyFinished". Implements FR8 of goals-filter.

#### Scenario: Empty state for active filter
- **GIVEN** no goals with status planning or in_progress
- **WHEN** filter is "active"
- **THEN** message "Нет активных целей" is displayed

#### Scenario: Empty state for all filter
- **GIVEN** no goals at all
- **WHEN** filter is "all"
- **THEN** message "Нет ни одной цели" is displayed (existing behavior)

#### Scenario: Empty state for paused filter
- **GIVEN** no goals with status paused
- **WHEN** filter is "paused"
- **THEN** message "Нет целей на паузе" is displayed

#### Scenario: Empty state for finished filter
- **GIVEN** no goals with status completed or cancelled
- **WHEN** filter is "finished"
- **THEN** message "Нет завершённых целей" is displayed

### Requirement: GoalsPage passes filter config to CommandBar

GoalsPage SHALL pass a filter config to CommandBar with: items = GOAL_FILTER_ORDER, activeItem = goalFilter, onChange = setGoalFilter, icons mapping (active=Play, paused=Pause, finished=Check, all=AllBoxesIcon). GoalsPage SHALL NOT pass eyeToggle. Implements FR9, FR10 of goals-filter.

#### Scenario: CommandBar shows goal filter
- **WHEN** GoalsPage renders
- **THEN** CommandBar displays collapsed filter with current filter icon and chevron

#### Scenario: No eye toggle on GoalsPage
- **WHEN** GoalsPage renders
- **THEN** CommandBar does not show eye toggle button
