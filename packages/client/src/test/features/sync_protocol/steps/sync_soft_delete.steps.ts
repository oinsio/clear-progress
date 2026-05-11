// implements spec-sync-protocol — soft delete and purge (FR6)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { SYNC_META_KEYS } from "@/constants";
import { db } from "@/db/database";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makePullResponse,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";

const feature = await loadFeature("../sync_soft_delete.feature");

type Context = {
  repositories: ReturnType<typeof createMockRepositories>;
  syncAdapter: SyncAdapter;
};

async function seedDeletedTask(): Promise<string> {
  const taskId = crypto.randomUUID();
  await db.tasks.put(
    makeTask({
      id: taskId,
      name: "Deleted task",
      is_deleted: true,
      revision: 1,
    }),
  );
  return taskId;
}

function mockLastKnownPurgeRevision(
  repositories: ReturnType<typeof createMockRepositories>,
  revision: number,
): void {
  (
    repositories.syncMetaRepository.getValue as ReturnType<typeof vi.fn>
  ).mockImplementation(async (key: string) => {
    if (key === SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION) return revision;
    return 0;
  });
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    localStorage.clear();
    await db.tasks.clear();
    await db.goals.clear();
    await db.contexts.clear();
    await db.categories.clear();
    await db.checklist_items.clear();
    await db.ideas.clear();
  });

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Deleted records are included in push",
    ({ Given, When, Then }) => {
      const deletedTask = makeTask({
        is_deleted: true,
        needsSync: true,
      });

      Given(
        "client has a task with is_deleted true and needsSync true",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([deletedTask]);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(deletedTask);
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "PushRequest contains the deleted task",
        async (_ctx: TestContext) => {
          const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
          expect(pushCall.tasks).toHaveLength(1);
          expect(pushCall.tasks[0].is_deleted).toBe(true);
        },
      );
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Pull detects server purge and cleans local records",
    ({ Given, And, When, Then }) => {
      let deletedTaskId: string;

      Given(
        "client has local records with is_deleted true",
        async (_ctx: TestContext) => {
          deletedTaskId = await seedDeletedTask();
        },
      );

      And("last_known_purge_revision is 2", async (_ctx: TestContext) => {
        mockLastKnownPurgeRevision(repositories, 2);
      });

      And(
        "server will respond to pull with purge_revision 3",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ purge_revision: 3, current_revision: 10 }),
              ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "local soft-deleted records are hard-deleted",
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(deletedTaskId);
          expect(task).toBeUndefined();
        },
      );

      And(
        "last_known_purge_revision is set to 3",
        async (_ctx: TestContext) => {
          expect(repositories.syncMetaRepository.setValue).toHaveBeenCalledWith(
            SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
            3,
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Pull does not purge when purge_revision unchanged",
    ({ Given, And, When, Then }) => {
      let deletedTaskId: string;

      Given(
        "client has local records with is_deleted true",
        async (_ctx: TestContext) => {
          deletedTaskId = await seedDeletedTask();
        },
      );

      And("last_known_purge_revision is 2", async (_ctx: TestContext) => {
        mockLastKnownPurgeRevision(repositories, 2);
      });

      And(
        "server will respond to pull with purge_revision 2",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ purge_revision: 2, current_revision: 10 }),
              ),
          });
        },
      );

      When("pull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.pull();
      });

      Then(
        "local soft-deleted records are not hard-deleted",
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(deletedTaskId);
          expect(task).toBeDefined();
          expect(task?.is_deleted).toBe(true);
        },
      );
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Client purge calls server and cleans local records",
    ({ Given, And, When, Then }) => {
      let deletedTaskId: string;

      Given(
        "client has local records with is_deleted true",
        async (_ctx: TestContext) => {
          deletedTaskId = await seedDeletedTask();
        },
      );

      And(
        "server purge will succeed with purge_revision 5",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            purge: vi.fn().mockResolvedValue({
              ok: true,
              purge_revision: 5,
              purged: { tasks: 1, goals: 0 },
            }),
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ purge_revision: 5, current_revision: 15 }),
              ),
          });
        },
      );

      When("purge is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.purge();
      });

      Then("server purge API is called", async (_ctx: TestContext) => {
        expect(syncAdapter.purge).toHaveBeenCalled();
      });

      And(
        "local soft-deleted records are hard-deleted",
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(deletedTaskId);
          expect(task).toBeUndefined();
        },
      );

      And(
        "last_known_purge_revision is set to 5",
        async (_ctx: TestContext) => {
          expect(repositories.syncMetaRepository.setValue).toHaveBeenCalledWith(
            SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
            5,
          );
        },
      );

      And("pull is executed after purge", async (_ctx: TestContext) => {
        expect(syncAdapter.pull).toHaveBeenCalled();
      });
    },
  );
});
