Feature: Settings service
  Implements FR7 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR7
  Scenario: Default box returns inbox when unset
    Given no setting with key "default_box" exists
    When getDefaultBox is called
    Then the result is "inbox"

  @settings-specs-and-bdd @FR7
  Scenario: Default box returns stored value
    Given a setting with key "default_box" and value "today" exists
    When getDefaultBox is called
    Then the result is "today"

  @settings-specs-and-bdd @FR7
  Scenario: Accent color returns green when unset
    Given no setting with key "accent_color" exists
    When getAccentColor is called
    Then the result is "green"

  @settings-specs-and-bdd @FR7
  Scenario: Accent color returns stored value
    Given a setting with key "accent_color" and value "purple" exists
    When getAccentColor is called
    Then the result is "purple"

  @settings-specs-and-bdd @FR7
  Scenario: Service delegates set to repository
    When the service sets "accent_color" to "blue"
    Then the repository set is invoked with key "accent_color" and value "blue"
