// implements FR2 of add-checklist-specs
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

const feature = await loadFeature("../checklists_toggle.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR2
  f.Scenario(
    "Toggle incomplete item to completed",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;
      let toggledItem: ChecklistItem;

      Given(
        'an incomplete checklist item "Buy milk" exists',
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
            task_id: taskId,
            name: "Buy milk",
            is_completed: false,
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
        'user toggles checklist item "Buy milk"',
        async (_ctx: TestContext) => {
          const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
          toggledItem = await ctx.checklistService.toggle(itemId);
        },
      );

      Then(
        'checklist item "Buy milk" has is_completed true',
        async (_ctx: TestContext) => {
          expect(toggledItem.is_completed).toBe(true);
        },
      );

      And(
        'checklist item "Buy milk" has needsSync true',
        async (_ctx: TestContext) => {
          expect(toggledItem.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "Buy milk" updated_at is refreshed',
        async (_ctx: TestContext) => {
          expect(toggledItem.updated_at).not.toBe(originalUpdatedAt);
        },
      );
    },
  );

  // @add-checklist-specs @FR2
  f.Scenario(
    "Toggle completed item to incomplete",
    ({ Given, When, Then, And }) => {
      let originalUpdatedAt: string;
      let toggledItem: ChecklistItem;

      Given(
        'a completed checklist item "Buy milk" exists',
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Buy milk", {
            task_id: taskId,
            name: "Buy milk",
            is_completed: true,
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
        'user toggles checklist item "Buy milk"',
        async (_ctx: TestContext) => {
          const itemId = getIdOrThrow(ctx.checklistItemIds, "Buy milk");
          toggledItem = await ctx.checklistService.toggle(itemId);
        },
      );

      Then(
        'checklist item "Buy milk" has is_completed false',
        async (_ctx: TestContext) => {
          expect(toggledItem.is_completed).toBe(false);
        },
      );

      And(
        'checklist item "Buy milk" has needsSync true',
        async (_ctx: TestContext) => {
          expect(toggledItem.needsSync).toBe(true);
        },
      );

      And(
        'checklist item "Buy milk" updated_at is refreshed',
        async (_ctx: TestContext) => {
          expect(toggledItem.updated_at).not.toBe(originalUpdatedAt);
        },
      );
    },
  );

  // @add-checklist-specs @FR2
  f.Scenario("Toggle nonexistent item throws error", ({ When, Then }) => {
    let thrownError: Error | undefined;

    When(
      "user toggles a nonexistent checklist item",
      async (_ctx: TestContext) => {
        try {
          await ctx.checklistService.toggle(crypto.randomUUID());
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
