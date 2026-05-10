# Temporal API — Usage Guide

All date and time operations in the frontend use the Temporal API via `temporal-polyfill`.

## Why Temporal Instead of Date

`Date` in JavaScript does not distinguish:
- Moment in time (timestamp) vs calendar date
- UTC vs local timezone

This leads to bugs:
```ts
// Date: easy to make mistakes
new Date("2026-04-16").getMonth()  // may return 3 (March) in UTC-5

// Temporal: impossible to make mistakes
Temporal.PlainDate.from("2026-04-16").month  // always 4 (April)
```

## Import

**Always** import from `@/lib/temporal`, **never** directly from `temporal-polyfill`:

```ts
// Correct
import { Temporal } from "@/lib/temporal";

// Wrong
import { Temporal } from "temporal-polyfill";
```

## Data Types

### Branded Types

The project uses branded types to distinguish timestamp and date-only strings:

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

### Temporal.Instant — moments in time

Used for timestamps (`created_at`, `updated_at`, `completed_at`):

```ts
// Current moment
const now = Temporal.Now.instant();

// Convert to ISO string for storage
const timestamp = now.toString();
// -> "2026-04-16T14:30:00.000Z"

// Parse from string
const instant = Temporal.Instant.from("2026-04-16T14:30:00.000Z");

// Comparison
if (Temporal.Instant.compare(instant1, instant2) > 0) {
  // instant1 is later than instant2
}
```

> **Important:** Date-only fields may contain incorrect formats due to Google Sheets Date object conversion.
> When reading `next_date` / `appear_date` from IndexedDB, always use `sanitizeDateOnly()` before `Temporal.PlainDate.from()`.
> Details: [Date Sanitization](../architecture/date-sanitization.md)

### Temporal.PlainDate — calendar dates

Used for date-only fields (`next_date`, `appear_date`):

```ts
// Current date in system timezone
const today = Temporal.Now.plainDateISO();

// Convert to ISO string
const dateStr = today.toString();
// -> "2026-04-16"

// Parse from string
const date = Temporal.PlainDate.from("2026-04-16");

// Arithmetic
const tomorrow = today.add({ days: 1 });
const lastWeek = today.subtract({ days: 7 });

// Comparison
if (Temporal.PlainDate.compare(date1, date2) < 0) {
  // date1 is before date2
}

// Properties
date.year      // 2026
date.month     // 4 (1-12)
date.day       // 16 (1-31)
date.dayOfWeek // 3 (1=Mon, 7=Sun, ISO 8601)
```

## Clock Abstraction

For testability, all functions using current time accept a `Clock`:

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

### Usage in production code

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

### Usage in tests

```ts
import { fakeClock } from "@/lib/temporal";

it("should create task with fixed timestamp", () => {
  const clock = fakeClock("2026-04-16T10:00:00Z");
  const task = createTask("Test", clock);

  expect(task.created_at).toBe("2026-04-16T10:00:00Z");
});
```

## Common Operations

### Get current timestamp

```ts
// Correct
const timestamp = Temporal.Now.instant().toString();
// -> "2026-04-16T14:30:00.000Z"

// Wrong
const timestamp = new Date().toISOString();
```

### Get current date (in local timezone)

```ts
// Correct
const today = Temporal.Now.plainDateISO().toString();
// -> "2026-04-16"

// Wrong
const today = new Date().toISOString().split("T")[0];  // UTC!
```

### Add/subtract days

```ts
// Correct
const nextDate = Temporal.PlainDate.from("2026-04-16")
  .add({ days: 7 })
  .toString();
// -> "2026-04-23"

// Wrong
const next = new Date("2026-04-16");
next.setDate(next.getDate() + 7);
const nextDate = next.toISOString().split("T")[0];
```

### Add months with day normalization

```ts
const date = Temporal.PlainDate.from("2026-01-31");
const yearMonth = date.toPlainYearMonth().add({ months: 1 });
const actualDay = Math.min(date.day, yearMonth.daysInMonth);
const nextDate = yearMonth.toPlainDate({ day: actualDay });
// -> "2026-02-28" (February has only 28 days)
```

### Calculate difference in days

```ts
const start = Temporal.PlainDate.from("2026-04-01");
const end = Temporal.PlainDate.from("2026-04-16");
const days = start.until(end, { largestUnit: "days" }).days;
// -> 15
```

### Get day of week (ISO)

```ts
const date = Temporal.PlainDate.from("2026-04-16");
const dayOfWeek = date.dayOfWeek;
// -> 4 (Thursday; 1=Mon, 7=Sun)
```

### Start of day in local timezone

```ts
const timeZone = Temporal.Now.timeZoneId();
const today = Temporal.Now.plainDateISO();
const startOfToday = today.toZonedDateTime(timeZone).toInstant();
// -> Temporal.Instant (midnight in local timezone)
```

### Formatting for display

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
// -> "16 апреля 2026 г., 14:30"
```

## Serialization Boundaries

Temporal objects **do not** serialize automatically. Always convert to strings at boundaries:

### Dexie (IndexedDB)

```ts
// Correct — store strings
await db.tasks.add({
  id: "...",
  created_at: Temporal.Now.instant().toString(),
  next_date: Temporal.Now.plainDateISO().toString(),
});

// When reading — parse back
const task = await db.tasks.get(id);
const createdInstant = Temporal.Instant.from(task.created_at);
const nextDate = Temporal.PlainDate.from(task.next_date);
```

### API (fetch)

```ts
// Correct — send strings
const response = await fetch(apiUrl, {
  method: "POST",
  body: JSON.stringify({
    created_at: Temporal.Now.instant().toString(),
  }),
});

// When receiving — parse back
const data = await response.json();
const serverTime = Temporal.Instant.from(data.server_time);
```

### localStorage

```ts
// Correct
localStorage.setItem("lastSync", Temporal.Now.instant().toString());

const lastSync = localStorage.getItem("lastSync");
if (lastSync) {
  const instant = Temporal.Instant.from(lastSync);
}
```

## What NOT to Migrate

### Token expiry checks

`Date.now()` remains in `ApiClient.ts` and `AuthProvider.tsx` for token expiry checks:

```ts
// Correct — Date.now() for token expiry
if (Date.now() >= tokenExpiresAt) {
  await refreshToken();
}
```

**Reason:** Comparing millisecond timestamps — `Date.now()` is perfectly suited.

### Backend (GAS)

The entire backend continues using `Date` — Google Apps Script does not support the Temporal API.

### Date serialization from Google Sheets (toISOStringValue)

Google Sheets `getValues()` returns `Date` objects for date cells. `String(date)` produces `Date.toString()` format (`"Sun Apr 19 2026 19:00:00 GMT+0000 (...)"`), which Temporal API cannot parse.

All `rowTo*` functions in the backend use `toISOStringValue()` instead of `String()` for date fields:

```ts
import { toISOStringValue } from '../helpers/constants';

// Correct
created_at: toISOStringValue(row[cols.created_at]),

// Wrong — Date object may convert to an unparseable format
created_at: String(row[cols.created_at] ?? ''),
```

`toISOStringValue` guarantees:
- `Date` object -> `.toISOString()` -> `"2026-04-19T19:00:00.000Z"`
- String without fractional seconds -> pads to 3 digits: `"...T19:00:00Z"` -> `"...T19:00:00.000Z"`
- String with 1-2 digits -> pads: `"...T19:00:00.1Z"` -> `"...T19:00:00.100Z"`
- String with 3+ digits -> no change
- Empty string / non-timestamp -> no change

**Rule:** When adding a new date field in the backend, always use `toISOStringValue()`, never `String()`.

## Testing

### Mocking current time

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

### Mocking timezone

```ts
const clock = fakeClock("2026-04-16T10:00:00Z", "America/New_York");
const today = clock.plainDateISO();
// -> date in America/New_York timezone
```

## Migration from Date

### Before (Date)

```ts
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dateStr = tomorrow.toISOString().split("T")[0];
```

### After (Temporal)

```ts
const tomorrow = Temporal.Now.plainDateISO()
  .add({ days: 1 })
  .toString();
```

## Bundle Size

`temporal-polyfill` adds ~30-40 KB gzipped. When Safari gets full Temporal support (expected 2026-2027), switching to native:

```ts
// src/lib/temporal.ts
export const { Temporal } = globalThis;
```

## Additional Resources

- [Temporal API Proposal](https://tc39.es/proposal-temporal/docs/)
- [temporal-polyfill on npm](https://www.npmjs.com/package/temporal-polyfill)
- [TEMPORAL_MIGRATION_AUDIT.md](../TEMPORAL_MIGRATION_AUDIT.md) — full project migration audit
