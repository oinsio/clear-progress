Feature: Connection status derivation
  Implements FR7 of connection-management-spec.
  Connection status is derived from backend configuration, authentication state,
  and sync status with strict priority order:
  not_configured > no_auth > sync status mapping > synced.

  @connection-management-spec @FR7
  Scenario: No config returns not_configured
    Given no backend connection config exists
    When connection status is derived
    Then the connection status is "not_configured"

  @connection-management-spec @FR7
  Scenario: GAS with clientId but no token returns no_auth
    Given a GAS config with clientId "client-123" exists
    And no access token is present
    When connection status is derived
    Then the connection status is "no_auth"

  @connection-management-spec @FR7
  Scenario: GAS without clientId and no token returns synced
    Given a GAS config without clientId exists
    And no access token is present
    When connection status is derived
    Then the connection status is "synced"

  @connection-management-spec @FR7
  Scenario: Sync status offline maps to offline
    Given an authenticated backend connection exists
    And sync status is "offline"
    When connection status is derived
    Then the connection status is "offline"

  @connection-management-spec @FR7
  Scenario: Sync status error maps to error
    Given an authenticated backend connection exists
    And sync status is "error"
    When connection status is derived
    Then the connection status is "error"

  @connection-management-spec @FR7
  Scenario: Sync status unauthorized maps to unauthorized
    Given an authenticated backend connection exists
    And sync status is "unauthorized"
    When connection status is derived
    Then the connection status is "unauthorized"

  @connection-management-spec @FR7
  Scenario: Sync status syncing maps to syncing
    Given an authenticated backend connection exists
    And sync status is "syncing"
    When connection status is derived
    Then the connection status is "syncing"

  @connection-management-spec @FR7
  Scenario: Default sync status maps to synced
    Given an authenticated backend connection exists
    And sync status is "idle"
    When connection status is derived
    Then the connection status is "synced"

  @connection-management-spec @FR7
  Scenario: not_configured takes precedence over no_auth
    Given no backend connection config exists
    And no access token is present
    When connection status is derived
    Then the connection status is "not_configured"

  @connection-management-spec @FR7
  Scenario: no_auth takes precedence over sync error
    Given a GAS config with clientId "client-123" exists
    And no access token is present
    And sync status is "error"
    When connection status is derived
    Then the connection status is "no_auth"
