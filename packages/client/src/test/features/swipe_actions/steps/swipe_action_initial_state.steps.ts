// implements FR1, FR2 of swipe-actions-spec
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

const ABOVE_THRESHOLD_OFFSET = 10;

const feature = await loadFeature("../swipe_action_initial_state.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeFeature(f);

    // @swipe-actions-spec @FR1
    f.Scenario("Initial translateX is zero", ({ When, Then }) => {
      When(
        "useSwipeAction is rendered with an enabled ref",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(state.swipeContext.ref);
        },
      );

      Then("translateX is 0", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.translateX).toBe(0);
      });
    });

    // @swipe-actions-spec @FR1
    f.Scenario("Initial isThresholdReached is false", ({ When, Then }) => {
      When(
        "useSwipeAction is rendered with an enabled ref",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(state.swipeContext.ref);
        },
      );

      Then("isThresholdReached is false", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.isThresholdReached).toBe(false);
      });
    });

    // @swipe-actions-spec @FR2
    f.Scenario(
      "Disabled hook ignores swipe movement",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeAction is rendered with isEnabled false",
          (_ctx: TestContext) => {
            // render happens in When together with swipe
          },
        );

        When("user swipes right past threshold", (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(
            state.swipeContext.ref,
            state.onAction,
            false,
          );
          act(() => {
            fireTouchStart(state.swipeContext.element, 0, 0);
            fireTouchMove(
              state.swipeContext.element,
              state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
              0,
            );
          });
        });

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });
      },
    );

    // @swipe-actions-spec @FR2
    f.Scenario(
      "Disabled hook does not call onAction",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeAction is rendered with isEnabled false",
          (_ctx: TestContext) => {
            // render happens in When together with swipe
          },
        );

        When(
          "user swipes right past threshold and releases",
          (_ctx: TestContext) => {
            renderSwipeHook(state.swipeContext.ref, state.onAction, false);
            act(() => {
              fireTouchStart(state.swipeContext.element, 0, 0);
              fireTouchMove(
                state.swipeContext.element,
                state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
                0,
              );
              fireTouchEnd(state.swipeContext.element);
            });
          },
        );

        Then("onAction is not called", (_ctx: TestContext) => {
          expect(state.onAction).not.toHaveBeenCalled();
        });
      },
    );
  },
);
