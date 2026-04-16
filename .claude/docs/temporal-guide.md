# Temporal API — Руководство по использованию

Все операции с датами и временем во frontend используют Temporal API через `temporal-polyfill`.

## Зачем Temporal вместо Date

`Date` в JavaScript не различает:
- Момент времени (timestamp) vs календарную дату
- UTC vs локальный часовой пояс

Это приводит к багам:
```ts
// ❌ Date: можно ошибиться
new Date("2026-04-16").getMonth()  // может вернуть 3 (март) в UTC-5

// ✅ Temporal: невозможно ошибиться
Temporal.PlainDate.from("2026-04-16").month  // всегда 4 (апрель)
```

## Импорт

**Всегда** импортируйте из `@/lib/temporal`, **никогда** напрямую из `temporal-polyfill`:

```ts
// ✅ Правильно
import { Temporal } from "@/lib/temporal";

// ❌ Неправильно
import { Temporal } from "temporal-polyfill";
```

## Типы данных

### Branded Types

Проект использует branded types для различения timestamp и date-only строк:

```ts
// src/types/entities.ts
type ISOTimestamp = string & { readonly __brand: "ISOTimestamp" };
type ISODate = string & { readonly __brand: "ISODate" };

interface Task {
  // Timestamps — "2026-04-16T14:30:00.000Z"
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  completed_at: ISOTimestamp | "";

  // Date-only — "2026-04-16"
  next_date: ISODate | "";
  appear_date: ISODate | "";
}
```

### Temporal.Instant — моменты времени

Используется для timestamps (`created_at`, `updated_at`, `completed_at`):

```ts
// Текущий момент времени
const now = Temporal.Now.instant();
// → Temporal.Instant

// Конвертация в ISO-строку для хранения
const timestamp = now.toString();
// → "2026-04-16T14:30:00.000Z"

// Парсинг из строки
const instant = Temporal.Instant.from("2026-04-16T14:30:00.000Z");

// Сравнение
if (Temporal.Instant.compare(instant1, instant2) > 0) {
  // instant1 позже instant2
}
```

### Temporal.PlainDate — календарные даты

Используется для date-only полей (`next_date`, `appear_date`):

```ts
// Текущая дата в системном часовом поясе
const today = Temporal.Now.plainDateISO();
// → Temporal.PlainDate { year: 2026, month: 4, day: 16 }

// Конвертация в ISO-строку
const dateStr = today.toString();
// → "2026-04-16"

// Парсинг из строки
const date = Temporal.PlainDate.from("2026-04-16");

// Арифметика
const tomorrow = today.add({ days: 1 });
const lastWeek = today.subtract({ days: 7 });

// Сравнение
if (Temporal.PlainDate.compare(date1, date2) < 0) {
  // date1 раньше date2
}

// Свойства
date.year      // 2026
date.month     // 4 (1-12)
date.day       // 16 (1-31)
date.dayOfWeek // 3 (1=Mon, 7=Sun, ISO 8601)
```

## Clock Abstraction

Для тестируемости все функции, использующие текущее время, принимают `Clock`:

```ts
// src/lib/temporal.ts
export type Clock = {
  instant(): Temporal.Instant;
  plainDateISO(): Temporal.PlainDate;
  timeZoneId(): string;
};

export const systemClock: Clock = {
  instant: () => Temporal.Now.instant(),
  plainDateISO: () => Temporal.Now.plainDateISO(),
  timeZoneId: () => Temporal.Now.timeZoneId(),
};
```

### Использование в production-коде

```ts
import { systemClock, type Clock } from "@/lib/temporal";

export function createTask(
  name: string,
  clock: Clock = systemClock
): Task {
  return {
    id: crypto.randomUUID(),
    name,
    created_at: clock.instant().toString(),
    updated_at: clock.instant().toString(),
    // ...
  };
}
```

### Использование в тестах

```ts
import { fakeClock } from "@/lib/temporal";

it("should create task with fixed timestamp", () => {
  const clock = fakeClock("2026-04-16T10:00:00Z");
  const task = createTask("Test", clock);

  expect(task.created_at).toBe("2026-04-16T10:00:00Z");
});
```

## Типичные операции

### Получить текущий timestamp

```ts
// ✅ Правильно
const timestamp = Temporal.Now.instant().toString();
// → "2026-04-16T14:30:00.000Z"

// ❌ Неправильно
const timestamp = new Date().toISOString();
```

### Получить текущую дату (в локальном часовом поясе)

```ts
// ✅ Правильно
const today = Temporal.Now.plainDateISO().toString();
// → "2026-04-16"

// ❌ Неправильно
const today = new Date().toISOString().split("T")[0];  // UTC!
```

### Добавить/вычесть дни

```ts
// ✅ Правильно
const nextDate = Temporal.PlainDate.from("2026-04-16")
  .add({ days: 7 })
  .toString();
// → "2026-04-23"

// ❌ Неправильно
const next = new Date("2026-04-16");
next.setDate(next.getDate() + 7);
const nextDate = next.toISOString().split("T")[0];
```

### Добавить месяцы с нормализацией дня

```ts
const date = Temporal.PlainDate.from("2026-01-31");
const yearMonth = date.toPlainYearMonth().add({ months: 1 });
const actualDay = Math.min(date.day, yearMonth.daysInMonth);
const nextDate = yearMonth.toPlainDate({ day: actualDay });
// → "2026-02-28" (февраль имеет только 28 дней)
```

### Вычислить разницу в днях

```ts
const start = Temporal.PlainDate.from("2026-04-01");
const end = Temporal.PlainDate.from("2026-04-16");
const days = start.until(end, { largestUnit: "days" }).days;
// → 15
```

### Получить день недели (ISO)

```ts
const date = Temporal.PlainDate.from("2026-04-16");
const dayOfWeek = date.dayOfWeek;
// → 4 (четверг; 1=Mon, 7=Sun)
```

### Начало дня в локальном часовом поясе

```ts
const timeZone = Temporal.Now.timeZoneId();
const today = Temporal.Now.plainDateISO();
const startOfToday = today.toZonedDateTime(timeZone).toInstant();
// → Temporal.Instant (полночь в локальном часовом поясе)
```

### Форматирование для отображения

```ts
const instant = Temporal.Instant.from("2026-04-16T14:30:00Z");
const timeZone = Temporal.Now.timeZoneId();

const formatted = new Intl.DateTimeFormat("ru-RU", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone,
}).format(instant.epochMilliseconds);
// → "16 апреля 2026 г., 14:30"
```

## Границы сериализации

Temporal-объекты **не сериализуются** автоматически. Всегда конвертируйте в строки на границах:

### Dexie (IndexedDB)

```ts
// ✅ Правильно — хранить строки
await db.tasks.add({
  id: "...",
  created_at: Temporal.Now.instant().toString(),
  next_date: Temporal.Now.plainDateISO().toString(),
});

// При чтении — парсить обратно
const task = await db.tasks.get(id);
const createdInstant = Temporal.Instant.from(task.created_at);
const nextDate = Temporal.PlainDate.from(task.next_date);
```

### API (fetch)

```ts
// ✅ Правильно — отправлять строки
const response = await fetch(apiUrl, {
  method: "POST",
  body: JSON.stringify({
    created_at: Temporal.Now.instant().toString(),
  }),
});

// При получении — парсить обратно
const data = await response.json();
const serverTime = Temporal.Instant.from(data.server_time);
```

### localStorage

```ts
// ✅ Правильно
localStorage.setItem("lastSync", Temporal.Now.instant().toString());

const lastSync = localStorage.getItem("lastSync");
if (lastSync) {
  const instant = Temporal.Instant.from(lastSync);
}
```

## Что НЕ мигрировать

### Token expiry checks

`Date.now()` остаётся в `ApiClient.ts` и `AuthProvider.tsx` для проверки истечения токенов:

```ts
// ✅ Правильно — Date.now() для token expiry
if (Date.now() >= tokenExpiresAt) {
  await refreshToken();
}
```

**Причина:** сравнение миллисекундных timestamp'ов, `Date.now()` идеально подходит.

### Backend (GAS)

Весь backend продолжает использовать `Date` — Google Apps Script не поддерживает Temporal API.

## Тестирование

### Мокирование текущего времени

```ts
import { fakeClock } from "@/lib/temporal";

it("should calculate next date correctly", () => {
  const clock = fakeClock("2026-04-16T10:00:00Z");

  const result = calculateNextDate(
    "daily",
    1,
    "2026-04-15",
    clock
  );

  expect(result).toBe("2026-04-16");
});
```

### Мокирование часового пояса

```ts
const clock = fakeClock("2026-04-16T10:00:00Z", "America/New_York");
const today = clock.plainDateISO();
// → дата в часовом поясе America/New_York
```

## Миграция существующего кода

### Было (Date)

```ts
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dateStr = tomorrow.toISOString().split("T")[0];
```

### Стало (Temporal)

```ts
const tomorrow = Temporal.Now.plainDateISO()
  .add({ days: 1 })
  .toString();
```

### Было (Date)

```ts
const date = new Date(dateStr);
const day = date.getDate();        // local!
const month = date.getMonth() + 1; // local!
```

### Стало (Temporal)

```ts
const date = Temporal.PlainDate.from(dateStr);
const day = date.day;
const month = date.month;
```

## Размер бандла

`temporal-polyfill` добавляет ≈ 30–40 KB gzipped. Когда Safari получит полную поддержку Temporal (ожидается 2026–2027), переключение на нативный:

```ts
// src/lib/temporal.ts
export const { Temporal } = globalThis;
```

## Дополнительные ресурсы

- [Temporal API Proposal](https://tc39.es/proposal-temporal/docs/)
- [temporal-polyfill на npm](https://www.npmjs.com/package/temporal-polyfill)
- [TEMPORAL_MIGRATION_AUDIT.md](../../TEMPORAL_MIGRATION_AUDIT.md) — полный аудит миграции проекта
