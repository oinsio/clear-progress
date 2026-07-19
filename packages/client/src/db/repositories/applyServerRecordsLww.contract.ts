import { expect, it, vi } from "vitest";
import { Temporal } from "@/lib/temporal";
import { toISOTimestamp } from "@/utils/dateHelpers";

/**
 * Minimal shape every repository's local record must expose for this
 * contract suite to inspect sync state after `applyServerRecords` runs.
 */
export type LwwLocalRecord = {
  id: string;
  updated_at: string;
  syncStatus: "synced" | "pending" | "rejected";
};

/**
 * Config supplied per-repository so the contract suite can run generically
 * across TaskRepository, GoalRepository, ContextRepository, CategoryRepository,
 * IdeaRepository, ChecklistRepository, AttachmentRepository (SettingsRepository
 * excluded — no applyServerRecords).
 */
export type ApplyServerRecordsLwwContractConfig<
  LocalRecord extends LwwLocalRecord,
  ServerRecord extends { id: string; updated_at: string },
> = {
  entityName: string;
  applyServerRecords: (records: ServerRecord[]) => Promise<void>;
  getLocalRecord: (id: string) => Promise<LocalRecord | undefined>;
  putLocalRecord: (record: LocalRecord) => Promise<void>;
  /** Builds a minimal valid local record with the given overrides. */
  buildLocalRecord: (overrides: Partial<LocalRecord>) => LocalRecord;
  /** Builds a minimal valid server (wire) record with the given overrides. */
  buildServerRecord: (overrides: Partial<ServerRecord>) => ServerRecord;
};

const OLDER_TIMESTAMP = toISOTimestamp(
  Temporal.Instant.from("2026-01-01T00:00:00.000Z"),
);
const SAME_TIMESTAMP = toISOTimestamp(
  Temporal.Instant.from("2026-01-02T00:00:00.000Z"),
);
const NEWER_TIMESTAMP = toISOTimestamp(
  Temporal.Instant.from("2026-01-03T00:00:00.000Z"),
);

/**
 * Shared contract test suite for `applyServerRecords()` LWW pull protection.
 * Implements FR5 of fix-stale-sync-overwrites.
 *
 * Run once per repository via `runApplyServerRecordsLwwContractTests(config)`
 * inside a `describe` block that has already set up `fake-indexeddb` and
 * cleared the relevant table in `beforeEach`.
 */
export function runApplyServerRecordsLwwContractTests<
  LocalRecord extends LwwLocalRecord,
  ServerRecord extends { id: string; updated_at: string },
>(config: ApplyServerRecordsLwwContractConfig<LocalRecord, ServerRecord>) {
  const {
    entityName,
    applyServerRecords,
    getLocalRecord,
    putLocalRecord,
    buildLocalRecord,
    buildServerRecord,
  } = config;

  /**
   * Persists a local record with the given sync status and timestamp, applies
   * a single server record sharing its id, and returns the resulting local
   * record. Centralises the arrange-and-apply sequence shared across scenarios.
   */
  async function applyServerRecordOverLocal(args: {
    localSyncStatus: LwwLocalRecord["syncStatus"];
    localUpdatedAt: string;
    serverUpdatedAt: string;
  }): Promise<LocalRecord | undefined> {
    const localRecord = buildLocalRecord({
      syncStatus: args.localSyncStatus,
      updated_at: args.localUpdatedAt,
    } as unknown as Partial<LocalRecord>);
    await putLocalRecord(localRecord);

    const serverRecord = buildServerRecord({
      id: localRecord.id,
      updated_at: args.serverUpdatedAt,
    } as unknown as Partial<ServerRecord>);
    await applyServerRecords([serverRecord]);

    return getLocalRecord(localRecord.id);
  }

  // FR5: local `synced` records are always overwritten by the server version
  it(`should overwrite a local synced ${entityName} record with the server record`, async () => {
    const savedRecord = await applyServerRecordOverLocal({
      localSyncStatus: "synced",
      localUpdatedAt: SAME_TIMESTAMP,
      serverUpdatedAt: NEWER_TIMESTAMP,
    });
    expect(savedRecord?.updated_at).toBe(NEWER_TIMESTAMP);
    expect(savedRecord?.syncStatus).toBe("synced");
  });

  // FR5: local `rejected` records are always overwritten by the server version
  it(`should overwrite a local rejected ${entityName} record with the server record`, async () => {
    const savedRecord = await applyServerRecordOverLocal({
      localSyncStatus: "rejected",
      localUpdatedAt: SAME_TIMESTAMP,
      serverUpdatedAt: NEWER_TIMESTAMP,
    });
    expect(savedRecord?.updated_at).toBe(NEWER_TIMESTAMP);
    expect(savedRecord?.syncStatus).toBe("synced");
  });

  // FR5: strictly newer server updated_at overwrites a pending local record and marks it synced
  it(`should overwrite a local pending ${entityName} record when the server record is strictly newer, and mark it synced`, async () => {
    const savedRecord = await applyServerRecordOverLocal({
      localSyncStatus: "pending",
      localUpdatedAt: OLDER_TIMESTAMP,
      serverUpdatedAt: NEWER_TIMESTAMP,
    });
    expect(savedRecord?.updated_at).toBe(NEWER_TIMESTAMP);
    expect(savedRecord?.syncStatus).toBe("synced");
  });

  // FR5: overwriting a pending local record must be logged with entity type, id, and both timestamps
  it(`should log a conflict warning when a pending ${entityName} record is overwritten by a strictly newer server record`, async () => {
    const localRecord = buildLocalRecord({
      syncStatus: "pending",
      updated_at: OLDER_TIMESTAMP,
    } as unknown as Partial<LocalRecord>);
    await putLocalRecord(localRecord);

    const serverRecord = buildServerRecord({
      id: localRecord.id,
      updated_at: NEWER_TIMESTAMP,
    } as unknown as Partial<ServerRecord>);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await applyServerRecords([serverRecord]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(entityName),
      expect.objectContaining({
        id: localRecord.id,
        localUpdatedAt: OLDER_TIMESTAMP,
        serverUpdatedAt: NEWER_TIMESTAMP,
      }),
    );
    warnSpy.mockRestore();
  });

  // FR5: equal server updated_at preserves the local pending record unchanged
  it(`should preserve a local pending ${entityName} record when the server record has an equal updated_at`, async () => {
    const localRecord = buildLocalRecord({
      syncStatus: "pending",
      updated_at: SAME_TIMESTAMP,
    } as unknown as Partial<LocalRecord>);
    await putLocalRecord(localRecord);

    const serverRecord = buildServerRecord({
      id: localRecord.id,
      updated_at: SAME_TIMESTAMP,
    } as unknown as Partial<ServerRecord>);
    await applyServerRecords([serverRecord]);

    expect(await getLocalRecord(localRecord.id)).toEqual(localRecord);
  });

  // FR5: older server updated_at preserves the local pending record unchanged
  it(`should preserve a local pending ${entityName} record when the server record is older`, async () => {
    const localRecord = buildLocalRecord({
      syncStatus: "pending",
      updated_at: NEWER_TIMESTAMP,
    } as unknown as Partial<LocalRecord>);
    await putLocalRecord(localRecord);

    const serverRecord = buildServerRecord({
      id: localRecord.id,
      updated_at: OLDER_TIMESTAMP,
    } as unknown as Partial<ServerRecord>);
    await applyServerRecords([serverRecord]);

    expect(await getLocalRecord(localRecord.id)).toEqual(localRecord);
  });

  // FR5: a server record with no local counterpart is inserted as synced
  it(`should insert a new ${entityName} record from the server when no local record exists`, async () => {
    const serverRecord = buildServerRecord({
      updated_at: NEWER_TIMESTAMP,
    } as unknown as Partial<ServerRecord>);

    await applyServerRecords([serverRecord]);

    const savedRecord = await getLocalRecord(serverRecord.id);
    expect(savedRecord).toBeDefined();
    expect(savedRecord?.syncStatus).toBe("synced");
  });
}
