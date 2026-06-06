# Clear Progress — Backend (Supabase)

See root `CLAUDE.md` for data model, API protocol, shared conventions.

## Structure

- `src/` — client-side adapter (`SupabaseSyncAdapter` implementing `SyncAdapter` port)
- `supabase/functions/` — Deno Edge Functions (server-side sync logic)
- `supabase/migrations/` — PostgreSQL migrations (tables, RLS policies, `push_records` RPC)
- `scripts/` — deploy and reset-db helpers

## Deploy

```bash
bash scripts/deploy.sh prod     # deploy to production
bash scripts/deploy.sh qa       # deploy to QA
bash scripts/deploy.sh dev      # deploy to dev
bash scripts/reset-db.sh qa     # wipe and re-apply migrations for QA
# Environment argument is required — no default to prevent accidental deploys
```

Env files: copy `.env.{env}` → `.env.{env}.local` and fill in real values.

## Gotchas

- **Edge Functions are Deno** — TypeScript with Deno imports, NOT Node.js. Shared code lives in `supabase/functions/_shared/`
- **RLS enforced** — every table has Row Level Security policies; adapter uses anon key (not service role)
- **`push_records` RPC** — atomic revision assignment with `FOR UPDATE` lock; concurrent pushes from the same user may hit `SYNC_LOCK_TIMEOUT`
- **Auth** — JWT extracted from `Authorization` header via `supabase.auth.getUser()`; `ApiAuthError` thrown on 401
- **Response validation** — every Edge Function response is validated with Zod schemas from `@clear-progress/contract`
- **File storage** — Supabase Storage bucket `files` with content-addressable paths: `{userId[0:2]}/{userId}/{dataHash[0:2]}/{fileId}.{ext}`

## Edge Functions

`ping`, `init`, `pull`, `push`, `purge`, `upload-file`, `upload-files`, `get-file`, `delete-file`

## Testing

- **Contract tests** require a live Supabase instance — set `TEST_SUPABASE_*` env vars in `.env` (see `.env.example`)
- Tests are skipped automatically when env vars are missing
- Integration tests live in `packages/integration` (Playwright + Testcontainers)
