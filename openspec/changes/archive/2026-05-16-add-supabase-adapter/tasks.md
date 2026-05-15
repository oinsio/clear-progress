# Tasks: Add Supabase Adapter

## 1. Package setup

- [x] 1.1 Create `packages/adapter-supabase/` directory structure: `src/`, `tests/`, `supabase/migrations/`, `supabase/functions/`, `scripts/` (FR1, D6)
- [x] 1.2 Create `package.json` with dependencies: `@clear-progress/contract`, `@supabase/supabase-js`, dev: `typescript`, `vitest` (FR1, D6)
- [x] 1.3 Create `tsconfig.json` extending `../../tsconfig.base.json` (D6)
- [x] 1.4 Create `vitest.config.ts` (D6)
- [x] 1.5 Add `packages/adapter-supabase` to `pnpm-workspace.yaml` if needed, run `pnpm install` (D6)

## 2. Database schema (migrations)

- [x] 2.1 Create migration `001_create_tables.sql`: tables for tasks, goals, ideas, contexts, categories, checklist_items with `user_id`, proper types (TIMESTAMPTZ, DATE), constraints, and `(user_id, revision)` indexes (FR7, FR12, FR13)
- [x] 2.2 Add settings table with composite PK `(user_id, key)` to migration (FR7)
- [x] 2.3 Add sync_meta table with composite PK `(user_id, key)` to migration (FR3)
- [x] 2.4 Add covers metadata table with `(user_id, data_hash)` index to migration (FR10)
- [x] 2.5 Create migration `002_create_rls_policies.sql`: enable RLS and create policies on all tables (`user_id = auth.uid()`) (FR8)
- [x] 2.6 Create Storage bucket `covers` config and RLS policy for user-scoped access (FR10, FR11)
- [x] 2.7 Create migration `003_create_push_rpc.sql`: PostgreSQL RPC function `push_records` that accepts user_id and entity arrays, acquires `FOR UPDATE` lock on `sync_meta`, assigns revision, upserts records, increments `next_revision`, returns per-record results (FR3, D1)

## 3. Edge Functions — shared utilities

- [x] 3.1 Create shared helper: auth extraction (`getAuthenticatedUserId` from JWT), error response formatting, CORS headers (FR9)
- [x] 3.2 Create shared helper: datetime serialization (TIMESTAMPTZ → ISO 8601 Z, DATE → YYYY-MM-DD) (FR14)
- [x] 3.3 Create shared helper: Supabase client initialization (service role for DB, user token for Storage) (D1)
- [x] 3.4 Create shared constants: error codes, cover storage path builder with prefix logic (FR10)

## 4. Edge Functions — lifecycle

- [x] 4.1 Implement `/ping` Edge Function: GET, no auth required, check sync_meta for initialized status when token present (FR6)
- [x] 4.2 Implement `/init` Edge Function: POST, create sync_meta rows (next_revision=1, purge_revision=0) with INSERT ON CONFLICT DO NOTHING (FR5)

## 5. Edge Functions — sync protocol

- [x] 5.1 Implement `/pull` Edge Function: query all entity tables WHERE user_id AND revision > since_revision, filter settings by updated_at, return current_revision and purge_revision (FR4, FR14)
- [x] 5.2 Implement `/push` Edge Function: validate payload, call `supabase.rpc('push_records', ...)` to delegate transactional logic (FOR UPDATE lock, revision assignment, upsert, conflict detection) to the PostgreSQL RPC function, format and return per-record results (FR3, NFR-P2, D1)
- [x] 5.3 Implement `/purge` Edge Function: DELETE FROM all entity tables WHERE user_id AND is_deleted = true, increment purge_revision, return counts (FR1)

## 6. Edge Functions — covers

- [x] 6.1 Implement `/upload-cover` Edge Function: check hash dedup, upload to Storage at prefix path, insert covers row (FR10)
- [x] 6.2 Implement `/upload-covers` Edge Function: batch processing (max 10), per-item error handling, partial failure support (FR10)
- [x] 6.3 Implement `/get-cover` Edge Function: lookup covers table, download from Storage, return base64-encoded data (FR1)
- [x] 6.4 Implement `/delete-cover` Edge Function: decrement ref_count, delete from Storage and table when ref_count reaches 0 (FR1)

## 7. Client adapter

- [x] 7.1 Implement `SupabaseSyncAdapter` class: constructor with `url` and `getAccessToken`, private HTTP request helper with timeout (30s), Bearer token, response validation (FR1)
- [x] 7.2 Implement `ping()` method: GET to `/ping`, no auth header (FR6)
- [x] 7.3 Implement `init()`, `pull()`, `push()` methods: POST with JSON body, auth header, Zod schema validation (FR1)
- [x] 7.4 Implement cover methods: `uploadCover()`, `uploadCovers()`, `getCover()`, `deleteCover()` (FR1)
- [x] 7.5 Implement `purge()` method (FR1)
- [x] 7.6 Create `src/index.ts` with public exports (D6)

## 8. Adapter registration

- [x] 8.1 Update `packages/adapter-loader/src/index.ts`: import and register `SupabaseSyncAdapter` with key `"supabase"` (FR16, D8)

## 9. Contract tests

- [x] 9.1 Create `tests/contract.test.ts`: run `syncAdapterContract()` with `SupabaseSyncAdapter` factory against a test Supabase instance (FR2, M1)
- [x] 9.2 Verify all existing contract tests pass without modifications (FR2)

## 10. Multi-user isolation tests

- [x] 10.1 Write test: two users push data → each user's pull returns only their own records (FR8, M2)
- [x] 10.2 Write test: User A cannot read User B's covers from Storage (FR11, M2)
- [x] 10.3 Write test: User A's push does not affect User B's revision counter (FR3, FR8)

## 11. Deployment & documentation

- [x] 11.1 Create `scripts/deploy.sh`: apply migrations, deploy Edge Functions, create Storage bucket (FR17, M4)
- [x] 11.2 Create `README.md`: prerequisites, Supabase project setup, env vars, deploy steps, client configuration, troubleshooting (M4)
- [x] 11.3 Create `.env.example` with required environment variables (D7)

## 12. FK constraints optimization

- [x] 12.1 Update `001_create_tables.sql`: reorder CREATE TABLE to dependency order (contexts, categories, covers, goals, ideas, tasks, checklist_items); change FK fields from TEXT to UUID with DEFERRABLE FK constraints (FR18)
- [x] 12.2 Update `003_create_push_rpc.sql`: reorder processing to dependency order; use `NULLIF(..., '')::UUID` for FK deserialization, `COALESCE(...::text, '')` for conflict serialization (FR18, FR19)
- [x] 12.3 Update `_shared/serializers.ts`: handle NULL FK fields with `?? ''` for wire compatibility (FR18)
- [x] 12.4 Update `SyncService.ts`: change chunk fill order to dependency order (FR19)
- [x] 12.5 Update `SyncService.push-chunks.test.ts`: adjust test expectations for new chunk order (FR19)

## 13. Integration verification

- [x] 13.1 Run `pnpm build` — verify TypeScript compiles across all packages (FR1)
- [x] 13.2 Run `pnpm lint` — verify no linting errors (FR1)
- [x] 13.3 Deploy to test Supabase instance, run contract tests against it (FR2, M1)
- [x] 13.4 Manual smoke test: connect client to Supabase backend, create task, verify sync round-trip (M1)
