// implements spec-sync-protocol — dirty flag lifecycle (FR4)
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
      Given("a task exists with version 1", async (_ctx: TestContext) => {
        existingTask = makeTask({ version: 1 });
      });

      When(
        "compared to same task with version 2",
        async (_ctx: TestContext) => {
          updatedTask = { ...existingTask, version: 2 };
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
    "Created/accepted clears dirty flag if version unchanged",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", version: 3, needsSync: true });

      Given(
        "a dirty task with version 3 was pushed",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
        },
      );

      And("server returned created status", async (_ctx: TestContext) => {
        syncAdapter = createMockSyncAdapter({
          push: vi
            .fn()
            .mockResolvedValue(
              makePushResponse({ tasks: [{ id: "t1", status: "created" }] }, 5),
            ),
        });
      });

      And("local version is still 3", async (_ctx: TestContext) => {
        (
          repositories.taskRepository.getById as ReturnType<typeof vi.fn>
        ).mockResolvedValue({ ...task, version: 3 });
      });

      When("push results are applied", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("needsSync is set to false", async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", needsSync: false }),
        );
      });
    },
  );

  // @spec-sync-protocol @FR4
  f.Scenario(
    "Created/accepted keeps dirty flag if version changed locally",
    ({ Given, And, When, Then }) => {
      const task = makeTask({ id: "t1", version: 3, needsSync: true });

      Given(
        "a dirty task with version 3 was pushed",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getNeedingSync as ReturnType<
              typeof vi.fn
            >
          ).mockResolvedValue([task]);
        },
      );

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

      And(
        "local version changed to 4 during push",
        async (_ctx: TestContext) => {
          (
            repositories.taskRepository.getById as ReturnType<typeof vi.fn>
          ).mockResolvedValue({ ...task, version: 4 });
        },
      );

      When("push results are applied", async (_ctx: TestContext) => {
        const service = createSyncService(syncAdapter, repositories);
        await service.push();
      });

      Then("needsSync remains true", async (_ctx: TestContext) => {
        expect(repositories.taskRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ id: "t1", needsSync: true }),
        );
      });
    },
  );
});
