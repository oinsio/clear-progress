// implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SWIPE_BACKGROUND_OPACITY_REST,
  SWIPE_BACKGROUND_OPACITY_SWIPING,
  SWIPE_BACKGROUND_OPACITY_THRESHOLD,
  SWIPE_SNAP_BACK_DURATION_MS,
} from "@/constants";
import type { UseSwipeGestureResult } from "@/hooks/useSwipeGesture";
import type { SwipeActionConfig } from "@/types/swipe";

const { mockUseSwipeGesture } = vi.hoisted(() => ({
  mockUseSwipeGesture: vi.fn(),
}));

vi.mock("@/hooks/useSwipeGesture", () => ({
  useSwipeGesture: mockUseSwipeGesture,
}));

import { ArchiveRestore, Trash2 } from "lucide-react";
import { SwipeableItem } from "@/components/shared/SwipeableItem";

const IDLE_STATE: UseSwipeGestureResult = {
  translateX: 0,
  isThresholdReached: false,
  direction: null,
  isSwiping: false,
  activeAction: null,
};

const TEST_RIGHT_CONFIG: SwipeActionConfig = {
  onAction: vi.fn(),
  color: "bg-blue-500",
  icon: ArchiveRestore,
};

const TEST_LEFT_CONFIG: SwipeActionConfig = {
  onAction: vi.fn(),
  color: "bg-red-500",
  icon: Trash2,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// FR13: computeBackgroundOpacity logic
describe("SwipeableItem background opacity", () => {
  it("should return rest opacity when translateX is 0", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-left");
    expect(background.style.opacity).toBe(
      String(SWIPE_BACKGROUND_OPACITY_REST),
    );
  });

  it("should return swiping opacity when swiping before threshold", () => {
    mockUseSwipeGesture.mockReturnValue({
      ...IDLE_STATE,
      translateX: 30,
      isThresholdReached: false,
      isSwiping: true,
      direction: "right",
    });
    render(
      <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-left");
    expect(background.style.opacity).toBe(
      String(SWIPE_BACKGROUND_OPACITY_SWIPING),
    );
  });

  it("should return threshold opacity when threshold is reached", () => {
    mockUseSwipeGesture.mockReturnValue({
      ...IDLE_STATE,
      translateX: 150,
      isThresholdReached: true,
      isSwiping: true,
      direction: "right",
    });
    render(
      <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-left");
    expect(background.style.opacity).toBe(
      String(SWIPE_BACKGROUND_OPACITY_THRESHOLD),
    );
  });

  it("should apply opacity to left swipe background", () => {
    mockUseSwipeGesture.mockReturnValue({
      ...IDLE_STATE,
      translateX: -50,
      isThresholdReached: false,
      isSwiping: true,
      direction: "left",
    });
    render(
      <SwipeableItem swipeLeft={TEST_LEFT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-right");
    expect(background.style.opacity).toBe(
      String(SWIPE_BACKGROUND_OPACITY_SWIPING),
    );
  });
});

// FR13: conditional rendering of backgrounds
describe("SwipeableItem background rendering", () => {
  it("should render right-swipe background when swipeRight is configured", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    expect(screen.getByTestId("swipe-background-left")).toBeDefined();
  });

  it("should not render right-swipe background when swipeRight is absent", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    expect(screen.queryByTestId("swipe-background-left")).toBeNull();
  });

  it("should render left-swipe background when swipeLeft is configured", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem swipeLeft={TEST_LEFT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    expect(screen.getByTestId("swipe-background-right")).toBeDefined();
  });

  it("should not render left-swipe background when swipeLeft is absent", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    expect(screen.queryByTestId("swipe-background-right")).toBeNull();
  });

  it("should apply configured color class to right-swipe background", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-left");
    expect(background.className).toContain("bg-blue-500");
    expect(background.className).toContain("pl-4");
  });

  it("should apply configured color class to left-swipe background", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem swipeLeft={TEST_LEFT_CONFIG}>
        <span>Content</span>
      </SwipeableItem>,
    );
    const background = screen.getByTestId("swipe-background-right");
    expect(background.className).toContain("bg-red-500");
    expect(background.className).toContain("pr-4");
  });
});

// FR14: content layer styles
describe("SwipeableItem content layer", () => {
  it("should set transform to match translateX", () => {
    const SWIPE_DISTANCE = 100;
    mockUseSwipeGesture.mockReturnValue({
      ...IDLE_STATE,
      translateX: SWIPE_DISTANCE,
      isSwiping: true,
    });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    const contentLayer = screen.getByTestId("swipeable-content");
    expect(contentLayer.style.transform).toBe(
      `translateX(${SWIPE_DISTANCE}px)`,
    );
  });

  it("should set transition to none during active swipe", () => {
    mockUseSwipeGesture.mockReturnValue({
      ...IDLE_STATE,
      translateX: 50,
      isSwiping: true,
    });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    const contentLayer = screen.getByTestId("swipeable-content");
    expect(contentLayer.style.transition).toBe("none");
  });

  it("should set snap-back transition when not swiping", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE, isSwiping: false });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    const contentLayer = screen.getByTestId("swipeable-content");
    expect(contentLayer.style.transition).toBe(
      `transform ${SWIPE_SNAP_BACK_DURATION_MS}ms ease-out`,
    );
  });

  it("should set willChange to transform", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    const contentLayer = screen.getByTestId("swipeable-content");
    expect(contentLayer.style.willChange).toBe("transform");
  });
});

// NFR-P3: touch-action
describe("SwipeableItem container", () => {
  it("should set touch-action to pan-y", () => {
    mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    render(
      <SwipeableItem>
        <span>Content</span>
      </SwipeableItem>,
    );
    const container = screen.getByTestId("swipeable-container");
    expect(container.style.touchAction).toBe("pan-y");
  });
});
