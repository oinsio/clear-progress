// implements spec-sync-protocol FR16 — chunked push scenarios
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makeGoal,
  makePushResponse,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { SyncProtocolTestContext } from "@/test/helpers/bdd/syncProtocol/types";

const feature = await loadFeature("../sync_chunked_push.feature");

type Context = SyncProtocolTestContext & {
  repositories: ReturnType<typeof createMockRepositories>;
  dirtyTasks: ReturnType<typeof makeTask>[];
  dirtyGoals: ReturnType<typeof makeGoal>[];
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    localStorage.clear();
  });

  // @spec-sync-protocol @FR16
  f.Scenario(
    "Push splits into chunks when exceeding limit",
    ({ Given, When, Then }) => {
      const dirtyTasks = Array.from({ length: 450 }, (_, i) =>
        makeTask({ id: `t${i}`, needsSync: true }),
      );

      Given("client has 450 dirty tasks", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTasks);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyTasks.find((task) => task.id === id),
        );

        syncAdapter = createMockSyncAdapter({
          push: vi.fn().mockResolvedValue(
            makePushResponse({
              tasks: dirtyTasks.slice(0, 200).map((t) => ({
                id: t.id,
                status: "created",
              })),
            }),
          ),
        });
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "3 sequential push requests are sent: 200, 200, 50 records",
        async (_ctx: TestContext) => {
          const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls;
          expect(pushCalls).toHaveLength(3);

          const chunk1Count =
            pushCalls[0][0].tasks.length +
            pushCalls[0][0].goals.length +
            pushCalls[0][0].contexts.length +
            pushCalls[0][0].categories.length +
            pushCalls[0][0].checklist_items.length +
            pushCalls[0][0].ideas.length +
            pushCalls[0][0].settings.length;
          expect(chunk1Count).toBe(200);

          const chunk2Count =
            pushCalls[1][0].tasks.length +
            pushCalls[1][0].goals.length +
            pushCalls[1][0].contexts.length +
            pushCalls[1][0].categories.length +
            pushCalls[1][0].checklist_items.length +
            pushCalls[1][0].ideas.length +
            pushCalls[1][0].settings.length;
          expect(chunk2Count).toBe(200);

          const chunk3Count =
            pushCalls[2][0].tasks.length +
            pushCalls[2][0].goals.length +
            pushCalls[2][0].contexts.length +
            pushCalls[2][0].categories.length +
            pushCalls[2][0].checklist_items.length +
            pushCalls[2][0].ideas.length +
            pushCalls[2][0].settings.length;
          expect(chunk3Count).toBe(50);
        },
      );
    },
  );

  // @spec-sync-protocol @FR16
  f.Scenario(
    "Push within limit sends single request",
    ({ Given, When, Then }) => {
      const dirtyTasks = Array.from({ length: 150 }, (_, i) =>
        makeTask({ id: `t${i}`, needsSync: true }),
      );

      Given("client has 150 dirty tasks", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTasks);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyTasks.find((task) => task.id === id),
        );
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "a single push request with all 150 records is sent",
        async (_ctx: TestContext) => {
          const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls;
          expect(pushCalls).toHaveLength(1);
          expect(pushCalls[0][0].tasks).toHaveLength(150);
        },
      );
    },
  );

  // @spec-sync-protocol @FR16
  f.Scenario(
    "Chunk failure stops remaining chunks",
    ({ Given, And, When, Then }) => {
      const dirtyTasks = Array.from({ length: 450 }, (_, i) =>
        makeTask({ id: `t${i}`, needsSync: true }),
      );

      Given("client has 450 dirty tasks", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTasks);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyTasks.find((task) => task.id === id),
        );
      });

      And("chunk 2 will fail with network error", async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          push: vi
            .fn()
            .mockResolvedValueOnce(
              makePushResponse({
                tasks: dirtyTasks.slice(0, 200).map((t) => ({
                  id: t.id,
                  status: "created",
                })),
              }),
            )
            .mockRejectedValueOnce(new Error("Network error")),
        });
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await expect(service.push()).rejects.toThrow("Network error");
      });

      Then("only chunks 1 and 2 are sent", async (_ctx: TestContext) => {
        const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
          .calls;
        expect(pushCalls).toHaveLength(2);
      });

      And(
        "records from chunk 2 and 3 retain needsSync true",
        async (_ctx: TestContext) => {
          // Chunk 1 (0-199) should have needsSync cleared
          const chunk1Updates = (
            repositories.taskRepository.update as ReturnType<typeof vi.fn>
          ).mock.calls.filter((call) => {
            const taskId = call[0].id;
            const taskIndex = parseInt(taskId.slice(1), 10);
            return taskIndex < 200;
          });

          // Verify chunk 1: tasks were updated with needsSync: false
          for (const updateCall of chunk1Updates) {
            expect(updateCall[0].needsSync).toBe(false);
          }

          // Chunk 2 (200-399) and chunk 3 (400-449) should NOT be updated
          const chunk2And3Updates = (
            repositories.taskRepository.update as ReturnType<typeof vi.fn>
          ).mock.calls.filter((call) => {
            const taskId = call[0].id;
            const taskIndex = parseInt(taskId.slice(1), 10);
            return taskIndex >= 200;
          });

          expect(chunk2And3Updates).toHaveLength(0);
        },
      );
    },
  );

  // @spec-sync-protocol @FR16
  f.Scenario(
    "Mixed entity types are counted together for chunking",
    ({ Given, When, Then }) => {
      const dirtyTasks = Array.from({ length: 150 }, (_, i) =>
        makeTask({ id: `t${i}`, needsSync: true }),
      );
      const dirtyGoals = Array.from({ length: 100 }, (_, i) =>
        makeGoal({ id: `g${i}`, needsSync: true }),
      );

      Given(
        "client has 150 dirty tasks and 100 dirty goals",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue(dirtyTasks);
          (
            repositories.goalRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue(dirtyGoals);
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockImplementation(async (id: string) =>
            dirtyTasks.find((task) => task.id === id),
          );
          (
            repositories.goalRepository.getById as ReturnType<typeof vi.fn>
          ).mockImplementation(async (id: string) =>
            dirtyGoals.find((goal) => goal.id === id),
          );
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then(
        "2 sequential push requests are sent: 200 and 50 records",
        async (_ctx: TestContext) => {
          const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
            .calls;
          expect(pushCalls).toHaveLength(2);

          const chunk1Count =
            pushCalls[0][0].tasks.length + pushCalls[0][0].goals.length;
          expect(chunk1Count).toBe(200);

          const chunk2Count =
            pushCalls[1][0].tasks.length + pushCalls[1][0].goals.length;
          expect(chunk2Count).toBe(50);
        },
      );
    },
  );

  // @spec-sync-protocol @FR16
  f.Scenario(
    "Chunk success clears dirty flags for accepted records",
    ({ Given, And, When, Then }) => {
      const dirtyTasks = Array.from({ length: 250 }, (_, i) =>
        makeTask({ id: `t${i}`, needsSync: true }),
      );

      Given("client has 250 dirty tasks", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTasks);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyTasks.find((task) => task.id === id),
        );
      });

      And("all chunks will succeed", async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          push: vi
            .fn()
            .mockResolvedValueOnce(
              makePushResponse(
                {
                  tasks: dirtyTasks.slice(0, 200).map((t) => ({
                    id: t.id,
                    status: "created",
                  })),
                },
                10,
              ),
            )
            .mockResolvedValueOnce(
              makePushResponse(
                {
                  tasks: dirtyTasks.slice(200, 250).map((t) => ({
                    id: t.id,
                    status: "created",
                  })),
                },
                11,
              ),
            ),
        });
      });

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("2 sequential push requests are sent", async (_ctx: TestContext) => {
        const pushCalls = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
          .calls;
        expect(pushCalls).toHaveLength(2);
      });

      And(
        "all 250 tasks have needsSync false after push",
        async (_ctx: TestContext) => {
          const updateCalls = (
            repositories.taskRepository.update as ReturnType<typeof vi.fn>
          ).mock.calls;

          // All 250 tasks should be updated with needsSync: false
          expect(updateCalls).toHaveLength(250);

          for (const call of updateCalls) {
            expect(call[0].needsSync).toBe(false);
          }
        },
      );
    },
  );
});
