// implements FR6 of add-file-attachments — attachment sync push/pull
import "@/test/helpers/mockPushPreValidator";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import {
  makeAttachment,
  makePullResponse,
  makePushResponse,
} from "@/services/SyncService.test-helpers";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
} from "@/test/helpers/bdd/syncProtocol/helpers";

const feature = await loadFeature("../attachment_sync.feature");

type Context = {
  repositories: ReturnType<typeof createMockRepositories>;
  syncAdapter: SyncAdapter;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    localStorage.clear();
  });

  // @add-file-attachments @FR6
  f.Scenario(
    "Dirty attachments are included in push request",
    ({ Given, When, Then }) => {
      const dirtyAttachments = [
        makeAttachment({ id: "att-1", syncStatus: "pending" as const }),
        makeAttachment({ id: "att-2", syncStatus: "pending" as const }),
      ];

      Given("client has 2 dirty attachments", async (_ctx: TestContext) => {
        (
          repositories.attachmentRepository.getNeedingSync as ReturnType<
            typeof vi.fn
          >
        ).mockResolvedValue(dirtyAttachments);
        (
          repositories.attachmentRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyAttachments.find((attachment) => attachment.id === id),
        );
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "the push request contains 2 attachments",
        async (_ctx: TestContext) => {
          const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
          expect(pushCall.attachments).toHaveLength(2);
        },
      );
    },
  );

  // @add-file-attachments @FR6
  f.Scenario(
    "Push results clear syncStatus on accepted attachments",
    ({ Given, And, When, Then }) => {
      const attachment = makeAttachment({
        id: "att-1",
        syncStatus: "pending" as const,
      });

      Given(
        'client has 1 dirty attachment with id "att-1"',
        async (_ctx: TestContext) => {
          (
            repositories.attachmentRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([attachment]);
          (
            repositories.attachmentRepository as unknown as Record<
              string,
              ReturnType<typeof vi.fn>
            >
          ).getById.mockResolvedValue({ ...attachment });
        },
      );

      And(
        "server accepts the attachment with revision 5",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi
              .fn()
              .mockResolvedValue(
                makePushResponse(
                  { attachments: [{ id: "att-1", status: "created" }] },
                  5,
                ),
              ),
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        'attachment "att-1" has syncStatus "synced" and revision 5',
        async (_ctx: TestContext) => {
          expect(
            (
              repositories.attachmentRepository as unknown as Record<
                string,
                ReturnType<typeof vi.fn>
              >
            ).update,
          ).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "att-1",
              syncStatus: "synced" as const,
              revision: 5,
            }),
          );
        },
      );
    },
  );

  // @add-file-attachments @FR6
  f.Scenario(
    "Pull response attachments are applied to local DB",
    ({ Given, When, Then }) => {
      const serverAttachments = [
        makeAttachment({ id: "att-1" }),
        makeAttachment({ id: "att-2" }),
        makeAttachment({ id: "att-3" }),
      ];

      Given(
        "server returns 3 attachments in pull response",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ attachments: serverAttachments }),
              ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "attachmentRepository.applyServerRecords is called with 3 attachments",
        async (_ctx: TestContext) => {
          expect(
            repositories.attachmentRepository.applyServerRecords,
          ).toHaveBeenCalledWith(serverAttachments);
        },
      );
    },
  );
});
