// implements FR8, FR9, NFR-R2 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import type { TestContext } from "vitest";
import { expect } from "vitest";
import { SIDEBAR_SWIPE_EDGE_ZONE_PX } from "@/constants";
import { useSidebarSwipe } from "@/hooks/useSidebarSwipe";
import {
  cleanupSidebarElement,
  fireDocumentTouchEnd,
  fireDocumentTouchMove,
  fireDocumentTouchStart,
  fireElementTouchEnd,
  fireElementTouchMove,
  fireElementTouchStart,
  type SidebarSwipeTestContext,
  setupSidebarSwipeTest,
} from "@/hooks/useSidebarSwipe.test-utils";

const feature = await loadFeature("../sidebar_swipe.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let testContext: SidebarSwipeTestContext;

    f.AfterEachScenario(() => {
      if (testContext?.element) {
        cleanupSidebarElement(testContext.element);
      }
    });

    function renderAndSwipeEdge(
      side: "right" | "left",
      pastThreshold: boolean,
    ) {
      testContext = setupSidebarSwipeTest({
        side,
        isOpen: false,
        isDesktop: false,
      });
      renderHook(() => useSidebarSwipe(testContext.options));

      if (side === "right") {
        const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
        const targetX = pastThreshold ? edgeStartX - 100 : edgeStartX - 30;
        act(() => {
          fireDocumentTouchStart(edgeStartX, 100);
          fireDocumentTouchMove(edgeStartX - 20, 100);
          fireDocumentTouchMove(targetX, 100);
          fireDocumentTouchEnd();
        });
      } else {
        const edgeStartX = SIDEBAR_SWIPE_EDGE_ZONE_PX - 1;
        act(() => {
          fireDocumentTouchStart(edgeStartX, 100);
          fireDocumentTouchMove(edgeStartX + 20, 100);
          fireDocumentTouchMove(edgeStartX + 100, 100);
          fireDocumentTouchEnd();
        });
      }
    }

    // @improve-sidebar-ux @FR8 @NFR-R2
    f.Scenario(
      "Edge swipe from right opens right-side sidebar",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the right",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is closed", (_ctx: TestContext) => {
          /* configured in When */
        });

        When(
          "user swipes from the right edge past threshold",
          (_ctx: TestContext) => {
            renderAndSwipeEdge("right", true);
          },
        );

        Then("sidebar opens", (_ctx: TestContext) => {
          expect(testContext.onOpen).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @improve-sidebar-ux @FR8 @NFR-R2
    f.Scenario(
      "Edge swipe from left opens left-side sidebar",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the left",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is closed", (_ctx: TestContext) => {
          /* configured in When */
        });

        When(
          "user swipes from the left edge past threshold",
          (_ctx: TestContext) => {
            renderAndSwipeEdge("left", true);
          },
        );

        Then("sidebar opens", (_ctx: TestContext) => {
          expect(testContext.onOpen).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @improve-sidebar-ux @FR8 @NFR-R2
    f.Scenario(
      "Swipe outside edge zone does not open sidebar",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the right",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is closed", (_ctx: TestContext) => {
          /* configured in When */
        });

        When("user swipes from outside the edge zone", (_ctx: TestContext) => {
          testContext = setupSidebarSwipeTest({
            side: "right",
            isOpen: false,
            isDesktop: false,
          });
          renderHook(() => useSidebarSwipe(testContext.options));
          const outsideEdgeX =
            window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX - 10;
          act(() => {
            fireDocumentTouchStart(outsideEdgeX, 100);
            fireDocumentTouchMove(outsideEdgeX - 100, 100);
            fireDocumentTouchEnd();
          });
        });

        Then("sidebar stays closed", (_ctx: TestContext) => {
          expect(testContext.onOpen).not.toHaveBeenCalled();
        });
      },
    );

    // @improve-sidebar-ux @FR9
    f.Scenario(
      "Full swipe-back closes sidebar",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the right",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is open", (_ctx: TestContext) => {
          /* configured in When */
        });

        When(
          "user swipes the sidebar toward the right edge past threshold",
          (_ctx: TestContext) => {
            testContext = setupSidebarSwipeTest({
              side: "right",
              isOpen: true,
              isDesktop: false,
            });
            renderHook(() => useSidebarSwipe(testContext.options));
            act(() => {
              fireElementTouchStart(testContext.element, 200, 100);
              fireElementTouchMove(testContext.element, 215, 100);
              fireElementTouchMove(testContext.element, 280, 100);
              fireElementTouchEnd(testContext.element);
            });
          },
        );

        Then("sidebar closes", (_ctx: TestContext) => {
          expect(testContext.onClose).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @improve-sidebar-ux @FR9
    f.Scenario(
      "Incomplete swipe snaps back open",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the right",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is open", (_ctx: TestContext) => {
          /* configured in When */
        });

        When(
          "user swipes the sidebar but releases before threshold",
          (_ctx: TestContext) => {
            testContext = setupSidebarSwipeTest({
              side: "right",
              isOpen: true,
              isDesktop: false,
            });
            renderHook(() => useSidebarSwipe(testContext.options));
            act(() => {
              fireElementTouchStart(testContext.element, 200, 100);
              fireElementTouchMove(testContext.element, 215, 100);
              fireElementTouchMove(testContext.element, 230, 100);
              fireElementTouchEnd(testContext.element);
            });
          },
        );

        Then("sidebar stays open", (_ctx: TestContext) => {
          expect(testContext.onClose).not.toHaveBeenCalled();
        });
      },
    );

    // @improve-sidebar-ux @FR8 @FR9 @NFR-R2
    f.Scenario(
      "Vertical movement cancels swipe",
      ({ Given, And, When, Then }) => {
        Given(
          "user is on mobile with sidebar on the right",
          (_ctx: TestContext) => {
            /* configured in When */
          },
        );

        And("sidebar is closed", (_ctx: TestContext) => {
          /* configured in When */
        });

        When(
          "user scrolls vertically from the edge zone",
          (_ctx: TestContext) => {
            testContext = setupSidebarSwipeTest({
              side: "right",
              isOpen: false,
              isDesktop: false,
            });
            renderHook(() => useSidebarSwipe(testContext.options));
            const edgeStartX =
              window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
            act(() => {
              fireDocumentTouchStart(edgeStartX, 100);
              fireDocumentTouchMove(edgeStartX - 5, 120);
              fireDocumentTouchEnd();
            });
          },
        );

        Then("sidebar stays closed", (_ctx: TestContext) => {
          expect(testContext.onOpen).not.toHaveBeenCalled();
        });
      },
    );

    // @improve-sidebar-ux @FR8 @FR9 @NFR-R2
    f.Scenario(
      "Desktop has no swipe listeners",
      ({ Given, And, When, Then }) => {
        Given("user is on desktop", (_ctx: TestContext) => {
          /* configured in When */
        });

        And("sidebar is closed on the right", (_ctx: TestContext) => {
          /* configured in When */
        });

        When("user touches near the right edge", (_ctx: TestContext) => {
          testContext = setupSidebarSwipeTest({
            side: "right",
            isOpen: false,
            isDesktop: true,
          });
          renderHook(() => useSidebarSwipe(testContext.options));
          const edgeStartX = window.innerWidth - SIDEBAR_SWIPE_EDGE_ZONE_PX + 1;
          act(() => {
            fireDocumentTouchStart(edgeStartX, 100);
            fireDocumentTouchMove(edgeStartX - 100, 100);
            fireDocumentTouchEnd();
          });
        });

        Then("sidebar stays closed", (_ctx: TestContext) => {
          expect(testContext.onOpen).not.toHaveBeenCalled();
        });
      },
    );
  },
);
