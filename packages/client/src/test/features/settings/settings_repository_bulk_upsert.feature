Feature: Settings repository bulk upsert
  Implements FR3, FR6 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR3 @FR6
  Scenario: Accept newer server setting
    Given a local setting with key "accent_color", value "green", updated_at "2025-01-01T00:00:00.000Z", and needsSync false
    When bulkUpsert receives "accent_color" with value "blue" and updated_at "2025-01-02T00:00:00.000Z"
    Then the local setting is updated to value "blue"
    And the setting has needsSync false

  @settings-specs-and-bdd @FR3 @FR6
  Scenario: Skip server setting when local is dirty
    Given a local setting with key "accent_color", value "coral", and needsSync true
    When bulkUpsert receives "accent_color" with value "blue"
    Then the local setting remains with value "coral"
    And the setting has needsSync true

  @settings-specs-and-bdd @FR3 @FR6
  Scenario: Skip server setting when not newer
    Given a local setting with key "accent_color" and updated_at "2025-01-02T00:00:00.000Z"
    When bulkUpsert receives "accent_color" with updated_at "2025-01-01T00:00:00.000Z"
    Then the local setting remains unchanged

  @settings-specs-and-bdd @FR3 @FR6
  Scenario: Insert new setting from server
    Given no local setting with key "default_box" exists
    When bulkUpsert receives "default_box" with value "inbox"
    Then a new setting is created with key "default_box" and value "inbox"
    And the setting has needsSync false

  @settings-specs-and-bdd @FR3 @FR6
  Scenario: Skip empty bulk upsert
    When bulkUpsert is called with an empty array
    Then no database operations are performed
