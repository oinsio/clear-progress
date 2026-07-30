// implements FR5 of configurable-sync-timing
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { WireSetting } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";
import type { Setting } from "@/types/entities";

const feature = await loadFeature("../sync_timing_settings_sync.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      repository = new SettingsRepository();
    });

    // @configurable-sync-timing @FR5
    f.Scenario(
      "Get sync_interval and auto_sync_delay when needing sync",
      ({ Given, When, Then }) => {
        let result: Setting[];

        Given(
          '"sync_interval" and "auto_sync_delay" have syncStatus "pending" and "accent_color" has syncStatus "synced"',
          async (_ctx: TestContext) => {
            await db.settings.bulkAdd([
              buildSetting({
                key: "sync_interval",
                value: "10",
                syncStatus: "pending" as const,
              }),
              buildSetting({
                key: "auto_sync_delay",
                value: "60",
                syncStatus: "pending" as const,
              }),
              buildSetting({
                key: "accent_color",
                value: "green",
                syncStatus: "synced" as const,
              }),
            ]);
          },
        );

        When("getNeedingSync is called", async (_ctx: TestContext) => {
          result = await repository.getNeedingSync();
        });

        Then(
          'only "sync_interval" and "auto_sync_delay" are returned',
          async (_ctx: TestContext) => {
            expect(result).toHaveLength(2);
            expect(result.map((setting) => setting.key).sort()).toEqual([
              "auto_sync_delay",
              "sync_interval",
            ]);
          },
        );
      },
    );

    // @configurable-sync-timing @FR5
    f.Scenario(
      "Clear sync flag for sync_interval after push",
      ({ Given, When, Then }) => {
        Given(
          'a local setting with key "sync_interval" and syncStatus "pending"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "sync_interval",
                value: "10",
                syncStatus: "pending" as const,
              }),
            );
          },
        );

        When(
          'clearNeedsSyncByKey is called with keys ["sync_interval"]',
          async (_ctx: TestContext) => {
            await repository.clearNeedsSyncByKey(["sync_interval"]);
          },
        );

        Then(
          '"sync_interval" has syncStatus "synced"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("sync_interval");
            expect(setting?.syncStatus).toBe("synced");
          },
        );
      },
    );

    // @configurable-sync-timing @FR5
    f.Scenario(
      "Accept newer pulled sync_interval value",
      ({ Given, When, Then }) => {
        Given(
          'a local setting with key "sync_interval", value "5", updated_at "2025-01-01T00:00:00.000Z", and syncStatus "synced"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "sync_interval",
                value: "5",
                updated_at: "2025-01-01T00:00:00.000Z",
                syncStatus: "synced" as const,
              }),
            );
          },
        );

        When(
          'bulkUpsert receives "sync_interval" with value "30" and updated_at "2025-01-02T00:00:00.000Z"',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "sync_interval",
                value: "30",
                updated_at: "2025-01-02T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          'the local setting "sync_interval" is updated to value "30"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("sync_interval");
            expect(setting?.value).toBe("30");
          },
        );
      },
    );

    // @configurable-sync-timing @FR5
    f.Scenario(
      "Local-dirty auto_sync_delay wins over pulled value",
      ({ Given, When, Then }) => {
        Given(
          'a local setting with key "auto_sync_delay", value "10", and syncStatus "pending"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: "auto_sync_delay",
                value: "10",
                syncStatus: "pending" as const,
              }),
            );
          },
        );

        When(
          'bulkUpsert receives "auto_sync_delay" with value "60"',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "auto_sync_delay",
                value: "60",
                updated_at: "2025-12-31T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          'the local setting "auto_sync_delay" remains with value "10"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("auto_sync_delay");
            expect(setting?.value).toBe("10");
          },
        );
      },
    );

    // @configurable-sync-timing @FR5
    f.Scenario(
      "Round-trip an empty (disabled) sync_interval value through bulkUpsert",
      ({ Given, When, Then, And }) => {
        Given(
          'no local setting with key "sync_interval" exists',
          async (_ctx: TestContext) => {
            // DB is already cleared in BeforeEachScenario
          },
        );

        When(
          'bulkUpsert receives "sync_interval" with value ""',
          async (_ctx: TestContext) => {
            const incoming: WireSetting[] = [
              {
                key: "sync_interval",
                value: "",
                updated_at: "2025-01-01T00:00:00.000Z",
              },
            ];
            await repository.bulkUpsert(incoming);
          },
        );

        Then(
          'a new setting is created with key "sync_interval" and value ""',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("sync_interval");
            expect(setting).toBeDefined();
            expect(setting?.key).toBe("sync_interval");
            expect(setting?.value).toBe("");
          },
        );

        And(
          'the setting "sync_interval" has syncStatus "synced"',
          async (_ctx: TestContext) => {
            const setting = await db.settings.get("sync_interval");
            expect(setting?.syncStatus).toBe("synced");
          },
        );
      },
    );
  },
);
