// implements FR18 of swipe-actions-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type React from "react";
import { expect, type TestContext, vi } from "vitest";
import { LONG_PRESS_THRESHOLD_MS } from "@/constants";
import { createTouchEvent, setupHook } from "@/hooks/useLongPress.test-utils";
import {
  type LongPressFeatureContext,
  setupLongPressLifecycle,
  TOUCH_START_X,
  TOUCH_START_Y,
} from "./long_press.test-utils";

const CUSTOM_THRESHOLD_MS = 1000;
const CUSTOM_MOVE_THRESHOLD_PX = 20;
const MOVE_WITHIN_CUSTOM_OFFSET = 2;
const QUICK_TAP_DURATION_MS = 200;

const feature = await loadFeature("../long_press_options.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<LongPressFeatureContext>) => {
    const mocks = setupLongPressLifecycle(f);

    // @swipe-actions-spec @FR18
    f.Scenario(
      "Custom time threshold delays activation",
      ({ Given, When, Then }) => {
        let hookInstance: ReturnType<typeof setupHook>;

        Given("long press threshold is set to 1000ms", (_ctx: TestContext) => {
          hookInstance = setupHook(
            mocks.onLongPress,
            mocks.onClick,
            CUSTOM_THRESHOLD_MS,
          );
        });

        When("user holds touch for 500ms", (_ctx: TestContext) => {
          const touchStartEvent = createTouchEvent(
            "touchstart",
            TOUCH_START_X,
            TOUCH_START_Y,
          );
          hookInstance.result.current.onTouchStart(touchStartEvent);
          vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
        });

        Then("onLongPress is not called", (_ctx: TestContext) => {
          expect(mocks.onLongPress).not.toHaveBeenCalled();
        });

        When(
          "user continues holding until 1000ms total",
          (_ctx: TestContext) => {
            vi.advanceTimersByTime(
              CUSTOM_THRESHOLD_MS - LONG_PRESS_THRESHOLD_MS,
            );
          },
        );

        Then("onLongPress is called", (_ctx: TestContext) => {
          expect(mocks.onLongPress).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @swipe-actions-spec @FR18
    f.Scenario(
      "Custom move threshold allows more movement",
      ({ Given, When, Then }) => {
        Given(
          "long press move threshold is set to 20 pixels",
          (_ctx: TestContext) => {
            // setup happens in When
          },
        );

        When(
          "user moves finger by 18 pixels during hold and waits",
          (_ctx: TestContext) => {
            const { result } = setupHook(
              mocks.onLongPress,
              mocks.onClick,
              undefined,
              CUSTOM_MOVE_THRESHOLD_PX,
            );
            const touchStartEvent = createTouchEvent(
              "touchstart",
              TOUCH_START_X,
              TOUCH_START_Y,
            );
            const touchMoveEvent = new TouchEvent("touchmove", {
              touches: [
                {
                  clientX:
                    TOUCH_START_X +
                    CUSTOM_MOVE_THRESHOLD_PX -
                    MOVE_WITHIN_CUSTOM_OFFSET,
                  clientY: TOUCH_START_Y,
                } as Touch,
              ],
            });
            result.current.onTouchStart(touchStartEvent);
            result.current.onTouchMove(
              touchMoveEvent as unknown as React.TouchEvent,
            );
            vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
          },
        );

        Then("onLongPress is called", (_ctx: TestContext) => {
          expect(mocks.onLongPress).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @swipe-actions-spec @FR18
    f.Scenario(
      "Without onClick callback quick tap does nothing",
      ({ Given, When, Then }) => {
        Given("no onClick callback is provided", (_ctx: TestContext) => {
          // onClick will not be passed
        });

        When("user taps and releases before threshold", (_ctx: TestContext) => {
          const { result } = setupHook(mocks.onLongPress);
          const touchStartEvent = createTouchEvent(
            "touchstart",
            TOUCH_START_X,
            TOUCH_START_Y,
          );
          const touchEndEvent = createTouchEvent(
            "touchend",
            TOUCH_START_X,
            TOUCH_START_Y,
          );
          result.current.onTouchStart(touchStartEvent);
          vi.advanceTimersByTime(QUICK_TAP_DURATION_MS);
          result.current.onTouchEnd(touchEndEvent);
        });

        Then("onLongPress is not called", (_ctx: TestContext) => {
          expect(mocks.onLongPress).not.toHaveBeenCalled();
        });
      },
    );
  },
);
