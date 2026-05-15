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
  removeGoalFromFocus,
} from "@/test/helpers/bdd/goalFocus/helpers.ts";
import {
  createAndSteps,
  createBackgroundSteps,
  createGivenSteps,
} from "@/test/helpers/bdd/goalFocus/stepDefinitions.ts";
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
    const givenSteps = createGivenSteps(f, settingsRepository);
    const andSteps = createAndSteps(f, settingsRepository);

    f.Background(({ Given }) => {
      backgroundSteps(Given);
    });

    // Shared step definitions
    const sharedSteps = {
      givenOneGoalInFocus: (Given: StepTest["Given"]) => {
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

      andGoalHasStatus: (And: StepTest["Given"]) => {
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

      whenUserOpensGoalPage: (When: StepTest["Given"]) => {
        When(
          "user opens goal page {string}",
          async (_ctx: TestContext, goalName: string) => {
            f.context.currentGoal = getGoalFromContext(
              f.context.testGoals,
              goalName,
            );
          },
        );
      },

      thenGoalIsAutomaticallyRemovedFromFocus: (Then: StepTest["Given"]) => {
        Then(
          "goal {string} is automatically removed from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await expectGoalInFocus(goal.id, settingsRepository, false);
          },
        );
      },

      thenGoalRemainsInFocus: (Then: StepTest["Given"]) => {
        Then(
          "goal {string} remains in focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await expectGoalInFocus(goal.id, settingsRepository, true);
          },
        );
      },

      andFocusIconIsActive: (And: StepTest["Given"]) => {
        And("focus icon is active", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          if (!goal) {
            throw new Error("currentGoal is undefined");
          }
          await expectGoalInFocus(goal.id, settingsRepository, true);
        });
      },

      andNavigationDisplays: (And: StepTest["Given"]) => {
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

      andBlockIsNotDisplayedInNavigation: (And: StepTest["Given"]) => {
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
        givenSteps.givenTwoGoalsInFocus(Given);

        When(
          "user deletes goal {string} \\(soft delete\\)",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);

            const updatedGoal: Goal = {
              ...goal,
              is_deleted: true,
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

        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);

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
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal.id, settingsRepository);
          },
        );

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);
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
            };
            await goalRepository.update(updatedGoal);

            await removeGoalFromFocus(goal.id, settingsRepository);
          },
        );

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);
      },
    );

    // Helper function to set up common editing scenario steps
    const setupEditingScenarioSteps = (
      Given: StepTest["Given"],
      When: StepTest["When"],
      And: StepTest["Given"],
    ) => {
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
    };

    // @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR1
    f.Scenario(
      "Goal remains in focus during editing when status changed to completed (not saved)",
      ({ Given, When, Then, And, But }) => {
        setupEditingScenarioSteps(Given, When, And);

        But(
          "user does NOT save changes (still in edit mode)",
          async (_ctx: TestContext) => {
            expect(f.context.isEditMode).toBe(true);
          },
        );

        sharedSteps.thenGoalRemainsInFocus(Then);
        sharedSteps.andFocusIconIsActive(And);
        sharedSteps.andNavigationDisplays(And);
        andSteps.andSettingsHasFocusedGoal1(And);
      },
    );

    // @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR3
    f.Scenario(
      "Goal remains in focus when status change is cancelled",
      ({ Given, When, Then, And }) => {
        setupEditingScenarioSteps(Given, When, And);

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
        andSteps.andSettingsHasFocusedGoal1(And);
      },
    );

    // @add-goal-focus @FR9 @fix-goal-status-edit-mode @FR2
    f.Scenario(
      "Goal removed from focus after saving status change to completed",
      ({ Given, When, Then, And }) => {
        setupEditingScenarioSteps(Given, When, And);

        And("user saves changes", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          if (!goal) {
            throw new Error("currentGoal is undefined");
          }
          if (!f.context.editedStatus) {
            throw new Error("editedStatus is undefined");
          }

          const updatedGoal: Goal = {
            ...goal,
            status: f.context.editedStatus,
          };
          await goalRepository.update(updatedGoal);

          f.context.isEditMode = false;

          if (
            f.context.editedStatus === "completed" ||
            f.context.editedStatus === "cancelled"
          ) {
            await removeGoalFromFocus(goal.id, settingsRepository);
          }

          f.context.editedStatus = undefined;
        });

        sharedSteps.thenGoalIsAutomaticallyRemovedFromFocus(Then);
        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);
        sharedSteps.andBlockIsNotDisplayedInNavigation(And);
      },
    );
  },
);
