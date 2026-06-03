// implements FR13 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { useHandedness } from "@/hooks/useHandedness";

const feature = await loadFeature("../handedness_preference.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    // @command-bar @FR13
    f.Scenario('Default handedness is "right"', ({ Given, When, Then }) => {
      let hookResult: ReturnType<typeof useHandedness>;

      Given("no handedness preference has been saved", (_ctx: TestContext) => {
        // localStorage already cleared in BeforeEachScenario
      });

      When("the system reads the handedness setting", (_ctx: TestContext) => {
        const { result } = renderHook(() => useHandedness());
        hookResult = result.current;
      });

      Then('handedness is "right"', (_ctx: TestContext) => {
        expect(hookResult.handedness).toBe("right");
      });
    });

    // @command-bar @FR13
    f.Scenario(
      'Setting to "left" persists in localStorage',
      ({ When, Then }) => {
        When('user sets handedness to "left"', (_ctx: TestContext) => {
          const { result } = renderHook(() => useHandedness());
          act(() => {
            result.current.setHandedness("left");
          });
        });

        Then(
          'localStorage contains "left" under the handedness key',
          (_ctx: TestContext) => {
            expect(localStorage.getItem(STORAGE_KEYS.HANDEDNESS)).toBe("left");
          },
        );
      },
    );

    // @command-bar @FR13
    f.Scenario(
      'Invalid stored value falls back to "right"',
      ({ Given, When, Then }) => {
        let hookResult: ReturnType<typeof useHandedness>;

        Given(
          'localStorage contains "invalid" under the handedness key',
          (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.HANDEDNESS, "invalid");
          },
        );

        When("the system reads the handedness setting", (_ctx: TestContext) => {
          const { result } = renderHook(() => useHandedness());
          hookResult = result.current;
        });

        Then('handedness is "right"', (_ctx: TestContext) => {
          expect(hookResult.handedness).toBe("right");
        });
      },
    );
  },
);
