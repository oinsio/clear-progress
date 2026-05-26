Feature: In-memory adapter lifecycle
  Implements FR1 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR1
  Scenario: Ping before init returns uninitialized
    Given a fresh adapter instance
    When ping is called
    Then the response has ok true, app "inmemory", version "0.1.0", and initialized false

  @adapter-inmemory-spec @FR1
  Scenario: Ping after init returns initialized
    Given a fresh adapter instance
    When init is called
    And ping is called
    Then the ping response has initialized true

  @adapter-inmemory-spec @FR1
  Scenario: Init returns ok
    Given a fresh adapter instance
    When init is called
    Then the init response has ok true

  @adapter-inmemory-spec @FR1
  Scenario: Init is idempotent
    Given a fresh adapter instance
    When init is called twice
    Then both init responses have ok true
