// implements FR1 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { ChecklistItem } from "@/types/entities";
import {
  createScenarioContext,
  seedChecklistItem,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_crud_read.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR1
  f.Scenario(
    "Get items by task sorted by sort_order",
    ({ Given, When, Then, And }) => {
      let returnedItems: ChecklistItem[];

      Given("a task exists", async (_ctx: TestContext) => {});

      And(
        "checklist items with sort_order 2, 0, 1 for the task",
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Item A", {
            task_id: taskId,
            sort_order: 2,
          });
          await seedChecklistItem(ctx.checklistItemIds, "Item B", {
            task_id: taskId,
            sort_order: 0,
          });
          await seedChecklistItem(ctx.checklistItemIds, "Item C", {
            task_id: taskId,
            sort_order: 1,
          });
        },
      );

      When(
        "user requests checklist items for the task",
        async (_ctx: TestContext) => {
          returnedItems = await ctx.checklistService.getByTaskId(taskId);
        },
      );

      Then(
        "checklist items are returned in order 0, 1, 2",
        async (_ctx: TestContext) => {
          const sortOrders = returnedItems.map((item) => item.sort_order);
          expect(sortOrders).toEqual([0, 1, 2]);
        },
      );
    },
  );

  // @add-checklist-specs @FR1
  f.Scenario("Soft-deleted items excluded", ({ Given, When, Then, And }) => {
    let returnedItems: ChecklistItem[];

    Given("a task exists", async (_ctx: TestContext) => {});

    And(
      "2 active and 1 deleted checklist items for the task",
      async (_ctx: TestContext) => {
        await seedChecklistItem(ctx.checklistItemIds, "Active A", {
          task_id: taskId,
          is_deleted: false,
        });
        await seedChecklistItem(ctx.checklistItemIds, "Active B", {
          task_id: taskId,
          is_deleted: false,
        });
        await seedChecklistItem(ctx.checklistItemIds, "Deleted C", {
          task_id: taskId,
          is_deleted: true,
        });
      },
    );

    When(
      "user requests checklist items for the task",
      async (_ctx: TestContext) => {
        returnedItems = await ctx.checklistService.getByTaskId(taskId);
      },
    );

    Then("only 2 checklist items are returned", async (_ctx: TestContext) => {
      expect(returnedItems).toHaveLength(2);
    });
  });

  // @add-checklist-specs @FR1
  f.Scenario("Empty checklist", ({ Given, When, Then, And }) => {
    let returnedItems: ChecklistItem[];

    Given("a task exists", async (_ctx: TestContext) => {});

    And("no checklist items exist for the task", async (_ctx: TestContext) => {
      // DB is already cleared in BeforeEachScenario
    });

    When(
      "user requests checklist items for the task",
      async (_ctx: TestContext) => {
        returnedItems = await ctx.checklistService.getByTaskId(taskId);
      },
    );

    Then("empty array is returned", async (_ctx: TestContext) => {
      expect(returnedItems).toEqual([]);
    });
  });

  // @add-checklist-specs @FR1
  f.Scenario("Read existing item by ID", ({ Given, When, Then, And }) => {
    let foundItem: ChecklistItem | undefined;

    Given("a task exists", async (_ctx: TestContext) => {});

    And(
      'checklist item "Buy milk" exists for the task',
      async (_ctx: TestContext) => {
        await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
          task_id: taskId,
          name: "Buy milk",
        });
      },
    );

    When(
      'user requests checklist item by ID "Buy milk"',
      async (_ctx: TestContext) => {
        foundItem = await ctx.checklistService.getById(
          getIdOrThrow(ctx.checklistItemIds, "Buy milk"),
        );
      },
    );

    Then(
      'checklist item with name "Buy milk" is returned',
      async (_ctx: TestContext) => {
        expect(foundItem).toBeDefined();
        expect(foundItem?.name).toBe("Buy milk");
      },
    );
  });

  // @add-checklist-specs @FR1
  f.Scenario("Read nonexistent item returns undefined", ({ When, Then }) => {
    let foundItem: ChecklistItem | undefined;

    When(
      "user requests checklist item by nonexistent ID",
      async (_ctx: TestContext) => {
        foundItem = await ctx.checklistService.getById(crypto.randomUUID());
      },
    );

    Then("undefined is returned", async (_ctx: TestContext) => {
      expect(foundItem).toBeUndefined();
    });
  });
});
