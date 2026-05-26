// implements FR9, FR10, FR11, FR12 of swipe-actions-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";
import {
  fireTouchMove,
  fireTouchStart,
  renderSwipeHook,
  setupSwipeFeature,
} from "@/hooks/useSwipeAction.test-utils";

const RUBBER_BAND_MULTIPLIER = 3;
const CLAMP_MULTIPLIER = 1.5;
const RESIZED_WIDTH_PX = 768;
const ABOVE_THRESHOLD_OFFSET = 10;

const feature = await loadFeature("../swipe_action_edge_cases.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeFeature(f);

    // @swipe-actions-spec @FR9
    f.Scenario(
      "TranslateX clamped at 1.5x threshold",
      ({ Given, When, Then }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in When
        });

        When(
          "user swipes right to 3x threshold distance",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeHook(
              state.swipeContext.ref,
              state.onAction,
            );
            act(() => {
              fireTouchStart(state.swipeContext.element, 0, 0);
              fireTouchMove(
                state.swipeContext.element,
                state.swipeContext.threshold * RUBBER_BAND_MULTIPLIER,
                0,
              );
            });
          },
        );

        Then("translateX equals 1.5x threshold", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            state.swipeContext.threshold * CLAMP_MULTIPLIER,
          );
        });
      },
    );

    // @swipe-actions-spec @FR10
    f.Scenario(
      "Touch on data-no-swipe element is ignored",
      ({ Given, When, Then, And }) => {
        let noSwipeChild: HTMLButtonElement;

        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          state.hookResult = renderSwipeHook(
            state.swipeContext.ref,
            state.onAction,
          );
        });

        And(
          "a child element has the data-no-swipe attribute",
          (_ctx: TestContext) => {
            noSwipeChild = document.createElement("button");
            noSwipeChild.setAttribute("data-no-swipe", "true");
            state.swipeContext.element.appendChild(noSwipeChild);
          },
        );

        When(
          "touch starts on the data-no-swipe element and moves right",
          (_ctx: TestContext) => {
            act(() => {
              fireTouchStart(state.swipeContext.element, 0, 0, noSwipeChild);
              fireTouchMove(
                state.swipeContext.element,
                state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
                0,
              );
            });
          },
        );

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });
      },
    );

    // @swipe-actions-spec @FR11
    f.Scenario(
      "Threshold updates after window resize",
      ({ Given, When, Then, And }) => {
        Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
          // render happens in And step
        });

        When("window is resized to 768 pixels wide", (_ctx: TestContext) => {
          // resize happens in And step
        });

        And(
          "user swipes right to new threshold distance",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeHook(
              state.swipeContext.ref,
              state.onAction,
            );
            act(() => {
              Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: RESIZED_WIDTH_PX,
              });
              window.dispatchEvent(new Event("resize"));
            });
            const newThreshold =
              RESIZED_WIDTH_PX * SWIPE_COMPLETE_THRESHOLD_PERCENT;
            act(() => {
              fireTouchStart(state.swipeContext.element, 0, 0);
              fireTouchMove(state.swipeContext.element, newThreshold, 0);
            });
          },
        );

        Then("isThresholdReached is true", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(true);
        });
      },
    );

    // @swipe-actions-spec @FR12
    f.Scenario("Listeners removed on unmount", ({ Given, When, Then, And }) => {
      let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

      Given("useSwipeAction is rendered and enabled", (_ctx: TestContext) => {
        removeEventListenerSpy = vi.spyOn(
          state.swipeContext.element,
          "removeEventListener",
        );
        state.hookResult = renderSwipeHook(
          state.swipeContext.ref,
          state.onAction,
        );
      });

      When("the hook unmounts", (_ctx: TestContext) => {
        state.hookResult.unmount();
      });

      Then(
        "touchstart listener is removed from the element",
        (_ctx: TestContext) => {
          expect(removeEventListenerSpy).toHaveBeenCalledWith(
            "touchstart",
            expect.any(Function),
          );
        },
      );

      And(
        "touchmove listener is removed from the element",
        (_ctx: TestContext) => {
          expect(removeEventListenerSpy).toHaveBeenCalledWith(
            "touchmove",
            expect.any(Function),
          );
        },
      );

      And(
        "touchend listener is removed from the element",
        (_ctx: TestContext) => {
          expect(removeEventListenerSpy).toHaveBeenCalledWith(
            "touchend",
            expect.any(Function),
          );
        },
      );
    });
  },
);
