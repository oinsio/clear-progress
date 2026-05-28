Feature: Server Connection — GAS Form
  Implements change simplify-backend-connection.
  User connects to Google Apps Script backend via the Server section form.

  Background:
    Given no backend is connected
    And user has selected "Connect Google Apps Script"

  @simplify-backend-connection @FR7
  Scenario: Connect disabled when URL is empty
    When URL field is empty
    Then Connect button is disabled

  @simplify-backend-connection @FR7 @FR15
  Scenario: Connect disabled when Client ID is empty
    When user enters URL but Client ID is empty
    Then Connect button is disabled

  @simplify-backend-connection @FR7 @FR15
  Scenario: Connect enabled when both fields filled
    When user enters URL and Client ID
    Then Connect button is enabled

  @simplify-backend-connection @FR4 @FR9 @FR15
  Scenario: Successful connection to initialized backend shows sign-in
    Given user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"
    When user connects
    And ping responds with ok and initialized
    Then connection config is saved
    And "Sign in with Google" button is displayed

  @simplify-backend-connection @FR4 @FR9 @FR15
  Scenario: Successful connection to uninitialized backend shows sign-in
    Given user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"
    When user connects
    And ping responds with ok but not initialized
    Then "Sign in with Google" button is displayed

  @simplify-backend-connection @FR4 @UX3
  Scenario: Ping failure shows connection error
    Given user enters URL "https://bad-url.com" and Client ID "123456789"
    When user connects
    And ping responds with not ok
    Then connection error is displayed inline
    And user can retry

  @simplify-backend-connection @FR4 @UX3
  Scenario: Network error shows connection error
    Given user enters URL "https://unreachable.com" and Client ID "123456789"
    When user connects
    And ping throws a network error
    Then connection error is displayed inline
    And user can retry

  @simplify-backend-connection @FR9 @FR15 @UX4
  Scenario: Connecting state disables form
    Given user enters URL "https://script.google.com/macros/s/ABC/exec" and Client ID "123456789"
    When user connects
    Then loading indicator is displayed
    And Connect button is disabled
