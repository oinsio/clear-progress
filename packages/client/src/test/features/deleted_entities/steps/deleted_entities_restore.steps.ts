// implements FR2, FR8 of deleted-entities-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { CategoryService } from "@/services/CategoryService";
import { ChecklistService } from "@/services/ChecklistService";
import { ContextService } from "@/services/ContextService";
import { GoalService } from "@/services/GoalService";
import { TaskService } from "@/services/TaskService";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";

const feature = await loadFeature("../deleted_entities_restore.feature");

type FeatureContext = Record<string, never>;

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

    f.BeforeEachScenario(async () => {
      await db.tasks.clear();
      await db.goals.clear();
      await db.contexts.clear();
      await db.categories.clear();
      await db.checklist_items.clear();
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted task", ({ Given, When, Then }) => {
      let taskId: string;

      Given(
        'a deleted task "Buy groceries" exists',
        async (_ctx: TestContext) => {
          const task = buildTask({
            name: "Buy groceries",
            is_deleted: true,
            needsSync: false,
          });
          taskId = task.id;
          await db.tasks.add(task);
        },
      );

      When("the task is restored", async (_ctx: TestContext) => {
        await taskService.restore(taskId);
      });

      Then(
        "the task has is_deleted false and needsSync true",
        async (_ctx: TestContext) => {
          const restored = await db.tasks.get(taskId);
          expect(restored?.is_deleted).toBe(false);
          expect(restored?.needsSync).toBe(true);
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
            const task = buildTask({
              name: "Morning routine",
              is_deleted: true,
              needsSync: false,
            });
            taskId = task.id;
            await db.tasks.add(task);
            await db.checklist_items.bulkAdd([
              buildChecklistItem({
                task_id: taskId,
                name: "Brush teeth",
                is_deleted: true,
                needsSync: false,
              }),
              buildChecklistItem({
                task_id: taskId,
                name: "Make bed",
                is_deleted: true,
                needsSync: false,
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
          const goal = buildGoal({
            name: "Learn TypeScript",
            is_deleted: true,
            needsSync: false,
          });
          goalId = goal.id;
          await db.goals.add(goal);
        },
      );

      When("the goal is restored", async (_ctx: TestContext) => {
        await goalService.restore(goalId);
      });

      Then(
        "the goal has is_deleted false and needsSync true",
        async (_ctx: TestContext) => {
          const restored = await db.goals.get(goalId);
          expect(restored?.is_deleted).toBe(false);
          expect(restored?.needsSync).toBe(true);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted context", ({ Given, When, Then }) => {
      let contextId: string;

      Given('a deleted context "@home" exists', async (_ctx: TestContext) => {
        const context = buildContext({
          name: "@home",
          is_deleted: true,
          needsSync: false,
        });
        contextId = context.id;
        await db.contexts.add(context);
      });

      When("the context is restored", async (_ctx: TestContext) => {
        await contextService.restore(contextId);
      });

      Then(
        "the context has is_deleted false and needsSync true",
        async (_ctx: TestContext) => {
          const restored = await db.contexts.get(contextId);
          expect(restored?.is_deleted).toBe(false);
          expect(restored?.needsSync).toBe(true);
        },
      );
    });

    // @deleted-entities-spec @FR2 @FR8
    f.Scenario("Restore a deleted category", ({ Given, When, Then }) => {
      let categoryId: string;

      Given('a deleted category "Work" exists', async (_ctx: TestContext) => {
        const category = buildCategory({
          name: "Work",
          is_deleted: true,
          needsSync: false,
        });
        categoryId = category.id;
        await db.categories.add(category);
      });

      When("the category is restored", async (_ctx: TestContext) => {
        await categoryService.restore(categoryId);
      });

      Then(
        "the category has is_deleted false and needsSync true",
        async (_ctx: TestContext) => {
          const restored = await db.categories.get(categoryId);
          expect(restored?.is_deleted).toBe(false);
          expect(restored?.needsSync).toBe(true);
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
            needsSync: false,
          });
          checklistItemId = item.id;
          await db.checklist_items.add(item);
        },
      );

      When("the checklist item is restored", async (_ctx: TestContext) => {
        await checklistService.restore(checklistItemId);
      });

      Then(
        "the checklist item has is_deleted false and needsSync true",
        async (_ctx: TestContext) => {
          const restored = await db.checklist_items.get(checklistItemId);
          expect(restored?.is_deleted).toBe(false);
          expect(restored?.needsSync).toBe(true);
        },
      );
    });
  },
);
