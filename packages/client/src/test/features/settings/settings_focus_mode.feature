Feature: Focus mode preference
  Implements FR4, FR8 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR4 @FR8
  Scenario: Default focus mode is enabled
    When no focus mode has been saved
    Then focus mode is true

  @settings-specs-and-bdd @FR4 @FR8
  Scenario: Default focus opacity is 30
    When no focus opacity has been saved
    Then focus opacity is 30

  @settings-specs-and-bdd @FR4 @FR8
  Scenario: Focus mode toggle persists
    When focus mode is set to false
    Then localStorage contains "false" under the focus mode key

  @settings-specs-and-bdd @FR4 @FR8
  Scenario: Focus opacity persists as number
    When focus opacity is set to 15
    Then localStorage contains "15" under the focus opacity key

  @settings-specs-and-bdd @FR4 @FR8
  Scenario: Invalid opacity falls back to default
    When localStorage contains "not-a-number" under the focus opacity key
    Then focus opacity is 30
