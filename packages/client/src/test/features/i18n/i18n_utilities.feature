Feature: Locale utility functions
  Implements FR7 of add-i18n-specs.

  @add-i18n-specs @FR7
  Scenario: getLocaleByCode with valid code
    When calling getLocaleByCode with "en"
    Then returned locale has name "English"

  @add-i18n-specs @FR7
  Scenario: getLocaleByCode with invalid code
    When calling getLocaleByCode with "xx"
    Then returned locale is undefined

  @add-i18n-specs @FR7
  Scenario: isValidLocaleCode returns correct results
    Then isValidLocaleCode "en" is true
    And isValidLocaleCode "xx" is false

  @add-i18n-specs @FR7
  Scenario: getBaseLanguageCodes returns unique codes
    When calling getBaseLanguageCodes
    Then returned codes contain "en" and "ru"
    And returned codes do not contain duplicates
