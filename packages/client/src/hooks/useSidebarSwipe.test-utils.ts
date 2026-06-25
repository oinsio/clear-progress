import { renderHook } from "@testing-library/react";
import type React from "react";
import { createRef } from "react";
import { vi } from "vitest";
import type { PanelSide } from "@/types/common";
import {
  type UseSidebarSwipeOptions,
  useSidebarSwipe,
} from "./useSidebarSwipe";

export function createSidebarElement(width = 208): {
  element: HTMLDivElement;
  ref: React.RefObject<HTMLDivElement | null>;
} {
  const element = document.createElement("div");
  Object.defineProperty(element, "offsetWidth", {
    value: width,
    configurable: true,
  });
  document.body.appendChild(element);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, "current", { value: element, writable: false });
  return { element, ref };
}

export function cleanupSidebarElement(element: HTMLElement): void {
  if (element.parentNode) {
    document.body.removeChild(element);
  }
}

function makeTouchList(
  clientX: number,
  clientY: number,
  target: HTMLElement,
): Touch[] {
  return [
    {
      identifier: 0,
      target,
      clientX,
      clientY,
      pageX: clientX,
      pageY: clientY,
      screenX: clientX,
      screenY: clientY,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 0,
    },
  ];
}

export function fireDocumentTouchStart(clientX: number, clientY: number): void {
  const event = Object.assign(
    new Event("touchstart", { bubbles: true, cancelable: true }),
    { touches: makeTouchList(clientX, clientY, document.body) },
  );
  document.dispatchEvent(event);
}

export function fireDocumentTouchMove(clientX: number, clientY: number): void {
  const event = Object.assign(
    new Event("touchmove", { bubbles: true, cancelable: true }),
    { touches: makeTouchList(clientX, clientY, document.body) },
  );
  document.dispatchEvent(event);
}

export function fireDocumentTouchEnd(): void {
  const event = Object.assign(
    new Event("touchend", { bubbles: true, cancelable: true }),
    { touches: [] },
  );
  document.dispatchEvent(event);
}

export function fireElementTouchStart(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): void {
  const event = Object.assign(
    new Event("touchstart", { bubbles: true, cancelable: true }),
    { touches: makeTouchList(clientX, clientY, element) },
  );
  element.dispatchEvent(event);
}

export function fireElementTouchMove(
  element: HTMLElement,
  clientX: number,
  clientY: number,
): void {
  const event = Object.assign(
    new Event("touchmove", { bubbles: true, cancelable: true }),
    { touches: makeTouchList(clientX, clientY, element) },
  );
  element.dispatchEvent(event);
}

export function fireElementTouchEnd(element: HTMLElement): void {
  const event = Object.assign(
    new Event("touchend", { bubbles: true, cancelable: true }),
    { touches: [] },
  );
  element.dispatchEvent(event);
}

export interface SidebarSwipeTestOptions {
  side?: PanelSide;
  isOpen?: boolean;
  isDesktop?: boolean;
  sidebarWidth?: number;
  windowWidth?: number;
}

export interface SidebarSwipeTestContext {
  element: HTMLDivElement;
  ref: React.RefObject<HTMLDivElement | null>;
  onOpen: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
  options: UseSidebarSwipeOptions;
}

export function setupSidebarSwipeTest(
  testOptions: SidebarSwipeTestOptions = {},
): SidebarSwipeTestContext {
  const {
    side = "right",
    isOpen = false,
    isDesktop = false,
    sidebarWidth = 208,
    windowWidth = 375,
  } = testOptions;

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: windowWidth,
  });

  const { element, ref } = createSidebarElement(sidebarWidth);
  const onOpen = vi.fn();
  const onClose = vi.fn();

  const options: UseSidebarSwipeOptions = {
    sidebarRef: ref,
    side,
    isOpen,
    isDesktop,
    onOpen,
    onClose,
  };

  return { element, ref, onOpen, onClose, options };
}

export function renderSidebarSwipeHook(options: UseSidebarSwipeOptions) {
  return renderHook((props: UseSidebarSwipeOptions) => useSidebarSwipe(props), {
    initialProps: options,
  });
}
