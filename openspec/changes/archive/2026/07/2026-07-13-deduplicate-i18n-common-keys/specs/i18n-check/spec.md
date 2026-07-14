## MODIFIED Requirements

### Requirement: Report duplicate values (FR5)

The system SHALL always report groups of keys that have identical values in both `en.json` and `ru.json` as candidates for deduplication, UNLESS all keys in the group are covered by a duplicate-whitelist entry. This report is printed on every run (informational, does not cause a non-zero exit code).

Groups where every key matches a duplicate-whitelist pattern SHALL be suppressed from the output.

#### Scenario: Keys with same value in both locales are grouped
- **WHEN** `en.json` has `"task.cancel": "Cancel"` and `"goal.cancel": "Cancel"`, and `ru.json` has both as `"Отмена"`
- **AND** neither key is in the duplicate whitelist
- **THEN** a duplicate group `["task.cancel", "goal.cancel"]` is reported

#### Scenario: Keys with same en value but different ru values are not grouped
- **WHEN** `en.json` has `"repeat.month4": "April"` and `"repeat.monthGenitive4": "April"`, but `ru.json` has `"апрель"` and `"апреля"`
- **THEN** no duplicate group is reported for these keys

#### Scenario: Whitelisted duplicate group is suppressed
- **WHEN** `en.json` has `"box.inbox": "Inbox"` and `"filter.inbox": "Inbox"` with identical RU values
- **AND** both keys match a duplicate-whitelist pattern
- **THEN** no duplicate group is reported for these keys

## ADDED Requirements

### Requirement: Duplicate whitelist for intentional duplicates

The system SHALL support a duplicate-value whitelist — a set of key patterns that are expected to have duplicate values across namespaces. The whitelist SHALL be defined in `whitelist.ts` alongside the existing unused-key whitelist.

Whitelisted categories:
1. **Domain navigation terms**: keys across `box`, `section`, `filter`, `search`, `deleted`, `task`, `repeat`, `goalFilter`, `idea.pageName`, `memo.pageName`, `settings.sections` that share values for the same domain concept
2. **Semantic pairs**: keys with different UI roles (display label vs ariaLabel, indicator vs legend, button label vs type label) that happen to share the same text

#### Scenario: Domain term duplicate is whitelisted
- **WHEN** `box.inbox` and `filter.inbox` both have value "Inbox"/"Входящие"
- **THEN** both keys match a duplicate-whitelist pattern and the group is suppressed

#### Scenario: Semantic pair duplicate is whitelisted
- **WHEN** `settings.name` and `settings.settingsAriaLabel` both have value "Settings"/"Настройки"
- **THEN** both keys match a duplicate-whitelist pattern and the group is suppressed

#### Scenario: Non-whitelisted duplicate is still reported
- **WHEN** two keys have identical values but are not in the duplicate whitelist
- **THEN** the duplicate group is reported as before

### Requirement: Duplicate whitelist self-validation

The system SHALL verify that every duplicate-whitelist pattern matches at least one existing key in `en.json`. A pattern that matches zero keys SHALL be reported as an error, consistent with the existing unused-key whitelist validation (FR8).

#### Scenario: Stale duplicate-whitelist pattern triggers error
- **WHEN** a duplicate-whitelist pattern matches zero keys in `en.json`
- **THEN** an error is reported indicating the whitelist entry is stale
