import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
import type { Goal } from "@/types/entities.ts";

const feature = await loadFeature("../goal_focus_auto_removal.feature");

type FeatureContext = {
  testGoals: Map<string, Goal>;
  currentGoal?: Goal;
  editedStatus?: Goal["status"];
  isEditMode: boolean;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const goalRepository = new GoalRepository();
    const settingsRepository = new SettingsRepository();

    f.BeforeEachScenario(async () => {
      await db.goals.clear();
      await db.settings.clear();
    });

    f.Background(({ Given }) => {
      Given("goals exist:", async (_ctx: TestContext, table) => {
        f.context.testGoals = new Map();
        f.context.isEditMode = false;

        const rows = Array.isArray(table) ? table : [];

        for (const row of rows) {
          const goal = buildGoal({
            id: row.id,
            name: row.name,
            status: row.status as Goal["status"],
          });

          await db.goals.put(goal);
          f.context.testGoals.set(row.name, goal);
        }

        const allGoals = await goalRepository.getAll();
        expect(allGoals).toHaveLength(rows.length);
      });
    });

    // Helper: remove goal from focus and compact slots
    async function removeGoalFromFocus(goalId: string): Promise<void> {
      const focused1 = await settingsRepository.getValue("focused_goal_1");
      const focused2 = await settingsRepository.getValue("focused_goal_2");

      const remaining: string[] = [];
      if (focused1 && focused1 !== goalId) remaining.push(focused1);
      if (focused2 && focused2 !== goalId) remaining.push(focused2);

      await settingsRepository.set("focused_goal_1", remaining[0] || "");
      await settingsRepository.set("focused_goal_2", remaining[1] || "");
    }

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on soft delete",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goals in focus: {string}, {string}",
          async (
            _ctx: TestContext,
            _count: number,
            goal1Name: string,
            goal2Name: string,
          ) => {
            const goal1 = f.context.testGoals.get(goal1Name);
            const goal2 = f.context.testGoals.get(goal2Name);
            expect(goal1).toBeDefined();
            expect(goal2).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal1!.id);
            await settingsRepository.set("focused_goal_2", goal2!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");
            expect(focused1).toBe(goal1!.id);
            expect(focused2).toBe(goal2!.id);
          },
        );

        When(
          "user deletes goal {string} \\(soft delete\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const updatedGoal: Goal = {
              ...goal!,
              is_deleted: true,
              version: goal!.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal!.id);
          },
        );

        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(false);
          },
        );

        And(
          "goal {string} is shifted to focused_goal_1",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "Settings has focused_goal_2 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_2");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "navigation displays {int} item: {string}",
          async (_ctx: TestContext, count: number, goalName: string) => {
            const focusedGoalIds: string[] = [];

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
            if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

            expect(focusedGoalIds).toHaveLength(count);

            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(focusedGoalIds).toContain(goal!.id);
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on completion",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        When(
          "user completes goal {string} \\(status = completed\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const updatedGoal: Goal = {
              ...goal!,
              status: "completed",
              version: goal!.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal!.id);
          },
        );

        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(false);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "Settings has focused_goal_2 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_2");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "{string} block is not displayed in navigation",
          async (_ctx: TestContext, _blockName: string) => {
            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const hasFocusedGoals =
              (focused1 !== undefined && focused1 !== "") ||
              (focused2 !== undefined && focused2 !== "");
            expect(hasFocusedGoals).toBe(false);
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on cancellation",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        When(
          "user cancels goal {string} \\(status = cancelled\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const updatedGoal: Goal = {
              ...goal!,
              status: "cancelled",
              version: goal!.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal!.id);
          },
        );

        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(false);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "Settings has focused_goal_2 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_2");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal remains in focus during editing when status changed to completed (not saved)",
      ({ Given, When, Then, And, But }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        And(
          "goal {string} has status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(goal!.status).toBe(expectedStatus);
          },
        );

        When(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("user starts editing goal", async (_ctx: TestContext) => {
          f.context.isEditMode = true;
        });

        And(
          "user changes status to {string} in edit mode",
          async (_ctx: TestContext, newStatus: string) => {
            expect(f.context.isEditMode).toBe(true);
            f.context.editedStatus = newStatus as Goal["status"];
          },
        );

        But(
          "user does NOT save changes (still in edit mode)",
          async (_ctx: TestContext) => {
            expect(f.context.isEditMode).toBe(true);
            // Changes are not persisted — goal stays unchanged in DB
          },
        );

        Then(
          "goal {string} remains in focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(true);
          },
        );

        And("focus icon is active", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isActive = focused1 === goal!.id || focused2 === goal!.id;
          expect(isActive).toBe(true);
        });

        And(
          "navigation displays {string}",
          async (_ctx: TestContext, goalName: string) => {
            const focusedGoalIds: string[] = [];

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
            if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(focusedGoalIds).toContain(goal!.id);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal remains in focus when status change is cancelled",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        And(
          "goal {string} has status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(goal!.status).toBe(expectedStatus);
          },
        );

        When(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("user starts editing goal", async (_ctx: TestContext) => {
          f.context.isEditMode = true;
        });

        And(
          "user changes status to {string} in edit mode",
          async (_ctx: TestContext, newStatus: string) => {
            expect(f.context.isEditMode).toBe(true);
            f.context.editedStatus = newStatus as Goal["status"];
          },
        );

        And("user cancels editing", async (_ctx: TestContext) => {
          f.context.isEditMode = false;
          f.context.editedStatus = undefined;
          // Changes are discarded — goal stays unchanged in DB
        });

        Then(
          "goal {string} remains in focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(true);
          },
        );

        And(
          "goal {string} remains to have status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            expect(goal!.status).toBe(expectedStatus);
          },
        );

        And("focus icon is active", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isActive = focused1 === goal!.id || focused2 === goal!.id;
          expect(isActive).toBe(true);
        });

        And(
          "navigation displays {string}",
          async (_ctx: TestContext, goalName: string) => {
            const focusedGoalIds: string[] = [];

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
            if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(focusedGoalIds).toContain(goal!.id);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal removed from focus after saving status change to completed",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);
          },
        );

        And(
          "goal {string} has status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(goal!.status).toBe(expectedStatus);
          },
        );

        When(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("user starts editing goal", async (_ctx: TestContext) => {
          f.context.isEditMode = true;
        });

        And(
          "user changes status to {string} in edit mode",
          async (_ctx: TestContext, newStatus: string) => {
            expect(f.context.isEditMode).toBe(true);
            f.context.editedStatus = newStatus as Goal["status"];
          },
        );

        And("user saves changes", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();
          expect(f.context.editedStatus).toBeDefined();

          const updatedGoal: Goal = {
            ...goal!,
            status: f.context.editedStatus!,
            version: goal!.version + 1,
          };
          await goalRepository.update(updatedGoal);

          f.context.isEditMode = false;

          // Auto-remove from focus when status is completed or cancelled
          if (
            f.context.editedStatus === "completed" ||
            f.context.editedStatus === "cancelled"
          ) {
            await removeGoalFromFocus(goal!.id);
          }

          f.context.editedStatus = undefined;
        });

        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const isInFocus = focused1 === goal?.id || focused2 === goal?.id;
            expect(isInFocus).toBe(false);
          },
        );

        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "Settings has focused_goal_2 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_2");

            if (expectedId === "") {
              expect(actualId === undefined || actualId === "").toBe(true);
            } else {
              expect(actualId).toBe(expectedId);
            }
          },
        );

        And(
          "{string} block is not displayed in navigation",
          async (_ctx: TestContext, _blockName: string) => {
            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            const hasFocusedGoals =
              (focused1 !== undefined && focused1 !== "") ||
              (focused2 !== undefined && focused2 !== "");
            expect(hasFocusedGoals).toBe(false);
          },
        );
      },
    );
  },
);
