// implements FR3, FR4, FR5, FR6 of swipe-actions-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import {
  fireTouchEnd,
  fireTouchMove,
  fireTouchStart,
  renderSwipeHook,
  setupSwipeFeature,
} from "@/hooks/useSwipeAction.test-utils";

const SWIPE_DISTANCE_PX = 40;
const ABOVE_THRESHOLD_OFFSET = 10;

const feature = await loadFeature("../swipe_action_right_swipe.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeFeature(f);

    function renderAndSwipe(distance: number, release: boolean): void {
      state.hookResult = renderSwipeHook(
        state.swipeContext.ref,
        state.onAction,
      );
      act(() => {
        fireTouchStart(state.swipeContext.element, 0, 0);
        fireTouchMove(state.swipeContext.element, distance, 0);
        if (release) {
          fireTouchEnd(state.swipeContext.element);
        }
      });
    }

    // @swipe-actions-spec @FR3
    f.Scenario(
      "TranslateX updates during right swipe",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When("user swipes right by 40 pixels", (_ctx: TestContext) => {
          renderAndSwipe(SWIPE_DISTANCE_PX, false);
        });

        Then("translateX equals 40", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            SWIPE_DISTANCE_PX,
          );
        });
      },
    );

    // @swipe-actions-spec @FR4
    f.Scenario(
      "Threshold reached on sufficient swipe",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right to exactly the threshold distance",
          (_ctx: TestContext) => {
            renderAndSwipe(state.swipeContext.threshold, false);
          },
        );

        Then("isThresholdReached is true", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(true);
        });
      },
    );

    // @swipe-actions-spec @FR4
    f.Scenario(
      "Threshold not reached on insufficient swipe",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right to threshold minus 1 pixel",
          (_ctx: TestContext) => {
            renderAndSwipe(state.swipeContext.threshold - 1, false);
          },
        );

        Then("isThresholdReached is false", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(
            false,
          );
        });
      },
    );

    // @swipe-actions-spec @FR5
    f.Scenario(
      "Action fires on release past threshold",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right past threshold and releases",
          (_ctx: TestContext) => {
            renderAndSwipe(
              state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
              true,
            );
          },
        );

        Then("onAction is called once", (_ctx: TestContext) => {
          expect(state.onAction).toHaveBeenCalledOnce();
        });
      },
    );

    // @swipe-actions-spec @FR5
    f.Scenario(
      "Action does not fire on release below threshold",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right below threshold and releases",
          (_ctx: TestContext) => {
            renderAndSwipe(state.swipeContext.threshold - 1, true);
          },
        );

        Then("onAction is not called", (_ctx: TestContext) => {
          expect(state.onAction).not.toHaveBeenCalled();
        });
      },
    );

    // @swipe-actions-spec @FR6
    f.Scenario(
      "State resets after release past threshold",
      ({ Given, When, Then, And }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right past threshold and releases",
          (_ctx: TestContext) => {
            renderAndSwipe(
              state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
              true,
            );
          },
        );

        Then("translateX is 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });

        And("isThresholdReached is false", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(
            false,
          );
        });
      },
    );
  },
);
