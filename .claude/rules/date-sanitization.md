---
paths:
  - "packages/client/src/utils/dateHelpers.ts"
  - "packages/adapter-gas/src/**/*.ts"
---

# Rule: sanitize date-only fields at both layers

**Decision** (see docs/architecture/date-sanitization.md):

- **Backend (GAS):** Use `toISODateValue()` for date-only fields (`next_date`, `appear_date`), `toISOStringValue()` for timestamps
- **Frontend:** Any date-only field read from IndexedDB must pass through `sanitizeDateOnly()` before `Temporal.PlainDate.from()`

**Formats:**
- Timestamp fields (`created_at`, `updated_at`, `completed_at`): `YYYY-MM-DDTHH:mm:ss.sssZ`
- Date-only fields (`next_date`, `appear_date`): `YYYY-MM-DD`

**What NOT to do:**
- Do not use `String()` for date fields in backend `rowTo*` functions — always `toISOStringValue()` or `toISODateValue()`
- Do not pass date-only fields directly to `Temporal.PlainDate.from()` without `sanitizeDateOnly()`
- Do not mix timestamp format (`...T00:00:00.000Z`) in date-only fields
