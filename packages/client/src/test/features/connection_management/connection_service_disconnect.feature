Feature: Connection service disconnect
  Implements FR10 of localstorage-refactor.
  Deactivating a backend connection by setting activeType to null,
  preserving configs, removing auth and sync keys, and dispatching events.

  @localstorage-refactor @FR10
  Scenario: Disconnect sets activeType to null and preserves configs
    Given an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"
    When disconnect is called
    Then the store has activeType null
    And the store has supabase config with url "https://example.supabase.co"
    And the store has supabase config with anonKey "test-key"

  @localstorage-refactor @FR10
  Scenario: Disconnect removes auth and sync keys
    Given an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"
    And auth keys exist in localStorage
    And sync keys exist in localStorage
    When disconnect is called
    Then auth keys are removed from localStorage
    And sync keys are removed from localStorage

  @localstorage-refactor @FR10
  Scenario: Disconnect handles missing config gracefully
    Given no connection config exists in localStorage
    When disconnect is called
    Then no error is thrown

  @localstorage-refactor @FR10
  Scenario: Disconnect dispatches events
    Given an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"
    When disconnect is called
    Then a backend connection event was dispatched
