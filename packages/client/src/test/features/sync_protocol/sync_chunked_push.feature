Feature: Sync Protocol — Chunked Push
  Implements spec-sync-protocol FR16: chunked push for large batches.
  Push splits into sequential chunks of 200 records to prevent GAS timeout.

  @spec-sync-protocol @FR16
  Scenario: Push splits into chunks when exceeding limit
    Given client has 450 dirty tasks
    When push is called
    Then 3 sequential push requests are sent: 200, 200, 50 records

  @spec-sync-protocol @FR16
  Scenario: Push within limit sends single request
    Given client has 150 dirty tasks
    When push is called
    Then a single push request with all 150 records is sent

  @spec-sync-protocol @FR16
  Scenario: Chunk failure stops remaining chunks
    Given client has 450 dirty tasks
    And chunk 2 will fail with network error
    When push is called
    Then only chunks 1 and 2 are sent
    And records from chunk 2 and 3 retain needsSync true

  @spec-sync-protocol @FR16
  Scenario: Mixed entity types are counted together for chunking
    Given client has 150 dirty tasks and 100 dirty goals
    When push is called
    Then 2 sequential push requests are sent: 200 and 50 records

  @spec-sync-protocol @FR16
  Scenario: Chunk success clears dirty flags for accepted records
    Given client has 250 dirty tasks
    And all chunks will succeed
    When push is called
    Then 2 sequential push requests are sent
    And all 250 tasks have needsSync false after push
