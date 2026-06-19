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

// Mock hooks used in WorkspaceSection
vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({ handedness: "right", setHandedness: vi.fn() }),
}));

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: () => ({
    isPanelAlwaysOpen: false,
    setPanelAlwaysOpen: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({ panelSide: "right", setPanelSide: vi.fn() }),
}));

// Mock child components
vi.mock("@/components/settings/MenuOrderSection", () => ({
  MenuOrderSection: () => null,
}));

const feature = await loadFeature("../pin_detail_panel_settings.feature");

const { WorkspaceSection } = await import(
  "@/components/settings/WorkspaceSection"
);

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
          render(React.createElement(WorkspaceSection));
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
          render(React.createElement(WorkspaceSection));
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
            render(React.createElement(WorkspaceSection));
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
