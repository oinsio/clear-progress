Feature: GAS Setup — Connected State
  Implements change gas-setup-ui-spec.
  Display and actions when connected to a GAS backend.

  @gas-setup-ui-spec @FR6
  Scenario: Connected state shows deployment URL
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    When user opens SetupPage
    Then URL "https://script.google.com/macros/s/ABC/exec" is displayed

  @gas-setup-ui-spec @FR6
  Scenario: Connected state shows Client ID when configured
    Given user is connected to GAS with Client ID "123456789.apps.googleusercontent.com"
    When user opens SetupPage
    Then Client ID "123456789.apps.googleusercontent.com" is displayed

  @gas-setup-ui-spec @FR6
  Scenario: Connected state hides Client ID when not configured
    Given user is connected to GAS without Client ID
    When user opens SetupPage
    Then Client ID section is not displayed

  @gas-setup-ui-spec @FR6
  Scenario: Sign-in prompt shown when unauthenticated with Client ID
    Given user is connected to GAS with Client ID "123456789.apps.googleusercontent.com"
    And no access token is present
    When user opens SetupPage
    Then sign-in required message is displayed
    And Sign In button is available

  @gas-setup-ui-spec @FR6
  Scenario: Sign-in prompt hidden when authenticated
    Given user is connected to GAS with Client ID "123456789.apps.googleusercontent.com"
    And access token is present
    When user opens SetupPage
    Then sign-in prompt is not displayed

  @gas-setup-ui-spec @FR6
  Scenario: Disconnect returns to setup form
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    When user clicks Disconnect
    Then setup form is displayed with GAS section toggle

  @gas-setup-ui-spec @FR6
  Scenario: Go to App navigates to inbox
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    When user opens SetupPage
    Then Go to App button is available
