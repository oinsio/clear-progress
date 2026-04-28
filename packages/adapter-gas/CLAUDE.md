# Clear Progress — Backend (GAS)

See root `@CLAUDE.md` for data model and API protocol.

## Deploy

```bash
pnpm clasp push         # Push code to GAS
pnpm clasp deploy       # Create new deployment
./deploy.sh            # Full deploy (build + push + deploy)
```

## Gotchas

- **No Temporal API** — use `Date` object for all date/time operations
- **Date-only fields** (next_date, appear_date): stored with leading apostrophe in Sheets (`'2025-01-15`) to prevent auto-conversion — see `normalizeToSheetDate()` and `toSheetDateValue()` in `src/helpers/constants.ts`
- **GAS globals**: `doGet`/`doPost` exposed via `globalThis` assignment (esbuild IIFE format) — see `src/main.ts`
- **Auth**: first caller's email auto-registered as `OWNER_EMAIL` in PropertiesService; subsequent calls must match
- Action files use **kebab-case** (`upload-cover.ts`), everything else is `camelCase.ts`

## Response Format

- Success: `{ ok: true, ...data }`
- Error: `{ ok: false, error: "CODE", message: "..." }`
- Error codes: `INVALID_ACTION`, `INVALID_PAYLOAD`, `NOT_INITIALIZED`, `INTERNAL_ERROR`, `FILE_TOO_LARGE`, `FILE_NOT_FOUND`, `UNAUTHORIZED`