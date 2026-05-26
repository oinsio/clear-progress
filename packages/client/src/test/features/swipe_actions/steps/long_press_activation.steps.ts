// implements FR13, FR14, FR17 of swipe-actions-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type React from "react";
import { expect, type TestContext, vi } from "vitest";
import {
  LONG_PRESS_MOVE_THRESHOLD_PX,
  LONG_PRESS_THRESHOLD_MS,
} from "@/constants";
import { createTouchEvent, setupHook } from "@/hooks/useLongPress.test-utils";
import {
  type LongPressFeatureContext,
  setupLongPressLifecycle,
  TOUCH_START_X,
  TOUCH_START_Y,
} from "./long_press.test-utils";

const MOVE_BEYOND_OFFSET = 5;
const MOVE_WITHIN_OFFSET = 2;

const feature = await loadFeature("../long_press_activation.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<LongPressFeatureContext>) => {
    const mocks = setupLongPressLifecycle(f);

    // @swipe-actions-spec @FR13
    f.Scenario(
      "Long press fires after threshold duration",
      ({ When, Then }) => {
        When(
          "user holds touch for 500ms without moving",
          (_ctx: TestContext) => {
            const { result } = setupHook(mocks.onLongPress, mocks.onClick);
            const touchStartEvent = createTouchEvent(
              "touchstart",
              TOUCH_START_X,
              TOUCH_START_Y,
            );
            result.current.onTouchStart(touchStartEvent);
            vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
          },
        );

        Then("onLongPress is called once", (_ctx: TestContext) => {
          expect(mocks.onLongPress).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @swipe-actions-spec @FR14
    f.Scenario(
      "Movement beyond threshold cancels long press",
      ({ When, Then }) => {
        When(
          "user moves finger beyond move threshold during hold",
          (_ctx: TestContext) => {
            const { result } = setupHook(mocks.onLongPress, mocks.onClick);
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
                    LONG_PRESS_MOVE_THRESHOLD_PX +
                    MOVE_BEYOND_OFFSET,
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

        Then(
          "onLongPress is not called after threshold duration",
          (_ctx: TestContext) => {
            expect(mocks.onLongPress).not.toHaveBeenCalled();
          },
        );
      },
    );

    // @swipe-actions-spec @FR14
    f.Scenario(
      "Small movement within threshold preserves long press",
      ({ When, Then }) => {
        When(
          "user moves finger within move threshold during hold",
          (_ctx: TestContext) => {
            const { result } = setupHook(mocks.onLongPress, mocks.onClick);
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
                    LONG_PRESS_MOVE_THRESHOLD_PX -
                    MOVE_WITHIN_OFFSET,
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

        Then(
          "onLongPress is called after threshold duration",
          (_ctx: TestContext) => {
            expect(mocks.onLongPress).toHaveBeenCalledTimes(1);
          },
        );
      },
    );

    // @swipe-actions-spec @FR17
    f.Scenario("Touch cancel stops long press", ({ When, Then }) => {
      When("touchcancel fires during hold", (_ctx: TestContext) => {
        const { result } = setupHook(mocks.onLongPress, mocks.onClick);
        const touchStartEvent = createTouchEvent(
          "touchstart",
          TOUCH_START_X,
          TOUCH_START_Y,
        );
        const touchCancelEvent = new TouchEvent("touchcancel");
        result.current.onTouchStart(touchStartEvent);
        result.current.onTouchCancel(
          touchCancelEvent as unknown as React.TouchEvent,
        );
        vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
      });

      Then(
        "onLongPress is not called after threshold duration",
        (_ctx: TestContext) => {
          expect(mocks.onLongPress).not.toHaveBeenCalled();
        },
      );
    });
  },
);
