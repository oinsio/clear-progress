import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLongPress } from "@/hooks/useLongPress";
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

vi.mock("@/hooks/useLongPress", () => ({
  useLongPress: vi.fn().mockReturnValue({}),
}));

function renderDirectTaskItem(overrides: Record<string, unknown> = {}) {
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
  render(
    <TaskItem {...(props as unknown as Parameters<typeof TaskItem>[0])} />,
  );
  return props;
}

describe("TaskItem — long press for selection on mobile", () => {
  it("should call onSelect with task id on long press when on mobile", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    const onSelect = vi.fn();
    const onExpand = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({ task, onSelect, onExpand });

    // Extract the onLongPress callback passed to useLongPress
    const longPressCall = vi.mocked(useLongPress).mock.calls.at(-1);
    expect(longPressCall).toBeDefined();
    const longPressConfig = longPressCall![0];
    longPressConfig.onLongPress();

    expect(onSelect).toHaveBeenCalledWith(task.id);
    expect(onExpand).toHaveBeenCalledWith(null);
  });

  it("should not call onSelect on long press when on desktop", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(true);

    const onSelect = vi.fn();
    const task = buildTask();
    renderDirectTaskItem({ task, onSelect });

    const longPressCall = vi.mocked(useLongPress).mock.calls.at(-1);
    const longPressConfig = longPressCall![0];
    longPressConfig.onLongPress();

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should not crash on long press when onSelect is not provided", async () => {
    const { useIsDesktop } = await import("@/hooks/useIsDesktop");
    vi.mocked(useIsDesktop).mockReturnValue(false);

    renderDirectTaskItem({ onSelect: undefined });

    const longPressCall = vi.mocked(useLongPress).mock.calls.at(-1);
    const longPressConfig = longPressCall![0];

    expect(() => longPressConfig.onLongPress()).not.toThrow();
  });
});

describe("TaskItem — drag handle", () => {
  it("should render drag handle when dragHandleProps is provided", () => {
    renderDirectTaskItem({
      dragHandleProps: {
        ref: vi.fn(),
        attributes: {},
        listeners: {},
      },
    });
    expect(
      screen.getByRole("button", { name: /перетащить/i }),
    ).toBeInTheDocument();
  });

  it("should not render drag handle when dragHandleProps is not provided", () => {
    renderDirectTaskItem();
    expect(
      screen.queryByRole("button", { name: /перетащить/i }),
    ).not.toBeInTheDocument();
  });
});
