## Context

Goal cover images are identified by `cover_file_id` — a server-specific identifier (Google Drive File ID or Supabase UUID). This creates server-lock: switching backends invalidates all cover references. The SHA-256 hash is already computed client-side and stored server-side for deduplication, but it is not used as the primary identifier in the API contract.

Driven by FR1-FR8 from proposal.

## Goals / Non-Goals

**Goals:**
- Replace `cover_file_id` with `cover_hash` (SHA-256) as the sole cover identifier at all levels
- Eliminate the `"local:"` prefix mechanism — hash is the final ID from the moment of selection
- Keep server-side storage implementation (Drive/Storage) as internal detail

**Non-Goals:**
- Changing the covers table PK in Supabase (internal `file_id` UUID remains for storage path mapping)
- Adding backward compatibility with old `cover_file_id` field in wire protocol

## Decisions

### D1: Hash as primary cover identifier (FR1, FR2, FR3, FR4)

**Decision:** SHA-256 `data_hash` replaces `cover_file_id` at every level: wire protocol, IndexedDB, and server API.

**Alternatives considered:**
- Dual-ID model (keep both `cover_file_id` and `cover_hash` in Goal) — rejected: adds complexity, `cover_file_id` is still server-specific
- Migration flow only (detect orphans on switch) — rejected: band-aid, doesn't fix the root cause

**Rationale:** The hash is already computed and stored. Making it the primary key is a natural extension that eliminates server-lock entirely.

### D2: Supabase covers table keeps internal file_id UUID (FR7)

**Decision:** The `covers` table in Supabase retains `file_id UUID` as PK for internal storage path generation. The `goals` table replaces `cover_file_id UUID FK` with `cover_hash TEXT` (no FK constraint). Lookups go through `data_hash` column (already indexed as `idx_covers_user_hash`).

**Rationale:** Changing the covers table PK would require rebuilding storage paths and is unnecessary — the internal ID is never exposed to clients.

### D3: No FK constraint on goals.cover_hash (FR1)

**Decision:** `goals.cover_hash` is a TEXT column without FK to `covers`. Data integrity is maintained by the cover sync protocol (ref_count, dedup).

**Alternatives considered:**
- FK to covers.data_hash — rejected: `data_hash` is not unique per-table (only unique per `(user_id, data_hash)`), and cross-table FK on non-PK requires additional constraints

**Rationale:** The cover sync protocol already handles lifecycle management. FK would add complexity without meaningful safety since the relationship is managed by application logic.

### D4: Eliminate "local:" prefix entirely (FR5, FR6)

**Decision:** Remove `LOCAL_COVER_ID_PREFIX`. When user selects an image, SHA-256 is computed immediately and set as `goal.cover_hash`. Pending covers use `data_hash` as PK.

**Rationale:** The prefix existed because the final server `file_id` was unknown until upload. With hash as the identifier, the final value is known instantly on the client.

### D5: GAS auto-migration in init() (FR7)

**Decision:** When GAS `init()` detects old column header `cover_file_id`, it auto-migrates: reads SHA-256 hash from each Drive file's `description` field, writes to new `cover_hash` column, renames header.

**Alternatives considered:**
- Separate migration script — rejected: users self-deploy GAS, they won't run scripts manually
- No migration (breaking change) — rejected: loses data unnecessarily

**Rationale:** Auto-migration on init is invisible to the user and handles the transition gracefully.

## Risks / Trade-offs

- [Breaking wire protocol] All clients and servers must be updated together. Pre-production, so acceptable. No backward compatibility needed.
- [GAS column rename] Existing deployed GAS instances break until re-deployed. Mitigated by auto-migration in init().
- [No FK on cover_hash] Dangling references possible if cover delete fails mid-operation. Mitigated by ref_count protocol — orphaned covers are cleaned up during full sync reupload.
- [IndexedDB migration] Must handle edge case: goals with `"local:"` prefix covers that haven't been synced yet. Migration looks up hash from `pending_covers` table.
