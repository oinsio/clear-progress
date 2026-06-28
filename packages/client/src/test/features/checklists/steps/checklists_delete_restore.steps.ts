// implements FR4 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { ChecklistItem } from "@/types/entities";
import {
  createScenarioContext,
  seedChecklistItem,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_delete_restore.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR4
  f.Scenario("Soft-delete a checklist item", ({ Given, When, Then, And }) => {
    let deletedItem: ChecklistItem;

    Given(
      'an active checklist item "Buy milk" exists',
      async (_ctx: TestContext) => {
        await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
          task_id: taskId,
          name: "Buy milk",
          is_deleted: false,
          syncStatus: "synced" as const,
        });
      },
    );

    When(
      'user soft-deletes checklist item "Buy milk"',
      async (_ctx: TestContext) => {
        const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
        deletedItem = await ctx.checklistService.softDelete(itemId);
      },
    );

    Then(
      'checklist item "Buy milk" has is_deleted true',
      async (_ctx: TestContext) => {
        expect(deletedItem.is_deleted).toBe(true);
      },
    );

    And(
      'checklist item "Buy milk" has syncStatus "pending"',
      async (_ctx: TestContext) => {
        expect(deletedItem.syncStatus).toBe("pending");
      },
    );
  });

  // @add-checklist-specs @FR4
  f.Scenario(
    "Restore a soft-deleted checklist item",
    ({ Given, When, Then, And }) => {
      let restoredItem: ChecklistItem;

      Given(
        'a soft-deleted checklist item "Buy milk" exists',
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
            task_id: taskId,
            name: "Buy milk",
            is_deleted: true,
            syncStatus: "synced" as const,
          });
        },
      );

      When(
        'user restores checklist item "Buy milk"',
        async (_ctx: TestContext) => {
          const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
          restoredItem = await ctx.checklistService.restore(itemId);
        },
      );

      Then(
        'checklist item "Buy milk" has is_deleted false',
        async (_ctx: TestContext) => {
          expect(restoredItem.is_deleted).toBe(false);
        },
      );

      And(
        'checklist item "Buy milk" has syncStatus "pending"',
        async (_ctx: TestContext) => {
          expect(restoredItem.syncStatus).toBe("pending");
        },
      );
    },
  );
});
