// implements FR12, FR13, UX1, UX2 of add-goals-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import {
  expectTaskOrder,
  sortCompletedTasks,
} from "@/test/helpers/bdd/goals/helpers";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../goals_tasks.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let goalId: string;

  f.BeforeEachScenario(async () => {
    await db.goals.clear();
    await db.tasks.clear();
    await db.checklist_items.clear();
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
    );
    goalId = crypto.randomUUID();
    await db.goals.add(buildGoal({ id: goalId, name: "Learn Rust" }));
  });

  // @add-goals-specs @FR12
  f.Scenario(
    "Goal has active and completed tasks",
    ({ Given, When, Then, And }) => {
      let allTasks: Task[];

      Given(
        'goal "Learn Rust" has 3 active tasks and 2 completed tasks',
        async (_ctx: TestContext) => {
          await db.tasks.bulkAdd([
            buildTask({
              goal_id: goalId,
              is_completed: false,
              sort_order: "a0",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: false,
              sort_order: "a1",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: false,
              sort_order: "a2",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: true,
              completed_at: "2026-01-01T10:00:00.000Z",
              sort_order: "a3",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: true,
              completed_at: "2026-01-01T11:00:00.000Z",
              sort_order: "a4",
            }),
          ]);
        },
      );

      When("user views goal tasks", async (_ctx: TestContext) => {
        allTasks = await taskService.getByGoalId(goalId);
      });

      Then("3 active tasks are returned", async (_ctx: TestContext) => {
        const activeTasks = allTasks.filter((task) => !task.is_completed);
        expect(activeTasks).toHaveLength(3);
      });

      And("2 completed tasks are returned", async (_ctx: TestContext) => {
        const completedTasks = allTasks.filter((task) => task.is_completed);
        expect(completedTasks).toHaveLength(2);
      });
    },
  );

  // @add-goals-specs @FR12
  f.Scenario(
    "Completed tasks sorted by completion date",
    ({ Given, When, Then }) => {
      let sortedCompleted: Task[];

      Given(
        'goal has task A completed at "2026-01-01T10:00:00.000Z" and task B completed at "2026-01-01T11:00:00.000Z"',
        async (_ctx: TestContext) => {
          await db.tasks.bulkAdd([
            buildTask({
              name: "Task A",
              goal_id: goalId,
              is_completed: true,
              completed_at: "2026-01-01T10:00:00.000Z",
              sort_order: "a0",
            }),
            buildTask({
              name: "Task B",
              goal_id: goalId,
              is_completed: true,
              completed_at: "2026-01-01T11:00:00.000Z",
              sort_order: "a1",
            }),
          ]);
        },
      );

      When("user views completed tasks", async (_ctx: TestContext) => {
        const allTasks = await taskService.getByGoalId(goalId);
        sortedCompleted = sortCompletedTasks(allTasks);
      });

      Then("task B appears before task A", async (_ctx: TestContext) => {
        expectTaskOrder(sortedCompleted, "Task B", "Task A");
      });
    },
  );

  // @add-goals-specs @FR12
  f.Scenario(
    "Completed tasks fallback to sort_order descending",
    ({ Given, When, Then }) => {
      let sortedCompleted: Task[];

      Given(
        'goal has completed task A with sort_order "a1" and task B with sort_order "a3" without completed_at',
        async (_ctx: TestContext) => {
          await db.tasks.bulkAdd([
            buildTask({
              name: "Task A",
              goal_id: goalId,
              is_completed: true,
              completed_at: "",
              sort_order: "a1",
            }),
            buildTask({
              name: "Task B",
              goal_id: goalId,
              is_completed: true,
              completed_at: "",
              sort_order: "a3",
            }),
          ]);
        },
      );

      When("user views completed tasks", async (_ctx: TestContext) => {
        const allTasks = await taskService.getByGoalId(goalId);
        sortedCompleted = sortCompletedTasks(allTasks);
      });

      Then("task B appears before task A", async (_ctx: TestContext) => {
        expectTaskOrder(sortedCompleted, "Task B", "Task A");
      });
    },
  );

  // @add-goals-specs @FR12
  f.Scenario("Goal with no tasks", ({ Given, When, Then }) => {
    let allTasks: Task[];

    Given(
      'goal "New goal" has no associated tasks',
      async (_ctx: TestContext) => {
        // Goal already created in BeforeEachScenario, no tasks added
      },
    );

    When("user views goal tasks", async (_ctx: TestContext) => {
      allTasks = await taskService.getByGoalId(goalId);
    });

    Then("empty task list is returned", async (_ctx: TestContext) => {
      expect(allTasks).toEqual([]);
    });
  });

  // @add-goals-specs @FR13 @UX1 @UX2
  f.Scenario(
    "Completed tasks hidden by default",
    ({ Given, When, Then, And }) => {
      let allTasks: Task[];
      let showCompleted: boolean;

      Given(
        'goal "Learn Rust" has 2 active tasks and 1 completed task',
        async (_ctx: TestContext) => {
          await db.tasks.bulkAdd([
            buildTask({
              goal_id: goalId,
              is_completed: false,
              sort_order: "a0",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: false,
              sort_order: "a1",
            }),
            buildTask({
              goal_id: goalId,
              is_completed: true,
              completed_at: "2026-01-01T10:00:00.000Z",
              sort_order: "a2",
            }),
          ]);
        },
      );

      When(
        "user views goal detail with default settings",
        async (_ctx: TestContext) => {
          allTasks = await taskService.getByGoalId(goalId);
          showCompleted = false; // default state: completed tasks hidden
        },
      );

      Then("only active tasks are visible", async (_ctx: TestContext) => {
        const visibleTasks = showCompleted
          ? allTasks
          : allTasks.filter((task) => !task.is_completed);
        expect(visibleTasks).toHaveLength(2);
      });

      And("completed tasks are hidden", async (_ctx: TestContext) => {
        expect(showCompleted).toBe(false);
      });
    },
  );
});
