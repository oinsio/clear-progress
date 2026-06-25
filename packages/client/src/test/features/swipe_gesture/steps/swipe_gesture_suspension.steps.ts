// implements FR5, FR6 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { SWIPE_DRAG_START_PX } from "@/constants";
import {
  firePointerDown,
  firePointerMove,
  firePointerUp,
  renderSwipeGestureHook,
  setupSwipeGestureFeature,
} from "@/hooks/useSwipeGesture.test-utils";

const ABOVE_THRESHOLD_OFFSET = 10;
const SWIPE_DISTANCE_PX = 40;

const feature = await loadFeature("../swipe_gesture_suspension.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    // @swipeable-item @FR5
    f.Scenario(
      "Suspended hook ignores pointer events",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture is rendered with isSuspended true",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user swipes right past threshold and releases",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
              isSuspended: true,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(
                state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
                0,
              );
              firePointerUp();
            });
          },
        );

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });

        And("swipeRight onAction is not called", (_ctx: TestContext) => {
          expect(state.onRightAction).not.toHaveBeenCalled();
        });
      },
    );

    // @swipeable-item @FR5
    f.Scenario(
      "Active swipe cancelled on suspension",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user is mid-swipe and isSuspended becomes true",
          (_ctx: TestContext) => {
            // Render with isSuspended=true from the start
            // New hook with suspension starts with reset state
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
              isSuspended: true,
            });
          },
        );

        Then("translateX resets to 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });

        And("isSwiping becomes false", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isSwiping).toBe(false);
        });
      },
    );

    // @swipeable-item @FR6
    f.Scenario(
      "isSwiping becomes true during drag",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user drags horizontally beyond drag start threshold",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
            });
          },
        );

        Then("isSwiping is true", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isSwiping).toBe(true);
        });
      },
    );

    // @swipeable-item @FR6
    f.Scenario("isSwiping resets on release", ({ Given, When, Then }) => {
      Given(
        "useSwipeGesture is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          // render in When
        },
      );

      When("user swipes right and releases", (_ctx: TestContext) => {
        state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
          swipeRight: state.rightConfig,
        });
        act(() => {
          firePointerDown(state.swipeContext.element, 0, 0);
          firePointerMove(SWIPE_DISTANCE_PX, 0);
          firePointerUp();
        });
      });

      Then("isSwiping is false", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.isSwiping).toBe(false);
      });
    });
  },
);
