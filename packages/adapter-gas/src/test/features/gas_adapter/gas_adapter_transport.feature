Feature: GAS adapter transport
  Implements FR1, FR2 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR1
  Scenario: Ping sends GET with action=ping parameter
    When adapter pings the server
    Then HTTP GET is sent to the GAS URL with action=ping
    And redirect follow is enabled

  @gas-adapter-specs-and-bdd @FR2
  Scenario: POST request includes Content-Type text/plain
    When adapter calls init
    Then the request Content-Type is "text/plain"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: POST request includes access_token in body
    When adapter calls init
    Then the request body contains access_token

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Init sends action "init"
    When adapter calls init
    Then the request body action is "init"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Pull sends action "pull"
    When adapter calls pull
    Then the request body action is "pull"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Push sends action "push"
    When adapter calls push
    Then the request body action is "push"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Upload file sends action "upload_file"
    When adapter calls uploadFile
    Then the request body action is "upload_file"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Upload files sends action "upload_files"
    When adapter calls uploadFiles
    Then the request body action is "upload_files"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Get file sends action "get_file"
    When adapter calls getFile
    Then the request body action is "get_file"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Delete file sends action "delete_file"
    When adapter calls deleteFile
    Then the request body action is "delete_file"

  @gas-adapter-specs-and-bdd @FR2
  Scenario: Purge sends action "purge" with confirm true
    When adapter calls purge
    Then the request body action is "purge"
    And the request body contains confirm true

  @gas-adapter-specs-and-bdd @FR1
  Scenario: Ping does not include access_token
    When adapter pings the server
    Then no access_token is included in the request
