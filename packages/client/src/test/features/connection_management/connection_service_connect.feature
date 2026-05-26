Feature: Connection service connect
  Implements FR1 of connection-management-spec.
  Saving a backend connection config to localStorage with correct isActive flag
  and dispatching appropriate events.

  @connection-management-spec @FR1
  Scenario: Connect saves config with isActive true
    Given a GAS config with url "https://example.com" and clientId "client-123"
    When connect is called with the config
    Then the saved config has isActive true
    And the saved config has url "https://example.com"
    And the saved config has clientId "client-123"

  @connection-management-spec @FR1
  Scenario: Connect overwrites isActive false to true
    Given a GAS config with isActive false
    When connect is called with the config
    Then the saved config has isActive true

  @connection-management-spec @FR1
  Scenario: Connect dispatches backend connection event
    Given a GAS config with url "https://example.com"
    When connect is called with the config
    Then a backend connection event was dispatched

  @connection-management-spec @FR1
  Scenario: Connect dispatches Google client ID event for GAS with clientId
    Given a GAS config with url "https://example.com" and clientId "client-123"
    When connect is called with the config
    Then a Google client ID event was dispatched

  @connection-management-spec @FR1
  Scenario: Connect does not dispatch Google client ID event for GAS without clientId
    Given a GAS config with url "https://example.com" and no clientId
    When connect is called with the config
    Then a Google client ID event was not dispatched
