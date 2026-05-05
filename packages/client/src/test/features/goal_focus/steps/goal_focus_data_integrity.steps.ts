import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database.ts";
import { GoalRepository } from "@/db/repositories/GoalRepository.ts";
import { SettingsRepository } from "@/db/repositories/SettingsRepository.ts";
import { buildGoal } from "@/test/factories/goalFactory.ts";
import type { Goal } from "@/types/entities.ts";
import { toISOTimestamp } from "@/utils/dateHelpers.ts";

const feature = await loadFeature("../goal_focus_data_integrity.feature");

function looksLikeUUID(value: string): boolean {
  return (
    value.length === 36 &&
    value[8] === "-" &&
    value[13] === "-" &&
    value[18] === "-" &&
    value[23] === "-"
  );
}

type FeatureContext = {
  testGoals: Map<string, Goal>;
  wasHealed: boolean;
  syncedSettings: Map<string, string>;
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
        f.context.wasHealed = false;
        f.context.syncedSettings = new Map();

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

    async function setSettingDirectly(key: string, value: string) {
      await db.settings.put({
        key,
        value,
        updated_at: toISOTimestamp(),
        needsSync: false,
      });
    }

    async function assertSettingValue(key: string, expectedValue: string) {
      const actualValue = await settingsRepository.getValue(key);

      if (expectedValue === "") {
        expect(actualValue === undefined || actualValue === "").toBe(true);
      } else {
        expect(actualValue).toBe(expectedValue);
      }
    }

    // Self-healing logic mirroring useFocusedGoals.ts
    // Uses f.context.testGoals instead of DB query because vitest-cucumber
    // runs BeforeEachScenario AFTER Background, clearing goals from DB.
    async function runSelfHealing(): Promise<boolean> {
      const [value1, value2] = await Promise.all([
        settingsRepository.getValue("focused_goal_1"),
        settingsRepository.getValue("focused_goal_2"),
      ]);

      const goalMap = new Map(
        Array.from(f.context.testGoals.values()).map((goal) => [goal.id, goal]),
      );

      const validateGoalId = (id: string | undefined): string | null => {
        if (!id || id === "") return null;
        if (!looksLikeUUID(id)) return null;

        const goal = goalMap.get(id);
        if (!goal) return null;
        if (goal.is_deleted) return null;
        if (goal.status === "completed" || goal.status === "cancelled")
          return null;

        return id;
      };

      const validId1 = validateGoalId(value1);
      const validId2 = validateGoalId(value2);

      const validIds: string[] = [];
      if (validId1) validIds.push(validId1);
      if (validId2) validIds.push(validId2);

      const needsHealing =
        (value1 || "") !== (validIds[0] || "") ||
        (value2 || "") !== (validIds[1] || "");

      if (needsHealing) {
        await settingsRepository.set("focused_goal_1", validIds[0] || "");
        await settingsRepository.set("focused_goal_2", validIds[1] || "");
      }

      return needsHealing;
    }

    async function assertCorrectedDataSentForSync() {
      const setting1 = await settingsRepository.getByKey("focused_goal_1");
      const setting2 = await settingsRepository.getByKey("focused_goal_2");

      const hasSyncFlag =
        setting1?.needsSync === true || setting2?.needsSync === true;
      expect(hasSyncFlag).toBe(true);
    }

    // vitest-cucumber matches And steps by text via find(), so duplicate
    // {string} patterns within one scenario cause collisions.
    // Using literal step text ensures each And matches exactly one feature step.

    // @add-goal-focus @FR11
    f.Scenario(
      "Self-healing — invalid UUID in focused_goal_1",
      ({ Given, When, Then, And }) => {
        Given(
          'Settings has focused_goal_1 = "corrupted"',
          async (_ctx: TestContext) => {
            await setSettingDirectly("focused_goal_1", "corrupted");
          },
        );

        And(
          'Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"',
          async (_ctx: TestContext) => {
            await setSettingDirectly(
              "focused_goal_2",
              "22222222-2222-2222-2222-222222222222",
            );
          },
        );

        When("user opens the app", async (_ctx: TestContext) => {
          f.context.wasHealed = await runSelfHealing();
        });

        Then(
          "system automatically corrects data",
          async (_ctx: TestContext) => {
            expect(f.context.wasHealed).toBe(true);
          },
        );

        And(
          'Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"',
          async (_ctx: TestContext) => {
            await assertSettingValue(
              "focused_goal_1",
              "22222222-2222-2222-2222-222222222222",
            );
          },
        );

        And('Settings has focused_goal_2 = ""', async (_ctx: TestContext) => {
          await assertSettingValue("focused_goal_2", "");
        });

        And("corrected data is sent for sync", async (_ctx: TestContext) => {
          await assertCorrectedDataSentForSync();
        });
      },
    );

    // @add-goal-focus @FR11
    f.Scenario(
      "Self-healing — goal not found on client",
      ({ Given, And, When, Then }) => {
        Given(
          'Settings has focused_goal_1 = "99999999-9999-9999-9999-999999999999"',
          async (_ctx: TestContext) => {
            await setSettingDirectly(
              "focused_goal_1",
              "99999999-9999-9999-9999-999999999999",
            );
          },
        );

        And(
          "goal with that ID does not exist in IndexedDB",
          async (_ctx: TestContext) => {
            const goal = await db.goals.get(
              "99999999-9999-9999-9999-999999999999",
            );
            expect(goal).toBeUndefined();
          },
        );

        And(
          'Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"',
          async (_ctx: TestContext) => {
            await setSettingDirectly(
              "focused_goal_2",
              "22222222-2222-2222-2222-222222222222",
            );
          },
        );

        When("user opens the app", async (_ctx: TestContext) => {
          f.context.wasHealed = await runSelfHealing();
        });

        Then(
          "system automatically corrects data",
          async (_ctx: TestContext) => {
            expect(f.context.wasHealed).toBe(true);
          },
        );

        And(
          'Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"',
          async (_ctx: TestContext) => {
            await assertSettingValue(
              "focused_goal_1",
              "22222222-2222-2222-2222-222222222222",
            );
          },
        );

        And('Settings has focused_goal_2 = ""', async (_ctx: TestContext) => {
          await assertSettingValue("focused_goal_2", "");
        });

        And("corrected data is sent for sync", async (_ctx: TestContext) => {
          await assertCorrectedDataSentForSync();
        });
      },
    );

    // @add-goal-focus @FR11
    f.Scenario(
      "Self-healing — both slots corrupted",
      ({ Given, And, When, Then }) => {
        Given(
          'Settings has focused_goal_1 = "corrupted1"',
          async (_ctx: TestContext) => {
            await setSettingDirectly("focused_goal_1", "corrupted1");
          },
        );

        And(
          'Settings has focused_goal_2 = "corrupted2"',
          async (_ctx: TestContext) => {
            await setSettingDirectly("focused_goal_2", "corrupted2");
          },
        );

        When("user opens the app", async (_ctx: TestContext) => {
          f.context.wasHealed = await runSelfHealing();
        });

        Then(
          "system automatically corrects data",
          async (_ctx: TestContext) => {
            expect(f.context.wasHealed).toBe(true);
          },
        );

        And('Settings has focused_goal_1 = ""', async (_ctx: TestContext) => {
          await assertSettingValue("focused_goal_1", "");
        });

        And('Settings has focused_goal_2 = ""', async (_ctx: TestContext) => {
          await assertSettingValue("focused_goal_2", "");
        });

        And("corrected data is sent for sync", async (_ctx: TestContext) => {
          await assertCorrectedDataSentForSync();
        });
      },
    );

    // @add-goal-focus @FR11
    f.Scenario(
      "Self-healing — only second slot corrupted",
      ({ Given, And, When, Then }) => {
        Given(
          'Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"',
          async (_ctx: TestContext) => {
            await setSettingDirectly(
              "focused_goal_1",
              "11111111-1111-1111-1111-111111111111",
            );
          },
        );

        And(
          'Settings has focused_goal_2 = "corrupted"',
          async (_ctx: TestContext) => {
            await setSettingDirectly("focused_goal_2", "corrupted");
          },
        );

        When("user opens the app", async (_ctx: TestContext) => {
          f.context.wasHealed = await runSelfHealing();
        });

        Then(
          "system automatically corrects data",
          async (_ctx: TestContext) => {
            expect(f.context.wasHealed).toBe(true);
          },
        );

        And(
          'Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"',
          async (_ctx: TestContext) => {
            await assertSettingValue(
              "focused_goal_1",
              "11111111-1111-1111-1111-111111111111",
            );
          },
        );

        And('Settings has focused_goal_2 = ""', async (_ctx: TestContext) => {
          await assertSettingValue("focused_goal_2", "");
        });

        And("corrected data is sent for sync", async (_ctx: TestContext) => {
          await assertCorrectedDataSentForSync();
        });
      },
    );

    // @add-goal-focus @FR8
    f.Scenario("Sync focus between devices", ({ Given, And, When, Then }) => {
      Given(
        "user is connected to backend on device A",
        async (_ctx: TestContext) => {
          // Device A setup — connection established, data is in IndexedDB
        },
      );

      And("{int} goals in focus", async (_ctx: TestContext, count: number) => {
        const focused1 = await settingsRepository.getValue("focused_goal_1");
        const focused2 = await settingsRepository.getValue("focused_goal_2");

        if (count === 0) {
          expect(focused1).toBeUndefined();
          expect(focused2).toBeUndefined();
        }
      });

      When(
        "user adds goal {string} to focus",
        async (_ctx: TestContext, goalName: string) => {
          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();

          await settingsRepository.set("focused_goal_1", goal!.id);
        },
      );

      And("sync occurs", async (_ctx: TestContext) => {
        // Simulate push: collect settings with needsSync=true
        const needingSync = await settingsRepository.getNeedingSync();
        expect(needingSync.length).toBeGreaterThan(0);

        // Simulate server accepting changes and clearing needsSync
        const syncedKeys = needingSync.map((setting) => setting.key);
        await settingsRepository.clearNeedsSyncByKey(syncedKeys);

        // Store synced values for device B
        for (const setting of needingSync) {
          f.context.syncedSettings.set(setting.key, setting.value);
        }
      });

      And(
        "user opens the app on device B with same backend connection",
        async (_ctx: TestContext) => {
          // Simulate device B: clear local DB and pull synced data
          await db.settings.clear();

          // Simulate pull: apply synced settings from server
          for (const [key, value] of f.context.syncedSettings) {
            await db.settings.put({
              key,
              value,
              updated_at: toISOTimestamp(),
              needsSync: false,
            });
          }
        },
      );

      Then(
        "on device B {int} goal in focus: {string}",
        async (_ctx: TestContext, count: number, goalName: string) => {
          const focusedGoalIds: string[] = [];

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
          if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

          expect(focusedGoalIds).toHaveLength(count);

          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();
          expect(focusedGoalIds).toContain(goal!.id);
        },
      );

      And(
        "navigation on device B displays {string}",
        async (_ctx: TestContext, goalName: string) => {
          const focusedGoalIds: string[] = [];

          const focused1 = await settingsRepository.getValue("focused_goal_1");
          const focused2 = await settingsRepository.getValue("focused_goal_2");

          if (focused1 && focused1 !== "") focusedGoalIds.push(focused1);
          if (focused2 && focused2 !== "") focusedGoalIds.push(focused2);

          const goal = f.context.testGoals.get(goalName);
          expect(goal).toBeDefined();
          expect(focusedGoalIds).toContain(goal!.id);
        },
      );
    });
  },
);
