// implements FR2 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";
import type { Setting } from "@/types/entities";

const feature = await loadFeature("../settings_repository_sync_flags.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      repository = new SettingsRepository();
    });

    // @settings-specs-and-bdd @FR2
    f.Scenario("Get settings needing sync", ({ Given, When, Then }) => {
      let result: Setting[];

      Given(
        'two settings have syncStatus "pending" and one has syncStatus "synced"',
        async (_ctx: TestContext) => {
          await db.settings.bulkAdd([
            buildSetting({ key: "a", syncStatus: "pending" as const }),
            buildSetting({ key: "b", syncStatus: "pending" as const }),
            buildSetting({ key: "c", syncStatus: "synced" as const }),
          ]);
        },
      );

      When("getNeedingSync is called", async (_ctx: TestContext) => {
        result = await repository.getNeedingSync();
      });

      Then(
        'only the two settings with syncStatus "pending" are returned',
        async (_ctx: TestContext) => {
          expect(result).toHaveLength(2);
          expect(result.every((setting) => setting.syncStatus)).toBe(true);
        },
      );
    });

    // @settings-specs-and-bdd @FR2
    f.Scenario("Clear sync flag by keys", ({ Given, When, Then, And }) => {
      Given(
        'settings "accent_color" and "default_box" have syncStatus "pending"',
        async (_ctx: TestContext) => {
          await db.settings.bulkAdd([
            buildSetting({
              key: "accent_color",
              syncStatus: "pending" as const,
            }),
            buildSetting({
              key: "default_box",
              syncStatus: "pending" as const,
            }),
          ]);
        },
      );

      When(
        'clearNeedsSyncByKey is called with keys ["accent_color"]',
        async (_ctx: TestContext) => {
          await repository.clearNeedsSyncByKey(["accent_color"]);
        },
      );

      Then(
        '"accent_color" has syncStatus "synced"',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get("accent_color");
          expect(setting?.syncStatus).toBe("synced");
        },
      );

      And(
        '"default_box" still has syncStatus "pending"',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get("default_box");
          expect(setting?.syncStatus).toBe("pending");
        },
      );
    });
  },
);
