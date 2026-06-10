// implements FR1, FR2, FR8 of pin-task-detail-panel
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";

const feature = await loadFeature("../pin_detail_panel_preference.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    // @pin-task-detail-panel @FR1 @FR2
    f.Scenario(
      "Default detail panel pinned is false",
      ({ Given, When, Then }) => {
        let hookResult: ReturnType<typeof useDetailPanelPinned>;

        Given(
          "no detail panel pinned preference has been saved",
          (_ctx: TestContext) => {
            // localStorage already cleared in BeforeEachScenario
          },
        );

        When(
          "the system reads the detail panel pinned setting",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useDetailPanelPinned());
            hookResult = result.current;
          },
        );

        Then("detail panel pinned is false", (_ctx: TestContext) => {
          expect(hookResult.isDetailPanelPinned).toBe(false);
        });
      },
    );

    // @pin-task-detail-panel @FR1 @FR2
    f.Scenario(
      "Setting detail panel pinned persists in localStorage",
      ({ When, Then }) => {
        When("user sets detail panel pinned to true", (_ctx: TestContext) => {
          const { result } = renderHook(() => useDetailPanelPinned());
          act(() => {
            result.current.setDetailPanelPinned(true);
          });
        });

        Then(
          'localStorage contains "true" under the detail panel pinned key',
          (_ctx: TestContext) => {
            expect(localStorage.getItem(STORAGE_KEYS.DETAIL_PANEL_PINNED)).toBe(
              "true",
            );
          },
        );
      },
    );

    // @pin-task-detail-panel @FR8
    f.Scenario(
      "Corrupted detail panel pinned self-heals",
      ({ Given, When, Then, And }) => {
        let hookResult: ReturnType<typeof useDetailPanelPinned>;

        Given(
          'localStorage contains "maybe" under the detail panel pinned key',
          (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.DETAIL_PANEL_PINNED, "maybe");
          },
        );

        When(
          "the system reads the detail panel pinned setting",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useDetailPanelPinned());
            hookResult = result.current;
          },
        );

        Then("detail panel pinned is false", (_ctx: TestContext) => {
          expect(hookResult.isDetailPanelPinned).toBe(false);
        });

        And(
          "the detail panel pinned key is removed from localStorage",
          (_ctx: TestContext) => {
            expect(
              localStorage.getItem(STORAGE_KEYS.DETAIL_PANEL_PINNED),
            ).toBeNull();
          },
        );
      },
    );

    // @pin-task-detail-panel @FR1 @FR2
    f.Scenario(
      "Stored true value is read correctly",
      ({ Given, When, Then }) => {
        let hookResult: ReturnType<typeof useDetailPanelPinned>;

        Given(
          'localStorage contains "true" under the detail panel pinned key',
          (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.DETAIL_PANEL_PINNED, "true");
          },
        );

        When(
          "the system reads the detail panel pinned setting",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useDetailPanelPinned());
            hookResult = result.current;
          },
        );

        Then("detail panel pinned is true", (_ctx: TestContext) => {
          expect(hookResult.isDetailPanelPinned).toBe(true);
        });
      },
    );

    // @pin-task-detail-panel @FR2
    f.Scenario(
      "useDetailPanelPinned returns tuple with stable setter",
      ({ When, Then }) => {
        let hookResult: ReturnType<typeof useDetailPanelPinned>;

        When("the hook is called", (_ctx: TestContext) => {
          const { result } = renderHook(() => useDetailPanelPinned());
          hookResult = result.current;
        });

        Then(
          "it returns isDetailPanelPinned and setDetailPanelPinned",
          (_ctx: TestContext) => {
            expect(typeof hookResult.isDetailPanelPinned).toBe("boolean");
            expect(typeof hookResult.setDetailPanelPinned).toBe("function");
          },
        );
      },
    );
  },
);
