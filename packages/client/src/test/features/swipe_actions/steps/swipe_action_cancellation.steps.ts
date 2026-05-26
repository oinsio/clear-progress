// implements FR7, FR8 of swipe-actions-spec
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

const LEFT_SWIPE_START_X = 100;
const LEFT_SWIPE_END_X = 50;
const LEFT_SWIPE_FAR_START_X = 200;
const VERTICAL_DOMINANT_Y = 20;
const VERTICAL_MINOR_X = 5;

const feature = await loadFeature("../swipe_action_cancellation.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeFeature(f);

    // @swipe-actions-spec @FR7
    f.Scenario(
      "Left swipe does not update translateX",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When("user swipes left", (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(
            state.swipeContext.ref,
            state.onAction,
          );
          act(() => {
            fireTouchStart(state.swipeContext.element, LEFT_SWIPE_START_X, 0);
            fireTouchMove(state.swipeContext.element, LEFT_SWIPE_END_X, 0);
          });
        });

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });
      },
    );

    // @swipe-actions-spec @FR7
    f.Scenario(
      "Left swipe does not trigger onAction",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When("user swipes left and releases", (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(
            state.swipeContext.ref,
            state.onAction,
          );
          act(() => {
            fireTouchStart(
              state.swipeContext.element,
              LEFT_SWIPE_FAR_START_X,
              0,
            );
            fireTouchMove(state.swipeContext.element, LEFT_SWIPE_END_X, 0);
            fireTouchEnd(state.swipeContext.element);
          });
        });

        Then("onAction is not called", (_ctx: TestContext) => {
          expect(state.onAction).not.toHaveBeenCalled();
        });
      },
    );

    // @swipe-actions-spec @FR8
    f.Scenario("Vertical scroll cancels swipe", ({ Given, When, Then }) => {
      Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
        // render happens in When
      });

      When(
        "user moves finger predominantly vertically",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(
            state.swipeContext.ref,
            state.onAction,
          );
          act(() => {
            fireTouchStart(state.swipeContext.element, 0, 0);
            fireTouchMove(
              state.swipeContext.element,
              VERTICAL_MINOR_X,
              VERTICAL_DOMINANT_Y,
            );
          });
        },
      );

      Then("translateX is reset to 0", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.translateX).toBe(0);
      });
    });
  },
);
