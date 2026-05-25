## Context

Purge is fully implemented at all levels (GAS, Supabase, in-memory, SyncService, UI). However, the specification exists only as 3 scenarios within the sync-protocol spec (FR6). There is no dedicated spec for server-side validation, response structure, and per-entity-type behavior. BDD tests cover sync coordination, but server logic is covered only by unit tests without feature files.

## Goals / Non-Goals

**Goals:**
- Create a dedicated purge spec with full server-side behavior description (FR1-FR5)
- Link sync-protocol spec to the new purge spec via delta
- Verify existing tests match the specification (FR6-FR8)

**Non-Goals:**
- Changing the purge implementation
- Duplicating sync-level scenarios (they remain in sync_soft_delete.feature)
- E2E tests for UI

## Decisions

### D1: Dedicated purge spec instead of extending sync-protocol

Purge is a standalone operation with its own validation, response, and behavior. Server-side logic (strict confirm, per-type deletion, purge_revision) is orthogonal to sync coordination. Separation simplifies navigation and search.

**Alternative**: Extend sync-protocol spec. Rejected — the file is already 300+ lines, and purge server logic is orthogonal to push/pull.

### D2: Server-side purge spec only, client coordination stays in sync-protocol

Server-side purge (validation, deletion, response) belongs in the purge spec. Client-side coordination (SyncService.purge, pull detection, local cleanup) belongs in sync-protocol because it is part of the pull/push flow. Cross-references link both specs.

**Alternative**: Move all purge behavior into purge spec. Rejected — client-side purge detection is inherently part of the pull protocol.

### D3: No new BDD tests for adapter-gas

Neither adapter-gas nor adapter-supabase have vitest-cucumber installed. All BDD tests live in packages/client. Server purge is already well covered by unit tests (purge.validation.test.ts, purge.deletion.test.ts) and contract tests (sync-adapter.contract.ts). Adding vitest-cucumber to adapter-gas solely for this change is not justified.

**Alternative**: Install vitest-cucumber in adapter-gas. Rejected — disproportionate effort for a documentation-only change.

## Risks / Trade-offs

- [Risk] sync-protocol delta may become stale → Minimal delta — only a cross-reference to purge spec.
