Feature: GAS adapter authentication
  Implements FR1, FR3 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR3
  Scenario: Null token throws ApiAuthError without HTTP request
    Given the access token is null
    When adapter calls init
    Then ApiAuthError is thrown
    And no HTTP request is made

  @gas-adapter-specs-and-bdd @FR3
  Scenario: UNAUTHORIZED in response body throws ApiAuthError
    Given the access token is valid
    And the server responds with UNAUTHORIZED error
    When adapter calls init
    Then ApiAuthError is thrown

  @gas-adapter-specs-and-bdd @FR1
  Scenario: Valid token is included in request body
    Given the access token is valid
    When adapter calls init
    Then the request body contains the valid token
