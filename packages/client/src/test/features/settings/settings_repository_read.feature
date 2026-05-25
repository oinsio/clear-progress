Feature: Settings repository read
  Implements FR1 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR1
  Scenario: Get existing setting by key
    Given a setting with key "accent_color" and value "blue" exists
    When getByKey is called with "accent_color"
    Then the full setting record is returned with key "accent_color", value "blue", updated_at, and needsSync

  @settings-specs-and-bdd @FR1
  Scenario: Get value of existing setting
    Given a setting with key "default_box" and value "today" exists
    When getValue is called with "default_box"
    Then the result is "today"

  @settings-specs-and-bdd @FR1
  Scenario: Get non-existent setting by key
    Given no setting with key "unknown_key" exists
    When getByKey is called with "unknown_key"
    Then the result is undefined

  @settings-specs-and-bdd @FR1
  Scenario: Get value of non-existent setting
    Given no setting with key "unknown_key" exists
    When getValue is called with "unknown_key"
    Then the result is undefined

  @settings-specs-and-bdd @FR1
  Scenario: Get all settings from populated store
    Given three settings exist in the repository
    When getAll is called
    Then an array of three setting records is returned

  @settings-specs-and-bdd @FR1
  Scenario: Get all settings from empty store
    Given no settings exist in the repository
    When getAll is called
    Then an empty array is returned
