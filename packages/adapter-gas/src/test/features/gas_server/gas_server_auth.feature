Feature: GAS server authentication
  Implements FR6 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Valid token passes authentication
    Given token info returns a valid verified email
    When POST request with token arrives for action "init"
    Then response is not unauthorized

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Invalid or expired token is rejected
    Given token info returns HTTP 401
    When POST request with token arrives for action "init"
    Then response is unauthorized with message "Token is invalid or expired"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Unverified email is rejected
    Given token info returns an unverified email
    When POST request with token arrives for action "init"
    Then response is unauthorized with message "Google account email is not verified"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: First call registers owner email
    Given no owner email is registered
    And token info returns a valid verified email
    When POST request with token arrives for action "init"
    Then owner email is saved in script properties

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Matching owner email passes
    Given owner email is already registered
    And token info returns the same owner email
    When POST request with token arrives for action "init"
    Then response is not unauthorized

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Wrong account is rejected
    Given owner email is already registered
    And token info returns a different email
    When POST request with token arrives for action "init"
    Then response is unauthorized with message "Token belongs to a different account"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Network error during token verification
    Given token verification causes a network error
    When POST request with token arrives for action "init"
    Then response is unauthorized with message containing "network error"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: GAS permission error during token verification
    Given token verification causes a GAS permission error
    When POST request with token arrives for action "init"
    Then response is unauthorized with message containing "not authorized"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Missing access_token is rejected
    When POST request arrives without access_token
    Then response is unauthorized with message "access_token is required"

  @gas-adapter-specs-and-bdd @FR6
  Scenario: Non-string access_token is rejected
    When POST request arrives with non-string access_token
    Then response is unauthorized with message "access_token is required"
