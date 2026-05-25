Feature: Google Sheets CRUD operations
  Implements FR10 of gas-adapter-specs-and-bdd.

  @gas-adapter-specs-and-bdd @FR10
  Scenario: getAllRecords returns mapped rows
    Given sheet has header row and two data rows
    When reading all records with a row mapper
    Then two mapped records are returned

  @gas-adapter-specs-and-bdd @FR10
  Scenario: getAllRecords returns empty array for empty sheet
    Given sheet has only header row
    When reading all records with a row mapper
    Then no records are returned

  @gas-adapter-specs-and-bdd @FR10
  Scenario: getAllRecords skips rows with empty id
    Given sheet has header row and one row with empty id
    When reading all records with a row mapper
    Then no records are returned

  @gas-adapter-specs-and-bdd @FR10
  Scenario: upsertRecord inserts new record
    Given sheet has only header row
    When upserting a new record
    Then appendRow is called with the record data

  @gas-adapter-specs-and-bdd @FR10
  Scenario: upsertRecord updates existing record
    Given sheet has header row and existing record with id "abc-123"
    When upserting record with id "abc-123"
    Then setValues is called to update the existing row

  @gas-adapter-specs-and-bdd @FR10
  Scenario: upsertRecords handles batch with mix of inserts and updates
    Given sheet has header row and existing record with id "existing-1"
    When upserting batch with "existing-1" and "new-1"
    Then setValues is called for the existing record
    And appendRow is called for the new record

  @gas-adapter-specs-and-bdd @FR10
  Scenario: upsertRecords with empty array does nothing
    When upserting an empty batch of records
    Then no sheet operations are performed

  @gas-adapter-specs-and-bdd @FR10
  Scenario: deleteRecordsByIds removes existing rows
    Given sheet has header row and records with ids "r1" and "r2"
    When deleting records by ids "r1" and "r2"
    Then deleteRow is called twice

  @gas-adapter-specs-and-bdd @FR10
  Scenario: deleteRecordsByIds returns zero for non-existing ids
    Given sheet has header row and existing record with id "abc-123"
    When deleting records by ids "nonexistent"
    Then delete count is zero

  @gas-adapter-specs-and-bdd @FR10
  Scenario: deleteRecordsByIds removes rows from bottom to top
    Given sheet has header row and records with ids "r1" and "r2"
    When deleting records by ids "r1" and "r2"
    Then rows are deleted in bottom-to-top order
