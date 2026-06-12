import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("TaskItem — desktop behavior", () => {
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

describe("TaskItem — swipe and checkbox visibility", () => {
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
