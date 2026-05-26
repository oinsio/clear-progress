Feature: Interface scale switching
  Implements FR6, FR11 of theme-appearance-spec.

  @theme-appearance-spec @FR6 @FR11
  Scenario: Apply interface scale sets data-scale attribute
    When interface scale "large" is applied
    Then the document has data-scale "large"

  @theme-appearance-spec @FR6 @FR11
  Scenario Outline: Apply each interface scale value
    When interface scale "<scale>" is applied
    Then the document has data-scale "<scale>"

    Examples:
      | scale  |
      | small  |
      | normal |
      | large  |
      | xLarge |

  @theme-appearance-spec @FR11
  Scenario: Initialize interface scale from valid localStorage cache
    Given localStorage has "large" for the interface scale key
    When the initial interface scale is resolved
    Then the resolved interface scale is "large"

  @theme-appearance-spec @FR11
  Scenario: Initialize interface scale with missing cache
    Given localStorage has no value for the interface scale key
    When the initial interface scale is resolved
    Then the resolved interface scale is "normal"

  @theme-appearance-spec @FR11
  Scenario: Initialize interface scale with invalid cache
    Given localStorage has "huge" for the interface scale key
    When the initial interface scale is resolved
    Then the resolved interface scale is "normal"
