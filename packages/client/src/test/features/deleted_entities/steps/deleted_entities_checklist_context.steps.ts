// implements FR6 of deleted-entities-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildTask } from "@/test/factories/taskFactory";

const feature = await loadFeature(
  "../deleted_entities_checklist_context.feature",
);

type FeatureContext = Record<string, never>;

async function buildTaskNameMap(): Promise<Map<string, string>> {
  const allTasks = await db.tasks.toArray();
  return new Map<string, string>(allTasks.map((task) => [task.id, task.name]));
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(async () => {
      await db.tasks.clear();
      await db.checklist_items.clear();
    });

    // @deleted-entities-spec @FR6
    f.Scenario(
      "Checklist item has parent task name available",
      ({ Given, When, Then }) => {
        let taskNameMap: Map<string, string>;
        let taskId: string;

        Given(
          'a task "Morning routine" with a deleted checklist item "Brush teeth" exists',
          async (_ctx: TestContext) => {
            const task = buildTask({
              name: "Morning routine",
              is_deleted: false,
            });
            taskId = task.id;
            await db.tasks.add(task);
            await db.checklist_items.add(
              buildChecklistItem({
                task_id: taskId,
                name: "Brush teeth",
                is_deleted: true,
              }),
            );
          },
        );

        When("the task name map is queried", async (_ctx: TestContext) => {
          taskNameMap = await buildTaskNameMap();
        });

        Then(
          'the map contains the task id mapped to "Morning routine"',
          async (_ctx: TestContext) => {
            expect(taskNameMap.get(taskId)).toBe("Morning routine");
          },
        );
      },
    );

    // @deleted-entities-spec @FR6
    f.Scenario(
      "Task name map includes deleted parent tasks",
      ({ Given, When, Then }) => {
        let taskNameMap: Map<string, string>;
        let deletedTaskId: string;

        Given(
          'a deleted task "Old routine" with a deleted checklist item "Wake up" exists',
          async (_ctx: TestContext) => {
            const task = buildTask({
              name: "Old routine",
              is_deleted: true,
            });
            deletedTaskId = task.id;
            await db.tasks.add(task);
            await db.checklist_items.add(
              buildChecklistItem({
                task_id: deletedTaskId,
                name: "Wake up",
                is_deleted: true,
              }),
            );
          },
        );

        When("the task name map is queried", async (_ctx: TestContext) => {
          taskNameMap = await buildTaskNameMap();
        });

        Then(
          'the map contains the deleted task id mapped to "Old routine"',
          async (_ctx: TestContext) => {
            expect(taskNameMap.get(deletedTaskId)).toBe("Old routine");
          },
        );
      },
    );

    // @deleted-entities-spec @FR6
    f.Scenario(
      "Task name map is empty when no tasks exist",
      ({ Given, When, Then }) => {
        let taskNameMap: Map<string, string>;

        Given("no tasks exist in the database", async (_ctx: TestContext) => {
          // DB is already cleared in BeforeEachScenario
        });

        When("the task name map is queried", async (_ctx: TestContext) => {
          taskNameMap = await buildTaskNameMap();
        });

        Then("the map is empty", async (_ctx: TestContext) => {
          expect(taskNameMap.size).toBe(0);
        });
      },
    );
  },
);
