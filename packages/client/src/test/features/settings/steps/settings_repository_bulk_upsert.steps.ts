// implements FR3, FR6 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { WireSetting } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";

const feature = await loadFeature("../settings_repository_bulk_upsert.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      repository = new SettingsRepository();
    });

    // @settings-specs-and-bdd @FR3 @FR6
    f.Scenario("Accept newer server setting", ({ Given, When, Then, And }) => {
      Given(
        'a local setting with key "accent_color", value "green", updated_at "2025-01-01T00:00:00.000Z", and syncStatus "synced"',
        async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({
              key: "accent_color",
              value: "green",
              updated_at: "2025-01-01T00:00:00.000Z",
              syncStatus: "synced" as const,
            }),
          );
        },
      );

      When(
        'bulkUpsert receives "accent_color" with value "blue" and updated_at "2025-01-02T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          const incoming: WireSetting[] = [
            {
              key: "accent_color",
              value: "blue",
              updated_at: "2025-01-02T00:00:00.000Z",
            },
          ];
          await repository.bulkUpsert(incoming);
        },
      );

      Then(
        'the local setting is updated to value "blue"',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get("accent_color");
          expect(setting?.value).toBe("blue");
        },
      );

      And('the setting has syncStatus "synced"', async (_ctx: TestContext) => {
        const setting = await db.settings.get("accent_color");
        expect(setting?.syncStatus).toBe("synced");
      });
    });

    // @settings-specs-and-bdd @FR3 @FR6
    f.Scenario(
      "Skip server setting when local is dirty",
      ({ Given, When, Then, And }) => {
        Given(
          'a local setting with key "accent_color", value "coral", and syncStatus "pending"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "accent_color",
                value: "coral",
                syncStatus: "pending" as const,
              }),
            );
          },
        );

        When(
          'bulkUpsert receives "accent_color" with value "blue"',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "accent_color",
                value: "blue",
                updated_at: "2025-12-31T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          'the local setting remains with value "coral"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("accent_color");
            expect(setting?.value).toBe("coral");
          },
        );

        And(
          'the setting has syncStatus "pending"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("accent_color");
            expect(setting?.syncStatus).toBe("pending");
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR3 @FR6
    f.Scenario(
      "Skip server setting when not newer",
      ({ Given, When, Then }) => {
        Given(
          'a local setting with key "accent_color" and updated_at "2025-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "accent_color",
                value: "green",
                updated_at: "2025-01-02T00:00:00.000Z",
                syncStatus: "synced" as const,
              }),
            );
          },
        );

        When(
          'bulkUpsert receives "accent_color" with updated_at "2025-01-01T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "accent_color",
                value: "red",
                updated_at: "2025-01-01T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          "the local setting remains unchanged",
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("accent_color");
            expect(setting?.value).toBe("green");
            expect(setting?.updated_at).toBe("2025-01-02T00:00:00.000Z");
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR3 @FR6
    f.Scenario(
      "Insert new setting from server",
      ({ Given, When, Then, And }) => {
        Given(
          'no local setting with key "default_box" exists',
          async (_ctx: TestContext) => {
            // DB is already cleared in BeforeEachScenario
          },
        );

        When(
          'bulkUpsert receives "default_box" with value "inbox"',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "default_box",
                value: "inbox",
                updated_at: "2025-01-01T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          'a new setting is created with key "default_box" and value "inbox"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("default_box");
            expect(setting).toBeDefined();
            expect(setting?.key).toBe("default_box");
            expect(setting?.value).toBe("inbox");
          },
        );

        And(
          'the setting has syncStatus "synced"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("default_box");
            expect(setting?.syncStatus).toBe("synced");
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR3 @FR6
    f.Scenario("Skip empty bulk upsert", ({ When, Then }) => {
      When(
        "bulkUpsert is called with an empty array",
        async (_ctx: TestContext) => {
          await repository.bulkUpsert([]);
        },
      );

      Then(
        "no database operations are performed",
        async (_ctx: TestContext) => {
          const count = await db.settings.count();
          expect(count).toBe(0);
        },
      );
    });
  },
);
