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

function mockServerPullWithPurgeRevision(
  purgeRevision: number,
  currentRevision: number,
): SyncAdapter {
  return createMockSyncAdapter({
    pull: vi.fn().mockResolvedValue(
      makePullResponse({
        purge_revision: purgeRevision,
        current_revision: currentRevision,
      }),
    ),
  });
}

function mockServerPurgeSuccess(
  purgeRevision: number,
  currentRevision: number,
): SyncAdapter {
  return createMockSyncAdapter({
    purge: vi.fn().mockResolvedValue({
      ok: true,
      purge_revision: purgeRevision,
      purged: { tasks: 1, goals: 0 },
    }),
    pull: vi.fn().mockResolvedValue(
      makePullResponse({
        purge_revision: purgeRevision,
        current_revision: currentRevision,
      }),
    ),
  });
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  // Reusable step definitions
  const givenDeletedTask = (
    Given: Parameters<Parameters<typeof f.Scenario>[1]>[0]["Given"],
  ): (() => string) => {
    let deletedTaskId: string;
    Given(
      "client has local records with is_deleted true",
      async (_ctx: TestContext) => {
        deletedTaskId = await seedDeletedTask();
      },
    );
    return () => deletedTaskId;
  };

  const andLastKnownPurgeRevisionIs = (
    And: Parameters<Parameters<typeof f.Scenario>[1]>[0]["And"],
    revision: number,
  ): void => {
    And(
      `last_known_purge_revision is ${revision}`,
      async (_ctx: TestContext) => {
        mockLastKnownPurgeRevision(repositories, revision);
      },
    );
  };

  const andServerWillRespondToPullWithPurgeRevision = (
    And: Parameters<Parameters<typeof f.Scenario>[1]>[0]["And"],
    purgeRevision: number,
    currentRevision: number,
  ): void => {
    And(
      `server will respond to pull with purge_revision ${purgeRevision}`,
      async (_ctx: TestContext) => {
        syncAdapter = mockServerPullWithPurgeRevision(
          purgeRevision,
          currentRevision,
        );
      },
    );
  };

  const andServerPurgeWillSucceed = (
    And: Parameters<Parameters<typeof f.Scenario>[1]>[0]["And"],
    purgeRevision: number,
    currentRevision: number,
  ): void => {
    And(
      `server purge will succeed with purge_revision ${purgeRevision}`,
      async (_ctx: TestContext) => {
        syncAdapter = mockServerPurgeSuccess(purgeRevision, currentRevision);
      },
    );
  };

  const whenPullIsCalled = (
    When: Parameters<Parameters<typeof f.Scenario>[1]>[0]["When"],
  ): void => {
    When("pull is called", async (_ctx: TestContext) => {
      const service = createSyncService(syncAdapter, repositories);
      await service.pull();
    });
  };

  const whenPurgeIsCalled = (
    When: Parameters<Parameters<typeof f.Scenario>[1]>[0]["When"],
  ): void => {
    When("purge is called", async (_ctx: TestContext) => {
      const service = createSyncService(syncAdapter, repositories);
      await service.purge();
    });
  };

  const andLastKnownPurgeRevisionIsSetTo = (
    And: Parameters<Parameters<typeof f.Scenario>[1]>[0]["And"],
    revision: number,
  ): void => {
    And(
      `last_known_purge_revision is set to ${revision}`,
      async (_ctx: TestContext) => {
        expect(repositories.syncMetaRepository.setValue).toHaveBeenCalledWith(
          SYNC_META_KEYS.LAST_KNOWN_PURGE_REVISION,
          revision,
        );
      },
    );
  };

  const andLocalSoftDeletedRecordsAreHardDeleted = (
    And: Parameters<Parameters<typeof f.Scenario>[1]>[0]["And"],
    getTaskId: () => string,
  ): void => {
    And(
      "local soft-deleted records are hard-deleted",
      async (_ctx: TestContext) => {
        const task = await db.tasks.get(getTaskId());
        expect(task).toBeUndefined();
      },
    );
  };

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
      const deletedTaskId = crypto.randomUUID();
      const activeTaskId = crypto.randomUUID();

      Given(
        "client has local records with is_deleted true",
        async (_ctx: TestContext) => {
          await db.tasks.put(
            makeTask({
              id: deletedTaskId,
              name: "Deleted task",
              is_deleted: true,
              revision: 1,
            }),
          );
          await db.tasks.put(
            makeTask({
              id: activeTaskId,
              name: "Active task",
              is_deleted: false,
              revision: 1,
            }),
          );
        },
      );
      andLastKnownPurgeRevisionIs(And, 2);
      andServerWillRespondToPullWithPurgeRevision(And, 3, 10);
      whenPullIsCalled(When);

      Then(
        "local soft-deleted records are hard-deleted",
        async (_ctx: TestContext) => {
          const deletedTask = await db.tasks.get(deletedTaskId);
          expect(deletedTask).toBeUndefined();

          // Verify non-deleted records survive purge (kills () => undefined mutant)
          const activeTask = await db.tasks.get(activeTaskId);
          expect(activeTask).toBeDefined();
          expect(activeTask?.is_deleted).toBe(false);
          expect(activeTask?.name).toBe("Active task");
        },
      );

      andLastKnownPurgeRevisionIsSetTo(And, 3);
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Pull does not purge when purge_revision unchanged",
    ({ Given, And, When, Then }) => {
      const taskId = crypto.randomUUID();
      const goalId = crypto.randomUUID();
      const contextId = crypto.randomUUID();

      Given(
        "client has local records with is_deleted true",
        async (_ctx: TestContext) => {
          await db.tasks.put(
            makeTask({
              id: taskId,
              name: "Deleted task",
              is_deleted: true,
              revision: 1,
            }),
          );
          await db.goals.put({
            id: goalId,
            name: "Deleted goal",
            description: "",
            cover_hash: "",
            status: "planning",
            sort_order: 0,
            is_deleted: true,
            revision: 1,
            created_at: "2025-01-01T00:00:00.000Z",
            updated_at: "2025-01-01T00:00:00.000Z",
            needsSync: false,
          });
          await db.contexts.put({
            id: contextId,
            name: "Deleted context",
            sort_order: 0,
            is_deleted: true,
            revision: 1,
            created_at: "2025-01-01T00:00:00.000Z",
            updated_at: "2025-01-01T00:00:00.000Z",
            needsSync: false,
          });
        },
      );
      andLastKnownPurgeRevisionIs(And, 2);
      andServerWillRespondToPullWithPurgeRevision(And, 2, 10);
      whenPullIsCalled(When);

      Then(
        "local soft-deleted records are not hard-deleted",
        async (_ctx: TestContext) => {
          // Verify all entity tables still contain soft-deleted records
          const task = await db.tasks.get(taskId);
          expect(task).toBeDefined();
          expect(task?.is_deleted).toBe(true);

          const goal = await db.goals.get(goalId);
          expect(goal).toBeDefined();
          expect(goal?.is_deleted).toBe(true);

          const context = await db.contexts.get(contextId);
          expect(context).toBeDefined();
          expect(context?.is_deleted).toBe(true);
        },
      );
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Client purge calls server and cleans local records",
    ({ Given, And, When, Then }) => {
      const getTaskId = givenDeletedTask(Given);
      andServerPurgeWillSucceed(And, 5, 15);
      whenPurgeIsCalled(When);

      Then("server purge API is called", async (_ctx: TestContext) => {
        expect(syncAdapter.purge).toHaveBeenCalled();
      });

      andLocalSoftDeletedRecordsAreHardDeleted(And, getTaskId);
      andLastKnownPurgeRevisionIsSetTo(And, 5);

      And("pull is executed after purge", async (_ctx: TestContext) => {
        expect(syncAdapter.pull).toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Purge does not delete records that are not soft-deleted",
    ({ Given, And, When, Then }) => {
      const activeTaskId = crypto.randomUUID();
      const deletedTaskId = crypto.randomUUID();

      Given(
        'client has task "t1" with is_deleted false',
        async (_ctx: TestContext) => {
          await db.tasks.put(
            makeTask({
              id: activeTaskId,
              name: "t1",
              is_deleted: false,
              revision: 1,
            }),
          );
        },
      );

      And(
        'client has task "t2" with is_deleted true',
        async (_ctx: TestContext) => {
          await db.tasks.put(
            makeTask({
              id: deletedTaskId,
              name: "t2",
              is_deleted: true,
              revision: 1,
            }),
          );
        },
      );

      andServerPurgeWillSucceed(And, 5, 15);
      whenPurgeIsCalled(When);

      Then('task "t1" still exists', async (_ctx: TestContext) => {
        const task = await db.tasks.get(activeTaskId);
        expect(task).toBeDefined();
        expect(task?.name).toBe("t1");
        expect(task?.is_deleted).toBe(false);
      });

      And('task "t2" is hard-deleted', async (_ctx: TestContext) => {
        const task = await db.tasks.get(deletedTaskId);
        expect(task).toBeUndefined();
      });
    },
  );

  // @spec-sync-protocol @FR6
  f.Scenario(
    "Full sync resets needsSync to false before pulling",
    ({ Given, And, When, Then }) => {
      const taskId = crypto.randomUUID();

      Given(
        'client has task "t1" with needsSync true',
        async (_ctx: TestContext) => {
          await db.tasks.put(
            makeTask({
              id: taskId,
              name: "t1",
              needsSync: true,
              revision: 1,
            }),
          );
        },
      );

      And(
        "server will respond to pull with tasks",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            pull: vi
              .fn()
              .mockResolvedValue(
                makePullResponse({ purge_revision: 0, current_revision: 10 }),
              ),
          });
        },
      );

      When("resetAndPull is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.resetAndPull();
      });

      Then(
        'task "t1" has needsSync false before pull executes',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(taskId);
          expect(task).toBeDefined();
          expect(task?.needsSync).toBe(false);
        },
      );
    },
  );
});
