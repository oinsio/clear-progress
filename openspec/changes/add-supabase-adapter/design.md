# Design: Add Supabase Adapter

## Context

Clear Progress uses a hexagonal architecture with a `SyncAdapter` port interface. Currently, two adapters exist: `adapter-gas` (production, Google Apps Script + Sheets) and `adapter-inmemory` (testing). The contract package already defines `BackendType = "gas" | "supabase"` and `SupabaseConnectionConfig`, but no Supabase adapter implementation exists.

The GAS backend is single-user (one spreadsheet per user). Supabase enables multi-user on a single deployment via PostgreSQL Row Level Security.

## Goals / Non-Goals

**Goals:**
- Implement `SyncAdapter` for Supabase that passes all contract tests (FR1, FR2)
- Multi-user data isolation via RLS (FR7, FR8)
- Automated deployment from repository (FR17)

**Non-Goals:**
- Changing the wire protocol or `SyncAdapter` interface
- Real-time sync (Supabase Realtime)
- User management UI (admin panel)

## Decisions

### D1: Hybrid approach — Edge Functions + PostgreSQL RPC for push

**Choice**: Supabase Edge Functions (Deno) handle all sync operations using `@supabase/supabase-js`. For push, the Edge Function delegates transactional logic to a PostgreSQL RPC function via `supabase.rpc(...)`. The RPC function encapsulates `FOR UPDATE` row lock and transaction semantics inside a server-side PostgreSQL function.

**Alternatives considered**:
- *Direct DB access via Supabase JS SDK + RLS*: Simpler, but push logic (revision assignment with lock) requires transactional guarantees that are hard to achieve from client-side calls. Conflict resolution logic would leak into the client adapter.
- *Pure PostgreSQL RPC functions for everything*: Possible, but harder to debug, test, and deploy. Edge Functions give familiar TypeScript environment for non-transactional operations.
- *Raw SQL in Edge Functions for push*: Would require managing transaction lifecycle manually in TypeScript. RPC function is cleaner and ensures atomicity at the database level.

**Rationale**: Edge Functions mirror the GAS architecture (client adapter → HTTP → server logic). Most operations (pull, init, ping, covers, purge) work well with `@supabase/supabase-js` directly. Push requires `BEGIN → SELECT FOR UPDATE → INSERT/UPDATE → COMMIT` which maps naturally to a PostgreSQL RPC function, combining the convenience of the JS client with the transactional guarantees of a server-side function. Driven by FR3.

### D2: Supabase Auth with JWT (not custom auth)

**Choice**: Supabase Auth handles registration/login. Edge Functions extract `user_id` from the JWT bearer token via `supabase.auth.getUser()`.

**Rationale**: No custom auth code needed. JWT is verified by Supabase infrastructure. RLS policies use `auth.uid()` automatically. Driven by FR9.

### D3: sync_meta table with FOR UPDATE lock (not sequence)

**Choice**: Per-user `sync_meta` table with composite PK `(user_id, key)`. Push uses `SELECT ... FOR UPDATE` to serialize concurrent pushes for the same user.

**Alternatives considered**:
- *PostgreSQL SEQUENCE*: Lock-free but creates gaps in revision numbers. More importantly, a single shared sequence across users would serialize all pushes globally.
- *Per-record trigger with sequence*: Changes the contract (different revisions per record in a batch).

**Rationale**: 1:1 match with GAS behavior. Per-user row lock means different users don't block each other. Driven by FR3.

### D4: TIMESTAMPTZ (UTC) for datetime, DATE for date-only

**Choice**: `TIMESTAMPTZ` for `created_at`, `updated_at`, `completed_at`. `DATE` for `next_date`, `appear_date`. All TIMESTAMPTZ values stored and transmitted in UTC.

**Alternatives considered**:
- *TEXT fields (as in Google Sheets)*: No DB-level validation, no type safety, inefficient indexing.

**Rationale**: PostgreSQL validates and indexes natively. Edge Functions serialize to ISO 8601 (`Z` suffix) / `YYYY-MM-DD` for wire protocol compatibility. Driven by FR12, FR13, FR14.

### D5: Supabase Storage with prefix-based folder layout

**Choice**: Single bucket `covers`. Path: `{user_id[0:2]}/{user_id}/{data_hash[0:2]}/{file_id}.{ext}`. For 1-char user_id, prefix is the single char.

**Alternatives considered**:
- *Flat layout (user_id/file_id)*: Hard to navigate with many users and many files.
- *Database BYTEA storage*: Bloats the database, no CDN benefit.

**Rationale**: Prefix folders aid manual debugging/support. Hash prefix distributes files evenly within a user's folder. Supabase Storage provides CDN and access control. Driven by FR10, FR11.

### D6: Package structure follows existing pattern

```
packages/adapter-supabase/
  src/
    supabase-sync-adapter.ts    -- SyncAdapter implementation (HTTP client)
    index.ts                     -- public API
  tests/
    contract.test.ts             -- syncAdapterContract() test
  supabase/
    migrations/
      001_create_tables.sql      -- entity tables, sync_meta, covers
      002_create_rls_policies.sql -- RLS policies
      003_create_push_rpc.sql       -- push_records RPC function (D1)
    functions/
      ping/index.ts
      init/index.ts
      pull/index.ts
      push/index.ts
      upload-cover/index.ts
      upload-covers/index.ts
      get-cover/index.ts
      delete-cover/index.ts
      purge/index.ts
    seed.sql                     -- (optional) test data
  scripts/
    deploy.sh                    -- automated deployment
  package.json
  tsconfig.json
  vitest.config.ts
  README.md                     -- setup & deployment guide
```

### D7: Edge Function routing — one function per action (not single entry point)

**Choice**: Separate Edge Function per action (`/ping`, `/init`, `/pull`, etc.).

**Alternatives considered**:
- *Single function with action routing (as in GAS)*: GAS uses `doPost` with `action` field. Supabase Edge Functions are naturally per-endpoint.

**Rationale**: Supabase Edge Functions are deployed individually. Separate functions give independent scaling, clearer logs, and simpler code. Each function is small and focused.

### D8: adapter-loader integration

**Choice**: Add `adapter-supabase` to `adapter-loader` with conditional import, mirroring the GAS pattern.

```typescript
// packages/adapter-loader/src/index.ts
import { SupabaseSyncAdapter } from "@clear-progress/adapter-supabase";
registerAdapter("supabase", (url, getAccessToken) =>
  new SupabaseSyncAdapter(url, getAccessToken)
);
```

**Rationale**: Follows existing pattern. `getAccessToken` returns Supabase session JWT. Driven by FR16.

### D9: Shared module for Edge Function common code

**Choice**: Extract common code into a `_shared/` directory within `supabase/functions/`. Edge Functions import shared utilities via Deno `import_map.json`. Shared modules include: Supabase client initialization, auth extraction (`getAuthenticatedUserId`), error response formatting, CORS headers, datetime serialization, and constants (error codes, storage path builder).

**Alternatives considered**:
- *Self-contained functions (copy-paste)*: Each function includes all code it needs. Simpler deployment, but duplicates auth/client/error logic across 9 functions. Bug fixes require editing all 9.

**Rationale**: With 9 Edge Functions sharing auth extraction, client init, error formatting, and datetime serialization, duplication would be a maintenance burden and a source of inconsistencies. Supabase officially supports shared modules via `import_map.json`. Driven by D7 (separate functions per action).

### D10: DEFERRABLE FK constraints with dependency-ordered processing

**Choice**: FK reference fields (`goal_id`, `context_id`, `category_id`, `original_task_id` in tasks; `cover_file_id` in goals; `task_id` in checklist_items) use `UUID` type with `DEFERRABLE INITIALLY DEFERRED` FK constraints. Nullable FK fields store `NULL` instead of empty string. Push RPC and client-side chunking process entities in dependency order: contexts → categories → goals → ideas → tasks → checklist_items → settings.

**Alternatives considered**:
- *TEXT fields with empty string (status quo)*: No referential integrity, 36 bytes vs 16 bytes per UUID, slower string comparison.
- *IMMEDIATE FK constraints*: Would require strict processing order in RPC with no tolerance for future reordering. DEFERRABLE checks at COMMIT, providing a safety net if order is accidentally changed.
- *Pre-check validation in RPC*: Extra SELECT queries before each INSERT to verify FK targets exist. Over-engineering for current scale.

**Rationale**: DEFERRABLE provides double safety — correct order guarantees FK satisfaction in normal flow, deferred check catches edge cases (client bugs, race conditions). `UUID` type saves storage (16 vs 36 bytes) and enables faster indexed lookups. `NULL` is semantically correct for "no value" in PostgreSQL and enables proper FK constraints. Wire protocol unchanged — serializers convert `NULL ↔ ''`. Driven by FR18, FR19.

## Risks / Trade-offs

- **[Risk] Edge Function cold starts** may add 200-500ms latency on first request after idle period. Mitigation: Supabase keeps functions warm for ~60s; ping on app open pre-warms.
- **[Risk] FOR UPDATE lock timeout** under concurrent pushes from same user (multiple tabs). Mitigation: 10-second timeout (NFR-P2), client retries with backoff.
- **[Risk] Supabase free tier limits** (500MB DB, 1GB Storage, 500K Edge Function invocations/month). Mitigation: Personal app with low volume; document limits in README.
- **[Trade-off] Separate Edge Functions vs single entry point**: More files to deploy but cleaner separation. Acceptable for 9 functions.
- **[Trade-off] Cover storage via Storage API vs DB BYTEA**: External dependency but better performance and CDN. Worth it for binary data.

## Migration Plan

No data migration needed — this is a new adapter. Existing GAS users are unaffected.

**Deployment steps** (new Supabase project):
1. Create Supabase project (dashboard or CLI)
2. Run `supabase db push` to apply migrations
3. Deploy Edge Functions: `supabase functions deploy`
4. Create Storage bucket `covers` with RLS
5. Configure client: set backend type to "supabase", provide URL and anon key

**Rollback**: Switch client back to GAS backend. No shared state between backends.

## Open Questions

None — all resolved.

## Resolved Questions

- Q1: **Hybrid approach** — Edge Functions use `@supabase/supabase-js` for all operations (pull, init, ping, covers, purge), and a PostgreSQL RPC function (`supabase.rpc(...)`) for push. See D1.
- Q2: **Shared module** — Edge Functions share common code (auth extraction, Supabase client init, error formatting, datetime serialization, constants) via a `_shared/` directory with `import_map.json`. See D9.
