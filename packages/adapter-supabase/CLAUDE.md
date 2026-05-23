# Clear Progress — Backend (Supabase)

See root `CLAUDE.md` for data model, API protocol, shared conventions.

## Structure

- `src/` — client-side adapter (`SupabaseSyncAdapter` implementing `SyncAdapter` port)
- `supabase/functions/` — Deno Edge Functions (server-side sync logic)
- `supabase/migrations/` — PostgreSQL migrations (tables, RLS policies, `push_records` RPC)
- `scripts/` — deploy and reset-db helpers

## Deploy

```bash
SUPABASE_PROJECT_REF=your-ref bash scripts/deploy.sh   # migrations + functions + storage bucket
bash scripts/reset-db.sh                                # wipe and re-apply migrations
```

## Gotchas

- **Edge Functions are Deno** — TypeScript with Deno imports, NOT Node.js. Shared code lives in `supabase/functions/_shared/`
- **RLS enforced** — every table has Row Level Security policies; adapter uses anon key (not service role)
- **`push_records` RPC** — atomic revision assignment with `FOR UPDATE` lock; concurrent pushes from the same user may hit `SYNC_LOCK_TIMEOUT`
- **Auth** — JWT extracted from `Authorization` header via `supabase.auth.getUser()`; `ApiAuthError` thrown on 401
- **Response validation** — every Edge Function response is validated with Zod schemas from `@clear-progress/contract`
- **Cover storage** — Supabase Storage bucket `covers` with content-addressable paths: `{userId[0:2]}/{userId}/{dataHash[0:2]}/{fileId}.{ext}`

## Edge Functions

`ping`, `init`, `pull`, `push`, `purge`, `upload-cover`, `upload-covers`, `get-cover`, `delete-cover`

## Testing

- **Contract tests** require a live Supabase instance — set `TEST_SUPABASE_*` env vars in `.env` (see `.env.example`)
- Tests are skipped automatically when env vars are missing
- Integration tests live in `packages/integration` (Playwright + Testcontainers)
