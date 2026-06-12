import { render } from "@testing-library/react";
import { useState } from "react";
import { vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { TaskItem } from "./TaskItem";

export function StatefulTaskItem(props: Record<string, unknown>) {
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

export function renderTaskItem(overrides: Record<string, unknown> = {}) {
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
