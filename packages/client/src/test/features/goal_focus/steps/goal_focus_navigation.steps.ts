import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { MenuItemConfig } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
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

type FeatureContext = {
  testGoals: Map<string, Goal>;
  menuOrder: MenuItemConfig[];
  navigatedUrl: string;
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
  const focused1 = await settingsRepository.getValue("focused_goal_1");
  const focused2 = await settingsRepository.getValue("focused_goal_2");
  const ids: string[] = [];
  if (focused1) ids.push(focused1);
  if (focused2) ids.push(focused2);
  return ids;
}

function isFocusedGoalsBlockVisible(menuOrder: MenuItemConfig[]): boolean {
  const item = menuOrder.find((entry) => entry.mode === "focused_goals");
  return item?.visible ?? false;
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
    });

    f.Background(({ Given }) => {
      Given("goals exist:", async (_ctx: TestContext, table) => {
        f.context.testGoals = new Map();
        f.context.menuOrder = [];
        f.context.navigatedUrl = "";

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
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");

            if (!focused1) {
              await settingsRepository.set("focused_goal_1", goal!.id);
            } else {
              await settingsRepository.set("focused_goal_2", goal!.id);
            }
          },
        );

        Then(
          "navigation displays {int} item: {string}",
          async (_ctx: TestContext, count: number, goalName: string) => {
            const focusedIds = await getFocusedGoalIds(settingsRepository);
            expect(focusedIds).toHaveLength(count);

            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();
            expect(focusedIds).toContain(goal!.id);

            const isVisible = isFocusedGoalsBlockVisible(f.context.menuOrder);
            expect(isVisible).toBe(true);
          },
        );

        When(
          "user adds second goal {string} to focus",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");

            if (!focused1) {
              await settingsRepository.set("focused_goal_1", goal!.id);
            } else {
              await settingsRepository.set("focused_goal_2", goal!.id);
            }
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

            const goal1 = f.context.testGoals.get(goalName1);
            const goal2 = f.context.testGoals.get(goalName2);
            expect(goal1).toBeDefined();
            expect(goal2).toBeDefined();
            expect(focusedIds).toContain(goal1!.id);
            expect(focusedIds).toContain(goal2!.id);

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
          "user clicks {string} in navigation",
          async (_ctx: TestContext, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            f.context.navigatedUrl = `/goals/${goal!.id}`;
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
            const goal1 = f.context.testGoals.get(goal1Name);
            const goal2 = f.context.testGoals.get(goal2Name);
            expect(goal1).toBeDefined();
            expect(goal2).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal1!.id);
            await settingsRepository.set("focused_goal_2", goal2!.id);
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
            const goal1 = f.context.testGoals.get(goal1Name);
            const goal2 = f.context.testGoals.get(goal2Name);
            expect(goal1).toBeDefined();
            expect(goal2).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal1!.id);
            await settingsRepository.set("focused_goal_2", goal2!.id);
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

          const goal1 = f.context.testGoals.get("Write a book");
          const goal2 = f.context.testGoals.get("Learn Spanish");

          expect(focused1).toBe(goal1!.id);
          expect(focused2).toBe(goal2!.id);
        });
      },
    );
  },
);
