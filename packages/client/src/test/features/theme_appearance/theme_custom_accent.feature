Feature: Custom accent color application
  Implements FR4, FR10 of theme-appearance-spec.

  @theme-appearance-spec @FR4 @FR10
  Scenario: Apply custom accent color in light mode
    Given the document is in light mode
    When custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"
    Then the --color-accent CSS variable is set to "255 87 51"
    And the document has data-accent "custom"

  @theme-appearance-spec @FR4 @FR10
  Scenario: Apply custom accent color in dark mode
    Given the document is in dark mode
    When custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"
    Then the --color-accent CSS variable is set to "0 255 0"
    And the document has data-accent "custom"

  @theme-appearance-spec @FR4 @FR10
  Scenario: Apply custom accent with default light color
    Given the document is in light mode
    When custom accent color is applied without custom hex values
    Then the --color-accent CSS variable is set to "252 211 77"

  @theme-appearance-spec @FR4 @FR10
  Scenario: Apply custom accent with default dark color
    Given the document is in dark mode
    When custom accent color is applied without custom hex values
    Then the --color-accent CSS variable is set to "20 184 166"

  @theme-appearance-spec @FR4 @FR10
  Scenario: Meta theme-color updated for custom accent
    Given a meta theme-color tag exists
    And the document is in light mode
    When custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"
    Then the meta theme-color content is "#ff5733"
