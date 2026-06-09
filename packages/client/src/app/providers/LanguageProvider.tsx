// implements FR6, FR7 of localstorage-refactor
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";
import i18n from "@/i18n";
import {
  getBaseLanguageCodes,
  isValidLocaleCode,
} from "@/services/localeRegistry";
import {
  getPreference,
  setPreference,
} from "@/services/localPreferencesService";

interface LanguageContextValue {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectBrowserLanguage(): string | null {
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  const baseLanguageCodes = getBaseLanguageCodes();

  for (const browserLang of browserLanguages) {
    const langCode = browserLang.split("-")[0];
    if (baseLanguageCodes.includes(langCode)) {
      return langCode;
    }
  }
  return null;
}

function getInitialLanguage(): string {
  const stored = getPreference<string>({
    type: "enum",
    key: STORAGE_KEYS.LANGUAGE,
    values: getBaseLanguageCodes(),
    defaultValue: "",
  });

  if (stored && isValidLocaleCode(stored)) {
    return stored;
  }

  const detectedLanguage = detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
  setPreference(STORAGE_KEYS.LANGUAGE, detectedLanguage);
  return detectedLanguage;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(getInitialLanguage);

  // i18next is initialized before React (at module import time), so we sync
  // the detected language with i18next on component mount
  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    setPreference(STORAGE_KEYS.LANGUAGE, lang);
    void i18n.changeLanguage(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
