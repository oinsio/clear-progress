import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import {
  expectGoalInFocus,
  expectSettingValue,
} from "@/test/helpers/bdd/goalFocus/assertions.ts";
import {
  getFocusedGoals,
  getGoalFromContext,
  removeGoalFromFocus,
} from "@/test/helpers/bdd/goalFocus/helpers.ts";
import { createBackgroundSteps } from "@/test/helpers/bdd/goalFocus/stepDefinitions.ts";
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
      f.context.isEditMode = false;
    });

    const backgroundSteps = createBackgroundSteps(f, goalRepository);

    f.Background(({ Given }) => {
      backgroundSteps(Given);
    });

    // Shared step definitions
    const sharedSteps = {
      givenOneGoalInFocus: (Given: any) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await settingsRepository.set("focused_goal_1", goal.id);
            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal.id);
          },
        );
      },

      givenTwoGoalsInFocus: (Given: any) => {
        Given(
          "{int} goals in focus: {string}, {string}",
          async (
            _ctx: TestContext,
            _count: number,
            goal1Name: string,
            goal2Name: string,
          ) => {
            const goal1 = getGoalFromContext(f.context.testGoals, goal1Name);
            const goal2 = getGoalFromContext(f.context.testGoals, goal2Name);

            await settingsRepository.set("focused_goal_1", goal1.id);
            await settingsRepository.set("focused_goal_2", goal2.id);

            const { focused1, focused2 } =
              await getFocusedGoals(settingsRepository);
            expect(focused1).toBe(goal1.id);
            expect(focused2).toBe(goal2.id);
          },
        );
      },

      andGoalHasStatus: (And: any) => {
        And(
          "goal {string} has status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            expect(goal.status).toBe(expectedStatus);
          },
        );
      },

      whenUserOpensGoalPage: (When: any) => {
        When(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            f.context.currentGoal = goal;
          },
        );
      },

      thenGoalIsAutomaticallyRemovedFromFocus: (Then: any) => {
        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await expectGoalInFocus(goal.id, settingsRepository, false);
          },
        );
      },

      thenGoalRemainsInFocus: (Then: any) => {
        Then(
          "goal {string} remains in focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await expectGoalInFocus(goal.id, settingsRepository, true);
          },
        );
      },

      andSettingsHasFocusedGoal1: (And: any) => {
        And(
          "Settings has focused_goal_1 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_1");
            expectSettingValue(actualId, expectedId);
          },
        );
      },

      andSettingsHasFocusedGoal2: (And: any) => {
        And(
          "Settings has focused_goal_2 = {string}",
          async (_ctx: TestContext, expectedId: string) => {
            const actualId =
              await settingsRepository.getValue("focused_goal_2");
            expectSettingValue(actualId, expectedId);
          },
        );
      },

      andFocusIconIsActive: (And: any) => {
        And("focus icon is active", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();
          await expectGoalInFocus(goal!.id, settingsRepository, true);
        });
      },

      andNavigationDisplays: (And: any) => {
        And(
          "navigation displays {string}",
          async (_ctx: TestContext, goalName: string) => {
            const focusedGoalIds: string[] = [];
            const { focused1, focused2 } =
              await getFocusedGoals(settingsRepository);

            if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
            if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

            const goal = getGoalFromContext(f.context.testGoals, goalName);
            expect(focusedGoalIds).toContain(goal.id);
          },
        );
      },

      andBlockIsNotDisplayedInNavigation: (And: any) => {
        And(
          "{string} block is not displayed in navigation",
          async (_ctx: TestContext, _blockName: string) => {
            const { focused1, focused2 } =
              await getFocusedGoals(settingsRepository);

            const hasFocusedGoals =
              (focused1 !== undefined && focused1 !== "") ||
              (focused2 !== undefined && focused2 !== "");
            expect(hasFocusedGoals).toBe(false);
          },
        );
      },
    };

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on soft delete",
      ({ Given, When, Then, And }) => {
        sharedSteps.givenTwoGoalsInFocus(Given);

        When(
          "user deletes goal {string} \\(soft delete\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);

            const updatedGoal: Goal = {
              ...goal,
              is_deleted: true,
              version: goal.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal.id, settingsRepository);
          },
        );

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);

        And(
          "goal {string} is shifted to focused_goal_1",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal.id);
          },
        );

        sharedSteps.andSettingsHasFocusedGoal1(And);
        sharedSteps.andSettingsHasFocusedGoal2(And);

        And(
          "navigation displays {int} item: {string}",
          async (_ctx: TestContext, count: number, goalName: string) => {
            const focusedGoalIds: string[] = [];
            const { focused1, focused2 } =
              await getFocusedGoals(settingsRepository);

            if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
            if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

            expect(focusedGoalIds).toHaveLength(count);

            const goal = getGoalFromContext(f.context.testGoals, goalName);
            expect(focusedGoalIds).toContain(goal.id);
          },
        );
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on completion",
      ({ Given, When, Then, And }) => {
        sharedSteps.givenOneGoalInFocus(Given);

        When(
          "user completes goal {string} \\(status = completed\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);

            const updatedGoal: Goal = {
              ...goal,
              status: "completed",
              version: goal.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal.id, settingsRepository);
          },
        );

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        sharedSteps.andSettingsHasFocusedGoal1(And);
        sharedSteps.andSettingsHasFocusedGoal2(And);
        sharedSteps.andBlockIsNotDisplayedInNavigation(And);
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Auto-remove goal from focus on cancellation",
      ({ Given, When, Then, And }) => {
        sharedSteps.givenOneGoalInFocus(Given);

        When(
          "user cancels goal {string} \\(status = cancelled\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);

            const updatedGoal: Goal = {
              ...goal,
              status: "cancelled",
              version: goal.version + 1,
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal.id, settingsRepository);
          },
        );

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        sharedSteps.andSettingsHasFocusedGoal1(And);
        sharedSteps.andSettingsHasFocusedGoal2(And);
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal remains in focus during editing when status changed to completed (not saved)",
      ({ Given, When, Then, And, But }) => {
        sharedSteps.givenOneGoalInFocus(Given);
        sharedSteps.andGoalHasStatus(And);
        sharedSteps.whenUserOpensGoalPage(When);

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
          },
        );

        sharedSteps.thenGoalRemainsInFocus(Then);
        sharedSteps.andFocusIconIsActive(And);
        sharedSteps.andNavigationDisplays(And);
        sharedSteps.andSettingsHasFocusedGoal1(And);
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal remains in focus when status change is cancelled",
      ({ Given, When, Then, And }) => {
        sharedSteps.givenOneGoalInFocus(Given);
        sharedSteps.andGoalHasStatus(And);
        sharedSteps.whenUserOpensGoalPage(When);

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
        });

        sharedSteps.thenGoalRemainsInFocus(Then);

        And(
          "goal {string} remains to have status {string}",
          async (
            _ctx: TestContext,
            goalName: string,
            expectedStatus: string,
          ) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            expect(goal.status).toBe(expectedStatus);
          },
        );

        sharedSteps.andFocusIconIsActive(And);
        sharedSteps.andNavigationDisplays(And);
        sharedSteps.andSettingsHasFocusedGoal1(And);
      },
    );

    // @add-goal-focus @FR9
    f.Scenario(
      "Goal removed from focus after saving status change to completed",
      ({ Given, When, Then, And }) => {
        sharedSteps.givenOneGoalInFocus(Given);
        sharedSteps.andGoalHasStatus(And);
        sharedSteps.whenUserOpensGoalPage(When);

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

          if (
            f.context.editedStatus === "completed" ||
            f.context.editedStatus === "cancelled"
          ) {
            await removeGoalFromFocus(goal!.id, settingsRepository);
          }

          f.context.editedStatus = undefined;
        });

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        sharedSteps.andSettingsHasFocusedGoal1(And);
        sharedSteps.andSettingsHasFocusedGoal2(And);
        sharedSteps.andBlockIsNotDisplayedInNavigation(And);
      },
    );
  },
);
