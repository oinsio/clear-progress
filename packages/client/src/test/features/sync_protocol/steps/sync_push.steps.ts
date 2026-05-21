// implements spec-sync-protocol — push scenarios (FR1, FR3, FR15)
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { fakeClock } from "@/lib/temporal";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makeGoal,
  makePushResponse,
  makeTask,
  mockAllRepositoriesGetAll,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { SyncProtocolTestContext } from "@/test/helpers/bdd/syncProtocol/types";
import { toISOTimestamp } from "@/utils/dateHelpers";

const feature = await loadFeature("../sync_push.feature");

type Context = SyncProtocolTestContext & {
  allTasks: ReturnType<typeof makeTask>[];
  dirtyTasks: ReturnType<typeof makeTask>[];
  repositories: ReturnType<typeof createMockRepositories>;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    localStorage.clear();
  });

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Regular push collects only dirty records",
    ({ Given, When, Then }) => {
      const dirtyTasks = [
        makeTask({ needsSync: true }),
        makeTask({ needsSync: true }),
      ];

      Given(
        "client has 5 tasks, 2 with needsSync true",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue(dirtyTasks);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockImplementation(async (id: string) =>
            dirtyTasks.find((task) => task.id === id),
          );
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "PushRequest contains only those 2 dirty tasks",
        async (_ctx: TestContext) => {
          const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
          expect(pushCall.tasks).toHaveLength(2);
        },
      );
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario("Force push collects all records", ({ Given, When, Then }) => {
    const allTasks = [
      makeTask({ needsSync: true }),
      makeTask({ needsSync: true }),
      makeTask({ needsSync: false }),
      makeTask({ needsSync: false }),
      makeTask({ needsSync: false }),
    ];

    Given(
      "client has 5 tasks, 2 with needsSync true",
      async (_ctx: TestContext) => {
        mockAllRepositoriesGetAll(repositories, { tasks: allTasks });
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          allTasks.find((task) => task.id === id),
        );
      },
    );

    When("push with force is called", async (_ctx: TestContext) => {
      const service = createSyncService(syncAdapter, repositories);
      await service.push(true);
    });

    Then("PushRequest contains all 5 tasks", async (_ctx: TestContext) => {
      const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      expect(pushCall.tasks).toHaveLength(5);
    });
  });

  // @spec-sync-protocol @FR1
  f.Scenario(
    "needsSync is stripped from wire format",
    ({ Given, When, Then }) => {
      const dirtyTask = makeTask({ needsSync: true });

      Given("client has a dirty task", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([dirtyTask]);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTask);
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "no record in PushRequest contains the needsSync field",
        async (_ctx: TestContext) => {
          const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
          for (const task of pushCall.tasks) {
            expect(task.needsSync).toBeUndefined();
          }
        },
      );
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Goals with local cover IDs are sanitized",
    ({ Given, When, Then }) => {
      const dirtyGoal = makeGoal({
        cover_file_id: "local:abc-123",
        needsSync: true,
      });

      Given(
        'client has a dirty goal with cover_file_id "local:abc-123"',
        async (_ctx: TestContext) => {
          (
            repositories.goalRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([dirtyGoal]);
          (
            repositories.goalRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(dirtyGoal);
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        'PushRequest sends cover_file_id "" for that goal',
        async (_ctx: TestContext) => {
          const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
          expect(pushCall.goals[0].cover_file_id).toBe("");
        },
      );
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Push skips when no dirty records exist",
    ({ Given, When, Then }) => {
      Given("client has no dirty records", async (_ctx: TestContext) => {
        // defaults: all getNeedingSync return []
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("no PushRequest is sent to server", async (_ctx: TestContext) => {
        expect(syncAdapter.push).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR15
  f.Scenario(
    "Created result clears dirty flag when unchanged during push",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", needsSync: true });

      Given(
        'client has a dirty task with id "t1"',
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue({ ...task });
        },
      );

      And(
        'server will respond with status "created" for "t1" and revision 7',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi
              .fn()
              .mockResolvedValue(
                makePushResponse(
                  { tasks: [{ id: "t1", status: "created" }] },
                  7,
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
        'task "t1" has needsSync false and revision 7',
        async (_ctx: TestContext) => {
          expect(repositories.taskRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "t1",
              needsSync: false,
              revision: 7,
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR15
  f.Scenario(
    "Accepted result keeps dirty flag when changed during push",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", needsSync: true });

      Given(
        'client has a dirty task with id "t1"',
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
        },
      );

      And("local task will change during push", async (_ctx: TestContext) => {
        const clock = fakeClock("2026-05-13T17:16:34.040Z");
        const laterTime = clock.instant().add({ seconds: 1 });
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          ...task,
          name: "Changed name",
          updated_at: toISOTimestamp(laterTime),
        });
      });

      And(
        'server will respond with status "accepted" for "t1" and revision 8',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi
              .fn()
              .mockResolvedValue(
                makePushResponse(
                  { tasks: [{ id: "t1", status: "accepted" }] },
                  8,
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
        'task "t1" has needsSync true and revision 8',
        async (_ctx: TestContext) => {
          expect(repositories.taskRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "t1",
              needsSync: true,
              revision: 8,
            }),
          );
        },
      );
    },
  );

  // @spec-sync-protocol @FR3 @FR15
  f.Scenario(
    "Conflict result overwrites local record with server version",
    ({ Given, And, When, Then }) => {
      const task = makeTask({
        id: "t1",
        name: "Client version",
        needsSync: true,
      });
      const serverTask = makeTask({
        id: "t1",
        name: "Server version",
        revision: 9,
      });

      Given(
        'client has a dirty task with id "t1"',
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(task);
        },
      );

      And(
        'server will respond with conflict and server_record for "t1"',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi.fn().mockResolvedValue(
              makePushResponse({
                tasks: [
                  { id: "t1", status: "conflict", server_record: serverTask },
                ],
              }),
            ),
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        'task "t1" is overwritten with server record',
        async (_ctx: TestContext) => {
          expect(repositories.taskRepository.update).toHaveBeenCalledWith(
            expect.objectContaining({
              id: "t1",
              name: "Server version",
            }),
          );
        },
      );

      And('task "t1" has needsSync false', async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "t1",
            needsSync: false,
          }),
        );
      });
    },
  );

  // @spec-sync-protocol @FR15
  f.Scenario(
    "Rejected result keeps record unchanged",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", needsSync: true });

      Given(
        'client has a dirty task with id "t1"',
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
        },
      );

      And(
        'server will respond with status "rejected" for "t1"',
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi.fn().mockResolvedValue(
              makePushResponse({
                tasks: [{ id: "t1", status: "rejected", reason: "invalid" }],
              }),
            ),
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then('task "t1" is not updated', async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Force push sends records even when nothing is dirty",
    ({ Given, When, Then }) => {
      const allTasks = [
        makeTask({ needsSync: false }),
        makeTask({ needsSync: false }),
        makeTask({ needsSync: false }),
      ];

      Given(
        "client has 3 tasks with needsSync false",
        async (_ctx: TestContext) => {
          mockAllRepositoriesGetAll(repositories, { tasks: allTasks });
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockImplementation(async (id: string) =>
            allTasks.find((task) => task.id === id),
          );
        },
      );

      When("push with force is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push(true);
      });

      Then("PushRequest contains all 3 tasks", async (_ctx: TestContext) => {
        const pushCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        expect(pushCall.tasks).toHaveLength(3);
      });
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Push with empty results array does not throw",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", needsSync: true });

      Given(
        'client has a dirty task with id "t1"',
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(task);
        },
      );

      And(
        "server will respond with empty results for tasks",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi.fn().mockResolvedValue(
              makePushResponse({
                tasks: [],
              }),
            ),
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("push completes without error", async (_ctx: TestContext) => {
        expect(syncAdapter.push).toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR1
  f.Scenario(
    "Push handles partial response with missing entity arrays",
    ({ Given, And, When, Then }) => {
      const dirtyTask = makeTask({ needsSync: true });
      const dirtyGoal = makeGoal({ needsSync: true });

      Given(
        "client has a dirty task and a dirty goal",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([dirtyTask]);
          (
            repositories.goalRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([dirtyGoal]);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(dirtyTask);
          (
            repositories.goalRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue(dirtyGoal);
        },
      );

      And(
        "server will respond with results only for tasks",
        async (_ctx: TestContext) => {
          syncAdapter = createMockSyncAdapter({
            push: vi.fn().mockResolvedValue(
              makePushResponse({
                tasks: [{ id: dirtyTask.id, status: "created" }],
                // goals array is missing
              }),
            ),
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("push completes without error", async (_ctx: TestContext) => {
        expect(syncAdapter.push).toHaveBeenCalled();
      });
    },
  );
});
