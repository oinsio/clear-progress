import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { TaskItem } from "./TaskItem";

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
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSwipeAction", () => ({
  useSwipeAction: vi.fn().mockReturnValue({
    translateX: 0,
    isThresholdReached: false,
  }),
}));

function StatefulTaskItem(props: Record<string, unknown>) {
  const task = props.task as { id: string };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <TaskItem
      {...(props as unknown as Parameters<typeof TaskItem>[0])}
      isExpanded={expandedId === task.id}
      onExpand={setExpandedId}
    />
  );
}

function renderTaskItem(overrides: Record<string, unknown> = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    contexts: [],
    categories: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<StatefulTaskItem {...props} />);
  return props;
}

describe("TaskItem", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the task name", () => {
    renderTaskItem({ task: buildTask({ name: "Buy groceries" }) });
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("should have data-test-id='task-item'", () => {
    renderTaskItem();
    expect(screen.getByTestId("task-item")).toBeInTheDocument();
  });

  it("should apply line-through styling when task is completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    expect(screen.getByTestId("task-item-name")).toHaveClass("line-through");
  });

  it("should not apply line-through styling when task is not completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    expect(screen.getByTestId("task-item-name")).not.toHaveClass(
      "line-through",
    );
  });

  it("should apply base text-sm styling to name regardless of completion state", () => {
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    expect(screen.getByTestId("task-item-name")).toHaveClass("text-sm");
  });

  it("should call onComplete with task id after animation delay when complete button is clicked on incomplete task", () => {
    vi.useFakeTimers();
    const task = buildTask({ is_completed: false });
    const onComplete = vi.fn();
    renderTaskItem({ task, onComplete });
    fireEvent.click(screen.getByRole("button", { name: /завершить задачу/i }));
    expect(onComplete).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should NOT call onComplete immediately when complete button is clicked on completed task", async () => {
    const onComplete = vi.fn();
    renderTaskItem({ task: buildTask({ is_completed: true }), onComplete });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should show restore confirmation when complete button is clicked on completed task", async () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    expect(screen.getByTestId("restore-confirmation")).toBeInTheDocument();
  });

  it("should call onComplete with task id when 'Вернуть' button is clicked", async () => {
    const task = buildTask({ is_completed: true });
    const onComplete = vi.fn();
    renderTaskItem({ task, onComplete });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /вернуть/i }));
    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should hide restore confirmation after 'Вернуть' is clicked", async () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /вернуть/i }));
    expect(
      screen.queryByTestId("restore-confirmation"),
    ).not.toBeInTheDocument();
  });

  it("should hide restore confirmation when cancel button is clicked", async () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /отмена/i }));
    expect(
      screen.queryByTestId("restore-confirmation"),
    ).not.toBeInTheDocument();
  });

  it("should NOT call onComplete when cancel button is clicked", async () => {
    const onComplete = vi.fn();
    renderTaskItem({ task: buildTask({ is_completed: true }), onComplete });
    await userEvent.click(
      screen.getByRole("button", { name: /снять завершение/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /отмена/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("should have aria-label 'Завершить задачу' when task is not completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    expect(
      screen.getByRole("button", { name: /завершить задачу/i }),
    ).toBeInTheDocument();
  });

  it("should have aria-label 'Снять завершение' when task is completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    expect(
      screen.getByRole("button", { name: /снять завершение/i }),
    ).toBeInTheDocument();
  });

  it("should show filled complete button when task is completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    const btn = screen.getByRole("button", { name: /снять завершение/i });
    expect(btn).toHaveClass("bg-accent/20");
    expect(btn).toHaveClass("border-accent");
  });

  it("should show checkmark svg when task is completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: true }) });
    const btn = screen.getByRole("button", { name: /снять завершение/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
  });

  it("should show checkmark svg immediately when complete button is clicked before delay", () => {
    vi.useFakeTimers();
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    fireEvent.click(screen.getByRole("button", { name: /завершить задачу/i }));
    const btn = screen.getByRole("button", { name: /завершить задачу/i });
    expect(btn.querySelector("svg")).toBeInTheDocument();
    vi.runAllTimers();
  });

  it("should not show checkmark svg when task is not completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    const btn = screen.getByRole("button", { name: /завершить задачу/i });
    expect(btn.querySelector("svg")).not.toBeInTheDocument();
  });

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

  // Expand / collapse quick actions
  it("should not show quick actions initially", () => {
    renderTaskItem();
    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should show quick actions when task body is clicked", async () => {
    renderTaskItem();
    await userEvent.click(screen.getByTestId("task-item-body"));
    expect(screen.getByTestId("task-quick-actions")).toBeInTheDocument();
  });

  it("should hide quick actions when task body is clicked again", async () => {
    renderTaskItem();
    await userEvent.click(screen.getByTestId("task-item-body"));
    await userEvent.click(screen.getByTestId("task-item-body"));
    expect(screen.queryByTestId("task-quick-actions")).not.toBeInTheDocument();
  });

  it("should pass goals to quick actions", async () => {
    const goal = buildGoal({ name: "My Goal" });
    renderTaskItem({ goals: [goal] });
    await userEvent.click(screen.getByTestId("task-item-body"));
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    expect(screen.getByText("My Goal")).toBeInTheDocument();
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

  // Desktop behavior - should work as before
  describe("desktop behavior", () => {
    it("should call onSelect on click when on desktop", async () => {
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");
      vi.mocked(useIsDesktop).mockReturnValue(true);

      const onSelect = vi.fn();
      const task = buildTask();
      renderTaskItem({ task, onSelect });

      await userEvent.click(screen.getByTestId("task-item-body"));

      expect(onSelect).toHaveBeenCalledWith(task.id);
    });
  });

  // Attachment indicator (FR6)
  it("should not show attachment badge when task has no attachments", () => {
    renderTaskItem();
    expect(screen.queryByTestId("attachment-badge")).not.toBeInTheDocument();
  });

  it("should show attachment badge with count when task has attachments", async () => {
    const { useAttachmentCount } = await import("@/hooks/useAttachmentCount");
    vi.mocked(useAttachmentCount).mockReturnValue({
      attachmentCount: 3,
      isLoading: false,
    });
    renderTaskItem();
    expect(screen.getByTestId("attachment-badge")).toBeInTheDocument();
    expect(screen.getByTestId("attachment-badge")).toHaveTextContent("3");
  });

  // Goal indicator (FR7)
  it("should not show goal indicator when task has no goal", () => {
    renderTaskItem({ task: buildTask({ goal_id: "" }) });
    expect(screen.queryByTestId("goal-indicator")).not.toBeInTheDocument();
  });

  it("should show goal indicator when task has a goal", () => {
    renderTaskItem({ task: buildTask({ goal_id: "some-goal-id" }) });
    expect(screen.getByTestId("goal-indicator")).toBeInTheDocument();
  });

  // Context indicator (FR8)
  it("should not show context indicator when task has no context", () => {
    renderTaskItem({ task: buildTask({ context_id: "" }) });
    expect(screen.queryByTestId("context-indicator")).not.toBeInTheDocument();
  });

  it("should show context indicator when task has a context", () => {
    renderTaskItem({ task: buildTask({ context_id: "some-context-id" }) });
    expect(screen.getByTestId("context-indicator")).toBeInTheDocument();
  });

  // Category indicator (FR9)
  it("should not show category indicator when task has no category", () => {
    renderTaskItem({ task: buildTask({ category_id: "" }) });
    expect(screen.queryByTestId("category-indicator")).not.toBeInTheDocument();
  });

  it("should show category indicator when task has a category", () => {
    renderTaskItem({ task: buildTask({ category_id: "some-category-id" }) });
    expect(screen.getByTestId("category-indicator")).toBeInTheDocument();
  });

  // Indicator order (FR10)
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

  // Swipe and checkbox logic
  describe("swipe and checkbox visibility", () => {
    it("should enable swipe when hasTouchPointer is true (phone)", async () => {
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");
      const { useSwipeAction } = await import("@/hooks/useSwipeAction");
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");

      vi.mocked(useHasTouchPointer).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(false);
      const mockUseSwipeAction = vi.mocked(useSwipeAction);

      renderTaskItem();

      expect(mockUseSwipeAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        true,
      );
    });

    it("should enable swipe when hasTouchPointer is true even on desktop (tablet)", async () => {
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");
      const { useSwipeAction } = await import("@/hooks/useSwipeAction");
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");

      vi.mocked(useHasTouchPointer).mockReturnValue(true);
      vi.mocked(useIsDesktop).mockReturnValue(true);
      const mockUseSwipeAction = vi.mocked(useSwipeAction);

      renderTaskItem();

      expect(mockUseSwipeAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        true,
      );
    });

    it("should disable swipe when hasTouchPointer is false", async () => {
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");
      const { useSwipeAction } = await import("@/hooks/useSwipeAction");

      vi.mocked(useHasTouchPointer).mockReturnValue(false);
      const mockUseSwipeAction = vi.mocked(useSwipeAction);

      renderTaskItem();

      expect(mockUseSwipeAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        false,
      );
    });

    it("should show checkbox when isDesktop is true (tablet/desktop)", async () => {
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");

      vi.mocked(useIsDesktop).mockReturnValue(true);
      vi.mocked(useHasTouchPointer).mockReturnValue(true);

      renderTaskItem({ task: buildTask({ is_completed: false }) });

      expect(
        screen.getByRole("button", { name: /завершить задачу/i }),
      ).toBeInTheDocument();
    });

    it("should show checkbox when hasTouchPointer is false (desktop with mouse)", async () => {
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");

      vi.mocked(useIsDesktop).mockReturnValue(true);
      vi.mocked(useHasTouchPointer).mockReturnValue(false);

      renderTaskItem({ task: buildTask({ is_completed: false }) });

      expect(
        screen.getByRole("button", { name: /завершить задачу/i }),
      ).toBeInTheDocument();
    });

    it("should hide checkbox only when isDesktop is false AND hasTouchPointer is true (phone)", async () => {
      const { useIsDesktop } = await import("@/hooks/useIsDesktop");
      const { useHasTouchPointer } = await import("@/hooks/useHasTouchPointer");

      vi.mocked(useIsDesktop).mockReturnValue(false);
      vi.mocked(useHasTouchPointer).mockReturnValue(true);

      renderTaskItem({ task: buildTask({ is_completed: false }) });

      expect(
        screen.queryByRole("button", { name: /завершить задачу/i }),
      ).not.toBeInTheDocument();
    });
  });
});
