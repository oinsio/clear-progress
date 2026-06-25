// implements FR7 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

let mockIsDesktop = true;

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";

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

    // --- Panel open scenarios ---

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Desktop defaults for panel open state",
      ({ Given, And, When, Then }) => {
        let isPanelOpen: boolean;

        Given("the user is on a desktop device", givenDesktopDevice);

        And(
          "no panel open state is saved in localStorage",
          givenNoSavedPreference,
        );

        When("the panel open preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelOpen());
          isPanelOpen = result.current.isPanelOpen;
        });

        Then("the panel is open", (_ctx: TestContext) => {
          expect(isPanelOpen).toBe(true);
        });
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Mobile defaults for panel open state",
      ({ Given, And, When, Then }) => {
        let isPanelOpen: boolean;

        Given("the user is on a mobile device", givenMobileDevice);

        And(
          "no panel open state is saved in localStorage",
          givenNoSavedPreference,
        );

        When("the panel open preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelOpen());
          isPanelOpen = result.current.isPanelOpen;
        });

        Then("the panel is closed", (_ctx: TestContext) => {
          expect(isPanelOpen).toBe(false);
        });
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Saved panel open state overrides mobile default",
      ({ Given, And, When, Then }) => {
        let isPanelOpen: boolean;

        Given("the user is on a mobile device", givenMobileDevice);

        And(
          "panel open state {string} is saved in localStorage",
          (_ctx: TestContext, savedValue: string) => {
            localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, savedValue);
          },
        );

        When("the panel open preference is loaded", (_ctx: TestContext) => {
          const { result } = renderHook(() => usePanelOpen());
          isPanelOpen = result.current.isPanelOpen;
        });

        Then("the panel is open", (_ctx: TestContext) => {
          expect(isPanelOpen).toBe(true);
        });
      },
    );

    // --- Filter bar position scenarios ---

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Desktop defaults for filter bar position",
      ({ Given, And, When, Then }) => {
        let filterBarPosition: string;

        Given("the user is on a desktop device", givenDesktopDevice);

        And(
          "no filter bar position is saved in localStorage",
          givenNoSavedPreference,
        );

        When(
          "the filter bar position preference is loaded",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useFilterBarPosition());
            filterBarPosition = result.current.filterBarPosition;
          },
        );

        Then(
          "the filter bar position is {string}",
          (_ctx: TestContext, expectedPosition: string) => {
            expect(filterBarPosition).toBe(expectedPosition);
          },
        );
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Mobile defaults for filter bar position",
      ({ Given, And, When, Then }) => {
        let filterBarPosition: string;

        Given("the user is on a mobile device", givenMobileDevice);

        And(
          "no filter bar position is saved in localStorage",
          givenNoSavedPreference,
        );

        When(
          "the filter bar position preference is loaded",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useFilterBarPosition());
            filterBarPosition = result.current.filterBarPosition;
          },
        );

        Then(
          "the filter bar position is {string}",
          (_ctx: TestContext, expectedPosition: string) => {
            expect(filterBarPosition).toBe(expectedPosition);
          },
        );
      },
    );

    // @improve-sidebar-ux @FR7
    f.Scenario(
      "Saved filter bar position overrides desktop default",
      ({ Given, And, When, Then }) => {
        let filterBarPosition: string;

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
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useFilterBarPosition());
            filterBarPosition = result.current.filterBarPosition;
          },
        );

        Then(
          "the filter bar position is {string}",
          (_ctx: TestContext, expectedPosition: string) => {
            expect(filterBarPosition).toBe(expectedPosition);
          },
        );
      },
    );
  },
);
