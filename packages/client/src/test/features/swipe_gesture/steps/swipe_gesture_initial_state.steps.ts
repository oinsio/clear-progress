// implements FR1 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import {
  firePointerDown,
  firePointerMove,
  renderSwipeGestureHook,
  setupSwipeGestureFeature,
} from "@/hooks/useSwipeGesture.test-utils";

const feature = await loadFeature("../swipe_gesture_initial_state.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    // @swipeable-item @FR1
    f.Scenario("Initial state values are defaults", ({ When, Then, And }) => {
      When(
        "useSwipeGesture is rendered with a valid ref",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
            swipeRight: state.rightConfig,
          });
        },
      );

      Then("translateX is 0", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.translateX).toBe(0);
      });

      And("isThresholdReached is false", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.isThresholdReached).toBe(false);
      });

      And("direction is null", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.direction).toBeNull();
      });

      And("isSwiping is false", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.isSwiping).toBe(false);
      });

      And("activeAction is null", (_ctx: TestContext) => {
        expect(state.hookResult.result.current.activeAction).toBeNull();
      });
    });

    // @swipeable-item @FR1
    f.Scenario("Pointerdown listener attached to element", ({ When, Then }) => {
      let addEventListenerSpy: ReturnType<typeof vi.spyOn>;

      When("useSwipeGesture mounts with a valid ref", (_ctx: TestContext) => {
        addEventListenerSpy = vi.spyOn(
          state.swipeContext.element,
          "addEventListener",
        );
        state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
          swipeRight: state.rightConfig,
        });
      });

      Then(
        "pointerdown listener is attached to the element",
        (_ctx: TestContext) => {
          expect(addEventListenerSpy).toHaveBeenCalledWith(
            "pointerdown",
            expect.any(Function),
          );
        },
      );
    });

    // @swipeable-item @FR1
    f.Scenario(
      "Document listeners attached after pointerdown",
      ({ Given, When, Then }) => {
        const SWIPE_DISTANCE_PX = 40;

        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            // render in When
          },
        );

        When(
          "pointerdown fires and pointer moves right",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(SWIPE_DISTANCE_PX, 0);
            });
          },
        );

        Then(
          "translateX reflects the pointer movement",
          (_ctx: TestContext) => {
            expect(state.hookResult.result.current.translateX).toBe(
              SWIPE_DISTANCE_PX,
            );
          },
        );
      },
    );
  },
);
