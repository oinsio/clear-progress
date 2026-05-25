Feature: GAS server routing
  Implements FR5 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR5
  Scenario: Ping via GET dispatches ping action
    When GET request arrives with action "ping"
    Then ping action is invoked

  @gas-adapter-specs-and-bdd @FR5
  Scenario: GET with unknown action returns error
    When GET request arrives with action "unknown"
    Then response is an error with code "INVALID_ACTION"
    And error message contains "Unknown action"

  @gas-adapter-specs-and-bdd @FR5
  Scenario: GET with missing action returns error
    When GET request arrives without action
    Then response is an error with code "INVALID_ACTION"
    And error message contains "Unknown action"

  @gas-adapter-specs-and-bdd @FR5
  Scenario: POST dispatches init action
    Given user is authenticated
    When POST request arrives with action "init"
    Then init action is invoked

  @gas-adapter-specs-and-bdd @FR5
  Scenario: POST dispatches pull action
    Given user is authenticated
    When POST request arrives with action "pull"
    Then pull action is invoked

  @gas-adapter-specs-and-bdd @FR5
  Scenario: POST dispatches push action
    Given user is authenticated
    When POST request arrives with action "push"
    Then push action is invoked

  @gas-adapter-specs-and-bdd @FR5
  Scenario: POST with unknown action returns error
    Given user is authenticated
    When POST request arrives with action "bogus"
    Then response is an error with code "INVALID_ACTION"
    And error message contains "Unknown action"
