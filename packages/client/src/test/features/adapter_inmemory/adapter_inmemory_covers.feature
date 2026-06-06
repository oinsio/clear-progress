Feature: In-memory adapter covers
  Implements FR7, FR8, FR9, FR10 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR7
  Scenario: New cover upload
    Given an initialized adapter
    When a cover is uploaded with data_hash "abc123"
    Then the upload response has ok true, data_hash "abc123", and reused false

  @adapter-inmemory-spec @FR7
  Scenario: Duplicate cover is reused
    Given an initialized adapter
    And a cover with data_hash "abc123" already exists
    When a cover is uploaded with data_hash "abc123"
    Then the upload response has reused true

  @adapter-inmemory-spec @FR8
  Scenario: Batch within limit succeeds
    Given an initialized adapter
    When a batch of 2 covers with valid mime types is uploaded
    Then the batch response has ok true and 2 results

  @adapter-inmemory-spec @FR8
  Scenario: Batch exceeding limit is rejected
    Given an initialized adapter
    When a batch of 11 covers is uploaded
    Then the batch response has ok false

  @adapter-inmemory-spec @FR8
  Scenario: Invalid mime type returns per-item error
    Given an initialized adapter
    When a batch with one valid cover and one cover with mime_type "application/zip" is uploaded
    Then the valid cover result has data_hash and the invalid cover result has error

  @adapter-inmemory-spec @FR9
  Scenario: Get existing cover
    Given an initialized adapter
    And a cover with data_hash "abc123" already exists
    When getCover is called with hash "abc123"
    Then the cover response contains mime_type and data

  @adapter-inmemory-spec @FR9
  Scenario: Get missing cover returns error
    Given an initialized adapter
    When getCover is called with hash "nonexistent"
    Then the cover result has an error field

  @adapter-inmemory-spec @FR10
  Scenario: Delete shared cover decrements ref_count
    Given an initialized adapter
    And a cover with data_hash "shared" has ref_count 2
    When deleteCover is called with hash "shared"
    Then the delete response has deleted false and ref_count 1

  @adapter-inmemory-spec @FR10
  Scenario: Delete last reference removes cover
    Given an initialized adapter
    And a cover with data_hash "single" has ref_count 1
    When deleteCover is called with hash "single"
    Then the delete response has deleted true and ref_count 0

  @adapter-inmemory-spec @FR10
  Scenario: Delete non-existent cover
    Given an initialized adapter
    When deleteCover is called with hash "nonexistent"
    Then the delete response has ok true, deleted true, and ref_count 0
