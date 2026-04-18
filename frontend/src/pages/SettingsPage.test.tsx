import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import type { UseSettingsReturn } from "@/hooks/useSettings";
import type { AccentColor } from "@/types/common";

vi.mock("@/hooks/useSettings");
vi.mock("@/app/providers/ThemeProvider");
vi.mock("@/hooks/useLanguage");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/usePanelAlwaysOpen");
vi.mock("@/hooks/useFocusMode");
vi.mock("@/hooks/useConnectionStatus");
vi.mock("@/hooks/useFilterBarPosition");
vi.mock("@/app/providers/InterfaceScaleProvider");
vi.mock("@/components/tasks/RightFilterPanel");
vi.mock("@/components/settings/MenuOrderSection");
vi.mock("@/components/settings/ConfirmFullSyncDialog");
vi.mock("@/app/providers/SyncProvider");
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { useSettings } from "@/hooks/useSettings";
import { localStorageMock } from "@/test/mocks/localStorageMock";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelAlwaysOpen } from "@/hooks/usePanelAlwaysOpen";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useInterfaceScale } from "@/app/providers/InterfaceScaleProvider";
import { useSync } from "@/app/providers/SyncProvider";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { ConfirmFullSyncDialog } from "@/components/settings/ConfirmFullSyncDialog";

const mockUseSettings = vi.mocked(useSettings);
const mockUseTheme = vi.mocked(useTheme);
const mockUseLanguage = vi.mocked(useLanguage);
const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelAlwaysOpen = vi.mocked(usePanelAlwaysOpen);
const mockUseFocusMode = vi.mocked(useFocusMode);
const mockUseFilterBarPosition = vi.mocked(useFilterBarPosition);
const mockUseInterfaceScale = vi.mocked(useInterfaceScale);
const mockUseSync = vi.mocked(useSync);
const mockUseConnectionStatus = vi.mocked(useConnectionStatus);
const mockConfirmFullSyncDialog = vi.mocked(ConfirmFullSyncDialog);

function buildSettingsHook(
  overrides: Partial<UseSettingsReturn> = {},
): UseSettingsReturn {
  return {
    defaultBox: "today",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn().mockResolvedValue(undefined),
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildThemeHook(
  overrides: {
    accentColor?: AccentColor;
    setAccentColor?: ReturnType<typeof vi.fn>;
  } = {},
): ReturnType<typeof useTheme> {
  return {
    accentColor: "green",
    setAccentColor: vi.fn().mockResolvedValue(undefined),
    colorScheme: "system",
    setColorScheme: vi.fn(),
    customAccentLight: "#fcd34d",
    customAccentDark: "#14b8a6",
    setCustomAccentColors: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function buildLanguageHook(
  overrides: {
    language?: string;
    setLanguage?: ReturnType<typeof vi.fn>;
  } = {},
): ReturnType<typeof useLanguage> {
  return {
    language: "ru",
    setLanguage: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockUseSettings.mockReturnValue(buildSettingsHook());
    mockUseTheme.mockReturnValue(buildThemeHook());
    mockUseLanguage.mockReturnValue(buildLanguageHook());
    mockUsePanelOpen.mockReturnValue({
      isPanelOpen: false,
      togglePanelOpen: vi.fn(),
    });
    mockUsePanelSide.mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
    mockUsePanelAlwaysOpen.mockReturnValue({
      isPanelAlwaysOpen: false,
      setPanelAlwaysOpen: vi.fn(),
    });
    mockUseFocusMode.mockReturnValue({
      isFocusMode: false,
      setFocusMode: vi.fn(),
      focusOpacity: 30,
      setFocusOpacity: vi.fn(),
    });
    mockUseFilterBarPosition.mockReturnValue({
      filterBarPosition: "bottom",
      setFilterBarPosition: vi.fn(),
    });
    mockUseInterfaceScale.mockReturnValue({
      interfaceScale: "normal",
      setInterfaceScale: vi.fn(),
    });
    mockUseConnectionStatus.mockReturnValue("not_configured");
    mockUseSync.mockReturnValue({
      syncStatus: "idle",
      syncVersion: 0,
      lastSyncedAt: null,
      pull: vi.fn(),
      push: vi.fn(),
      schedulePush: vi.fn(),
      triggerFullSync: vi.fn().mockResolvedValue(undefined),
    });
    mockConfirmFullSyncDialog.mockReturnValue(null);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should render the settings page container", () => {
    renderPage();
    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
  });

  it("should render the default box section", () => {
    renderPage();
    expect(screen.getByTestId("settings-default-box")).toBeInTheDocument();
  });

  it("should render all four box options", () => {
    renderPage();
    expect(screen.getByTestId("settings-box-option-inbox")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-today")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-week")).toBeInTheDocument();
    expect(screen.getByTestId("settings-box-option-later")).toBeInTheDocument();
  });

  it("should mark the current default box as active", () => {
    mockUseSettings.mockReturnValue(buildSettingsHook({ defaultBox: "week" }));
    renderPage();
    expect(screen.getByTestId("settings-box-option-week")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("settings-box-option-inbox")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("should call setDefaultBox when a box option is clicked", async () => {
    const setDefaultBox = vi.fn().mockResolvedValue(undefined);
    mockUseSettings.mockReturnValue(
      buildSettingsHook({ defaultBox: "today", setDefaultBox }),
    );
    renderPage();
    fireEvent.click(screen.getByTestId("settings-box-option-inbox"));
    expect(setDefaultBox).toHaveBeenCalledWith("inbox");
  });

  it("should render the accent color section", () => {
    renderPage();
    expect(screen.getByTestId("settings-accent-color")).toBeInTheDocument();
  });

  it("should render all eight color options", () => {
    renderPage();
    expect(
      screen.getByTestId("settings-color-option-coral"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-orange"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-yellow"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-green"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-blue"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-indigo"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-color-option-purple"),
    ).toBeInTheDocument();
  });

  it("should mark the current accent color as active", () => {
    mockUseTheme.mockReturnValue(buildThemeHook({ accentColor: "orange" }));
    renderPage();
    expect(screen.getByTestId("settings-color-option-orange")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("settings-color-option-green")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("should call setAccentColor when a color option is clicked", () => {
    const setAccentColor = vi.fn().mockResolvedValue(undefined);
    mockUseTheme.mockReturnValue(buildThemeHook({ setAccentColor }));
    renderPage();
    fireEvent.click(screen.getByTestId("settings-color-option-indigo"));
    expect(setAccentColor).toHaveBeenCalledWith("indigo");
  });

  it("should render the language section with trigger button", () => {
    renderPage();
    expect(screen.getByTestId("settings-language")).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-language-trigger"),
    ).toBeInTheDocument();
  });

  it("should show current language in trigger button", () => {
    mockUseLanguage.mockReturnValue(buildLanguageHook({ language: "en" }));
    renderPage();
    const trigger = screen.getByTestId("settings-language-trigger");
    expect(trigger).toHaveTextContent("English");
  });

  it("should open language panel when trigger is clicked", () => {
    renderPage();
    const trigger = screen.getByTestId("settings-language-trigger");

    // Панель закрыта изначально
    expect(
      screen.queryByTestId("settings-language-option-ru"),
    ).not.toBeInTheDocument();

    // Открываем панель
    fireEvent.click(trigger);

    // Панель открыта, языки видны
    expect(
      screen.getByTestId("settings-language-option-ru"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-language-option-en"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-language-option-house"),
    ).toBeInTheDocument();
  });

  it("should call setLanguage and close panel when a language option is clicked", () => {
    const setLanguage = vi.fn();
    mockUseLanguage.mockReturnValue(buildLanguageHook({ setLanguage }));
    renderPage();

    // Открываем панель
    fireEvent.click(screen.getByTestId("settings-language-trigger"));

    // Кликаем на язык
    fireEvent.click(screen.getByTestId("settings-language-option-en"));

    // Проверяем вызов setLanguage
    expect(setLanguage).toHaveBeenCalledWith("en");

    // Панель закрылась
    expect(
      screen.queryByTestId("settings-language-option-ru"),
    ).not.toBeInTheDocument();
  });

  describe("sync section", () => {
    it("should render sync section", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync")).toBeInTheDocument();
    });

    it("should show not connected status when no URL is configured", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent(
        "settings.syncNotConnected",
      );
    });

    it("should show connected status when backend is synced", () => {
      mockUseConnectionStatus.mockReturnValue("synced");
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent(
        "settings.syncConnected",
      );
    });

    it("should show error status when sync is failing", () => {
      mockUseConnectionStatus.mockReturnValue("error");
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent(
        "sync.noConnection",
      );
    });

    it("should show unauthorized status when token is expired", () => {
      mockUseConnectionStatus.mockReturnValue("unauthorized");
      renderPage();
      expect(screen.getByTestId("settings-sync-status")).toHaveTextContent(
        "sync.unauthorized",
      );
    });

    it("should render configure button", () => {
      renderPage();
      expect(screen.getByTestId("settings-sync-connect")).toBeInTheDocument();
    });

    it("should not render full sync button when backend is not configured", () => {
      renderPage();
      expect(
        screen.queryByTestId("settings-full-sync-btn"),
      ).not.toBeInTheDocument();
    });

    it("should render full sync button when backend is configured", () => {
      mockUseConnectionStatus.mockReturnValue("synced");
      renderPage();
      expect(screen.getByTestId("settings-full-sync-btn")).toBeInTheDocument();
    });

    it("should open ConfirmFullSyncDialog when full sync button is clicked", () => {
      mockUseConnectionStatus.mockReturnValue("synced");
      renderPage();
      fireEvent.click(screen.getByTestId("settings-full-sync-btn"));
      expect(mockConfirmFullSyncDialog).toHaveBeenCalledWith(
        expect.objectContaining({ isOpen: true }),
        expect.anything(),
      );
    });

    it("should pass triggerFullSync as onSync to ConfirmFullSyncDialog", () => {
      mockUseConnectionStatus.mockReturnValue("synced");
      const triggerFullSync = vi.fn().mockResolvedValue(undefined);
      mockUseSync.mockReturnValue({
        syncStatus: "idle",
        syncVersion: 0,
        lastSyncedAt: null,
        pull: vi.fn(),
        push: vi.fn(),
        schedulePush: vi.fn(),
        triggerFullSync,
      });
      renderPage();
      fireEvent.click(screen.getByTestId("settings-full-sync-btn"));
      expect(mockConfirmFullSyncDialog).toHaveBeenCalledWith(
        expect.objectContaining({ onSync: triggerFullSync }),
        expect.anything(),
      );
    });
  });

  describe("focus mode section", () => {
    it("should render focus mode toggle", () => {
      renderPage();
      expect(screen.getByTestId("settings-focus-mode")).toBeInTheDocument();
      expect(
        screen.getByTestId("settings-focus-mode-toggle"),
      ).toBeInTheDocument();
    });

    it("should not show opacity bars when focus mode is disabled", () => {
      mockUseFocusMode.mockReturnValue({
        isFocusMode: false,
        setFocusMode: vi.fn(),
        focusOpacity: 30,
        setFocusOpacity: vi.fn(),
      });
      renderPage();
      expect(
        screen.queryByTestId("settings-focus-opacity"),
      ).not.toBeInTheDocument();
    });

    it("should show opacity bars when focus mode is enabled", () => {
      mockUseFocusMode.mockReturnValue({
        isFocusMode: true,
        setFocusMode: vi.fn(),
        focusOpacity: 30,
        setFocusOpacity: vi.fn(),
      });
      renderPage();
      expect(
        screen.getByTestId("settings-focus-opacity"),
      ).toBeInTheDocument();
    });

    it("should call setFocusMode when toggle is clicked", () => {
      const setFocusMode = vi.fn();
      mockUseFocusMode.mockReturnValue({
        isFocusMode: false,
        setFocusMode,
        focusOpacity: 30,
        setFocusOpacity: vi.fn(),
      });
      renderPage();
      fireEvent.click(screen.getByTestId("settings-focus-mode-toggle"));
      expect(setFocusMode).toHaveBeenCalledWith(true);
    });

    it("should render opacity bars with correct selected value", () => {
      mockUseFocusMode.mockReturnValue({
        isFocusMode: true,
        setFocusMode: vi.fn(),
        focusOpacity: 20,
        setFocusOpacity: vi.fn(),
      });
      renderPage();
      const selectedBar = screen.getByTestId("opacity-bar-20");
      expect(selectedBar).toHaveAttribute("aria-pressed", "true");
    });

    it("should call setFocusOpacity when opacity bar is clicked", () => {
      const setFocusOpacity = vi.fn();
      mockUseFocusMode.mockReturnValue({
        isFocusMode: true,
        setFocusMode: vi.fn(),
        focusOpacity: 30,
        setFocusOpacity,
      });
      renderPage();
      const bar50 = screen.getByTestId("opacity-bar-50");
      fireEvent.click(bar50);
      expect(setFocusOpacity).toHaveBeenCalledWith(50);
    });
  });
});
