import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  localeResources,
  getLocaleByCode,
} from "@/services/localeRegistry";
import { DEFAULT_LANGUAGE, STORAGE_KEYS } from "@/constants";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: localeResources,
    fallbackLng: (code) => {
      const locale = getLocaleByCode(code);
      if (locale?.baseLanguage && locale.baseLanguage !== code) {
        return [locale.baseLanguage, DEFAULT_LANGUAGE];
      }
      return [DEFAULT_LANGUAGE];
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEYS.LANGUAGE,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
