import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/test/factories/goalFactory";
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

vi.mock("@/hooks/useSwipeAction", () => ({
  useSwipeAction: vi.fn().mockReturnValue({
    translateX: 0,
    isThresholdReached: false,
  }),
}));

describe("TaskItem — quick actions", () => {
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
});
