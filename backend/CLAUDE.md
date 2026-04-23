# Clear Progress — Backend

Google Apps Script backend. See root `CLAUDE.md` for data model, API protocol, and shared conventions.

## Deploy

```bash
npx clasp push         # Push code to GAS
npx clasp deploy       # Create new deployment
./deploy.sh            # Full deploy script (build + push + deploy)
```

## Gotchas

- **No Temporal API** in GAS — use `Date` object for all date/time operations
- **Date-only fields** (next_date, appear_date): stored with leading apostrophe in Google Sheets (`'2025-01-15`) to prevent auto-conversion to Date objects — see `normalizeToSheetDate()` and `toSheetDateValue()` in `src/helpers/constants.ts`
- **GAS globals**: `doGet`/`doPost` exposed via `globalThis` assignment (esbuild IIFE format) — see `src/main.ts`
- **Auth**: first caller's email auto-registered as `OWNER_EMAIL` in PropertiesService; subsequent calls must match
- Action files use **kebab-case** (`upload-cover.ts`), everything else is `camelCase.ts`

## Response Format

- Success: `{ ok: true, ...data }`
- Error: `{ ok: false, error: "CODE", message: "..." }`
- Error codes: `INVALID_ACTION`, `INVALID_PAYLOAD`, `NOT_INITIALIZED`, `INTERNAL_ERROR`, `FILE_TOO_LARGE`, `FILE_NOT_FOUND`, `UNAUTHORIZED`

## Google Drive Structure

```
My Drive/
└── Clear_Progress/
    ├── Clear_Progress_Data.gsheet   (7 entity sheets + Meta)
    └── Covers/                      (goal cover images)
```

## Post-Edit Workflow

After editing source files, call `getDiagnostics` via JetBrains MCP for changed files. Fix any errors immediately without asking.
