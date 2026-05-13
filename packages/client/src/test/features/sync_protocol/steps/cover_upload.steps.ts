// implements spec-sync-protocol — cover upload scenarios (FR8, FR9)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { LOCAL_COVER_ID_PREFIX, MAX_COVER_BATCH_SIZE } from "@/constants";
import { localCoverCache } from "@/services/LocalCoverCache";
import {
  type CoverSyncDeps,
  createCoverSyncScaffold,
  createGoal,
  createMockGoalRepository,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
  createPendingCover,
} from "./coverSyncTestHelpers";

const feature = await loadFeature("../cover_upload.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams<CoverSyncDeps>) => {
  const { deps, createService } = createCoverSyncScaffold(f);

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Pending cover is uploaded and goal is updated with server file_id",
    ({ Given, And, When, Then }) => {
      const pendingCover = createPendingCover({
        local_id: "local-1",
        goal_id: "goal-1",
      });
      const localFileId = `${LOCAL_COVER_ID_PREFIX}local-1`;

      Given(
        'a pending cover exists for goal "goal-1"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([pendingCover]),
          });
        },
      );

      And(
        'the goal "goal-1" has cover_file_id with local: prefix',
        async (_ctx: TestContext) => {
          deps.goalRepository = createMockGoalRepository({
            getActive: vi
              .fn()
              .mockResolvedValue([
                createGoal({ id: "goal-1", cover_file_id: localFileId }),
              ]),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'goal "goal-1" cover_file_id is updated to the server file_id',
        async (_ctx: TestContext) => {
          expect(deps.goalRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "goal-1",
              cover_file_id: "uploaded-file-id",
            }),
          );
        },
      );

      And('goal "goal-1" is marked as needsSync', async (_ctx: TestContext) => {
        expect(deps.goalRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ needsSync: true }),
        );
      });
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Pending cover is deleted after successful upload",
    ({ Given, When, Then }) => {
      Given('a pending cover "local-abc" exists', async (_ctx: TestContext) => {
        deps.pendingCoverRepository = createMockPendingCoverRepository({
          getAll: vi
            .fn()
            .mockResolvedValue([createPendingCover({ local_id: "local-abc" })]),
        });
      });

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'pending cover "local-abc" is removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).toHaveBeenCalledWith(
            "local-abc",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Cover blob is saved to cover repository after upload",
    ({ Given, When, Then }) => {
      const pendingCover = createPendingCover({ goal_id: "goal-1" });

      Given(
        'a pending cover exists for goal "goal-1"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([pendingCover]),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        "cover repository contains a record with server file_id",
        async (_ctx: TestContext) => {
          expect(deps.coverRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              file_id: "uploaded-file-id",
              data: pendingCover.data,
              data_hash: pendingCover.data_hash,
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Cache entry is transferred from local_id to server file_id",
    ({ Given, When, Then, And }) => {
      const originalUrl = "blob:http://localhost/original";

      Given(
        'a pending cover "local-transfer" has a cached blob URL',
        async (_ctx: TestContext) => {
          localCoverCache.set("local-transfer", originalUrl);
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi
              .fn()
              .mockResolvedValue([
                createPendingCover({ local_id: "local-transfer" }),
              ]),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        "local cover cache maps server file_id to the original blob URL",
        async (_ctx: TestContext) => {
          expect(localCoverCache.get("uploaded-file-id")).toBe(originalUrl);
        },
      );

      And(
        'local cover cache no longer maps "local-transfer"',
        async (_ctx: TestContext) => {
          expect(localCoverCache.get("local-transfer")).toBeUndefined();
        },
      );
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Duplicate cover detected by hash returns reused file_id",
    ({ Given, And, When, Then }) => {
      const pendingCover = createPendingCover({
        local_id: "dedup-local",
        goal_id: "goal-1",
      });
      const localFileId = `${LOCAL_COVER_ID_PREFIX}dedup-local`;

      Given(
        'a pending cover exists for goal "goal-1"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([pendingCover]),
          });
          deps.goalRepository = createMockGoalRepository({
            getActive: vi
              .fn()
              .mockResolvedValue([
                createGoal({ id: "goal-1", cover_file_id: localFileId }),
              ]),
          });
        },
      );

      And(
        "server will respond with reused true and existing file_id",
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  local_id: "dedup-local",
                  goal_id: "goal-1",
                  file_id: "existing-server-file",
                  reused: true,
                },
              ],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'goal "goal-1" cover_file_id is updated to the existing file_id',
        async (_ctx: TestContext) => {
          expect(deps.goalRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "goal-1",
              cover_file_id: "existing-server-file",
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "Covers are uploaded in chunks of MAX_COVER_BATCH_SIZE",
    ({ Given, When, Then }) => {
      Given(
        "more pending covers than MAX_COVER_BATCH_SIZE exist",
        async (_ctx: TestContext) => {
          const pendingCovers = Array.from(
            { length: MAX_COVER_BATCH_SIZE + 1 },
            (_, i) => createPendingCover({ local_id: `cover-${i}` }),
          );
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue(pendingCovers),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then("uploadCovers is called twice", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.uploadCovers).toHaveBeenCalledTimes(2);
      });
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "Per-item error does not block other items in same chunk",
    ({ Given, And, When, Then }) => {
      Given(
        'two pending covers exist: "bad-id" and "ok-id"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                local_id: "bad-id",
                goal_id: "bad-goal",
              }),
              createPendingCover({ local_id: "ok-id", goal_id: "ok-goal" }),
            ]),
          });
        },
      );

      And(
        'server will respond with error for "bad-id" and success for "ok-id"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  local_id: "bad-id",
                  goal_id: "bad-goal",
                  error: "FILE_TOO_LARGE",
                },
                {
                  local_id: "ok-id",
                  goal_id: "ok-goal",
                  file_id: "ok-file-id",
                  reused: false,
                },
              ],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'pending cover "ok-id" is removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).toHaveBeenCalledWith(
            "ok-id",
          );
        },
      );

      And(
        'pending cover "bad-id" is not removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).not.toHaveBeenCalledWith(
            "bad-id",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "API failure stops processing remaining chunks",
    ({ Given, And, When, Then }) => {
      Given(
        "more pending covers than MAX_COVER_BATCH_SIZE exist",
        async (_ctx: TestContext) => {
          const pendingCovers = Array.from(
            { length: MAX_COVER_BATCH_SIZE + 1 },
            (_, i) => createPendingCover({ local_id: `cover-${i}` }),
          );
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue(pendingCovers),
          });
        },
      );

      And(
        "server will reject the first uploadCovers call",
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockRejectedValue(new Error("Network error")),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then("uploadCovers is called only once", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.uploadCovers).toHaveBeenCalledTimes(1);
      });
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Goal is not updated when cover_file_id no longer matches local prefix",
    ({ Given, And, When, Then }) => {
      Given(
        'a pending cover "changed-id" exists for goal "goal-1"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                local_id: "changed-id",
                goal_id: "goal-1",
              }),
            ]),
          });
        },
      );

      And(
        'goal "goal-1" has a different cover_file_id',
        async (_ctx: TestContext) => {
          deps.goalRepository = createMockGoalRepository({
            getActive: vi.fn().mockResolvedValue([
              createGoal({
                id: "goal-1",
                cover_file_id: "some-other-remote-file-id",
              }),
            ]),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then('goal "goal-1" is not updated', async (_ctx: TestContext) => {
        expect(deps.goalRepository.update).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Multiple goals sharing the same local cover are all updated",
    ({ Given, When, Then }) => {
      const localFileId = `${LOCAL_COVER_ID_PREFIX}shared-local`;

      Given(
        'two goals share the same local cover "shared-local"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                local_id: "shared-local",
                goal_id: "goal-a",
              }),
            ]),
          });
          deps.goalRepository = createMockGoalRepository({
            getActive: vi
              .fn()
              .mockResolvedValue([
                createGoal({ id: "goal-a", cover_file_id: localFileId }),
                createGoal({ id: "goal-b", cover_file_id: localFileId }),
              ]),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        "both goals are updated with the server file_id",
        async (_ctx: TestContext) => {
          expect(deps.goalRepository.update).toHaveBeenCalledTimes(2);
          expect(deps.goalRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "goal-a",
              cover_file_id: "uploaded-file-id",
            }),
          );
          expect(deps.goalRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "goal-b",
              cover_file_id: "uploaded-file-id",
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "Batch does not produce extra empty iteration on exact boundary",
    ({ Given, When, Then, And }) => {
      Given(
        "exactly MAX_COVER_BATCH_SIZE pending covers exist",
        async (_ctx: TestContext) => {
          const pendingCovers = Array.from(
            { length: MAX_COVER_BATCH_SIZE },
            (_, i) => createPendingCover({ local_id: `cover-${i}` }),
          );
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue(pendingCovers),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then("uploadCovers is called exactly once", async (_ctx: TestContext) => {
        expect(deps.syncAdapter.uploadCovers).toHaveBeenCalledTimes(1);
      });

      And("no empty batch is processed", async (_ctx: TestContext) => {
        // Verify the single call has exactly MAX_COVER_BATCH_SIZE items
        expect(deps.syncAdapter.uploadCovers).toHaveBeenCalledWith(
          expect.objectContaining({
            covers: expect.arrayContaining([
              expect.objectContaining({ local_id: expect.any(String) }),
            ]),
          }),
        );
        const callArgs = vi.mocked(deps.syncAdapter.uploadCovers).mock.calls[0];
        expect(callArgs[0].covers).toHaveLength(MAX_COVER_BATCH_SIZE);
      });
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "Upload skips result with error flag even when file_id is present",
    ({ Given, And, When, Then }) => {
      Given(
        'a pending cover "error-with-id" exists',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                local_id: "error-with-id",
                goal_id: "goal-error",
              }),
            ]),
          });
        },
      );

      And(
        'server will respond with error flag true and file_id for "error-with-id"',
        async (_ctx: TestContext) => {
          deps.goalRepository = createMockGoalRepository({
            getActive: vi.fn().mockResolvedValue([
              createGoal({
                id: "goal-error",
                cover_file_id: `${LOCAL_COVER_ID_PREFIX}error-with-id`,
              }),
            ]),
          });
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  local_id: "error-with-id",
                  goal_id: "goal-error",
                  file_id: "some-file-id", // file_id present
                  error: "VALIDATION_FAILED", // but error flag is set
                },
              ],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'pending cover "error-with-id" is not removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).not.toHaveBeenCalledWith(
            "error-with-id",
          );
        },
      );

      And("goal is not updated with the file_id", async (_ctx: TestContext) => {
        expect(deps.goalRepository.update).not.toHaveBeenCalled();
      });
    },
  );
});
