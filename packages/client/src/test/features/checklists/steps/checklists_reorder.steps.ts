// implements FR5 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { generateKeyBetween } from "@/services/SortOrderService";
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
  let caughtError: Error | undefined;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
    caughtError = undefined;
  });

  function givenItemsABCExist(Given: Function) {
    Given(
      'checklist items "A", "B", "C" exist with ascending sort_order',
      async (_ctx: TestContext) => {
        await seedChecklistItemsWithOrder(
          ctx.checklistItemIds,
          ["A", "B", "C"],
          taskId,
        );
      },
    );
  }

  function whenMoveCBeforeA(When: Function) {
    When('user moves item "C" before item "A"', async (_ctx: TestContext) => {
      const itemA = await getChecklistItem(ctx.checklistItemIds, "A");
      const itemC = await getChecklistItem(ctx.checklistItemIds, "C");
      const newKey = generateKeyBetween(null, String(itemA.sort_order));
      await ctx.checklistService.reorderItems(itemC.id, newKey);
    });
  }

  // @add-checklist-specs @FR5
  f.Scenario(
    "Reorder places item at new position via fractional key",
    ({ Given, When, Then }) => {
      givenItemsABCExist(Given);
      whenMoveCBeforeA(When);

      Then('items are ordered "C", "A", "B"', async (_ctx: TestContext) => {
        const allItems = await ctx.checklistService.getByTaskId(taskId);
        expect(allItems[0].name).toBe("C");
        expect(allItems[1].name).toBe("A");
        expect(allItems[2].name).toBe("B");
      });
    },
  );

  // @add-checklist-specs @FR5
  f.Scenario(
    "Reorder marks moved item for sync",
    ({ Given, When, Then, And }) => {
      givenItemsABCExist(Given);
      whenMoveCBeforeA(When);

      Then('item "C" has needsSync true', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "C");
        expect(item.needsSync).toBe(true);
      });

      And('item "A" has needsSync false', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "A");
        expect(item.needsSync).toBe(false);
      });

      And('item "B" has needsSync false', async (_ctx: TestContext) => {
        const item = await getChecklistItem(ctx.checklistItemIds, "B");
        expect(item.needsSync).toBe(false);
      });
    },
  );

  // @add-checklist-specs @FR5
  f.Scenario("Reorder throws for non-existent item", ({ When, Then }) => {
    When("user reorders non-existent item", async (_ctx: TestContext) => {
      try {
        await ctx.checklistService.reorderItems("nonexistent-id", "a1");
      } catch (error) {
        caughtError = error as Error;
      }
    });

    Then("an error is thrown", async (_ctx: TestContext) => {
      expect(caughtError).toBeDefined();
    });
  });
});
