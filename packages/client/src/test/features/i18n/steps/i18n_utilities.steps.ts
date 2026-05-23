// implements FR7 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import type { LocaleMeta } from "@/services/localeRegistry";
import {
  getBaseLanguageCodes,
  getLocaleByCode,
  isValidLocaleCode,
} from "@/services/localeRegistry";

const feature = await loadFeature("../i18n_utilities.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let localeResult: LocaleMeta | undefined;
  let baseLanguageCodes: string[];

  // @add-i18n-specs @FR7
  f.Scenario("getLocaleByCode with valid code", ({ When, Then }) => {
    When('calling getLocaleByCode with "en"', (_ctx: TestContext) => {
      localeResult = getLocaleByCode("en");
    });

    Then('returned locale has name "English"', (_ctx: TestContext) => {
      expect(localeResult).toBeDefined();
      expect(localeResult?.name).toBe("English");
    });
  });

  // @add-i18n-specs @FR7
  f.Scenario("getLocaleByCode with invalid code", ({ When, Then }) => {
    When('calling getLocaleByCode with "xx"', (_ctx: TestContext) => {
      localeResult = getLocaleByCode("xx");
    });

    Then("returned locale is undefined", (_ctx: TestContext) => {
      expect(localeResult).toBeUndefined();
    });
  });

  // @add-i18n-specs @FR7
  f.Scenario("isValidLocaleCode returns correct results", ({ Then, And }) => {
    Then('isValidLocaleCode "en" is true', (_ctx: TestContext) => {
      expect(isValidLocaleCode("en")).toBe(true);
    });

    And('isValidLocaleCode "xx" is false', (_ctx: TestContext) => {
      expect(isValidLocaleCode("xx")).toBe(false);
    });
  });

  // @add-i18n-specs @FR7
  f.Scenario(
    "getBaseLanguageCodes returns unique codes",
    ({ When, Then, And }) => {
      When("calling getBaseLanguageCodes", (_ctx: TestContext) => {
        baseLanguageCodes = getBaseLanguageCodes();
      });

      Then('returned codes contain "en" and "ru"', (_ctx: TestContext) => {
        expect(baseLanguageCodes).toContain("en");
        expect(baseLanguageCodes).toContain("ru");
      });

      And("returned codes do not contain duplicates", (_ctx: TestContext) => {
        const uniqueCodes = new Set(baseLanguageCodes);
        expect(uniqueCodes.size).toBe(baseLanguageCodes.length);
      });
    },
  );
});
