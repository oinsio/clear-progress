# Design: spec-sync-protocol

## Context

Clear Progress uses a client-first architecture: all data is stored in IndexedDB, and the server (Google Sheets via GAS) serves as the long-term storage backend. Synchronization is asynchronous, push/pull. The protocol is already fully implemented and working. This document captures the adopted architectural decisions retrospectively.

The related `sync-orchestration` spec describes triggers (when to sync). This document covers the protocol (how to sync).

## Goals / Non-Goals

**Goals:**
- Document existing sync protocol technical decisions (FR1-FR15)
- Justify the chosen approaches for future developers

**Non-Goals:**
- Changing the existing implementation (NG1)
- Describing the orchestration layer (NG2, covered by sync-orchestration)

## Decisions

### D1: Last-Write-Wins (LWW) for conflict resolution

**Decision:** Conflicts are resolved by `updated_at` — the newer record wins.

**Alternatives:**
- CRDT (conflict-free replicated data types) — overkill for a single-user GTD app
- Manual merge UI — poor UX for a personal app where conflicts are rare (one user, multiple devices)

**Rationale:** The app is personal; simultaneous editing of the same record from two devices is unlikely. LWW is the simplest solution with predictable behavior. Context: FR3.

### D2: Dirty flag (needsSync) on the client

**Decision:** Every record in IndexedDB has a boolean `needsSync` flag. On local change — `true`, after successful push — `false`.

**Alternatives:**
- Change log (separate changes table) — more complex, requires garbage collection
- Timestamp-based (compare updated_at with last_sync_at) — unreliable with clock skew

**Rationale:** Simple, deterministic, clock-independent. Pull does not overwrite records with `needsSync=true` — guaranteeing local changes are preserved. Context: FR4, FR13.

### D3: Server-assigned revisions

**Decision:** The server assigns a monotonically increasing `revision` on push. The client requests `pull(since_revision)` and receives only new records.

**Alternatives:**
- Timestamp-based sync — clock skew issues between client and server
- Vector clocks — overkill for single-user

**Rationale:** Revision is the only atomic way to guarantee the client doesn't miss changes. The server assigns revisions under script lock, eliminating race conditions. Context: FR5.

### D4: Settings without revision — filtering by updated_at

**Decision:** Settings do not participate in the revision system. Instead, the client sends `settings_updated_at` in the pull request, and the server returns only updated settings.

**Alternatives:**
- Include settings in revision — complicates the protocol without benefit (few settings)

**Rationale:** Settings are key-value pairs without `version`/`revision`. There are few of them, and conflicts are resolved with the same LWW. A separate filtering mechanism is simpler. Context: FR7.

### D5: Cover deduplication via SHA-256

**Decision:** When uploading a cover, the server computes its SHA-256 hash. If a file with that hash already exists in Drive, its ID is returned without re-uploading (`reused: true`).

**Alternatives:**
- No dedup — duplicate files in Drive, quota waste
- Client-side dedup — unreliable without server-side verification

**Rationale:** Saves Drive space. Especially useful during full sync (T7), when all covers are re-uploaded. Context: FR8.

### D6: Soft delete + purge as two-phase deletion

**Decision:** Deletion sets `is_deleted = true`. Records are physically removed only on explicit `purge()` call. The client detects purge via `purge_revision` in the pull response.

**Alternatives:**
- Hard delete immediately — data loss before sync, no undo capability
- Tombstone records — essentially the same but with a separate table

**Rationale:** Soft delete enables undo and ensures deletion syncs correctly (a record with `is_deleted=true` is pushed to the server). Purge is explicit cleanup. Context: FR6.

### D7: Mutex on sync cycle (drop, not queue)

**Decision:** If sync is already running, a repeated call is simply skipped (not queued).

**Rationale:** Data will be synced on the next trigger anyway (periodic, debounced). A queue complicates the implementation without real benefit. Documented in sync-orchestration, mentioned here for completeness.

### D8: Chunked push to avoid GAS timeout

**Decision:** When `needsSync` record count exceeds 200, the client splits push into sequential chunks of 200.

**Alternatives:**
- Single large push — GAS has a 6-minute execution limit, large payloads timeout
- Parallel chunk push — race conditions with server-side revision assignment

**Rationale:** Sequential chunks are simple, respect GAS limits, and maintain revision ordering. The 200 threshold was chosen empirically to stay well within the 6-minute limit. Context: FR16.

### D9: Reorder dirty flag optimization

**Decision:** Reorder methods compare `sort_order` before/after and only mark records with actual changes as `needsSync = true`.

**Alternatives:**
- Mark all reordered records — unnecessary syncs, wastes bandwidth and server time

**Rationale:** Drag-and-drop reorder fires frequently; most records in the list don't change position. Selective dirty marking avoids flooding push with unchanged records. Context: FR18.

### D10: Settings no-op write guard

**Decision:** `SettingsRepository.set()` compares new value with existing before calling `put()`.

**Alternatives:**
- Always write — unnecessary IndexedDB writes and sync cycles

**Rationale:** Settings are written on every toggle/change event. Many events result in the same value (e.g., toggling a switch back and forth). The guard prevents cascading no-op syncs. Context: FR19.

## Risks / Trade-offs

- **[LWW data loss]** When simultaneously editing the same record from two devices, one change will be lost -> Mitigation: single-user app, probability is low
- **[Clock skew]** LWW depends on correct `updated_at` -> Mitigation: client generates timestamps, and the server only compares client timestamps with each other (not with its own clock)
- **[Purge without undo]** After purge, data recovery is impossible -> Mitigation: purge is an explicit user action from the UI
- **[Cover reupload on full sync]** Full sync re-uploads all covers -> Mitigation: SHA-256 dedup prevents duplication
- **[Chunked push partial failure]** If chunk N fails, chunks 1..N-1 are already committed on server -> Mitigation: records from failed chunks retain `needsSync = true`, will be pushed on next sync cycle
- **[Lock timeout under load]** Concurrent pushes from multiple tabs could starve each other -> Mitigation: single-user app, mutex in sync-orchestration prevents concurrent pushes from the same tab
