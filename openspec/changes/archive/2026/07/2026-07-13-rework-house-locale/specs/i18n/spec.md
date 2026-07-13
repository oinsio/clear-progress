# Capability: i18n (delta)

## ADDED Requirements

### Requirement: Dialect locales inherit base language plural rules

Dialect locales (where `_meta.baseLanguage` differs from the locale code) SHALL select CLDR plural forms using the plural rules of their base language. Dialect codes are not valid BCP 47 languages, so `Intl.PluralRules` would otherwise degrade them to root rules where every count maps to `other`, making plural overrides in dialect files unreachable. The rule applies both to keys overridden in the dialect file and to keys resolved via fallback. # implements FR10 of rework-house-locale

#### Scenario: Dialect plural override uses base language forms
- **WHEN** translating a key overridden in "house" (baseLanguage "ru") with count 21
- **THEN** the `_one` form of the house override is used (e.g. «21 пациент»)

#### Scenario: Dialect fallback keys keep base language plural forms
- **WHEN** translating a key absent from "house" (e.g. `repeat.intervalDays`) with count 3 in locale "house"
- **THEN** the Russian `_few` form is used («Интервал: 3 дня»)

#### Scenario: Base locales are unaffected
- **WHEN** translating a plural key in locale "ru" or "en"
- **THEN** plural forms are selected by that locale's own rules
