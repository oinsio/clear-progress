// implements FR6 of add-checklist-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import type { ChecklistProgress } from "@/services/ChecklistService";
import {
  createScenarioContext,
  seedChecklistItem,
} from "./checklists_steps.helpers";

const feature = await loadFeature("../checklists_progress.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const ctx = createScenarioContext();
  let taskId: string;

  f.BeforeEachScenario(async () => {
    await ctx.reset();
    taskId = crypto.randomUUID();
  });

  // @add-checklist-specs @FR6
  f.Scenario("Progress with mixed completion", ({ Given, When, Then }) => {
    let progress: ChecklistProgress;

    Given(
      "3 active checklist items exist: 2 completed and 1 incomplete",
      async (_ctx: TestContext) => {
        await seedChecklistItem(ctx.checklistItemIds, "Item A", {
          task_id: taskId,
          is_completed: true,
          is_deleted: false,
        });
        await seedChecklistItem(ctx.checklistItemIds, "Item B", {
          task_id: taskId,
          is_completed: true,
          is_deleted: false,
        });
        await seedChecklistItem(ctx.checklistItemIds, "Item C", {
          task_id: taskId,
          is_completed: false,
          is_deleted: false,
        });
      },
    );

    When("user gets checklist progress", async (_ctx: TestContext) => {
      progress = await ctx.checklistService.getProgress(taskId);
    });

    Then(
      "progress shows completed 2 and total 3",
      async (_ctx: TestContext) => {
        expect(progress).toEqual({ completed: 2, total: 3 });
      },
    );
  });

  // @add-checklist-specs @FR6
  f.Scenario("Progress with no items", ({ Given, When, Then }) => {
    let progress: ChecklistProgress;

    Given("no checklist items exist", async (_ctx: TestContext) => {
      // No items seeded — taskId has no checklist items
    });

    When("user gets checklist progress", async (_ctx: TestContext) => {
      progress = await ctx.checklistService.getProgress(taskId);
    });

    Then(
      "progress shows completed 0 and total 0",
      async (_ctx: TestContext) => {
        expect(progress).toEqual({ completed: 0, total: 0 });
      },
    );
  });

  // @add-checklist-specs @FR6
  f.Scenario(
    "Soft-deleted items excluded from progress",
    ({ Given, When, Then }) => {
      let progress: ChecklistProgress;

      Given(
        "2 active completed items and 1 deleted completed item exist",
        async (_ctx: TestContext) => {
          await seedChecklistItem(ctx.checklistItemIds, "Active A", {
            task_id: taskId,
            is_completed: true,
            is_deleted: false,
          });
          await seedChecklistItem(ctx.checklistItemIds, "Active B", {
            task_id: taskId,
            is_completed: true,
            is_deleted: false,
          });
          await seedChecklistItem(ctx.checklistItemIds, "Deleted C", {
            task_id: taskId,
            is_completed: true,
            is_deleted: true,
          });
        },
      );

      When("user gets checklist progress", async (_ctx: TestContext) => {
        progress = await ctx.checklistService.getProgress(taskId);
      });

      Then(
        "progress shows completed 2 and total 2",
        async (_ctx: TestContext) => {
          expect(progress).toEqual({ completed: 2, total: 2 });
        },
      );
    },
  );
});
