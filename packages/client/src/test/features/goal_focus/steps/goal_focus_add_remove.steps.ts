import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import {
  createAndSteps,
  createBackgroundSteps,
  createGivenSteps,
  createThenSteps,
  createWhenSteps,
} from "@/test/helpers/bdd/goalFocus/stepDefinitions.ts";
import type { Goal } from "@/types/entities.ts";

const feature = await loadFeature("../goal_focus_add_remove.feature");

type FeatureContext = {
  testGoals: Map<string, Goal>;
  currentGoal?: Goal;
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

    const backgroundSteps = createBackgroundSteps(f, goalRepository);

    f.Background(({ Given }) => {
      backgroundSteps(Given);
    });

    const givenSteps = createGivenSteps(f, settingsRepository);
    const whenSteps = createWhenSteps(f);
    const thenSteps = createThenSteps(f, settingsRepository);
    const andSteps = createAndSteps(f, settingsRepository);

    // @add-goal-focus @FR1 @FR8
    f.Scenario("Add first goal to focus", ({ Given, When, Then, And }) => {
      givenSteps.givenGoalsInFocus(Given);
      whenSteps.whenUserOpensGoalPage(When);
      andSteps.andClicksFocusIcon(And);
      thenSteps.thenGoalIsAddedToFocus(Then);
      andSteps.andFocusIconIsActive(And);
      andSteps.andSettingsHasFocusedGoal1(And);
      andSteps.andSettingsHasFocusedGoal2(And);
    });

    // @add-goal-focus @FR1 @FR8
    f.Scenario("Add second goal to focus", ({ Given, When, Then, And }) => {
      givenSteps.givenOneGoalInFocus(Given);
      whenSteps.whenUserOpensGoalPage(When);
      andSteps.andClicksFocusIcon(And);
      thenSteps.thenGoalIsAddedToFocus(Then);
      andSteps.andFocusIconIsActive(And);
      andSteps.andSettingsHasFocusedGoal1(And);
      andSteps.andSettingsHasFocusedGoal2(And);
    });

    // @add-goal-focus @FR10
    f.Scenario(
      "Remove goal from focus via toggle",
      ({ Given, When, Then, And }) => {
        givenSteps.givenOneGoalInFocus(Given);
        whenSteps.whenUserOpensGoalPage(When);
        andSteps.andClicksFocusIcon(And);
        thenSteps.thenGoalIsRemovedFromFocus(Then);
        andSteps.andFocusIconIsInactive(And);
        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);
      },
    );

    // @add-goal-focus @FR1 @FR2
    f.Scenario(
      "Remove first goal when second is occupied — shift up",
      ({ Given, When, Then, And }) => {
        givenSteps.givenTwoGoalsInFocus(Given);
        whenSteps.whenUserOpensGoalPage(When);
        andSteps.andClicksFocusIcon(And);
        thenSteps.thenGoalIsRemovedFromFocus(Then);
        andSteps.andGoalRemainsInFocus(And);
        andSteps.andSettingsHasFocusedGoal1(And);
        andSteps.andSettingsHasFocusedGoal2(And);
      },
    );
  },
);
