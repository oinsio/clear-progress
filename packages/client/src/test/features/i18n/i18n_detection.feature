Feature: Language detection
  Implements FR1, FR2 of add-i18n-specs.

  @add-i18n-specs @FR1
  Scenario: Browser language matches supported locale
    Given no language is stored in localStorage
    And browser language is "en"
    When system initializes language
    Then selected language is "en"

  @add-i18n-specs @FR2
  Scenario: Browser language not supported falls back to default
    Given no language is stored in localStorage
    And browser language is "fr"
    When system initializes language
    Then selected language is "en"

  @add-i18n-specs @FR1
  Scenario: Browser sends multiple languages with first unsupported
    Given no language is stored in localStorage
    And browser languages are "fr,en,de"
    When system initializes language
    Then selected language is "en"

  @add-i18n-specs @FR1
  Scenario: Browser language with region code
    Given no language is stored in localStorage
    And browser language is "en-US"
    When system initializes language
    Then selected language is "en"
