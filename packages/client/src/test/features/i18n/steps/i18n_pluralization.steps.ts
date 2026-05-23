// implements FR12 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import i18n from "i18next";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../i18n_pluralization.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let currentLocale: string;
  let translationResult: string;

  // @add-i18n-specs @FR12
  f.Scenario("Russian pluralization one/few/many", ({ Given, When, Then }) => {
    Given('locale is "ru"', (_ctx: TestContext) => {
      currentLocale = "ru";
    });

    When(
      'translating "repeat.intervalDays" with count 1',
      (_ctx: TestContext) => {
        translationResult = i18n.t("repeat.intervalDays", {
          count: 1,
          lng: currentLocale,
        });
      },
    );

    Then('translation contains "1 день"', (_ctx: TestContext) => {
      expect(translationResult).toContain("1 день");
    });

    When(
      'translating "repeat.intervalDays" with count 3',
      (_ctx: TestContext) => {
        translationResult = i18n.t("repeat.intervalDays", {
          count: 3,
          lng: currentLocale,
        });
      },
    );

    Then('translation contains "3 дня"', (_ctx: TestContext) => {
      expect(translationResult).toContain("3 дня");
    });

    When(
      'translating "repeat.intervalDays" with count 5',
      (_ctx: TestContext) => {
        translationResult = i18n.t("repeat.intervalDays", {
          count: 5,
          lng: currentLocale,
        });
      },
    );

    Then('translation contains "5 дней"', (_ctx: TestContext) => {
      expect(translationResult).toContain("5 дней");
    });
  });

  // @add-i18n-specs @FR12
  f.Scenario("English pluralization one/other", ({ Given, When, Then }) => {
    Given('locale is "en"', (_ctx: TestContext) => {
      currentLocale = "en";
    });

    When(
      'translating "repeat.intervalDays" with count 1',
      (_ctx: TestContext) => {
        translationResult = i18n.t("repeat.intervalDays", {
          count: 1,
          lng: currentLocale,
        });
      },
    );

    Then('translation contains "1 day"', (_ctx: TestContext) => {
      expect(translationResult).toContain("1 day");
    });

    When(
      'translating "repeat.intervalDays" with count 5',
      (_ctx: TestContext) => {
        translationResult = i18n.t("repeat.intervalDays", {
          count: 5,
          lng: currentLocale,
        });
      },
    );

    Then('translation contains "5 days"', (_ctx: TestContext) => {
      expect(translationResult).toContain("5 days");
    });
  });
});
