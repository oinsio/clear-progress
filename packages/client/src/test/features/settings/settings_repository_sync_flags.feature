Feature: Settings repository sync flags
  Implements FR2 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR2
  Scenario: Get settings needing sync
    Given two settings have needsSync true and one has needsSync false
    When getNeedingSync is called
    Then only the two settings with needsSync true are returned

  @settings-specs-and-bdd @FR2
  Scenario: Clear sync flag by keys
    Given settings "accent_color" and "default_box" have needsSync true
    When clearNeedsSyncByKey is called with keys ["accent_color"]
    Then "accent_color" has needsSync false
    And "default_box" still has needsSync true

  @settings-specs-and-bdd @FR2
  Scenario: Filter settings by updated_at
    Given setting A has updated_at "2025-01-01T00:00:00.000Z"
    And setting B has updated_at "2025-01-02T00:00:00.000Z"
    When getChangedSince is called with "2025-01-01T00:00:00.000Z"
    Then only setting B is returned
