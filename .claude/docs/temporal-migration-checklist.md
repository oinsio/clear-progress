# Temporal Migration Checklist

Краткий чеклист для миграции кода с `Date` на Temporal API.

## Быстрая проверка: нужна ли миграция?

### ✅ Мигрировать

- [ ] `new Date()` в production-коде (кроме исключений ниже)
- [ ] `new Date(dateString)` для парсинга дат
- [ ] `.getDate()`, `.getMonth()`, `.getFullYear()` для извлечения компонентов даты
- [ ] `.setDate()`, `.setMonth()`, `.setFullYear()` для изменения дат
- [ ] `.toISOString().split("T")[0]` для получения date-only строки
- [ ] Арифметика через миллисекунды (`MS_PER_DAY`, `.getTime()`)
- [ ] `Date.UTC()` для создания UTC-дат
- [ ] `.getUTCDate()`, `.getUTCMonth()` и другие UTC-методы

### ❌ НЕ мигрировать

- [ ] `Date.now()` в `ApiClient.ts` и `AuthProvider.tsx` (token expiry)
- [ ] Весь backend (GAS) — не поддерживает Temporal
- [ ] Тесты backend'а

## Паттерны миграции

### 1. Текущий timestamp

```ts
// Было
const timestamp = new Date().toISOString();

// Стало
import { Temporal } from "@/lib/temporal";
const timestamp = Temporal.Now.instant().toString();
```

### 2. Текущая дата (локальная)

```ts
// Было
const today = new Date().toISOString().split("T")[0];

// Стало
import { Temporal } from "@/lib/temporal";
const today = Temporal.Now.plainDateISO().toString();
```

### 3. Парсинг date-only строки

```ts
// Было
const date = new Date("2026-04-16");
const day = date.getDate();        // может быть неправильно!
const month = date.getMonth() + 1;

// Стало
import { Temporal } from "@/lib/temporal";
const date = Temporal.PlainDate.from("2026-04-16");
const day = date.day;
const month = date.month;
```

### 4. Добавить/вычесть дни

```ts
// Было
const next = new Date(dateStr);
next.setDate(next.getDate() + 7);
const nextDate = next.toISOString().split("T")[0];

// Стало
import { Temporal } from "@/lib/temporal";
const nextDate = Temporal.PlainDate.from(dateStr)
  .add({ days: 7 })
  .toString();
```

### 5. Добавить месяцы

```ts
// Было
const date = new Date(dateStr);
let year = date.getFullYear();
let month = date.getMonth() + interval;
while (month > 11) {
  month -= 12;
  year += 1;
}
const daysInMonth = new Date(year, month + 1, 0).getDate();
const day = Math.min(date.getDate(), daysInMonth);
const result = new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];

// Стало
import { Temporal } from "@/lib/temporal";
const prev = Temporal.PlainDate.from(dateStr);
const targetYearMonth = prev.toPlainYearMonth().add({ months: interval });
const actualDay = Math.min(prev.day, targetYearMonth.daysInMonth);
const result = targetYearMonth.toPlainDate({ day: actualDay }).toString();
```

### 6. Разница в днях

```ts
// Было
const daysDiff = Math.floor(
  (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
);

// Стало
import { Temporal } from "@/lib/temporal";
const start = Temporal.PlainDate.from(date1Str);
const end = Temporal.PlainDate.from(date2Str);
const daysDiff = start.until(end, { largestUnit: "days" }).days;
```

### 7. День недели (ISO)

```ts
// Было
const utcDay = date.getUTCDay(); // 0=Sun, 6=Sat
const isoDay = utcDay === 0 ? 7 : utcDay; // конвертация в ISO

// Стало
import { Temporal } from "@/lib/temporal";
const date = Temporal.PlainDate.from(dateStr);
const isoDay = date.dayOfWeek; // 1=Mon, 7=Sun
```

### 8. Начало дня в локальном часовом поясе

```ts
// Было
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

// Стало
import { Temporal } from "@/lib/temporal";
const timeZone = Temporal.Now.timeZoneId();
const today = Temporal.Now.plainDateISO();
const startOfToday = today.toZonedDateTime(timeZone).toInstant();
```

### 9. Сравнение дат

```ts
// Было
if (date1.getTime() < date2.getTime()) { ... }

// Стало (для PlainDate)
import { Temporal } from "@/lib/temporal";
if (Temporal.PlainDate.compare(date1, date2) < 0) { ... }

// Стало (для Instant)
if (Temporal.Instant.compare(instant1, instant2) < 0) { ... }
```

### 10. Функции с текущим временем (для тестируемости)

```ts
// Было
export function createTask(name: string): Task {
  return {
    id: crypto.randomUUID(),
    name,
    created_at: new Date().toISOString(),
    // ...
  };
}

// Стало
import { systemClock, type Clock } from "@/lib/temporal";

export function createTask(
  name: string,
  clock: Clock = systemClock
): Task {
  return {
    id: crypto.randomUUID(),
    name,
    created_at: clock.instant().toString(),
    // ...
  };
}
```

## Тестирование после миграции

### 1. Обновить тесты

```ts
// Было
vi.setSystemTime(new Date("2026-04-16T10:00:00Z"));

// Стало
import { fakeClock } from "@/lib/temporal";
const clock = fakeClock("2026-04-16T10:00:00Z");
const result = functionUnderTest(clock);
```

### 2. Проверить типы

После миграции убедитесь, что используются branded types:

```ts
interface Task {
  created_at: ISOTimestamp;  // ✅
  next_date: ISODate | "";   // ✅
}
```

### 3. Запустить тесты

```bash
pnpm run test
```

## Файлы для миграции (из TEMPORAL_MIGRATION_AUDIT.md)

### Критические (с багами)

- [ ] `src/utils/repeatRule.ts` — все функции `calculateNextDate*`, `calculateAppearDate`
- [ ] `src/services/HiddenTaskService.ts` — определение «сегодня»
- [ ] `src/shared/lib/utils.ts` — `formatAppearDate`, `groupCompletedTasks`, `getDayBoundaries`

### Timestamps (для единообразия)

- [ ] `src/services/TaskService.ts` (5 мест)
- [ ] `src/services/GoalService.ts` (3 места)
- [ ] `src/services/ContextService.ts` (3 места)
- [ ] `src/services/CategoryService.ts` (3 места)
- [ ] `src/services/ChecklistService.ts` (3 места)
- [ ] `src/services/IdeaService.ts` (3 места)
- [ ] `src/services/CoverService.ts` (1 место)
- [ ] `src/services/CoverSyncService.ts` (2 места)
- [ ] `src/app/providers/SyncProvider.tsx` (2 места)
- [ ] `src/db/repositories/SettingsRepository.ts` (1 место)

### Утилиты

- [ ] `src/utils/dateHelpers.ts` — `getCurrentDateDefaults`
- [ ] `src/shared/lib/utils.ts` — `formatCompletedAt`, `formatShortDateTime`

### Тесты

- [ ] `src/utils/repeatRule.test.ts`
- [ ] `src/utils/dateHelpers.test.ts`
- [ ] `src/shared/lib/utils.test.ts`
- [ ] `src/services/SyncService.test.ts`
- [ ] `src/services/CoverSyncService.test.ts`
- [ ] `src/services/TaskService.recurring.test.ts`
- [ ] `src/services/CoverService.test.ts`
- [ ] `src/components/tasks/TaskItem.test.tsx`
- [ ] `src/db/repositories/SettingsRepository.test.ts`

### Фабрики

- [ ] `src/test/factories/taskFactory.ts`
- [ ] `src/test/factories/goalFactory.ts`
- [ ] `src/test/factories/ideaFactory.ts`
- [ ] `src/test/factories/contextFactory.ts`
- [ ] `src/test/factories/categoryFactory.ts`
- [ ] `src/test/factories/checklistItemFactory.ts`

## После миграции

1. Запустить все тесты: `pnpm run test`
2. Проверить типы: `pnpm run typecheck`
3. Запустить линтер: `pnpm run lint`
4. Проверить сборку: `pnpm run build`
5. Запустить E2E тесты: `pnpm run test:e2e`

## Дополнительные ресурсы

- [temporal-guide.md](./.claude/docs/temporal-guide.md) — полное руководство
- [TEMPORAL_MIGRATION_AUDIT.md](../../TEMPORAL_MIGRATION_AUDIT.md) — детальный аудит
