// implements FR2, FR8 of deleted-entities-spec
// implements FR20 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { EntityTable } from "dexie";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { CategoryService } from "@/services/CategoryService";
import { ChecklistService } from "@/services/ChecklistService";
import { ContextService } from "@/services/ContextService";
import { GoalService } from "@/services/GoalService";
import { IdeaService } from "@/services/IdeaService";
import { TaskService } from "@/services/TaskService";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildIdea } from "@/test/factories/ideaFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { clearAllEntityTables } from "./deleted_entities_steps.helpers";

const feature = await loadFeature("../deleted_entities_restore.feature");

type FeatureContext = Record<string, never>;

type SoftDeletable = { id: string; is_deleted: boolean; syncStatus: string };

async function addDeletedEntity<T extends SoftDeletable>(
  table: EntityTable<T, "id">,
  factory: (overrides: Partial<T>) => T,
  name: string,
): Promise<string> {
  const entity = factory({
    name,
    is_deleted: true,
    syncStatus: "synced" as const,
  } as unknown as Partial<T>);
  await table.add(entity);
  return entity.id;
}

async function assertRestoredEntity<T extends SoftDeletable>(
  table: EntityTable<T, "id">,
  entityId: string,
): Promise<void> {
  const restored = await table.get(
    entityId as unknown as Parameters<typeof table.get>[0],
  );
  expect(restored?.is_deleted).toBe(false);
  expect(restored?.syncStatus).toBe("pending");
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const checklistRepository = new ChecklistRepository();
    const taskService = new TaskService(
      new TaskRepository(),
      checklistRepository,
    );
    const goalService = new GoalService(new GoalRepository());
    const contextService = new ContextService(new ContextRepository());
    const categoryService = new CategoryService(new CategoryRepository());
    const checklistService = new ChecklistService(checklistRepository);
    const ideaService = new IdeaService(new IdeaRepository());

    f.BeforeEachScenario(async () => {
      await clearAllEntityTables();
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted task", ({ Given, When, Then }) => {
      let taskId: string;

      Given(
        'a deleted task "Buy groceries" exists',
        async (_ctx: TestContext) => {
          taskId = await addDeletedEntity(db.tasks, buildTask, "Buy groceries");
        },
      );

      When("the task is restored", async (_ctx: TestContext) => {
        await taskService.restore(taskId);
      });

      Then(
        'the task has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.tasks, taskId);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario(
      "Restore a deleted task cascades to checklist items",
      ({ Given, When, Then, And }) => {
        let taskId: string;

        Given(
          'a deleted task "Morning routine" with deleted checklist items exists',
          async (_ctx: TestContext) => {
            taskId = await addDeletedEntity(
              db.tasks,
              buildTask,
              "Morning routine",
            );
            await db.checklist_items.bulkAdd([
              buildChecklistItem({
                task_id: taskId,
                name: "Brush teeth",
                is_deleted: true,
                syncStatus: "synced" as const,
              }),
              buildChecklistItem({
                task_id: taskId,
                name: "Make bed",
                is_deleted: true,
                syncStatus: "synced" as const,
              }),
            ]);
          },
        );

        When("the task is restored", async (_ctx: TestContext) => {
          await taskService.restore(taskId);
        });

        Then("the task has is_deleted false", async (_ctx: TestContext) => {
          const restored = await db.tasks.get(taskId);
          expect(restored?.is_deleted).toBe(false);
        });

        And(
          "all checklist items of that task have is_deleted false",
          async (_ctx: TestContext) => {
            const items = await db.checklist_items
              .where("task_id")
              .equals(taskId)
              .toArray();
            expect(items).toHaveLength(2);
            for (const item of items) {
              expect(item.is_deleted).toBe(false);
            }
          },
        );
      },
    );

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted goal", ({ Given, When, Then }) => {
      let goalId: string;

      Given(
        'a deleted goal "Learn TypeScript" exists',
        async (_ctx: TestContext) => {
          goalId = await addDeletedEntity(
            db.goals,
            buildGoal,
            "Learn TypeScript",
          );
        },
      );

      When("the goal is restored", async (_ctx: TestContext) => {
        await goalService.restore(goalId);
      });

      Then(
        'the goal has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.goals, goalId);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted context", ({ Given, When, Then }) => {
      let contextId: string;

      Given('a deleted context "@home" exists', async (_ctx: TestContext) => {
        contextId = await addDeletedEntity(db.contexts, buildContext, "@home");
      });

      When("the context is restored", async (_ctx: TestContext) => {
        await contextService.restore(contextId);
      });

      Then(
        'the context has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.contexts, contextId);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted category", ({ Given, When, Then }) => {
      let categoryId: string;

      Given('a deleted category "Work" exists', async (_ctx: TestContext) => {
        categoryId = await addDeletedEntity(
          db.categories,
          buildCategory,
          "Work",
        );
      });

      When("the category is restored", async (_ctx: TestContext) => {
        await categoryService.restore(categoryId);
      });

      Then(
        'the category has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.categories, categoryId);
        },
      );
    });

    // @swipeable-item @FR20
    f.Scenario("Restore a deleted idea", ({ Given, When, Then }) => {
      let ideaId: string;

      Given(
        'a deleted idea "Research topic" exists',
        async (_ctx: TestContext) => {
          ideaId = await addDeletedEntity(
            db.ideas,
            buildIdea,
            "Research topic",
          );
        },
      );

      When("the idea is restored", async (_ctx: TestContext) => {
        await ideaService.restore(ideaId);
      });

      Then(
        'the idea has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.ideas, ideaId);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted checklist item", ({ Given, When, Then }) => {
      let checklistItemId: string;

      Given(
        'a deleted checklist item "Step 1" exists',
        async (_ctx: TestContext) => {
          const taskForChecklist = buildTask({ name: "Parent task" });
          await db.tasks.add(taskForChecklist);
          const item = buildChecklistItem({
            task_id: taskForChecklist.id,
            name: "Step 1",
            is_deleted: true,
            syncStatus: "synced" as const,
          });
          checklistItemId = item.id;
          await db.checklist_items.add(item);
        },
      );

      When("the checklist item is restored", async (_ctx: TestContext) => {
        await checklistService.restore(checklistItemId);
      });

      Then(
        'the checklist item has is_deleted false and syncStatus "pending"',
        async (_ctx: TestContext) => {
          await assertRestoredEntity(db.checklist_items, checklistItemId);
        },
      );
    });
  },
);
