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
        "two settings have needsSync true and one has needsSync false",
        async (_ctx: TestContext) => {
          await db.settings.bulkAdd([
            buildSetting({ key: "a", needsSync: true }),
            buildSetting({ key: "b", needsSync: true }),
            buildSetting({ key: "c", needsSync: false }),
          ]);
        },
      );

      When("getNeedingSync is called", async (_ctx: TestContext) => {
        result = await repository.getNeedingSync();
      });

      Then(
        "only the two settings with needsSync true are returned",
        async (_ctx: TestContext) => {
          expect(result).toHaveLength(2);
          expect(result.every((setting) => setting.needsSync)).toBe(true);
        },
      );
    });

    // @settings-specs-and-bdd @FR2
    f.Scenario("Clear sync flag by keys", ({ Given, When, Then, And }) => {
      Given(
        'settings "accent_color" and "default_box" have needsSync true',
        async (_ctx: TestContext) => {
          await db.settings.bulkAdd([
            buildSetting({ key: "accent_color", needsSync: true }),
            buildSetting({ key: "default_box", needsSync: true }),
          ]);
        },
      );

      When(
        'clearNeedsSyncByKey is called with keys ["accent_color"]',
        async (_ctx: TestContext) => {
          await repository.clearNeedsSyncByKey(["accent_color"]);
        },
      );

      Then('"accent_color" has needsSync false', async (_ctx: TestContext) => {
        const setting = await db.settings.get("accent_color");
        expect(setting?.needsSync).toBe(false);
      });

      And(
        '"default_box" still has needsSync true',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get("default_box");
          expect(setting?.needsSync).toBe(true);
        },
      );
    });

    // @settings-specs-and-bdd @FR2
    f.Scenario(
      "Filter settings by updated_at",
      ({ Given, And, When, Then }) => {
        let result: Setting[];

        Given(
          'setting A has updated_at "2025-01-01T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "a",
                updated_at: "2025-01-01T00:00:00.000Z",
              }),
            );
          },
        );

        And(
          'setting B has updated_at "2025-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "b",
                updated_at: "2025-01-02T00:00:00.000Z",
              }),
            );
          },
        );

        When(
          'getChangedSince is called with "2025-01-01T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            result = await repository.getChangedSince(
              "2025-01-01T00:00:00.000Z",
            );
          },
        );

        Then("only setting B is returned", async (_ctx: TestContext) => {
          expect(result).toHaveLength(1);
          expect(result[0].key).toBe("b");
        });
      },
    );
  },
);
