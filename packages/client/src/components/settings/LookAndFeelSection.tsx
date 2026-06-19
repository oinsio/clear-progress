import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInterfaceScale } from "@/app/providers/InterfaceScaleProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { AccentColorSection } from "@/components/settings/AccentColorSection";
import {
  COLOR_SCHEMES,
  INTERFACE_SCALES,
  LANGUAGE_SEARCH_THRESHOLD,
} from "@/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { getLocaleByCode, locales } from "@/services/localeRegistry";
import { cn } from "@/shared/lib/cn";
import type { ColorScheme } from "@/types/common";

const THEME_ICONS: Record<ColorScheme, React.FC<{ className?: string }>> = {
  system: ({ className }) => <Monitor className={className} />,
  light: ({ className }) => <Sun className={className} />,
  dark: ({ className }) => <Moon className={className} />,
};

/** Implements FR2 of settings-page-reordering */
export function LookAndFeelSection() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useTheme();
  const { interfaceScale, setInterfaceScale } = useInterfaceScale();
  const { language, setLanguage } = useLanguage();

  const [isLanguagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  const currentLocale = getLocaleByCode(language);

  const filteredLocales = useMemo(() => {
    if (!languageSearchQuery) return locales;
    const query = languageSearchQuery.toLowerCase();
    return locales.filter(
      (locale) =>
        locale.nativeName.toLowerCase().includes(query) ||
        locale.name.toLowerCase().includes(query) ||
        locale.code.toLowerCase().includes(query),
    );
  }, [languageSearchQuery]);

  const handleColorSchemeSelect = (scheme: ColorScheme): void => {
    setColorScheme(scheme);
  };

  const handleLanguageSelect = (lang: string): void => {
    setLanguage(lang);
  };

  return (
    <div className="space-y-6">
      {/* Theme section */}
      <section data-testid="settings-theme" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.theme")}
        </h2>
        <div className="flex gap-4">
          {COLOR_SCHEMES.map((scheme) => {
            const ThemeIcon = THEME_ICONS[scheme];
            const isSelected = colorScheme === scheme;
            return (
              <button
                key={scheme}
                data-testid={`settings-theme-option-${scheme}`}
                aria-label={t(`theme.${scheme}`)}
                aria-pressed={isSelected}
                onClick={() => handleColorSchemeSelect(scheme)}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-full transition-colors",
                  isSelected
                    ? "text-accent"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                )}
              >
                <ThemeIcon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Accent color section */}
      <AccentColorSection />

      {/* Interface scale section */}
      <section data-testid="settings-interface-scale" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.interfaceScale")}
        </h2>
        <div className="flex gap-3">
          {INTERFACE_SCALES.map((scale) => {
            const isSelected = interfaceScale === scale;
            const textSizeClass =
              scale === "small"
                ? "text-sm"
                : scale === "normal"
                  ? "text-base"
                  : scale === "large"
                    ? "text-lg"
                    : "text-xl";

            return (
              <button
                key={scale}
                data-testid={`settings-scale-option-${scale}`}
                aria-pressed={isSelected}
                aria-label={t(`settings.scale.${scale}`)}
                onClick={() => setInterfaceScale(scale)}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all",
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <span
                  className={cn("font-semibold text-gray-700", textSizeClass)}
                >
                  Aa
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Language section */}
      <section data-testid="settings-language" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          {t("settings.language")}
        </h2>

        {/* Trigger */}
        <button
          type="button"
          data-testid="settings-language-trigger"
          onClick={() => setLanguagePanelOpen(!isLanguagePanelOpen)}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors w-full max-w-xs"
        >
          <span>{currentLocale?.emoji}</span>
          <span className="text-sm font-medium">
            {currentLocale?.nativeName}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 ml-auto transition-transform",
              isLanguagePanelOpen && "rotate-180",
            )}
          />
        </button>

        {/* Inline panel with language list */}
        {isLanguagePanelOpen && (
          <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs">
            {/* Search (if there are >= 10 languages) */}
            {locales.length >= LANGUAGE_SEARCH_THRESHOLD && (
              <div className="border-b border-gray-100 p-2">
                <input
                  type="text"
                  data-testid="settings-language-search"
                  placeholder={t("search.placeholder")}
                  value={languageSearchQuery}
                  onChange={(e) => setLanguageSearchQuery(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-accent"
                />
              </div>
            )}

            {/* Language list */}
            <div className="flex flex-col gap-0.5 p-2 max-h-60 overflow-y-auto">
              {filteredLocales.map((locale) => (
                <button
                  key={locale.code}
                  type="button"
                  data-testid={`settings-language-option-${locale.code}`}
                  onClick={() => {
                    handleLanguageSelect(locale.code);
                    setLanguagePanelOpen(false);
                    setLanguageSearchQuery("");
                  }}
                  className={cn(
                    "flex items-center gap-2 text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                    language === locale.code
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <span>{locale.emoji}</span>
                  <span>{locale.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
