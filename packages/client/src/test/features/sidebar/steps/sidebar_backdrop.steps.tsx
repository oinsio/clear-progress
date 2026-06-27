// implements FR4, FR12 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import type { TestContext } from "vitest";
import { expect, vi } from "vitest";

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "not_configured",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

vi.mock("@/hooks/usePanelSplit", () => ({
  usePanelSplit: () => ({
    ratio: 0.6,
    containerRef: { current: null },
    handleResizeMouseDown: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({ panelSide: "right" as const }),
}));

const mockUseSidebarState = vi.fn();
vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => mockUseSidebarState(),
}));

vi.mock("@/hooks/useSidebarNavigation", () => ({
  useSidebarNavigation: () => vi.fn(),
}));

import { Sidebar } from "@/components/tasks/Sidebar";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import type { SidebarEffectiveState } from "@/types/common";

function renderSidebar(effectiveState: SidebarEffectiveState) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState={effectiveState}
        isDrawerOpen={false}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

const layoutBaseProps = {
  sidebarMode: "inbox" as const,
  selectedTask: null,
  goals: [],
  contexts: [],
  categories: [],
  onUpdateTask: vi.fn(),
  onMoveTask: vi.fn(),
  onDeleteTask: vi.fn(),
  onDuplicateTask: vi.fn(),
  onCloseDetailPanel: vi.fn(),
};

function renderLayout(isNarrow: boolean, hasHover: boolean) {
  mockUseSidebarState.mockReturnValue({
    effectiveState: isNarrow && !hasHover ? "collapsed" : "expanded",
    sidebarMode: "expanded",
    setSidebarMode: vi.fn(),
    isNarrow,
    hasHover,
  });

  return render(
    <MemoryRouter>
      <TaskPageLayout {...layoutBaseProps}>
        <div>Content</div>
      </TaskPageLayout>
    </MemoryRouter>,
  );
}

const feature = await loadFeature("../sidebar_backdrop.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
    });

    // @improve-sidebar-ux @FR12
    f.Scenario(
      "Sidebar component has no backdrop when expanded",
      ({ Given, Then }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          renderSidebar("expanded");
        });

        Then(
          "no backdrop overlay is rendered by sidebar",
          (_ctx: TestContext) => {
            expect(screen.queryByTestId("sidebar-backdrop")).toBeNull();
          },
        );
      },
    );

    // @improve-sidebar-ux @FR12
    f.Scenario(
      "Sidebar component has no backdrop when collapsed",
      ({ Given, Then }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          renderSidebar("collapsed");
        });

        Then(
          "no backdrop overlay is rendered by sidebar",
          (_ctx: TestContext) => {
            expect(screen.queryByTestId("sidebar-backdrop")).toBeNull();
          },
        );
      },
    );

    // @improve-sidebar-ux @FR12
    f.Scenario("Layout has no backdrop on desktop", ({ Given, Then }) => {
      Given("a wide screen with hover capability", (_ctx: TestContext) => {
        renderLayout(false, true);
      });

      Then("no backdrop overlay is rendered by layout", (_ctx: TestContext) => {
        expect(screen.queryByTestId("sidebar-backdrop")).toBeNull();
      });
    });

    // @improve-sidebar-ux @FR12
    f.Scenario(
      "Layout has no backdrop when drawer is closed on narrow screen",
      ({ Given, Then }) => {
        Given(
          "a narrow screen without hover capability",
          (_ctx: TestContext) => {
            renderLayout(true, false);
          },
        );

        Then(
          "no backdrop overlay is rendered by layout",
          (_ctx: TestContext) => {
            const backdrop = screen.queryByTestId("sidebar-backdrop");
            if (backdrop) {
              expect(backdrop).toHaveStyle("pointer-events: none");
            }
          },
        );
      },
    );
  },
);
