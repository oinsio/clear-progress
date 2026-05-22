// implements spec-sync-protocol — cover upload scenarios (FR8, FR9)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { MAX_COVER_BATCH_SIZE } from "@/constants";
import {
  type CoverSyncDeps,
  createCoverSyncScaffold,
  createMockPendingCoverRepository,
  createMockSyncAdapter,
  createPendingCover,
} from "./coverSyncTestHelpers";

const feature = await loadFeature("../cover_upload.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams<CoverSyncDeps>) => {
  const { deps, createService } = createCoverSyncScaffold(f);

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Pending cover is deleted after successful upload",
    ({ Given, When, Then }) => {
      Given(
        'a pending cover with hash "hash-abc" exists',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi
              .fn()
              .mockResolvedValue([
                createPendingCover({ data_hash: "hash-abc" }),
              ]),
          });
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [{ data_hash: "hash-abc", reused: false }],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'pending cover "hash-abc" is removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).toHaveBeenCalledWith(
            "hash-abc",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Cover blob is saved to cover repository after upload",
    ({ Given, When, Then }) => {
      const pendingCover = createPendingCover({
        data_hash: "hash-upload",
        goal_id: "goal-1",
      });

      Given(
        'a pending cover with hash "hash-upload" exists for goal "goal-1"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([pendingCover]),
          });
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [{ data_hash: "hash-upload", reused: false }],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then(
        'cover repository contains a record with data_hash "hash-upload"',
        async (_ctx: TestContext) => {
          expect(deps.coverRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
              data_hash: "hash-upload",
              data: pendingCover.data,
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR8
  f.Scenario(
    "Duplicate cover detected by hash is not saved again (reused: true)",
    ({ Given, And, When, Then }) => {
      Given(
        'a pending cover with hash "hash-reused" exists',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi
              .fn()
              .mockResolvedValue([
                createPendingCover({ data_hash: "hash-reused" }),
              ]),
          });
        },
      );

      And(
        'server will respond with reused true for "hash-reused"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [{ data_hash: "hash-reused", reused: true }],
            }),
          });
        },
      );

      When("cover sync runs", async (_ctx: TestContext) => {
        const service = createService();
        await service.sync();
      });

      Then("cover repository save is not called", async (_ctx: TestContext) => {
        expect(deps.coverRepository.save).not.toHaveBeenCalled();
      });

      And(
        'pending cover "hash-reused" is removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).toHaveBeenCalledWith(
            "hash-reused",
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
            (_, i) => createPendingCover({ data_hash: `hash-${i}` }),
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
    "Batch does not produce extra empty iteration on exact boundary",
    ({ Given, When, Then, And }) => {
      Given(
        "exactly MAX_COVER_BATCH_SIZE pending covers exist",
        async (_ctx: TestContext) => {
          const pendingCovers = Array.from(
            { length: MAX_COVER_BATCH_SIZE },
            (_, i) => createPendingCover({ data_hash: `hash-${i}` }),
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
        expect(deps.syncAdapter.uploadCovers).toHaveBeenCalledWith(
          expect.objectContaining({
            covers: expect.arrayContaining([
              expect.objectContaining({ data_hash: expect.any(String) }),
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
    "Per-item error does not block other items in same chunk",
    ({ Given, And, When, Then }) => {
      Given(
        'two pending covers exist: "hash-bad" and "hash-ok"',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                data_hash: "hash-bad",
                goal_id: "bad-goal",
              }),
              createPendingCover({
                data_hash: "hash-ok",
                goal_id: "ok-goal",
              }),
            ]),
          });
        },
      );

      And(
        'server will respond with error for "hash-bad" and success for "hash-ok"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                { data_hash: "hash-bad", error: "FILE_TOO_LARGE" },
                { data_hash: "hash-ok", reused: false },
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
        'pending cover "hash-ok" is removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).toHaveBeenCalledWith(
            "hash-ok",
          );
        },
      );

      And(
        'pending cover "hash-bad" is not removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).not.toHaveBeenCalledWith(
            "hash-bad",
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR9
  f.Scenario(
    "Upload skips result with error flag even when data_hash is present",
    ({ Given, And, When, Then }) => {
      Given(
        'a pending cover with hash "hash-error" exists',
        async (_ctx: TestContext) => {
          deps.pendingCoverRepository = createMockPendingCoverRepository({
            getAll: vi.fn().mockResolvedValue([
              createPendingCover({
                data_hash: "hash-error",
                goal_id: "goal-1",
              }),
            ]),
          });
        },
      );

      And(
        'server will respond with error flag true for "hash-error"',
        async (_ctx: TestContext) => {
          deps.syncAdapter = createMockSyncAdapter({
            uploadCovers: vi.fn().mockResolvedValue({
              ok: true,
              results: [
                {
                  data_hash: "hash-error",
                  error: "VALIDATION_FAILED",
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
        'pending cover "hash-error" is not removed from repository',
        async (_ctx: TestContext) => {
          expect(deps.pendingCoverRepository.delete).not.toHaveBeenCalledWith(
            "hash-error",
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
            (_, i) => createPendingCover({ data_hash: `hash-${i}` }),
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
});
