Feature: Sync Protocol — Pull
  Implements spec-sync-protocol pull scenarios: incremental pull,
  full pull, revision tracking, and dirty flag protection.

  @spec-sync-protocol @FR2
  Scenario: Incremental pull sends since_revision from sync_meta
    Given last_known_revision is 5
    When pull is called
    Then PullRequest contains since_revision 5

  @spec-sync-protocol @FR2
  Scenario: Full pull with since_revision 0
    Given last_known_revision is 0
    When pull is called
    Then PullRequest contains since_revision 0

  @spec-sync-protocol @FR5
  Scenario: Pull updates last_known_revision from response
    Given last_known_revision is 5
    And server will respond to pull with current_revision 15
    When pull is called
    Then last_known_revision is set to 15

  @spec-sync-protocol @FR2
  Scenario: Pull applies server records to all repositories
    Given server will respond to pull with tasks and goals
    When pull is called
    Then applyServerRecords is called on task repository
    And applyServerRecords is called on goal repository

  @spec-sync-protocol @FR2
  Scenario: Pull applies server settings via bulkUpsert
    Given server will respond to pull with settings
    When pull is called
    Then settings are applied via bulkUpsert

  @spec-sync-protocol @FR13
  Scenario: Pull sends settings_updated_at from localStorage
    Given settings_updated_at in localStorage is "2026-06-01T10:00:00.000Z"
    When pull is called
    Then PullRequest contains settings_updated_at "2026-06-01T10:00:00.000Z"

  @spec-sync-protocol @FR13
  Scenario: Pull omits settings_updated_at when not set
    Given settings_updated_at is not set in localStorage
    When pull is called
    Then PullRequest does not contain settings_updated_at

  @spec-sync-protocol @FR5
  Scenario: Pull updates settings_updated_at to max from received settings
    Given settings_updated_at is not set in localStorage
    And server will respond to pull with settings having updated_at "2026-04-10T00:00:00.000Z" and "2026-04-17T00:00:00.000Z"
    When pull is called
    Then settings_updated_at in localStorage is "2026-04-17T00:00:00.000Z"

  @spec-sync-protocol @FR2
  Scenario: Pull throws on failed response
    Given server will respond to pull with ok false
    When pull is called
    Then pull throws "Pull failed"
