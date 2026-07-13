# Capability: deleted-entities (delta)

## ADDED Requirements

### Requirement: Purge confirmation shows grammatically agreed counts

The purge confirmation dialog SHALL display per-entity counts with entity names grammatically agreed to the number in the active locale. Each entity count SHALL use a dedicated plural i18n key (`deleted.purgeCountTasks`, `deleted.purgeCountGoals`, `deleted.purgeCountContexts`, `deleted.purgeCountCategories`, `deleted.purgeCountChecklistItems`, `deleted.purgeCountIdeas`) with CLDR plural forms (`_one`/`_few`/`_many` for ru-based locales, `_one`/`_other` for en). The dialog SHALL compose the six rendered counts into a comma-separated list interpolated into `deleted.purgeConfirmCount` as `{{items}}`. # implements FR9 of rework-house-locale

#### Scenario: Russian counts agree with numbers
- **WHEN** the purge dialog renders in locale "ru" with 1 task, 2 goals, and 5 ideas
- **THEN** the message contains «1 задача», «2 цели», and «5 идей»

#### Scenario: House locale counts agree with numbers
- **WHEN** the purge dialog renders in locale "house" with 1 idea and 21 tasks
- **THEN** the message contains «1 озарение» and «21 пациент»

#### Scenario: Zero counts use the many form in Russian
- **WHEN** the purge dialog renders in locale "ru" with 0 contexts
- **THEN** the message contains «0 контекстов»

#### Scenario: English counts agree with numbers
- **WHEN** the purge dialog renders in locale "en" with 1 task and 2 goals
- **THEN** the message contains "1 task" and "2 goals"
