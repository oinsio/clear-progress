// implements FR1 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import type { ChecklistItem } from "@/types/entities";
import {
  createScenarioContext,
  seedChecklistItem,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_crud_create.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

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
    "Create checklist item with defaults",
    ({ Given, When, Then, And }) => {
      let createdItem: ChecklistItem;

      Given("a task exists", async (_ctx: TestContext) => {});

      When(
        'user creates checklist item "Buy milk" for the task',
        async (_ctx: TestContext) => {
          createdItem = await ctx.checklistService.create(taskId, "Buy milk");
        },
      );

      Then(
        'checklist item is persisted with name "Buy milk"',
        async (_ctx: TestContext) => {
          const persistedItem = await db.checklist_items.get(createdItem.id);
          expect(persistedItem?.name).toBe("Buy milk");
        },
      );

      And(
        "checklist item has is_completed false",
        async (_ctx: TestContext) => {
          expect(createdItem.is_completed).toBe(false);
        },
      );

      And("checklist item has revision 0", async (_ctx: TestContext) => {
        expect(createdItem.revision).toBe(0);
      });

      And("checklist item has needsSync true", async (_ctx: TestContext) => {
        expect(createdItem.needsSync).toBe(true);
      });

      And("checklist item has is_deleted false", async (_ctx: TestContext) => {
        expect(createdItem.is_deleted).toBe(false);
      });
    },
  );

  // @add-checklist-specs @FR1
  f.Scenario(
    "Sort order defaults to end of list",
    ({ Given, When, Then, And }) => {
      let createdItem: ChecklistItem;

      Given("a task exists", async (_ctx: TestContext) => {});

      And(
        "3 active checklist items exist for the task",
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Item A", {
            task_id: taskId,
            sort_order: "a0",
          });
          await seedChecklistItem(ctx.checklistItemIds, "Item B", {
            task_id: taskId,
            sort_order: "a1",
          });
          await seedChecklistItem(ctx.checklistItemIds, "Item C", {
            task_id: taskId,
            sort_order: "a2",
          });
        },
      );

      When(
        'user creates checklist item "New Item" for the task',
        async (_ctx: TestContext) => {
          createdItem = await ctx.checklistService.create(taskId, "New Item");
        },
      );

      Then(
        "checklist item has sort_order above existing maximum",
        async (_ctx: TestContext) => {
          expect(typeof createdItem.sort_order).toBe("string");
          const allItems = await ctx.checklistService.getByTaskId(taskId);
          const others = allItems.filter(
            (entity) => entity.id !== createdItem.id,
          );
          for (const other of others) {
            expect(
              String(createdItem.sort_order) > String(other.sort_order),
            ).toBe(true);
          }
        },
      );
    },
  );

  // @add-checklist-specs @FR1
  f.Scenario("UUID generated client-side", ({ Given, When, Then }) => {
    let createdItem: ChecklistItem;

    Given("a task exists", async (_ctx: TestContext) => {});

    When(
      'user creates checklist item "Buy milk" for the task',
      async (_ctx: TestContext) => {
        createdItem = await ctx.checklistService.create(taskId, "Buy milk");
      },
    );

    Then("checklist item id is valid UUID v4", async (_ctx: TestContext) => {
      expect(createdItem.id).toMatch(UUID_V4_REGEX);
    });
  });

  // @add-checklist-specs @FR1
  f.Scenario("Timestamps set on creation", ({ Given, When, Then, And }) => {
    let createdItem: ChecklistItem;

    Given("a task exists", async (_ctx: TestContext) => {});

    When(
      'user creates checklist item "Buy milk" for the task',
      async (_ctx: TestContext) => {
        createdItem = await ctx.checklistService.create(taskId, "Buy milk");
      },
    );

    Then(
      "checklist item created_at and updated_at are equal",
      async (_ctx: TestContext) => {
        expect(createdItem.created_at).toBe(createdItem.updated_at);
      },
    );

    And(
      "checklist item timestamps are ISO 8601 with Z suffix",
      async (_ctx: TestContext) => {
        expect(createdItem.created_at).toMatch(ISO_TIMESTAMP_REGEX);
        expect(createdItem.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
      },
    );
  });
});
