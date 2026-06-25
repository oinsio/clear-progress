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

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: vi
    .fn()
    .mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() }),
}));

describe("TaskItem — focus dimming", () => {
  it("should not apply opacity style when isFocusDimmed is false even with focusDimmedOpacity", () => {
    renderTaskItem({ isFocusDimmed: false, focusDimmedOpacity: 30 });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.style.opacity).toBe("");
  });

  it("should apply opacity style when isFocusDimmed is true and focusDimmedOpacity is set", () => {
    renderTaskItem({
      isFocusDimmed: true,
      focusDimmedOpacity: 30,
    });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.style.opacity).toBe("0.3");
  });

  it("should apply transition-opacity class when isFocusDimmed is true and task is not hidden", () => {
    renderTaskItem({
      task: buildTask({ is_hidden: false }),
      isFocusDimmed: true,
    });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("transition-opacity");
  });

  it("should not apply transition-opacity class when task is hidden even if isFocusDimmed is true", () => {
    renderTaskItem({
      task: buildTask({ is_hidden: true }),
      isFocusDimmed: true,
    });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).not.toHaveClass("transition-opacity");
  });

  it("should apply opacity-50 class when task is hidden", () => {
    renderTaskItem({ task: buildTask({ is_hidden: true }) });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("opacity-50");
  });

  it("should not apply opacity-50 class when task is not hidden", () => {
    renderTaskItem({ task: buildTask({ is_hidden: false }) });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).not.toHaveClass("opacity-50");
  });

  it("should not apply opacity style when focusDimmedOpacity is undefined even if isFocusDimmed is true", () => {
    renderTaskItem({
      isFocusDimmed: true,
      focusDimmedOpacity: undefined,
    });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.style.opacity).toBe("");
  });
});

describe("TaskItem — selected styling", () => {
  it("should apply bg-accent/5 class when task is selected", () => {
    renderTaskItem({ isSelected: true });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.className).toContain("bg-accent/5");
  });

  it("should not apply bg-accent/5 class when task is not selected", () => {
    renderTaskItem({ isSelected: false });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem.className).not.toContain("bg-accent/5");
  });

  it("should apply border-l-accent when task is selected and not unsynced", () => {
    renderTaskItem({ isSelected: true });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("border-l-accent");
  });

  it("should apply border-l-transparent when task is not selected and not unsynced", () => {
    renderTaskItem({ isSelected: false });
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("border-l-transparent");
  });
});

describe("TaskItem — panel side styling", () => {
  it("should apply border styling based on panel side", async () => {
    const { usePanelSide } = await import("@/hooks/usePanelSide");
    vi.mocked(usePanelSide).mockReturnValue({
      panelSide: "left",
      setPanelSide: vi.fn(),
    });
    renderTaskItem();
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("border-l-2");
    expect(taskItem).not.toHaveClass("border-l-[4px]");
  });

  it("should apply wider border on right panel side for mobile", async () => {
    const { usePanelSide } = await import("@/hooks/usePanelSide");
    vi.mocked(usePanelSide).mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
    renderTaskItem();
    const taskItem = screen.getByTestId("task-item");
    expect(taskItem).toHaveClass("border-l-[4px]");
  });
});

describe("TaskItem — unsynced border", () => {
  it("should show amber border when checklist has unsynced items", async () => {
    const { useChecklist } = await import("@/hooks/useChecklist");
    vi.mocked(useChecklist).mockReturnValue({
      items: [],
      progress: { completed: 0, total: 0 },
      hasUnsyncedItems: true,
      isLoading: false,
      reload: vi.fn(),
      createItem: vi.fn(),
      toggleItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      reorderItems: vi.fn(),
    });
    renderTaskItem();
    expect(screen.getByTestId("task-item")).toHaveClass("border-l-amber-400");
  });
});
