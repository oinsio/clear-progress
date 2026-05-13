Feature: Sync Protocol — Lock Timeout
  Implements spec-sync-protocol FR17: server lock timeout handling.
  Server acquires script lock before push. If lock unavailable within 30s,
  returns SYNC_LOCK_TIMEOUT error. Client retries on next sync cycle.

  @spec-sync-protocol @FR17
  Scenario: Server returns lock timeout error
    Given client has dirty records to push
    And server will return SYNC_LOCK_TIMEOUT error
    When push is called
    Then push fails with SYNC_LOCK_TIMEOUT error
    And dirty records retain needsSync true

  @spec-sync-protocol @FR17
  Scenario: Client retries after lock timeout
    Given client has dirty records with needsSync true
    And previous push failed with SYNC_LOCK_TIMEOUT
    When push is called again
    Then records are sent to server again
