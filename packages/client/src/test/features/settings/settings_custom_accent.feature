Feature: Custom accent color persistence
  Implements FR1, FR5 of settings-specs-and-bdd.

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Save custom accent colors
    When setCustomAccentColors is called with light "#ff0000" and dark "#00ff00"
    Then the repository contains "custom_accent_light" set to "#ff0000" with needsSync true
    And the repository contains "custom_accent_dark" set to "#00ff00" with needsSync true
    And localStorage cache has "custom_accent_light" as "#ff0000" and "custom_accent_dark" as "#00ff00"

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Custom colors loaded from IndexedDB on init
    Given accent color setting is "custom"
    And IndexedDB has "custom_accent_light" as "#abc123" and "custom_accent_dark" as "#def456"
    When the accent color provider initializes
    Then custom colors "#abc123" and "#def456" are applied
    And localStorage cache is updated with "#abc123" and "#def456"

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Default custom colors when not stored
    Given accent color setting is "custom"
    And no custom color settings exist in IndexedDB or localStorage
    When the accent color provider initializes
    Then custom colors "#fcd34d" and "#14b8a6" are applied as defaults

  @settings-specs-and-bdd @FR1 @FR5
  Scenario: Custom colors only applied when accent is custom
    Given accent color setting is "blue"
    When setCustomAccentColors is called with light "#ff0000" and dark "#00ff00"
    Then the hex values are persisted in the repository
    But the custom colors are not applied to the DOM
