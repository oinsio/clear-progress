/**
 * Implements FR5, FR4, NFR-A1 of task-detail-page-ui-improvements
 * Tests compact tab rendering behavior in GoalCardEditMode.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mutable mock state ---
let mockAttachmentCount = 0;

// --- Stable function references (defined before vi.mock) ---
const stableOnNameChange = vi.fn();
const stableOnDescriptionChange = vi.fn();
const stableOnStatusChange = vi.fn();
const stableOnCoverSelect = vi.fn();
const stableOnCoverRemove = vi.fn();
const stableOnSave = vi.fn();
const stableOnCancel = vi.fn();
const stableOnDeleteRequest = vi.fn();
const stableOnDeleteConfirm = vi.fn();
const stableOnDeleteCancel = vi.fn();

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

vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: () => ({
    attachmentCount: mockAttachmentCount,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAutoResizeTextarea", () => ({
  useAutoResizeTextarea: () => ({ current: null }),
}));

vi.mock("@/components/goals/GoalAttachmentsTab", () => ({
  GoalAttachmentsTab: () => <div data-testid="goal-attachments-tab-content" />,
}));

vi.mock("@/components/goals/GoalEditDetailsTab", () => ({
  GoalEditDetailsTab: () => <div data-testid="goal-details-tab-content" />,
}));

vi.mock("@/components/goals/GoalCoverPicker", () => ({
  GoalCoverPicker: () => <div data-testid="goal-cover-picker" />,
}));

// Import AFTER mocks
const { GoalCardEditMode } = await import("./GoalCardEditMode");

const DEFAULT_PROPS = {
  goalId: "test-goal-id",
  coverPreviewSrc: null,
  editName: "Test Goal",
  editDescription: "",
  editStatus: "in_progress" as const,
  isSaving: false,
  saveError: null,
  canSave: true,
  isConfirmingDelete: false,
  onNameChange: stableOnNameChange,
  onDescriptionChange: stableOnDescriptionChange,
  onStatusChange: stableOnStatusChange,
  onCoverSelect: stableOnCoverSelect,
  onCoverRemove: stableOnCoverRemove,
  onSave: stableOnSave,
  onCancel: stableOnCancel,
  onDeleteRequest: stableOnDeleteRequest,
  onDeleteConfirm: stableOnDeleteConfirm,
  onDeleteCancel: stableOnDeleteCancel,
};

describe("GoalCardEditMode compact tabs", () => {
  beforeEach(() => {
    mockAttachmentCount = 0;
  });

  afterEach(() => {
    cleanup();
  });

  // FR5: Active details tab shows label text
  it("should show label text on the active details tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const detailsTab = screen.getByTestId("goal-tab-details");
    expect(detailsTab).toHaveTextContent("common.details");
  });

  // FR5: Inactive details tab hides label text
  it("should hide label text on inactive details tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("goal-tab-attachments"));
    const detailsTab = screen.getByTestId("goal-tab-details");
    expect(detailsTab).not.toHaveTextContent("common.details");
  });

  // FR5: Active attachments tab shows label text
  it("should show label text on active attachments tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("goal-tab-attachments"));
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab).toHaveTextContent("common.attachments");
  });

  // FR5: Inactive attachments tab hides label text
  it("should hide label text on inactive attachments tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab).not.toHaveTextContent("common.attachments");
  });

  // FR4: Attachments tab shows count badge when count > 0 (both active and inactive)
  it("should show count badge on inactive attachments tab when count > 0", () => {
    mockAttachmentCount = 3;
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab).toHaveTextContent("3");
  });

  // FR4: Attachments tab hides badge when count = 0
  it("should not show badge on inactive attachments tab when count is 0", () => {
    mockAttachmentCount = 0;
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab.textContent).toBe("");
  });

  // FR5: Active tab has flex-1 class
  it("should apply flex-1 to active tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const detailsTab = screen.getByTestId("goal-tab-details");
    expect(detailsTab.className).toContain("flex-1");
  });

  // FR5: Inactive tab has flex-shrink-0 and px-3
  it("should apply flex-shrink-0 and px-3 to inactive tab", () => {
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab.className).toContain("flex-shrink-0");
    expect(attachmentsTab.className).toContain("px-3");
  });

  // NFR-A1: Attachments badge has aria-label
  it("should have aria-label on inactive attachments badge", () => {
    mockAttachmentCount = 2;
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    const badge = attachmentsTab.querySelector("[aria-label]");
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("aria-label")).toBe(
      "taskEdit.attachmentsBadgeAriaLabel",
    );
  });

  // NFR-A1 of fix-file-mime-detection: Save error has role="alert"
  it("should render save error with role alert", () => {
    render(
      <GoalCardEditMode {...DEFAULT_PROPS} saveError="goal.cover.errorType" />,
    );
    const errorElement = screen.getByTestId("goal-save-error");
    expect(errorElement).toHaveAttribute("role", "alert");
  });

  // FR4: Active attachments tab shows both label and count badge
  it("should show label and count badge on active attachments tab", () => {
    mockAttachmentCount = 5;
    render(<GoalCardEditMode {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByTestId("goal-tab-attachments"));
    const attachmentsTab = screen.getByTestId("goal-tab-attachments");
    expect(attachmentsTab).toHaveTextContent("common.attachments");
    expect(attachmentsTab).toHaveTextContent("5");
    const badge = attachmentsTab.querySelector("[aria-label]");
    expect(badge).not.toBeNull();
  });
});
