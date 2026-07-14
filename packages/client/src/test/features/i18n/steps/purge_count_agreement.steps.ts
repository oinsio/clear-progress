// implements FR9 of rework-house-locale
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import i18n from "i18next";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../purge_count_agreement.feature");

type PurgeCountRow = { key: string; count: string; text: string };
type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let currentLocale: string;

  function definePurgeCountScenario(
    scenarioName: string,
    localeStepText: string,
    localeCode: string,
  ) {
    f.Scenario(scenarioName, ({ Given, Then }) => {
      Given(localeStepText, (_ctx: TestContext) => {
        currentLocale = localeCode;
      });

      Then("purge counts render as:", (_ctx: TestContext, table) => {
        const rows = (Array.isArray(table) ? table : []) as PurgeCountRow[];
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
          const renderedCount = i18n.t(row.key, {
            count: Number(row.count),
            lng: currentLocale,
          });
          expect({
            key: row.key,
            count: row.count,
            text: renderedCount,
          }).toEqual({ key: row.key, count: row.count, text: row.text });
        }
      });
    });
  }

  // @rework-house-locale @FR9
  definePurgeCountScenario(
    "Russian purge counts agree with numbers",
    'locale is "ru"',
    "ru",
  );

  // @rework-house-locale @FR9
  definePurgeCountScenario(
    "House locale purge counts agree with numbers",
    'locale is "house"',
    "house",
  );

  // @add-startrek-locale @FR6
  definePurgeCountScenario(
    "Star Trek locale purge counts agree with numbers",
    'locale is "startrek"',
    "startrek",
  );

  // @add-project-locales @FR4
  definePurgeCountScenario(
    "Russian project dialect purge counts agree with numbers",
    'locale is "ru-project"',
    "ru-project",
  );

  // @rework-house-locale @FR9
  definePurgeCountScenario(
    "English purge counts agree with numbers",
    'locale is "en"',
    "en",
  );

  // @rework-house-locale @FR10
  definePurgeCountScenario(
    "House locale inherits Russian plural rules for fallback keys",
    'locale is "house"',
    "house",
  );

  // @rework-house-locale @FR9
  f.Scenario(
    "Composed purge message interpolates the items list",
    ({ Given, Then }) => {
      Given('locale is "house"', (_ctx: TestContext) => {
        currentLocale = "house";
      });

      Then(
        'the purge confirmation message for items "1 озарение" is "Будет кремировано: 1 озарение"',
        (_ctx: TestContext) => {
          const composedMessage = i18n.t("deleted.purgeConfirmCount", {
            items: "1 озарение",
            lng: currentLocale,
          });
          expect(composedMessage).toBe("Будет кремировано: 1 озарение");
        },
      );
    },
  );
});
