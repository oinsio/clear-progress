Feature: Accent color selection
  Implements FR3, FR5, FR9 of theme-appearance-spec.

  @theme-appearance-spec @FR3 @FR5
  Scenario: Apply preset accent color sets data-accent attribute
    When accent color "blue" is applied
    Then the document has data-accent "blue"
    And the --color-accent CSS variable is not set

  @theme-appearance-spec @FR3 @FR5
  Scenario Outline: Apply each preset accent color
    When accent color "<color>" is applied
    Then the document has data-accent "<color>"

    Examples:
      | color  |
      | coral  |
      | orange |
      | yellow |
      | green  |
      | blue   |
      | indigo |
      | purple |

  @theme-appearance-spec @FR5
  Scenario: Meta theme-color updated for preset in light mode
    Given a meta theme-color tag exists
    And the document is in light mode
    When accent color "green" is applied
    Then the meta theme-color content is "#69b23e"

  @theme-appearance-spec @FR5
  Scenario: Meta theme-color updated for preset in dark mode
    Given a meta theme-color tag exists
    And the document is in dark mode
    When accent color "green" is applied
    Then the meta theme-color content is "#4d7c0f"

  @theme-appearance-spec @FR9
  Scenario: Initialize accent color from valid localStorage cache
    Given localStorage has "purple" for the accent color key
    When the initial accent color is resolved
    Then the resolved accent color is "purple"

  @theme-appearance-spec @FR9
  Scenario: Initialize accent color with missing cache
    Given localStorage has no value for the accent color key
    When the initial accent color is resolved
    Then the resolved accent color is "green"

  @theme-appearance-spec @FR9
  Scenario: Initialize accent color with invalid cache
    Given localStorage has "neon" for the accent color key
    When the initial accent color is resolved
    Then the resolved accent color is "green"
