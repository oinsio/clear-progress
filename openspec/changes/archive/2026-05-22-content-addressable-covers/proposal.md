# Content-Addressable Covers

## Why

Goal cover images are identified by server-specific file IDs (Google Drive File ID or Supabase UUID). When a user switches backends, all cover references become invalid — images are lost. This creates a server-lock situation that contradicts the app's swappable-backend architecture. Since the app is pre-production, now is the ideal time to fix the data model before any users are affected.

## What Changes

- **BREAKING**: `cover_file_id` field in Goal entity renamed to `cover_hash` (SHA-256 hex string)
- **BREAKING**: Cover API protocol switches from server-specific `file_id` to content-addressable `data_hash`
- `"local:"` prefix mechanism eliminated — hash is computed client-side immediately, no intermediate state
- Server adapters handle file storage internally; clients never see storage-specific identifiers
- IndexedDB schema migrated: covers and pending_covers tables re-keyed by `data_hash`

## Goals

- G1: Users can switch between GAS and Supabase backends without losing cover images
- G2: Client code has zero knowledge of server-side file storage details
- G3: Cover lifecycle simplified by removing the `local:` → `server_file_id` mapping step

## Non-Goals

- NG1: Supporting multiple backends simultaneously (one active backend at a time)
- NG2: Automatic cover migration on backend switch (manual full sync is acceptable)
- NG3: Changing cover image formats, sizes, or validation rules

## Users & Scenarios

- U1: User with goals that have covers switches from GAS to Supabase. After full sync, all covers display correctly on the new backend.
- U2: User uploads a cover while offline. The hash is computed immediately and the goal displays the cover from local cache. On reconnect, the cover syncs to server.
- U3: Two goals share the same cover image. Server deduplicates by hash, maintaining a single stored copy with ref_count.

## Requirements

### Functional

- FR1: Goal entity uses `cover_hash` (SHA-256 hex string or `""`) instead of `cover_file_id`
- FR2: `uploadCover` API returns `{ data_hash, reused }` — no server file ID exposed to client
- FR3: `getCover` API accepts `{ hashes: string[] }` and returns cover data keyed by hash
- FR4: `deleteCover` API accepts `{ hash, goal_id }` and manages ref_count by hash
- FR5: Cover hash is computed client-side at file selection time — it is the final, stable identifier
- FR6: Pending cover lifecycle uses `data_hash` as primary key (no `local_id` or prefix)
- FR7: Server adapters (GAS, Supabase) map hash to internal storage format transparently
- FR8: IndexedDB schema migrates covers and goals data to hash-based keys

### Non-Functional

#### Performance

- NFR-P1: SHA-256 computation for a 2MB image completes in under 100ms on modern devices

## UX Acceptance Criteria

- UX1: Cover upload/display behavior is identical to current — no visible UX changes
- UX2: After backend switch + full sync, covers appear without user intervention beyond triggering sync

## Behavior

No new Gherkin features required. Existing cover_lifecycle.feature and cover_upload.feature scenarios updated to use `cover_hash` terminology.

## Visual Reference

No visual changes. Cover display is identical.

## Affected IA

No changes to information architecture.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cover-sync-protocol`: Cover identification changes from `file_id` to `data_hash` across all operations
- `supabase-schema`: Goals table column renamed, FK constraint removed
- `supabase-edge-functions`: Cover endpoints accept/return hash instead of file_id

## Impact

- **Contract package**: WireGoalSchema, cover protocol types, API response schemas
- **Client package**: CoverService, CoverSyncService, LocalCoverCache, CoverRepository, PendingCoverRepository, GoalService, ~29 UI files, IndexedDB schema migration, all cover-related tests
- **GAS adapter**: Goal types, sheet headers, all cover actions (upload/get/delete)
- **Supabase adapter**: SQL migration, push RPC, all edge functions (upload/get/delete), serializers
- **Integration tests**: covers-sync, goals-sync, multi-device-sync
- **Documentation**: data-model-and-sync.md, API docs, OpenSpec specs

## Success Metrics

- M1: All existing cover-related tests pass with hash-based identifiers
- M2: Mutation testing score >= 95% on changed files
- M3: Integration tests confirm cover sync works on both GAS and Supabase adapters
- M4: Zero references to `cover_file_id` or `LOCAL_COVER_ID_PREFIX` remain in codebase

## Open Questions

None — approach validated during explore phase.
