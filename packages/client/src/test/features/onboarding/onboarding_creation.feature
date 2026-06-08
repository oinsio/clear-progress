Feature: Onboarding entity creation
  Implements FR2, FR4, FR7 of onboarding-goal.

  @onboarding-goal @FR2
  Scenario: Goal created with correct attributes
    When onboarding entities are created
    Then a goal exists with localized name
    And goal has localized description
    And goal has status "in_progress"

  @onboarding-goal @FR2
  Scenario: Tasks created with correct box assignments
    When onboarding entities are created
    Then 5 tasks are created
    And task 1 is in box "today"
    And tasks 2 through 5 are in box "later"
    And all tasks are linked to the onboarding goal

  @onboarding-goal @FR4
  Scenario: Tasks have correct sort order
    When onboarding entities are created
    Then tasks are ordered 0 through 4

  @onboarding-goal @FR7
  Scenario: Flag is set after creation
    When onboarding entities are created
    Then localStorage flag is set to "true"

  @onboarding-goal @FR2
  Scenario: Tasks use translated names and descriptions
    When onboarding entities are created
    Then each task has a translated name
    And each task has a translated description
