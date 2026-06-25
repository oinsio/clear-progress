// implements FR1-FR12 of swipeable-item
import { renderHook } from "@testing-library/react";
import type React from "react";
import { createRef } from "react";
import { vi } from "vitest";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";
import type { SwipeActionConfig } from "@/types/swipe";
import {
  type UseSwipeGestureOptions,
  useSwipeGesture,
} from "./useSwipeGesture";

const DEFAULT_VIEWPORT_WIDTH = 375;
const POINTER_ID = 1;

/** jsdom lacks PointerEvent; create a MouseEvent with pointer fields */
function createPointerEvent(
  type: string,
  options: { clientX?: number; clientY?: number; bubbles?: boolean },
): Event {
  const event = new MouseEvent(type, {
    bubbles: options.bubbles ?? true,
    cancelable: true,
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
  });
  Object.defineProperty(event, "pointerId", { value: POINTER_ID });
  return event;
}

export function createElementRef() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, "current", { value: element, writable: false });
  return { element, ref };
}

export function firePointerDown(
  element: HTMLElement,
  x: number,
  y: number,
  target?: HTMLElement,
) {
  const pointerTarget = target ?? element;
  const event = createPointerEvent("pointerdown", {
    clientX: x,
    clientY: y,
  });
  pointerTarget.dispatchEvent(event);
}

export function firePointerMove(x: number, y: number) {
  const event = createPointerEvent("pointermove", {
    clientX: x,
    clientY: y,
  });
  document.dispatchEvent(event);
}

export function firePointerUp() {
  const event = createPointerEvent("pointerup", {});
  document.dispatchEvent(event);
}

export interface SwipeGestureTestContext {
  element: HTMLElement;
  ref: React.RefObject<HTMLDivElement>;
  threshold: number;
}

export function setupSwipeGestureTest(): SwipeGestureTestContext {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: DEFAULT_VIEWPORT_WIDTH,
  });
  const threshold = window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT;
  const { element, ref } = createElementRef();
  return { element, ref, threshold };
}

export function cleanupSwipeGestureTest(element: HTMLElement) {
  document.body.removeChild(element);
}

export function renderSwipeGestureHook(
  ref: React.RefObject<HTMLElement | null>,
  options?: Partial<Omit<UseSwipeGestureOptions, "ref">>,
) {
  return renderHook(() =>
    useSwipeGesture({
      ref,
      ...options,
    }),
  );
}

export interface SwipeGestureFeatureState {
  swipeContext: SwipeGestureTestContext;
  onRightAction: ReturnType<typeof vi.fn>;
  onLeftAction: ReturnType<typeof vi.fn>;
  rightConfig: SwipeActionConfig;
  leftConfig: SwipeActionConfig;
  hookResult: ReturnType<typeof renderSwipeGestureHook>;
}

/** Stub icon component for tests */
export const StubIcon = (() => null) as unknown as SwipeActionConfig["icon"];

export function setupSwipeGestureFeature(f: {
  BeforeEachScenario: (cb: () => Promise<void>) => void;
  AfterEachScenario: (cb: () => Promise<void>) => void;
}): SwipeGestureFeatureState {
  const state = {} as SwipeGestureFeatureState;

  f.BeforeEachScenario(async () => {
    state.swipeContext = setupSwipeGestureTest();
    state.onRightAction = vi.fn();
    state.onLeftAction = vi.fn();
    state.rightConfig = {
      onAction: state.onRightAction,
      color: "bg-green-500",
      icon: StubIcon,
    };
    state.leftConfig = {
      onAction: state.onLeftAction,
      color: "bg-red-500",
      icon: StubIcon,
    };
  });

  f.AfterEachScenario(async () => {
    cleanupSwipeGestureTest(state.swipeContext.element);
  });

  return state;
}
