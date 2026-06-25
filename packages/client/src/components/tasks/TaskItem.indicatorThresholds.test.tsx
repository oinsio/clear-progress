import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { renderTaskItem } from "./TaskItem.test-utils";

vi.mock("@/hooks/useChecklist", () => ({
  useChecklist: vi.fn().mockReturnValue({
    items: [],
    progress: { completed: 0, total: 0 },
    hasUnsyncedItems: false,
    isLoading: false,
    reload: vi.fn(),
    createItem: vi.fn(),
    toggleItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    reorderItems: vi.fn(),
  }),
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/useHasTouchPointer", () => ({
  useHasTouchPointer: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));

async function mockEmptyChecklistAndAttachments() {
  const { useChecklist } = await import("@/hooks/useChecklist");
  const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
  vi.mocked(useChecklist).mockReturnValue({
    items: [],
    progress: { completed: 0, total: 0 },
    hasUnsyncedItems: false,
    isLoading: false,
    reload: vi.fn(),
    createItem: vi.fn(),
    toggleItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    reorderItems: vi.fn(),
  });
  vi.mocked(useAttachmentCount).mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  });
}

function getIndicatorRow(): HTMLElement | null {
  const taskBody = screen.getByTestId("task-item-body");
  return taskBody.querySelector(".mt-0\\.5.gap-2");
}

describe("TaskItem — indicator row visibility thresholds", () => {
  it("should not render indicator row when no indicator conditions are met", async () => {
    await mockEmptyChecklistAndAttachments();
    renderTaskItem({
      task: buildTask({
        description: "",
        is_completed: false,
        goal_id: "",
        context_id: "",
        category_id: "",
        repeat_rule: "",
        is_hidden: false,
      }),
    });
    expect(getIndicatorRow()).not.toBeInTheDocument();
  });

  it("should not show indicator row when description exists but task is completed", async () => {
    await mockEmptyChecklistAndAttachments();
    renderTaskItem({
      task: buildTask({
        description: "Some desc",
        is_completed: true,
        goal_id: "",
        context_id: "",
        category_id: "",
        repeat_rule: "",
        is_hidden: false,
      }),
    });
    // Indicator row should not render at all
    expect(getIndicatorRow()).not.toBeInTheDocument();
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.querySelector(".lucide-file-text")).not.toBeInTheDocument();
  });

  it("should show indicator row when only description present and task is not completed", () => {
    renderTaskItem({
      task: buildTask({
        description: "Some desc",
        is_completed: false,
        goal_id: "",
        context_id: "",
        category_id: "",
        repeat_rule: "",
        is_hidden: false,
      }),
    });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.querySelector(".lucide-file-text")).toBeInTheDocument();
  });

  it("should show checklist badge only when total is strictly greater than 0", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");

    // total = 0 → no badge
    vi.mocked(useChecklist).mockReturnValue({
      items: [],
      progress: { completed: 0, total: 0 },
      hasUnsyncedItems: false,
      isLoading: false,
      reload: vi.fn(),
      createItem: vi.fn(),
      toggleItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      reorderItems: vi.fn(),
    });
    renderTaskItem({
      task: buildTask({ goal_id: "g1" }),
    });
    // Render with goal_id to ensure indicator row exists but checklist badge should not
    expect(screen.queryByTestId("checklist-badge")).not.toBeInTheDocument();
  });

  it("should show attachment badge only when count is strictly greater than 0", async () => {
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");

    // attachmentCount = 0 → no badge
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 0,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
    renderTaskItem({
      task: buildTask({ goal_id: "g1" }),
    });
    expect(screen.queryByTestId("attachment-badge")).not.toBeInTheDocument();

    // attachmentCount = 1 → badge shown
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 1,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
    renderTaskItem({
      task: buildTask({ goal_id: "g1" }),
    });
    expect(screen.getByTestId("attachment-badge")).toBeInTheDocument();
  });
});

describe("TaskItem — repeat rule indicator", () => {
  it("should show repeat indicator when repeat_rule is set", () => {
    renderTaskItem({
      task: buildTask({ repeat_rule: "daily" }),
    });
    expect(screen.getByTestId("repeat-rule-indicator")).toBeInTheDocument();
  });

  it("should not show repeat indicator when repeat_rule is empty", () => {
    renderTaskItem({
      task: buildTask({ repeat_rule: "" }),
    });
    expect(
      screen.queryByTestId("repeat-rule-indicator"),
    ).not.toBeInTheDocument();
  });
});

describe("TaskItem — hidden task indicator", () => {
  it("should show hidden indicator when is_hidden is true", () => {
    renderTaskItem({ task: buildTask({ is_hidden: true }) });
    expect(screen.getByTestId("hidden-task-indicator")).toBeInTheDocument();
  });

  it("should not show hidden indicator when is_hidden is false", () => {
    renderTaskItem({ task: buildTask({ is_hidden: false }) });
    expect(
      screen.queryByTestId("hidden-task-indicator"),
    ).not.toBeInTheDocument();
  });
});
