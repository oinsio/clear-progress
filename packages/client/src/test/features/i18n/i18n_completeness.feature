Feature: Translation completeness
  Implements FR11 of add-i18n-specs.

  @add-i18n-specs @FR11
  Scenario: All keys present in both base locales
    Given base locale files "ru" and "en" are loaded
    When comparing translation keys excluding "_meta"
    Then every key in "ru" exists in "en"
    And every key in "en" exists in "ru"
