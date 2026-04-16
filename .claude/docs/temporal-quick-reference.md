# Temporal API — Quick Reference

Шпаргалка для ежедневной работы с Temporal API в проекте.

## Импорт

```ts
import { Temporal } from "@/lib/temporal";
import { systemClock, type Clock } from "@/lib/temporal";
```

## Типы

| Тип | Использование | Пример строки |
|-----|---------------|---------------|
| `Temporal.Instant` | Timestamps (created_at, updated_at, completed_at) | `"2026-04-16T14:30:00.000Z"` |
| `Temporal.PlainDate` | Date-only (next_date, appear_date) | `"2026-04-16"` |
| `ISOTimestamp` | Branded type для timestamp | `string & { __brand: "ISOTimestamp" }` |
| `ISODate` | Branded type для date-only | `string & { __brand: "ISODate" }` |

## Частые операции

### Текущее время/дата

```ts
// Timestamp (UTC)
Temporal.Now.instant().toString()
// → "2026-04-16T14:30:00.000Z"

// Дата (локальная)
Temporal.Now.plainDateISO().toString()
// → "2026-04-16"

// Часовой пояс
Temporal.Now.timeZoneId()
// → "Europe/Moscow"
```

### Парсинг

```ts
// Из ISO-строки в Instant
Temporal.Instant.from("2026-04-16T14:30:00Z")

// Из ISO-строки в PlainDate
Temporal.PlainDate.from("2026-04-16")
```

### Арифметика

```ts
// Добавить дни
date.add({ days: 7 })

// Вычесть дни
date.subtract({ days: 3 })

// Добавить месяцы
date.toPlainYearMonth().add({ months: 1 })

// Разница в днях
start.until(end, { largestUnit: "days" }).days
```

### Сравнение

```ts
// PlainDate
Temporal.PlainDate.compare(date1, date2)
// → -1 (date1 < date2), 0 (равны), 1 (date1 > date2)

// Instant
Temporal.Instant.compare(instant1, instant2)
```

### Свойства PlainDate

```ts
date.year       // 2026
date.month      // 4 (1-12)
date.day        // 16 (1-31)
date.dayOfWeek  // 3 (1=Mon, 7=Sun)
```

### Конвертация

```ts
// PlainDate → начало дня в локальном часовом поясе
const timeZone = Temporal.Now.timeZoneId();
date.toZonedDateTime(timeZone).toInstant()

// Instant → PlainDate в часовом поясе
instant.toZonedDateTimeISO(timeZone).toPlainDate()
```

## Clock для тестируемости

### Production

```ts
import { systemClock, type Clock } from "@/lib/temporal";

function createTask(name: string, clock: Clock = systemClock) {
  return {
    created_at: clock.instant().toString(),
    // ...
  };
}
```

### Тесты

```ts
import { fakeClock } from "@/lib/temporal";

const clock = fakeClock("2026-04-16T10:00:00Z");
const result = createTask("Test", clock);
```

## Что НЕ делать

```ts
// ❌ Не импортировать напрямую
import { Temporal } from "temporal-polyfill";

// ❌ Не использовать Date в production (кроме token expiry)
new Date()
new Date().toISOString()
Date.now() // только в ApiClient.ts и AuthProvider.tsx

// ❌ Не забывать .toString() при сериализации
await db.tasks.add({
  created_at: Temporal.Now.instant() // ❌ объект не сериализуется
});

// ✅ Правильно
await db.tasks.add({
  created_at: Temporal.Now.instant().toString() // ✅ строка
});
```

## Форматирование для UI

```ts
const instant = Temporal.Instant.from(task.completed_at);
const timeZone = Temporal.Now.timeZoneId();

new Intl.DateTimeFormat("ru-RU", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone,
}).format(instant.epochMilliseconds);
// → "16 апреля 2026 г., 14:30"
```

## Полезные ссылки

- [temporal-guide.md](./temporal-guide.md) — полное руководство
- [temporal-migration-checklist.md](./temporal-migration-checklist.md) — чеклист миграции
- [TEMPORAL_MIGRATION_AUDIT.md](../../TEMPORAL_MIGRATION_AUDIT.md) — аудит проекта
