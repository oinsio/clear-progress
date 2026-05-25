// implements FR1 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";
import type { Setting } from "@/types/entities";

const feature = await loadFeature("../settings_repository_read.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      repository = new SettingsRepository();
    });

    // @settings-specs-and-bdd @FR1
    f.Scenario("Get existing setting by key", ({ Given, When, Then }) => {
      let result: Setting | undefined;

      Given(
        'a setting with key "accent_color" and value "blue" exists',
        async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({
              key: "accent_color",
              value: "blue",
              needsSync: false,
            }),
          );
        },
      );

      When(
        'getByKey is called with "accent_color"',
        async (_ctx: TestContext) => {
          result = await repository.getByKey("accent_color");
        },
      );

      Then(
        'the full setting record is returned with key "accent_color", value "blue", updated_at, and needsSync',
        async (_ctx: TestContext) => {
          expect(result).toBeDefined();
          expect(result?.key).toBe("accent_color");
          expect(result?.value).toBe("blue");
          expect(result?.updated_at).toBeDefined();
          expect(result?.needsSync).toBeDefined();
        },
      );
    });

    // @settings-specs-and-bdd @FR1
    f.Scenario("Get value of existing setting", ({ Given, When, Then }) => {
      let result: string | undefined;

      Given(
        'a setting with key "default_box" and value "today" exists',
        async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({
              key: "default_box",
              value: "today",
              needsSync: false,
            }),
          );
        },
      );

      When(
        'getValue is called with "default_box"',
        async (_ctx: TestContext) => {
          result = await repository.getValue("default_box");
        },
      );

      Then('the result is "today"', async (_ctx: TestContext) => {
        expect(result).toBe("today");
      });
    });

    // @settings-specs-and-bdd @FR1
    f.Scenario("Get non-existent setting by key", ({ Given, When, Then }) => {
      let result: Setting | undefined;

      Given(
        'no setting with key "unknown_key" exists',
        async (_ctx: TestContext) => {
          // DB is already cleared in BeforeEachScenario
        },
      );

      When(
        'getByKey is called with "unknown_key"',
        async (_ctx: TestContext) => {
          result = await repository.getByKey("unknown_key");
        },
      );

      Then("the result is undefined", async (_ctx: TestContext) => {
        expect(result).toBeUndefined();
      });
    });

    // @settings-specs-and-bdd @FR1
    f.Scenario("Get value of non-existent setting", ({ Given, When, Then }) => {
      let result: string | undefined;

      Given(
        'no setting with key "unknown_key" exists',
        async (_ctx: TestContext) => {
          // DB is already cleared in BeforeEachScenario
        },
      );

      When(
        'getValue is called with "unknown_key"',
        async (_ctx: TestContext) => {
          result = await repository.getValue("unknown_key");
        },
      );

      Then("the result is undefined", async (_ctx: TestContext) => {
        expect(result).toBeUndefined();
      });
    });

    // @settings-specs-and-bdd @FR1
    f.Scenario(
      "Get all settings from populated store",
      ({ Given, When, Then }) => {
        let result: Setting[];

        Given(
          "three settings exist in the repository",
          async (_ctx: TestContext) => {
            await db.settings.bulkAdd([
              buildSetting({
                key: "accent_color",
                value: "blue",
                needsSync: false,
              }),
              buildSetting({
                key: "default_box",
                value: "today",
                needsSync: false,
              }),
              buildSetting({
                key: "language",
                value: "en",
                needsSync: false,
              }),
            ]);
          },
        );

        When("getAll is called", async (_ctx: TestContext) => {
          result = await repository.getAll();
        });

        Then(
          "an array of three setting records is returned",
          async (_ctx: TestContext) => {
            expect(result).toHaveLength(3);
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR1
    f.Scenario("Get all settings from empty store", ({ Given, When, Then }) => {
      let result: Setting[];

      Given(
        "no settings exist in the repository",
        async (_ctx: TestContext) => {
          // DB is already cleared in BeforeEachScenario
        },
      );

      When("getAll is called", async (_ctx: TestContext) => {
        result = await repository.getAll();
      });

      Then("an empty array is returned", async (_ctx: TestContext) => {
        expect(result).toEqual([]);
      });
    });
  },
);
