// Shared test helpers for cover sync BDD scenarios
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { vi } from "vitest";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { CoverSyncService } from "@/services/CoverSyncService";
import { localCoverCache } from "@/services/LocalCoverCache";
import { createMockSyncAdapter } from "@/services/SyncService.test-helpers";
import type { PendingCoverRecord } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

export { createMockSyncAdapter };

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

export function createMockPendingCoverRepository(
  overrides: Partial<Record<keyof PendingCoverRepository, unknown>> = {},
): PendingCoverRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
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
    cover_hash: "",
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
  dataHash: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    data_hash: dataHash,
    data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
    ...overrides,
  };
}

export function setupGoalWithCoverBlob(opts: {
  goalId: string;
  coverHash: string;
}) {
  const coverRecord = createCoverRecord(opts.coverHash);
  const goalRepository = createMockGoalRepository({
    getActive: vi.fn().mockResolvedValue([
      createGoal({
        id: opts.goalId,
        cover_hash: opts.coverHash,
      }),
    ]),
  });
  const coverRepository = createMockCoverRepository({
    getByHash: vi.fn().mockResolvedValue(coverRecord),
  });
  return { goalRepository, coverRepository, coverRecord };
}

export function createMockGetCoversSuccess(
  hash: string,
  overrides: Record<string, unknown> = {},
) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [
      {
        hash,
        mime_type: MOCK_MIME_TYPE,
        data: MOCK_BASE64,
        ...overrides,
      },
    ],
  });
}

export function createMockGetCoversNotFound(hash: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    covers: [{ hash, error: "FILE_NOT_FOUND" }],
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
