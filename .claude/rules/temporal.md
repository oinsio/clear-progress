---
paths:
  - "packages/client/src/**/*.ts"
  - "packages/client/src/**/*.tsx"
---

# Rule: Temporal API usage conventions

**Full guide:** docs/guides/temporal-guide.md

**Always:**
- Import from `@/lib/temporal`, never from `temporal-polyfill`
- Use `Temporal.Instant` for timestamps, `Temporal.PlainDate` for date-only
- Call `.toString()` before serializing to IndexedDB, API, or localStorage
- Add `clock: Clock = systemClock` parameter to functions using current time
- Use `fakeClock` in tests, never `vi.setSystemTime()` or `vi.useFakeTimers()`

**Never:**
- `new Date()` in production code (except `Date.now()` for token expiry in `supabaseClientManager.ts` / `tokenPersistence.ts`)
- `date.toISOString().split("T")[0]` — use `Temporal.Now.plainDateISO().toString()`
- Store `Temporal` objects directly — they don't serialize

**Exceptions (do NOT migrate):**
- `Date.now()` in token expiry checks (`supabaseClientManager.ts`, `tokenPersistence.ts`)
- Entire GAS backend — does not support Temporal API
