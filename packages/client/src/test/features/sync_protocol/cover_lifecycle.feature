Feature: Cover Sync Protocol — Lifecycle
  Implements spec-sync-protocol cover lifecycle scenarios: download, delete,
  local cover initialization, full sync reupload with dedup, and
  ensureServerCoversAreCached.

  @spec-sync-protocol @FR10
  Scenario: Successful cover download from server
    Given a cover with file_id "remote-abc" is not in local cache or repository
    And server has cover data for "remote-abc"
    When cacheFromServer is called for "remote-abc"
    Then cover is saved to cover repository with file_id "remote-abc"
    And cover is added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Missing cover on server does not populate cache
    Given a cover with file_id "missing-id" is not in local cache or repository
    And server returns FILE_NOT_FOUND for "missing-id"
    When cacheFromServer is called for "missing-id"
    Then cover is not saved to cover repository
    And cover is not added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Batch download fetches covers in chunks
    Given more uncached file IDs than MAX_COVER_BATCH_SIZE exist
    When batchCacheFromServer is called
    Then getCover API is called twice

  @spec-sync-protocol @FR10
  Scenario: Batch download continues after one chunk fails
    Given more uncached file IDs than MAX_COVER_BATCH_SIZE exist
    And server will fail on the first getCover chunk
    When batchCacheFromServer is called
    Then getCover API is called twice

  @spec-sync-protocol @FR10
  Scenario: ensureCoverCached skips when already in cache
    Given cover "cached-id" is already in local cover cache
    When ensureCoverCached is called for "cached-id"
    Then cover repository is not queried

  @spec-sync-protocol @FR10
  Scenario: ensureCoverCached loads from IndexedDB without server call
    Given cover "db-id" exists in cover repository with blob data
    When ensureCoverCached is called for "db-id"
    Then getCover API is not called
    And cover "db-id" is added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Concurrent ensureCoverCached calls make only one server request
    Given cover "concurrent-id" is not cached or in repository
    And server has cover data for "concurrent-id"
    When ensureCoverCached is called three times concurrently for "concurrent-id"
    Then getCover API is called exactly once

  @spec-sync-protocol @FR11
  Scenario: Local cover initialization loads confirmed covers into cache
    Given cover repository has a cover with blob data for "init-file"
    When initializeLocalCovers is called
    Then cover "init-file" is added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Local cover initialization loads pending covers into cache
    Given pending cover repository has a cover with local_id "init-pending"
    When initializeLocalCovers is called
    Then cover "init-pending" is added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Initialization does not overwrite existing cache entries
    Given cover "already-cached" is already in local cover cache
    And pending cover repository has a cover with local_id "already-cached"
    When initializeLocalCovers is called
    Then cover "already-cached" retains its original cache URL

  @spec-sync-protocol @FR11 @FR8
  Scenario: Full sync reupload with dedup returns same file_id
    Given a goal has server cover "server-file-1" with local blob
    And server will respond with reused true for "server-file-1"
    When reuploadLocalCovers is called
    Then goal is not updated because file_id did not change

  @spec-sync-protocol @FR11 @FR8
  Scenario: Full sync reupload updates goal when server returns different file_id
    Given a goal has server cover "old-file" with local blob
    And server will respond with new file_id "new-file"
    When reuploadLocalCovers is called
    Then goal cover_file_id is updated to "new-file"
    And goal version is incremented
    And goal is marked as needsSync

  @spec-sync-protocol @FR11
  Scenario: Full sync ensureServerCoversAreCached downloads missing covers
    Given a goal references cover "missing-server-file" not in cache or repository
    And server has cover data for "missing-server-file"
    When fullSync is called
    Then cover "missing-server-file" is added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Full sync skips covers with local: prefix
    Given a goal references cover with local: prefix
    When ensureServerCoversAreCached is called
    Then getCover API is not called
