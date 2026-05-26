Feature: Adapter creation by config type
  Implements FR1, FR2, FR5, FR6 of adapter-loader-spec.
  The system creates the correct SyncAdapter based on the connection config type.

  @adapter-loader-spec @FR1 @FR5
  Scenario: GAS config creates GAS adapter
    Given a connection config with type "gas" and url "https://script.google.com/test"
    When the default sync adapter is requested
    Then the GAS adapter factory is called with the config url and getAccessToken
    And the returned adapter is the GAS adapter instance

  @adapter-loader-spec @FR1 @FR6
  Scenario: Supabase config creates Supabase adapter
    Given a connection config with type "supabase"
    When the default sync adapter is requested
    Then the Supabase adapter factory is called with the Supabase client
    And the returned adapter is the Supabase adapter instance

  @adapter-loader-spec @FR2
  Scenario: No config throws error
    Given no connection config exists
    When the default sync adapter is requested
    Then an error "No backend configured" is thrown
