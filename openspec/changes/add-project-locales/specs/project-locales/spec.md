# Capability: project-locales

Content rules for the twin GTD-terminology dialect locales `packages/client/src/locales/en-project.json` (base `en`) and `packages/client/src/locales/ru-project.json` (base `ru`): goal → project / «цель» → «проект», nothing else.

## ADDED Requirements

### Requirement: Locales contain only differing overrides (FR1)

`en-project.json` and `ru-project.json` SHALL contain only keys whose values differ from the corresponding base (`en.json` / `ru.json`) values. Keys with values identical to base SHALL be absent (covered by fallback). Every non-`_meta` key SHALL exist in the base file (no orphans).

#### Scenario: No redundant overrides
- **WHEN** every non-`_meta` key of each dialect file is compared with its base file
- **THEN** no key has a value identical to its base value

#### Scenario: No orphan keys
- **WHEN** `i18n-check` runs
- **THEN** no `override-orphans` errors are reported for `en-project.json` or `ru-project.json`

### Requirement: Override set is exactly the term-mentioning keys (FR2)

The override set of each dialect SHALL be exactly the base keys whose value matches the term regex — `/\bgoals?\b/i` for `en.json`, `/\bцел(ь|ью|и|ей|ям|ями|ях)\b/i` for `ru.json` — as enumerated by the normative inventories below. Placeholder names such as `{{goalName}}` do not match (word boundary) and SHALL NOT trigger an override by themselves.

#### Scenario: Inventory matches the derivation rule
- **WHEN** the term regex is applied to every value of the base file
- **THEN** the set of matching keys equals the key set of the normative inventory for that dialect

#### Scenario: Dialect file matches the inventory exactly
- **WHEN** each dialect file is flattened (excluding `_meta`)
- **THEN** its key set equals the normative inventory — no missing and no extra keys

### Requirement: Overrides substitute the term and nothing else (FR3)

Every override SHALL differ from its base value only by replacing goal → project / «цель» → «проект», including required grammatical adjustments in Russian (masculine gender agreement and plural forms «проект / проекта / проектов»). No override value SHALL match the term regex of its base language. No other wording, punctuation, or tone changes are allowed.

#### Scenario: No goal terminology survives in overrides
- **WHEN** the base-language term regex is applied to every override value
- **THEN** there are zero matches across both dialect files

#### Scenario: Russian gender agreement
- **WHEN** reading `goal.notFound`, `goal.empty`, `commandBar.placeholder.goal` in `ru-project.json`
- **THEN** the values are «Проект не найден», «Нет ни одного проекта», «Новый проект...»

### Requirement: Placeholder and plural parity with base (FR4)

Every overridden key SHALL preserve the interpolation placeholders (`{{count}}`, `{{goalName}}`, …) and the plural-suffix structure of its base key (`_one/_other` for en, `_one/_few/_many` for ru).

#### Scenario: Placeholders preserved
- **WHEN** placeholders of every override are compared with its base value
- **THEN** the placeholder multisets are identical

#### Scenario: Plural suffix structure preserved
- **WHEN** the plural-suffixed key groups of each dialect are compared with base
- **THEN** every overridden plural group contains exactly the base suffix set

### Requirement: Locale metadata (FR5)

`_meta` SHALL be exactly `{ code: "en-project", name: "English (project)", nativeName: "English (project)", baseLanguage: "en", emoji: "🇺🇸" }` for `en-project.json` and `{ code: "ru-project", name: "Russian (project)", nativeName: "Русский (проект)", baseLanguage: "ru", emoji: "🇷🇺" }` for `ru-project.json`.

#### Scenario: Metadata exactness
- **WHEN** reading `_meta` of both dialect files
- **THEN** every field equals the values above, and `code` matches the filename

### Requirement: Accessibility strings follow the same substitution (FR7)

Accessibility strings whose base value mentions the term (e.g. `goal.drag`, `goal.editName`) SHALL be overridden with the same terminology substitution. No no-theming zone applies: substitution is terminology-only and never degrades the functional meaning of an accessible name.

#### Scenario: Accessible names substituted
- **WHEN** reading `goal.drag` and `goal.editName` in both dialects
- **THEN** the values are "Drag project" / "Edit project" and «Перетащить проект» / «Редактировать проект»

### Requirement: Normative inventory — en-project (FR2, FR3)

`en-project.json` SHALL contain exactly the following 26 overrides.

| Key                                | Value                                                                                                                            |
|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| commandBar.placeholder.goal        | New project...                                                                                                                   |
| deleted.goals                      | Projects                                                                                                                         |
| deleted.purgeCountGoals_one        | {{count}} project                                                                                                                |
| deleted.purgeCountGoals_other      | {{count}} projects                                                                                                               |
| filter.focused_goals               | Focused Projects                                                                                                                 |
| filter.goals                       | Projects                                                                                                                         |
| focusGoalReplacementDialog.message | You already have 2 focused projects. Which one would you like to replace?                                                        |
| focusGoalReplacementDialog.title   | Replace focused project                                                                                                          |
| goal.deleteConfirmName             | Delete project?                                                                                                                  |
| goal.drag                          | Drag project                                                                                                                     |
| goal.editName                      | Edit project                                                                                                                     |
| goal.empty                         | No projects yet                                                                                                                  |
| goal.emptyActive                   | No active projects                                                                                                               |
| goal.emptyFinished                 | No finished projects                                                                                                             |
| goal.emptyPaused                   | No paused projects                                                                                                               |
| goal.namePlaceholder               | Project name                                                                                                                     |
| goal.notFound                      | Project not found                                                                                                                |
| goal.pageName                      | My Projects                                                                                                                      |
| onboarding.dialogBody              | Would you like to start with an onboarding project? We'll create a project with tasks to help you learn the app's core features. |
| onboarding.goalDescription         | Complete the tasks below to learn the core features of the app. After you're done, delete this project.                          |
| search.goals                       | Projects                                                                                                                         |
| search.placeholder                 | Tasks, projects and ideas...                                                                                                     |
| selector.goal                      | Project                                                                                                                          |
| selector.noGoal                    | No project                                                                                                                       |
| share.inviteMessage                | Try Clear Progress — an app for managing tasks, projects, and ideas!                                                             |
| task.selectGoal                    | Select project                                                                                                                   |

#### Scenario: en-project inventory exact match
- **WHEN** `en-project.json` is flattened (excluding `_meta`)
- **THEN** its key-value pairs equal this table exactly

### Requirement: Normative inventory — ru-project (FR2, FR3)

`ru-project.json` SHALL contain exactly the following 27 overrides.

| Key                                | Value                                                                                                                             |
|------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| commandBar.placeholder.goal        | Новый проект...                                                                                                                   |
| deleted.goals                      | Проекты                                                                                                                           |
| deleted.purgeCountGoals_one        | {{count}} проект                                                                                                                  |
| deleted.purgeCountGoals_few        | {{count}} проекта                                                                                                                 |
| deleted.purgeCountGoals_many       | {{count}} проектов                                                                                                                |
| filter.focused_goals               | Фокус на проектах                                                                                                                 |
| filter.goals                       | Проекты                                                                                                                           |
| focusGoalReplacementDialog.message | У вас уже 2 проекта в фокусе. Какой заменить?                                                                                     |
| focusGoalReplacementDialog.title   | Заменить проект в фокусе                                                                                                          |
| goal.deleteConfirmName             | Удалить проект?                                                                                                                   |
| goal.drag                          | Перетащить проект                                                                                                                 |
| goal.editName                      | Редактировать проект                                                                                                              |
| goal.empty                         | Нет ни одного проекта                                                                                                             |
| goal.emptyActive                   | Нет активных проектов                                                                                                             |
| goal.emptyFinished                 | Нет завершённых проектов                                                                                                          |
| goal.emptyPaused                   | Нет проектов на паузе                                                                                                             |
| goal.namePlaceholder               | Название проекта                                                                                                                  |
| goal.notFound                      | Проект не найден                                                                                                                  |
| goal.pageName                      | Мои проекты                                                                                                                       |
| onboarding.dialogBody              | Хотите начать с ознакомительного проекта? Мы создадим проект с задачами, которые помогут освоить основные возможности приложения. |
| onboarding.goalDescription         | Выполните задачи ниже, чтобы познакомиться с основными возможностями приложения. После ознакомления удалите этот проект.          |
| search.goals                       | Проекты                                                                                                                           |
| search.placeholder                 | Задачи, проекты и идеи...                                                                                                         |
| selector.goal                      | Проект                                                                                                                            |
| selector.noGoal                    | Без проекта                                                                                                                       |
| share.inviteMessage                | Попробуй Clear Progress — приложение для работы с задачами, проектами и идеями!                                                   |
| task.selectGoal                    | Выбрать проект                                                                                                                    |

#### Scenario: ru-project inventory exact match
- **WHEN** `ru-project.json` is flattened (excluding `_meta`)
- **THEN** its key-value pairs equal this table exactly

#### Scenario: Russian purge counts agree with numerals
- **WHEN** purge counts for 1, 2, 5, 21 deleted projects are rendered in `ru-project`
- **THEN** the forms are «1 проект», «2 проекта», «5 проектов», «21 проект»
