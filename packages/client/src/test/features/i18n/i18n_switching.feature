Feature: Language switching
  Implements FR3, FR4 of add-i18n-specs.

  @add-i18n-specs @FR3
  Scenario: Switch language updates i18next
    Given current language is "ru"
    When user switches language to "en"
    Then i18n.changeLanguage is called with "en"

  @add-i18n-specs @FR4
  Scenario: Switch language persists to localStorage
    Given current language is "ru"
    When user switches language to "en"
    Then localStorage contains "en" under language key
