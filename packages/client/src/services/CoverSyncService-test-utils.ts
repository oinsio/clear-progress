import type { SyncAdapter } from "@clear-progress/contract";
import { afterEach, beforeEach, vi } from "vitest";
import type { CoverRepository } from "@/db/repositories/CoverRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingCoverRepository } from "@/db/repositories/PendingCoverRepository";
import { createMockCoverRepository } from "@/test/mocks/coverRepositoryMock";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { createMockPendingCoverRepository } from "@/test/mocks/pendingCoverRepositoryMock";
import type { PendingCoverRecord } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { CoverSyncService } from "./CoverSyncService";
import { localCoverCache } from "./LocalCoverCache";
import { createMockSyncAdapter } from "./SyncService.test-helpers";

// jsdom does not implement Blob.prototype.arrayBuffer — polyfill for tests
Object.defineProperty(Blob.prototype, "arrayBuffer", {
  value() {
    return Promise.resolve(
      new TextEncoder().encode("fake image content").buffer as ArrayBuffer,
    );
  },
  configurable: true,
  writable: true,
});

export const MOCK_BASE64 = btoa("fake image content");
export const MOCK_MIME_TYPE = "image/jpeg";

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

export function createPendingCover(
  overrides: Partial<PendingCoverRecord> = {},
): PendingCoverRecord {
  return {
    local_id: "test-local-id",
    goal_id: "test-goal-id",
    data: new Blob(["fake image content"], { type: "image/jpeg" }),
    filename: "cover.jpg",
    mime_type: "image/jpeg",
    data_hash: "test-hash-abc123",
    created_at: toISOTimestamp(),
    ...overrides,
  };
}

export function createGoalWithCover(
  goalId: string,
  coverFileId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: goalId,
    name: "Test Goal",
    description: "",
    cover_file_id: coverFileId,
    status: "in_progress" as const,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    ...overrides,
  };
}

export interface CoverSyncTestContext {
  mockSyncAdapter: SyncAdapter;
  mockPendingCoverRepository: PendingCoverRepository;
  mockCoverRepository: CoverRepository;
  mockGoalRepository: GoalRepository;
  createService: () => CoverSyncService;
}

export function setupCoverSyncTests(): CoverSyncTestContext {
  const context: CoverSyncTestContext = {
    mockSyncAdapter: createMockSyncAdapter(),
    mockPendingCoverRepository: createMockPendingCoverRepository(),
    mockCoverRepository: createMockCoverRepository(),
    mockGoalRepository: createMockGoalRepository(),
    createService: () =>
      new CoverSyncService(
        context.mockSyncAdapter,
        context.mockPendingCoverRepository,
        context.mockCoverRepository,
        context.mockGoalRepository,
      ),
  };

  beforeEach(() => {
    context.mockSyncAdapter = createMockSyncAdapter();
    context.mockPendingCoverRepository = createMockPendingCoverRepository();
    context.mockCoverRepository = createMockCoverRepository();
    context.mockGoalRepository = createMockGoalRepository();
  });

  afterEach(() => {
    localCoverCache.clear();
  });

  return context;
}

export const EXISTING_SERVER_FILE_ID = "existing-server-file-id";
export const NEW_SERVER_FILE_ID = "new-server-file-id";

export function setupReuploadDefaults(ctx: CoverSyncTestContext) {
  ctx.mockGoalRepository = createMockGoalRepository({
    getActive: vi.fn().mockResolvedValue([createGoalWithServerCover()]),
  });
  ctx.mockCoverRepository = createMockCoverRepository({
    getByFileId: vi.fn().mockResolvedValue(createCoverRecord()),
  });
  ctx.mockSyncAdapter = createMockSyncAdapter({
    uploadCovers: vi.fn().mockResolvedValue({
      ok: true,
      results: [
        {
          local_id: "goal-reupload",
          goal_id: "goal-reupload",
          file_id: EXISTING_SERVER_FILE_ID,
          reused: true,
        },
      ],
    }),
  });
}

export function createGoalWithServerCover(
  overrides: Record<string, unknown> = {},
) {
  return createGoalWithCover(
    "goal-reupload",
    EXISTING_SERVER_FILE_ID,
    overrides,
  );
}

export function createCoverRecord(fileId = EXISTING_SERVER_FILE_ID) {
  return {
    file_id: fileId,
    data_hash: "cover-hash-xyz",
    data: new Blob(["img data"], { type: "image/jpeg" }),
  };
}

export {
  createMockCoverRepository,
  createMockGoalRepository,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
  localCoverCache,
};
