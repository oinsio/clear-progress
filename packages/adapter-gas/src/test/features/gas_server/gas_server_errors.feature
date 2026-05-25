Feature: GAS server error and response format
  Implements FR7 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR7
  Scenario: Error response has standard format
    When GET request arrives with action "unknown"
    Then response contains ok false
    And response contains error code
    And response contains message

  @gas-adapter-specs-and-bdd @FR7
  Scenario: Success response has ok true
    When GET request arrives with action "ping"
    Then response contains ok true

  @gas-adapter-specs-and-bdd @FR7
  Scenario: Invalid JSON body returns error
    When POST request arrives with invalid JSON body
    Then response is an error with code "INVALID_PAYLOAD"
    And error message is "Request body must be valid JSON"

  @gas-adapter-specs-and-bdd @FR7
  Scenario: Auth error includes details when available
    Given token verification causes a network error with details "Connection refused"
    When POST request with token arrives for action "init"
    Then error message contains "Connection refused"

  @gas-adapter-specs-and-bdd @FR7
  Scenario: Auth error omits details when unavailable
    Given token info returns HTTP 401
    When POST request with token arrives for action "init"
    Then error message is "Token is invalid or expired"
