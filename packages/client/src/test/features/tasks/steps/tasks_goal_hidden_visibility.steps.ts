// implements FR9 of hide-tasks
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  seedTask,
} from "@/test/helpers/bdd/tasks/helpers";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../tasks_goal_hidden_visibility.feature");

type Context = Record<string, never>;

const GOAL_ID = "goal-for-hidden-visibility-test";

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();

  f.BeforeEachScenario(async () => {
    await ctx.reset();
  });

  f.Scenario(
    "Hidden tasks included when showHidden is true",
    ({ Given, When, Then }) => {
      let fetchedTasks: Task[];

      Given(
        "a goal with a hidden task and a visible task",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Hidden task", {
            box: "today",
            goal_id: GOAL_ID,
            is_hidden: true,
            appear_date: "2027-01-01",
          });
          await seedTask(ctx.taskIds, "Visible task", {
            box: "today",
            goal_id: GOAL_ID,
            is_hidden: false,
          });
        },
      );

      When(
        "tasks are fetched with includeHidden true",
        async (_ctx: TestContext) => {
          fetchedTasks = await ctx.taskService.getByGoalId(GOAL_ID, {
            includeHidden: true,
          });
        },
      );

      Then("both tasks are returned", async (_ctx: TestContext) => {
        expect(fetchedTasks).toHaveLength(2);
        const names = fetchedTasks.map((task) => task.name).sort();
        expect(names).toEqual(["Hidden task", "Visible task"]);
      });
    },
  );

  f.Scenario(
    "Hidden tasks excluded when showHidden is false",
    ({ Given, When, Then }) => {
      let fetchedTasks: Task[];

      Given(
        "a goal with a hidden task and a visible task",
        async (_ctx: TestContext) => {
          await seedTask(ctx.taskIds, "Hidden task", {
            box: "today",
            goal_id: GOAL_ID,
            is_hidden: true,
            appear_date: "2027-01-01",
          });
          await seedTask(ctx.taskIds, "Visible task", {
            box: "today",
            goal_id: GOAL_ID,
            is_hidden: false,
          });
        },
      );

      When(
        "tasks are fetched with includeHidden false",
        async (_ctx: TestContext) => {
          fetchedTasks = await ctx.taskService.getByGoalId(GOAL_ID, {
            includeHidden: false,
          });
        },
      );

      Then("only the visible task is returned", async (_ctx: TestContext) => {
        expect(fetchedTasks).toHaveLength(1);
        expect(fetchedTasks[0].name).toBe("Visible task");
      });
    },
  );
});
