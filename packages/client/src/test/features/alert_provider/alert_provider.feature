Feature: Alert provider queue management
  Implements FR6, FR7 of detect-invalid-repeat-rule.

  @detect-invalid-repeat-rule @FR6
  Scenario: Adding alerts to empty queue
    Given the alert queue is empty
    When 2 alerts are added
    Then the queue contains 2 alerts

  @detect-invalid-repeat-rule @FR7
  Scenario: Single alert shows counter 1/1 and Understood button
    Given the queue has 1 alert
    Then the counter shows "1/1"
    And the "Understood" button is visible
    And no "Back" or "Next" buttons are shown

  @detect-invalid-repeat-rule @FR7
  Scenario: Pressing Understood dismisses all alerts
    Given the queue has 1 alert
    When the user presses "Understood"
    Then all alerts are dismissed

  @detect-invalid-repeat-rule @FR7
  Scenario: Sync alerts are shown before repeat rule alerts
    Given the queue has a repeat_rule_invalid alert added first
    And then a sync alert is added
    Then the sync alert is displayed first
