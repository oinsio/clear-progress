// implements FR4 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { SWIPE_DRAG_START_PX } from "@/constants";
import {
  firePointerDown,
  firePointerMove,
  firePointerUp,
  renderSwipeGestureHook,
  setupSwipeGestureFeature,
} from "@/hooks/useSwipeGesture.test-utils";

const SHORT_SWIPE_DISTANCE_PX = 30;
const HIGH_VELOCITY_TIME_GAP_MS = 10;
const LOW_VELOCITY_TIME_GAP_MS = 500;

const feature = await loadFeature("../swipe_gesture_velocity.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    // @swipeable-item @FR4
    f.Scenario("Fast short swipe triggers action", ({ Given, When, Then }) => {
      Given(
        "useSwipeGesture is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          // render in When
        },
      );

      When(
        "user swipes right with high velocity but below distance threshold",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
            swipeRight: state.rightConfig,
          });
          const performanceNowSpy = vi.spyOn(performance, "now");
          // pointerdown at t=0
          performanceNowSpy.mockReturnValue(0);
          act(() => {
            firePointerDown(state.swipeContext.element, 0, 0);
          });
          // first pointermove at t=10 (prev)
          performanceNowSpy.mockReturnValue(HIGH_VELOCITY_TIME_GAP_MS);
          act(() => {
            firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
          });
          // second pointermove at t=20 — high velocity move
          performanceNowSpy.mockReturnValue(HIGH_VELOCITY_TIME_GAP_MS * 2);
          act(() => {
            firePointerMove(SHORT_SWIPE_DISTANCE_PX, 0);
          });
          // release
          act(() => {
            firePointerUp();
          });
          performanceNowSpy.mockRestore();
        },
      );

      Then("swipeRight onAction is called once", (_ctx: TestContext) => {
        expect(state.onRightAction).toHaveBeenCalledOnce();
      });
    });

    // @swipeable-item @FR4
    f.Scenario(
      "Slow swipe below distance does not trigger",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "user swipes right with low velocity and below distance threshold",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            const performanceNowSpy = vi.spyOn(performance, "now");
            // pointerdown at t=0
            performanceNowSpy.mockReturnValue(0);
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
            });
            // first move at t=500 (prev)
            performanceNowSpy.mockReturnValue(LOW_VELOCITY_TIME_GAP_MS);
            act(() => {
              firePointerMove(SWIPE_DRAG_START_PX + 1, 0);
            });
            // second move at t=1000 — very slow
            performanceNowSpy.mockReturnValue(LOW_VELOCITY_TIME_GAP_MS * 2);
            act(() => {
              firePointerMove(SHORT_SWIPE_DISTANCE_PX, 0);
            });
            // release
            act(() => {
              firePointerUp();
            });
            performanceNowSpy.mockRestore();
          },
        );

        Then("swipeRight onAction is not called", (_ctx: TestContext) => {
          expect(state.onRightAction).not.toHaveBeenCalled();
        });
      },
    );
  },
);
