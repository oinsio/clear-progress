// implements FR7 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { LEGACY_PANEL_OPEN_KEY } from "@/hooks/useSidebarMode";

let mockIsDesktop = true;

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarMode } from "@/hooks/useSidebarMode";

const feature = await loadFeature("../sidebar_defaults.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      localStorage.clear();
      mockIsDesktop = true;
    });

    // --- Shared Given steps ---

    const givenDesktopDevice = (_ctx: TestContext) => {
      mockIsDesktop = true;
    };

    const givenMobileDevice = (_ctx: TestContext) => {
      mockIsDesktop = false;
    };

    const givenNoSavedPreference = (_ctx: TestContext) => {
      // localStorage already cleared in BeforeEachScenario
    };

    // --- Panel side scenarios ---

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Desktop defaults for panel side",
      ({ Given, And, When, Then }) => {
        let panelSide: string;

        Given("the user is on a desktop device", givenDesktopDevice);

        And("no panel side is saved in localStorage", givenNoSavedPreference);

        When("the panel side preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelSide());
          panelSide = result.current.panelSide;
        });

        Then(
          "the panel side is {string}",
          (_ctx: TestContext, expectedSide: string) => {
            expect(panelSide).toBe(expectedSide);
          },
        );
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Mobile defaults for panel side",
      ({ Given, And, When, Then }) => {
        let panelSide: string;

        Given("the user is on a mobile device", givenMobileDevice);

        And("no panel side is saved in localStorage", givenNoSavedPreference);

        When("the panel side preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelSide());
          panelSide = result.current.panelSide;
        });

        Then(
          "the panel side is {string}",
          (_ctx: TestContext, expectedSide: string) => {
            expect(panelSide).toBe(expectedSide);
          },
        );
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Saved panel side overrides desktop default",
      ({ Given, And, When, Then }) => {
        let panelSide: string;

        Given("the user is on a desktop device", givenDesktopDevice);

        And(
          "panel side {string} is saved in localStorage",
          (_ctx: TestContext, savedSide: string) => {
            localStorage.setItem(STORAGE_KEYS.PANEL_SIDE, savedSide);
          },
        );

        When("the panel side preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelSide());
          panelSide = result.current.panelSide;
        });

        Then(
          "the panel side is {string}",
          (_ctx: TestContext, expectedSide: string) => {
            expect(panelSide).toBe(expectedSide);
          },
        );
      },
    );

    // --- Shared sidebar mode steps ---

    const whenSidebarModeLoaded = (_ctx: TestContext) => {
      const { result } = renderHook(() => useSidebarMode());
      sidebarMode = result.current[0];
    };

    const thenSidebarModeIs = (_ctx: TestContext, expectedMode: string) => {
      expect(sidebarMode).toBe(expectedMode);
    };

    // --- Sidebar mode scenarios (using useSidebarMode) ---

    let sidebarMode: string;

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Desktop defaults for sidebar mode",
      ({ Given, And, When, Then }) => {
        Given("the user is on a desktop device", givenDesktopDevice);
        And("no sidebar mode is saved in localStorage", givenNoSavedPreference);
        When("the sidebar mode preference is loaded", whenSidebarModeLoaded);
        Then("the sidebar mode is {string}", thenSidebarModeIs);
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Mobile defaults for sidebar mode",
      ({ Given, And, When, Then }) => {
        Given("the user is on a mobile device", givenMobileDevice);
        And("no sidebar mode is saved in localStorage", givenNoSavedPreference);
        When("the sidebar mode preference is loaded", whenSidebarModeLoaded);
        Then("the sidebar mode is {string}", thenSidebarModeIs);
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Legacy panel open migrates to sidebar mode",
      ({ Given, And, When, Then }) => {
        Given("the user is on a mobile device", givenMobileDevice);

        And(
          "legacy panel open {string} is saved in localStorage",
          (_ctx: TestContext, savedValue: string) => {
            localStorage.setItem(LEGACY_PANEL_OPEN_KEY, savedValue);
          },
        );

        When("the sidebar mode preference is loaded", whenSidebarModeLoaded);
        Then("the sidebar mode is {string}", thenSidebarModeIs);
      },
    );

    // --- Shared filter bar position steps ---

    let filterBarPosition: string;

    const whenFilterBarPositionLoaded = (_ctx: TestContext) => {
      const { result } = renderHook(() => useFilterBarPosition());
      filterBarPosition = result.current.filterBarPosition;
    };

    const thenFilterBarPositionIs = (
      _ctx: TestContext,
      expectedPosition: string,
    ) => {
      expect(filterBarPosition).toBe(expectedPosition);
    };

    // --- Filter bar position scenarios ---

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Desktop defaults for filter bar position",
      ({ Given, And, When, Then }) => {
        Given("the user is on a desktop device", givenDesktopDevice);
        And(
          "no filter bar position is saved in localStorage",
          givenNoSavedPreference,
        );
        When(
          "the filter bar position preference is loaded",
          whenFilterBarPositionLoaded,
        );
        Then("the filter bar position is {string}", thenFilterBarPositionIs);
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Mobile defaults for filter bar position",
      ({ Given, And, When, Then }) => {
        Given("the user is on a mobile device", givenMobileDevice);
        And(
          "no filter bar position is saved in localStorage",
          givenNoSavedPreference,
        );
        When(
          "the filter bar position preference is loaded",
          whenFilterBarPositionLoaded,
        );
        Then("the filter bar position is {string}", thenFilterBarPositionIs);
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Saved filter bar position overrides desktop default",
      ({ Given, And, When, Then }) => {
        Given("the user is on a desktop device", givenDesktopDevice);

        And(
          "filter bar position {string} is saved in localStorage",
          (_ctx: TestContext, savedPosition: string) => {
            localStorage.setItem(
              STORAGE_KEYS.FILTER_BAR_POSITION,
              savedPosition,
            );
          },
        );

        When(
          "the filter bar position preference is loaded",
          whenFilterBarPositionLoaded,
        );
        Then("the filter bar position is {string}", thenFilterBarPositionIs);
      },
    );
  },
);
