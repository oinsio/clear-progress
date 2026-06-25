// implements FR1, FR3, FR5 of deleted-entities-spec
// implements FR19 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import type {
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Task,
} from "@/types/entities";
import { clearAllEntityTables } from "./deleted_entities_steps.helpers";

const feature = await loadFeature("../deleted_entities_aggregation.feature");

type FeatureContext = Record<string, never>;

type DeletedEntitiesResult = {
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  contexts: Context[];
  categories: Category[];
  checklistItems: ChecklistItem[];
};

function expectAllEntitiesEmpty(result: DeletedEntitiesResult) {
  expect(result.tasks).toHaveLength(0);
  expect(result.goals).toHaveLength(0);
  expect(result.ideas).toHaveLength(0);
  expect(result.contexts).toHaveLength(0);
  expect(result.categories).toHaveLength(0);
  expect(result.checklistItems).toHaveLength(0);
}

async function queryDeletedEntities() {
  const tasks = await db.tasks.filter((task) => task.is_deleted).toArray();
  const goals = await db.goals.filter((goal) => goal.is_deleted).toArray();
  const ideas = await db.ideas.filter((idea) => idea.is_deleted).toArray();
  const contexts = await db.contexts
    .filter((context) => context.is_deleted)
    .toArray();
  const categories = await db.categories
    .filter((category) => category.is_deleted)
    .toArray();
  const checklistItems = await db.checklist_items
    .filter((item) => item.is_deleted)
    .toArray();
  return { tasks, goals, ideas, contexts, categories, checklistItems };
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(async () => {
      await clearAllEntityTables();
    });

    // @deleted-entities-spec @FR1
    f.Scenario(
      "All deleted entities are returned grouped by type",
      ({ Given, When, Then, And }) => {
        let result: DeletedEntitiesResult;

        Given(
          "deleted entities exist across all types",
          async (_ctx: TestContext) => {
            await db.tasks.add(buildTask({ is_deleted: true }));
            await db.goals.add(buildGoal({ is_deleted: true }));
            await db.contexts.add(buildContext({ is_deleted: true }));
            await db.categories.add(buildCategory({ is_deleted: true }));
            await db.checklist_items.add(
              buildChecklistItem({ is_deleted: true }),
            );
          },
        );

        When("the deleted entities are queried", async (_ctx: TestContext) => {
          result = await queryDeletedEntities();
        });

        Then(
          "tasks array contains only deleted tasks",
          async (_ctx: TestContext) => {
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].is_deleted).toBe(true);
          },
        );

        And(
          "goals array contains only deleted goals",
          async (_ctx: TestContext) => {
            expect(result.goals).toHaveLength(1);
            expect(result.goals[0].is_deleted).toBe(true);
          },
        );

        And(
          "contexts array contains only deleted contexts",
          async (_ctx: TestContext) => {
            expect(result.contexts).toHaveLength(1);
            expect(result.contexts[0].is_deleted).toBe(true);
          },
        );

        And(
          "categories array contains only deleted categories",
          async (_ctx: TestContext) => {
            expect(result.categories).toHaveLength(1);
            expect(result.categories[0].is_deleted).toBe(true);
          },
        );

        And(
          "checklist items array contains only deleted checklist items",
          async (_ctx: TestContext) => {
            expect(result.checklistItems).toHaveLength(1);
            expect(result.checklistItems[0].is_deleted).toBe(true);
          },
        );
      },
    );

    // @deleted-entities-spec @FR1
    f.Scenario(
      "Only deleted entities are included",
      ({ Given, When, Then }) => {
        let result: { tasks: Task[] };

        Given(
          "a mix of active and deleted tasks exists",
          async (_ctx: TestContext) => {
            await db.tasks.add(
              buildTask({ name: "Active task", is_deleted: false }),
            );
            await db.tasks.add(
              buildTask({ name: "Deleted task", is_deleted: true }),
            );
          },
        );

        When("the deleted entities are queried", async (_ctx: TestContext) => {
          const tasks = await db.tasks
            .filter((task) => task.is_deleted)
            .toArray();
          result = { tasks };
        });

        Then(
          "tasks array contains only entities with is_deleted true",
          async (_ctx: TestContext) => {
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].is_deleted).toBe(true);
          },
        );
      },
    );

    // @deleted-entities-spec @FR1
    f.Scenario(
      "Active entities are excluded from all types",
      ({ Given, When, Then }) => {
        let result: DeletedEntitiesResult;

        Given(
          "only active entities exist across all types",
          async (_ctx: TestContext) => {
            await db.tasks.add(buildTask({ is_deleted: false }));
            await db.goals.add(buildGoal({ is_deleted: false }));
            await db.contexts.add(buildContext({ is_deleted: false }));
            await db.categories.add(buildCategory({ is_deleted: false }));
            await db.checklist_items.add(
              buildChecklistItem({ is_deleted: false }),
            );
          },
        );

        When("the deleted entities are queried", async (_ctx: TestContext) => {
          result = await queryDeletedEntities();
        });

        Then("all entity type arrays are empty", async (_ctx: TestContext) => {
          expectAllEntitiesEmpty(result);
        });
      },
    );

    // @deleted-entities-spec @FR3
    f.Scenario(
      "Empty state with no deleted entities",
      ({ Given, When, Then }) => {
        let result: DeletedEntitiesResult;

        Given(
          "no deleted entities exist in the database",
          async (_ctx: TestContext) => {
            // DB is already cleared in BeforeEachScenario
          },
        );

        When("the deleted entities are queried", async (_ctx: TestContext) => {
          result = await queryDeletedEntities();
        });

        Then("all entity type arrays are empty", async (_ctx: TestContext) => {
          expectAllEntitiesEmpty(result);
        });
      },
    );

    // @deleted-entities-spec @FR3
    f.Scenario(
      "Non-empty state with at least one deleted entity",
      ({ Given, When, Then }) => {
        let result: { tasks: Task[] };

        Given("one deleted task exists", async (_ctx: TestContext) => {
          await db.tasks.add(buildTask({ is_deleted: true }));
        });

        When("the deleted entities are queried", async (_ctx: TestContext) => {
          const tasks = await db.tasks
            .filter((task) => task.is_deleted)
            .toArray();
          result = { tasks };
        });

        Then("tasks array is not empty", async (_ctx: TestContext) => {
          expect(result.tasks.length).toBeGreaterThan(0);
        });
      },
    );

    // @swipeable-item @FR19
    f.Scenario(
      "Deleted ideas are included in aggregation",
      ({ Given, When, Then }) => {
        let result: DeletedEntitiesResult;

        Given(
          'a deleted idea "Research topic" exists',
          async (_ctx: TestContext) => {
            await db.ideas.add(
              buildIdea({ name: "Research topic", is_deleted: true }),
            );
          },
        );

        When("deleted entities are loaded", async (_ctx: TestContext) => {
          result = await queryDeletedEntities();
        });

        Then(
          'the ideas array contains "Research topic"',
          async (_ctx: TestContext) => {
            expect(result.ideas).toHaveLength(1);
            expect(result.ideas[0].name).toBe("Research topic");
          },
        );
      },
    );

    // @swipeable-item @FR19
    f.Scenario(
      "Non-empty state with at least one deleted idea",
      ({ Given, When, Then, And }) => {
        let result: DeletedEntitiesResult;

        Given(
          'a deleted idea "Research topic" exists',
          async (_ctx: TestContext) => {
            await db.ideas.add(
              buildIdea({ name: "Research topic", is_deleted: true }),
            );
          },
        );

        And("no other entities are deleted", async (_ctx: TestContext) => {
          // DB is cleared in BeforeEachScenario, only the idea above exists
        });

        When("deleted entities are loaded", async (_ctx: TestContext) => {
          result = await queryDeletedEntities();
        });

        Then("isEmpty is false", async (_ctx: TestContext) => {
          const isEmpty =
            result.tasks.length === 0 &&
            result.goals.length === 0 &&
            result.ideas.length === 0 &&
            result.contexts.length === 0 &&
            result.categories.length === 0 &&
            result.checklistItems.length === 0;
          expect(isEmpty).toBe(false);
        });
      },
    );

    // @deleted-entities-spec @FR5
    f.Scenario(
      "Newly deleted entity appears after query",
      ({ Given, When, Then }) => {
        let deletedTasksAfter: Task[];
        let newTaskId: string;

        Given("no deleted tasks exist", async (_ctx: TestContext) => {
          const initial = await db.tasks
            .filter((task) => task.is_deleted)
            .toArray();
          expect(initial).toHaveLength(0);
        });

        When(
          "a task is soft-deleted after initial query",
          async (_ctx: TestContext) => {
            const newTask = buildTask({
              name: "Newly deleted",
              is_deleted: true,
            });
            newTaskId = newTask.id;
            await db.tasks.add(newTask);
            deletedTasksAfter = await db.tasks
              .filter((task) => task.is_deleted)
              .toArray();
          },
        );

        Then(
          "the deleted tasks array includes the newly deleted task",
          async (_ctx: TestContext) => {
            expect(deletedTasksAfter).toHaveLength(1);
            expect(deletedTasksAfter[0].id).toBe(newTaskId);
          },
        );
      },
    );
  },
);
