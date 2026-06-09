Feature: Connection service read operations
  Implements FR11, FR12 of localstorage-refactor.
  Retrieving connection config from single JSON key and deriving backend type.

  @localstorage-refactor @FR12
  Scenario: getConnectionConfig returns config when activeType is set
    Given a connection store with activeType "gas" and gas config url "https://example.com"
    When getConnectionConfig is called
    Then the returned config has type "gas"

  @localstorage-refactor @FR12
  Scenario: getConnectionConfig returns null when activeType is null
    Given a connection store with activeType null and gas config url "https://example.com"
    When getConnectionConfig is called
    Then the result is null

  @localstorage-refactor @FR12
  Scenario: getConnectionConfig returns null for missing config
    Given no connection config exists in localStorage
    When getConnectionConfig is called
    Then the result is null

  @localstorage-refactor @FR12
  Scenario: getConnectionConfig returns null for invalid config
    Given invalid JSON exists in the connection config storage key
    When getConnectionConfig is called
    Then the result is null

  @localstorage-refactor @FR12
  Scenario: getSavedConnectionConfig returns config when activeType is null
    Given a connection store with activeType null and gas config url "https://example.com"
    When getSavedConnectionConfig is called
    Then the returned config has type "gas"

  @localstorage-refactor @FR12
  Scenario: getSavedConnectionConfig returns config when activeType is set
    Given a connection store with activeType "gas" and gas config url "https://example.com"
    When getSavedConnectionConfig is called
    Then the returned config has type "gas"

  @localstorage-refactor @FR12
  Scenario: getSavedConnectionConfig returns null for missing config
    Given no connection config exists in localStorage
    When getSavedConnectionConfig is called
    Then the result is null

  @localstorage-refactor @FR12
  Scenario: getBackendType returns gas
    Given a connection store with activeType "gas" and gas config url "https://example.com"
    When getBackendType is called
    Then the backend type is "gas"

  @localstorage-refactor @FR12
  Scenario: getBackendType returns supabase
    Given a connection store with activeType "supabase" and supabase config url "https://example.supabase.co"
    When getBackendType is called
    Then the backend type is "supabase"

  @localstorage-refactor @FR12
  Scenario: getBackendType returns null when no active config
    Given no connection config exists in localStorage
    When getBackendType is called
    Then the backend type is null
