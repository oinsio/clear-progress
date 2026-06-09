Feature: Connection service connect
  Implements FR9 of localstorage-refactor.
  Saving a backend connection config to single JSON key with activeType
  and dispatching appropriate events.

  @localstorage-refactor @FR9
  Scenario: Connect saves config with activeType set
    Given a GAS config with url "https://example.com" and clientId "client-123"
    When connect is called with the config
    Then the store has activeType "gas"
    And the store has gas config with url "https://example.com"
    And the store has gas config with clientId "client-123"

  @localstorage-refactor @FR9
  Scenario: Connect sets activeType to the config type
    Given a GAS config with url "https://example.com"
    When connect is called with the config
    Then the store has activeType "gas"

  @localstorage-refactor @FR9
  Scenario: Connect dispatches backend connection event
    Given a GAS config with url "https://example.com"
    When connect is called with the config
    Then a backend connection event was dispatched

  @localstorage-refactor @FR9
  Scenario: Connect dispatches Google client ID event for GAS with clientId
    Given a GAS config with url "https://example.com" and clientId "client-123"
    When connect is called with the config
    Then a Google client ID event was dispatched

  @localstorage-refactor @FR9
  Scenario: Connect does not dispatch Google client ID event for GAS without clientId
    Given a GAS config with url "https://example.com" and no clientId
    When connect is called with the config
    Then a Google client ID event was not dispatched
