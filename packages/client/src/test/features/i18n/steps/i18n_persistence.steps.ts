// implements FR5, FR6 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, screen } from "@testing-library/react/pure";
import { expect, type TestContext, vi } from "vitest";
import {
  createI18nTestContext,
  mockNavigatorLanguages,
  renderWithLanguageProvider,
  throwingLocalStorage,
} from "./i18n_steps.helpers";

// noinspection DuplicatedCode — vi.mock hoisting prevents extracting to shared helper
vi.mock("@/i18n", () => ({
  default: {
    language: "en",
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/localeRegistry", () => {
  const LOCALES = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      baseLanguage: "en",
      emoji: "\u{1F1FA}\u{1F1F8}",
    },
    {
      code: "ru",
      name: "Russian",
      nativeName: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
      baseLanguage: "ru",
      emoji: "\u{1F1F7}\u{1F1FA}",
    },
    {
      code: "house",
      name: "Dr. House",
      nativeName:
        "\u0414\u043E\u043A\u0442\u043E\u0440 \u0425\u0430\u0443\u0441",
      baseLanguage: "ru",
      emoji: "\u{1F3E5}",
    },
  ];
  return {
    locales: LOCALES,
    localeResources: {},
    isValidLocaleCode: (code: string) =>
      LOCALES.some((locale) => locale.code === code),
    getBaseLanguageCodes: () =>
      Array.from(new Set(LOCALES.map((locale) => locale.baseLanguage))),
    getLocaleByCode: (code: string) =>
      LOCALES.find((locale) => locale.code === code),
  };
});

const feature = await loadFeature("../i18n_persistence.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  const testContext = createI18nTestContext();

  f.BeforeEachScenario(() => {
    cleanup();
    testContext.reset();
  });

  // @add-i18n-specs @FR5
  f.Scenario(
    "Valid language restored from localStorage",
    ({ Given, When, Then }) => {
      Given(
        'localStorage contains "en" under language key',
        (_ctx: TestContext) => {
          testContext.setStoredLanguage("en");
        },
      );

      When("system initializes language", (_ctx: TestContext) => {
        renderWithLanguageProvider();
      });

      Then('selected language is "en"', (_ctx: TestContext) => {
        expect(screen.getByTestId("current-lang").textContent).toBe("en");
      });
    },
  );

  // @add-i18n-specs @FR6
  f.Scenario(
    "Invalid language in localStorage triggers fallback",
    ({ Given, And, When, Then }) => {
      Given(
        'localStorage contains "xx-invalid" under language key',
        (_ctx: TestContext) => {
          testContext.setStoredLanguage("xx-invalid");
        },
      );

      And('browser language is "en"', (_ctx: TestContext) => {
        mockNavigatorLanguages(["en"]);
      });

      When("system initializes language", (_ctx: TestContext) => {
        renderWithLanguageProvider();
      });

      Then('selected language is "en"', (_ctx: TestContext) => {
        expect(screen.getByTestId("current-lang").textContent).toBe("en");
      });
    },
  );

  // @add-i18n-specs @FR6
  f.Scenario(
    "localStorage unavailable triggers browser detection",
    ({ Given, And, When, Then }) => {
      Given("localStorage throws on access", (_ctx: TestContext) => {
        vi.stubGlobal("localStorage", throwingLocalStorage);
      });

      And('browser language is "en"', (_ctx: TestContext) => {
        mockNavigatorLanguages(["en"]);
      });

      When("system initializes language", (_ctx: TestContext) => {
        renderWithLanguageProvider();
      });

      Then('selected language is "en"', (_ctx: TestContext) => {
        expect(screen.getByTestId("current-lang").textContent).toBe("en");
      });
    },
  );
});
