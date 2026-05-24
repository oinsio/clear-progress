// implements FR3 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { ChecklistItem } from "@/types/entities";
import {
  createScenarioContext,
  getChecklistItem,
  seedChecklistItem,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_update.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR3
  f.Scenario("Update item name", ({ Given, When, Then, And }) => {
    let originalUpdatedAt: string;
    let updatedItem: ChecklistItem;

    Given('a checklist item "Buy milk" exists', async (_ctx: TestContext) => {
      await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
        task_id: taskId,
        name: "Buy milk",
        needsSync: false,
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const seededItem = await getChecklistItem(
        ctx.checklistItemIds,
        "Buy milk",
      );
      originalUpdatedAt = seededItem.updated_at;
    });

    When(
      'user updates checklist item "Buy milk" name to "Buy oat milk"',
      async (_ctx: TestContext) => {
        const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
        updatedItem = await ctx.checklistService.update(itemId, {
          name: "Buy oat milk",
        });
      },
    );

    Then(
      'checklist item "Buy milk" has name "Buy oat milk"',
      async (_ctx: TestContext) => {
        expect(updatedItem.name).toBe("Buy oat milk");
      },
    );

    And(
      'checklist item "Buy milk" has needsSync true',
      async (_ctx: TestContext) => {
        expect(updatedItem.needsSync).toBe(true);
      },
    );

    And(
      'checklist item "Buy milk" updated_at is refreshed',
      async (_ctx: TestContext) => {
        expect(updatedItem.updated_at).not.toBe(originalUpdatedAt);
      },
    );
  });

  // @add-checklist-specs @FR3
  f.Scenario(
    "No-op update does not trigger sync",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;
      let updatedItem: ChecklistItem;

      Given(
        'a checklist item "Buy milk" exists with needsSync false',
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
            task_id: taskId,
            name: "Buy milk",
            needsSync: false,
            updated_at: "2025-01-01T00:00:00.000Z",
          });
          const seededItem = await getChecklistItem(
            ctx.checklistItemIds,
            "Buy milk",
          );
          originalUpdatedAt = seededItem.updated_at;
        },
      );

      When(
        'user updates checklist item "Buy milk" name to "Buy milk"',
        async (_ctx: TestContext) => {
          const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
          updatedItem = await ctx.checklistService.update(itemId, {
            name: "Buy milk",
          });
        },
      );

      Then(
        'checklist item "Buy milk" has needsSync false',
        async (_ctx: TestContext) => {
          expect(updatedItem.needsSync).toBe(false);
        },
      );

      And(
        'checklist item "Buy milk" updated_at is unchanged',
        async (_ctx: TestContext) => {
          expect(updatedItem.updated_at).toBe(originalUpdatedAt);
        },
      );
    },
  );

  // @add-checklist-specs @FR3
  f.Scenario("Update nonexistent item throws error", ({ When, Then }) => {
    let thrownError: Error | undefined;

    When(
      "user updates a nonexistent checklist item",
      async (_ctx: TestContext) => {
        try {
          await ctx.checklistService.update(crypto.randomUUID(), {
            name: "Anything",
          });
        } catch (error) {
          thrownError = error as Error;
        }
      },
    );

    Then(
      'error "ChecklistItem not found" is thrown',
      async (_ctx: TestContext) => {
        expect(thrownError).toBeDefined();
        expect(thrownError?.message).toContain("ChecklistItem not found");
      },
    );
  });
});
