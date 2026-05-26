Feature: Adapter caching and IIFE fallback
  Implements FR3, FR4 of adapter-loader-spec.
  The system caches the adapter singleton and handles module-scope initialization.

  @adapter-loader-spec @FR3
  Scenario: Adapter is cached after first creation
    Given a connection config with type "gas" and url "https://script.google.com/test"
    When the default sync adapter is requested twice
    Then both calls return the same adapter instance
    And the GAS adapter factory is called exactly once

  @adapter-loader-spec @FR4
  Scenario: IIFE returns null when no config at load time
    Given no connection config exists
    When the defaultServices module is loaded
    Then the defaultSyncAdapter constant is null

  @adapter-loader-spec @FR4
  Scenario: IIFE returns adapter when config exists at load time
    Given a connection config with type "gas" and url "https://script.google.com/test"
    When the defaultServices module is loaded
    Then the defaultSyncAdapter constant is the GAS adapter instance
