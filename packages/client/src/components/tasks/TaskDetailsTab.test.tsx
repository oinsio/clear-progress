import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

// Implements FR3, FR4 of fix-box-filter-and-move-sort

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({ defaultBox: "today" }),
}));

vi.mock("@/hooks/useRepeatRuleChangeDialog", () => ({
  useRepeatRuleChangeDialog: () => ({
    pendingRuleChange: null,
    handleRepeatChange: vi.fn(),
    handleRuleChangeConfirm: vi.fn(),
    handleRuleChangeCancel: vi.fn(),
  }),
}));

vi.mock("@/components/ui/EditableDescription", () => ({
  EditableDescription: () => <textarea data-testid="mock-description" />,
}));

vi.mock("./TaskDetailSelector", () => ({
  TaskDetailSelector: () => <div data-testid="mock-selector" />,
}));

// Import after mocks
const { TaskDetailsTab } = await import("./TaskDetailsTab");

const TEST_TASK: Task = {
  id: "task-1",
  name: "Test Task",
  description: "",
  box: "today" as Box,
  goal_id: "",
  context_id: "",
  category_id: "",
  is_completed: false,
  completed_at: "",
  repeat_rule: "",
  is_hidden: false,
  next_date: "",
  appear_date: "",
  original_task_id: "",
  sort_order: "1000",
  is_deleted: false,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
  revision: 0,
  syncStatus: "synced" as const,
};

const createDefaultProps = () => ({
  task: TEST_TASK,
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onMove: vi.fn().mockResolvedValue(undefined),
  onDuplicate: vi.fn().mockResolvedValue(undefined),
  description: "",
  setDescription: vi.fn(),
  selectedBox: "today" as Box,
  setSelectedBox: vi.fn(),
  selectedGoalId: "",
  setSelectedGoalId: vi.fn(),
  selectedGoalName: "",
  selectedContextId: "",
  setSelectedContextId: vi.fn(),
  selectedContextName: "",
  selectedCategoryId: "",
  setSelectedCategoryId: vi.fn(),
  selectedCategoryName: "",
  selectedRepeatRule: null,
  setSelectedRepeatRule: vi.fn(),
  goals: [],
  contexts: [],
  categories: [],
  openSelector: null,
  onOpenSelector: vi.fn(),
  onCloseSelector: vi.fn(),
});

describe("TaskDetailsTab box change", () => {
  afterEach(() => {
    cleanup();
  });

  it("should call onMove instead of onUpdate when box is changed", () => {
    const props = createDefaultProps();
    render(<TaskDetailsTab {...props} />);

    // Click a different box button (week)
    const weekButton = screen.getByRole("button", { name: "box.week" });
    fireEvent.click(weekButton);

    expect(props.onMove).toHaveBeenCalledWith("task-1", "week");
    expect(props.onUpdate).not.toHaveBeenCalled();
  });

  it("should set optimistic box state when box is changed", () => {
    const props = createDefaultProps();
    render(<TaskDetailsTab {...props} />);

    const weekButton = screen.getByRole("button", { name: "box.week" });
    fireEvent.click(weekButton);

    expect(props.setSelectedBox).toHaveBeenCalledWith("week");
  });
});
