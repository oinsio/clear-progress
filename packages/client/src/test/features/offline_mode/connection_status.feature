Feature: Connection status derivation
  Implements FR4 of add-offline-mode-specs.
  Connection status is derived from backend configuration, authentication state,
  and sync status, evaluated in strict priority order.

  @add-offline-mode-specs @FR4
  Scenario: No backend configured
    Given no backend connection config exists
    When connection status is derived
    Then the connection status is "not_configured"

  @add-offline-mode-specs @FR4
  Scenario: Backend configured with clientId but no access token
    Given a backend config with clientId "client-123"
    And no access token is present
    When connection status is derived
    Then the connection status is "no_auth"

  @add-offline-mode-specs @FR4
  Scenario: Backend configured without clientId and no access token
    Given a backend config without clientId
    And no access token is present
    When connection status is derived
    Then the connection status is "synced"

  @add-offline-mode-specs @FR4
  Scenario: Sync status offline produces offline connection
    Given an authenticated backend connection
    And sync status is "offline"
    When connection status is derived
    Then the connection status is "offline"

  @add-offline-mode-specs @FR4
  Scenario: Sync status error produces error connection
    Given an authenticated backend connection
    And sync status is "error"
    When connection status is derived
    Then the connection status is "error"

  @add-offline-mode-specs @FR4
  Scenario: Sync status unauthorized produces unauthorized connection
    Given an authenticated backend connection
    And sync status is "unauthorized"
    When connection status is derived
    Then the connection status is "unauthorized"

  @add-offline-mode-specs @FR4
  Scenario: Sync status syncing produces syncing connection
    Given an authenticated backend connection
    And sync status is "syncing"
    When connection status is derived
    Then the connection status is "syncing"

  @add-offline-mode-specs @FR4
  Scenario: Priority — no_auth takes precedence over sync error
    Given a backend config with clientId "client-123"
    And no access token is present
    And sync status is "error"
    When connection status is derived
    Then the connection status is "no_auth"
