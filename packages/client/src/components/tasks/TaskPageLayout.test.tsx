import { fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import type { Task } from "@/types/entities";
import { TaskPageLayout } from "./TaskPageLayout";

// FR-6: Mock all internal hooks
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

const mockTogglePanelOpen = vi.fn();
const mockCloseTemporary = vi.fn();
const mockUsePanelOpen = vi.fn(() => ({
  isPanelOpen: false,
  isTemporarilyOpen: false,
  effectiveIsOpen: false,
  togglePanelOpen: mockTogglePanelOpen,
  openTemporarily: vi.fn(),
  closeTemporary: mockCloseTemporary,
}));
vi.mock("@/hooks/usePanelOpen", () => ({
  usePanelOpen: () => mockUsePanelOpen(),
}));

const mockUseIsDesktop = vi.fn(() => true);
vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockUseIsDesktop(),
}));

vi.mock("@/hooks/useSidebarNavigation", () => ({
  useSidebarNavigation: () => vi.fn(),
}));

// FR-6: Mock child components
vi.mock("./Sidebar", () => ({
  Sidebar: (props: Record<string, unknown>) => (
    <div data-testid="sidebar" data-mode={props.mode} />
  ),
}));

vi.mock("./TaskDetailPanel", () => ({
  TaskDetailPanel: (props: Record<string, unknown>) => (
    <div
      data-testid="task-detail-panel"
      data-task-id={(props.task as Task)?.id}
      style={props.style as React.CSSProperties}
    />
  ),
}));

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

const selectedTask = { id: "task-1", name: "Test task" } as unknown as Task;

describe("TaskPageLayout", () => {
  beforeEach(() => {
    mockUseIsDesktop.mockReturnValue(true);
    mockUsePanelOpen.mockReturnValue({
      isPanelOpen: false,
      isTemporarilyOpen: false,
      effectiveIsOpen: false,
      togglePanelOpen: mockTogglePanelOpen,
      openTemporarily: vi.fn(),
      closeTemporary: mockCloseTemporary,
    });
  });

  // FR-6: renders children in main content area
  it("should render children in main content area", () => {
    render(
      <TaskPageLayout {...baseProps}>
        <div>Child content</div>
      </TaskPageLayout>,
    );
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  // FR-6: root element has correct data-testid
  it("should have data-testid task-page-layout on root element", () => {
    render(
      <TaskPageLayout {...baseProps}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.getByTestId("task-page-layout")).toBeInTheDocument();
  });

  // FR-6: Sidebar receives correct mode
  it("should render Sidebar with correct mode", () => {
    render(
      <TaskPageLayout {...baseProps} sidebarMode="tasks">
        <div>Content</div>
      </TaskPageLayout>,
    );
    const sidebar = screen.getByTestId("sidebar");
    expect(sidebar).toHaveAttribute("data-mode", "tasks");
  });

  // FR-6: no TaskDetailPanel when no task selected
  it("should not render TaskDetailPanel when no task is selected", () => {
    render(
      <TaskPageLayout {...baseProps} selectedTask={null}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.queryByTestId("task-detail-panel")).not.toBeInTheDocument();
  });

  // FR-6: TaskDetailPanel visible when task selected
  it("should render TaskDetailPanel when a task is selected", () => {
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("task-detail-panel")).toHaveAttribute(
      "data-task-id",
      "task-1",
    );
  });

  // FR-6: desktop layout shows resize handle when task selected
  it("should render resize handle on desktop when task is selected", () => {
    mockUseIsDesktop.mockReturnValue(true);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.getByTestId("resize-handle")).toBeInTheDocument();
  });

  // FR-6: no resize handle when no task selected
  it("should not render resize handle when no task is selected", () => {
    render(
      <TaskPageLayout {...baseProps} selectedTask={null}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.queryByTestId("resize-handle")).not.toBeInTheDocument();
  });

  // FR-6: no resize handle on mobile
  it("should not render resize handle on mobile", () => {
    mockUseIsDesktop.mockReturnValue(false);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    expect(screen.queryByTestId("resize-handle")).not.toBeInTheDocument();
  });

  // FR-6: mobile hides main content when task is selected
  it("should hide main content on mobile when task is selected", () => {
    mockUseIsDesktop.mockReturnValue(false);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Child content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn).toHaveClass("hidden");
  });

  // FR-6: mobile shows main content when no task selected
  it("should show main content on mobile when no task is selected", () => {
    mockUseIsDesktop.mockReturnValue(false);
    render(
      <TaskPageLayout {...baseProps} selectedTask={null}>
        <div>Child content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn).not.toHaveClass("hidden");
  });

  // FR17: main content has no extra padding — CommandBar is in the layout flow
  it("should not apply command-bar padding to main content", () => {
    render(
      <TaskPageLayout {...baseProps}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainElement = screen.getByRole("main");
    expect(mainElement.style.paddingBottom).toBe("");
    expect(mainElement.style.paddingTop).toBe("");
  });

  // FR-6: desktop with selected task applies split ratio to main column
  it("should apply split ratio width on desktop when task is selected", () => {
    mockUseIsDesktop.mockReturnValue(true);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn.style.width).toBe("60%");
  });

  // FR-6: desktop without selected task uses flex style for main column
  it("should apply flex style to main column on desktop when no task selected", () => {
    mockUseIsDesktop.mockReturnValue(true);
    render(
      <TaskPageLayout {...baseProps} selectedTask={null}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn.style.flex).toContain("1 1");
    expect(mainColumn.style.width).toBe("");
  });

  // FR-6: mobile uses flex style for main column
  it("should apply flex style to main column on mobile", () => {
    mockUseIsDesktop.mockReturnValue(false);
    render(
      <TaskPageLayout {...baseProps} selectedTask={null}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn.style.flex).toContain("1 1");
  });

  // FR-6: detail panel gets correct width style on desktop
  it("should apply split ratio width to detail panel on desktop", () => {
    mockUseIsDesktop.mockReturnValue(true);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const detailPanel = screen.getByTestId("task-detail-panel");
    expect(detailPanel.style.width).toBe("40%");
    expect(detailPanel.style.flexShrink).toBe("0");
  });

  // FR-6: detail panel gets flex style on mobile
  it("should apply flex style to detail panel on mobile", () => {
    mockUseIsDesktop.mockReturnValue(false);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const detailPanel = screen.getByTestId("task-detail-panel");
    expect(detailPanel.style.flex).toContain("1 1");
  });

  // FR-6: main column has flex-col and overflow-hidden classes
  it("should have flex-col and overflow-hidden classes on main column", () => {
    render(
      <TaskPageLayout {...baseProps}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn).toHaveClass("flex", "flex-col", "overflow-hidden");
  });

  // FR-6: main column flexShrink is 0 on desktop with task selected
  it("should set flexShrink 0 on main column when desktop and task selected", () => {
    mockUseIsDesktop.mockReturnValue(true);
    render(
      <TaskPageLayout {...baseProps} selectedTask={selectedTask}>
        <div>Content</div>
      </TaskPageLayout>,
    );
    const mainColumn = screen.getByTestId("main-column");
    expect(mainColumn.style.flexShrink).toBe("0");
  });

  // FR3: backdrop renders on mobile when sidebar is open
  describe("Backdrop (FR3)", () => {
    it("should render backdrop on mobile when sidebar is open", () => {
      mockUseIsDesktop.mockReturnValue(false);
      mockUsePanelOpen.mockReturnValue({
        isPanelOpen: false,
        isTemporarilyOpen: true,
        effectiveIsOpen: true,
        togglePanelOpen: mockTogglePanelOpen,
        openTemporarily: vi.fn(),
        closeTemporary: mockCloseTemporary,
      });
      render(
        <TaskPageLayout {...baseProps}>
          <div>Content</div>
        </TaskPageLayout>,
      );
      expect(screen.getByTestId("sidebar-backdrop")).toBeInTheDocument();
    });

    it("should not render backdrop on desktop even when sidebar is open", () => {
      mockUseIsDesktop.mockReturnValue(true);
      mockUsePanelOpen.mockReturnValue({
        isPanelOpen: true,
        isTemporarilyOpen: false,
        effectiveIsOpen: true,
        togglePanelOpen: mockTogglePanelOpen,
        openTemporarily: vi.fn(),
        closeTemporary: mockCloseTemporary,
      });
      render(
        <TaskPageLayout {...baseProps}>
          <div>Content</div>
        </TaskPageLayout>,
      );
      expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
    });

    it("should not render backdrop on mobile when sidebar is closed", () => {
      mockUseIsDesktop.mockReturnValue(false);
      render(
        <TaskPageLayout {...baseProps}>
          <div>Content</div>
        </TaskPageLayout>,
      );
      expect(screen.queryByTestId("sidebar-backdrop")).not.toBeInTheDocument();
    });

    describe("when visible on mobile", () => {
      beforeEach(() => {
        mockUseIsDesktop.mockReturnValue(false);
        mockUsePanelOpen.mockReturnValue({
          isPanelOpen: false,
          isTemporarilyOpen: true,
          effectiveIsOpen: true,
          togglePanelOpen: mockTogglePanelOpen,
          openTemporarily: vi.fn(),
          closeTemporary: mockCloseTemporary,
        });
      });

      it("should call closeTemporary when backdrop is clicked", () => {
        render(
          <TaskPageLayout {...baseProps}>
            <div>Content</div>
          </TaskPageLayout>,
        );
        const backdrop = screen.getByTestId("sidebar-backdrop");
        fireEvent.click(backdrop);
        expect(mockCloseTemporary).toHaveBeenCalledTimes(1);
      });

      it("should have aria-label for accessibility", () => {
        render(
          <TaskPageLayout {...baseProps}>
            <div>Content</div>
          </TaskPageLayout>,
        );
        const backdrop = screen.getByTestId("sidebar-backdrop");
        expect(backdrop).toHaveAttribute(
          "aria-label",
          "Закрыть боковую панель",
        );
      });

      it("should have role button on backdrop", () => {
        render(
          <TaskPageLayout {...baseProps}>
            <div>Content</div>
          </TaskPageLayout>,
        );
        const backdrop = screen.getByTestId("sidebar-backdrop");
        expect(backdrop).toHaveAttribute("role", "button");
      });

      it("should have correct styling classes on backdrop", () => {
        render(
          <TaskPageLayout {...baseProps}>
            <div>Content</div>
          </TaskPageLayout>,
        );
        const backdrop = screen.getByTestId("sidebar-backdrop");
        expect(backdrop).toHaveClass("fixed", "inset-0", "z-10");
      });
    });
  });
});
