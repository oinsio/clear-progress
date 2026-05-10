# Temporal API — Quick Reference

Cheat sheet for daily work with Temporal API in the project.

## Import

```ts
import { Temporal } from "@/lib/temporal";
import { systemClock, type Clock } from "@/lib/temporal";
```

## Types

| Type | Usage | Example String |
|------|-------|----------------|
| `Temporal.Instant` | Timestamps (created_at, updated_at, completed_at) | `"2026-04-16T14:30:00.000Z"` |
| `Temporal.PlainDate` | Date-only (next_date, appear_date) | `"2026-04-16"` |
| `ISOTimestamp` | Branded type for timestamp | `string & { __brand: "ISOTimestamp" }` |
| `ISODate` | Branded type for date-only | `string & { __brand: "ISODate" }` |

## Common Operations

### Current time/date

```ts
// Timestamp (UTC)
Temporal.Now.instant().toString()
// -> "2026-04-16T14:30:00.000Z"

// Date (local)
Temporal.Now.plainDateISO().toString()
// -> "2026-04-16"

// Timezone
Temporal.Now.timeZoneId()
// -> "Europe/Moscow"
```

### Parsing

```ts
// From ISO string to Instant
Temporal.Instant.from("2026-04-16T14:30:00Z")

// From ISO string to PlainDate
Temporal.PlainDate.from("2026-04-16")
```

### Arithmetic

```ts
// Add days
date.add({ days: 7 })

// Subtract days
date.subtract({ days: 3 })

// Add months
date.toPlainYearMonth().add({ months: 1 })

// Difference in days
start.until(end, { largestUnit: "days" }).days
```

### Comparison

```ts
// PlainDate
Temporal.PlainDate.compare(date1, date2)
// -> -1 (date1 < date2), 0 (equal), 1 (date1 > date2)

// Instant
Temporal.Instant.compare(instant1, instant2)
```

### PlainDate Properties

```ts
date.year       // 2026
date.month      // 4 (1-12)
date.day        // 16 (1-31)
date.dayOfWeek  // 3 (1=Mon, 7=Sun)
```

### Conversion

```ts
// PlainDate -> start of day in local timezone
const timeZone = Temporal.Now.timeZoneId();
date.toZonedDateTime(timeZone).toInstant()

// Instant -> PlainDate in timezone
instant.toZonedDateTimeISO(timeZone).toPlainDate()
```

## Clock for Testability

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

### Tests

```ts
import { fakeClock } from "@/lib/temporal";

const clock = fakeClock("2026-04-16T10:00:00Z");
const result = createTask("Test", clock);
```

## What NOT to Do

```ts
// Do not import directly
import { Temporal } from "temporal-polyfill";

// Do not use Date in production (except token expiry)
new Date()
new Date().toISOString()
Date.now() // only in ApiClient.ts and AuthProvider.tsx

// Do not forget .toString() when serializing
await db.tasks.add({
  created_at: Temporal.Now.instant() // object won't serialize
});

// Correct
await db.tasks.add({
  created_at: Temporal.Now.instant().toString() // string
});
```

## Formatting for UI

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
// -> "16 апреля 2026 г., 14:30"
```

## See Also

- [temporal-guide.md](./temporal-guide.md) — full guide
- [temporal-migration-checklist.md](./temporal-migration-checklist.md) — migration checklist
- [TEMPORAL_MIGRATION_AUDIT.md](../TEMPORAL_MIGRATION_AUDIT.md) — project audit
