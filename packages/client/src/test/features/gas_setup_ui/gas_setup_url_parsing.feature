Feature: GAS Setup — URL and Client ID Parsing
  Implements change gas-setup-ui-spec.
  Utility functions resolve shorthand input to full URLs and Client IDs.

  @gas-setup-ui-spec @FR2
  Scenario: Plain Deployment ID resolved to full GAS URL
    When parseGasInput receives "AKfycbx123"
    Then result is "https://script.google.com/macros/s/AKfycbx123/exec"

  @gas-setup-ui-spec @FR2
  Scenario: Full URL passed through unchanged
    When parseGasInput receives "https://script.google.com/macros/s/AKfycbx123/exec"
    Then result is "https://script.google.com/macros/s/AKfycbx123/exec"

  @gas-setup-ui-spec @FR2
  Scenario: Whitespace trimmed before resolving
    When parseGasInput receives "  AKfycbx123  "
    Then result is "https://script.google.com/macros/s/AKfycbx123/exec"

  @gas-setup-ui-spec @FR7
  Scenario: Plain Client ID gets Google suffix appended
    When parseClientId receives "123456789"
    Then result is "123456789.apps.googleusercontent.com"

  @gas-setup-ui-spec @FR7
  Scenario: Full Client ID passed through unchanged
    When parseClientId receives "123456789.apps.googleusercontent.com"
    Then result is "123456789.apps.googleusercontent.com"
