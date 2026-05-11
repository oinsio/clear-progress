Feature: Sync Protocol — Conflict Resolution
  Implements spec-sync-protocol conflict resolution scenarios:
  last-write-wins by updated_at comparison on the client side
  after receiving push results.

  @spec-sync-protocol @FR3
  Scenario: Conflict overwrites local record with server version
    Given client pushed task "t1" with name "Client version"
    And server responded with conflict and server_record named "Server version"
    When push results are applied
    Then local task "t1" has name "Server version"
    And local task "t1" has needsSync false

  @spec-sync-protocol @FR3
  Scenario: Conflict applies to goals
    Given client pushed goal "g1" with name "Client goal"
    And server responded with goal conflict and server_record named "Server goal"
    When push results are applied
    Then local goal "g1" has name "Server goal"
    And local goal "g1" has needsSync false

  @spec-sync-protocol @FR3
  Scenario: Created record is not treated as conflict even with server_record
    Given client pushed task "t1" with version 3
    And server responded with status "created" and server_record present
    When push results are applied
    Then local task "t1" retains original name
    And local task "t1" has needsSync false
