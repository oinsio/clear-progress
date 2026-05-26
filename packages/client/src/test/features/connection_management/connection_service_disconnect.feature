Feature: Connection service disconnect
  Implements FR2 of connection-management-spec.
  Deactivating a backend connection by setting isActive to false,
  removing auth and sync keys, and dispatching events.

  @connection-management-spec @FR2
  Scenario: Disconnect sets isActive to false
    Given an active GAS connection config with url "https://example.com" and clientId "client-123"
    When disconnect is called
    Then the saved config has isActive false
    And the saved config has url "https://example.com"
    And the saved config has clientId "client-123"

  @connection-management-spec @FR2
  Scenario: Disconnect removes auth and sync keys
    Given an active GAS connection config with url "https://example.com"
    And auth keys exist in localStorage
    And sync keys exist in localStorage
    When disconnect is called
    Then auth keys are removed from localStorage
    And sync keys are removed from localStorage

  @connection-management-spec @FR2
  Scenario: Disconnect handles missing config gracefully
    Given no connection config exists in localStorage
    When disconnect is called
    Then no error is thrown

  @connection-management-spec @FR2
  Scenario: Disconnect dispatches events
    Given an active GAS connection config with url "https://example.com"
    When disconnect is called
    Then a backend connection event was dispatched
    And a Google client ID event was dispatched
