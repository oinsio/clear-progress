Feature: In-memory adapter settings
  Implements FR6 of adapter-inmemory-spec.

  @adapter-inmemory-spec @FR6
  Scenario: New setting is created
    Given an initialized adapter
    When a setting with key "accent_color" and value "blue" is pushed
    Then the setting result has status "created"
    And the setting is returned in pull

  @adapter-inmemory-spec @FR6
  Scenario: Setting conflict when server is newer
    Given an initialized adapter
    And a setting "theme" exists with updated_at "2026-01-02T00:00:00.000Z"
    When the setting "theme" is updated with updated_at "2026-01-01T00:00:00.000Z"
    Then the setting result has status "conflict" with server_record

  @adapter-inmemory-spec @FR6
  Scenario: Settings filtered by updated_at
    Given an initialized adapter
    And a setting "key1" exists with updated_at "2026-01-01T00:00:00.000Z"
    And a setting "key2" exists with updated_at "2026-01-02T00:00:00.000Z"
    When pull is called with settings_updated_at "2026-01-01T12:00:00.000Z"
    Then only the setting "key2" is returned
