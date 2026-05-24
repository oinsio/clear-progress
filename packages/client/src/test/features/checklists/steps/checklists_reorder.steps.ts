// implements FR5 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  createScenarioContext,
  getChecklistItem,
  seedChecklistItemsWithOrder,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_reorder.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR5
  f.Scenario(
    "Reorder assigns sequential sort_order",
    ({ Given, When, Then, And }) => {
      Given(
        'checklist items "A", "B", "C" exist with sort_order 0, 1, 2',
        async (_ctx: TestContext) => {
          await seedChecklistItemsWithOrder(
            ctx.checklistItemIds,
            ["A", "B", "C"],
            taskId,
          );
        },
      );

      When(
        'user reorders items to "B", "C", "A"',
        async (_ctx: TestContext) => {
          const items = await ctx.checklistService.getByTaskId(taskId);
          const reordered = ["B", "C", "A"]
            .map((name) => items.find((item) => item.name === name))
            .filter((item) => item !== undefined);
          await ctx.checklistService.reorderItems(reordered);
        },
      );

      Then('item "B" has sort_order 0', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "B");
        expect(item.sort_order).toBe(0);
      });

      And('item "C" has sort_order 1', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "C");
        expect(item.sort_order).toBe(1);
      });

      And('item "A" has sort_order 2', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "A");
        expect(item.sort_order).toBe(2);
      });
    },
  );

  // @add-checklist-specs @FR5
  f.Scenario(
    "Only changed items marked for sync",
    ({ Given, When, Then, And }) => {
      Given(
        'checklist items "A", "B", "C" exist with sort_order 0, 1, 2',
        async (_ctx: TestContext) => {
          await seedChecklistItemsWithOrder(
            ctx.checklistItemIds,
            ["A", "B", "C"],
            taskId,
          );
        },
      );

      When(
        'user reorders items to "A", "C", "B"',
        async (_ctx: TestContext) => {
          const items = await ctx.checklistService.getByTaskId(taskId);
          const reordered = ["A", "C", "B"]
            .map((name) => items.find((item) => item.name === name))
            .filter((item) => item !== undefined);
          await ctx.checklistService.reorderItems(reordered);
        },
      );

      Then('item "A" has needsSync false', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "A");
        expect(item.needsSync).toBe(false);
      });

      And('item "C" has needsSync true', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "C");
        expect(item.needsSync).toBe(true);
      });

      And('item "B" has needsSync true', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "B");
        expect(item.needsSync).toBe(true);
      });
    },
  );

  // @add-checklist-specs @FR5
  f.Scenario("Empty reorder is no-op", ({ When, Then }) => {
    let caughtError: Error | undefined;

    When("user reorders an empty array", async (_ctx: TestContext) => {
      try {
        await ctx.checklistService.reorderItems([]);
      } catch (error) {
        caughtError = error as Error;
      }
    });

    Then("no error occurs", async (_ctx: TestContext) => {
      expect(caughtError).toBeUndefined();
    });
  });

  // @add-checklist-specs @FR5
  f.Scenario("Same order is no-op", ({ Given, When, Then, And }) => {
    Given(
      'checklist items "A", "B" exist with sort_order 0, 1',
      async (_ctx: TestContext) => {
        await seedChecklistItemsWithOrder(
          ctx.checklistItemIds,
          ["A", "B"],
          taskId,
        );
      },
    );

    When('user reorders items to "A", "B"', async (_ctx: TestContext) => {
      const items = await ctx.checklistService.getByTaskId(taskId);
      await ctx.checklistService.reorderItems(items);
    });

    Then('item "A" has needsSync false', async (_ctx: TestContext) => {
      const item = await getChecklistItem(ctx.checklistItemIds, "A");
      expect(item.needsSync).toBe(false);
    });

    And('item "B" has needsSync false', async (_ctx: TestContext) => {
      const item = await getChecklistItem(ctx.checklistItemIds, "B");
      expect(item.needsSync).toBe(false);
    });
  });
});
