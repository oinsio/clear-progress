Feature: Settings repository write
  Implements FR1, FR5 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Create new setting
    Given no setting with key "accent_color" exists
    When set is called with key "accent_color" and value "blue"
    Then a new setting is created with key "accent_color" and value "blue"
    And the setting has needsSync true
    And the setting has a current updated_at timestamp

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Update existing setting with different value
    Given a setting with key "accent_color" and value "green" exists
    When set is called with key "accent_color" and value "blue"
    Then the setting value is updated to "blue"
    And the setting has needsSync true
    And the setting has a refreshed updated_at timestamp

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Skip write when value unchanged
    Given a setting with key "accent_color" and value "blue" exists
    When set is called with key "accent_color" and value "blue"
    Then no write occurs
    And the original updated_at is preserved

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Reject invalid setting data
    When set is called with invalid data
    Then an error containing "Invalid setting data" is thrown
