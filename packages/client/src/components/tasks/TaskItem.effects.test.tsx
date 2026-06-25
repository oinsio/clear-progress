import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
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
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));

function buildTaskItemProps(overrides: Record<string, unknown> = {}) {
  return {
    task: buildTask(),
    goals: [],
    contexts: [],
    categories: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn(),
    ...overrides,
  };
}

function renderDirectTaskItem(overrides: Record<string, unknown> = {}) {
  const props = buildTaskItemProps(overrides);
  return {
    ...render(
      <TaskItem {...(props as unknown as Parameters<typeof TaskItem>[0])} />,
    ),
    props,
  };
}

describe("TaskItem — desktop auto-collapse effect", () => {
  it("should call onExpand(null) when switching to desktop while expanded", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    const onExpand = vi.fn();
    vi.mocked(useIsDesktop).mockReturnValue(true);

    renderDirectTaskItem({ isExpanded: true, onExpand });

    expect(onExpand).toHaveBeenCalledWith(null);
  });

  it("should not call onExpand when on desktop but not expanded", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    const onExpand = vi.fn();
    vi.mocked(useIsDesktop).mockReturnValue(true);

    renderDirectTaskItem({ isExpanded: false, onExpand });

    expect(onExpand).not.toHaveBeenCalled();
  });

  it("should not call onExpand when expanded but not on desktop", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    const onExpand = vi.fn();
    vi.mocked(useIsDesktop).mockReturnValue(false);

    renderDirectTaskItem({ isExpanded: true, onExpand });

    expect(onExpand).not.toHaveBeenCalled();
  });
});

describe("TaskItem — handleOpenEdit via quick actions", () => {
  it("should call onSelect and collapse when edit is triggered from quick actions", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onSelect = vi.fn();
    const onExpand = vi.fn();
    const task = buildTask();

    renderDirectTaskItem({
      task,
      isExpanded: true,
      onExpand,
      onSelect,
    });

    // Quick actions should be visible since isExpanded is true
    const editButton = screen.getByRole("button", {
      name: /открыть редактирование/i,
    });
    await userEvent.click(editButton);

    expect(onSelect).toHaveBeenCalledWith(task.id);
    expect(onExpand).toHaveBeenCalledWith(null);
  });
});

describe("TaskItem — desktop body click without onSelect", () => {
  it("should expand/collapse on desktop when onSelect is not provided", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(true);

    const onExpand = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({
      task,
      isExpanded: false,
      onExpand,
      onSelect: undefined,
    });

    await userEvent.click(screen.getByTestId("task-item-body"));

    // Without onSelect on desktop, should fall through to onExpand
    expect(onExpand).toHaveBeenCalledWith(task.id);
  });

  it("should not call onSelect when not provided even on desktop", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(true);

    const onExpand = vi.fn();
    renderDirectTaskItem({ isExpanded: false, onExpand, onSelect: undefined });

    await userEvent.click(screen.getByTestId("task-item-body"));

    // No crash, onExpand called instead
    expect(onExpand).toHaveBeenCalled();
  });
});

describe("TaskItem — handleOpenEdit without onSelect", () => {
  it("should not crash when onSelect is undefined and edit is triggered", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onExpand = vi.fn();
    renderDirectTaskItem({
      isExpanded: true,
      onExpand,
      onSelect: undefined,
    });

    const editButton = screen.getByRole("button", {
      name: /открыть редактирование/i,
    });
    await userEvent.click(editButton);

    expect(onExpand).toHaveBeenCalledWith(null);
  });
});

describe("TaskItem — handleOpenEdit without onExpand", () => {
  it("should not crash when onExpand is undefined and edit is triggered", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onSelect = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({
      task,
      isExpanded: true,
      onExpand: undefined,
      onSelect,
    });

    const editButton = screen.getByRole("button", {
      name: /открыть редактирование/i,
    });
    await userEvent.click(editButton);

    expect(onSelect).toHaveBeenCalledWith(task.id);
  });
});

describe("TaskItem — mobile body click expand/collapse", () => {
  it("should call onExpand with task id when body is clicked on mobile and not expanded", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onExpand = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({ task, isExpanded: false, onExpand });

    await userEvent.click(screen.getByTestId("task-item-body"));

    expect(onExpand).toHaveBeenCalledWith(task.id);
  });

  it("should call onExpand with null when body is clicked on mobile and already expanded", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onExpand = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({ task, isExpanded: true, onExpand });

    await userEvent.click(screen.getByTestId("task-item-body"));

    expect(onExpand).toHaveBeenCalledWith(null);
  });
});
