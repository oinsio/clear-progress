import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelAlwaysOpen } from "@/hooks/usePanelAlwaysOpen";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useInterfaceScale } from "@/app/providers/InterfaceScaleProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import {
  RightFilterPanel,
  type RightPanelMode,
} from "@/components/tasks/RightFilterPanel";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";
import { ConfirmDisconnectDialog } from "@/components/settings/ConfirmDisconnectDialog";
import { MenuOrderSection } from "@/components/settings/MenuOrderSection";
import {
  BOX_ORDER,
  ACCENT_COLORS,
  ACCENT_COLOR_VALUES,
  ACCENT_COLOR_VALUES_DARK,
  COLOR_SCHEMES,
  PANEL_SIDES,
  FILTER_BAR_POSITIONS,
  INTERFACE_SCALES,
  ROUTES,
  STORAGE_KEYS,
  SUPPORTED_LANGUAGES,
  BACKEND_CONNECTION_EVENT,
} from "@/constants";
import type {
  Box,
  AccentColor,
  ColorScheme,
  PanelSide,
  FilterBarPosition,
} from "@/types/common";
import type { Language } from "@/constants";
import { cn } from "@/shared/lib/cn";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [filterMode, setFilterMode] = useState<RightPanelMode>(null);
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const [isFullSyncDialogOpen, setIsFullSyncDialogOpen] = useState(false);
  const { triggerFullSync } = useSync();

  const navigate = useNavigate();
  const { defaultBox, setDefaultBox } = useSettings();
  const { accentColor, setAccentColor, colorScheme, setColorScheme } =
    useTheme();
  const { panelSide, setPanelSide } = usePanelSide();
  const { language, setLanguage } = useLanguage();
  const { isPanelAlwaysOpen, setPanelAlwaysOpen } = usePanelAlwaysOpen();
  const { filterBarPosition, setFilterBarPosition } = useFilterBarPosition();
  const { interfaceScale, setInterfaceScale } = useInterfaceScale();

  const handlePanelToggle = togglePanelOpen;

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode !== null) {
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
      } else {
        setFilterMode(newMode);
      }
    },
    [navigate],
  );

  const handleBoxSelect = (box: Box): void => {
    void setDefaultBox(box);
  };

  const handleColorSelect = (color: AccentColor): void => {
    void setAccentColor(color);
  };

  const handleColorSchemeSelect = (scheme: ColorScheme): void => {
    setColorScheme(scheme);
  };

  const handlePanelSideSelect = (side: PanelSide): void => {
    setPanelSide(side);
  };

  const handleFilterBarPositionSelect = (position: FilterBarPosition): void => {
    setFilterBarPosition(position);
  };

  const handleLanguageSelect = (lang: Language): void => {
    setLanguage(lang);
  };

  const connectionStatus = useConnectionStatus();
  const isBackendConfigured = connectionStatus !== "not_configured";
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);

  const handleDisconnectRequest = useCallback((): void => {
    setIsDisconnectDialogOpen(true);
  }, []);

  const handleDisconnectCancel = useCallback((): void => {
    setIsDisconnectDialogOpen(false);
  }, []);

  const handleDisconnectConfirm = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEYS.BACKEND_CONNECTED);
    window.dispatchEvent(new Event(BACKEND_CONNECTION_EVENT));
    setIsDisconnectDialogOpen(false);
  }, []);

  const handleFullSyncOpen = useCallback((): void => {
    setIsFullSyncDialogOpen(true);
  }, []);

  const handleFullSyncClose = useCallback((): void => {
    setIsFullSyncDialogOpen(false);
  }, []);

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
              <div className="flex flex-wrap gap-2">
                {BOX_ORDER.map((box) => (
                  <button
                    key={box}
                    data-testid={`settings-box-option-${box}`}
                    aria-pressed={defaultBox === box}
                    onClick={() => handleBoxSelect(box)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      defaultBox === box
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {t(`box.${box}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Accent color section */}
            <section data-testid="settings-accent-color" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.accentColor")}
              </h2>
              <div className="flex gap-4">
                {ACCENT_COLORS.map((color) => {
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
            </section>
            {/* Theme section */}
            <section data-testid="settings-theme" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.theme")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme}
                    data-testid={`settings-theme-option-${scheme}`}
                    aria-pressed={colorScheme === scheme}
                    onClick={() => handleColorSchemeSelect(scheme)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      colorScheme === scheme
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {t(`theme.${scheme}`)}
                  </button>
                ))}
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
                  const iconSize =
                    scale === "small"
                      ? 16
                      : scale === "normal"
                        ? 20
                        : scale === "large"
                          ? 24
                          : 28;

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
                        className="font-semibold text-gray-700"
                        style={{ fontSize: `${iconSize}px` }}
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
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    data-testid={`settings-language-option-${lang}`}
                    aria-pressed={language === lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      language === lang
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {t(`lang.${lang}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Panel side section */}
            <section data-testid="settings-panel-side" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.panelSide")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {PANEL_SIDES.map((side) => (
                  <button
                    key={side}
                    data-testid={`settings-panel-side-option-${side}`}
                    aria-pressed={panelSide === side}
                    onClick={() => handlePanelSideSelect(side)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      panelSide === side
                        ? "bg-accent border-accent text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {side === "left"
                      ? t("settings.panelLeft")
                      : t("settings.panelRight")}
                  </button>
                ))}
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

            {/* Sync section */}
            <section data-testid="settings-sync" className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {t("settings.syncSection")}
              </h2>
              <div className="rounded-lg border border-gray-200 px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      connectionStatus === "synced" && "bg-green-500",
                      connectionStatus === "syncing" &&
                        "bg-yellow-400 animate-pulse",
                      (connectionStatus === "error" ||
                        connectionStatus === "offline" ||
                        connectionStatus === "unauthorized") &&
                        "bg-red-500",
                      (connectionStatus === "not_configured" ||
                        connectionStatus === "no_auth") &&
                        "bg-gray-300",
                    )}
                  />
                  <span
                    data-testid="settings-sync-status"
                    className={cn(
                      "text-sm font-medium",
                      connectionStatus === "synced" && "text-green-600",
                      connectionStatus === "syncing" && "text-yellow-600",
                      (connectionStatus === "error" ||
                        connectionStatus === "offline" ||
                        connectionStatus === "unauthorized") &&
                        "text-red-500",
                      (connectionStatus === "not_configured" ||
                        connectionStatus === "no_auth") &&
                        "text-gray-400",
                    )}
                  >
                    {connectionStatus === "synced" &&
                      t("settings.syncConnected")}
                    {connectionStatus === "syncing" && t("sync.syncing")}
                    {connectionStatus === "error" && t("sync.noConnection")}
                    {connectionStatus === "offline" && t("sync.noConnection")}
                    {connectionStatus === "unauthorized" &&
                      t("sync.unauthorized")}
                    {connectionStatus === "no_auth" &&
                      t("settings.syncConnected")}
                    {connectionStatus === "not_configured" &&
                      t("settings.syncNotConnected")}
                  </span>
                </div>
                {isBackendConfigured ? (
                  <>
                    <button
                      data-testid="settings-full-sync-btn"
                      onClick={handleFullSyncOpen}
                      className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors"
                    >
                      {t("settings.fullSync")}
                    </button>
                    <button
                      data-testid="settings-sync-disconnect"
                      onClick={handleDisconnectRequest}
                      className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 transition-colors hover:border-red-300 hover:bg-red-50"
                    >
                      {t("settings.syncDisconnect")}
                    </button>
                  </>
                ) : (
                  <button
                    data-testid="settings-sync-connect"
                    onClick={() => navigate(ROUTES.SETUP)}
                    className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors"
                  >
                    {t("settings.syncConnect")}
                  </button>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <ConfirmFullSyncDialog
        isOpen={isFullSyncDialogOpen}
        onClose={handleFullSyncClose}
        onSync={triggerFullSync}
      />

      <ConfirmDisconnectDialog
        isOpen={isDisconnectDialogOpen}
        onClose={handleDisconnectCancel}
        onConfirm={handleDisconnectConfirm}
      />

      {/* Right panel — same as on main page */}
      <RightFilterPanel
        mode={filterMode}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
