Feature: Cover Sync Protocol — Base64 Conversion
  Implements spec-sync-protocol base64 decoding for cover data.
  Verifies that base64-encoded cover data from server is correctly
  decoded to Uint8Array for blob creation.

  @spec-sync-protocol @FR10
  Scenario: Base64 string is correctly decoded to Uint8Array
    Given a base64-encoded cover data string
    When base64ToUint8Array is called
    Then the result is a valid Uint8Array
    And the decoded bytes match the original data
