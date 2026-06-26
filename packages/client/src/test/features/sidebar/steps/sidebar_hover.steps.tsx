// implements FR5, FR6 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import {
  SIDEBAR_HOVER_CLOSE_DELAY_MS,
  SIDEBAR_HOVER_OPEN_DELAY_MS,
} from "@/constants";

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({
    menuOrder: [
      { mode: "inbox", visible: true },
      { mode: "tasks", visible: true },
      { mode: "goals", visible: true },
    ],
  }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";
import { useSidebarHover } from "@/hooks/useSidebarHover";
import type { SidebarEffectiveState } from "@/types/common";

const feature = await loadFeature("../sidebar_hover.feature");

function setupHoverHook(state: SidebarEffectiveState = "hover-ready") {
  vi.useFakeTimers();
  return renderHook(({ hookState }) => useSidebarHover(hookState), {
    initialProps: { hookState: state },
  });
}

function expandViaHover(result: ReturnType<typeof setupHoverHook>["result"]) {
  simulateMouseEnter(result, SIDEBAR_HOVER_OPEN_DELAY_MS);
  expect(result.current.isHoverExpanded).toBe(true);
}

function simulateMouseEnter(
  result: ReturnType<typeof setupHoverHook>["result"],
  advanceMs: number,
) {
  act(() => {
    result.current.hoverHandlers.onMouseEnter();
  });
  act(() => {
    vi.advanceTimersByTime(advanceMs);
  });
}

function simulateMouseLeave(
  result: ReturnType<typeof setupHoverHook>["result"],
  advanceMs: number,
) {
  act(() => {
    result.current.hoverHandlers.onMouseLeave();
  });
  act(() => {
    vi.advanceTimersByTime(advanceMs);
  });
}

function teardownHoverHook() {
  vi.useRealTimers();
  cleanup();
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  // @improve-sidebar-ux @FR5
  f.Scenario("Hover expands sidebar after debounce", ({ Given }) => {
    Given(
      "hover-ready sidebar expands after 250ms debounce",
      (_ctx: TestContext) => {
        const { result } = setupHoverHook();
        expect(result.current.isHoverExpanded).toBe(false);
        simulateMouseEnter(result, SIDEBAR_HOVER_OPEN_DELAY_MS);
        expect(result.current.isHoverExpanded).toBe(true);
        teardownHoverHook();
      },
    );
  });

  // @improve-sidebar-ux @FR5
  f.Scenario("Brief hover does not expand sidebar", ({ Given }) => {
    Given(
      "hover-ready sidebar stays collapsed when mouse leaves before 250ms",
      (_ctx: TestContext) => {
        const { result } = setupHoverHook();
        simulateMouseEnter(result, SIDEBAR_HOVER_OPEN_DELAY_MS - 1);
        simulateMouseLeave(result, SIDEBAR_HOVER_OPEN_DELAY_MS);
        expect(result.current.isHoverExpanded).toBe(false);
        teardownHoverHook();
      },
    );
  });

  // @improve-sidebar-ux @FR5
  f.Scenario("Mouse leave collapses hover-expanded sidebar", ({ Given }) => {
    Given(
      "hover-expanded sidebar collapses after 150ms mouse leave",
      (_ctx: TestContext) => {
        const { result } = setupHoverHook();
        expandViaHover(result);
        simulateMouseLeave(result, SIDEBAR_HOVER_CLOSE_DELAY_MS);
        expect(result.current.isHoverExpanded).toBe(false);
        teardownHoverHook();
      },
    );
  });

  // @improve-sidebar-ux @FR5
  f.Scenario("Brief mouse leave does not collapse", ({ Given }) => {
    Given(
      "hover-expanded sidebar stays expanded when mouse returns within 150ms",
      (_ctx: TestContext) => {
        const { result } = setupHoverHook();
        expandViaHover(result);
        simulateMouseLeave(result, SIDEBAR_HOVER_CLOSE_DELAY_MS - 1);
        simulateMouseEnter(result, SIDEBAR_HOVER_CLOSE_DELAY_MS);
        expect(result.current.isHoverExpanded).toBe(true);
        teardownHoverHook();
      },
    );
  });

  // @improve-sidebar-ux @FR6
  f.Scenario(
    "Navigation click in hover-expanded does not collapse",
    ({ Given }) => {
      Given(
        "hover-expanded sidebar stays rendered after navigation click",
        async (_ctx: TestContext) => {
          cleanup();
          render(
            <MemoryRouter>
              <Sidebar
                mode={null}
                effectiveState="hover-ready"
                isDrawerOpen={false}
                isHoverExpanded={true}
                hoverHandlers={{
                  onMouseEnter: vi.fn(),
                  onMouseLeave: vi.fn(),
                }}
                onModeChange={vi.fn()}
              />
            </MemoryRouter>,
          );
          const user = userEvent.setup();
          const navButton = screen.getByTestId("sidebar-filter-inbox");
          await user.click(navButton);
          expect(
            screen.getByTestId("sidebar-hover-expanded"),
          ).toBeInTheDocument();
          cleanup();
        },
      );
    },
  );

  // @improve-sidebar-ux @FR5
  f.Scenario("Hover does not activate when not hover-ready", ({ Given }) => {
    Given("expanded sidebar ignores hover events", (_ctx: TestContext) => {
      const { result } = setupHoverHook("expanded");
      simulateMouseEnter(result, SIDEBAR_HOVER_OPEN_DELAY_MS);
      expect(result.current.isHoverExpanded).toBe(false);
      teardownHoverHook();
    });
  });
});
