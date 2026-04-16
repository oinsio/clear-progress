# Temporal API Documentation Index

Документация по использованию Temporal API в проекте Clear Progress.

## Обзор

Проект использует **Temporal API** через `temporal-polyfill` для всех операций с датами и временем во frontend. Это устраняет класс багов, связанных со смешением UTC/local и отсутствием типа «только дата» в стандартном `Date`.

## Документы

### 📘 [Temporal Guide](./temporal-guide.md)
**Полное руководство по использованию Temporal API**

Содержит:
- Почему Temporal вместо Date
- Импорт и настройка
- Типы данных (Instant, PlainDate, branded types)
- Clock abstraction для тестируемости
- Типичные операции (текущее время, арифметика, сравнение)
- Границы сериализации (Dexie, API, localStorage)
- Форматирование для UI
- Что НЕ мигрировать (token expiry, backend)
- Примеры миграции

**Для кого:** разработчики, пишущие новый код или изучающие Temporal API

---

### ✅ [Temporal Migration Checklist](./temporal-migration-checklist.md)
**Чеклист для миграции существующего кода с Date на Temporal**

Содержит:
- Быстрая проверка: нужна ли миграция
- 10 паттернов миграции с примерами «было → стало»
- Список всех файлов для миграции (из TEMPORAL_MIGRATION_AUDIT.md)
- Шаги после миграции (тесты, типы, сборка)

**Для кого:** разработчики, мигрирующие существующий код

---

### ⚡ [Temporal Quick Reference](./temporal-quick-reference.md)
**Шпаргалка для ежедневной работы**

Содержит:
- Импорт
- Таблица типов
- Частые операции (одной строкой)
- Clock для тестируемости
- Что НЕ делать
- Форматирование для UI

**Для кого:** разработчики, которым нужен быстрый справочник

---

### 📊 [TEMPORAL_MIGRATION_AUDIT.md](../../TEMPORAL_MIGRATION_AUDIT.md)
**Полный аудит миграции проекта на Temporal API**

Содержит:
- Инвентаризация всех мест с `Date` (frontend production + тесты)
- Детальный анализ 6 критических багов
- Решения с Temporal для каждой проблемы
- Совместимость с экосистемой (Dexie, JSON, тесты)
- Стратегия миграции (4 шага)
- Итоговые метрики

**Для кого:** архитекторы, тех.лиды, разработчики, планирующие миграцию

---

## Быстрый старт

### Для новичков в Temporal

1. Прочитайте раздел "Зачем Temporal вместо Date" в [Temporal Guide](./temporal-guide.md)
2. Изучите раздел "Импорт" и "Типы данных"
3. Держите [Quick Reference](./temporal-quick-reference.md) под рукой

### Для миграции существующего кода

1. Откройте [Migration Checklist](./temporal-migration-checklist.md)
2. Найдите свой файл в списке "Файлы для миграции"
3. Используйте паттерны миграции для замены `Date` на `Temporal`
4. Запустите тесты

### Для написания нового кода

1. Импортируйте `Temporal` из `@/lib/temporal`
2. Используйте `Temporal.Now.instant().toString()` для timestamps
3. Используйте `Temporal.Now.plainDateISO().toString()` для date-only
4. Добавьте параметр `clock: Clock = systemClock` для тестируемости
5. Проверьте [Quick Reference](./temporal-quick-reference.md) при необходимости

## Ключевые правила

✅ **Всегда:**
- Импортировать из `@/lib/temporal`, не из `temporal-polyfill`
- Использовать `Temporal.Instant` для timestamps
- Использовать `Temporal.PlainDate` для date-only
- Вызывать `.toString()` перед сериализацией (Dexie, API, localStorage)
- Добавлять параметр `Clock` в функции с текущим временем

❌ **Никогда:**
- Не использовать `new Date()` в production (кроме token expiry)
- Не использовать `Date.now()` (кроме `ApiClient.ts` и `AuthProvider.tsx`)
- Не забывать `.toString()` при сохранении в БД/API
- Не использовать `vi.setSystemTime()` в тестах — только `fakeClock`

## Исключения

**Не мигрировать:**
- `Date.now()` в `ApiClient.ts` и `AuthProvider.tsx` (token expiry checks)
- Весь backend (GAS) — не поддерживает Temporal API
- Тесты backend'а

## Дополнительные ресурсы

- [Temporal API Proposal (TC39)](https://tc39.es/proposal-temporal/docs/)
- [temporal-polyfill на npm](https://www.npmjs.com/package/temporal-polyfill)
- [CLAUDE.md](../../CLAUDE.md) — основная документация проекта (раздел "Temporal API Usage")

## Статус миграции

По состоянию на 16 апреля 2026:

- ✅ Документация обновлена
- ⏳ Миграция production-кода: **не начата**
- ⏳ Миграция тестов: **не начата**
- ⏳ Миграция фабрик: **не начата**

**Всего для миграции:**
- ~40 мест в production-коде (~15 файлов)
- ~63 вхождения в тестах (11 файлов)
- 6 фабрик

**Критические файлы с багами (приоритет 1):**
- `src/utils/repeatRule.ts`
- `src/services/HiddenTaskService.ts`
- `src/shared/lib/utils.ts`

См. [Migration Checklist](./temporal-migration-checklist.md) для полного списка.
