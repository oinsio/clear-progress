Feature: Hex to RGB conversion
  Implements FR7, FR12 of theme-appearance-spec.

  @theme-appearance-spec @FR7 @FR12
  Scenario: Convert valid hex with hash prefix
    When hexToRgb is called with "#ff5733"
    Then the result is "255 87 51"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Convert valid hex without hash prefix
    When hexToRgb is called with "ff5733"
    Then the result is "255 87 51"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Convert black color
    When hexToRgb is called with "#000000"
    Then the result is "0 0 0"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Convert white color
    When hexToRgb is called with "#ffffff"
    Then the result is "255 255 255"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Convert uppercase hex
    When hexToRgb is called with "#FF5733"
    Then the result is "255 87 51"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Reject invalid hex string
    When hexToRgb is called with "xyz"
    Then an error is thrown containing "Invalid hex color format"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Reject short hex format
    When hexToRgb is called with "#fff"
    Then an error is thrown containing "Invalid hex color format"

  @theme-appearance-spec @FR7 @FR12
  Scenario: Reject empty string
    When hexToRgb is called with ""
    Then an error is thrown containing "Invalid hex color format"
