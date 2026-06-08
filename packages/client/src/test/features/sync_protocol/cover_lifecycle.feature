Feature: Cover Sync Protocol — Lifecycle
  Implements spec-sync-protocol cover lifecycle scenarios: download, delete,
  local cover initialization, full sync reupload with dedup, and
  ensureServerFilesAreCached.

  @spec-sync-protocol @FR10
  Scenario: Successful cover download from server
    Given a cover with hash "remote-abc" is not in local cache or repository
    And server has cover data for "remote-abc"
    When cacheFromServer is called for "remote-abc"
    Then cover is saved to cover repository with data_hash "remote-abc"
    And cover is added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Missing cover on server does not populate cache
    Given a cover with hash "missing-id" is not in local cache or repository
    And server returns FILE_NOT_FOUND for "missing-id"
    When cacheFromServer is called for "missing-id"
    Then cover is not saved to cover repository
    And cover is not added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Download skips when result has error flag despite having hash
    Given a cover with hash "error-but-id" is not in local cache or repository
    And server returns error flag true with hash for "error-but-id"
    When cacheFromServer is called for "error-but-id"
    Then cover is not saved to cover repository
    And cover is not added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Download uses fallback MIME type when server omits mime_type
    Given a cover with hash "no-mime" is not in local cache or repository
    And server returns cover data without mime_type for "no-mime"
    When cacheFromServer is called for "no-mime"
    Then cover is saved with fallback MIME type
    And cover is added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Batch download fetches covers in chunks
    Given more uncached hashes than MAX_FILE_BATCH_SIZE exist
    When batchCacheFromServer is called
    Then getCover API is called twice

  @spec-sync-protocol @FR10
  Scenario: Batch download continues after one chunk fails
    Given more uncached hashes than MAX_FILE_BATCH_SIZE exist
    And server will fail on the first getCover chunk
    When batchCacheFromServer is called
    Then getCover API is called twice

  @spec-sync-protocol @FR10
  Scenario: ensureFileCached skips when already in cache
    Given cover "cached-id" is already in local cover cache
    When ensureFileCached is called for "cached-id"
    Then cover repository is not queried

  @spec-sync-protocol @FR10
  Scenario: ensureFileCached loads from IndexedDB without server call
    Given cover "db-id" exists in cover repository with blob data
    When ensureFileCached is called for "db-id"
    Then getCover API is not called
    And cover "db-id" is added to local cover cache

  @spec-sync-protocol @FR10
  Scenario: Concurrent ensureFileCached calls make only one server request
    Given cover "concurrent-id" is not cached or in repository
    And server has cover data for "concurrent-id"
    When ensureFileCached is called three times concurrently for "concurrent-id"
    Then getCover API is called exactly once

  @spec-sync-protocol @FR11
  Scenario: Initialization skips covers without blob data
    Given cover repository has a cover without blob data for "no-blob-file"
    When initializeLocalFiles is called
    Then cover "no-blob-file" is not added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Local cover initialization loads confirmed covers into cache
    Given cover repository has a cover with blob data for "init-file"
    When initializeLocalFiles is called
    Then cover "init-file" is added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Local cover initialization loads pending covers into cache
    Given pending cover repository has a cover with data_hash "init-pending"
    When initializeLocalFiles is called
    Then cover "init-pending" is added to local cover cache

  @spec-sync-protocol @FR11
  Scenario: Initialization does not overwrite existing cache entries
    Given cover "already-cached" is already in local cover cache
    And pending cover repository has a cover with data_hash "already-cached"
    When initializeLocalFiles is called
    Then cover "already-cached" retains its original cache URL

  @spec-sync-protocol @FR11 @FR8
  Scenario: Full sync reupload with dedup does not update goal
    Given a goal has server cover "server-file-1" with local blob
    And server will respond with reused true for "server-file-1"
    When reuploadLocalFiles is called
    Then goal is not updated

  @spec-sync-protocol @FR11 @FR8
  Scenario: Full sync reupload saves CoverRecord when server confirms upload
    Given a goal has server cover "server-hash-1" with local blob
    And server will respond with reused false for "server-hash-1"
    When reuploadLocalFiles is called
    Then cover repository saves a record with data_hash "server-hash-1"

  @spec-sync-protocol @FR11
  Scenario: Full sync ensureServerFilesAreCached downloads missing covers
    Given a goal references cover "missing-server-file" not in cache or repository
    And server has cover data for "missing-server-file"
    When fullSync is called
    Then cover "missing-server-file" is added to local cover cache
