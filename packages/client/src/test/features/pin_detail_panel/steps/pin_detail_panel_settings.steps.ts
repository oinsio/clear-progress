// implements FR7 of pin-task-detail-panel
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";

// Mock useDetailPanelPinned
let mockIsDetailPanelPinned = false;
const mockSetDetailPanelPinned = vi.fn();
vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({
    isDetailPanelPinned: mockIsDetailPanelPinned,
    setDetailPanelPinned: mockSetDetailPanelPinned,
  }),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ search: "", pathname: "/settings" }),
  useNavigate: () => vi.fn(),
}));

// Mock AuthProvider
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ accessToken: null }),
}));

// Mock InterfaceScaleProvider
vi.mock("@/app/providers/InterfaceScaleProvider", () => ({
  useInterfaceScale: () => ({
    interfaceScale: "normal",
    setInterfaceScale: vi.fn(),
  }),
}));

// Mock ThemeProvider
vi.mock("@/app/providers/ThemeProvider", () => ({
  useTheme: () => ({
    accentColor: "green",
    setAccentColor: vi.fn(),
    colorScheme: "system",
    setColorScheme: vi.fn(),
    customAccentLight: "#000000",
    customAccentDark: "#000000",
    setCustomAccentColors: vi.fn(),
  }),
}));

// Mock hooks used in SettingsPage
vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: () => null,
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({
    isFocusMode: false,
    setFocusMode: vi.fn(),
    focusOpacity: 30,
    setFocusOpacity: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({ handedness: "right", setHandedness: vi.fn() }),
}));

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn() }),
}));

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: () => ({
    isPanelAlwaysOpen: false,
    setPanelAlwaysOpen: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePanelOpen", () => ({
  usePanelOpen: () => ({ isPanelOpen: false, togglePanelOpen: vi.fn() }),
}));

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({ panelSide: "right", setPanelSide: vi.fn() }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    defaultBox: "inbox",
    setDefaultBox: vi.fn(),
    dayBoundary: "00:00",
    setDayBoundary: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSidebarNavigation", () => ({
  useSidebarNavigation: () => vi.fn(),
}));

// Mock child components
vi.mock("@/components/settings/DayBoundarySection", () => ({
  DayBoundarySection: () => null,
}));

vi.mock("@/components/settings/MenuOrderSection", () => ({
  MenuOrderSection: () => null,
}));

vi.mock("@/components/settings/ServerSection", () => ({
  ServerSection: () => null,
}));

vi.mock("@/components/tasks/Sidebar", () => ({
  Sidebar: () => null,
}));

vi.mock("@/services/localeRegistry", () => ({
  getLocaleByCode: () => ({
    code: "en",
    nativeName: "English",
    emoji: "🇺🇸",
  }),
  locales: [
    { code: "en", nativeName: "English", name: "English", emoji: "🇺🇸" },
  ],
}));

vi.mock("@/services/supabaseClientManager", () => ({
  isOauthReturn: () => false,
  clearOauthReturnFlag: vi.fn(),
}));

const feature = await loadFeature("../pin_detail_panel_settings.feature");

const SettingsPageModule = await import("@/pages/SettingsPage");
const SettingsPage = SettingsPageModule.default;

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      mockIsDetailPanelPinned = false;
      mockSetDetailPanelPinned.mockClear();
      cleanup();
    });

    // @pin-task-detail-panel @FR7
    f.Scenario(
      "Settings toggle reflects pinned state",
      ({ Given, When, Then }) => {
        Given("detail panel is pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = true;
        });

        When("SettingsPage is rendered", (_ctx: TestContext) => {
          render(React.createElement(SettingsPage));
        });

        Then("the detail panel pinned toggle is on", (_ctx: TestContext) => {
          const toggle = screen.getByTestId(
            "settings-detail-panel-pinned-toggle",
          );
          expect(toggle.getAttribute("aria-checked")).toBe("true");
        });
      },
    );

    // @pin-task-detail-panel @FR7
    f.Scenario(
      "Settings toggle reflects unpinned state",
      ({ Given, When, Then }) => {
        Given("detail panel is not pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = false;
        });

        When("SettingsPage is rendered", (_ctx: TestContext) => {
          render(React.createElement(SettingsPage));
        });

        Then("the detail panel pinned toggle is off", (_ctx: TestContext) => {
          const toggle = screen.getByTestId(
            "settings-detail-panel-pinned-toggle",
          );
          expect(toggle.getAttribute("aria-checked")).toBe("false");
        });
      },
    );

    // @pin-task-detail-panel @FR7
    f.Scenario(
      "Settings toggle changes preference",
      ({ Given, When, Then }) => {
        Given("detail panel is not pinned", (_ctx: TestContext) => {
          mockIsDetailPanelPinned = false;
        });

        When(
          "user toggles the detail panel pinned switch",
          (_ctx: TestContext) => {
            render(React.createElement(SettingsPage));
            const toggle = screen.getByTestId(
              "settings-detail-panel-pinned-toggle",
            );
            fireEvent.click(toggle);
          },
        );

        Then(
          "setDetailPanelPinned is called with true",
          (_ctx: TestContext) => {
            expect(mockSetDetailPanelPinned).toHaveBeenCalledWith(true);
          },
        );
      },
    );
  },
);
