Feature: Attachment repository CRUD
  Implements FR5 of add-file-attachments.

  @add-file-attachments @FR5
  Scenario: Save and retrieve attachment
    Given a valid attachment exists in memory
    When the attachment is saved to the repository
    Then getAll returns the saved attachment

  @add-file-attachments @FR5
  Scenario: Get attachments by entity type and id
    Given two attachments for entity type "task" and entity id "entity-1" exist
    And one deleted attachment for entity type "task" and entity id "entity-1" exists
    And one attachment for a different entity exists
    When getByEntityTypeAndId is called with "task" and "entity-1"
    Then only the two non-deleted attachments are returned

  @add-file-attachments @FR5
  Scenario: Get all attachments by entity type and id includes deleted
    Given two attachments for entity type "goal" and entity id "entity-2" exist
    And one deleted attachment for entity type "goal" and entity id "entity-2" exists
    When getAllByEntityTypeAndId is called with "goal" and "entity-2"
    Then all three attachments are returned

  @add-file-attachments @FR5
  Scenario: Get attachments by hash
    Given two attachments with data_hash "abc123" exist
    And one attachment with a different data_hash exists
    When getByHash is called with "abc123"
    Then two attachments with matching hash are returned

  @add-file-attachments @FR5
  Scenario: Soft delete attachment
    Given a saved attachment with known id exists
    When delete is called with that id
    Then the attachment has is_deleted true
    And the attachment has syncStatus "pending"

  @add-file-attachments @FR5
  Scenario: Delete non-existent attachment is no-op
    When delete is called with a non-existent id
    Then no error is thrown

  @add-file-attachments @FR5
  Scenario: Save rejects invalid attachment
    When save is called with invalid attachment data
    Then an error containing "Invalid attachment data" is thrown

  @add-file-attachments @FR5
  Scenario: Get by entity type and id returns sorted by sort_order
    Given attachments with sort_order 2, 0, 1 exist for the same entity
    When getByEntityTypeAndId is called for that entity
    Then attachments are returned in sort_order 0, 1, 2
