// implements FR10 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { DEFAULT_LANGUAGE } from "@/constants";
import { getLocaleByCode } from "@/services/localeRegistry";

const feature = await loadFeature("../i18n_fallback.feature");

// Replicate the fallback function from i18n.ts to test the logic
// This is the same function used in i18n.init({ fallbackLng })
function resolveFallbackChain(code: string): string[] {
  const locale = getLocaleByCode(code);
  if (locale?.baseLanguage && locale.baseLanguage !== code) {
    return [locale.baseLanguage, DEFAULT_LANGUAGE];
  }
  return [DEFAULT_LANGUAGE];
}

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let fallbackChain: string[];

  // @add-i18n-specs @FR10
  f.Scenario(
    "Dialect locale falls back to base language then default",
    ({ Given, When, Then }) => {
      Given('locale "house" has baseLanguage "ru"', (_ctx: TestContext) => {
        const locale = getLocaleByCode("house");
        expect(locale?.baseLanguage).toBe("ru");
      });

      When('resolving fallback chain for "house"', (_ctx: TestContext) => {
        fallbackChain = resolveFallbackChain("house");
      });

      Then('fallback chain is "ru" then "en"', (_ctx: TestContext) => {
        expect(fallbackChain).toEqual(["ru", DEFAULT_LANGUAGE]);
      });
    },
  );

  // @add-i18n-specs @FR10
  f.Scenario(
    "Base language falls back to default only",
    ({ Given, When, Then }) => {
      Given('locale "en" has baseLanguage "en"', (_ctx: TestContext) => {
        const locale = getLocaleByCode("en");
        expect(locale?.baseLanguage).toBe("en");
      });

      When('resolving fallback chain for "en"', (_ctx: TestContext) => {
        fallbackChain = resolveFallbackChain("en");
      });

      Then('fallback chain is "en" only', (_ctx: TestContext) => {
        expect(fallbackChain).toEqual([DEFAULT_LANGUAGE]);
      });
    },
  );
});
