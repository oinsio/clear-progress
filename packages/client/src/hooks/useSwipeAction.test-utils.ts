import { renderHook } from "@testing-library/react";
import type React from "react";
import { createRef } from "react";
import { vi } from "vitest";
import { SWIPE_COMPLETE_THRESHOLD_PERCENT } from "@/constants";
import { useSwipeAction } from "./useSwipeAction";

export function createElementRef() {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, "current", { value: element, writable: false });
  return { element, ref };
}

function makeTouchList(x: number, y: number, target: HTMLElement) {
  return [
    { identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y },
  ];
}

export function fireTouchStart(
  el: HTMLElement,
  x: number,
  y: number,
  target?: HTMLElement,
) {
  const touchTarget = target ?? el;
  const event = Object.assign(
    new Event("touchstart", { bubbles: true, cancelable: true }),
    {
      touches: makeTouchList(x, y, touchTarget),
    },
  );
  touchTarget.dispatchEvent(event);
}

export function fireTouchMove(el: HTMLElement, x: number, y: number) {
  const event = Object.assign(
    new Event("touchmove", { bubbles: true, cancelable: true }),
    {
      touches: makeTouchList(x, y, el),
    },
  );
  el.dispatchEvent(event);
}

export function fireTouchEnd(el: HTMLElement) {
  const event = Object.assign(
    new Event("touchend", { bubbles: true, cancelable: true }),
    {
      touches: [],
    },
  );
  el.dispatchEvent(event);
}

export interface SwipeTestContext {
  element: HTMLElement;
  ref: React.RefObject<HTMLDivElement>;
  threshold: number;
}

export function setupSwipeTest(): SwipeTestContext {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 375,
  });
  const threshold = window.innerWidth * SWIPE_COMPLETE_THRESHOLD_PERCENT;
  const { element, ref } = createElementRef();
  return { element, ref, threshold };
}

export function cleanupSwipeTest(element: HTMLElement) {
  document.body.removeChild(element);
}

export function renderSwipeHook(
  ref: React.RefObject<HTMLDivElement>,
  onAction?: () => void,
  isEnabled = true,
) {
  return renderHook(() => useSwipeAction(ref, onAction ?? vi.fn(), isEnabled));
}
