import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMMAND_BAR_CSS_VAR } from "@/constants";
import { useCommandBarResize } from "../useCommandBarResize";

// implements FR16, NFR-P2 of command-bar

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

let resizeCallback: ResizeCallback;

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockResizeObserver {
  constructor(callback: ResizeCallback) {
    resizeCallback = callback;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

interface FakeElement extends HTMLElement {
  __mockHeight: number;
}

function createFakeElement(initialHeight: number): FakeElement {
  const element = document.createElement("div") as unknown as FakeElement;
  element.__mockHeight = initialHeight;
  Object.defineProperty(element, "offsetHeight", {
    get() {
      return element.__mockHeight;
    },
    configurable: true,
  });
  return element;
}

function createResizeEntry(height: number): ResizeObserverEntry {
  return {
    contentRect: { height } as DOMRectReadOnly,
    borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
    contentBoxSize: [{ blockSize: height, inlineSize: 0 }],
    devicePixelContentBoxSize: [],
    target: document.createElement("div"),
  } as unknown as ResizeObserverEntry;
}

function triggerResize(height: number): void {
  resizeCallback([createResizeEntry(height)]);
}

function getCssVariable(): string | null {
  return document.documentElement.style.getPropertyValue(COMMAND_BAR_CSS_VAR);
}

let pendingFrames: FrameRequestCallback[] = [];
let nextFrameId = 1;

function flushFrames(): void {
  const frames = [...pendingFrames];
  pendingFrames = [];
  for (const frame of frames) {
    frame(0);
  }
}

describe("useCommandBarResize", () => {
  beforeEach(() => {
    pendingFrames = [];
    nextFrameId = 1;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      pendingFrames.push(callback);
      return nextFrameId++;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    document.documentElement.style.removeProperty(COMMAND_BAR_CSS_VAR);
    mockObserve.mockClear();
    mockDisconnect.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.removeProperty(COMMAND_BAR_CSS_VAR);
  });

  it("should observe the referenced element on mount", () => {
    const element = createFakeElement(48);
    const barRef = { current: element };

    renderHook(() => useCommandBarResize(barRef));

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it("should set CSS variable when resize is observed", () => {
    const element = createFakeElement(48);
    const barRef = { current: element };

    renderHook(() => useCommandBarResize(barRef));
    triggerResize(48);
    flushFrames();

    expect(getCssVariable()).toBe("48px");
  });

  it("should update CSS variable when element resizes", () => {
    const element = createFakeElement(48);
    const barRef = { current: element };

    renderHook(() => useCommandBarResize(barRef));
    triggerResize(48);
    flushFrames();
    expect(getCssVariable()).toBe("48px");

    element.__mockHeight = 64;
    triggerResize(64);
    flushFrames();
    expect(getCssVariable()).toBe("64px");
  });

  it("should reset CSS variable to 0px on unmount", () => {
    const element = createFakeElement(48);
    const barRef = { current: element };

    const { unmount } = renderHook(() => useCommandBarResize(barRef));
    triggerResize(48);
    flushFrames();
    expect(getCssVariable()).toBe("48px");

    unmount();

    expect(getCssVariable()).toBe("0px");
  });

  it("should disconnect observer on unmount", () => {
    const element = createFakeElement(48);
    const barRef = { current: element };

    const { unmount } = renderHook(() => useCommandBarResize(barRef));
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("should not observe when ref is null", () => {
    const barRef = { current: null };

    renderHook(() => useCommandBarResize(barRef));

    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should use element offsetHeight inside rAF callback", () => {
    const element = createFakeElement(52);
    const barRef = { current: element };

    renderHook(() => useCommandBarResize(barRef));
    triggerResize(52);
    flushFrames();

    expect(getCssVariable()).toBe("52px");
  });

  it("should throttle updates to one per animation frame", () => {
    let pendingCallback: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      pendingCallback = callback;
      return 1;
    });

    const element = createFakeElement(48);
    const barRef = { current: element };

    renderHook(() => useCommandBarResize(barRef));

    // First resize schedules rAF
    triggerResize(48);
    // Second resize while rAF is pending should be skipped
    triggerResize(64);

    // Execute pending rAF — should use the first entry
    expect(pendingCallback).not.toBeNull();
    pendingCallback!(0);

    expect(getCssVariable()).toBe("48px");
  });
});
