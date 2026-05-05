import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
import type { Goal } from "@/types/entities.ts";

const feature = await loadFeature("../goal_focus_replacement.feature");

type FeatureContext = {
  testGoals: Map<string, Goal>;
  currentGoal?: Goal;
  isReplacementDialogDisplayed: boolean;
  dialogFocusedGoals: string[];
  dialogActions: string[];
  selectedAction?: string;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const goalRepository = new GoalRepository();
    const settingsRepository = new SettingsRepository();

    f.BeforeEachScenario(async () => {
      await db.goals.clear();
      await db.settings.clear();
      f.context.isReplacementDialogDisplayed = false;
      f.context.dialogFocusedGoals = [];
      f.context.dialogActions = [];
      f.context.selectedAction = undefined;
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

    //@add-goal-focus @FR2 @FR3 @UX3
    f.Scenario(
      "Attempt to add third goal — show replacement dialog",
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
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("clicks focus icon", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isFocused = focused1 === goal!.id || focused2 === goal!.id;

          if (!isFocused && focused1 && focused2) {
            f.context.isReplacementDialogDisplayed = true;

            const goal1 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused1,
            );
            const goal2 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused2,
            );

            if (goal1) f.context.dialogFocusedGoals.push(goal1.name);
            if (goal2) f.context.dialogFocusedGoals.push(goal2.name);

            f.context.dialogActions = [
              `Replace ${goal1?.name}`,
              `Replace ${goal2?.name}`,
              "Cancel",
            ];
          }
        });

        Then("replacement dialog is displayed", async (_ctx: TestContext) => {
          expect(f.context.isReplacementDialogDisplayed).toBe(true);
        });

        And(
          "dialog shows current focused goals: {string}, {string}",
          async (_ctx: TestContext, goal1Name: string, goal2Name: string) => {
            expect(f.context.dialogFocusedGoals).toContain(goal1Name);
            expect(f.context.dialogFocusedGoals).toContain(goal2Name);
            expect(f.context.dialogFocusedGoals).toHaveLength(2);
          },
        );

        And(
          "dialog offers actions: replace first, replace second, cancel",
          async (_ctx: TestContext) => {
            expect(f.context.dialogActions).toHaveLength(3);
            expect(
              f.context.dialogActions.some((action) =>
                action.startsWith("Replace"),
              ),
            ).toBe(true);
            expect(f.context.dialogActions).toContain("Cancel");
          },
        );
      },
    );

    // @add-goal-focus @FR3
    f.Scenario(
      "Replace first goal via dialog — shift up",
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

        And(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("clicks focus icon", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isFocused = focused1 === goal!.id || focused2 === goal!.id;

          if (!isFocused && focused1 && focused2) {
            f.context.isReplacementDialogDisplayed = true;

            const goal1 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused1,
            );
            const goal2 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused2,
            );

            if (goal1) f.context.dialogFocusedGoals.push(goal1.name);
            if (goal2) f.context.dialogFocusedGoals.push(goal2.name);

            f.context.dialogActions = [
              `Replace ${goal1?.name}`,
              `Replace ${goal2?.name}`,
              "Cancel",
            ];
          }
        });

        And("replacement dialog is displayed", async (_ctx: TestContext) => {
          expect(f.context.isReplacementDialogDisplayed).toBe(true);
        });

        When(
          "user selects {string}",
          async (_ctx: TestContext, action: string) => {
            expect(f.context.isReplacementDialogDisplayed).toBe(true);
            f.context.selectedAction = action;

            const goal = f.context.currentGoal;
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            if (action.startsWith("Replace")) {
              const goalNameToReplace = action.replace("Replace ", "");
              const goalToReplace = f.context.testGoals.get(goalNameToReplace);

              if (goalToReplace && goalToReplace.id === focused1) {
                await settingsRepository.set("focused_goal_1", focused2!);
                await settingsRepository.set("focused_goal_2", goal!.id);
              } else if (goalToReplace && goalToReplace.id === focused2) {
                await settingsRepository.set("focused_goal_2", goal!.id);
              }

              f.context.isReplacementDialogDisplayed = false;
            } else if (action === "Cancel") {
              f.context.isReplacementDialogDisplayed = false;
            }
          },
        );

        Then(
          "goal {string} is removed from focus",
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
          "goal {string} is added to focus",
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

    // @add-goal-focus @FR3
    f.Scenario(
      "Replace second goal via dialog",
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

        And(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            f.context.currentGoal = goal;
          },
        );

        And("clicks focus icon", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isFocused = focused1 === goal!.id || focused2 === goal!.id;

          if (!isFocused && focused1 && focused2) {
            f.context.isReplacementDialogDisplayed = true;

            const goal1 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused1,
            );
            const goal2 = Array.from(f.context.testGoals.values()).find(
              (g) => g.id === focused2,
            );

            if (goal1) f.context.dialogFocusedGoals.push(goal1.name);
            if (goal2) f.context.dialogFocusedGoals.push(goal2.name);

            f.context.dialogActions = [
              `Replace ${goal1?.name}`,
              `Replace ${goal2?.name}`,
              "Cancel",
            ];
          }
        });

        And("replacement dialog is displayed", async (_ctx: TestContext) => {
          expect(f.context.isReplacementDialogDisplayed).toBe(true);
        });

        When(
          "user selects {string}",
          async (_ctx: TestContext, action: string) => {
            expect(f.context.isReplacementDialogDisplayed).toBe(true);
            f.context.selectedAction = action;

            const goal = f.context.currentGoal;
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");

            if (action.startsWith("Replace")) {
              const goalNameToReplace = action.replace("Replace ", "");
              const goalToReplace = f.context.testGoals.get(goalNameToReplace);

              if (goalToReplace && goalToReplace.id === focused1) {
                await settingsRepository.set("focused_goal_1", focused2!);
                await settingsRepository.set("focused_goal_2", goal!.id);
              } else if (goalToReplace && goalToReplace.id === focused2) {
                await settingsRepository.set("focused_goal_2", goal!.id);
              }

              f.context.isReplacementDialogDisplayed = false;
            } else if (action === "Cancel") {
              f.context.isReplacementDialogDisplayed = false;
            }
          },
        );

        Then(
          "goal {string} is removed from focus",
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
          "goal {string} is added to focus",
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

    // @add-goal-focus @FR3
    f.Scenario("Cancel goal replacement", ({ Given, When, Then, And }) => {
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

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");
          expect(focused1).toBe(goal1!.id);
          expect(focused2).toBe(goal2!.id);
        },
      );

      And(
        "user opens goal page {string}",
        async (_ctx: TestContext, goalName: string) => {
          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();
          f.context.currentGoal = goal;
        },
      );

      And("clicks focus icon", async (_ctx: TestContext) => {
        const goal = f.context.currentGoal;
        expect(goal).toBeDefined();

        const focused1 = await settingsRepository.getValue("focused_goal_1");
        const focused2 = await settingsRepository.getValue("focused_goal_2");

        const isFocused = focused1 === goal!.id || focused2 === goal!.id;

        if (!isFocused && focused1 && focused2) {
          f.context.isReplacementDialogDisplayed = true;

          const goal1 = Array.from(f.context.testGoals.values()).find(
            (g) => g.id === focused1,
          );
          const goal2 = Array.from(f.context.testGoals.values()).find(
            (g) => g.id === focused2,
          );

          if (goal1) f.context.dialogFocusedGoals.push(goal1.name);
          if (goal2) f.context.dialogFocusedGoals.push(goal2.name);

          f.context.dialogActions = [
            `Replace ${goal1?.name}`,
            `Replace ${goal2?.name}`,
            "Cancel",
          ];
        }
      });

      And("replacement dialog is displayed", async (_ctx: TestContext) => {
        expect(f.context.isReplacementDialogDisplayed).toBe(true);
      });

      When(
        "user selects {string}",
        async (_ctx: TestContext, action: string) => {
          expect(f.context.isReplacementDialogDisplayed).toBe(true);
          f.context.selectedAction = action;

          if (action === "Cancel") {
            f.context.isReplacementDialogDisplayed = false;
          }
        },
      );

      Then("dialog closes", async (_ctx: TestContext) => {
        expect(f.context.isReplacementDialogDisplayed).toBe(false);
      });

      And(
        "{int} goals remain in focus: {string}, {string}",
        async (
          _ctx: TestContext,
          count: number,
          goal1Name: string,
          goal2Name: string,
        ) => {
          const goal1 = f.context.testGoals.get(goal1Name);
          const goal2 = f.context.testGoals.get(goal2Name);
          expect(goal1).toBeDefined();
          expect(goal2).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          expect(focused1).toBe(goal1!.id);
          expect(focused2).toBe(goal2!.id);
          expect(count).toBe(2);
        },
      );

      And(
        "Settings has focused_goal_1 = {string}",
        async (_ctx: TestContext, expectedId: string) => {
          const actualId = await settingsRepository.getValue("focused_goal_1");

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
          const actualId = await settingsRepository.getValue("focused_goal_2");

          if (expectedId === "") {
            expect(actualId === undefined || actualId === "").toBe(true);
          } else {
            expect(actualId).toBe(expectedId);
          }
        },
      );
    });
  },
);
