Feature: Cover Sync Protocol — Upload
  Implements spec-sync-protocol cover upload scenarios: pending cover sync,
  batch upload with chunking, SHA-256 deduplication, per-item error handling,
  and post-upload goal/cache updates.

  @spec-sync-protocol @FR8
  Scenario: Pending cover is uploaded and goal is updated with server file_id
    Given a pending cover exists for goal "goal-1"
    And the goal "goal-1" has cover_file_id with local: prefix
    When cover sync runs
    Then goal "goal-1" cover_file_id is updated to the server file_id
    And goal "goal-1" is marked as needsSync

  @spec-sync-protocol @FR8
  Scenario: Pending cover is deleted after successful upload
    Given a pending cover "local-abc" exists
    When cover sync runs
    Then pending cover "local-abc" is removed from repository

  @spec-sync-protocol @FR8
  Scenario: Cover blob is saved to cover repository after upload
    Given a pending cover exists for goal "goal-1"
    When cover sync runs
    Then cover repository contains a record with server file_id

  @spec-sync-protocol @FR8
  Scenario: Cache entry is transferred from local_id to server file_id
    Given a pending cover "local-transfer" has a cached blob URL
    When cover sync runs
    Then local cover cache maps server file_id to the original blob URL
    And local cover cache no longer maps "local-transfer"

  @spec-sync-protocol @FR8
  Scenario: Duplicate cover detected by hash returns reused file_id
    Given a pending cover exists for goal "goal-1"
    And server will respond with reused true and existing file_id
    When cover sync runs
    Then goal "goal-1" cover_file_id is updated to the existing file_id

  @spec-sync-protocol @FR9
  Scenario: Covers are uploaded in chunks of MAX_COVER_BATCH_SIZE
    Given more pending covers than MAX_COVER_BATCH_SIZE exist
    When cover sync runs
    Then uploadCovers is called twice

  @spec-sync-protocol @FR9
  Scenario: Batch does not produce extra empty iteration on exact boundary
    Given exactly MAX_COVER_BATCH_SIZE pending covers exist
    When cover sync runs
    Then uploadCovers is called exactly once
    And no empty batch is processed

  @spec-sync-protocol @FR9
  Scenario: Per-item error does not block other items in same chunk
    Given two pending covers exist: "bad-id" and "ok-id"
    And server will respond with error for "bad-id" and success for "ok-id"
    When cover sync runs
    Then pending cover "ok-id" is removed from repository
    And pending cover "bad-id" is not removed from repository

  @spec-sync-protocol @FR9
  Scenario: Upload skips result with error flag even when file_id is present
    Given a pending cover "error-with-id" exists
    And server will respond with error flag true and file_id for "error-with-id"
    When cover sync runs
    Then pending cover "error-with-id" is not removed from repository
    And goal is not updated with the file_id

  @spec-sync-protocol @FR9
  Scenario: API failure stops processing remaining chunks
    Given more pending covers than MAX_COVER_BATCH_SIZE exist
    And server will reject the first uploadCovers call
    When cover sync runs
    Then uploadCovers is called only once

  @spec-sync-protocol @FR8
  Scenario: Goal is not updated when cover_file_id no longer matches local prefix
    Given a pending cover "changed-id" exists for goal "goal-1"
    And goal "goal-1" has a different cover_file_id
    When cover sync runs
    Then goal "goal-1" is not updated

  @spec-sync-protocol @FR8
  Scenario: Multiple goals sharing the same local cover are all updated
    Given two goals share the same local cover "shared-local"
    When cover sync runs
    Then both goals are updated with the server file_id
