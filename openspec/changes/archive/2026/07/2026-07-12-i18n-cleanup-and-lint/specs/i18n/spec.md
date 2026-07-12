## MODIFIED Requirements

### Requirement: Translation files are complete

Every translation key present in any locale file MUST exist in all other locale files (excluding `_meta`). Nested keys are compared structurally. Additionally, every key referenced by production code via `t()` or `messageKey` MUST exist in all locale files.

#### Scenario: All keys present in both locales
- **GIVEN** ru.json has keys "nav.inbox", "nav.goals"
- **AND** en.json has keys "nav.inbox", "nav.goals"
- **THEN** translation completeness check passes

#### Scenario: Key missing in one locale
- **GIVEN** ru.json has key "nav.inbox"
- **AND** en.json does not have key "nav.inbox"
- **THEN** translation completeness check fails listing "nav.inbox" as missing in en

#### Scenario: Self-healing alert keys exist in all locales
- **WHEN** `healingRules.ts` references `sync.alert.repeat_rule_reset`, `sync.alert.name_set_untitled`, `sync.alert.checklist_item_deleted`
- **THEN** all three keys SHALL exist in `en.json` and `ru.json`
- **AND** each key SHALL contain a human-readable message describing what the self-healing action did

#### Scenario: No unused keys remain in locale files
- **WHEN** running `i18n:check`
- **THEN** zero `unused` errors SHALL be reported
- **AND** zero `override-orphans` errors SHALL be reported for `house.json`
