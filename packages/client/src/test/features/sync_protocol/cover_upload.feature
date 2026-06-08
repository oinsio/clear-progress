Feature: Cover Sync Protocol — Upload
  Implements spec-sync-protocol cover upload scenarios: pending cover sync,
  batch upload with chunking, SHA-256 deduplication, per-item error handling,
  and post-upload cover repository updates.

  @spec-sync-protocol @FR8
  Scenario: Pending cover is deleted after successful upload
    Given a pending cover with hash "hash-abc" exists
    When cover sync runs
    Then pending cover "hash-abc" is removed from repository

  @spec-sync-protocol @FR8
  Scenario: Cover blob is saved to cover repository after upload
    Given a pending cover with hash "hash-upload" exists for goal "goal-1"
    When cover sync runs
    Then cover repository contains a record with data_hash "hash-upload"

  @spec-sync-protocol @FR8
  Scenario: Duplicate cover detected by hash is not saved again (reused: true)
    Given a pending cover with hash "hash-reused" exists
    And server will respond with reused true for "hash-reused"
    When cover sync runs
    Then cover repository save is not called
    And pending cover "hash-reused" is removed from repository

  @spec-sync-protocol @FR9
  Scenario: Covers are uploaded in chunks of MAX_FILE_BATCH_SIZE
    Given more pending covers than MAX_FILE_BATCH_SIZE exist
    When cover sync runs
    Then uploadCovers is called twice

  @spec-sync-protocol @FR9
  Scenario: Batch does not produce extra empty iteration on exact boundary
    Given exactly MAX_FILE_BATCH_SIZE pending covers exist
    When cover sync runs
    Then uploadCovers is called exactly once
    And no empty batch is processed

  @spec-sync-protocol @FR9
  Scenario: Per-item error does not block other items in same chunk
    Given two pending covers exist: "hash-bad" and "hash-ok"
    And server will respond with error for "hash-bad" and success for "hash-ok"
    When cover sync runs
    Then pending cover "hash-ok" is removed from repository
    And pending cover "hash-bad" is not removed from repository

  @spec-sync-protocol @FR9
  Scenario: Upload skips result with error flag even when data_hash is present
    Given a pending cover with hash "hash-error" exists
    And server will respond with error flag true for "hash-error"
    When cover sync runs
    Then pending cover "hash-error" is not removed from repository

  @spec-sync-protocol @FR9
  Scenario: API failure stops processing remaining chunks
    Given more pending covers than MAX_FILE_BATCH_SIZE exist
    And server will reject the first uploadCovers call
    When cover sync runs
    Then uploadCovers is called only once
