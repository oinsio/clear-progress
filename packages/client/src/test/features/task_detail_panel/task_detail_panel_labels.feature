Feature: Task edit labels
  Implements FR4, FR5, FR6, FR7, FR8, FR9 of task-detail-panel-spec.

  @task-detail-panel-spec @FR4
  Scenario: Goal name resolved from ID
    Given goals contain a goal with id "g1" and name "Learn piano"
    When useTaskEditLabels is called with selectedGoalId "g1"
    Then selectedGoalName is "Learn piano"

  @task-detail-panel-spec @FR7
  Scenario: No goal selected shows fallback
    When useTaskEditLabels is called with selectedGoalId ""
    Then selectedGoalName is the no-goal fallback

  @task-detail-panel-spec @FR5
  Scenario: Context name resolved from ID
    Given contexts contain a context with id "c1" and name "@Home"
    When useTaskEditLabels is called with selectedContextId "c1"
    Then selectedContextName is "@Home"

  @task-detail-panel-spec @FR7
  Scenario: No context selected shows fallback
    When useTaskEditLabels is called with selectedContextId ""
    Then selectedContextName is the no-context fallback

  @task-detail-panel-spec @FR6
  Scenario: Category name resolved from ID
    Given categories contain a category with id "cat1" and name "Work"
    When useTaskEditLabels is called with selectedCategoryId "cat1"
    Then selectedCategoryName is "Work"

  @task-detail-panel-spec @FR7
  Scenario: No category selected shows fallback
    When useTaskEditLabels is called with selectedCategoryId ""
    Then selectedCategoryName is the no-category fallback

  @task-detail-panel-spec @FR8
  Scenario: Checklist label shows progress
    Given checklist progress is 2 completed out of 5 total
    When useTaskEditLabels is called with this progress
    Then checklistTabLabel contains "2" and "5"

  @task-detail-panel-spec @FR9
  Scenario: Checklist label without progress
    Given checklist progress is 0 total
    When useTaskEditLabels is called with this progress
    Then checklistTabLabel is the plain checklist label
