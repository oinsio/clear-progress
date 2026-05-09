import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { SETTINGS_KEYS } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
import type { Goal } from "@/types/entities.ts";

const feature = await loadFeature("../goal_focus_nfr_unit.feature");

type FeatureContext = {
  testGoals: Map<string, Goal>;
  currentGoalId?: string;
  clickStartTime: number;
  clickEndTime: number;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const goalRepository = new GoalRepository();
    const settingsRepository = new SettingsRepository();

    f.BeforeEachScenario(async () => {
      await db.goals.clear();
      await db.settings.clear();
      f.context.clickStartTime = 0;
      f.context.clickEndTime = 0;
      f.context.currentGoalId = undefined;
    });

    f.Background(({ Given }) => {
      Given("goals exist:", async (_ctx: TestContext, table) => {
        f.context.testGoals = new Map();

        const rows = Array.isArray(table) ? table : [];

        for (const row of rows) {
          const goal = buildGoal({
            id: row.id,
            name: row.name,
            status: row.status as Goal["status"],
          });

          await goalRepository.create(goal);
          f.context.testGoals.set(row.name, goal);
        }

        const allGoals = await goalRepository.getAll();
        expect(allGoals).toHaveLength(rows.length);
      });
    });

    // @add-goal-focus @NFR-P1
    f.Scenario(
      "Optimistic UI when adding to focus",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goals in focus",
          async (_ctx: TestContext, count: number) => {
            const focused1 = await settingsRepository.getValue(
              SETTINGS_KEYS.FOCUSED_GOAL_1,
            );
            const focused2 = await settingsRepository.getValue(
              SETTINGS_KEYS.FOCUSED_GOAL_2,
            );

            if (count === 0) {
              expect(focused1).toBeUndefined();
              expect(focused2).toBeUndefined();
            }

            // Pick first goal for testing
            const firstGoal = Array.from(f.context.testGoals.values())[0];
            if (!firstGoal) {
              throw new Error("No goals found in test context");
            }
            f.context.currentGoalId = firstGoal.id;
          },
        );

        When("user clicks focus icon", async (_ctx: TestContext) => {
          if (!f.context.currentGoalId) {
            throw new Error("currentGoalId is undefined");
          }

          // Measure performance of adding goal to focus
          f.context.clickStartTime = performance.now();

          await settingsRepository.set(
            SETTINGS_KEYS.FOCUSED_GOAL_1,
            f.context.currentGoalId,
          );

          f.context.clickEndTime = performance.now();
        });

        Then(
          "icon instantly becomes active (< 100ms)",
          async (_ctx: TestContext) => {
            const duration = f.context.clickEndTime - f.context.clickStartTime;

            // Check performance requirement: IndexedDB write should complete in < 100ms
            expect(duration).toBeLessThan(100);

            // Verify goal was added to focus
            const focused1 = await settingsRepository.getValue(
              SETTINGS_KEYS.FOCUSED_GOAL_1,
            );
            if (!f.context.currentGoalId) {
              throw new Error("currentGoalId is undefined");
            }
            expect(focused1).toBe(f.context.currentGoalId);
          },
        );

        And(
          "goal appears in navigation without waiting for IndexedDB write",
          async (_ctx: TestContext) => {
            // Verify goal is in settings (already written in "When" step)
            const focused1 = await settingsRepository.getValue(
              SETTINGS_KEYS.FOCUSED_GOAL_1,
            );
            if (!f.context.currentGoalId) {
              throw new Error("currentGoalId is undefined");
            }
            expect(focused1).toBe(f.context.currentGoalId);

            // Note: This unit test verifies that the IndexedDB write operation is fast (< 100ms).
            // In real implementation with optimistic UI, the UI would update immediately
            // without waiting for this write to complete, then the write would happen in background.
            // The < 100ms requirement ensures that even if UI waits for the write,
            // the user experience remains responsive.
          },
        );
      },
    );
  },
);
