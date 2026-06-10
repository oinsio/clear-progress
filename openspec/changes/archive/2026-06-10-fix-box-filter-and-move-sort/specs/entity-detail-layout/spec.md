# Delta Spec: Entity Detail Layout
# implements FR1, FR2 of fix-box-filter-and-move-sort

## ADDED Requirements

### Requirement: Box filter filters displayed task list on detail pages

When a specific box is selected in the filter on a detail page (GoalDetailPage, CategoryDetailPage, ContextDetailPage), only tasks from that box SHALL be displayed in a flat TaskList (no section headers). When "All" is selected, tasks SHALL be grouped by box with section headers as currently implemented via BoxSectionList. The filter state SHALL be managed at the page/hook level, not inside BoxSectionList.

#### Scenario: Filter by specific box shows only that box's tasks

- **GIVEN** goal has 2 tasks in "today" and 3 tasks in "later"
- **WHEN** user selects "today" in the box filter
- **THEN** only 2 "today" tasks are displayed
- **AND** no section headers are shown

#### Scenario: "All" filter shows all boxes grouped

- **GIVEN** goal has tasks in "today" and "later"
- **WHEN** user selects "All" in the box filter
- **THEN** tasks are grouped by box with section headers (current behavior)

#### Scenario: Filter by empty box shows empty state

- **GIVEN** goal has 0 tasks in "inbox" and 3 tasks in "today"
- **WHEN** user selects "inbox" in the box filter
- **THEN** empty state message is displayed

#### Scenario: Filter applies to EntityDetailLayout (Category/Context)

- **GIVEN** category has tasks in "today" and "week"
- **WHEN** user selects "week" in the box filter on category detail page
- **THEN** only "week" tasks are displayed

#### Scenario: Creating a task in filtered view

- **GIVEN** user has selected "today" filter on goal detail page
- **WHEN** user creates a new task via command bar
- **THEN** new task is created in "today" box
- **AND** new task appears in the filtered list
