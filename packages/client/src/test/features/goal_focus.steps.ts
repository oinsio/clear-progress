import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildGoal } from "@/test/factories/goalFactory";
import type { Goal } from "@/types/entities";

const feature = await loadFeature("./goal_focus_01.feature");

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

    f.Background(({ Given }) => {
      Given("goals exist:", async (_ctx: TestContext, table) => {
        // Initialize testGoals in Background
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

    f.Scenario("Add first goal to focus", ({ Given, When, Then, And }) => {
      Given(
        "{int} goals in focus",
        async (_ctx: TestContext, count: number) => {
          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          if (count === 0) {
            expect(focused1).toBeUndefined();
            expect(focused2).toBeUndefined();
          } else if (count === 1) {
            expect(focused1).toBeDefined();
            expect(focused2).toBeUndefined();
          } else if (count === 2) {
            expect(focused1).toBeDefined();
            expect(focused2).toBeDefined();
          }
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

        // Check if goal is already focused
        const isFocused = focused1 === goal!.id || focused2 === goal!.id;

        if (isFocused) {
          // Remove from focus (compaction)
          const remaining: string[] = [];
          if (focused1 !== goal!.id && focused1) remaining.push(focused1);
          if (focused2 !== goal!.id && focused2) remaining.push(focused2);

          await settingsRepository.set("focused_goal_1", remaining[0] || "");
          await settingsRepository.set("focused_goal_2", remaining[1] || "");
        } else {
          // Add to focus
          if (!focused1) {
            await settingsRepository.set("focused_goal_1", goal!.id);
          } else if (!focused2) {
            await settingsRepository.set("focused_goal_2", goal!.id);
          }
        }
      });

      Then(
        "goal {string} is added to focus",
        async (_ctx: TestContext, goalName: string) => {
          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

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
        "Settings has focused_goal_1 = {string}",
        async (_ctx: TestContext, expectedId: string) => {
          const actualId = await settingsRepository.getValue("focused_goal_1");

          if (expectedId === "") {
            expect(actualId).toBeUndefined();
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
            expect(actualId).toBeUndefined();
          } else {
            expect(actualId).toBe(expectedId);
          }
        },
      );
    });

    f.Scenario("Add second goal to focus", ({ Given, When, Then, And }) => {
      Given(
        "{int} goal in focus: {string}",
        async (_ctx: TestContext, count: number, goalName: string) => {
          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();

          // Set goal in focused_goal_1
          await settingsRepository.set("focused_goal_1", goal!.id);

          // Verify it's set correctly
          const focused1 = await settingsRepository.getValue("focused_goal_1");
          expect(focused1).toBe(goal!.id);

          // Verify count matches (focused_goal_2 should be empty for count=1)
          const focused2 = await settingsRepository.getValue("focused_goal_2");
          if (count === 1) {
            expect(focused2).toBeUndefined();
          }
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

        // Check if goal is already focused
        const isFocused = focused1 === goal!.id || focused2 === goal!.id;

        if (isFocused) {
          // Remove from focus (compaction)
          const remaining: string[] = [];
          if (focused1 !== goal!.id && focused1) remaining.push(focused1);
          if (focused2 !== goal!.id && focused2) remaining.push(focused2);

          await settingsRepository.set("focused_goal_1", remaining[0] || "");
          await settingsRepository.set("focused_goal_2", remaining[1] || "");
        } else {
          // Add to focus
          if (!focused1) {
            await settingsRepository.set("focused_goal_1", goal!.id);
          } else if (!focused2) {
            await settingsRepository.set("focused_goal_2", goal!.id);
          }
        }
      });

      Then(
        "goal {string} is added to focus",
        async (_ctx: TestContext, goalName: string) => {
          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

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
        "Settings has focused_goal_1 = {string}",
        async (_ctx: TestContext, expectedId: string) => {
          const actualId = await settingsRepository.getValue("focused_goal_1");

          if (expectedId === "") {
            expect(actualId).toBeUndefined();
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
            expect(actualId).toBeUndefined();
          } else {
            expect(actualId).toBe(expectedId);
          }
        },
      );
    });

    f.Scenario(
      "Remove goal from focus via toggle",
      ({ Given, When, Then, And }) => {
        Given(
          "{int} goal in focus: {string}",
          async (_ctx: TestContext, count: number, goalName: string) => {
            const goal = f.context.testGoals.get(goalName);
            expect(goal).toBeDefined();

            await settingsRepository.set("focused_goal_1", goal!.id);

            const focused1 =
              await settingsRepository.getValue("focused_goal_1");
            expect(focused1).toBe(goal!.id);

            const focused2 =
              await settingsRepository.getValue("focused_goal_2");
            if (count === 1) {
              expect(focused2).toBeUndefined();
            }
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

          if (isFocused) {
            const remaining: string[] = [];
            if (focused1 !== goal!.id && focused1) remaining.push(focused1);
            if (focused2 !== goal!.id && focused2) remaining.push(focused2);

            await settingsRepository.set("focused_goal_1", remaining[0] || "");
            await settingsRepository.set("focused_goal_2", remaining[1] || "");
          } else {
            if (!focused1) {
              await settingsRepository.set("focused_goal_1", goal!.id);
            } else if (!focused2) {
              await settingsRepository.set("focused_goal_2", goal!.id);
            }
          }
        });

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

        And("focus icon is inactive", async (_ctx: TestContext) => {
          const goal = f.context.currentGoal;
          expect(goal).toBeDefined();

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          const isActive = focused1 === goal!.id || focused2 === goal!.id;
          expect(isActive).toBe(false);
        });

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

    f.Scenario(
      "Remove first goal when second is occupied — shift up",
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

          if (isFocused) {
            const remaining: string[] = [];
            if (focused1 !== goal!.id && focused1) remaining.push(focused1);
            if (focused2 !== goal!.id && focused2) remaining.push(focused2);

            await settingsRepository.set("focused_goal_1", remaining[0] || "");
            await settingsRepository.set("focused_goal_2", remaining[1] || "");
          } else {
            if (!focused1) {
              await settingsRepository.set("focused_goal_1", goal!.id);
            } else if (!focused2) {
              await settingsRepository.set("focused_goal_2", goal!.id);
            }
          }
        });

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
  },
);
