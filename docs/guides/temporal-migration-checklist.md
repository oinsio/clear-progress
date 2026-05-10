# Temporal Migration Checklist

Checklist for migrating code from `Date` to Temporal API.

## Quick Check: Is Migration Needed?

### Migrate

- [ ] `new Date()` in production code (except exceptions below)
- [ ] `new Date(dateString)` for date parsing
- [ ] `.getDate()`, `.getMonth()`, `.getFullYear()` for extracting date components
- [ ] `.setDate()`, `.setMonth()`, `.setFullYear()` for modifying dates
- [ ] `.toISOString().split("T")[0]` for getting date-only string
- [ ] Millisecond arithmetic (`MS_PER_DAY`, `.getTime()`)
- [ ] `Date.UTC()` for creating UTC dates
- [ ] `.getUTCDate()`, `.getUTCMonth()` and other UTC methods

### Do NOT Migrate

- [ ] `Date.now()` in `ApiClient.ts` and `AuthProvider.tsx` (token expiry)
- [ ] Entire backend (GAS) — does not support Temporal
- [ ] Backend tests

## Migration Patterns

### 1. Current timestamp

```ts
// Before
const timestamp = new Date().toISOString();

// After
import { Temporal } from "@/lib/temporal";
const timestamp = Temporal.Now.instant().toString();
```

### 2. Current date (local)

```ts
// Before
const today = new Date().toISOString().split("T")[0];

// After
import { Temporal } from "@/lib/temporal";
const today = Temporal.Now.plainDateISO().toString();
```

### 3. Parsing date-only string

```ts
// Before
const date = new Date("2026-04-16");
const day = date.getDate();        // may be wrong!
const month = date.getMonth() + 1;

// After
import { Temporal } from "@/lib/temporal";
const date = Temporal.PlainDate.from("2026-04-16");
const day = date.day;
const month = date.month;
```

### 4. Add/subtract days

```ts
// Before
const next = new Date(dateStr);
next.setDate(next.getDate() + 7);
const nextDate = next.toISOString().split("T")[0];

// After
import { Temporal } from "@/lib/temporal";
const nextDate = Temporal.PlainDate.from(dateStr)
  .add({ days: 7 })
  .toString();
```

### 5. Add months

```ts
// Before
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

// After
import { Temporal } from "@/lib/temporal";
const prev = Temporal.PlainDate.from(dateStr);
const targetYearMonth = prev.toPlainYearMonth().add({ months: interval });
const actualDay = Math.min(prev.day, targetYearMonth.daysInMonth);
const result = targetYearMonth.toPlainDate({ day: actualDay }).toString();
```

### 6. Difference in days

```ts
// Before
const daysDiff = Math.floor(
  (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
);

// After
import { Temporal } from "@/lib/temporal";
const start = Temporal.PlainDate.from(date1Str);
const end = Temporal.PlainDate.from(date2Str);
const daysDiff = start.until(end, { largestUnit: "days" }).days;
```

### 7. Day of week (ISO)

```ts
// Before
const utcDay = date.getUTCDay(); // 0=Sun, 6=Sat
const isoDay = utcDay === 0 ? 7 : utcDay; // convert to ISO

// After
import { Temporal } from "@/lib/temporal";
const date = Temporal.PlainDate.from(dateStr);
const isoDay = date.dayOfWeek; // 1=Mon, 7=Sun
```

### 8. Start of day in local timezone

```ts
// Before
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

// After
import { Temporal } from "@/lib/temporal";
const timeZone = Temporal.Now.timeZoneId();
const today = Temporal.Now.plainDateISO();
const startOfToday = today.toZonedDateTime(timeZone).toInstant();
```

### 9. Date comparison

```ts
// Before
if (date1.getTime() < date2.getTime()) { ... }

// After (for PlainDate)
import { Temporal } from "@/lib/temporal";
if (Temporal.PlainDate.compare(date1, date2) < 0) { ... }

// After (for Instant)
if (Temporal.Instant.compare(instant1, instant2) < 0) { ... }
```

### 10. Functions with current time (for testability)

```ts
// Before
export function createTask(name: string): Task {
  return {
    id: crypto.randomUUID(),
    name,
    created_at: new Date().toISOString(),
    // ...
  };
}

// After
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

## Testing After Migration

### 1. Update tests

```ts
// Before
vi.setSystemTime(new Date("2026-04-16T10:00:00Z"));

// After
import { fakeClock } from "@/lib/temporal";
const clock = fakeClock("2026-04-16T10:00:00Z");
const result = functionUnderTest(clock);
```

### 2. Verify types

After migration, ensure branded types are used:

```ts
interface Task {
  created_at: ISOTimestamp;
  next_date: ISODate | "";
}
```

### 3. Run tests

```bash
pnpm run test
```

## Files to Migrate (from TEMPORAL_MIGRATION_AUDIT.md)

### Critical (with bugs)

- [ ] `src/utils/repeatRule.ts` — all `calculateNextDate*`, `calculateAppearDate`
- [ ] `src/services/HiddenTaskService.ts` — determining "today"
- [ ] `src/shared/lib/utils.ts` — `formatAppearDate`, `groupCompletedTasks`, `getDayBoundaries`

### Timestamps (for consistency)

- [ ] `src/services/TaskService.ts` (5 places)
- [ ] `src/services/GoalService.ts` (3 places)
- [ ] `src/services/ContextService.ts` (3 places)
- [ ] `src/services/CategoryService.ts` (3 places)
- [ ] `src/services/ChecklistService.ts` (3 places)
- [ ] `src/services/IdeaService.ts` (3 places)
- [ ] `src/services/CoverService.ts` (1 place)
- [ ] `src/services/CoverSyncService.ts` (2 places)
- [ ] `src/app/providers/SyncProvider.tsx` (2 places)
- [ ] `src/db/repositories/SettingsRepository.ts` (1 place)

### Utilities

- [ ] `src/utils/dateHelpers.ts` — `getCurrentDateDefaults`
- [ ] `src/shared/lib/utils.ts` — `formatCompletedAt`, `formatShortDateTime`

### Tests

- [ ] `src/utils/repeatRule.test.ts`
- [ ] `src/utils/dateHelpers.test.ts`
- [ ] `src/shared/lib/utils.test.ts`
- [ ] `src/services/SyncService.test.ts`
- [ ] `src/services/CoverSyncService.test.ts`
- [ ] `src/services/TaskService.recurring.test.ts`
- [ ] `src/services/CoverService.test.ts`
- [ ] `src/components/tasks/TaskItem.test.tsx`
- [ ] `src/db/repositories/SettingsRepository.test.ts`

### Factories

- [ ] `src/test/factories/taskFactory.ts`
- [ ] `src/test/factories/goalFactory.ts`
- [ ] `src/test/factories/ideaFactory.ts`
- [ ] `src/test/factories/contextFactory.ts`
- [ ] `src/test/factories/categoryFactory.ts`
- [ ] `src/test/factories/checklistItemFactory.ts`

## After Migration

1. Run all tests: `pnpm run test`
2. Check types: `pnpm run typecheck`
3. Run linter: `pnpm run lint`
4. Verify build: `pnpm run build`
5. Run E2E tests: `pnpm run test:e2e`

## Additional Resources

- [temporal-guide.md](./temporal-guide.md) — full guide
- [TEMPORAL_MIGRATION_AUDIT.md](../TEMPORAL_MIGRATION_AUDIT.md) — detailed audit
