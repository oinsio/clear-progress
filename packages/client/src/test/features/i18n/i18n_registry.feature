Feature: Locale registry
  Implements FR7, FR8, FR9 of add-i18n-specs.

  @add-i18n-specs @FR7
  Scenario: Valid locale files are registered with correct metadata
    When locale registry is loaded
    Then locale "en" has name "English" and emoji "🇺🇸"
    And locale "ru" has name "Russian" and emoji "🇷🇺"
    And locale "house" has name "Dr. House" and emoji "🏥"
    And locale "startrek" has name "Star Trek" and emoji "🖖"

  @add-i18n-specs @FR7
  Scenario: Locales sorted by English name
    When locale registry is loaded
    Then locales are ordered as "Dr. House", "English", "Russian", "Star Trek"

  @add-i18n-specs @FR8 @FR9
  Scenario: Only valid locales are registered
    When locale registry is loaded
    Then exactly 4 locales are registered
    And every locale has complete metadata
