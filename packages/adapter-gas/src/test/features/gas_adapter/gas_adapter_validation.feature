Feature: GAS adapter response validation
  Implements FR3 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR3
  Scenario: Valid response passes Zod validation
    Given the server responds with a valid init response
    When adapter calls init
    Then the response is returned successfully

  @gas-adapter-specs-and-bdd @FR3
  Scenario: Invalid response shape throws ApiValidationError
    Given the server responds with an invalid shape
    When adapter calls init
    Then ApiValidationError is thrown for action "init"

  @gas-adapter-specs-and-bdd @FR3
  Scenario: Ping with non-JSON response throws error
    Given the server responds with non-JSON content for ping
    When adapter pings the server
    Then an error with message "Invalid response: expected JSON" is thrown

  @gas-adapter-specs-and-bdd @FR3
  Scenario: Ping with invalid schema throws ApiValidationError
    Given the server responds with invalid schema for ping
    When adapter pings the server
    Then ApiValidationError is thrown for action "ping"

  @gas-adapter-specs-and-bdd @FR3
  Scenario: HTTP 500 throws error with status code
    Given the server responds with HTTP status 500
    When adapter calls init
    Then an error with message "HTTP error: 500" is thrown
