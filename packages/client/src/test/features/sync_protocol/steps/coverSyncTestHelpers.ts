// Shared test helpers for file sync BDD scenarios
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { vi } from "vitest";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { FileRepository } from "@/db/repositories/FileRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { PendingFileRepository } from "@/db/repositories/PendingFileRepository";
import { FileSyncService } from "@/services/FileSyncService";
import {
  createGoalWithFile,
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
  createPendingFile,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
} from "@/services/FileSyncService-test-utils";
import { localFileCache } from "@/services/LocalFileCache";
import { createMockSyncAdapter } from "@/services/SyncService.test-helpers";
import { createMockAttachmentRepository } from "@/test/mocks/attachmentRepositoryMock";
import { createMockFileRepository } from "@/test/mocks/fileRepositoryMock";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { createMockPendingFileRepository } from "@/test/mocks/pendingFileRepositoryMock";

export {
  createMockFileRepository,
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  createPendingFile,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
};

/** Thin wrapper over createGoalWithFile accepting a single overrides object. */
export function createGoal(overrides: Record<string, unknown> = {}) {
  const goalId = (overrides.id as string) ?? "goal-1";
  const coverHash = (overrides.cover_hash as string) ?? "";
  const { id: _id, cover_hash: _coverHash, ...rest } = overrides;
  return createGoalWithFile(goalId, coverHash, rest);
}

export function setupGoalWithCoverBlob(opts: {
  goalId: string;
  coverHash: string;
}) {
  const coverRecord = {
    data_hash: opts.coverHash,
    data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
  };
  const goalRepository = createMockGoalRepository({
    getActive: vi
      .fn()
      .mockResolvedValue([createGoalWithFile(opts.goalId, opts.coverHash)]),
  });
  const fileRepository = createMockFileRepository({
    getByHash: vi.fn().mockResolvedValue(coverRecord),
  });
  return { goalRepository, fileRepository, coverRecord };
}

export type FileSyncDeps = {
  syncAdapter: SyncAdapter;
  pendingFileRepository: PendingFileRepository;
  fileRepository: FileRepository;
  goalRepository: GoalRepository;
  attachmentRepository: AttachmentRepository;
};

export function createFileSyncScaffold(
  f: FeatureDescriibeCallbackParams<FileSyncDeps>,
) {
  const deps: FileSyncDeps = {
    syncAdapter: createMockSyncAdapter(),
    pendingFileRepository: createMockPendingFileRepository(),
    fileRepository: createMockFileRepository(),
    goalRepository: createMockGoalRepository(),
    attachmentRepository: createMockAttachmentRepository(),
  };

  function createService(): FileSyncService {
    return new FileSyncService(
      deps.syncAdapter,
      deps.pendingFileRepository,
      deps.fileRepository,
      deps.goalRepository,
      deps.attachmentRepository,
    );
  }

  f.BeforeEachScenario(async () => {
    deps.syncAdapter = createMockSyncAdapter();
    deps.pendingFileRepository = createMockPendingFileRepository();
    deps.fileRepository = createMockFileRepository();
    deps.goalRepository = createMockGoalRepository();
    deps.attachmentRepository = createMockAttachmentRepository();
    localFileCache.clear();
  });

  return { deps, createService };
}
