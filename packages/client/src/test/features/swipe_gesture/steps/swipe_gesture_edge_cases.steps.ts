// implements FR7, FR8, FR9, FR10, FR11, FR12 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import {
  SWIPE_COMPLETE_THRESHOLD_PERCENT,
  SWIPE_RUBBER_BAND_FACTOR,
} from "@/constants";
import {
  firePointerDown,
  firePointerMove,
  firePointerUp,
  renderSwipeGestureHook,
  setupSwipeGestureFeature,
} from "@/hooks/useSwipeGesture.test-utils";

const RUBBER_BAND_MULTIPLIER = 3;
const ABOVE_THRESHOLD_OFFSET = 10;
const RESIZED_WIDTH_PX = 768;
const VERTICAL_DOMINANT_Y = 20;
const VERTICAL_SMALL_X = 5;

const feature = await loadFeature("../swipe_gesture_edge_cases.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const state = setupSwipeGestureFeature(f);

    // @swipeable-item @FR7
    f.Scenario(
      "TranslateX clamped at 1.5x threshold for right swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          () => {},
        );

        When(
          "user swipes right to 3x threshold distance",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(
                state.swipeContext.threshold * RUBBER_BAND_MULTIPLIER,
                0,
              );
            });
          },
        );

        Then("translateX equals 1.5x threshold", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            state.swipeContext.threshold * SWIPE_RUBBER_BAND_FACTOR,
          );
        });
      },
    );

    // @swipeable-item @FR7
    f.Scenario(
      "TranslateX clamped at -1.5x threshold for left swipe",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeLeft configured",
          () => {},
        );

        When(
          "user swipes left to 3x threshold distance",
          (_ctx: TestContext) => {
            const distance =
              state.swipeContext.threshold * RUBBER_BAND_MULTIPLIER;
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeLeft: state.leftConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, distance, 0);
              firePointerMove(0, 0);
            });
          },
        );

        Then("translateX equals -1.5x threshold", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(
            -(state.swipeContext.threshold * SWIPE_RUBBER_BAND_FACTOR),
          );
        });
      },
    );

    // @swipeable-item @FR8
    f.Scenario(
      "Vertical scroll cancels swipe",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          () => {},
        );

        When(
          "user moves pointer predominantly vertically",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(VERTICAL_SMALL_X, VERTICAL_DOMINANT_Y);
            });
          },
        );

        Then("translateX resets to 0", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.translateX).toBe(0);
        });

        And("isSwiping is false", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isSwiping).toBe(false);
        });
      },
    );

    // @swipeable-item @FR9
    f.Scenario(
      "Pointer on data-no-swipe element is ignored",
      ({ Given, When, Then, And }) => {
        let noSwipeChild: HTMLButtonElement;

        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          () => {},
        );

        And(
          "a child element has the data-no-swipe attribute",
          (_ctx: TestContext) => {
            noSwipeChild = document.createElement("button");
            noSwipeChild.setAttribute("data-no-swipe", "true");
            state.swipeContext.element.appendChild(noSwipeChild);
          },
        );

        When(
          "pointer starts on the data-no-swipe element and moves right",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
            act(() => {
              firePointerDown(state.swipeContext.element, 0, 0, noSwipeChild);
              firePointerMove(
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

    // @swipeable-item @FR10
    f.Scenario(
      "Threshold updates after window resize",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture is rendered with swipeRight configured",
          () => {},
        );

        When(
          "window is resized and user swipes to new threshold",
          (_ctx: TestContext) => {
            state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
              swipeRight: state.rightConfig,
            });
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
              firePointerDown(state.swipeContext.element, 0, 0);
              firePointerMove(newThreshold, 0);
            });
          },
        );

        Then("isThresholdReached is true", (_ctx: TestContext) => {
          expect(state.hookResult.result.current.isThresholdReached).toBe(true);
        });
      },
    );

    // @swipeable-item @FR11
    f.Scenario("State resets after release", ({ Given, When, Then, And }) => {
      Given("useSwipeGesture is rendered with swipeRight configured", () => {});

      When(
        "user swipes right past threshold and releases",
        (_ctx: TestContext) => {
          state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
            swipeRight: state.rightConfig,
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
    });

    // @swipeable-item @FR12
    f.Scenario("Listeners removed on unmount", ({ Given, When, Then, And }) => {
      let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
      let docRemoveEventListenerSpy: ReturnType<typeof vi.spyOn>;

      Given(
        "useSwipeGesture is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          removeEventListenerSpy = vi.spyOn(
            state.swipeContext.element,
            "removeEventListener",
          );
          docRemoveEventListenerSpy = vi.spyOn(document, "removeEventListener");
          state.hookResult = renderSwipeGestureHook(state.swipeContext.ref, {
            swipeRight: state.rightConfig,
          });
        },
      );

      When("the hook unmounts", (_ctx: TestContext) => {
        state.hookResult.unmount();
      });

      Then(
        "pointerdown listener is removed from the element",
        (_ctx: TestContext) => {
          expect(removeEventListenerSpy).toHaveBeenCalledWith(
            "pointerdown",
            expect.any(Function),
          );
        },
      );

      And(
        "pointermove listener is removed from document",
        (_ctx: TestContext) => {
          expect(docRemoveEventListenerSpy).toHaveBeenCalledWith(
            "pointermove",
            expect.any(Function),
          );
        },
      );

      And(
        "pointerup listener is removed from document",
        (_ctx: TestContext) => {
          expect(docRemoveEventListenerSpy).toHaveBeenCalledWith(
            "pointerup",
            expect.any(Function),
          );
        },
      );
    });
  },
);
