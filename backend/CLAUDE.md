# Clear Progress — Backend

Google Apps Script backend for GTD app. See root `CLAUDE.md` for data model, API protocol, and shared conventions.

## Quick Commands

```bash
npm run build          # esbuild bundle + copy assets
npm run typecheck      # TypeScript validation
npm run test           # Vitest unit tests
npm run test:mutation  # Stryker mutation testing
```

### Deployment

```bash
# Deploy to Google Apps Script
npx clasp push         # Push code to GAS
npx clasp deploy       # Create new deployment
./deploy.sh            # Full deploy script
```

## Tech Stack

- **Runtime**: Google Apps Script (V8 engine)
- **Language**: TypeScript 5+ (strict mode)
- **Build**: esbuild (IIFE bundle for GAS)
- **Testing**: Vitest + Stryker (mutation testing)
- **Deploy**: clasp (Google Apps Script CLI)
- **Storage**: Google Sheets (7 entity sheets + Meta) + Google Drive (covers)
- **Auth**: Google OAuth (access token verification via tokeninfo endpoint)

## Project Structure

```
src/
├── main.ts              # doGet/doPost entry points (exposed via globalThis)
├── actions/             # Request handlers (one per action)
│   ├── ping.ts
│   ├── init.ts
│   ├── pull.ts
│   ├── push.ts
│   ├── upload-cover.ts
│   ├── upload-covers.ts
│   ├── delete-cover.ts
│   ├── get-cover.ts
│   └── purge.ts
├── sheets/              # Sheet-specific CRUD operations
│   ├── client.ts        # Cached spreadsheet accessor
│   ├── base.ts          # Generic row↔entity conversion, upsert, query
│   ├── tasks.sheet.ts
│   ├── goals.sheet.ts
│   ├── contexts.sheet.ts
│   ├── categories.sheet.ts
│   ├── checklists.sheet.ts
│   ├── ideas.sheet.ts
│   ├── settings.sheet.ts
│   └── meta.sheet.ts
├── helpers/             # Utilities
│   ├── constants.ts     # Sheet names, property keys, date normalization
│   ├── auth.ts          # OAuth token verification + owner check
│   ├── conflict.ts      # Last-write-wins conflict resolution
│   ├── response.ts      # Standard response formatting
│   └── drive.ts         # Google Drive file existence check
└── types/
    └── index.ts         # Shared TypeScript types
```

## Key Patterns

### Date/Time Handling

- **Uses `Date` object** (GAS does not support Temporal API)
- **Timestamps**: ISO 8601 with Z suffix (e.g., `"2025-01-15T10:30:00.000Z"`)
- **Date-only fields** (next_date, appear_date): stored with leading apostrophe in Google Sheets (`'2025-01-15`) to prevent auto-conversion to Date objects
- `normalizeToSheetDate()` — converts any value to text-prefixed date for Sheets
- `toSheetDateValue()` — adds leading apostrophe to ISO date for Sheets text storage
- `toISOStringValue()` — converts Sheet Date objects to ISO 8601 timestamps
- `toISODateValue()` — converts to ISO date (YYYY-MM-DD)
- `isDateOnlyColumn()` — checks if column uses date-only format

### Authentication

- Verifies OAuth access token via Google's tokeninfo endpoint
- First caller's email auto-registered as `OWNER_EMAIL` in PropertiesService
- Subsequent calls must match that email

### Sync & Conflict Resolution

- **Meta sheet**: stores global sync counters (`next_revision`, `purge_revision`) as key-value pairs. See `sheets/meta.sheet.ts`. Constants: `META_KEYS`, `META_INITIAL_REVISION`, `META_INITIAL_PURGE_REVISION` in `helpers/constants.ts`
- **Pull**: reads `next_revision - 1` as `current_revision` and `purge_revision` from Meta sheet; uses `revision` field (not `version`) for filtering; Settings filtered by `updated_at`
- **Push**: validates records, acquires `LockService.getScriptLock()` (30s timeout), reads `next_revision` from Meta sheet, assigns it to all accepted records, then increments and saves `next_revision`
- **Purge**: increments `purge_revision` in Meta sheet after hard-deleting soft-deleted records; clients detect this on next pull and clean up their local soft-deleted records
- **Conflict**: last-write-wins by `updated_at` timestamp comparison

### Response Format

- Success: `{ ok: true, ...data }`
- Error: `{ ok: false, error: "CODE", message: "..." }`
- Error codes: `INVALID_ACTION`, `INVALID_PAYLOAD`, `NOT_INITIALIZED`, `INTERNAL_ERROR`, `FILE_TOO_LARGE`, `FILE_NOT_FOUND`, `UNAUTHORIZED`

### Google Drive Structure

```
My Drive/
└── Clear_Progress/
    ├── Clear_Progress_Data.gsheet   (7 sheets + Meta)
    └── Covers/                      (goal cover images)
```

OAuth scopes: `drive.file`, `drive.readonly`, `spreadsheets`, `script.external_request`.

## Code Conventions

- All exports are named (no default exports)
- GAS global functions exposed via `globalThis` assignment (esbuild IIFE)
- Files: `camelCase.ts` (kebab-case for action files)
- No hardcoded values — use constants from `src/helpers/constants.ts`

## Testing

- Co-locate test files: `*.test.ts` next to implementation
- Mock GAS globals (`SpreadsheetApp`, `PropertiesService`, etc.)
- Mutation testing: `npm run test:mutation` — target ≥95% score

## Post-Edit Workflow

After creating or editing any source file (.ts, .json, .js):
1. Call `getDiagnostics` via the webstorm MCP tool for the changed file
2. If there are errors or warnings — fix them immediately before moving on
3. Do NOT ask for confirmation to fix IDE diagnostics — just fix them