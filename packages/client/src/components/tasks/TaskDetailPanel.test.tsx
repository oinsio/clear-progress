/**
 * Implements FR1-FR4, NFR-A1 of task-detail-page-ui-improvements
 * Tests compact tab rendering behavior in TaskDetailPanel.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mutable mock state ---
let mockProgress = { completed: 0, total: 0 };
let mockAttachmentCount = 0;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return Object.entries(params).reduce<string>(
          (result, [paramKey, paramValue]) =>
            result.replace(`{{${paramKey}}}`, String(paramValue)),
          key,
        );
      }
      return key;
    },
  }),
}));

vi.mock("@/hooks/useChecklist", () => ({
  useChecklist: () => ({
    items: [],
    progress: mockProgress,
    createItem: vi.fn(),
    toggleItem: vi.fn(),
    deleteItem: vi.fn(),
    updateItem: vi.fn(),
    reorderItems: vi.fn(),
  }),
}));

vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: () => ({
    attachmentCount: mockAttachmentCount,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAutoResizeTextarea", () => ({
  useAutoResizeTextarea: () => ({ current: null }),
}));

vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({
    isDetailPanelPinned: false,
    setDetailPanelPinned: vi.fn(),
  }),
}));

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => false,
}));

const stableSetName = vi.fn();
const stableSetDescription = vi.fn();
const stableSetSelectedGoalId = vi.fn();
const stableSetSelectedContextId = vi.fn();
const stableSetSelectedCategoryId = vi.fn();
const stableSetSelectedBox = vi.fn();
const stableSetSelectedRepeatRule = vi.fn();

vi.mock("@/hooks/useTaskFormState", () => ({
  useTaskFormState: (task: { name: string; description: string }) => ({
    name: task.name,
    setName: stableSetName,
    description: task.description,
    setDescription: stableSetDescription,
    selectedGoalId: "",
    setSelectedGoalId: stableSetSelectedGoalId,
    selectedContextId: "",
    setSelectedContextId: stableSetSelectedContextId,
    selectedCategoryId: "",
    setSelectedCategoryId: stableSetSelectedCategoryId,
    selectedBox: "inbox",
    setSelectedBox: stableSetSelectedBox,
    selectedRepeatRule: null,
    setSelectedRepeatRule: stableSetSelectedRepeatRule,
  }),
}));

vi.mock("@/hooks/useTaskEditLabels", () => ({
  useTaskEditLabels: (
    _goalId: string,
    _contextId: string,
    _categoryId: string,
    _goals: unknown[],
    _contexts: unknown[],
    _categories: unknown[],
    progress: { completed: number; total: number },
  ) => ({
    selectedGoalName: "selector.noGoal",
    selectedContextName: "selector.noContext",
    selectedCategoryName: "selector.noCategory",
    checklistTabLabel:
      progress.total > 0
        ? `taskEdit.tabChecklistProgress (${progress.completed}/${progress.total})`
        : "taskEdit.tabChecklist",
  }),
}));

vi.mock("@/components/tasks/TaskDetailsTab", () => ({
  TaskDetailsTab: () => <div data-testid="task-details-tab-content" />,
}));

vi.mock("@/components/tasks/TaskChecklistTab", () => ({
  TaskChecklistTab: () => <div data-testid="task-checklist-tab-content" />,
}));

vi.mock("@/components/tasks/TaskAttachmentsTab", () => ({
  TaskAttachmentsTab: () => <div data-testid="task-attachments-tab-content" />,
}));

// Import AFTER mocks
const { TaskDetailPanel } = await import("./TaskDetailPanel");

const DEFAULT_TASK = {
  id: "test-task-id",
  name: "Test Task",
  description: "",
  box: "inbox" as const,
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
  needsSync: false,
};

const DEFAULT_PROPS = {
  task: DEFAULT_TASK,
  goals: [],
  contexts: [],
  categories: [],
  onUpdate: vi.fn().mockResolvedValue(undefined),
  onMove: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn(),
  onDuplicate: vi.fn().mockResolvedValue(undefined),
  onClose: vi.fn(),
};

describe("TaskDetailPanel compact tabs", () => {
  beforeEach(() => {
    mockProgress = { completed: 0, total: 0 };
    mockAttachmentCount = 0;
  });

  afterEach(() => {
    cleanup();
  });

  // FR1: Active tab renders icon + label
  it("should show label text on the active details tab", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const detailsTab = screen.getByTestId("tab-details");
    expect(detailsTab).toHaveTextContent("taskEdit.tabDetails");
  });

  // FR2: Inactive tabs show icon only (no label)
  it("should hide label text on inactive checklist tab", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const checklistTab = screen.getByTestId("tab-checklist");
    // When checklist is inactive (details is active), no label text
    expect(checklistTab).not.toHaveTextContent("taskEdit.tabChecklist");
  });

  it("should hide label text on inactive attachments tab", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("tab-attachments");
    expect(attachmentsTab).not.toHaveTextContent("task.tabs.attachments");
  });

  // FR1: When switching tabs, new active shows label
  it("should show label on checklist tab when it becomes active", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("tab-checklist"));
    const checklistTab = screen.getByTestId("tab-checklist");
    expect(checklistTab).toHaveTextContent("taskEdit.tabChecklist");
  });

  it("should hide details label when checklist tab is active", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("tab-checklist"));
    const detailsTab = screen.getByTestId("tab-details");
    expect(detailsTab).not.toHaveTextContent("taskEdit.tabDetails");
  });

  // FR1: Active tab has flex-1 class
  it("should apply flex-1 to active tab", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const detailsTab = screen.getByTestId("tab-details");
    expect(detailsTab.className).toContain("flex-1");
  });

  // FR2: Inactive tab has flex-shrink-0 px-3
  it("should apply flex-shrink-0 and px-3 to inactive tab", () => {
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const checklistTab = screen.getByTestId("tab-checklist");
    expect(checklistTab.className).toContain("flex-shrink-0");
    expect(checklistTab.className).toContain("px-3");
  });

  // FR3: Inactive checklist tab shows progress badge when total > 0
  it("should show progress badge on inactive checklist tab when total > 0", () => {
    mockProgress = { completed: 3, total: 9 };
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const checklistTab = screen.getByTestId("tab-checklist");
    expect(checklistTab).toHaveTextContent("3/9");
  });

  // FR3: Inactive checklist tab hides badge when total = 0
  it("should not show badge on inactive checklist tab when total is 0", () => {
    mockProgress = { completed: 0, total: 0 };
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const checklistTab = screen.getByTestId("tab-checklist");
    expect(checklistTab.textContent).toBe("");
  });

  // FR3: Active checklist tab shows full label, not badge
  it("should show full label instead of badge on active checklist tab", () => {
    mockProgress = { completed: 3, total: 9 };
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("tab-checklist"));
    const checklistTab = screen.getByTestId("tab-checklist");
    expect(checklistTab).toHaveTextContent("taskEdit.tabChecklistProgress");
    // Should NOT have a standalone badge element
    const badge = checklistTab.querySelector("[aria-label]");
    expect(badge).toBeNull();
  });

  // FR4: Inactive attachments tab shows count badge when count > 0
  it("should show count badge on inactive attachments tab when count > 0", () => {
    mockAttachmentCount = 2;
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("tab-attachments");
    expect(attachmentsTab).toHaveTextContent("2");
  });

  // FR4: Inactive attachments tab hides badge when count = 0
  it("should not show badge on inactive attachments tab when count is 0", () => {
    mockAttachmentCount = 0;
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("tab-attachments");
    expect(attachmentsTab.textContent).toBe("");
  });

  // FR4: Active attachments tab shows label, not badge
  it("should show label instead of badge on active attachments tab", () => {
    mockAttachmentCount = 5;
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("tab-attachments"));
    const attachmentsTab = screen.getByTestId("tab-attachments");
    expect(attachmentsTab).toHaveTextContent("task.tabs.attachments");
    const badge = attachmentsTab.querySelector("[aria-label]");
    expect(badge).toBeNull();
  });

  // NFR-A1: Checklist badge has aria-label
  it("should have aria-label on inactive checklist badge", () => {
    mockProgress = { completed: 3, total: 9 };
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const checklistTab = screen.getByTestId("tab-checklist");
    const badge = checklistTab.querySelector("[aria-label]");
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("aria-label")).toBe(
      "taskEdit.checklistBadgeAriaLabel",
    );
  });

  // NFR-A1: Attachments badge has aria-label
  it("should have aria-label on inactive attachments badge", () => {
    mockAttachmentCount = 2;
    render(<TaskDetailPanel {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("tab-attachments");
    const badge = attachmentsTab.querySelector("[aria-label]");
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("aria-label")).toBe(
      "taskEdit.attachmentsBadgeAriaLabel",
    );
  });
});
