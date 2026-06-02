import {
  ChevronDown,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  Sun,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInterfaceScale } from "@/app/providers/InterfaceScaleProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { MenuOrderSection } from "@/components/settings/MenuOrderSection";
import { ServerSection } from "@/components/settings/ServerSection";
import { Sidebar } from "@/components/tasks/Sidebar";
import { BOX_ICONS } from "@/components/tasks/taskEditShared";
import { OpacityBars } from "@/components/ui/OpacityBars";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLOR_VALUES_DARK,
  ACCENT_COLORS,
  BOX_ORDER,
  COLOR_SCHEMES,
  FILTER_BAR_POSITIONS,
  FOCUS_OPACITY_LEVELS,
  INTERFACE_SCALES,
  LANGUAGE_SEARCH_THRESHOLD,
  PANEL_SIDES,
  ROUTES,
} from "@/constants";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelAlwaysOpen } from "@/hooks/usePanelAlwaysOpen";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSettings } from "@/hooks/useSettings";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { getLocaleByCode, locales } from "@/services/localeRegistry";
import {
  clearOauthReturnFlag,
  isOauthReturn,
} from "@/services/supabaseClientManager";
import { cn } from "@/shared/lib/cn";
import type {
  AccentColor,
  Box,
  ColorScheme,
  FilterBarPosition,
  PanelSide,
} from "@/types/common";

const THEME_ICONS: Record<ColorScheme, React.FC<{ className?: string }>> = {
  system: ({ className }) => <Monitor className={className} />,
  light: ({ className }) => <Sun className={className} />,
  dark: ({ className }) => <Moon className={className} />,
};

const PANEL_SIDE_ICONS: Record<PanelSide, React.FC<{ className?: string }>> = {
  left: ({ className }) => <PanelLeft className={className} />,
  right: ({ className }) => <PanelRight className={className} />,
};

/**
 * Implements FR14 of simplify-backend-connection.
 * Handles OAuth callback query params (?code=, ?error=) after redirect.
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isLanguagePanelOpen, setLanguagePanelOpen] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken } = useAuth();
  const connectionConfig = useConnectionConfig();
  const [oauthError, setOauthError] = useState("");
  // Track whether we're in an OAuth callback flow (PKCE ?code= param)
  const isPkceCallbackRef = useRef(false);

  // Detect OAuth callback params (?code= or ?error=) — implements FR14 of simplify-backend-connection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (code || error) {
      // Clean query params from URL
      window.history.replaceState({}, "", location.pathname);
    }

    if (code && connectionConfig?.type === "supabase") {
      // SDK handles code exchange via onAuthStateChange.
      // If token already present, navigate immediately.
      if (accessToken) {
        navigate(ROUTES.TASKS);
      } else {
        isPkceCallbackRef.current = true;
      }
    } else if (error && connectionConfig?.type === "supabase") {
      setOauthError(errorDescription ?? error);
    }
  }, [
    location.search,
    connectionConfig,
    accessToken,
    navigate,
    location.pathname,
  ]);

  // After OAuth sign-in succeeds: navigate to inbox
  // Triggers for both implicit flow (isOauthReturn from sessionStorage) and PKCE flow (?code= ref)
  useEffect(() => {
    if (
      (isPkceCallbackRef.current || isOauthReturn()) &&
      accessToken !== null
    ) {
      isPkceCallbackRef.current = false;
      clearOauthReturnFlag();
      navigate(ROUTES.TASKS);
    }
  }, [accessToken, navigate]);

  const { defaultBox, setDefaultBox } = useSettings();
  const {
    accentColor,
    setAccentColor,
    colorScheme,
    setColorScheme,
    customAccentLight,
    customAccentDark,
    setCustomAccentColors,
  } = useTheme();
  const { panelSide, setPanelSide } = usePanelSide();
  const { language, setLanguage } = useLanguage();
  const { isPanelAlwaysOpen, setPanelAlwaysOpen } = usePanelAlwaysOpen();
  const { isFocusMode, setFocusMode, focusOpacity, setFocusOpacity } =
    useFocusMode();
  const { filterBarPosition, setFilterBarPosition } = useFilterBarPosition();
  const { interfaceScale, setInterfaceScale } = useInterfaceScale();

  const [customLightInput, setCustomLightInput] = useState(customAccentLight);
  const [customDarkInput, setCustomDarkInput] = useState(customAccentDark);

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

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useSidebarNavigation();

  const handleBoxSelect = (box: Box): void => {
    void setDefaultBox(box);
  };

  const handleColorSelect = (color: AccentColor): void => {
    void setAccentColor(color);
  };

  const handleCustomColorChange = useCallback(
    (lightHex: string, darkHex: string) => {
      setCustomLightInput(lightHex);
      setCustomDarkInput(darkHex);
      void setCustomAccentColors(lightHex, darkHex);
    },
    [setCustomAccentColors],
  );

  const handleColorSchemeSelect = (scheme: ColorScheme): void => {
    setColorScheme(scheme);
  };

  const handlePanelSideSelect = (side: PanelSide): void => {
    setPanelSide(side);
  };

  const handleFilterBarPositionSelect = (position: FilterBarPosition): void => {
    setFilterBarPosition(position);
  };

  const handleLanguageSelect = (lang: string): void => {
    setLanguage(lang);
  };

  return (
    <div
      data-testid="settings-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("settings.name")}
            </h1>

            {/* Default box section */}
            <section data-testid="settings-default-box" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.defaultBox")}
              </h2>
              <div className="flex gap-4">
                {BOX_ORDER.map((box) => {
                  const BoxIcon = BOX_ICONS[box];
                  const isSelected = defaultBox === box;
                  return (
                    <button
                      key={box}
                      data-testid={`settings-box-option-${box}`}
                      aria-label={t(`box.${box}`)}
                      aria-pressed={isSelected}
                      onClick={() => handleBoxSelect(box)}
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-full transition-colors",
                        isSelected
                          ? "text-accent"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      <BoxIcon className="w-6 h-6" />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Accent color section */}
            <section data-testid="settings-accent-color" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.accentColor")}
              </h2>
              <div className="flex gap-4">
                {ACCENT_COLORS.map((color) => {
                  if (color === "custom") {
                    const isSelected = accentColor === "custom";
                    return (
                      <button
                        key="custom"
                        data-testid="settings-color-option-custom"
                        aria-pressed={isSelected}
                        aria-label={t("color.custom")}
                        onClick={() => handleColorSelect("custom")}
                        className={cn(
                          "w-9 h-9 rounded-full transition-all overflow-hidden",
                          isSelected &&
                            "ring-2 ring-offset-2 ring-gray-400 scale-110",
                        )}
                      >
                        <div className="flex h-full">
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: customLightInput }}
                          />
                          <div
                            className="w-1/2 h-full"
                            style={{ backgroundColor: customDarkInput }}
                          />
                        </div>
                      </button>
                    );
                  }

                  const isSelected = accentColor === color;
                  const isDarkTheme =
                    colorScheme === "dark" ||
                    (colorScheme === "system" &&
                      window.matchMedia("(prefers-color-scheme: dark)")
                        .matches);
                  const colorValue = isDarkTheme
                    ? ACCENT_COLOR_VALUES_DARK[color]
                    : ACCENT_COLOR_VALUES[color];

                  return (
                    <button
                      key={color}
                      data-testid={`settings-color-option-${color}`}
                      aria-pressed={isSelected}
                      aria-label={t(`color.${color}`)}
                      onClick={() => handleColorSelect(color)}
                      className={cn(
                        "w-9 h-9 rounded-full transition-all",
                        isSelected &&
                          "ring-2 ring-offset-2 ring-gray-400 scale-110",
                      )}
                      style={{ backgroundColor: colorValue }}
                    />
                  );
                })}
              </div>

              {/* Custom color picker - показывается только когда выбран custom */}
              {accentColor === "custom" && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Light theme color */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <Sun className="w-4 h-4 text-gray-500" />
                    <input
                      type="color"
                      value={customLightInput}
                      onChange={(e) =>
                        handleCustomColorChange(e.target.value, customDarkInput)
                      }
                      className="w-8 h-8 border-0 cursor-pointer"
                      data-testid="settings-custom-light-picker"
                    />
                    <input
                      type="text"
                      value={customLightInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setCustomLightInput(value);
                          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                            handleCustomColorChange(value, customDarkInput);
                          }
                        }
                      }}
                      className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                      placeholder="#000000"
                      data-testid="settings-custom-light-input"
                    />
                  </div>

                  {/* Dark theme color */}
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                    <Moon className="w-4 h-4 text-gray-500" />
                    <input
                      type="color"
                      value={customDarkInput}
                      onChange={(e) =>
                        handleCustomColorChange(
                          customLightInput,
                          e.target.value,
                        )
                      }
                      className="w-8 h-8 border-0 cursor-pointer"
                      data-testid="settings-custom-dark-picker"
                    />
                    <input
                      type="text"
                      value={customDarkInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setCustomDarkInput(value);
                          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                            handleCustomColorChange(customLightInput, value);
                          }
                        }
                      }}
                      className="w-20 text-sm border border-gray-200 rounded px-2 py-1"
                      placeholder="#000000"
                      data-testid="settings-custom-dark-input"
                    />
                  </div>
                </div>
              )}
            </section>
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

            {/* Interface scale section */}
            <section
              data-testid="settings-interface-scale"
              className="space-y-3"
            >
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
                        className={cn(
                          "font-semibold text-gray-700",
                          textSizeClass,
                        )}
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

              {/* Триггер */}
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

              {/* Inline-панель со списком языков */}
              {isLanguagePanelOpen && (
                <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs">
                  {/* Поиск (если языков >= 10) */}
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

                  {/* Список языков */}
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

            {/* Panel side section */}
            <section data-testid="settings-panel-side" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.panelSide")}
              </h2>
              <div className="flex gap-4">
                {PANEL_SIDES.map((side) => {
                  const PanelIcon = PANEL_SIDE_ICONS[side];
                  const isSelected = panelSide === side;
                  return (
                    <button
                      key={side}
                      data-testid={`settings-panel-side-option-${side}`}
                      aria-label={
                        side === "left"
                          ? t("settings.panelLeft")
                          : t("settings.panelRight")
                      }
                      aria-pressed={isSelected}
                      onClick={() => handlePanelSideSelect(side)}
                      className={cn(
                        "flex items-center justify-center w-11 h-11 rounded-full transition-colors",
                        isSelected
                          ? "text-accent"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      <PanelIcon className="w-6 h-6" />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Panel always open section */}
            <section data-testid="settings-panel-always-open">
              <button
                type="button"
                role="switch"
                aria-checked={isPanelAlwaysOpen}
                data-testid="settings-panel-always-open-toggle"
                onClick={() => setPanelAlwaysOpen(!isPanelAlwaysOpen)}
                className="flex items-center gap-3"
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                    isPanelAlwaysOpen ? "bg-accent" : "bg-gray-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                      isPanelAlwaysOpen ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </span>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {t("settings.panelAlwaysOpen")}
                </span>
              </button>
            </section>

            {/* Focus mode section */}
            <section data-testid="settings-focus-mode">
              <button
                type="button"
                role="switch"
                aria-checked={isFocusMode}
                data-testid="settings-focus-mode-toggle"
                onClick={() => setFocusMode(!isFocusMode)}
                className="flex items-center gap-3"
              >
                <span
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                    isFocusMode ? "bg-accent" : "bg-gray-200",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                      isFocusMode ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </span>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {t("settings.focusMode")}
                </span>
              </button>
              {isFocusMode && (
                <div className="mt-3" data-testid="settings-focus-opacity">
                  <OpacityBars
                    value={focusOpacity}
                    onChange={setFocusOpacity}
                    levels={FOCUS_OPACITY_LEVELS}
                  />
                </div>
              )}
            </section>

            {/* Filter bar position section */}
            <section
              data-testid="settings-filter-bar-position"
              className="space-y-3"
            >
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.filterBarPosition")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {FILTER_BAR_POSITIONS.map((position) => (
                  <button
                    key={position}
                    data-testid={`settings-filter-bar-position-option-${position}`}
                    aria-pressed={filterBarPosition === position}
                    onClick={() => handleFilterBarPositionSelect(position)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      filterBarPosition === position
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {position === "bottom"
                      ? t("settings.filterBarBottom")
                      : t("settings.filterBarTop")}
                  </button>
                ))}
              </div>
            </section>

            {/* Menu order section */}
            <MenuOrderSection />

            {/* Server connection section */}
            <ServerSection oauthError={oauthError} />
          </div>
        </main>
      </div>

      {/* Right panel — same as on main page */}
      <Sidebar
        mode={null}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
