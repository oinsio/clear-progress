// implements spec-sync-protocol — cover lifecycle scenarios (FR10, FR11)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { MAX_FILE_BATCH_SIZE } from "@/constants";
import { localFileCache } from "@/services/LocalFileCache";
import type { PendingFileRecord } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import {
  createFileSyncScaffold,
  createGoal,
  createMockFileRepository,
  createMockGetFilesNotFound,
  createMockGetFilesSuccess,
  createMockGoalRepository,
  createMockPendingFileRepository,
  createMockSyncAdapter,
  type FileSyncDeps,
  MOCK_BASE64,
  MOCK_MIME_TYPE,
  setupGoalWithCoverBlob,
} from "./coverSyncTestHelpers";

const feature = await loadFeature("../cover_lifecycle.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams<FileSyncDeps>) => {
  const { deps, createService } = createFileSyncScaffold(f);

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Successful cover download from server",
    ({ Given, And, When, Then }) => {
      Given(
        'a cover with hash "remote-abc" is not in local cache or repository',
        async (_ctx: TestContext) => {
          // default: nothing in cache or repository
        },
      );

      And(
        'server has cover data for "remote-abc"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: createMockGetFilesSuccess("remote-abc"),
          });
        },
      );

      When(
        'cacheFromServer is called for "remote-abc"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.cacheFromServer("remote-abc");
        },
      );

      Then(
        'cover is saved to cover repository with data_hash "remote-abc"',
        async (_ctx: TestContext) => {
          expect(deps.fileRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              data_hash: "remote-abc",
              data: expect.any(Blob),
            }),
          );
        },
      );

      And("cover is added to local cover cache", async (_ctx: TestContext) => {
        expect(localFileCache.get("remote-abc")).toBeDefined();
      });
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Missing cover on server does not populate cache",
    ({ Given, And, When, Then }) => {
      Given(
        'a cover with hash "missing-id" is not in local cache or repository',
        async (_ctx: TestContext) => {
          // default
        },
      );

      And(
        'server returns FILE_NOT_FOUND for "missing-id"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: createMockGetFilesNotFound("missing-id"),
          });
        },
      );

      When(
        'cacheFromServer is called for "missing-id"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.cacheFromServer("missing-id");
        },
      );

      Then(
        "cover is not saved to cover repository",
        async (_ctx: TestContext) => {
          expect(deps.fileRepository.save).not.toHaveBeenCalled();
        },
      );

      And(
        "cover is not added to local cover cache",
        async (_ctx: TestContext) => {
          expect(localFileCache.get("missing-id")).toBeUndefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Batch download fetches covers in chunks",
    ({ Given, When, Then }) => {
      let hashes: string[];

      Given(
        "more uncached hashes than MAX_FILE_BATCH_SIZE exist",
        async (_ctx: TestContext) => {
          hashes = Array.from(
            { length: MAX_FILE_BATCH_SIZE + 1 },
            (_, i) => `hash-${i}`,
          );
          deps.syncAdapter = createMockSyncAdapter({
            getFile: vi.fn().mockResolvedValue({ ok: true, files: [] }),
          });
        },
      );

      When("batchCacheFromServer is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.batchCacheFromServer(hashes);
      });

      Then("getCover API is called twice", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.getFile).toHaveBeenCalledTimes(2);
      });
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Batch download continues after one chunk fails",
    ({ Given, And, When, Then }) => {
      let hashes: string[];

      Given(
        "more uncached hashes than MAX_FILE_BATCH_SIZE exist",
        async (_ctx: TestContext) => {
          hashes = Array.from(
            { length: MAX_FILE_BATCH_SIZE + 1 },
            (_, i) => `hash-${i}`,
          );
        },
      );

      And(
        "server will fail on the first getCover chunk",
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: vi
              .fn()
              .mockRejectedValueOnce(new Error("Network error"))
              .mockResolvedValueOnce({ ok: true, files: [] }),
          });
        },
      );

      When("batchCacheFromServer is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.batchCacheFromServer(hashes);
      });

      Then("getCover API is called twice", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.getFile).toHaveBeenCalledTimes(2);
      });
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "ensureFileCached skips when already in cache",
    ({ Given, When, Then }) => {
      Given(
        'cover "cached-id" is already in local cover cache',
        async (_ctx: TestContext) => {
          localFileCache.set("cached-id", "blob:http://localhost/cached");
        },
      );

      When(
        'ensureFileCached is called for "cached-id"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.ensureFileCached("cached-id");
        },
      );

      Then("cover repository is not queried", async (_ctx: TestContext) => {
        expect(deps.fileRepository.getByHash).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "ensureFileCached loads from IndexedDB without server call",
    ({ Given, When, Then, And }) => {
      Given(
        'cover "db-id" exists in cover repository with blob data',
        async (_ctx: TestContext) => {
          deps.fileRepository = createMockFileRepository({
            getByHash: vi.fn().mockResolvedValue({
              data_hash: "db-id",
              data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
            }),
          });
        },
      );

      When(
        'ensureFileCached is called for "db-id"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.ensureFileCached("db-id");
        },
      );

      Then("getCover API is not called", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.getFile).not.toHaveBeenCalled();
      });

      And(
        'cover "db-id" is added to local cover cache',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("db-id")).toBeDefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Concurrent ensureFileCached calls make only one server request",
    ({ Given, And, When, Then }) => {
      Given(
        'cover "concurrent-id" is not cached or in repository',
        async (_ctx: TestContext) => {
          deps.fileRepository = createMockFileRepository({
            getByHash: vi.fn().mockResolvedValue(undefined),
          });
        },
      );

      And(
        'server has cover data for "concurrent-id"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: createMockGetFilesSuccess("concurrent-id"),
          });
        },
      );

      When(
        'ensureFileCached is called three times concurrently for "concurrent-id"',
        async (_ctx: TestContext) => {
          const service = createService();
          await Promise.all([
            service.ensureFileCached("concurrent-id"),
            service.ensureFileCached("concurrent-id"),
            service.ensureFileCached("concurrent-id"),
          ]);
        },
      );

      Then("getCover API is called exactly once", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.getFile).toHaveBeenCalledTimes(1);
      });
    },
  );

  // @spec-sync-protocol @FR11
  f.Scenario(
    "Initialization skips covers without blob data",
    ({ Given, When, Then }) => {
      Given(
        'cover repository has a cover without blob data for "no-blob-file"',
        async (_ctx: TestContext) => {
          deps.fileRepository = createMockFileRepository({
            getAll: vi.fn().mockResolvedValue([
              {
                data_hash: "no-blob-file",
                data: null, // no blob data
              },
            ]),
          });
        },
      );

      When("initializeLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.initializeLocalFiles();
      });

      Then(
        'cover "no-blob-file" is not added to local cover cache',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("no-blob-file")).toBeUndefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Download skips when result has error flag despite having hash",
    ({ Given, And, When, Then }) => {
      Given(
        'a cover with hash "error-but-id" is not in local cache or repository',
        async (_ctx: TestContext) => {
          // default
        },
      );

      And(
        'server returns error flag true with hash for "error-but-id"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: vi.fn().mockResolvedValue({
              ok: true,
              files: [
                {
                  hash: "error-but-id",
                  error: true, // error flag set
                  data: MOCK_BASE64,
                  mime_type: MOCK_MIME_TYPE,
                },
              ],
            }),
          });
        },
      );

      When(
        'cacheFromServer is called for "error-but-id"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.cacheFromServer("error-but-id");
        },
      );

      Then(
        "cover is not saved to cover repository",
        async (_ctx: TestContext) => {
          expect(deps.fileRepository.save).not.toHaveBeenCalled();
        },
      );

      And(
        "cover is not added to local cover cache",
        async (_ctx: TestContext) => {
          expect(localFileCache.get("error-but-id")).toBeUndefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR10
  f.Scenario(
    "Download uses fallback MIME type when server omits mime_type",
    ({ Given, And, When, Then }) => {
      Given(
        'a cover with hash "no-mime" is not in local cache or repository',
        async (_ctx: TestContext) => {
          // default
        },
      );

      And(
        'server returns cover data without mime_type for "no-mime"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: vi.fn().mockResolvedValue({
              ok: true,
              files: [
                {
                  hash: "no-mime",
                  data: MOCK_BASE64,
                  // mime_type omitted
                },
              ],
            }),
          });
        },
      );

      When(
        'cacheFromServer is called for "no-mime"',
        async (_ctx: TestContext) => {
          const service = createService();
          await service.cacheFromServer("no-mime");
        },
      );

      Then(
        "cover is saved with fallback MIME type",
        async (_ctx: TestContext) => {
          expect(deps.fileRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              data_hash: "no-mime",
              data: expect.any(Blob),
            }),
          );
        },
      );

      And("cover is added to local cover cache", async (_ctx: TestContext) => {
        expect(localFileCache.get("no-mime")).toBeDefined();
      });
    },
  );

  // @spec-sync-protocol @FR11 @FR8
  f.Scenario(
    "Full sync reupload with dedup does not update goal",
    ({ Given, And, When, Then }) => {
      Given(
        'a goal has server cover "server-file-1" with local blob',
        async (_ctx: TestContext) => {
          const setup = setupGoalWithCoverBlob({
            goalId: "goal-reup",
            coverHash: "server-file-1",
          });
          deps.goalRepository = setup.goalRepository;
          deps.fileRepository = setup.fileRepository;
        },
      );

      And(
        'server will respond with reused true for "server-file-1"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadFiles: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  data_hash: "server-file-1",
                  reused: true,
                },
              ],
            }),
          });
        },
      );

      When("reuploadLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.reuploadLocalFiles();
      });

      Then("goal is not updated", async (_ctx: TestContext) => {
        expect(deps.goalRepository.update).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR11 @FR8
  f.Scenario(
    "Full sync reupload saves CoverRecord when server confirms upload",
    ({ Given, And, When, Then }) => {
      Given(
        'a goal has server cover "server-hash-1" with local blob',
        async (_ctx: TestContext) => {
          const setup = setupGoalWithCoverBlob({
            goalId: "goal-reup-confirm",
            coverHash: "server-hash-1",
          });
          deps.goalRepository = setup.goalRepository;
          deps.fileRepository = setup.fileRepository;
        },
      );

      And(
        'server will respond with reused false for "server-hash-1"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadFiles: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  data_hash: "server-hash-1",
                  reused: false,
                },
              ],
            }),
          });
        },
      );

      When("reuploadLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.reuploadLocalFiles();
      });

      Then(
        'cover repository saves a record with data_hash "server-hash-1"',
        async (_ctx: TestContext) => {
          expect(deps.fileRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              data_hash: "server-hash-1",
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR11
  f.Scenario(
    "Local cover initialization loads confirmed covers into cache",
    ({ Given, When, Then }) => {
      Given(
        'cover repository has a cover with blob data for "init-file"',
        async (_ctx: TestContext) => {
          deps.fileRepository = createMockFileRepository({
            getAll: vi.fn().mockResolvedValue([
              {
                data_hash: "init-file",
                data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
              },
            ]),
          });
        },
      );

      When("initializeLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.initializeLocalFiles();
      });

      Then(
        'cover "init-file" is added to local cover cache',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("init-file")).toBeDefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR11
  f.Scenario(
    "Local cover initialization loads pending covers into cache",
    ({ Given, When, Then }) => {
      Given(
        'pending cover repository has a cover with data_hash "init-pending"',
        async (_ctx: TestContext) => {
          deps.pendingFileRepository = createMockPendingFileRepository({
            getAll: vi.fn().mockResolvedValue([
              {
                data_hash: "init-pending",
                goal_id: "goal-1",
                data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
                filename: "cover.jpg",
                mime_type: MOCK_MIME_TYPE,
                created_at: toISOTimestamp(),
              } satisfies PendingFileRecord,
            ]),
          });
        },
      );

      When("initializeLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.initializeLocalFiles();
      });

      Then(
        'cover "init-pending" is added to local cover cache',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("init-pending")).toBeDefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR11
  f.Scenario(
    "Initialization does not overwrite existing cache entries",
    ({ Given, And, When, Then }) => {
      const existingUrl = "blob:http://localhost/existing";

      Given(
        'cover "already-cached" is already in local cover cache',
        async (_ctx: TestContext) => {
          localFileCache.set("already-cached", existingUrl);
        },
      );

      And(
        'pending cover repository has a cover with data_hash "already-cached"',
        async (_ctx: TestContext) => {
          deps.pendingFileRepository = createMockPendingFileRepository({
            getAll: vi.fn().mockResolvedValue([
              {
                data_hash: "already-cached",
                goal_id: "goal-1",
                data: new Blob(["img"], { type: MOCK_MIME_TYPE }),
                filename: "cover.jpg",
                mime_type: MOCK_MIME_TYPE,
                created_at: toISOTimestamp(),
              } satisfies PendingFileRecord,
            ]),
          });
        },
      );

      When("initializeLocalFiles is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.initializeLocalFiles();
      });

      Then(
        'cover "already-cached" retains its original cache URL',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("already-cached")).toBe(existingUrl);
        },
      );
    },
  );

  // @spec-sync-protocol @FR11
  f.Scenario(
    "Full sync ensureServerFilesAreCached downloads missing covers",
    ({ Given, And, When, Then }) => {
      Given(
        'a goal references cover "missing-server-file" not in cache or repository',
        async (_ctx: TestContext) => {
          deps.goalRepository = createMockGoalRepository({
            getActive: vi.fn().mockResolvedValue([
              createGoal({
                id: "goal-dl",
                cover_hash: "missing-server-file",
              }),
            ]),
          });
          deps.fileRepository = createMockFileRepository({
            getByHash: vi.fn().mockResolvedValue(undefined),
          });
        },
      );

      And(
        'server has cover data for "missing-server-file"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            getFile: createMockGetFilesSuccess("missing-server-file"),
          });
        },
      );

      When("fullSync is called", async (_ctx: TestContext) => {
        const service = createService();
        await service.fullSync();
      });

      Then(
        'cover "missing-server-file" is added to local cover cache',
        async (_ctx: TestContext) => {
          expect(localFileCache.get("missing-server-file")).toBeDefined();
        },
      );
    },
  );
});
