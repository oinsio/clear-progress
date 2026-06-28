// implements spec-sync-protocol — dirty flag lifecycle (FR4)
import "@/test/helpers/mockPushPreValidator";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import {
  createMockRepositories,
  createMockSyncAdapter,
  createSyncService,
  makePushResponse,
  makeTask,
} from "@/test/helpers/bdd/syncProtocol/helpers";
import type { Task } from "@/types/entities";
import { hasEntityChanged } from "@/utils/deepEqual";

const feature = await loadFeature("../sync_dirty_flag.feature");

type Context = {
  existingTask: Task;
  updatedTask: Task;
  changeResult: boolean;
  repositories: ReturnType<typeof createMockRepositories>;
  syncAdapter: SyncAdapter;
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let existingTask: Task;
  let updatedTask: Task;
  let changeResult: boolean;
  let repositories: ReturnType<typeof createMockRepositories>;
  let syncAdapter: SyncAdapter;

  f.BeforeEachScenario(async () => {
    existingTask = makeTask();
    updatedTask = makeTask();
    changeResult = false;
    repositories = createMockRepositories();
    syncAdapter = createMockSyncAdapter();
  });

  // @spec-sync-protocol @FR4
  f.Scenario("Real field change sets dirty flag", ({ Given, When, Then }) => {
    Given('a task exists with name "Buy milk"', async (_ctx: TestContext) => {
      existingTask = makeTask({ name: "Buy milk" });
    });

    When('user changes name to "Buy bread"', async (_ctx: TestContext) => {
      updatedTask = { ...existingTask, name: "Buy bread" };
      changeResult = hasEntityChanged(existingTask, updatedTask);
    });

    Then("hasEntityChanged returns true", async (_ctx: TestContext) => {
      expect(changeResult).toBe(true);
    });
  });

  // @spec-sync-protocol @FR4
  f.Scenario(
    "No-op change does not set dirty flag",
    ({ Given, When, Then }) => {
      Given('a task exists with name "Buy milk"', async (_ctx: TestContext) => {
        existingTask = makeTask({ name: "Buy milk" });
      });

      When("user saves without changes", async (_ctx: TestContext) => {
        updatedTask = { ...existingTask };
        changeResult = hasEntityChanged(existingTask, updatedTask);
      });

      Then("hasEntityChanged returns false", async (_ctx: TestContext) => {
        expect(changeResult).toBe(false);
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Empty string equals undefined in comparison",
    ({ Given, When, Then }) => {
      Given('a task exists with description ""', async (_ctx: TestContext) => {
        existingTask = makeTask({ description: "" });
      });

      When(
        "compared to same task with description undefined",
        async (_ctx: TestContext) => {
          updatedTask = {
            ...existingTask,
            description: undefined as unknown as string,
          };
          changeResult = hasEntityChanged(existingTask, updatedTask);
        },
      );

      Then("hasEntityChanged returns false", async (_ctx: TestContext) => {
        expect(changeResult).toBe(false);
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Empty string equals null in comparison",
    ({ Given, When, Then }) => {
      Given('a task exists with description ""', async (_ctx: TestContext) => {
        existingTask = makeTask({ description: "" });
      });

      When(
        "compared to same task with description null",
        async (_ctx: TestContext) => {
          updatedTask = {
            ...existingTask,
            description: null as unknown as string,
          };
          changeResult = hasEntityChanged(existingTask, updatedTask);
        },
      );

      Then("hasEntityChanged returns false", async (_ctx: TestContext) => {
        expect(changeResult).toBe(false);
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Service fields are excluded from comparison",
    ({ Given, When, Then }) => {
      Given("a task exists", async (_ctx: TestContext) => {
        existingTask = makeTask();
      });

      When(
        "compared to same task with different updated_at",
        async (_ctx: TestContext) => {
          updatedTask = {
            ...existingTask,
            updated_at: "2024-01-02T00:00:00.000Z",
            syncStatus: "pending" as const,
            revision: 5,
          };
          changeResult = hasEntityChanged(existingTask, updatedTask);
        },
      );

      Then("hasEntityChanged returns false", async (_ctx: TestContext) => {
        expect(changeResult).toBe(false);
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Created result clears dirty flag when unchanged during push",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", syncStatus: "pending" as const });

      Given("a dirty task was pushed", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([task]);
      });

      And("server returned created status", async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 5),
            ),
        });
      });

      And("local task is unchanged during push", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockResolvedValue({ ...task });
      });

      When("push results are applied", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then('syncStatus is set to "synced"', async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", syncStatus: "synced" as const }),
        );
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Accepted result keeps dirty flag when changed during push",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", syncStatus: "pending" as const });

      Given("a dirty task was pushed", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getNeedingSync as ReturnType<typeof vi.fn>
        ).mockResolvedValue([task]);
      });

      And("server returned accepted status", async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse(
                { tasks: [{ id: "t1", status: "accepted" }] },
                6,
              ),
            ),
        });
      });

      And("local task changed during push", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockResolvedValue({
          ...task,
          name: "Changed name",
          updated_at: "2026-05-13T16:00:00.000Z",
        });
      });

      When("push results are applied", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then('syncStatus remains "pending"', async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", syncStatus: "pending" as const }),
        );
      });
    },
  );
});
