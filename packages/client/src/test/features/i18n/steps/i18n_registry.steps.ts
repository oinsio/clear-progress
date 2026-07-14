// implements FR7, FR8, FR9 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { getLocaleByCode, locales } from "@/services/localeRegistry";

const feature = await loadFeature("../i18n_registry.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  // @add-i18n-specs @FR7
  f.Scenario(
    "Valid locale files are registered with correct metadata",
    ({ When, Then, And }) => {
      When("locale registry is loaded", (_ctx: TestContext) => {
        // Registry is loaded at import time — nothing to do
      });

      Then(
        'locale "en" has name "English" and emoji "🇺🇸"',
        (_ctx: TestContext) => {
          const locale = getLocaleByCode("en");
          expect(locale).toBeDefined();
          expect(locale?.name).toBe("English");
          expect(locale?.emoji).toBe("🇺🇸");
        },
      );

      And(
        'locale "ru" has name "Russian" and emoji "🇷🇺"',
        (_ctx: TestContext) => {
          const locale = getLocaleByCode("ru");
          expect(locale).toBeDefined();
          expect(locale?.name).toBe("Russian");
          expect(locale?.emoji).toBe("🇷🇺");
        },
      );

      And(
        'locale "house" has name "Dr. House" and emoji "🏥"',
        (_ctx: TestContext) => {
          const locale = getLocaleByCode("house");
          expect(locale).toBeDefined();
          expect(locale?.name).toBe("Dr. House");
          expect(locale?.emoji).toBe("🏥");
        },
      );

      And(
        'locale "startrek" has name "Star Trek" and emoji "🖖"',
        (_ctx: TestContext) => {
          const locale = getLocaleByCode("startrek");
          expect(locale).toBeDefined();
          expect(locale?.name).toBe("Star Trek");
          expect(locale?.emoji).toBe("🖖");
        },
      );
    },
  );

  // @add-i18n-specs @FR7
  f.Scenario("Locales sorted by English name", ({ When, Then }) => {
    When("locale registry is loaded", (_ctx: TestContext) => {
      // Already loaded
    });

    Then(
      'locales are ordered as "Dr. House", "English", "Russian", "Star Trek"',
      (_ctx: TestContext) => {
        const localeNames = locales.map((locale) => locale.name);
        expect(localeNames).toEqual([
          "Dr. House",
          "English",
          "Russian",
          "Star Trek",
        ]);
      },
    );
  });

  // @add-i18n-specs @FR8 @FR9
  f.Scenario("Only valid locales are registered", ({ When, Then, And }) => {
    When("locale registry is loaded", (_ctx: TestContext) => {
      // Already loaded
    });

    Then("exactly 4 locales are registered", (_ctx: TestContext) => {
      expect(locales).toHaveLength(4);
    });

    And("every locale has complete metadata", (_ctx: TestContext) => {
      for (const locale of locales) {
        expect(locale.code).toBeTruthy();
        expect(locale.name).toBeTruthy();
        expect(locale.nativeName).toBeTruthy();
        expect(locale.baseLanguage).toBeTruthy();
        expect(locale.emoji).toBeTruthy();
      }
    });
  });
});
