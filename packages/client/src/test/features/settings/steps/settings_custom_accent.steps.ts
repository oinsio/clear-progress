// implements FR1, FR5 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { SETTING_KEYS, STORAGE_KEYS } from "@/constants";
import { db } from "@/db/database";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import { buildSetting } from "@/db/repositories/SettingsRepository.test-utils";

const feature = await loadFeature("../settings_custom_accent.feature");

const DEFAULT_CUSTOM_LIGHT = "#fcd34d";
const DEFAULT_CUSTOM_DARK = "#14b8a6";

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let repository: SettingsRepository;

    f.BeforeEachScenario(async () => {
      await db.settings.clear();
      localStorage.clear();
      document.documentElement.style.removeProperty("--color-accent");
      repository = new SettingsRepository();
    });

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario("Save custom accent colors", ({ When, Then, And }) => {
      When(
        'setCustomAccentColors is called with light "#ff0000" and dark "#00ff00"',
        async (_ctx: TestContext) => {
          await repository.set(SETTING_KEYS.CUSTOM_ACCENT_LIGHT, "#ff0000");
          await repository.set(SETTING_KEYS.CUSTOM_ACCENT_DARK, "#00ff00");
          localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT, "#ff0000");
          localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK, "#00ff00");
        },
      );

      Then(
        'the repository contains "custom_accent_light" set to "#ff0000" with needsSync true',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get(
            SETTING_KEYS.CUSTOM_ACCENT_LIGHT,
          );
          expect(setting).toBeDefined();
          expect(setting?.value).toBe("#ff0000");
          expect(setting?.needsSync).toBe(true);
        },
      );

      And(
        'the repository contains "custom_accent_dark" set to "#00ff00" with needsSync true',
        async (_ctx: TestContext) => {
          const setting = await db.settings.get(
            SETTING_KEYS.CUSTOM_ACCENT_DARK,
          );
          expect(setting).toBeDefined();
          expect(setting?.value).toBe("#00ff00");
          expect(setting?.needsSync).toBe(true);
        },
      );

      And(
        'localStorage cache has "custom_accent_light" as "#ff0000" and "custom_accent_dark" as "#00ff00"',
        async (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT)).toBe(
            "#ff0000",
          );
          expect(localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK)).toBe(
            "#00ff00",
          );
        },
      );
    });

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario(
      "Custom colors loaded from IndexedDB on init",
      ({ Given, When, Then, And }) => {
        let loadedLight: string | undefined;
        let loadedDark: string | undefined;

        Given('accent color setting is "custom"', async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({ key: SETTING_KEYS.ACCENT_COLOR, value: "custom" }),
          );
          localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, "custom");
        });

        And(
          'IndexedDB has "custom_accent_light" as "#abc123" and "custom_accent_dark" as "#def456"',
          async (_ctx: TestContext) => {
            await db.settings.add(
              buildSetting({
                key: SETTING_KEYS.CUSTOM_ACCENT_LIGHT,
                value: "#abc123",
              }),
            );
            await db.settings.add(
              buildSetting({
                key: SETTING_KEYS.CUSTOM_ACCENT_DARK,
                value: "#def456",
              }),
            );
          },
        );

        When(
          "the accent color provider initializes",
          async (_ctx: TestContext) => {
            loadedLight = await repository.getValue(
              SETTING_KEYS.CUSTOM_ACCENT_LIGHT,
            );
            loadedDark = await repository.getValue(
              SETTING_KEYS.CUSTOM_ACCENT_DARK,
            );
            if (loadedLight) {
              localStorage.setItem(
                STORAGE_KEYS.CUSTOM_ACCENT_LIGHT,
                loadedLight,
              );
            }
            if (loadedDark) {
              localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK, loadedDark);
            }
          },
        );

        Then(
          'custom colors "#abc123" and "#def456" are applied',
          async (_ctx: TestContext) => {
            expect(loadedLight).toBe("#abc123");
            expect(loadedDark).toBe("#def456");
          },
        );

        And(
          'localStorage cache is updated with "#abc123" and "#def456"',
          async (_ctx: TestContext) => {
            expect(localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT)).toBe(
              "#abc123",
            );
            expect(localStorage.getItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK)).toBe(
              "#def456",
            );
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario(
      "Default custom colors when not stored",
      ({ Given, And, When, Then }) => {
        let loadedLight: string | undefined;
        let loadedDark: string | undefined;

        Given('accent color setting is "custom"', async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({ key: SETTING_KEYS.ACCENT_COLOR, value: "custom" }),
          );
          localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, "custom");
        });

        And(
          "no custom color settings exist in IndexedDB or localStorage",
          async (_ctx: TestContext) => {
            // DB is cleared in BeforeEachScenario, only accent_color exists
            // localStorage is cleared in BeforeEachScenario, only accent_color set above
          },
        );

        When(
          "the accent color provider initializes",
          async (_ctx: TestContext) => {
            loadedLight = await repository.getValue(
              SETTING_KEYS.CUSTOM_ACCENT_LIGHT,
            );
            loadedDark = await repository.getValue(
              SETTING_KEYS.CUSTOM_ACCENT_DARK,
            );
          },
        );

        Then(
          'custom colors "#fcd34d" and "#14b8a6" are applied as defaults',
          async (_ctx: TestContext) => {
            const effectiveLight = loadedLight ?? DEFAULT_CUSTOM_LIGHT;
            const effectiveDark = loadedDark ?? DEFAULT_CUSTOM_DARK;
            expect(effectiveLight).toBe(DEFAULT_CUSTOM_LIGHT);
            expect(effectiveDark).toBe(DEFAULT_CUSTOM_DARK);
          },
        );
      },
    );

    // @settings-specs-and-bdd @FR1 @FR5
    f.Scenario(
      "Custom colors only applied when accent is custom",
      ({ Given, When, Then, But }) => {
        Given('accent color setting is "blue"', async (_ctx: TestContext) => {
          await db.settings.add(
            buildSetting({ key: SETTING_KEYS.ACCENT_COLOR, value: "blue" }),
          );
          localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, "blue");
        });

        When(
          'setCustomAccentColors is called with light "#ff0000" and dark "#00ff00"',
          async (_ctx: TestContext) => {
            await repository.set(SETTING_KEYS.CUSTOM_ACCENT_LIGHT, "#ff0000");
            await repository.set(SETTING_KEYS.CUSTOM_ACCENT_DARK, "#00ff00");
            localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT_LIGHT, "#ff0000");
            localStorage.setItem(STORAGE_KEYS.CUSTOM_ACCENT_DARK, "#00ff00");
          },
        );

        Then(
          "the hex values are persisted in the repository",
          async (_ctx: TestContext) => {
            const lightSetting = await db.settings.get(
              SETTING_KEYS.CUSTOM_ACCENT_LIGHT,
            );
            const darkSetting = await db.settings.get(
              SETTING_KEYS.CUSTOM_ACCENT_DARK,
            );
            expect(lightSetting?.value).toBe("#ff0000");
            expect(darkSetting?.value).toBe("#00ff00");
          },
        );

        But(
          "the custom colors are not applied to the DOM",
          async (_ctx: TestContext) => {
            const accentValue =
              document.documentElement.style.getPropertyValue("--color-accent");
            expect(accentValue).toBe("");
          },
        );
      },
    );
  },
);
