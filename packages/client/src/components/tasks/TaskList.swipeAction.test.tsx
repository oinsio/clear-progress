import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { SwipeActionConfig } from "@/types/swipe";
import { TaskList } from "./TaskList";
import React from "react";

// Capture swipeRight configs passed to SwipeableItem
const capturedSwipeConfigs: SwipeActionConfig[] = [];

vi.mock("@/components/shared/SwipeableItem", () => ({
  SwipeableItem: ({
    children,
    swipeRight,
  }: {
    children: React.ReactNode;
    swipeRight?: SwipeActionConfig;
  }) => {
    if (swipeRight) {
      capturedSwipeConfigs.push(swipeRight);
    }
    return <div data-testid="swipeable-container">{children}</div>;
  },
}));

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

type TaskListProps = Parameters<typeof TaskList>[0];

function buildTaskListProps(
  overrides: Partial<TaskListProps> = {},
): TaskListProps {
  return {
    tasks: [],
    goals: [],
    contexts: [],
    categories: [],
    onComplete: vi.fn(),
    onUpdate: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

describe("TaskList — swipe action invokes onComplete", () => {
  beforeEach(() => {
    capturedSwipeConfigs.length = 0;
  });

  it("should call onComplete with task id when swipe action is triggered on incomplete task", () => {
    const onComplete = vi.fn();
    const task = buildTask({ is_completed: false });
    render(<TaskList {...buildTaskListProps({ tasks: [task], onComplete })} />);

    expect(capturedSwipeConfigs).toHaveLength(1);
    capturedSwipeConfigs[0].onAction();

    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should call onComplete with task id when swipe action is triggered on completed task", () => {
    const onComplete = vi.fn();
    const task = buildTask({ is_completed: true });
    render(<TaskList {...buildTaskListProps({ tasks: [task], onComplete })} />);

    expect(capturedSwipeConfigs).toHaveLength(1);
    capturedSwipeConfigs[0].onAction();

    expect(onComplete).toHaveBeenCalledWith(task.id);
  });

  it("should pass correct onAction for each task in a multi-task list", () => {
    const onComplete = vi.fn();
    const task1 = buildTask({ is_completed: false });
    const task2 = buildTask({ is_completed: true });
    render(
      <TaskList
        {...buildTaskListProps({ tasks: [task1, task2], onComplete })}
      />,
    );

    expect(capturedSwipeConfigs).toHaveLength(2);

    capturedSwipeConfigs[0].onAction();
    expect(onComplete).toHaveBeenCalledWith(task1.id);

    capturedSwipeConfigs[1].onAction();
    expect(onComplete).toHaveBeenCalledWith(task2.id);
  });
});
