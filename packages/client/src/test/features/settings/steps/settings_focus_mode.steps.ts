// implements FR4, FR8 of settings-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { DEFAULT_FOCUS_OPACITY, STORAGE_KEYS } from "@/constants";
import { useFocusMode } from "@/hooks/useFocusMode";

const feature = await loadFeature("../settings_focus_mode.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    // @settings-specs-and-bdd @FR4 @FR8
    f.Scenario("Default focus mode is enabled", ({ When, Then }) => {
      let hookResult: ReturnType<typeof useFocusMode>;

      When("no focus mode has been saved", (_ctx: TestContext) => {
        const { result } = renderHook(() => useFocusMode());
        hookResult = result.current;
      });

      Then("focus mode is true", (_ctx: TestContext) => {
        expect(hookResult.isFocusMode).toBe(true);
      });
    });

    // @settings-specs-and-bdd @FR4 @FR8
    f.Scenario("Default focus opacity is 30", ({ When, Then }) => {
      let hookResult: ReturnType<typeof useFocusMode>;

      When("no focus opacity has been saved", (_ctx: TestContext) => {
        const { result } = renderHook(() => useFocusMode());
        hookResult = result.current;
      });

      Then("focus opacity is 30", (_ctx: TestContext) => {
        expect(hookResult.focusOpacity).toBe(DEFAULT_FOCUS_OPACITY);
      });
    });

    // @settings-specs-and-bdd @FR4 @FR8
    f.Scenario("Focus mode toggle persists", ({ When, Then }) => {
      When("focus mode is set to false", (_ctx: TestContext) => {
        const { result } = renderHook(() => useFocusMode());
        act(() => {
          result.current.setFocusMode(false);
        });
      });

      Then(
        'localStorage contains "false" under the focus mode key',
        (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.FOCUS_MODE)).toBe("false");
        },
      );
    });

    // @settings-specs-and-bdd @FR4 @FR8
    f.Scenario("Focus opacity persists as number", ({ When, Then }) => {
      When("focus opacity is set to 15", (_ctx: TestContext) => {
        const { result } = renderHook(() => useFocusMode());
        act(() => {
          result.current.setFocusOpacity(15);
        });
      });

      Then(
        'localStorage contains "15" under the focus opacity key',
        (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.FOCUS_OPACITY)).toBe("15");
        },
      );
    });

    // @settings-specs-and-bdd @FR4 @FR8
    f.Scenario("Invalid opacity falls back to default", ({ When, Then }) => {
      let hookResult: ReturnType<typeof useFocusMode>;

      When(
        'localStorage contains "not-a-number" under the focus opacity key',
        (_ctx: TestContext) => {
          localStorage.setItem(STORAGE_KEYS.FOCUS_OPACITY, "not-a-number");
        },
      );

      Then("focus opacity is 30", (_ctx: TestContext) => {
        const { result } = renderHook(() => useFocusMode());
        hookResult = result.current;
        expect(hookResult.focusOpacity).toBe(DEFAULT_FOCUS_OPACITY);
      });
    });
  },
);
