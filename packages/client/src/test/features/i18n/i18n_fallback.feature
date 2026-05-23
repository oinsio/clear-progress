Feature: Fallback chain
  Implements FR10 of add-i18n-specs.

  @add-i18n-specs @FR10
  Scenario: Dialect locale falls back to base language then default
    Given locale "house" has baseLanguage "ru"
    When resolving fallback chain for "house"
    Then fallback chain is "ru" then "en"

  @add-i18n-specs @FR10
  Scenario: Base language falls back to default only
    Given locale "en" has baseLanguage "en"
    When resolving fallback chain for "en"
    Then fallback chain is "en" only
