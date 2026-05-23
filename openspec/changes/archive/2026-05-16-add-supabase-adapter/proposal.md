# Add Supabase Adapter

## Why

Clear Progress currently depends on a single backend — Google Apps Script + Google Sheets. This creates vendor lock-in, limits scalability to one user per spreadsheet, and makes the backend hard to develop and debug. Supabase provides a production-grade PostgreSQL backend with built-in auth, storage, and row-level security — enabling multi-user support out of the box.

## What Changes

- **ADDED**: New package `@clear-progress/adapter-supabase` implementing `SyncAdapter` interface
- **ADDED**: Supabase Edge Functions for push/pull/covers/purge server logic
- **ADDED**: PostgreSQL schema with migrations (all entity tables + sync_meta + covers)
- **ADDED**: Row Level Security (RLS) policies for multi-user data isolation
- **ADDED**: Supabase Auth integration for user authentication
- **ADDED**: Supabase Storage integration for goal cover images
- **ADDED**: Deployment scripts and instructions for Supabase setup
- **ADDED**: `adapter-loader` registration for supabase adapter

## Goals

- G1: Provide an alternative backend that supports multiple users on a single deployment
- G2: Maintain full compatibility with existing `SyncAdapter` contract (all contract tests pass)
- G3: Leverage Supabase managed services (Auth, Storage, RLS) instead of custom solutions

## Non-Goals

- NG1: Migrating existing GAS users to Supabase — GAS adapter remains fully supported
- NG2: Real-time sync (Supabase Realtime) — current pull-based polling is sufficient
- NG3: UI changes — backend selection already exists in client settings
- NG4: Multi-device conflict resolution changes — existing last-write-wins protocol is preserved

## Users & Scenarios

- U1: New user who wants a self-hosted backend without Google account dependency
- U2: Developer who wants to run Clear Progress for a small team (each user sees only their data)
- U3: Existing user who wants to switch from GAS to Supabase for better reliability

## Requirements

### Functional

- FR1: `SupabaseSyncAdapter` SHALL implement all 9 methods of `SyncAdapter` interface (ping, init, pull, push, uploadCover, uploadCovers, getCover, deleteCover, purge)
- FR2: All existing contract tests (`syncAdapterContract`) SHALL pass with the new adapter
- FR3: `push` Edge Function SHALL use `sync_meta` table with `FOR UPDATE` row lock for revision assignment (1:1 with GAS behavior)
- FR4: `pull` Edge Function SHALL return records with `revision > since_revision` for the authenticated user
- FR5: `init()` SHALL create per-user rows in `sync_meta` (next_revision=1, purge_revision=0) if not exists; idempotent
- FR6: `ping()` SHALL work without authentication, returning `{ ok: true, initialized: false }`; with valid auth token SHALL check user's `sync_meta` presence and return actual `initialized` status
- FR7: Every entity table SHALL have `user_id UUID NOT NULL REFERENCES auth.users(id)` column
- FR8: RLS policies SHALL ensure users can only read/write their own data (`user_id = auth.uid()`)
- FR9: Edge Functions SHALL extract `user_id` from JWT token, never from request payload
- FR10: Cover files SHALL be stored in Supabase Storage bucket `covers` with path layout: `{user_id_prefix_2}/{user_id}/{hash_prefix_2}/{file_id}.{ext}` (1-char user_id edge case: prefix = single char)
- FR11: Storage RLS SHALL restrict access to user's own folder
- FR12: Datetime fields (created_at, updated_at, completed_at) SHALL use `TIMESTAMPTZ` stored in UTC
- FR13: Date-only fields (next_date, appear_date) SHALL use `DATE` type (no timezone)
- FR14: Edge Functions SHALL serialize TIMESTAMPTZ as ISO 8601 with Z suffix (`2025-01-15T10:30:00.000Z`) and DATE as `YYYY-MM-DD` in responses
- FR15: Database schema SHALL be created via Supabase CLI migrations, not dynamically
- FR16: Adapter SHALL be registered in `adapter-loader` as `registerAdapter("supabase", factory)`
- FR17: Deployment scripts SHALL automate: migrations apply, Edge Functions deploy, Storage bucket creation
- FR18: FK reference fields (`goal_id`, `context_id`, `category_id`, `original_task_id`, `cover_file_id`, `task_id`) SHALL use `UUID` type with `DEFERRABLE INITIALLY DEFERRED` FK constraints; nullable fields use `NULL` (not empty string) when unset
- FR19: Push RPC function and client-side chunking SHALL process entities in dependency order: contexts, categories, goals, ideas, tasks, checklist_items, settings

### Non-Functional

#### Performance

- NFR-P1: Push/pull round-trip SHALL complete within 2 seconds for up to 500 records
- NFR-P2: `FOR UPDATE` lock on `sync_meta` SHALL timeout after 10 seconds with `SYNC_LOCK_TIMEOUT` error

#### Accessibility

No UI changes — not applicable.

#### Responsive

No UI changes — not applicable.

## UX Acceptance Criteria

- UX1: User SHALL be able to select "Supabase" as backend type in connection settings (existing UI)
- UX2: User SHALL provide Supabase URL and anon key to connect (existing connection config form)

## Behavior

Behavioral specifications covered by existing contract tests in `@clear-progress/contract/contracts`. No new Gherkin features required — adapter must pass `syncAdapterContract()`.

## Visual Reference

No UI changes.

## Affected IA

No changes to information architecture.

## Capabilities

### New Capabilities

- `supabase-adapter`: Client-side adapter implementing SyncAdapter for Supabase backend
- `supabase-edge-functions`: Server-side Edge Functions handling push/pull/covers/purge actions
- `supabase-schema`: PostgreSQL schema, migrations, RLS policies, and deployment scripts

### Modified Capabilities

None. Wire protocol and SyncAdapter interface remain unchanged.

## Success Metrics

- M1: All contract tests pass (`syncAdapterContract`) with `SupabaseSyncAdapter`
- M2: Two independent users can sync data to the same Supabase instance without seeing each other's data
- M3: Cover upload/download works via Supabase Storage
- M4: Fresh deployment from scratch completes in under 10 minutes following the instructions

## Resolved Questions

- Q1: **Hybrid approach** — Edge Functions use `@supabase/supabase-js` for all operations (pull, init, ping, covers, purge), and a PostgreSQL RPC function (`supabase.rpc(...)`) for push. The RPC function encapsulates `FOR UPDATE` row lock and transaction logic inside a server-side PostgreSQL function, combining the convenience of the client library with the transactional semantics required by FR3.
- Q2: **Rely on Supabase built-in rate limiting** for now. Custom per-user rate limits may be revisited during production operation if needed.

## Open Questions

None — all resolved.
