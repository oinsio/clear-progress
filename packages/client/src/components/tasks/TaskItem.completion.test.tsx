import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

// logicalTodayStore schedules a self-rescheduling real setTimeout; under
// vi.useFakeTimers() + vi.runAllTimers() that loops forever, so it's
// stubbed here since these tests don't exercise day-rollover behavior.
vi.mock("@/hooks/useLogicalToday", () => ({
  useLogicalToday: vi.fn().mockReturnValue("2025-01-15"),
}));

describe("TaskItem — completion", () => {
  afterEach(() => {
    vi.useRealTimers();
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

  it("should show default border style when task is not completed", () => {
    renderTaskItem({ task: buildTask({ is_completed: false }) });
    const btn = screen.getByRole("button", { name: /завершить задачу/i });
    expect(btn).toHaveClass("border-gray-300");
    expect(btn).not.toHaveClass("bg-accent/20");
  });
});
