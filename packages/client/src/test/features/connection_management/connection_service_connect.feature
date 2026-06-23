Feature: Connection service connect
  Implements FR9 of localstorage-refactor.
  Saving a backend connection config to single JSON key with activeType
  and dispatching appropriate events.

  @localstorage-refactor @FR9
  Scenario: Connect saves config with activeType set
    Given a Supabase config with url "https://example.supabase.co" and anonKey "test-key"
    When connect is called with the config
    Then the store has activeType "supabase"
    And the store has supabase config with url "https://example.supabase.co"
    And the store has supabase config with anonKey "test-key"

  @localstorage-refactor @FR9
  Scenario: Connect sets activeType to the config type
    Given a Supabase config with url "https://example.supabase.co" and anonKey "anon-key"
    When connect is called with the config
    Then the store has activeType "supabase"

  @localstorage-refactor @FR9
  Scenario: Connect dispatches backend connection event
    Given a Supabase config with url "https://example.supabase.co" and anonKey "anon-key"
    When connect is called with the config
    Then a backend connection event was dispatched
