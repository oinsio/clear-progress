# Design: Remove Version Field

## Context

Currently, all entities (Task, Goal, Idea, Context, Category, ChecklistItem) have a `version` field that is incremented on every change. This field was originally intended for optimistic concurrency control, but analysis shows it's redundant:

1. **Conflict resolution** uses `updated_at`, not `version`
2. **Change detection** (`hasEntityChanged()`) ignores `version`
3. **Single usage**: `SyncService._applyEntityPushResults()` checks if `version` changed during push to detect concurrent edits

The `version` field can be replaced with `updated_at` for the single usage without losing functionality.

**Current state:**
- `version` is in all Wire schemas, IndexedDB schema, and Google Sheets columns
- `version` is incremented in all entity services when `hasEntityChanged() === true`
- `version` is incremented on server during push when accepting client changes
- `SyncService` tracks `sentVersions` map during push to detect concurrent modifications

**Constraints:**
- No production deployment yet → no data migration needed
- Must maintain 100% sync protocol correctness
- All existing tests must pass (only test data changes allowed)

## Goals / Non-Goals

**Goals:**
- Remove `version` field from all schemas and code
- Replace version-based concurrent edit detection with timestamp-based detection
- Maintain sync protocol correctness (FR2, NFR-R1)
- Keep mutation test score ≥90% (NFR-R2)

**Non-Goals:**
- Data migration (not needed — no production users)
- Changing conflict resolution strategy (still last-write-wins by `updated_at`)
- Changing `hasEntityChanged()` logic (already ignores `version`)

## Decisions

### Decision 1: Use `updated_at` instead of `version` for concurrent edit detection

**Rationale:**
- `version` and `updated_at` change together (both updated when `hasEntityChanged() === true`)
- `updated_at` already used for conflict resolution → single source of truth
- `updated_at` has semantic meaning (timestamp), `version` is just a counter

**Implementation:**
```typescript
// Before
const sentVersions = new Map<string, number>([
  ...tasks.map((task) => [task.id, task.version] as [string, number]),
]);
const sentVersion = sentVersions.get(result.id) ?? 0;
const versionUnchanged = currentRecord.version === sentVersion;

// After
const sentTimestamps = new Map<string, string>([
  ...tasks.map((task) => [task.id, task.updated_at] as [string, string]),
]);
const sentTimestamp = sentTimestamps.get(result.id) ?? "";
const timestampUnchanged = currentRecord.updated_at === sentTimestamp;
```

**Alternatives considered:**
- Keep `version` for concurrent edit detection → rejected: adds complexity for no benefit
- Use `revision` instead → rejected: `revision` is server-assigned, not suitable for detecting client-side edits

### Decision 2: Remove `version` from IndexedDB schema without migration

**Rationale:**
- No production deployment → no existing user data
- Dexie will ignore the field if it exists in old data (forward compatibility)
- Simpler than writing migration code

**Implementation:**
- Remove `version` from `DB_SCHEMA_V4` in `packages/client/src/db/schema.ts`
- Remove `version` index from all tables

**Alternatives considered:**
- Write migration to drop column → rejected: unnecessary complexity, no production data

### Decision 3: Remove `version` from Google Sheets columns

**Rationale:**
- No production deployment → no existing sheets
- Simpler schema → fewer columns to manage

**Implementation:**
- Remove `version` from column definitions in `packages/adapter-gas/src/server/sheets/*.sheet.ts`
- Remove `version` from `COLUMN_INDICES` constants

**Alternatives considered:**
- Keep column but stop using it → rejected: dead code, confusing

### Decision 4: Remove unused `getByMinVersion()` method

**Rationale:**
- Method is defined and tested but never called in production code
- Removing it simplifies the codebase

**Implementation:**
- Delete method from `TaskRepository`
- Delete corresponding tests

**Alternatives considered:**
- Keep for future use → rejected: YAGNI principle, can add back if needed

## Risks / Trade-offs

### Risk 1: Concurrent edit detection might fail if `updated_at` has millisecond precision issues
**Mitigation:**
- `updated_at` uses ISO 8601 with millisecond precision (`toISOTimestamp()`)
- Collision probability is extremely low (user would need to edit same record twice within 1ms)
- Existing conflict resolution already relies on `updated_at` comparison → same risk already accepted

### Risk 2: Tests might fail due to hardcoded `version` values in test data
**Mitigation:**
- Update all test factories to remove `version` field
- Run full test suite after changes
- Mutation testing will catch any logic errors

### Risk 3: Breaking change if we ever need to rollback
**Mitigation:**
- No production deployment → no rollback needed
- If rollback needed during development, can restore from git history

## Trade-offs

**Simplicity vs. Redundancy:**
- ✅ Simpler data model (one less field per entity)
- ✅ Single source of truth for change tracking (`updated_at`)
- ⚠️ Lose explicit version counter (but it wasn't used for anything meaningful)

**Storage:**
- ✅ Reduced storage: ~8 bytes per record (integer field)
- ✅ Fewer IndexedDB indices → faster queries

**Performance:**
- ✅ Slightly faster serialization (one less field to copy)
- ⚠️ String comparison (`updated_at`) vs. number comparison (`version`) → negligible difference

## Migration Plan

Not applicable — no production deployment, no data migration needed.

## Open Questions

None — all decisions are clear and well-understood.
