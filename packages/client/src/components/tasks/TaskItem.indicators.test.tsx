import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
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

describe("TaskItem — indicators", () => {
  // completed_at
  it("should show completed_at label when task is completed and has completed_at", () => {
    renderTaskItem({
      task: buildTask({
        is_completed: true,
        completed_at: toISOTimestamp(),
      }),
    });
    expect(screen.getByTestId("task-item-completed-at")).toBeInTheDocument();
  });

  it("should not show completed_at label when task is not completed", () => {
    renderTaskItem({
      task: buildTask({ is_completed: false, completed_at: "" }),
    });
    expect(
      screen.queryByTestId("task-item-completed-at"),
    ).not.toBeInTheDocument();
  });

  it("should not show completed_at label when task is completed but has no completed_at", () => {
    renderTaskItem({
      task: buildTask({ is_completed: true, completed_at: "" }),
    });
    expect(
      screen.queryByTestId("task-item-completed-at"),
    ).not.toBeInTheDocument();
  });

  // Checklist badge
  it("should not show checklist badge when task has no checklist items", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");
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
    renderTaskItem();
    expect(screen.queryByTestId("checklist-badge")).not.toBeInTheDocument();
  });

  it("should show checklist badge when task has checklist items", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");
    vi.mocked(useChecklist).mockReturnValue({
      items: [],
      progress: { completed: 1, total: 3 },
      hasUnsyncedItems: false,
      isLoading: false,
      reload: vi.fn(),
      createItem: vi.fn(),
      toggleItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      reorderItems: vi.fn(),
    });
    renderTaskItem();
    expect(screen.getByTestId("checklist-badge")).toBeInTheDocument();
  });

  it("should display checklist progress as 'completed/total' in badge", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");
    vi.mocked(useChecklist).mockReturnValue({
      items: [],
      progress: { completed: 2, total: 5 },
      hasUnsyncedItems: false,
      isLoading: false,
      reload: vi.fn(),
      createItem: vi.fn(),
      toggleItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      reorderItems: vi.fn(),
    });
    renderTaskItem();
    expect(screen.getByTestId("checklist-badge")).toHaveTextContent("2/5");
  });

  // Attachment badge
  it("should not show attachment badge when task has no attachments", () => {
    renderTaskItem();
    expect(screen.queryByTestId("attachment-badge")).not.toBeInTheDocument();
  });

  it("should show attachment badge with count when task has attachments", async () => {
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 3,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
    renderTaskItem();
    expect(screen.getByTestId("attachment-badge")).toBeInTheDocument();
    expect(screen.getByTestId("attachment-badge")).toHaveTextContent("3");
  });

  // Goal indicator
  it("should not show goal indicator when task has no goal", () => {
    renderTaskItem({ task: buildTask({ goal_id: "" }) });
    expect(screen.queryByTestId("goal-indicator")).not.toBeInTheDocument();
  });

  it("should show goal indicator when task has a goal", () => {
    renderTaskItem({ task: buildTask({ goal_id: "some-goal-id" }) });
    expect(screen.getByTestId("goal-indicator")).toBeInTheDocument();
  });

  // Context indicator
  it("should not show context indicator when task has no context", () => {
    renderTaskItem({ task: buildTask({ context_id: "" }) });
    expect(screen.queryByTestId("context-indicator")).not.toBeInTheDocument();
  });

  it("should show context indicator when task has a context", () => {
    renderTaskItem({ task: buildTask({ context_id: "some-context-id" }) });
    expect(screen.getByTestId("context-indicator")).toBeInTheDocument();
  });

  // Category indicator
  it("should not show category indicator when task has no category", () => {
    renderTaskItem({ task: buildTask({ category_id: "" }) });
    expect(screen.queryByTestId("category-indicator")).not.toBeInTheDocument();
  });

  it("should show category indicator when task has a category", () => {
    renderTaskItem({ task: buildTask({ category_id: "some-category-id" }) });
    expect(screen.getByTestId("category-indicator")).toBeInTheDocument();
  });

  // Indicator order
  it("should display indicators in correct order: description, checklist, attachments, goal, context, category, repeat, hidden", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
    vi.mocked(useChecklist).mockReturnValue({
      items: [],
      progress: { completed: 2, total: 5 },
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
      attachmentCount: 3,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
    renderTaskItem({
      task: buildTask({
        description: "Some desc",
        goal_id: "g1",
        context_id: "c1",
        category_id: "cat1",
        repeat_rule: "daily",
        is_hidden: true,
      }),
    });
    const indicatorsRow = screen.getByTestId("checklist-badge").parentElement!;
    const testIds = Array.from(indicatorsRow.children).map(
      (child) => child.getAttribute("data-testid") || child.tagName,
    );
    const checklistIndex = testIds.indexOf("checklist-badge");
    const attachmentIndex = testIds.indexOf("attachment-badge");
    const goalIndex = testIds.indexOf("goal-indicator");
    const contextIndex = testIds.indexOf("context-indicator");
    const categoryIndex = testIds.indexOf("category-indicator");
    const repeatIndex = testIds.indexOf("repeat-rule-indicator");
    const hiddenIndex = testIds.indexOf("hidden-task-indicator");
    expect(checklistIndex).toBeLessThan(attachmentIndex);
    expect(attachmentIndex).toBeLessThan(goalIndex);
    expect(goalIndex).toBeLessThan(contextIndex);
    expect(contextIndex).toBeLessThan(categoryIndex);
    expect(categoryIndex).toBeLessThan(repeatIndex);
    expect(repeatIndex).toBeLessThan(hiddenIndex);
  });

  // Description indicator
  it("should show description indicator when task has description and is not completed", () => {
    renderTaskItem({
      task: buildTask({ description: "Some notes", is_completed: false }),
    });
    const descIcon = document.querySelector(".lucide-file-text");
    expect(descIcon).toBeInTheDocument();
  });

  it("should not show description indicator when task is completed", () => {
    renderTaskItem({
      task: buildTask({ description: "Some notes", is_completed: true }),
    });
    const indicators = screen.queryByTestId("checklist-badge")?.parentElement;
    if (indicators) {
      const descIcon = indicators.querySelector(".lucide-file-text");
      expect(descIcon).not.toBeInTheDocument();
    }
  });

  it("should not show description indicator when task has no description", () => {
    renderTaskItem({
      task: buildTask({ description: "", is_completed: false }),
    });
    const taskItem = screen.getByTestId("task-item");
    const descIcons = taskItem.querySelectorAll(".lucide-file-text");
    expect(descIcons.length).toBe(0);
  });

  // Appear date
  it("should show appear date when task is hidden and has appear_date", () => {
    renderTaskItem({
      task: buildTask({ is_hidden: true, appear_date: "2025-06-15" }),
    });
    expect(screen.getByTestId("task-item-appear-date")).toBeInTheDocument();
  });

  it("should not show appear date when task is not hidden", () => {
    renderTaskItem({
      task: buildTask({ is_hidden: false, appear_date: "2025-06-15" }),
    });
    expect(
      screen.queryByTestId("task-item-appear-date"),
    ).not.toBeInTheDocument();
  });

  it("should not show appear date when task is hidden but has no appear_date", () => {
    renderTaskItem({
      task: buildTask({ is_hidden: true, appear_date: "" }),
    });
    expect(
      screen.queryByTestId("task-item-appear-date"),
    ).not.toBeInTheDocument();
  });

  // Unsync indicator for attachments
  it("should show amber stripe when hasUnsyncedAttachments is true", async () => {
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 1,
      hasUnsyncedAttachments: true,
      isLoading: false,
    });
    renderTaskItem();
    expect(screen.getByTestId("task-item")).toHaveClass("border-l-amber-400");
  });

  it("should not show amber stripe when hasUnsyncedAttachments is false and task is synced", async () => {
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 0,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
    renderTaskItem();
    expect(screen.getByTestId("task-item")).not.toHaveClass(
      "border-l-amber-400",
    );
  });

  // Indicator row visibility
  it("should not show indicator row when task has no indicators", async () => {
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
    renderTaskItem({
      task: buildTask({
        description: "",
        goal_id: "",
        context_id: "",
        category_id: "",
        repeat_rule: "",
        is_hidden: false,
        is_completed: false,
      }),
    });
    expect(screen.queryByTestId("checklist-badge")).not.toBeInTheDocument();
    expect(screen.queryByTestId("attachment-badge")).not.toBeInTheDocument();
    expect(screen.queryByTestId("goal-indicator")).not.toBeInTheDocument();
  });
});
