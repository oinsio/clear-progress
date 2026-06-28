// implements FR11 of repeating-tasks-specs
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { HiddenTaskService } from "@/services/HiddenTaskService";
import { buildTask } from "@/test/factories/taskFactory";

const feature = await loadFeature("../hidden_task_reveal.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let hiddenTaskService: HiddenTaskService;
  let seededTaskId: string;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
  });

  // @repeating-tasks-specs @FR11
  f.Scenario(
    "Reveal tasks whose appear_date has arrived",
    ({ Given, When, Then }) => {
      Given(
        'hidden task with appear_date "2026-06-15" and today is "2026-06-15"',
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
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("system reveals hidden tasks", async (_ctx: TestContext) => {
        await hiddenTaskService.revealHiddenTasks();
      });

      Then(
        'task has is_hidden false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(seededTaskId);
          expect(task?.is_hidden).toBe(false);
          expect(task?.syncStatus).toBe("pending");
        },
      );
    },
  );

  // @repeating-tasks-specs @FR11
  f.Scenario(
    "Do not reveal tasks whose appear_date is future",
    ({ Given, When, Then }) => {
      Given(
        'hidden task with appear_date "2026-06-20" and today is "2026-06-15"',
        async (_ctx: TestContext) => {
          const clock = fakeClock("2026-06-15T12:00:00Z");
          hiddenTaskService = new HiddenTaskService(
            new TaskRepository(),
            clock,
          );
          const task = buildTask({
            is_hidden: true,
            appear_date: "2026-06-20",
            next_date: "2026-06-20",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("system reveals hidden tasks", async (_ctx: TestContext) => {
        await hiddenTaskService.revealHiddenTasks();
      });

      Then("task remains hidden", async (_ctx: TestContext) => {
        const task = await db.tasks.get(seededTaskId);
        expect(task?.is_hidden).toBe(true);
      });
    },
  );
});
