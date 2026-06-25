import type { DragEndEvent } from "@dnd-kit/core";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { generateKeyBetween } from "@/services/SortOrderService";
import { buildTask } from "@/test/factories/taskFactory";
import { TaskList } from "./TaskList";
import "./__mocks__/taskListMocks";
import React from "react";

// Capture the onDragEnd callback passed to DndContext
let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;

vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: DragEndEvent) => void;
    }) => {
      capturedOnDragEnd = onDragEnd;
      return <div>{children}</div>;
    },
  };
});

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

// Build tasks with valid fractional-indexing sort_order in descending order
function buildSortedTasks(count: number) {
  const keys: string[] = [];
  let lastKey: string | null = null;
  for (let i = 0; i < count; i++) {
    lastKey = generateKeyBetween(lastKey, null);
    keys.push(lastKey);
  }
  // Tasks sorted descending (highest key first) — matches TaskList convention
  return keys.map((key) => buildTask({ sort_order: key })).reverse();
}

function fireDragEnd(activeId: string, overId: string | null) {
  capturedOnDragEnd!({
    active: { id: activeId },
    over: overId ? { id: overId } : null,
  } as DragEndEvent);
}

describe("TaskList — handleDragEnd", () => {
  it("should call onReorder when dragging task down one position", () => {
    const tasks = buildSortedTasks(3);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd(tasks[0].id, tasks[1].id);

    expect(onReorder).toHaveBeenCalledOnce();
    expect(onReorder).toHaveBeenCalledWith(tasks[0].id, expect.any(String));
  });

  it("should call onReorder when dragging task up one position", () => {
    const tasks = buildSortedTasks(3);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd(tasks[2].id, tasks[1].id);

    expect(onReorder).toHaveBeenCalledOnce();
    expect(onReorder).toHaveBeenCalledWith(tasks[2].id, expect.any(String));
  });

  it("should not call onReorder when dropped on same position", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd(tasks[0].id, tasks[0].id);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("should not call onReorder when over is null", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd(tasks[0].id, null);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("should not call onReorder when active id is not found", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd("non-existent", tasks[0].id);

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("should not call onReorder when over id is not found", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    fireDragEnd(tasks[0].id, "non-existent");

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("should generate sort order between correct neighbors when moving down", () => {
    const tasks = buildSortedTasks(3);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move first to last
    fireDragEnd(tasks[0].id, tasks[2].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // Should be below the last task's sort_order
    expect(newSortOrder < tasks[2].sort_order).toBe(true);
  });

  it("should generate sort order above top when moving last to first", () => {
    const tasks = buildSortedTasks(3);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move last to first
    fireDragEnd(tasks[2].id, tasks[0].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // Should be above the first task's sort_order
    expect(newSortOrder > tasks[0].sort_order).toBe(true);
  });

  it("should place task between correct neighbors when moving to middle from above", () => {
    const tasks = buildSortedTasks(4);
    // tasks[0] has the highest sort_order, tasks[3] has lowest
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move index 0 to index 2 (moving DOWN)
    fireDragEnd(tasks[0].id, tasks[2].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // When moving down: upperKey = tasks[newIndex].sort_order, lowerKey = lowerNeighbor
    // Result should be between tasks[2] and tasks[3]
    expect(newSortOrder < tasks[2].sort_order).toBe(true);
    expect(newSortOrder > tasks[3].sort_order).toBe(true);
  });

  it("should place task between correct neighbors when moving to middle from below", () => {
    const tasks = buildSortedTasks(4);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move index 3 to index 1 (moving UP)
    fireDragEnd(tasks[3].id, tasks[1].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // When moving up: upperKey = upperNeighbor, lowerKey = tasks[newIndex].sort_order
    // Result should be between tasks[0] and tasks[1]
    expect(newSortOrder < tasks[0].sort_order).toBe(true);
    expect(newSortOrder > tasks[1].sort_order).toBe(true);
  });

  it("should handle moving second task to last position with two tasks", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move index 0 (top) to index 1 (bottom) — moving DOWN
    fireDragEnd(tasks[0].id, tasks[1].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // Should be below tasks[1]
    expect(newSortOrder < tasks[1].sort_order).toBe(true);
  });

  it("should handle moving last task to first position with two tasks", () => {
    const tasks = buildSortedTasks(2);
    const onReorder = vi.fn();
    render(<TaskList {...buildTaskListProps({ tasks, onReorder })} />);

    // Move index 1 (bottom) to index 0 (top) — moving UP
    fireDragEnd(tasks[1].id, tasks[0].id);

    expect(onReorder).toHaveBeenCalledOnce();
    const newSortOrder = onReorder.mock.calls[0][1] as string;
    // Should be above tasks[0]
    expect(newSortOrder > tasks[0].sort_order).toBe(true);
  });
});
