Feature: Task form state initialization
  Implements FR1, FR2, FR3 of task-detail-panel-spec.

  @task-detail-panel-spec @FR1
  Scenario: All fields initialized from task
    Given a task with name "Buy groceries" and description "Milk and eggs"
    And the task has box "today", goal_id "g1", context_id "c1", category_id "cat1"
    When useTaskFormState is initialized with this task
    Then the form name is "Buy groceries"
    And the form description is "Milk and eggs"
    And the selected box is "today"
    And the selected goal ID is "g1"
    And the selected context ID is "c1"
    And the selected category ID is "cat1"

  @task-detail-panel-spec @FR1
  Scenario: Empty optional fields initialized as empty strings
    Given a task with empty goal_id, context_id, and category_id
    When useTaskFormState is initialized with this task
    Then the selected goal ID is ""
    And the selected context ID is ""
    And the selected category ID is ""

  @task-detail-panel-spec @FR3
  Scenario: Repeat rule parsed from task
    Given a task with a daily repeat rule
    When useTaskFormState is initialized with this task
    Then the selected repeat rule has frequency "daily"
    And the selected repeat rule has type "fixed"

  @task-detail-panel-spec @FR3
  Scenario: Empty repeat rule results in null
    Given a task with empty repeat_rule
    When useTaskFormState is initialized with this task
    Then the selected repeat rule is null

  @task-detail-panel-spec @FR2
  Scenario: Setter functions are returned
    Given a task with default values
    When useTaskFormState is initialized with this task
    Then setName is a function
    And setDescription is a function
    And setSelectedGoalId is a function
    And setSelectedContextId is a function
    And setSelectedCategoryId is a function
    And setSelectedBox is a function
    And setSelectedRepeatRule is a function
