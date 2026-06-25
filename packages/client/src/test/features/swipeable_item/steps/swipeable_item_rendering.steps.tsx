// implements FR13, FR14, NFR-A2, NFR-P3 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import {
  SWIPE_BACKGROUND_OPACITY_REST,
  SWIPE_BACKGROUND_OPACITY_SWIPING,
  SWIPE_BACKGROUND_OPACITY_THRESHOLD,
  SWIPE_SNAP_BACK_DURATION_MS,
} from "@/constants";
import type { UseSwipeGestureResult } from "@/hooks/useSwipeGesture";

const { mockUseSwipeGesture } = vi.hoisted(() => ({
  mockUseSwipeGesture: vi.fn(),
}));

vi.mock("@/hooks/useSwipeGesture", () => ({
  useSwipeGesture: mockUseSwipeGesture,
}));

import { cleanup, render, screen } from "@testing-library/react/pure";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { SwipeableItem } from "@/components/shared/SwipeableItem";
import type { SwipeActionConfig } from "@/types/swipe";

const feature = await loadFeature("../swipeable_item_rendering.feature");

type FeatureContext = Record<string, never>;

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

const IDLE_STATE: UseSwipeGestureResult = {
  translateX: 0,
  isThresholdReached: false,
  direction: null,
  isSwiping: false,
  activeAction: null,
};

let lastHookOptions: Record<string, unknown> = {};

function captureHookOptions() {
  mockUseSwipeGesture.mockImplementation((options: Record<string, unknown>) => {
    lastHookOptions = options;
    return IDLE_STATE;
  });
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      lastHookOptions = {};
      mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
    });

    // @swipeable-item @FR13
    f.Scenario("Children rendered inside swipe container", ({ When, Then }) => {
      When("SwipeableItem is rendered with children", (_ctx: TestContext) => {
        render(
          <SwipeableItem>
            <span data-testid="child">Hello</span>
          </SwipeableItem>,
        );
      });

      Then(
        "children are visible inside a container with overflow-hidden",
        (_ctx: TestContext) => {
          expect(screen.getByTestId("child")).toBeDefined();
          const container = screen.getByTestId("swipeable-container");
          expect(container.className).toContain("overflow-hidden");
        },
      );
    });

    // @swipeable-item @FR13
    f.Scenario("Content moves during swipe", ({ Given, When, Then }) => {
      const SWIPE_DISTANCE_PX = 100;

      Given(
        "useSwipeGesture returns translateX of 100",
        (_ctx: TestContext) => {
          mockUseSwipeGesture.mockReturnValue({
            ...IDLE_STATE,
            translateX: SWIPE_DISTANCE_PX,
            isSwiping: true,
            direction: "right",
          });
        },
      );

      When(
        "SwipeableItem is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          render(
            <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
              <span>Content</span>
            </SwipeableItem>,
          );
        },
      );

      Then(
        "the content layer translateX matches the swipe distance",
        (_ctx: TestContext) => {
          const contentLayer = screen.getByTestId("swipeable-content");
          expect(contentLayer.style.transform).toBe(
            `translateX(${SWIPE_DISTANCE_PX}px)`,
          );
        },
      );
    });

    // @swipeable-item @FR13
    f.Scenario(
      "Right swipe shows configured background",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture returns a right swipe in progress",
          (_ctx: TestContext) => {
            mockUseSwipeGesture.mockReturnValue({
              ...IDLE_STATE,
              translateX: 50,
              isSwiping: true,
              direction: "right",
              activeAction: TEST_RIGHT_CONFIG,
            });
          },
        );

        When(
          "SwipeableItem is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            render(
              <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then(
          "a background with the configured color is visible on the left",
          (_ctx: TestContext) => {
            const background = screen.getByTestId("swipe-background-left");
            expect(background.className).toContain("bg-blue-500");
          },
        );

        And(
          "the background contains the configured icon",
          (_ctx: TestContext) => {
            const background = screen.getByTestId("swipe-background-left");
            const svgElement = background.querySelector("svg");
            expect(svgElement).not.toBeNull();
          },
        );
      },
    );

    // @swipeable-item @FR13
    f.Scenario(
      "Left swipe shows configured background",
      ({ Given, When, Then, And }) => {
        Given(
          "useSwipeGesture returns a left swipe in progress",
          (_ctx: TestContext) => {
            mockUseSwipeGesture.mockReturnValue({
              ...IDLE_STATE,
              translateX: -50,
              isSwiping: true,
              direction: "left",
              activeAction: TEST_LEFT_CONFIG,
            });
          },
        );

        When(
          "SwipeableItem is rendered with swipeLeft configured",
          (_ctx: TestContext) => {
            render(
              <SwipeableItem swipeLeft={TEST_LEFT_CONFIG}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then(
          "a background with the configured color is visible on the right",
          (_ctx: TestContext) => {
            const background = screen.getByTestId("swipe-background-right");
            expect(background.className).toContain("bg-red-500");
          },
        );

        And(
          "the background contains the configured icon",
          (_ctx: TestContext) => {
            const background = screen.getByTestId("swipe-background-right");
            const svgElement = background.querySelector("svg");
            expect(svgElement).not.toBeNull();
          },
        );
      },
    );

    // @swipeable-item @FR13
    f.Scenario("Background hidden at rest", ({ Given, When, Then }) => {
      Given("useSwipeGesture returns translateX of 0", (_ctx: TestContext) => {
        mockUseSwipeGesture.mockReturnValue({ ...IDLE_STATE });
      });

      When(
        "SwipeableItem is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          render(
            <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
              <span>Content</span>
            </SwipeableItem>,
          );
        },
      );

      Then("background opacity is 0", (_ctx: TestContext) => {
        const background = screen.getByTestId("swipe-background-left");
        expect(background.style.opacity).toBe(
          String(SWIPE_BACKGROUND_OPACITY_REST),
        );
      });
    });

    // @swipeable-item @FR13
    f.Scenario(
      "Background opacity during swipe before threshold",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture returns a swipe before threshold",
          (_ctx: TestContext) => {
            mockUseSwipeGesture.mockReturnValue({
              ...IDLE_STATE,
              translateX: 30,
              isThresholdReached: false,
              isSwiping: true,
              direction: "right",
            });
          },
        );

        When(
          "SwipeableItem is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            render(
              <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then("background opacity is 0.7", (_ctx: TestContext) => {
          const background = screen.getByTestId("swipe-background-left");
          expect(background.style.opacity).toBe(
            String(SWIPE_BACKGROUND_OPACITY_SWIPING),
          );
        });
      },
    );

    // @swipeable-item @FR13
    f.Scenario("Background opacity at threshold", ({ Given, When, Then }) => {
      Given(
        "useSwipeGesture returns a swipe at threshold",
        (_ctx: TestContext) => {
          mockUseSwipeGesture.mockReturnValue({
            ...IDLE_STATE,
            translateX: 150,
            isThresholdReached: true,
            isSwiping: true,
            direction: "right",
          });
        },
      );

      When(
        "SwipeableItem is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          render(
            <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
              <span>Content</span>
            </SwipeableItem>,
          );
        },
      );

      Then("background opacity is 1.0", (_ctx: TestContext) => {
        const background = screen.getByTestId("swipe-background-left");
        expect(background.style.opacity).toBe(
          String(SWIPE_BACKGROUND_OPACITY_THRESHOLD),
        );
      });
    });

    // @swipeable-item @FR14
    f.Scenario("No transition during active swipe", ({ Given, When, Then }) => {
      Given("useSwipeGesture returns an active swipe", (_ctx: TestContext) => {
        mockUseSwipeGesture.mockReturnValue({
          ...IDLE_STATE,
          translateX: 50,
          isSwiping: true,
          direction: "right",
        });
      });

      When(
        "SwipeableItem is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          render(
            <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
              <span>Content</span>
            </SwipeableItem>,
          );
        },
      );

      Then("content layer has transition none", (_ctx: TestContext) => {
        const contentLayer = screen.getByTestId("swipeable-content");
        expect(contentLayer.style.transition).toBe("none");
      });
    });

    // @swipeable-item @FR14
    f.Scenario(
      "Snap-back with transition on release",
      ({ Given, When, Then }) => {
        Given(
          "useSwipeGesture returns idle state after release",
          (_ctx: TestContext) => {
            mockUseSwipeGesture.mockReturnValue({
              ...IDLE_STATE,
              isSwiping: false,
            });
          },
        );

        When(
          "SwipeableItem is rendered with swipeRight configured",
          (_ctx: TestContext) => {
            render(
              <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then("content layer has snap-back transition", (_ctx: TestContext) => {
          const contentLayer = screen.getByTestId("swipeable-content");
          expect(contentLayer.style.transition).toBe(
            `transform ${SWIPE_SNAP_BACK_DURATION_MS}ms ease-out`,
          );
        });
      },
    );

    // @swipeable-item @FR13
    f.Scenario(
      "Disabled SwipeableItem passes isEnabled to hook",
      ({ When, Then }) => {
        When(
          "SwipeableItem is rendered with isEnabled false",
          (_ctx: TestContext) => {
            captureHookOptions();
            render(
              <SwipeableItem isEnabled={false}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then(
          "useSwipeGesture receives isEnabled false",
          (_ctx: TestContext) => {
            expect(lastHookOptions.isEnabled).toBe(false);
          },
        );
      },
    );

    // @swipeable-item @FR13
    f.Scenario(
      "Suspended SwipeableItem passes isSuspended to hook",
      ({ When, Then }) => {
        When(
          "SwipeableItem is rendered with isSuspended true",
          (_ctx: TestContext) => {
            captureHookOptions();
            render(
              <SwipeableItem isSuspended={true}>
                <span>Content</span>
              </SwipeableItem>,
            );
          },
        );

        Then(
          "useSwipeGesture receives isSuspended true",
          (_ctx: TestContext) => {
            expect(lastHookOptions.isSuspended).toBe(true);
          },
        );
      },
    );

    // @swipeable-item @NFR-P3
    f.Scenario("Container has touch-action pan-y", ({ When, Then }) => {
      When("SwipeableItem is rendered with children", (_ctx: TestContext) => {
        render(
          <SwipeableItem>
            <span>Content</span>
          </SwipeableItem>,
        );
      });

      Then(
        "the container element has style touch-action set to pan-y",
        (_ctx: TestContext) => {
          const container = screen.getByTestId("swipeable-container");
          expect(container.style.touchAction).toBe("pan-y");
        },
      );
    });

    // @swipeable-item @NFR-A2
    f.Scenario("Background has aria-hidden", ({ Given, When, Then }) => {
      Given(
        "useSwipeGesture returns a right swipe in progress",
        (_ctx: TestContext) => {
          mockUseSwipeGesture.mockReturnValue({
            ...IDLE_STATE,
            translateX: 50,
            isSwiping: true,
            direction: "right",
            activeAction: TEST_RIGHT_CONFIG,
          });
        },
      );

      When(
        "SwipeableItem is rendered with swipeRight configured",
        (_ctx: TestContext) => {
          render(
            <SwipeableItem swipeRight={TEST_RIGHT_CONFIG}>
              <span>Content</span>
            </SwipeableItem>,
          );
        },
      );

      Then(
        "the background element has aria-hidden true",
        (_ctx: TestContext) => {
          const background = screen.getByTestId("swipe-background-left");
          expect(background.getAttribute("aria-hidden")).toBe("true");
        },
      );
    });
  },
);
