// implements spec-sync-protocol FR17 — lock timeout handling
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { SYNC_ERRORS } from "@clear-progress/contract";
import { expect, type TestContext, type vi } from "vitest";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { SyncProtocolTestContext } from "@/test/helpers/bdd/syncProtocol/types";

const feature = await loadFeature("../sync_lock_timeout.feature");

type Context = SyncProtocolTestContext & {
  dirtyTasks: ReturnType<typeof makeTask>[];
  repositories: ReturnType<typeof createMockRepositories>;
  pushError: Error | null;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
    localStorage.clear();
  });

  // @spec-sync-protocol @FR17
  f.Scenario(
    "Server returns lock timeout error",
    ({ Given, When, Then, And }) => {
      const dirtyTasks = [
        makeTask({ needsSync: true, name: "Task 1" }),
        makeTask({ needsSync: true, name: "Task 2" }),
      ];
      let pushError: Error | null = null;

      Given("client has dirty records to push", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue(dirtyTasks);
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockImplementation(async (id: string) =>
          dirtyTasks.find((task) => task.id === id),
        );
      });

      And(
        "server will return SYNC_LOCK_TIMEOUT error",
        async (_ctx: TestContext) => {
          (syncAdapter.push as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: SYNC_ERRORS.LOCK_TIMEOUT,
            results: {},
            server_time: "2026-05-13T10:00:00.000Z",
          });
        },
      );

      When("push is called", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        try {
          await service.push();
        } catch (e) {
          pushError = e as Error;
        }
      });

      Then(
        "push fails with SYNC_LOCK_TIMEOUT error",
        async (_ctx: TestContext) => {
          expect(pushError).toBeDefined();
          expect(pushError?.message).toContain("Push failed");
        },
      );

      And("dirty records retain needsSync true", async (_ctx: TestContext) => {
        // Verify that update was NOT called to clear needsSync
        // When lock timeout occurs, records should keep needsSync=true for retry
        expect(repositories.taskRepository.update).not.toHaveBeenCalled();
      });
    },
  );

  // @spec-sync-protocol @FR17
  f.Scenario(
    "Client retries after lock timeout",
    ({ Given, When, Then, And }) => {
      const dirtyTasks = [
        makeTask({ needsSync: true, name: "Task 1" }),
        makeTask({ needsSync: true, name: "Task 2" }),
      ];

      Given(
        "client has dirty records with needsSync true",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue(dirtyTasks);
        },
      );

      And(
        "previous push failed with SYNC_LOCK_TIMEOUT",
        async (_ctx: TestContext) => {
          // First call returns lock timeout
          (syncAdapter.push as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
              ok: false,
              error: SYNC_ERRORS.LOCK_TIMEOUT,
              results: {},
              server_time: "2026-05-13T10:00:00.000Z",
            })
            // Second call succeeds
            .mockResolvedValueOnce({
              ok: true,
              revision: 5,
              results: {
                tasks: dirtyTasks.map((task) => ({
                  id: task.id,
                  status: "created",
                })),
              },
              server_time: "2026-05-13T10:01:00.000Z",
            });
        },
      );

      When("push is called again", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);

        // First push attempt (fails with lock timeout)
        try {
          await service.push();
        } catch {
          // Expected to fail
        }

        // Second push attempt (succeeds)
        await service.push();
      });

      Then("records are sent to server again", async (_ctx: TestContext) => {
        // Verify push was called twice
        expect(syncAdapter.push).toHaveBeenCalledTimes(2);

        // Verify both calls contained the same dirty tasks
        const firstCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
          .calls[0][0];
        const secondCall = (syncAdapter.push as ReturnType<typeof vi.fn>).mock
          .calls[1][0];

        expect(firstCall.tasks).toHaveLength(2);
        expect(secondCall.tasks).toHaveLength(2);
        expect(firstCall.tasks[0].id).toBe(secondCall.tasks[0].id);
        expect(firstCall.tasks[1].id).toBe(secondCall.tasks[1].id);
      });
    },
  );
});
