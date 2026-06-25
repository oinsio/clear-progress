// implements FR2, FR3 of swipeable-item
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

const SWIPE_DISTANCE_PX = 40;
const ABOVE_THRESHOLD_OFFSET = 10;
const SLOW_VELOCITY_MOVE_PX = 2;

const feature = await loadFeature("../swipe_gesture_right_swipe.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    function renderAndSwipe(distance: number, release: boolean): void {
      state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
        swipeRight: state.rightConfig,
      });
      act(() => {
        firePointerDown(state.swipeContext.element, 0, 0);
        firePointerMove(distance, 0);
        if (release) {
          firePointerUp();
        }
      });
    }

    // @swipeable-item @FR2
    f.Scenario(
      "Right swipe tracked when swipeRight configured",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When("user swipes right by 40 pixels", (_ctx: TestContext) => {
          renderAndSwipe(SWIPE_DISTANCE_PX, false);
        });

        Then("translateX equals 40", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            SWIPE_DISTANCE_PX,
          );
        });

        And('direction is "right"', (_ctx: TestContext) => {
          expect(state.hookResult.result.current.direction).toBe("right");
        });
      },
    );

    // @swipeable-item @FR2
    f.Scenario(
      "activeAction matches right config during right swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When("user swipes right by 40 pixels", (_ctx: TestContext) => {
          renderAndSwipe(SWIPE_DISTANCE_PX, false);
        });

        Then(
          "activeAction equals the swipeRight config",
          (_ctx: TestContext) => {
            expect(state.hookResult.result.current.activeAction).toBe(
              state.rightConfig,
            );
          },
        );
      },
    );

    // @swipeable-item @FR3
    f.Scenario(
      "Threshold reached on sufficient right swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

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

    // @swipeable-item @FR3
    f.Scenario(
      "Threshold not reached on insufficient right swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

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

    // @swipeable-item @FR3
    f.Scenario(
      "Right action fires on release past threshold",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user swipes right past threshold and releases",
          (_ctx: TestContext) => {
            renderAndSwipe(
              state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET,
              true,
            );
          },
        );

        Then("swipeRight onAction is called once", (_ctx: TestContext) => {
          expect(state.onRightAction).toHaveBeenCalledOnce();
        });
      },
    );

    // @swipeable-item @FR3
    f.Scenario(
      "Action does not fire on release below threshold",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user swipes right below threshold and releases with low velocity",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              // Move just past drag start but well below threshold
              firePointerMove(SWIPE_DRAG_START_PX + SLOW_VELOCITY_MOVE_PX, 0);
            });
            // Separate act for time gap (low velocity)
            act(() => {
              firePointerUp();
            });
          },
        );

        Then("swipeRight onAction is not called", (_ctx: TestContext) => {
          expect(state.onRightAction).not.toHaveBeenCalled();
        });
      },
    );
  },
);
