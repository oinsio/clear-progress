import type { SyncAdapter } from "@clear-progress/contract";
import { afterEach, beforeEach, vi } from "vitest";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { createMockAttachmentRepository } from "@/test/mocks/attachmentRepositoryMock";
import { createMockFileRepository } from "@/test/mocks/fileRepositoryMock";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { createMockPendingFileRepository } from "@/test/mocks/pendingFileRepositoryMock";
import type { PendingFileRecord } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { FileSyncService } from "./FileSyncService";
import { localFileCache } from "./LocalFileCache";
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

export function createMockGetFilesSuccess(
  hash: string,
  overrides: Record<string, unknown> = {},
) {
  return vi.fn().mockResolvedValue({
    ok: true,
    files: [
      {
        hash,
        mime_type: MOCK_MIME_TYPE,
        data: MOCK_BASE64,
        ...overrides,
      },
    ],
  });
}

export function createMockGetFilesNotFound(hash: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    files: [{ hash, error: "FILE_NOT_FOUND" }],
  });
}

export function createPendingFile(
  overrides: Partial<PendingFileRecord> = {},
): PendingFileRecord {
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

export function createGoalWithFile(
  goalId: string,
  fileHash: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: goalId,
    name: "Test Goal",
    description: "",
    cover_hash: fileHash,
    status: "in_progress" as const,
    sort_order: 0,
    is_deleted: false,
    created_at: toISOTimestamp(),
    updated_at: toISOTimestamp(),
    ...overrides,
  };
}

export interface FileSyncTestContext {
  mockSyncAdapter: SyncAdapter;
  mockPendingFileRepository: PendingFileRepository;
  mockFileRepository: FileRepository;
  mockGoalRepository: GoalRepository;
  mockAttachmentRepository: AttachmentRepository;
  createService: () => FileSyncService;
}

export function setupFileSyncTests(): FileSyncTestContext {
  const context: FileSyncTestContext = {
    mockSyncAdapter: createMockSyncAdapter(),
    mockPendingFileRepository: createMockPendingFileRepository(),
    mockFileRepository: createMockFileRepository(),
    mockGoalRepository: createMockGoalRepository(),
    mockAttachmentRepository: createMockAttachmentRepository(),
    createService: () =>
      new FileSyncService(
        context.mockSyncAdapter,
        context.mockPendingFileRepository,
        context.mockFileRepository,
        context.mockGoalRepository,
        context.mockAttachmentRepository,
      ),
  };

  beforeEach(() => {
    context.mockSyncAdapter = createMockSyncAdapter();
    context.mockPendingFileRepository = createMockPendingFileRepository();
    context.mockFileRepository = createMockFileRepository();
    context.mockGoalRepository = createMockGoalRepository();
    context.mockAttachmentRepository = createMockAttachmentRepository();
  });

  afterEach(() => {
    localFileCache.clear();
  });

  return context;
}

export const EXISTING_SERVER_FILE_ID = "existing-server-file-id";

export function setupReuploadDefaults(ctx: FileSyncTestContext) {
  ctx.mockGoalRepository = createMockGoalRepository({
    getActive: vi.fn().mockResolvedValue([createGoalWithServerFile()]),
  });
  ctx.mockFileRepository = createMockFileRepository({
    getByHash: vi.fn().mockResolvedValue(createFileRecord()),
  });
  ctx.mockSyncAdapter = createMockSyncAdapter({
    uploadFiles: vi.fn().mockResolvedValue({
      ok: true,
      results: [
        {
          data_hash: EXISTING_SERVER_FILE_ID,
          goal_id: "goal-reupload",
          reused: true,
        },
      ],
    }),
  });
}

export function createGoalWithServerFile(
  overrides: Record<string, unknown> = {},
) {
  return createGoalWithFile(
    "goal-reupload",
    EXISTING_SERVER_FILE_ID,
    overrides,
  );
}

export function createFileRecord(dataHash = "cover-hash-xyz") {
  return {
    data_hash: dataHash,
    data: new Blob(["img data"], { type: MOCK_MIME_TYPE }),
  };
}

export {
  createMockAttachmentRepository,
  createMockFileRepository,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  localFileCache,
};
