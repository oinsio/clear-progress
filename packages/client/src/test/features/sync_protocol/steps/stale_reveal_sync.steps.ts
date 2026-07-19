// implements FR1, FR2 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../stale_reveal_sync.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let hiddenTaskService: HiddenTaskService;
  let taskService: TaskService;
  let seededTaskId: string;
  let updatedTask: Task;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
    );
  });

  async function revealHiddenTasks(_ctx: TestContext) {
    await hiddenTaskService.revealHiddenTasks();
  }

  async function expectRevealedTaskUnhiddenAndPending(_ctx: TestContext) {
    const task = await db.tasks.get(seededTaskId);
    expect(task?.is_hidden).toBe(false);
    expect(task?.syncStatus).toBe("pending");
  }

  async function expectRevealedTaskUpdatedAtPreserved(_ctx: TestContext) {
    const task = await db.tasks.get(seededTaskId);
    expect(task?.updated_at).toBe("2026-06-01T10:00:00.000Z");
  }

  // @fix-stale-sync-overwrites @FR1
  f.Scenario(
    "Task revealed when appear date arrives preserves updated_at",
    ({ Given, When, Then, And }) => {
      Given(
        'a hidden task with appear_date "2026-06-15", updated_at "2026-06-01T10:00:00.000Z" and today is "2026-06-15"',
        async (_ctx: TestContext) => {
          const clock = fakeClock("2026-06-15T12:00:00Z");
          hiddenTaskService = new HiddenTaskService(
            new TaskRepository(),
            clock,
          );
          const task = buildTask({
            is_hidden: true,
            appear_date: "2026-06-15",
            next_date: "2026-06-15",
            updated_at: "2026-06-01T10:00:00.000Z",
            syncStatus: "synced",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("system reveals hidden tasks", revealHiddenTasks);

      Then(
        'the task has is_hidden false and syncStatus "pending"',
        expectRevealedTaskUnhiddenAndPending,
      );

      And(
        'the task\'s updated_at is still "2026-06-01T10:00:00.000Z"',
        expectRevealedTaskUpdatedAtPreserved,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR1
  f.Scenario(
    "Reveal of an already-pending record does not degrade its state",
    ({ Given, When, Then, And }) => {
      Given(
        'a hidden task with appear_date "2026-06-15", updated_at "2026-06-01T10:00:00.000Z", syncStatus "pending" and today is "2026-06-15"',
        async (_ctx: TestContext) => {
          const clock = fakeClock("2026-06-15T12:00:00Z");
          hiddenTaskService = new HiddenTaskService(
            new TaskRepository(),
            clock,
          );
          const task = buildTask({
            is_hidden: true,
            appear_date: "2026-06-15",
            next_date: "2026-06-15",
            updated_at: "2026-06-01T10:00:00.000Z",
            syncStatus: "pending",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("system reveals hidden tasks", revealHiddenTasks);

      Then(
        'the task has is_hidden false and syncStatus "pending"',
        expectRevealedTaskUnhiddenAndPending,
      );

      And(
        'the task\'s updated_at is still "2026-06-01T10:00:00.000Z"',
        expectRevealedTaskUpdatedAtPreserved,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR2
  f.Scenario(
    "Manual hide sets appear_date, refreshes updated_at, and marks pending for sync",
    ({ Given, When, Then, And }) => {
      Given(
        'a visible task with updated_at "2026-06-01T10:00:00.000Z" and syncStatus "synced"',
        async (_ctx: TestContext) => {
          const task = buildTask({
            is_hidden: false,
            appear_date: "",
            updated_at: "2026-06-01T10:00:00.000Z",
            syncStatus: "synced",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When(
        'the user manually hides the task with appear_date "2026-08-01"',
        async (_ctx: TestContext) => {
          updatedTask = await taskService.update(seededTaskId, {
            is_hidden: true,
            appear_date: "2026-08-01",
          });
        },
      );

      Then(
        'the task has is_hidden true and appear_date "2026-08-01"',
        async (_ctx: TestContext) => {
          expect(updatedTask.is_hidden).toBe(true);
          expect(updatedTask.appear_date).toBe("2026-08-01");
        },
      );

      And(
        'the task\'s updated_at is refreshed past "2026-06-01T10:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(updatedTask.updated_at).not.toBe("2026-06-01T10:00:00.000Z");
        },
      );

      And('the task has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(updatedTask.syncStatus).toBe("pending");
      });
    },
  );

  // @fix-stale-sync-overwrites @FR2
  f.Scenario(
    "Manual unhide before appear date clears appear_date, refreshes updated_at, and marks pending for sync",
    ({ Given, When, Then, And }) => {
      Given(
        'a hidden task with appear_date "2026-08-01", updated_at "2026-06-01T10:00:00.000Z" and syncStatus "synced"',
        async (_ctx: TestContext) => {
          const task = buildTask({
            is_hidden: true,
            appear_date: "2026-08-01",
            updated_at: "2026-06-01T10:00:00.000Z",
            syncStatus: "synced",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("the user manually unhides the task", async (_ctx: TestContext) => {
        updatedTask = await taskService.update(seededTaskId, {
          is_hidden: false,
          appear_date: "",
        });
      });

      Then(
        'the task has is_hidden false and appear_date ""',
        async (_ctx: TestContext) => {
          expect(updatedTask.is_hidden).toBe(false);
          expect(updatedTask.appear_date).toBe("");
        },
      );

      And(
        'the task\'s updated_at is refreshed past "2026-06-01T10:00:00.000Z"',
        async (_ctx: TestContext) => {
          expect(updatedTask.updated_at).not.toBe("2026-06-01T10:00:00.000Z");
        },
      );

      And('the task has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(updatedTask.syncStatus).toBe("pending");
      });
    },
  );
});
