// implements FR2, FR3 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import {
  firePointerDown,
  firePointerMove,
  firePointerUp,
  renderSwipeGestureHook,
  setupSwipeGestureFeature,
} from "@/hooks/useSwipeGesture.test-utils";

const SWIPE_DISTANCE_PX = 40;
const ABOVE_THRESHOLD_OFFSET = 10;

/** No-op Given — actual setup happens in the When step */
const renderInWhen = (_ctx: TestContext) => {
  // render in When
};

/** Shared When: render with swipeLeft, then swipe left by SWIPE_DISTANCE_PX */
const swipeLeftWithLeftConfig = (
  state: ReturnType<typeof setupSwipeGestureFeature>,
) => {
  return (_ctx: TestContext) => {
    state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
      swipeLeft: state.leftConfig,
    });
    act(() => {
      firePointerDown(state.swipeContext.element, SWIPE_DISTANCE_PX, 0);
      firePointerMove(0, 0);
    });
  };
};

/** Shared When: render with swipeLeft only, then swipe right */
const swipeRightWithOnlyLeftConfig = (
  state: ReturnType<typeof setupSwipeGestureFeature>,
) => {
  return (_ctx: TestContext) => {
    state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
      swipeLeft: state.leftConfig,
    });
    act(() => {
      firePointerDown(state.swipeContext.element, 0, 0);
      firePointerMove(SWIPE_DISTANCE_PX, 0);
    });
  };
};

const feature = await loadFeature("../swipe_gesture_left_swipe.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    // @swipeable-item @FR2
    f.Scenario(
      "Left swipe tracked when swipeLeft configured",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture is rendered with swipeLeft configured",
          renderInWhen,
        );

        When("user swipes left by 40 pixels", swipeLeftWithLeftConfig(state));

        Then("translateX equals -40", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            -SWIPE_DISTANCE_PX,
          );
        });

        And('direction is "left"', (_ctx: TestContext) => {
          expect(state.hookResult.result.current.direction).toBe("left");
        });
      },
    );

    // @swipeable-item @FR2
    f.Scenario(
      "activeAction matches left config during left swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeLeft configured",
          renderInWhen,
        );

        When("user swipes left by 40 pixels", swipeLeftWithLeftConfig(state));

        Then(
          "activeAction equals the swipeLeft config",
          (_ctx: TestContext) => {
            expect(state.hookResult.result.current.activeAction).toBe(
              state.leftConfig,
            );
          },
        );
      },
    );

    // @swipeable-item @FR3
    f.Scenario(
      "Threshold reached on sufficient left swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeLeft configured",
          renderInWhen,
        );

        When(
          "user swipes left to exactly the threshold distance",
          (_ctx: TestContext) => {
            const threshold = state.swipeContext.threshold;
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeLeft: state.leftConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, threshold, 0);
              firePointerMove(0, 0);
            });
          },
        );

        Then("isThresholdReached is true", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(true);
        });
      },
    );

    // @swipeable-item @FR3
    f.Scenario(
      "Left action fires on release past threshold",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeLeft configured",
          renderInWhen,
        );

        When(
          "user swipes left past threshold and releases",
          (_ctx: TestContext) => {
            const distance =
              state.swipeContext.threshold + ABOVE_THRESHOLD_OFFSET;
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeLeft: state.leftConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, distance, 0);
              firePointerMove(0, 0);
              firePointerUp();
            });
          },
        );

        Then("swipeLeft onAction is called once", (_ctx: TestContext) => {
          expect(state.onLeftAction).toHaveBeenCalledOnce();
        });
      },
    );

    // @swipeable-item @FR2
    f.Scenario(
      "Right swipe ignored when only swipeLeft configured",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with only swipeLeft configured",
          renderInWhen,
        );

        When(
          "user swipes right by 40 pixels",
          swipeRightWithOnlyLeftConfig(state),
        );

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });
      },
    );

    // @swipeable-item @FR2
    f.Scenario(
      "Left swipe ignored when only swipeRight configured",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with only swipeRight configured",
          renderInWhen,
        );

        When("user swipes left by 40 pixels", (_ctx: TestContext) => {
          state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
            swipeRight: state.rightConfig,
          });
          act(() => {
            firePointerDown(state.swipeContext.element, SWIPE_DISTANCE_PX, 0);
            firePointerMove(0, 0);
          });
        });

        Then("translateX remains 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });
      },
    );

    // @swipeable-item @FR2
    f.Scenario(
      "activeAction is null when no config for direction",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with only swipeLeft configured",
          renderInWhen,
        );

        When(
          "user swipes right by 40 pixels",
          swipeRightWithOnlyLeftConfig(state),
        );

        Then("activeAction is null", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.activeAction).toBeNull();
        });
      },
    );
  },
);
