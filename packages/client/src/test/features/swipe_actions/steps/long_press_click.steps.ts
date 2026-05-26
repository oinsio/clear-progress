// implements FR15, FR16, FR19 of swipe-actions-spec
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

const QUICK_TAP_DURATION_MS = 200;

const feature = await loadFeature("../long_press_click.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<LongPressFeatureContext>) => {
    const mocks = setupLongPressLifecycle(f);

    // @swipe-actions-spec @FR15
    f.Scenario("Quick tap triggers onClick", ({ When, Then, And }) => {
      When("user taps and releases before threshold", (_ctx: TestContext) => {
        const { result } = setupHook(mocks.onLongPress, mocks.onClick);
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

      Then("onClick is called", (_ctx: TestContext) => {
        expect(mocks.onClick).toHaveBeenCalledTimes(1);
      });

      And("onLongPress is not called", (_ctx: TestContext) => {
        expect(mocks.onLongPress).not.toHaveBeenCalled();
      });
    });

    // @swipe-actions-spec @FR16
    f.Scenario(
      "TouchEnd after long press does not trigger click",
      ({ When, Then }) => {
        When("long press fires and user releases", (_ctx: TestContext) => {
          const { result } = setupHook(mocks.onLongPress, mocks.onClick);
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
          vi.advanceTimersByTime(LONG_PRESS_THRESHOLD_MS);
          result.current.onTouchEnd(touchEndEvent);
        });

        Then("onClick is not called", (_ctx: TestContext) => {
          expect(mocks.onClick).not.toHaveBeenCalled();
        });
      },
    );

    // @swipe-actions-spec @FR19
    f.Scenario("Mouse click triggers onClick", ({ When, Then, And }) => {
      When("user clicks with mouse", (_ctx: TestContext) => {
        const { result } = setupHook(mocks.onLongPress, mocks.onClick);
        const mouseEvent = new MouseEvent("click");
        result.current.onClick(mouseEvent as unknown as React.MouseEvent);
      });

      Then("onClick is called", (_ctx: TestContext) => {
        expect(mocks.onClick).toHaveBeenCalledTimes(1);
      });

      And("onLongPress is not called", (_ctx: TestContext) => {
        expect(mocks.onLongPress).not.toHaveBeenCalled();
      });
    });
  },
);
