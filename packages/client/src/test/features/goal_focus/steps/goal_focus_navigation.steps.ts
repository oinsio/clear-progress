import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { MenuItemConfig } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import {
  getFocusedGoals,
  getGoalFromContext,
  removeGoalFromFocus,
} from "@/test/helpers/bdd/goalFocus/helpers.ts";
import { createBackgroundSteps } from "@/test/helpers/bdd/goalFocus/stepDefinitions.ts";
import type { Goal } from "@/types/entities.ts";

const feature = await loadFeature("../goal_focus_navigation.feature");

const DEFAULT_MENU_ORDER: MenuItemConfig[] = [
  { mode: "inbox", visible: true },
  { mode: "contexts", visible: true },
  { mode: "categories", visible: true },
  { mode: "goals", visible: true },
  { mode: "ideas", visible: true },
  { mode: "tasks", visible: true },
  { mode: "completed", visible: true },
  { mode: "focused_goals", visible: true },
  { mode: "deleted", visible: false },
];

type RightPanelMode =
  | "inbox"
  | "tasks"
  | "completed"
  | "goals"
  | "focused_goals"
  | "ideas"
  | "contexts"
  | "categories"
  | "deleted"
  | "search"
  | null;

type FeatureContext = {
  testGoals: Map<string, Goal>;
  menuOrder: MenuItemConfig[];
  navigatedUrl: string;
  currentGoalId: string | null;
  rightPanelMode: RightPanelMode | null;
  activeFocusedGoalId: string | undefined;
};

function loadMenuOrder(): MenuItemConfig[] {
  const stored = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
  if (!stored) return [...DEFAULT_MENU_ORDER];
  return JSON.parse(stored) as MenuItemConfig[];
}

function saveMenuOrder(menuOrder: MenuItemConfig[]): void {
  localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(menuOrder));
}

async function getFocusedGoalIds(
  settingsRepository: SettingsRepository,
): Promise<string[]> {
  const { focused1, focused2 } = await getFocusedGoals(settingsRepository);
  const ids: string[] = [];
  if (focused1) ids.push(focused1);
  if (focused2) ids.push(focused2);
  return ids;
}

function isFocusedGoalsBlockVisible(menuOrder: MenuItemConfig[]): boolean {
  const item = menuOrder.find((entry) => entry.mode === "focused_goals");
  return item?.visible ?? false;
}

function computeRightPanelState(
  currentGoalId: string,
  focusedGoalIds: string[],
  menuOrder: MenuItemConfig[],
): { mode: RightPanelMode | null; activeFocusedGoalId: string | undefined } {
  const isFocusedGoal = focusedGoalIds.includes(currentGoalId);
  const isFocusedGoalsVisible = menuOrder.some(
    (c) => c.mode === "focused_goals" && c.visible,
  );

  if (isFocusedGoal && isFocusedGoalsVisible) {
    return { mode: null, activeFocusedGoalId: currentGoalId };
  } else {
    return { mode: "goals", activeFocusedGoalId: undefined };
  }
}

// Reusable step definitions
function createNavigationSteps(
  f: FeatureDescriibeCallbackParams<FeatureContext>,
  settingsRepository: SettingsRepository,
) {
  return {
    setBlockVisibility: (
      _blockName: string,
      visible: boolean,
    ): ((_ctx: TestContext, blockName: string) => Promise<void>) => {
      return async (_ctx: TestContext, blockName: string) => {
        f.context.menuOrder = loadMenuOrder();
        f.context.menuOrder = f.context.menuOrder.map((entry) =>
          entry.mode === blockName ? { ...entry, visible } : entry,
        );
        saveMenuOrder(f.context.menuOrder);
      };
    },

    setGoalInFocus: async (
      _ctx: TestContext,
      _count: number,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      await settingsRepository.set("focused_goal_1", goal.id);

      const focused1 = await settingsRepository.getValue("focused_goal_1");
      expect(focused1).toBe(goal.id);
    },

    navigateToGoalPage: async (
      _ctx: TestContext,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      f.context.currentGoalId = goal.id;
      f.context.navigatedUrl = `/goals/${goal.id}`;

      const focusedIds = await getFocusedGoalIds(settingsRepository);
      const state = computeRightPanelState(
        goal.id,
        focusedIds,
        f.context.menuOrder,
      );
      f.context.rightPanelMode = state.mode;
      f.context.activeFocusedGoalId = state.activeFocusedGoalId;
    },

    userIsOnGoalPage: async (
      _ctx: TestContext,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      f.context.currentGoalId = goal.id;

      const focusedIds = await getFocusedGoalIds(settingsRepository);
      const state = computeRightPanelState(
        goal.id,
        focusedIds,
        f.context.menuOrder,
      );
      f.context.rightPanelMode = state.mode;
      f.context.activeFocusedGoalId = state.activeFocusedGoalId;
    },

    assertFocusedGoalNavItemActive: async (
      _ctx: TestContext,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      expect(f.context.activeFocusedGoalId).toBe(goal.id);
    },

    assertFocusedGoalNavItemNotActive: async (
      _ctx: TestContext,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      expect(f.context.activeFocusedGoalId).not.toBe(goal.id);
    },

    assertMenuItemActive: async (
      _ctx: TestContext,
      _menuItem: string,
    ): Promise<void> => {
      expect(f.context.rightPanelMode).toBe("goals");
    },

    assertMenuItemNotActive: async (
      _ctx: TestContext,
      _menuItem: string,
    ): Promise<void> => {
      expect(f.context.rightPanelMode).not.toBe("goals");
    },

    assertFocusedGoalNavItemNotRendered: async (
      _ctx: TestContext,
      goalName: string,
    ): Promise<void> => {
      const goal = getGoalFromContext(f.context.testGoals, goalName);
      const focusedIds = await getFocusedGoalIds(settingsRepository);
      const isInFocus = focusedIds.includes(goal.id);
      const isVisible = isFocusedGoalsBlockVisible(f.context.menuOrder);

      expect(isInFocus && isVisible).toBe(false);
    },
  };
}

async function addGoalToFocus(
  goalName: string,
  testGoals: Map<string, Goal>,
  settingsRepository: SettingsRepository,
): Promise<void> {
  const goal = getGoalFromContext(testGoals, goalName);

  const focused1 = await settingsRepository.getValue("focused_goal_1");

  if (!focused1) {
    await settingsRepository.set("focused_goal_1", goal.id);
  } else {
    await settingsRepository.set("focused_goal_2", goal.id);
  }
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const goalRepository = new GoalRepository();
    const settingsRepository = new SettingsRepository();

    f.BeforeEachScenario(async () => {
      await db.goals.clear();
      await db.settings.clear();
      localStorage.removeItem(STORAGE_KEYS.MENU_ORDER);
      f.context.menuOrder = [];
      f.context.navigatedUrl = "";
      f.context.currentGoalId = null;
      f.context.rightPanelMode = null;
      f.context.activeFocusedGoalId = undefined;
    });

    const backgroundSteps = createBackgroundSteps(f, goalRepository);
    const navSteps = createNavigationSteps(f, settingsRepository);

    f.Background(({ Given }) => {
      backgroundSteps(Given);
    });

    // @add-goal-focus @FR4 @FR5 @FR7
    f.Scenario(
      "Display focused goals in navigation",
      ({ Given, When, Then }) => {
        Given(
          "{int} goals in focus",
          async (_ctx: TestContext, count: number) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);
          },
        );

        When("user opens the app", async (_ctx: TestContext) => {
          f.context.menuOrder = loadMenuOrder();
        });

        Then(
          "{string} block is not displayed in navigation",
          async (_ctx: TestContext, _blockName: string) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(0);
          },
        );

        When(
          "user adds goal {string} to focus",
          async (_ctx: TestContext, goalName: string) => {
            await addGoalToFocus(
              goalName,
              f.context.testGoals,
              settingsRepository,
            );
          },
        );

        Then(
          "navigation displays {int} item: {string}",
          async (_ctx: TestContext, count: number, goalName: string) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);

            const goal = getGoalFromContext(f.context.testGoals, goalName);
            expect(focusedIds).toContain(goal.id);

            const isVisible = isFocusedGoalsBlockVisible(f.context.menuOrder);
            expect(isVisible).toBe(true);
          },
        );

        When(
          "user adds second goal {string} to focus",
          async (_ctx: TestContext, goalName: string) => {
            await addGoalToFocus(
              goalName,
              f.context.testGoals,
              settingsRepository,
            );
          },
        );

        Then(
          "navigation displays {int} items: {string}, {string}",
          async (
            _ctx: TestContext,
            count: number,
            goalName1: string,
            goalName2: string,
          ) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);

            const goal1 = getGoalFromContext(f.context.testGoals, goalName1);
            const goal2 = getGoalFromContext(f.context.testGoals, goalName2);
            expect(focusedIds).toContain(goal1.id);
            expect(focusedIds).toContain(goal2.id);

            const isVisible = isFocusedGoalsBlockVisible(f.context.menuOrder);
            expect(isVisible).toBe(true);
          },
        );
      },
    );

    // @add-goal-focus @FR5 @UX2
    f.Scenario(
      "Click on goal in navigation leads to goal page",
      ({ Given, When, Then }) => {
        Given("{int} goal in focus: {string}", navSteps.setGoalInFocus);

        When(
          "user clicks {string} in navigation",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);

            f.context.navigatedUrl = `/goals/${goal.id}`;
          },
        );

        Then(
          "page {string} opens",
          async (_ctx: TestContext, expectedUrl: string) => {
            expect(f.context.navigatedUrl).toBe(expectedUrl);
          },
        );
      },
    );

    // @add-goal-focus @FR6
    f.Scenario(
      "Focused goals as single block in menu settings",
      ({ Given, When, Then, And }) => {
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
          },
        );

        When("user opens menu order settings", async (_ctx: TestContext) => {
          f.context.menuOrder = loadMenuOrder();
        });

        Then(
          "{string} is displayed as one draggable element",
          async (_ctx: TestContext, blockName: string) => {
            const focusedGoalsEntries = f.context.menuOrder.filter(
              (entry) => entry.mode === blockName,
            );
            expect(focusedGoalsEntries).toHaveLength(1);
          },
        );

        And(
          "both goals move together when order changes",
          async (_ctx: TestContext) => {
            const originalIndex = f.context.menuOrder.findIndex(
              (entry) => entry.mode === "focused_goals",
            );
            expect(originalIndex).toBeGreaterThanOrEqual(0);

            // Simulate reorder: move focused_goals to top
            const reordered = [...f.context.menuOrder];
            const [focusedBlock] = reordered.splice(originalIndex, 1);
            reordered.unshift(focusedBlock);
            saveMenuOrder(reordered);

            // Verify both goals are still served by a single block
            const loaded = loadMenuOrder();
            const focusedGoalsEntries = loaded.filter(
              (entry) => entry.mode === "focused_goals",
            );
            expect(focusedGoalsEntries).toHaveLength(1);

            // Verify both goals still in settings (not split)
            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            const focused2 =
              await settingsRepository.getValue("focused_goal_2");
            expect(focused1).toBeDefined();
            expect(focused2).toBeDefined();
          },
        );
      },
    );

    // @add-goal-focus @FR6
    f.Scenario(
      "Hide focused_goals block in menu settings",
      ({ Given, When, Then, And }) => {
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
          },
        );

        When(
          "user hides {string} block in menu settings",
          async (_ctx: TestContext, _blockName: string) => {
            f.context.menuOrder = loadMenuOrder();
            f.context.menuOrder = f.context.menuOrder.map((entry) =>
              entry.mode === "focused_goals"
                ? { ...entry, visible: false }
                : entry,
            );
            saveMenuOrder(f.context.menuOrder);
          },
        );

        Then(
          "both goals disappear from navigation",
          async (_ctx: TestContext) => {
            const isVisible = isFocusedGoalsBlockVisible(f.context.menuOrder);
            expect(isVisible).toBe(false);
          },
        );

        And("Settings data remains unchanged", async (_ctx: TestContext) => {
          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const goal1 = getGoalFromContext(f.context.testGoals, "Write a book");
          const goal2 = getGoalFromContext(
            f.context.testGoals,
            "Learn Spanish",
          );

          expect(focused1).toBe(goal1.id);
          expect(focused2).toBe(goal2.id);
        });
      },
    );

    // @fix-focused-goal-highlight @FR1 @FR6
    f.Scenario(
      "Focused goal highlighted on its detail page",
      ({ Given, When, Then, And }) => {
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
          },
        );

        And(
          "{string} block is visible in menu",
          navSteps.setBlockVisibility("focused_goals", true),
        );

        When(
          "user navigates to goal page {string}",
          navSteps.navigateToGoalPage,
        );

        Then(
          "focused goal {string} nav item is active",
          navSteps.assertFocusedGoalNavItemActive,
        );

        And(
          "{string} menu item is not active",
          navSteps.assertMenuItemNotActive,
        );

        And(
          "focused goal {string} nav item is not active",
          navSteps.assertFocusedGoalNavItemNotActive,
        );
      },
    );

    // @fix-focused-goal-highlight @FR5
    f.Scenario(
      "Highlight updates reactively when focus is toggled off",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await settingsRepository.set("focused_goal_1", goal.id);
          },
        );

        And(
          "{string} block is visible in menu",
          navSteps.setBlockVisibility("focused_goals", true),
        );

        And("user is on goal page {string}", navSteps.userIsOnGoalPage);

        And(
          "focused goal {string} nav item is active",
          navSteps.assertFocusedGoalNavItemActive,
        );

        When(
          "user removes goal {string} from focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await removeGoalFromFocus(goal.id, settingsRepository);

            if (f.context.currentGoalId) {
              const focusedIds = await getFocusedGoalIds(settingsRepository);
              const state = computeRightPanelState(
                f.context.currentGoalId,
                focusedIds,
                f.context.menuOrder,
              );
              f.context.rightPanelMode = state.mode;
              f.context.activeFocusedGoalId = state.activeFocusedGoalId;
            }
          },
        );

        Then(
          "focused goal {string} nav item is not rendered",
          navSteps.assertFocusedGoalNavItemNotRendered,
        );

        And("{string} menu item is active", navSteps.assertMenuItemActive);
      },
    );

    // @fix-focused-goal-highlight @FR5
    f.Scenario(
      "Highlight updates reactively when focus is toggled on",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goals in focus",
          async (_ctx: TestContext, count: number) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);
            // Initialize menuOrder for this scenario
            f.context.menuOrder = loadMenuOrder();
          },
        );

        And("user is on goal page {string}", navSteps.userIsOnGoalPage);

        And("{string} menu item is active", navSteps.assertMenuItemActive);

        When(
          "user adds goal {string} to focus",
          async (_ctx: TestContext, goalName: string) => {
            await addGoalToFocus(
              goalName,
              f.context.testGoals,
              settingsRepository,
            );

            if (f.context.currentGoalId) {
              const focusedIds = await getFocusedGoalIds(settingsRepository);
              const state = computeRightPanelState(
                f.context.currentGoalId,
                focusedIds,
                f.context.menuOrder,
              );
              f.context.rightPanelMode = state.mode;
              f.context.activeFocusedGoalId = state.activeFocusedGoalId;
            }
          },
        );

        Then(
          "focused goal {string} nav item is active",
          navSteps.assertFocusedGoalNavItemActive,
        );

        And(
          "{string} menu item is not active",
          navSteps.assertMenuItemNotActive,
        );
      },
    );

    // @fix-focused-goal-highlight @FR3
    f.Scenario(
      "Fallback to Goals highlight when focused_goals block is hidden",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, _count: number, goalName: string) => {
            const goal = getGoalFromContext(f.context.testGoals, goalName);
            await settingsRepository.set("focused_goal_1", goal.id);
          },
        );

        And(
          "{string} block is hidden in menu",
          navSteps.setBlockVisibility("focused_goals", false),
        );

        When(
          "user navigates to goal page {string}",
          navSteps.navigateToGoalPage,
        );

        Then("{string} menu item is active", navSteps.assertMenuItemActive);

        And(
          "focused goal {string} nav item is not rendered",
          navSteps.assertFocusedGoalNavItemNotRendered,
        );
      },
    );

    // @fix-focused-goal-highlight @FR2
    f.Scenario(
      "Goals highlighted when goal is not in focus",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goals in focus",
          async (_ctx: TestContext, count: number) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);
          },
        );

        When(
          "user navigates to goal page {string}",
          navSteps.navigateToGoalPage,
        );

        Then("{string} menu item is active", navSteps.assertMenuItemActive);

        And(
          "focused goal {string} nav item is not rendered",
          navSteps.assertFocusedGoalNavItemNotRendered,
        );
      },
    );
  },
);
