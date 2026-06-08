Feature: Onboarding detection
  Implements FR1, FR7, NFR-P1 of onboarding-goal.

  @onboarding-goal @FR1
  Scenario: Brand new user sees onboarding
    Given no localStorage flag exists
    And database is empty
    When detection runs
    Then onboarding should be shown
    And localStorage flag is not set

  @onboarding-goal @FR1
  Scenario: Returning user does not see onboarding
    Given localStorage flag exists
    When detection runs
    Then onboarding should not be shown

  @onboarding-goal @FR1 @FR7
  Scenario: Existing goals without flag sets flag silently
    Given no localStorage flag exists
    And database has active goals
    When detection runs
    Then onboarding should not be shown
    And localStorage flag is set to "true"

  @onboarding-goal @FR1 @FR7
  Scenario: Existing tasks without flag sets flag silently
    Given no localStorage flag exists
    And database has active tasks
    When detection runs
    Then onboarding should not be shown
    And localStorage flag is set to "true"

  @onboarding-goal @FR1 @FR7
  Scenario: Existing goals and tasks without flag sets flag silently
    Given no localStorage flag exists
    And database has active goals
    And database has active tasks
    When detection runs
    Then onboarding should not be shown
    And localStorage flag is set to "true"

  @onboarding-goal @NFR-P1
  Scenario: Detection completes within 100ms
    Given no localStorage flag exists
    And database is empty
    When detection runs with timing
    Then detection completes in under 100ms
