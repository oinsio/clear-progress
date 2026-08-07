import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

// Implements FR3, FR4 of fix-box-filter-and-move-sort
// Implements FR3, UX1 of detect-invalid-repeat-rule

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/hooks/useSettings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useSettings")>()),
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

// Implements FR3, UX1 of detect-invalid-repeat-rule
describe("TaskDetailsTab repeat rule display", () => {
  afterEach(() => {
    cleanup();
  });

  it("should show ruleNotRecognized text when repeat_rule is invalid", () => {
    const props = createDefaultProps();
    const invalidTask = { ...TEST_TASK, repeat_rule: "INVALID_RULE" };
    render(<TaskDetailsTab {...props} task={invalidTask} />);

    const repeatRow = screen.getByTestId("repeat-rule-row");
    expect(repeatRow).toHaveTextContent("repeat.ruleNotRecognized");
  });

  it("should apply amber styling when repeat_rule is invalid", () => {
    const props = createDefaultProps();
    const invalidTask = { ...TEST_TASK, repeat_rule: "INVALID_RULE" };
    render(<TaskDetailsTab {...props} task={invalidTask} />);

    const repeatRow = screen.getByTestId("repeat-rule-row");
    const valueSpan = repeatRow.querySelector("[class*='text-amber-600']");
    expect(valueSpan).not.toBeNull();
  });

  it("should show formatted rule label when repeat_rule is valid", () => {
    const props = createDefaultProps();
    const validRule = {
      type: "fixed" as const,
      frequency: "daily" as const,
      interval: 1,
      target_box: "today" as Box,
      advance_days: 0,
    };
    render(
      <TaskDetailsTab
        {...props}
        task={{ ...TEST_TASK, repeat_rule: JSON.stringify(validRule) }}
        selectedRepeatRule={validRule}
      />,
    );

    const repeatRow = screen.getByTestId("repeat-rule-row");
    // formatRepeatRuleLabel returns the formatted string via the t mock
    expect(repeatRow).not.toHaveTextContent("repeat.none");
    expect(repeatRow).not.toHaveTextContent("repeat.ruleNotRecognized");
  });

  it("should show repeat.none when repeat_rule is empty", () => {
    const props = createDefaultProps();
    render(<TaskDetailsTab {...props} />);

    const repeatRow = screen.getByTestId("repeat-rule-row");
    expect(repeatRow).toHaveTextContent("repeat.none");
  });
});
