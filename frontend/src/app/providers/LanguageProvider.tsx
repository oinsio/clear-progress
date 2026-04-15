import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import * as React from "react";
import i18n from "@/i18n";
import {
  isValidLocaleCode,
  getBaseLanguageCodes,
} from "@/services/localeRegistry";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";

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
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored && isValidLocaleCode(stored)) {
      return stored;
    }
    const detectedLanguage = detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, detectedLanguage);
    return detectedLanguage;
  } catch {
    // localStorage недоступен
    return detectBrowserLanguage() ?? DEFAULT_LANGUAGE;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(getInitialLanguage);

  // i18next инициализируется до React (при импорте модуля), поэтому синхронизируем
  // определённый язык с i18next при монтировании компонента
  useEffect(() => {
    void i18n.changeLanguage(language);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
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
