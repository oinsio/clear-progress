Feature: Color scheme switching
  Implements FR1, FR2, FR8 of theme-appearance-spec.

  @theme-appearance-spec @FR1
  Scenario: Apply light color scheme removes dark class
    Given the document has the "dark" class
    When color scheme "light" is applied
    Then the document does not have the "dark" class

  @theme-appearance-spec @FR1
  Scenario: Apply dark color scheme adds dark class
    Given the document does not have the "dark" class
    When color scheme "dark" is applied
    Then the document has the "dark" class

  @theme-appearance-spec @FR1 @FR2
  Scenario: Apply system color scheme with dark preference
    Given the system prefers dark mode
    When color scheme "system" is applied
    Then the document has the "dark" class

  @theme-appearance-spec @FR1 @FR2
  Scenario: Apply system color scheme with light preference
    Given the system prefers light mode
    When color scheme "system" is applied
    Then the document does not have the "dark" class

  @theme-appearance-spec @FR8
  Scenario: Initialize color scheme from valid localStorage cache
    Given localStorage has "dark" for the color scheme key
    When the initial color scheme is resolved
    Then the resolved color scheme is "dark"

  @theme-appearance-spec @FR8
  Scenario: Initialize color scheme with missing cache
    Given localStorage has no value for the color scheme key
    When the initial color scheme is resolved
    Then the resolved color scheme is "system"

  @theme-appearance-spec @FR8
  Scenario: Initialize color scheme with invalid cache
    Given localStorage has "invalid_scheme" for the color scheme key
    When the initial color scheme is resolved
    Then the resolved color scheme is "system"
