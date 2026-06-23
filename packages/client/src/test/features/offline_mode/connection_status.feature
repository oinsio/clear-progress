Feature: Connection status derivation
  Implements FR4 of add-offline-mode-specs.
  Connection status is derived from backend configuration and sync status,
  evaluated in strict priority order.

  @add-offline-mode-specs @FR4
  Scenario: No backend configured
    Given no backend connection config exists
    When connection status is derived
    Then the connection status is "not_configured"

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
  Scenario: Idle sync status produces synced connection
    Given an authenticated backend connection
    And sync status is "idle"
    When connection status is derived
    Then the connection status is "synced"
