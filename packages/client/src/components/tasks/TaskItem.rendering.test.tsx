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
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useSwipeAction", () => ({
  useSwipeAction: vi.fn().mockReturnValue({
    translateX: 0,
    isThresholdReached: false,
  }),
}));

describe("TaskItem — rendering", () => {
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
});
