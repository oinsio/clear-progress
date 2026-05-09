import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import type { TestContext } from "vitest";
import { expect } from "vitest";
import { db } from "@/db/database.ts";
import type { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import type { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
import type { Goal } from "@/types/entities.ts";
import {
  expectFocusCount,
  expectGoalInFocus,
  expectSettingValue,
} from "./assertions.ts";
import {
  clickFocusIcon,
  getFocusedGoals,
  getGoalFromContext,
} from "./helpers.ts";

type FeatureContext = {
  testGoals: Map<string, Goal>;
  currentGoal?: Goal;
};

export function createBackgroundSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
  goalRepository: GoalRepository,
) {
  return (Given: StepTest["Given"]) => {
    Given("goals exist:", async (_ctx: TestContext, table: unknown) => {
      f.context.testGoals = new Map();

      const rows = Array.isArray(table) ? table : [];

      const goals: Goal[] = [];
      for (const row of rows) {
        const goal = buildGoal({
          id: row.id,
          name: row.name,
          status: row.status as Goal["status"],
        });
        goals.push(goal);
        f.context.testGoals.set(row.name, goal);
      }

      await db.goals.bulkPut(goals);

      const allGoals = await goalRepository.getAll();
      expect(allGoals).toHaveLength(rows.length);
    });
  };
}

export function createGivenSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
  settingsRepository: SettingsRepository,
) {
  return {
    givenGoalsInFocus: (Given: StepTest["Given"]) => {
      Given(
        "{int} goals in focus",
        async (_ctx: TestContext, count: number) => {
          await expectFocusCount(settingsRepository, count);
        },
      );
    },

    givenOneGoalInFocus: (Given: StepTest["Given"]) => {
      Given(
        "{int} goal in focus: {string}",
        async (_ctx: TestContext, count: number, goalName: string) => {
          const goal = getGoalFromContext(f.context.testGoals, goalName);

          await settingsRepository.set("focused_goal_1", goal.id);

          const { focused1, focused2 } =
            await getFocusedGoals(settingsRepository);
          expect(focused1).toBe(goal.id);
          if (count === 1) {
            expect(focused2).toBeUndefined();
          }
        },
      );
    },

    givenTwoGoalsInFocus: (Given: StepTest["Given"]) => {
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
  };
}

export function createWhenSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
) {
  return {
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
  };
}

export function createThenSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
  settingsRepository: SettingsRepository,
) {
  return {
    thenGoalIsAddedToFocus: (Then: StepTest["Given"]) => {
      Then(
        "goal {string} is added to focus",
        async (_ctx: TestContext, goalName: string) => {
          const goal = getGoalFromContext(f.context.testGoals, goalName);
          await expectGoalInFocus(goal.id, settingsRepository, true);
        },
      );
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
  };
}

export function createAndSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
  settingsRepository: SettingsRepository,
) {
  return {
    andClicksFocusIcon: (And: StepTest["Given"]) => {
      And("clicks focus icon", async (_ctx: TestContext) => {
        const goal = f.context.currentGoal;
        if (!goal) {
          throw new Error("currentGoal is undefined");
        }
        await clickFocusIcon(goal.id, settingsRepository);
      });
    },

    andSettingsHasFocusedGoal1: (And: StepTest["Given"]) => {
      And(
        "Settings has focused_goal_1 = {string}",
        async (_ctx: TestContext, expectedId: string) => {
          const actualId = await settingsRepository.getValue("focused_goal_1");
          expectSettingValue(actualId, expectedId);
        },
      );
    },

    andSettingsHasFocusedGoal2: (And: StepTest["Given"]) => {
      And(
        "Settings has focused_goal_2 = {string}",
        async (_ctx: TestContext, expectedId: string) => {
          const actualId = await settingsRepository.getValue("focused_goal_2");
          expectSettingValue(actualId, expectedId);
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

    andFocusIconIsInactive: (And: StepTest["Given"]) => {
      And("focus icon is inactive", async (_ctx: TestContext) => {
        const goal = f.context.currentGoal;
        if (!goal) {
          throw new Error("currentGoal is undefined");
        }
        await expectGoalInFocus(goal.id, settingsRepository, false);
      });
    },

    andGoalRemainsInFocus: (And: StepTest["Given"]) => {
      And(
        "goal {string} remains in focus",
        async (_ctx: TestContext, goalName: string) => {
          const goal = getGoalFromContext(f.context.testGoals, goalName);
          await expectGoalInFocus(goal.id, settingsRepository, true);
        },
      );
    },
  };
}
