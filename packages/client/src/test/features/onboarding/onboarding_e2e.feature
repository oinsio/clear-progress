Feature: Onboarding Dialog (E2E)
  Implements FR2, FR3, NFR-A1, NFR-A2, NFR-R1 of onboarding-goal.
  Tests that require a real browser for dialog behavior and accessibility.

  Background:
    Given user is a first-time visitor

  @onboarding-goal @FR2
  Scenario: Accept flow creates onboarding goal and tasks
    Then onboarding dialog is visible
    When user accepts onboarding
    Then onboarding dialog is dismissed
    And onboarding goal is visible on the goals page

  @onboarding-goal @FR3
  Scenario: Decline flow skips onboarding
    Then onboarding dialog is visible
    When user declines onboarding
    Then onboarding dialog is dismissed
    And no onboarding goal exists on the goals page

  @onboarding-goal @NFR-A1
  Scenario: Dialog has proper ARIA attributes
    Then onboarding dialog has role "dialog"
    And onboarding dialog has aria-modal set to "true"
    And onboarding dialog has a non-empty aria-labelledby
    And onboarding dialog has a non-empty aria-describedby

  @onboarding-goal @NFR-A2
  Scenario: Focus trap cycles between dialog buttons
    Then accept button receives initial focus
    When user presses Tab
    Then decline button receives focus
    When user presses Tab
    Then accept button receives focus again

  @onboarding-goal @NFR-A2
  Scenario: Keyboard activation of accept button
    Then accept button receives initial focus
    When user presses Enter
    Then onboarding dialog is dismissed

  @onboarding-goal @NFR-A1
  Scenario: Escape key closes dialog as decline
    When user presses Escape key
    Then onboarding dialog is dismissed
    And no onboarding goal exists on the goals page

  @onboarding-goal @NFR-A1 @NFR-A2
  Scenario: Onboarding dialog passes axe-core accessibility checks
    Then onboarding dialog passes axe-core accessibility checks
