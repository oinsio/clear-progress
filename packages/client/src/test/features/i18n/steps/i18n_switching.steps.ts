// implements FR3, FR4 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { expect, type TestContext, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

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
      emoji: "🇺🇸",
    },
    {
      code: "ru",
      name: "Russian",
      nativeName: "Русский",
      baseLanguage: "ru",
      emoji: "🇷🇺",
    },
    {
      code: "house",
      name: "Dr. House",
      nativeName: "Доктор Хаус",
      baseLanguage: "ru",
      emoji: "🏥",
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

import { createElement } from "react";
import {
  LanguageProvider,
  useLanguage,
} from "@/app/providers/LanguageProvider";
import i18n from "@/i18n";

function TestConsumer() {
  const { language, setLanguage } = useLanguage();
  return createElement(
    "div",
    null,
    createElement("span", { "data-testid": "current-lang" }, language),
    createElement(
      "button",
      { "data-testid": "switch-en", onClick: () => setLanguage("en") },
      "Switch to en",
    ),
  );
}

function renderWithLanguageProvider() {
  cleanup();
  render(createElement(LanguageProvider, null, createElement(TestConsumer)));
}

const feature = await loadFeature("../i18n_switching.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  f.BeforeEachScenario(() => {
    cleanup();
    localStorage.clear();
    vi.mocked(i18n.changeLanguage).mockClear();
  });

  // @add-i18n-specs @FR3
  f.Scenario("Switch language updates i18next", ({ Given, When, Then }) => {
    Given('current language is "ru"', (_ctx: TestContext) => {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, "ru");
      renderWithLanguageProvider();
    });

    When('user switches language to "en"', async (_ctx: TestContext) => {
      const user = userEvent.setup();
      await act(async () => {
        await user.click(screen.getByTestId("switch-en"));
      });
    });

    Then('i18n.changeLanguage is called with "en"', (_ctx: TestContext) => {
      expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
    });
  });

  // @add-i18n-specs @FR4
  f.Scenario(
    "Switch language persists to localStorage",
    ({ Given, When, Then }) => {
      Given('current language is "ru"', (_ctx: TestContext) => {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, "ru");
        renderWithLanguageProvider();
      });

      When('user switches language to "en"', async (_ctx: TestContext) => {
        const user = userEvent.setup();
        await act(async () => {
          await user.click(screen.getByTestId("switch-en"));
        });
      });

      Then(
        'localStorage contains "en" under language key',
        (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe("en");
        },
      );
    },
  );
});
