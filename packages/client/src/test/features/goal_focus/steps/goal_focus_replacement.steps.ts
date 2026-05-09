import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { expectGoalInFocus } from "@/test/helpers/bdd/goalFocus/assertions.ts";
import {
  getFocusedGoals,
  getGoalFromContext,
} from "@/test/helpers/bdd/goalFocus/helpers.ts";
import {
  createAndSteps,
  createBackgroundSteps,
  createGivenSteps,
  createThenSteps,
} from "@/test/helpers/bdd/goalFocus/stepDefinitions.ts";
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

    const backgroundSteps = createBackgroundSteps(f, goalRepository);
    const givenSteps = createGivenSteps(f, settingsRepository);
    const thenSteps = createThenSteps(f, settingsRepository);
    const andSteps = createAndSteps(f, settingsRepository);

    f.Background(({ Given }) => {
      backgroundSteps(Given);
    });

    // Shared step definitions
    const sharedSteps = {
      userOpensGoalPage: (step: StepTest["Given"]) => {
        step(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            f.context.currentGoal = getGoalFromContext(
              f.context.testGoals,
              goalName,
            );
          },
        );
      },

      clicksFocusIcon: (step: StepTest["Given"]) => {
        step("clicks focus icon", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          if (!goal) {
            throw new Error("currentGoal is undefined");
          }

          const { focused1, focused2 } =
            await getFocusedGoals(settingsRepository);

          const isFocused = focused1 === goal.id || focused2 === goal.id;

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
      },

      replacementDialogIsDisplayed: (step: StepTest["Given"]) => {
        step("replacement dialog is displayed", async (_ctx: TestContext) => {
          expect(f.context.isReplacementDialogDisplayed).toBe(true);
        });
      },

      thenGoalIsRemovedFromFocus: (Then: StepTest["Given"]) => {
        Then(
          "goal {string} is removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await expectGoalInFocus(goal.id, settingsRepository, false);
          },
        );
      },

      whenUserSelectsReplaceAction: (When: StepTest["Given"]) => {
        When(
          "user selects {string}",
          async (_ctx: TestContext, action: string) => {
            expect(f.context.isReplacementDialogDisplayed).toBe(true);
            f.context.selectedAction = action;

            const goal = f.context.currentGoal;
            if (!goal) {
              throw new Error("currentGoal is undefined");
            }

            const { focused1, focused2 } =
              await getFocusedGoals(settingsRepository);

            if (action.startsWith("Replace")) {
              const goalNameToReplace = action.replace("Replace ", "");
              const goalToReplace = getGoalFromContext(
                f.context.testGoals,
                goalNameToReplace,
              );

              if (goalToReplace.id === focused1) {
                if (!focused2) {
                  throw new Error("focused2 is undefined");
                }
                await settingsRepository.set("focused_goal_1", focused2);
                await settingsRepository.set("focused_goal_2", goal.id);
              } else if (goalToReplace.id === focused2) {
                await settingsRepository.set("focused_goal_2", goal.id);
              }

              f.context.isReplacementDialogDisplayed = false;
            }
          },
        );
      },
    };

    // Helper for replacement scenarios
    const replaceGoalScenario = (
      Given: StepTest["Given"],
      When: StepTest["When"],
      Then: StepTest["Then"],
      And: StepTest["Given"],
    ) => {
      givenSteps.givenTwoGoalsInFocus(Given);
      sharedSteps.userOpensGoalPage(And);
      sharedSteps.clicksFocusIcon(And);
      sharedSteps.replacementDialogIsDisplayed(And);
      sharedSteps.whenUserSelectsReplaceAction(When);
      sharedSteps.thenGoalIsRemovedFromFocus(Then);
      thenSteps.thenGoalIsAddedToFocus(And);
      andSteps.andSettingsHasFocusedGoal1(And);
      andSteps.andSettingsHasFocusedGoal2(And);
    };

    //@add-goal-focus @FR2 @FR3 @UX3
    f.Scenario(
      "Attempt to add third goal — show replacement dialog",
      ({ Given, When, Then, And }) => {
        givenSteps.givenTwoGoalsInFocus(Given);
        sharedSteps.userOpensGoalPage(When);
        sharedSteps.clicksFocusIcon(And);

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
        replaceGoalScenario(Given, When, Then, And);
      },
    );

    // @add-goal-focus @FR3
    f.Scenario(
      "Replace second goal via dialog",
      ({ Given, When, Then, And }) => {
        replaceGoalScenario(Given, When, Then, And);
      },
    );

    // @add-goal-focus @FR3
    f.Scenario("Cancel goal replacement", ({ Given, When, Then, And }) => {
      givenSteps.givenTwoGoalsInFocus(Given);
      sharedSteps.userOpensGoalPage(And);
      sharedSteps.clicksFocusIcon(And);
      sharedSteps.replacementDialogIsDisplayed(And);

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
          const { focused1, focused2 } =
            await getFocusedGoals(settingsRepository);

          const focusedIds = [focused1, focused2].filter(Boolean);
          expect(focusedIds).toHaveLength(count);

          const goal1 = getGoalFromContext(f.context.testGoals, goal1Name);
          const goal2 = getGoalFromContext(f.context.testGoals, goal2Name);

          expect(focusedIds).toContain(goal1.id);
          expect(focusedIds).toContain(goal2.id);
        },
      );

      andSteps.andSettingsHasFocusedGoal1(And);
      andSteps.andSettingsHasFocusedGoal2(And);
    });
  },
);
