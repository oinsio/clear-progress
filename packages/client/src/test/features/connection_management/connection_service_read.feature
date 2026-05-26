Feature: Connection service read operations
  Implements FR3, FR4, FR5 of connection-management-spec.
  Retrieving connection config (active only vs saved) and deriving backend type.

  @connection-management-spec @FR3
  Scenario: getConnectionConfig returns active config
    Given a valid GAS config with isActive true exists in localStorage
    When getConnectionConfig is called
    Then the returned config has type "gas"

  @connection-management-spec @FR3
  Scenario: getConnectionConfig returns null for inactive config
    Given a valid GAS config with isActive false exists in localStorage
    When getConnectionConfig is called
    Then the result is null

  @connection-management-spec @FR3
  Scenario: getConnectionConfig returns null for missing config
    Given no connection config exists in localStorage
    When getConnectionConfig is called
    Then the result is null

  @connection-management-spec @FR3
  Scenario: getConnectionConfig returns null for invalid config
    Given invalid JSON exists in the connection config storage key
    When getConnectionConfig is called
    Then the result is null

  @connection-management-spec @FR4
  Scenario: getSavedConnectionConfig returns inactive config
    Given a valid GAS config with isActive false exists in localStorage
    When getSavedConnectionConfig is called
    Then the returned config has type "gas"

  @connection-management-spec @FR4
  Scenario: getSavedConnectionConfig returns active config
    Given a valid GAS config with isActive true exists in localStorage
    When getSavedConnectionConfig is called
    Then the returned config has type "gas"

  @connection-management-spec @FR4
  Scenario: getSavedConnectionConfig returns null for missing config
    Given no connection config exists in localStorage
    When getSavedConnectionConfig is called
    Then the result is null

  @connection-management-spec @FR5
  Scenario: getBackendType returns gas
    Given a valid GAS config with isActive true exists in localStorage
    When getBackendType is called
    Then the backend type is "gas"

  @connection-management-spec @FR5
  Scenario: getBackendType returns supabase
    Given a valid Supabase config with isActive true exists in localStorage
    When getBackendType is called
    Then the backend type is "supabase"

  @connection-management-spec @FR5
  Scenario: getBackendType returns null when no active config
    Given no connection config exists in localStorage
    When getBackendType is called
    Then the backend type is null
