Feature: GAS Setup — Connection Flow
  Implements change gas-setup-ui-spec.
  User connects to a GAS backend from SetupPage.

  Background:
    Given no active connection is configured

  @gas-setup-ui-spec @FR1
  Scenario: GAS section toggle visible on SetupPage
    When user opens SetupPage
    Then GAS section toggle is displayed

  @gas-setup-ui-spec @FR1
  Scenario: GAS section expands to show inputs
    When user expands the GAS section
    Then URL input is displayed
    And Client ID input is displayed
    And Connect button is displayed

  @gas-setup-ui-spec @FR1
  Scenario: Connect button disabled when URL is empty
    Given user expands the GAS section
    When URL field is empty
    Then Connect button is disabled

  @gas-setup-ui-spec @FR1
  Scenario: Connect button enabled when URL is filled
    Given user expands the GAS section
    When user enters URL "https://script.google.com/macros/s/ABC/exec"
    Then Connect button is enabled

  @gas-setup-ui-spec @FR3
  Scenario: Successful connection to initialized backend without Client ID
    Given user expands the GAS section
    And user enters URL "https://script.google.com/macros/s/ABC/exec"
    When user clicks Connect
    And ping responds with ok and initialized
    Then connection config is saved with type "gas"
    And app navigates to inbox

  @gas-setup-ui-spec @FR5
  Scenario: Connection to uninitialized backend without Client ID shows warning
    Given user expands the GAS section
    And user enters URL "https://script.google.com/macros/s/ABC/exec"
    When user clicks Connect
    And ping responds with ok but not initialized
    Then not-initialized warning is displayed
    And back-to-input button is available

  @gas-setup-ui-spec @FR3 @FR5
  Scenario: Connection with Client ID to initialized backend shows sign-in
    Given user expands the GAS section
    And user enters URL "https://script.google.com/macros/s/ABC/exec"
    And user enters Client ID "123456789"
    When user clicks Connect
    And ping responds with ok and initialized
    Then awaiting sign-in state is displayed

  @gas-setup-ui-spec @FR4
  Scenario: Ping failure shows connection error
    Given user expands the GAS section
    And user enters URL "https://script.google.com/macros/s/ABC/exec"
    When user clicks Connect
    And ping responds with not ok
    Then connection error is displayed
    And Connect button is displayed

  @gas-setup-ui-spec @FR4
  Scenario: Network error shows connection error
    Given user expands the GAS section
    And user enters URL "https://script.google.com/macros/s/ABC/exec"
    When user clicks Connect
    And ping throws a network error
    Then connection error is displayed
    And Connect button is displayed

  @gas-setup-ui-spec @FR5
  Scenario: Back to input returns to input phase
    Given not-initialized warning is shown
    When user clicks back-to-input button
    Then URL input is displayed
    And Connect button is displayed
