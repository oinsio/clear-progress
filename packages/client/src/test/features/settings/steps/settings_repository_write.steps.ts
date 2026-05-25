// implements FR1, FR5 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";
import { Temporal } from "@/lib/temporal";
import { ClientSettingSchema } from "@/schemas/entities";
import type { Setting } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

const feature = await loadFeature("../settings_repository_write.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      repository = new SettingsRepository();
    });

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario("Create new setting", ({ Given, When, Then, And }) => {
      let storedSetting: Setting | undefined;

      Given(
        'no setting with key "accent_color" exists',
        async (_ctx: TestContext) => {
          // DB is already cleared in BeforeEachScenario
        },
      );

      When(
        'set is called with key "accent_color" and value "blue"',
        async (_ctx: TestContext) => {
          await repository.set("accent_color", "blue");
        },
      );

      Then(
        'a new setting is created with key "accent_color" and value "blue"',
        async (_ctx: TestContext) => {
          storedSetting = await db.settings.get("accent_color");
          expect(storedSetting).toBeDefined();
          expect(storedSetting?.key).toBe("accent_color");
          expect(storedSetting?.value).toBe("blue");
        },
      );

      And("the setting has needsSync true", async (_ctx: TestContext) => {
        expect(storedSetting?.needsSync).toBe(true);
      });

      And(
        "the setting has a current updated_at timestamp",
        async (_ctx: TestContext) => {
          const now = toISOTimestamp(Temporal.Now.instant());
          expect(storedSetting?.updated_at).toBeDefined();
          expect((storedSetting?.updated_at as string) <= now).toBe(true);
        },
      );
    });

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario(
      "Update existing setting with different value",
      ({ Given, When, Then, And }) => {
        let originalUpdatedAt: string;
        let storedSetting: Setting | undefined;

        Given(
          'a setting with key "accent_color" and value "green" exists',
          async (_ctx: TestContext) => {
            const setting = buildSetting({
              key: "accent_color",
              value: "green",
              needsSync: false,
            });
            originalUpdatedAt = setting.updated_at;
            await db.settings.add(setting);
          },
        );

        When(
          'set is called with key "accent_color" and value "blue"',
          async (_ctx: TestContext) => {
            await repository.set("accent_color", "blue");
          },
        );

        Then(
          'the setting value is updated to "blue"',
          async (_ctx: TestContext) => {
            storedSetting = await db.settings.get("accent_color");
            expect(storedSetting).toBeDefined();
            expect(storedSetting?.value).toBe("blue");
          },
        );

        And("the setting has needsSync true", async (_ctx: TestContext) => {
          expect(storedSetting?.needsSync).toBe(true);
        });

        And(
          "the setting has a refreshed updated_at timestamp",
          async (_ctx: TestContext) => {
            expect(storedSetting?.updated_at).not.toBe(originalUpdatedAt);
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario(
      "Skip write when value unchanged",
      ({ Given, When, Then, And }) => {
        let originalUpdatedAt: string;

        Given(
          'a setting with key "accent_color" and value "blue" exists',
          async (_ctx: TestContext) => {
            const setting = buildSetting({
              key: "accent_color",
              value: "blue",
              needsSync: false,
            });
            originalUpdatedAt = setting.updated_at;
            await db.settings.add(setting);
          },
        );

        When(
          'set is called with key "accent_color" and value "blue"',
          async (_ctx: TestContext) => {
            await repository.set("accent_color", "blue");
          },
        );

        Then("no write occurs", async (_ctx: TestContext) => {
          const storedSetting = await db.settings.get("accent_color");
          expect(storedSetting?.updated_at).toBe(originalUpdatedAt);
        });

        And(
          "the original updated_at is preserved",
          async (_ctx: TestContext) => {
            const storedSetting = await db.settings.get("accent_color");
            expect(storedSetting?.updated_at).toBe(originalUpdatedAt);
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario("Reject invalid setting data", ({ When, Then }) => {
      let thrownError: Error | undefined;

      When("set is called with invalid data", async (_ctx: TestContext) => {
        vi.spyOn(ClientSettingSchema, "safeParse").mockReturnValueOnce({
          success: false,
          error: { message: "test error" },
        } as never);

        try {
          await repository.set("accent_color", "blue");
        } catch (error) {
          thrownError = error as Error;
        }
      });

      Then(
        'an error containing "Invalid setting data" is thrown',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError?.message).toContain("Invalid setting data");
          vi.restoreAllMocks();
        },
      );
    });
  },
);
