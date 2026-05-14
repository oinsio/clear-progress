// Shared test helpers for cover sync BDD scenarios
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { vi } from "vitest";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { CoverSyncService } from "@/services/CoverSyncService";
import { localCoverCache } from "@/services/LocalCoverCache";
import type { PendingCoverRecord } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

// jsdom does not implement Blob.prototype.arrayBuffer — polyfill for tests
if (!Blob.prototype.arrayBuffer) {
  Object.defineProperty(Blob.prototype, "arrayBuffer", {
    value() {
      return Promise.resolve(
        new TextEncoder().encode("fake image content").buffer as ArrayBuffer,
      );
    },
    configurable: true,
    writable: true,
  });
}

export const MOCK_BASE64 = btoa("fake image content");
export const MOCK_MIME_TYPE = "image/jpeg";

export function createMockSyncAdapter(
  overrides: Partial<SyncAdapter> = {},
): SyncAdapter {
  return {
    uploadCover: vi.fn(),
    uploadCovers: vi
      .fn()
      .mockImplementation(
        (request: { covers: Array<{ local_id: string; goal_id: string }> }) =>
          Promise.resolve({
            ok: true,
            results: request.covers.map((cover) => ({
              local_id: cover.local_id,
              goal_id: cover.goal_id,
              file_id: "uploaded-file-id",
              reused: false,
            })),
          }),
      ),
    deleteCover: vi.fn(),
    getCover: vi.fn().mockResolvedValue({ ok: true, covers: [] }),
    ping: vi.fn(),
    init: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    purge: vi.fn(),
    ...overrides,
  } as SyncAdapter;
}

export function createMockPendingCoverRepository(
  overrides: Partial<Record<keyof PendingCoverRepository, unknown>> = {},
): PendingCoverRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    getByHash: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as PendingCoverRepository;
}

export function createMockCoverRepository(
  overrides: Partial<Record<keyof CoverRepository, unknown>> = {},
): CoverRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getByHash: vi.fn().mockResolvedValue(undefined),
    getByFileId: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as CoverRepository;
}

export function createMockGoalRepository(
  overrides: Partial<Record<keyof GoalRepository, unknown>> = {},
): GoalRepository {
  return {
    getById: vi.fn().mockResolvedValue(undefined),
    getActive: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as GoalRepository;
}

export function createGoal(overrides: Record<string, unknown> = {}) {
  return {
    id: "goal-1",
    name: "Test Goal",
    description: "",
    cover_file_id: "",
    status: "in_progress" as const,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    needsSync: false,
    ...overrides,
  };
}

export function createPendingCover(
  overrides: Partial<PendingCoverRecord> = {},
): PendingCoverRecord {
  return {
    local_id: "test-local-id",
    goal_id: "test-goal-id",
    data: new Blob(["fake image content"], { type: MOCK_MIME_TYPE }),
    filename: "cover.jpg",
    mime_type: MOCK_MIME_TYPE,
    data_hash: "test-hash-abc123",
    created_at: toISOTimestamp(),
    ...overrides,
  };
}

export function createCoverRecord(
  fileId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    file_id: fileId,
    data_hash: "cover-hash",
    data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
    ...overrides,
  };
}

export function setupGoalWithCoverBlob(opts: {
  goalId: string;
  fileId: string;
}) {
  const coverRecord = createCoverRecord(opts.fileId);
  const goalRepository = createMockGoalRepository({
    getActive: vi.fn().mockResolvedValue([
      createGoal({
        id: opts.goalId,
        cover_file_id: opts.fileId,
      }),
    ]),
  });
  const coverRepository = createMockCoverRepository({
    getByFileId: vi.fn().mockResolvedValue(coverRecord),
  });
  return { goalRepository, coverRepository, coverRecord };
}

export function createMockGetCoversSuccess(
  fileId: string,
  overrides: Record<string, unknown> = {},
) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [
      {
        file_id: fileId,
        mime_type: MOCK_MIME_TYPE,
        data: MOCK_BASE64,
        ...overrides,
      },
    ],
  });
}

export function createMockGetCoversNotFound(fileId: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [{ file_id: fileId, error: "FILE_NOT_FOUND" }],
  });
}

export type CoverSyncDeps = {
  syncAdapter: SyncAdapter;
  pendingCoverRepository: PendingCoverRepository;
  coverRepository: CoverRepository;
  goalRepository: GoalRepository;
};

export function createCoverSyncScaffold(
  f: FeatureDescriibeCallbackParams<CoverSyncDeps>,
) {
  const deps: CoverSyncDeps = {
    syncAdapter: createMockSyncAdapter(),
    pendingCoverRepository: createMockPendingCoverRepository(),
    coverRepository: createMockCoverRepository(),
    goalRepository: createMockGoalRepository(),
  };

  function createService(): CoverSyncService {
    return new CoverSyncService(
      deps.syncAdapter,
      deps.pendingCoverRepository,
      deps.coverRepository,
      deps.goalRepository,
    );
  }

  f.BeforeEachScenario(async () => {
    deps.syncAdapter = createMockSyncAdapter();
    deps.pendingCoverRepository = createMockPendingCoverRepository();
    deps.coverRepository = createMockCoverRepository();
    deps.goalRepository = createMockGoalRepository();
    localCoverCache.clear();
  });

  return { deps, createService };
}
