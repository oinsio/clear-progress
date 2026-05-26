Feature: Entity name resolution
  Implements FR10, FR11, FR12 of task-detail-panel-spec.

  @task-detail-panel-spec @FR10
  Scenario: ID matches an entity
    Given entities contain an item with id "a1" and name "Alpha"
    When resolveEntityName is called with id "a1" and fallback "None"
    Then the result is "Alpha"

  @task-detail-panel-spec @FR11
  Scenario: Empty ID returns fallback
    Given entities contain an item with id "a1" and name "Alpha"
    When resolveEntityName is called with id "" and fallback "None"
    Then the result is "None"

  @task-detail-panel-spec @FR12
  Scenario: Non-matching ID returns fallback
    Given entities contain an item with id "a1" and name "Alpha"
    When resolveEntityName is called with id "unknown" and fallback "None"
    Then the result is "None"

  @task-detail-panel-spec @FR10
  Scenario: Multiple entities resolves correct one
    Given entities contain items:
      | id  | name  |
      | a1  | Alpha |
      | b2  | Beta  |
      | c3  | Gamma |
    When resolveEntityName is called with id "b2" and fallback "None"
    Then the result is "Beta"

  @task-detail-panel-spec @FR11
  Scenario: Empty entities array returns fallback
    Given entities array is empty
    When resolveEntityName is called with id "a1" and fallback "Fallback"
    Then the result is "Fallback"
