# Project Documentation

Внутренняя документация проекта Clear Progress для разработчиков и AI-ассистентов.

## Содержание

### 📋 [TDD Workflow](./tdd-workflow.md)
Строгий цикл Red-Green-Refactor для всех изменений в application и business logic коде.

**Когда применять:** при написании/изменении сервисов, хуков, утилит, компонентов.

**Когда НЕ применять:** установка инструментов, конфиги, документация, чистый рефакторинг без изменения поведения.

---

### 🎨 [UI Components Guide](./ui-components.md)
Документация custom UI-компонентов: `LinkedText`, `EditableDescription`.

**Когда использовать:** при работе с полями описания, отображении текста с URL.

---

### 📅 Temporal API Documentation

Полная документация по работе с датами и временем через Temporal API.

#### [Temporal Index](./temporal-index.md) — начните здесь
Обзор всей документации по Temporal с рекомендациями для разных сценариев.

#### [Temporal Guide](./temporal-guide.md) — полное руководство
Детальное руководство: типы, операции, Clock abstraction, сериализация, миграция.

#### [Temporal Migration Checklist](./temporal-migration-checklist.md) — для миграции
Чеклист и паттерны для миграции существующего кода с `Date` на `Temporal`.

#### [Temporal Quick Reference](./temporal-quick-reference.md) — шпаргалка
Быстрый справочник для ежедневной работы: импорт, типы, частые операции.

---

### 🏗️ Архитектурные решения

#### [Recurring Tasks Skip Logic](./architecture/recurring-tasks-skip-logic.md)
Логика пропуска пропущенных повторяющихся задач при длительной неактивности.

#### [Recurring Tasks Timezone Policy](./architecture/recurring-tasks-timezone-policy.md)
Политика использования часовых поясов для повторяющихся задач.

#### [Date Sanitization](./architecture/date-sanitization.md)
Двухуровневая санитизация дат при передаче из Google Sheets (Date объекты) в Temporal API (date-only строки).

**Когда читать:** при работе с date-only полями (`next_date`, `appear_date`), при добавлении новых date-only полей, при изменении backend pull/push логики.

---

## Для AI-ассистентов

При работе с проектом:

1. **Всегда** читайте [CLAUDE.md](../../CLAUDE.md) перед началом работы
2. Следуйте [TDD Workflow](./tdd-workflow.md) для application/business logic кода
3. Используйте [Temporal Quick Reference](./temporal-quick-reference.md) при работе с датами
4. Проверяйте [code-style.md](../rules/code-style.md) и [naming.md](../rules/naming.md) перед написанием кода

## Для разработчиков

### Быстрый старт

1. Прочитайте [CLAUDE.md](../../CLAUDE.md) — основная документация проекта
2. Изучите [TDD Workflow](./tdd-workflow.md) — обязательный процесс разработки
3. Ознакомьтесь с [Temporal Index](./temporal-index.md) — работа с датами и временем

### Структура документации

```
.claude/
├── docs/
│   ├── README.md                          # этот файл
│   ├── tdd-workflow.md                    # Red-Green-Refactor цикл
│   ├── temporal-index.md                  # обзор Temporal документации
│   ├── temporal-guide.md                  # полное руководство по Temporal
│   ├── temporal-migration-checklist.md    # чеклист миграции на Temporal
│   ├── temporal-quick-reference.md        # шпаргалка по Temporal
│   └── architecture/
│       ├── recurring-tasks-skip-logic.md  # логика пропуска повторяющихся задач
│       ├── recurring-tasks-timezone-policy.md # политика часовых поясов
│       └── date-sanitization.md           # санитизация дат Google Sheets → Temporal
└── rules/
    ├── code-style.md                      # правила стиля кода
    └── naming.md                          # правила именования
```

## Обновление документации

При внесении изменений в проект:

- Обновляйте [CLAUDE.md](../../CLAUDE.md) при изменении архитектуры, стека, процессов
- Обновляйте [TDD Workflow](./tdd-workflow.md) при изменении процесса тестирования
- Обновляйте Temporal документацию при изменении подхода к работе с датами
- Обновляйте [code-style.md](../rules/code-style.md) и [naming.md](../rules/naming.md) при появлении новых правил

---

*Последнее обновление: 16 апреля 2026*
