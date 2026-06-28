Feature: Goals Status Management
  Implements FR8 of add-goals-specs.

  @add-goals-specs @FR8
  Scenario: Change status from planning to in_progress
    Given goal with status "planning" exists
    When user updates goal status to "in_progress"
    Then goal has status "in_progress"
    And goal has syncStatus "pending"
    And goal updated_at is refreshed

  @add-goals-specs @FR8
  Scenario: Change status from completed back to in_progress
    Given goal with status "completed" exists
    When user updates goal status to "in_progress"
    Then goal has status "in_progress"
    And goal has syncStatus "pending"

  @add-goals-specs @FR8
  Scenario: Change status from cancelled to planning
    Given goal with status "cancelled" exists
    When user updates goal status to "planning"
    Then goal has status "planning"
    And goal has syncStatus "pending"

  @add-goals-specs @FR8
  Scenario: No-op status update
    Given goal with status "in_progress" and syncStatus "synced" exists
    When user updates goal status to "in_progress"
    Then goal syncStatus remains "synced"
    And goal updated_at is unchanged
