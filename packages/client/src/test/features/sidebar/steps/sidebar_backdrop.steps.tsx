// implements FR3, NFR-A2, NFR-R1 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import type { TestContext } from "vitest";
import { expect, vi } from "vitest";

const mockTogglePanelOpen = vi.fn();
const mockCloseTemporary = vi.fn();
const mockOpenTemporarily = vi.fn();
let mockEffectiveIsOpen = false;
let mockIsTemporarilyOpen = false;
let mockIsDesktop = true;

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

vi.mock("@/hooks/usePanelOpen", () => ({
  usePanelOpen: () => ({
    isPanelOpen: false,
    isTemporarilyOpen: mockIsTemporarilyOpen,
    effectiveIsOpen: mockEffectiveIsOpen,
    togglePanelOpen: mockTogglePanelOpen,
    openTemporarily: mockOpenTemporarily,
    closeTemporary: mockCloseTemporary,
  }),
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

vi.mock("@/hooks/useSidebarNavigation", () => ({
  useSidebarNavigation: () => vi.fn(),
}));

vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({ isDetailPanelPinned: false }),
}));

vi.mock("@/components/tasks/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock("@/components/tasks/TaskDetailPanel", () => ({
  TaskDetailPanel: () => <div data-testid="task-detail-panel" />,
}));

import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";

const feature = await loadFeature("../sidebar_backdrop.feature");

const baseProps = {
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

function renderLayout() {
  return render(
    <TaskPageLayout {...baseProps}>
      <div>Content</div>
    </TaskPageLayout>,
  );
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      mockEffectiveIsOpen = false;
      mockIsTemporarilyOpen = false;
      mockIsDesktop = true;
    });

    // @improve-sidebar-ux @FR3
    f.Scenario(
      "Backdrop visible on mobile when sidebar expanded",
      ({ Given, And, Then }) => {
        Given("user is on mobile", (_ctx: TestContext) => {
          mockIsDesktop = false;
        });

        And("sidebar is open", (_ctx: TestContext) => {
          mockEffectiveIsOpen = true;
          mockIsTemporarilyOpen = true;
          renderLayout();
        });

        Then("a backdrop overlay is visible", (_ctx: TestContext) => {
          expect(screen.getByTestId("sidebar-backdrop")).toBeInTheDocument();
        });
      },
    );

    // @improve-sidebar-ux @FR3
    f.Scenario("Backdrop not visible on desktop", ({ Given, And, Then }) => {
      Given("user is on desktop", (_ctx: TestContext) => {
        mockIsDesktop = true;
      });

      And("sidebar is open", (_ctx: TestContext) => {
        mockEffectiveIsOpen = true;
        renderLayout();
      });

      Then("no backdrop overlay is visible", (_ctx: TestContext) => {
        expect(
          screen.queryByTestId("sidebar-backdrop"),
        ).not.toBeInTheDocument();
      });
    });

    // @improve-sidebar-ux @FR3
    f.Scenario(
      "Tap on backdrop closes sidebar",
      ({ Given, And, When, Then }) => {
        Given("user is on mobile", (_ctx: TestContext) => {
          mockIsDesktop = false;
        });

        And("sidebar is open", (_ctx: TestContext) => {
          mockEffectiveIsOpen = true;
          mockIsTemporarilyOpen = true;
          renderLayout();
        });

        When("user taps the backdrop", (_ctx: TestContext) => {
          const backdrop = screen.getByTestId("sidebar-backdrop");
          fireEvent.click(backdrop);
        });

        Then("sidebar closes", (_ctx: TestContext) => {
          expect(mockCloseTemporary).toHaveBeenCalledTimes(1);
        });
      },
    );
  },
);
