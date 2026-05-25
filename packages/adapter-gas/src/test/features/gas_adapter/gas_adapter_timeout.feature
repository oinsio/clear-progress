Feature: GAS adapter timeout
  Implements FR4 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR4
  Scenario: Request completes within timeout normally
    Given the server responds quickly with a valid init response
    When adapter calls init with timeout tracking
    Then the response is returned successfully
    And the timeout timer is cleared

  @gas-adapter-specs-and-bdd @FR4
  Scenario: Abort signal is passed to fetch
    When adapter calls init with timeout tracking
    Then the fetch request includes an AbortSignal
