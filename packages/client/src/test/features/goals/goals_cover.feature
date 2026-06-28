Feature: Goals Cover Management
  Implements FR11 of add-goals-specs.

  @add-goals-specs @FR11
  Scenario: Set goal cover
    Given goal with cover_hash "" exists
    When user updates goal cover_hash to "abc123def456"
    Then goal has cover_hash "abc123def456"
    And goal has syncStatus "pending"

  @add-goals-specs @FR11
  Scenario: Remove goal cover
    Given goal with cover_hash "abc123def456" exists
    When user updates goal cover_hash to ""
    Then goal has cover_hash ""
    And goal has syncStatus "pending"

  @add-goals-specs @FR11
  Scenario: Replace goal cover
    Given goal with cover_hash "old_hash" exists
    When user updates goal cover_hash to "new_hash"
    Then goal has cover_hash "new_hash"
    And goal has syncStatus "pending"

  @add-goals-specs @FR11
  Scenario: No-op cover update
    Given goal with cover_hash "abc123" and syncStatus "synced" exists
    When user updates goal cover_hash to "abc123"
    Then goal syncStatus remains "synced"
    And goal updated_at is unchanged
