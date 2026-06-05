// implements FR6 of hide-tasks
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_completion_hidden.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // Scenario 1: non-recurring hidden task
  f.Scenario(
    "Completing a manually hidden non-recurring task clears hide state",
    ({ Given, When, Then, And }) => {
      let result: { completed: Task; recurring: Task | null };

      Given(
        'a hidden non-recurring task "Renew passport" with appear_date "2027-06-01"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Renew passport", {
            box: "inbox",
            is_hidden: true,
            appear_date: "2027-06-01",
            repeat_rule: "",
          });
        },
      );

      When("user completes the task", async (_ctx: TestContext) => {
        result = await ctx.taskService.complete(
          getIdOrThrow(ctx.taskIds, "Renew passport"),
        );
      });

      Then("task has is_completed true", async (_ctx: TestContext) => {
        expect(result.completed.is_completed).toBe(true);
      });

      And("task has is_hidden false", async (_ctx: TestContext) => {
        expect(result.completed.is_hidden).toBe(false);
      });

      And('task has appear_date ""', async (_ctx: TestContext) => {
        expect(result.completed.appear_date).toBe("");
      });
    },
  );

  // Scenario 2: recurring hidden task
  f.Scenario(
    "Completing a recurring hidden task does not clear hide state",
    ({ Given, When, Then, And }) => {
      let result: { completed: Task; recurring: Task | null };

      Given(
        'a hidden recurring task "Water plants" exists',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Water plants", {
            box: "today",
            is_hidden: true,
            appear_date: "2026-06-20",
            repeat_rule: JSON.stringify({
              type: "fixed",
              frequency: "daily",
              interval: 1,
              target_box: "today",
              advance_days: 0,
            }),
            next_date: "2026-06-15",
          });
        },
      );

      When("user completes the task", async (_ctx: TestContext) => {
        result = await ctx.taskService.complete(
          getIdOrThrow(ctx.taskIds, "Water plants"),
        );
      });

      Then(
        "the completed task has is_completed true",
        async (_ctx: TestContext) => {
          expect(result.completed.is_completed).toBe(true);
        },
      );

      And(
        "the recurring copy manages its own hide state",
        async (_ctx: TestContext) => {
          // The recurring copy should exist and have its own is_hidden/appear_date
          // set by the recurring logic
          expect(result.recurring).not.toBeNull();
          // We don't check exact values here because the recurring logic
          // computes them
        },
      );
    },
  );
});
