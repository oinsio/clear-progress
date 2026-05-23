// implements FR1-FR12 of add-i18n-specs

import { cleanup, render } from "@testing-library/react/pure";
import { createElement } from "react";
import { vi } from "vitest";
import {
  LanguageProvider,
  useLanguage,
} from "@/app/providers/LanguageProvider";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";

export function createLocalStorageMock() {
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
}

export function mockNavigatorLanguages(languages: string[]) {
  vi.stubGlobal("navigator", {
    ...navigator,
    languages,
    language: languages[0] ?? "",
  });
}

export function createI18nTestContext() {
  const localStorageMock = createLocalStorageMock();

  function reset() {
    localStorageMock.clear();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("navigator", {
      ...navigator,
      languages: [DEFAULT_LANGUAGE],
      language: DEFAULT_LANGUAGE,
    });
  }

  function setStoredLanguage(languageCode: string) {
    localStorageMock.setItem(STORAGE_KEYS.LANGUAGE, languageCode);
  }

  return {
    localStorageMock,
    reset,
    setStoredLanguage,
  };
}

export function TestConsumer() {
  const { language } = useLanguage();
  return createElement("span", { "data-testid": "current-lang" }, language);
}

export function renderWithLanguageProvider() {
  cleanup();
  render(createElement(LanguageProvider, null, createElement(TestConsumer)));
}

export const throwingLocalStorage = {
  getItem: () => {
    throw new Error("localStorage unavailable");
  },
  setItem: () => {
    throw new Error("localStorage unavailable");
  },
  removeItem: () => {
    throw new Error("localStorage unavailable");
  },
  clear: () => {
    throw new Error("localStorage unavailable");
  },
  get length() {
    return 0;
  },
  key: () => null,
};
