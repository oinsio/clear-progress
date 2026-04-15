import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider, useLanguage } from "./LanguageProvider";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";

vi.mock("@/i18n", () => ({
  default: {
    language: "ru",
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/services/localeRegistry", () => {
  const mockLocales = [
    { code: "en", name: "English", nativeName: "English", baseLanguage: "en", emoji: "🇬🇧" },
    { code: "ru", name: "Russian", nativeName: "Русский", baseLanguage: "ru", emoji: "🇷🇺" },
    { code: "house", name: "Dr. House", nativeName: "Доктор Хаус", baseLanguage: "ru", emoji: "🏥" },
  ];

  return {
    locales: mockLocales,
    localeResources: {},
    // @ts-ignore - используются внутри LanguageProvider
    isValidLocaleCode: (code: string) => mockLocales.some(l => l.code === code),
    // @ts-ignore - используются внутри LanguageProvider
    getBaseLanguageCodes: () => Array.from(new Set(mockLocales.map(l => l.baseLanguage))),
  };
});

import i18n from "@/i18n";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

function TestConsumer() {
  const { language, setLanguage } = useLanguage();
  const testLanguages = ["en", "ru", "house"];
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      {testLanguages.map((lang) => (
        <button key={lang} onClick={() => setLanguage(lang)}>
          {lang}
        </button>
      ))}
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.mocked(i18n.changeLanguage).mockResolvedValue(
      undefined as unknown as ReturnType<
        typeof i18n.changeLanguage
      > extends Promise<infer T>
        ? T
        : never,
    );
    (i18n as { language: string }).language = DEFAULT_LANGUAGE;
  });

  it("should use DEFAULT_LANGUAGE when localStorage is empty", () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("current-lang").textContent).toBe(
      DEFAULT_LANGUAGE,
    );
  });

  it("should call i18n.changeLanguage when setLanguage is invoked", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "en" }));
    });

    expect(i18n.changeLanguage).toHaveBeenCalledWith("en");
  });

  it("should save selected language to localStorage under STORAGE_KEYS.LANGUAGE", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "en" }));
    });

    expect(localStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe("en");
  });
});
