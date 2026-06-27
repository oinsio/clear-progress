// implements FR3, FR4, FR5 of pin-task-detail-panel
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";

// Mock useIsDesktop
let mockIsDesktop = true;
vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

// Mock useDetailPanelPinned
let mockIsDetailPanelPinned = false;
vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({
    isDetailPanelPinned: mockIsDetailPanelPinned,
    setDetailPanelPinned: vi.fn(),
  }),
}));

// Mock usePanelSplit
vi.mock("@/hooks/usePanelSplit", () => ({
  usePanelSplit: () => ({
    ratio: 0.5,
    containerRef: { current: null },
    handleResizeMouseDown: vi.fn(),
  }),
}));

// Mock usePanelSide
vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({
    panelSide: "right",
    setPanelSide: vi.fn(),
  }),
}));

// Mock useSidebarState — dynamic, tied to mockIsDesktop
vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    effectiveState: "collapsed",
    sidebarMode: "expanded",
    setSidebarMode: vi.fn(),
    isNarrow: !mockIsDesktop,
    hasHover: mockIsDesktop,
  }),
}));

// Mock useSidebarNavigation
vi.mock("@/hooks/useSidebarNavigation", () => ({
  useSidebarNavigation: () => vi.fn(),
}));

// Mock Sidebar
vi.mock("@/components/tasks/Sidebar", () => ({
  Sidebar: () => null,
}));

// Mock TaskDetailPanel
vi.mock("@/components/tasks/TaskDetailPanel", () => ({
  TaskDetailPanel: () =>
    React.createElement("div", { "data-testid": "task-detail-panel" }),
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const feature = await loadFeature("../pin_detail_panel_layout.feature");

const { TaskPageLayout } = await import("@/components/tasks/TaskPageLayout");

import type { Task } from "@/types/entities";

type FeatureContext = Record<string, never>;

let mockSelectedTask: Task | null = null;

const sampleTask: Task = {
  id: "test-id",
  name: "Test Task",
  description: "",
  box: "inbox",
  goal_id: "",
  context_id: "",
  category_id: "",
  repeat_rule: "",
  next_date: "",
  appear_date: "",
  sort_order: "0",
  is_deleted: false,
  is_completed: false,
  is_hidden: false,
  completed_at: "",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  original_task_id: "",
  revision: 0,
  needsSync: false,
};

const defaultProps = {
  sidebarMode: "inbox" as const,
  goals: [],
  contexts: [],
  categories: [],
  onUpdateTask: vi.fn().mockResolvedValue(undefined),
  onDeleteTask: vi.fn(),
  onDuplicateTask: vi.fn().mockResolvedValue(undefined),
  onCloseDetailPanel: vi.fn(),
};

// Reusable step definitions
const givenViewportIsDesktop = (_ctx: TestContext) => {
  mockIsDesktop = true;
};

const givenViewportIsMobile = (_ctx: TestContext) => {
  mockIsDesktop = false;
};

const andDetailPanelIsPinned = (_ctx: TestContext) => {
  mockIsDetailPanelPinned = true;
};

const andDetailPanelIsNotPinned = (_ctx: TestContext) => {
  mockIsDetailPanelPinned = false;
};

const andNoTaskIsSelected = (_ctx: TestContext) => {
  mockSelectedTask = null;
};

const andTaskIsSelected = (_ctx: TestContext) => {
  mockSelectedTask = sampleTask;
};

const whenTaskPageLayoutIsRendered = (_ctx: TestContext) => {
  render(
    React.createElement(
      TaskPageLayout,
      {
        ...defaultProps,
        selectedTask: mockSelectedTask,
      } as unknown as React.ComponentProps<typeof TaskPageLayout>,
      React.createElement("div", null, "Content"),
    ),
  );
};

const thenEmptyStatePlaceholderIsShown = (_ctx: TestContext) => {
  expect(screen.getByTestId("detail-panel-empty-state")).toBeDefined();
};

const thenEmptyStatePlaceholderIsNotShown = (_ctx: TestContext) => {
  expect(screen.queryByTestId("detail-panel-empty-state")).toBeNull();
};

const andResizeHandleIsVisible = (_ctx: TestContext) => {
  expect(screen.getByTestId("resize-handle")).toBeDefined();
};

const andResizeHandleIsNotVisible = (_ctx: TestContext) => {
  expect(screen.queryByTestId("resize-handle")).toBeNull();
};

const thenTaskDetailPanelIsShown = (_ctx: TestContext) => {
  expect(screen.getByTestId("task-detail-panel")).toBeDefined();
};

const andTaskDetailPanelIsNotShown = (_ctx: TestContext) => {
  expect(screen.queryByTestId("task-detail-panel")).toBeNull();
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      mockIsDesktop = true;
      mockIsDetailPanelPinned = false;
      mockSelectedTask = null;
    });

    f.Scenario(
      "Pinned with no task shows empty state",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", givenViewportIsDesktop);
        And("detail panel is pinned", andDetailPanelIsPinned);
        And("no task is selected", andNoTaskIsSelected);
        When("TaskPageLayout is rendered", whenTaskPageLayoutIsRendered);
        Then(
          "the empty state placeholder is shown",
          thenEmptyStatePlaceholderIsShown,
        );
        And("the resize handle is visible", andResizeHandleIsVisible);
      },
    );

    f.Scenario(
      "Pinned with task shows detail panel",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", givenViewportIsDesktop);
        And("detail panel is pinned", andDetailPanelIsPinned);
        And("a task is selected", andTaskIsSelected);
        When("TaskPageLayout is rendered", whenTaskPageLayoutIsRendered);
        Then("TaskDetailPanel is shown", thenTaskDetailPanelIsShown);
      },
    );

    f.Scenario(
      "Pinned mode ignored on mobile",
      ({ Given, And, When, Then }) => {
        Given("the viewport is mobile", givenViewportIsMobile);
        And("detail panel is pinned", andDetailPanelIsPinned);
        And("no task is selected", andNoTaskIsSelected);
        When("TaskPageLayout is rendered", whenTaskPageLayoutIsRendered);
        Then(
          "the empty state placeholder is not shown",
          thenEmptyStatePlaceholderIsNotShown,
        );
        And("the resize handle is not visible", andResizeHandleIsNotVisible);
      },
    );

    f.Scenario(
      "Unpinned hides detail column when no task",
      ({ Given, And, When, Then }) => {
        Given("the viewport is desktop", givenViewportIsDesktop);
        And("detail panel is not pinned", andDetailPanelIsNotPinned);
        And("no task is selected", andNoTaskIsSelected);
        When("TaskPageLayout is rendered", whenTaskPageLayoutIsRendered);
        Then(
          "the empty state placeholder is not shown",
          thenEmptyStatePlaceholderIsNotShown,
        );
        And("TaskDetailPanel is not shown", andTaskDetailPanelIsNotShown);
      },
    );
  },
);
