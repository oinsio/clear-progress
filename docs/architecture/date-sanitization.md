# Date Sanitization: Google Sheets -> Temporal API

## Problem

Google Sheets `getValues()` returns `Date` objects for date cells. With naive conversion:

- `String(date)` -> `"Sun Apr 19 2026 19:00:00 GMT+0000 (...)"` — **unparseable** by Temporal API
- `date.toISOString()` -> `"2026-04-19T19:00:00.000Z"` — this is a **timestamp**, not date-only

For `next_date` and `appear_date` fields, the format **`YYYY-MM-DD`** (date-only) is required, not an ISO timestamp.

## Solution: Two Layers of Protection

### 1. Backend: `toISODateValue()` (primary conversion)

File: `packages/adapter-gas/src/helpers/constants.ts`

For date-only fields (`next_date`, `appear_date`), use `toISODateValue()` instead of `toISOStringValue()`:

```ts
// toISOStringValue — for timestamp fields (created_at, updated_at, completed_at)
// toISODateValue  — for date-only fields (next_date, appear_date)
```

`toISODateValue` handles:
- `Date` object -> `date.toISOString().substring(0, 10)` -> `"2026-04-19"`
- ISO date string -> as-is
- ISO timestamp string -> extracts `YYYY-MM-DD`
- `Date.toString()` format -> parses via `new Date()`, extracts date

### 2. Frontend: `sanitizeDateOnly()` (defensive layer)

File: `packages/client/src/utils/dateHelpers.ts`

Frontend sanitization is protection against corrupted data that may have entered IndexedDB before the backend fix was deployed. Applied in:

| Location | File | Purpose |
|----------|------|---------|
| `applyServerRecords()` | `TaskRepository.ts` | Sanitize when writing pull data to IndexedDB |
| `getTasksToReveal()` | `TaskRepository.ts` | Protection when reading `appear_date` from IndexedDB |
| `formatAppearDate()` | `shared/lib/utils.ts` | Protection when rendering appear date |
| `calculateNextDate()` | `utils/repeatRule.ts` | Protection when calculating next recurrence date |
| `calculateAppearDate()` | `utils/repeatRule.ts` | Protection when calculating appear date |

## Rule

- **Timestamp fields** (`created_at`, `updated_at`, `completed_at`): backend uses `toISOStringValue()`, format `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Date-only fields** (`next_date`, `appear_date`): backend uses `toISODateValue()`, format `YYYY-MM-DD`
- **Frontend**: any read of a date-only field from IndexedDB for passing to `Temporal.PlainDate.from()` must go through `sanitizeDateOnly()`
