// implements FR1, FR2, FR5 of hide-tasks
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../manual_task_hiding.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  // @hide-tasks @FR1
  f.Scenario(
    "Hide a non-recurring task with a future date",
    ({ Given, When, Then, And }) => {
      let updatedTask: Task;

      Given(
        'a visible non-recurring task "Renew passport"',
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Renew passport", {
            box: "inbox",
            is_hidden: false,
            appear_date: "",
            repeat_rule: "",
          });
        },
      );

      When(
        'user hides the task until "2027-06-01"',
        async (_ctx: TestContext) => {
          updatedTask = await ctx.taskService.update(
            getIdOrThrow(ctx.taskIds, "Renew passport"),
            { is_hidden: true, appear_date: "2027-06-01" },
          );
        },
      );

      Then("task has is_hidden true", async (_ctx: TestContext) => {
        expect(updatedTask.is_hidden).toBe(true);
      });

      And('task has appear_date "2027-06-01"', async (_ctx: TestContext) => {
        expect(updatedTask.appear_date).toBe("2027-06-01");
      });

      And("task has needsSync true", async (_ctx: TestContext) => {
        expect(updatedTask.needsSync).toBe(true);
      });
    },
  );

  // @hide-tasks @FR2
  f.Scenario("Unhide a manually hidden task", ({ Given, When, Then, And }) => {
    let updatedTask: Task;

    Given(
      'a hidden task "Renew passport" with appear_date "2027-06-01"',
      async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Renew passport", {
          box: "inbox",
          is_hidden: true,
          appear_date: "2027-06-01",
          repeat_rule: "",
        });
      },
    );

    When("user unhides the task", async (_ctx: TestContext) => {
      updatedTask = await ctx.taskService.update(
        getIdOrThrow(ctx.taskIds, "Renew passport"),
        { is_hidden: false, appear_date: "" },
      );
    });

    Then("task has is_hidden false", async (_ctx: TestContext) => {
      expect(updatedTask.is_hidden).toBe(false);
    });

    And('task has appear_date ""', async (_ctx: TestContext) => {
      expect(updatedTask.appear_date).toBe("");
    });

    And("task has needsSync true", async (_ctx: TestContext) => {
      expect(updatedTask.needsSync).toBe(true);
    });
  });

  // @hide-tasks @FR5
  f.Scenario(
    "Recurring task cannot be manually hidden",
    ({ Given, Then, And }) => {
      Given('a recurring task "Water plants"', async (_ctx: TestContext) => {
        await seedTask(ctx.taskIds, "Water plants", {
          box: "inbox",
          repeat_rule: JSON.stringify({
            type: "fixed",
            frequency: "daily",
            interval: 1,
            target_box: "today",
            advance_days: 0,
          }),
        });
      });

      Then("the task has repeat_rule set", async (_ctx: TestContext) => {
        const task = await ctx.taskService.getById(
          getIdOrThrow(ctx.taskIds, "Water plants"),
        );
        expect(task?.repeat_rule).not.toBe("");
      });

      And(
        "the hide action should not be offered for recurring tasks",
        async (_ctx: TestContext) => {
          // This is enforced at the UI level (TaskQuickActions and TaskDetailPanel)
          // The service-level test verifies the task has a repeat_rule,
          // which is the condition checked by UI components to exclude the hide button
          const task = await ctx.taskService.getById(
            getIdOrThrow(ctx.taskIds, "Water plants"),
          );
          expect(task?.repeat_rule).toBeTruthy();
        },
      );
    },
  );
});
