Feature: Attachment repository sync
  Implements FR5 of add-file-attachments.

  @add-file-attachments @FR5
  Scenario: Bulk upsert saves multiple attachments
    Given three valid attachments exist in memory
    When bulkUpsert is called with all three
    Then getAll returns all three attachments

  @add-file-attachments @FR5
  Scenario: Get attachments needing sync
    Given two attachments with syncStatus "pending" exist
    And one attachment with syncStatus "synced" exists
    When getNeedingSync is called
    Then only the two dirty attachments are returned

  @add-file-attachments @FR5
  Scenario: Apply server records
    Given no attachments exist locally
    When applyServerRecords is called with two server records
    Then both records are stored with syncStatus "synced"

  @add-file-attachments @FR5
  Scenario: Apply server records skips local dirty records
    Given a local attachment with syncStatus "pending" exists
    When applyServerRecords is called with a record having the same id
    Then the local attachment is not overwritten
