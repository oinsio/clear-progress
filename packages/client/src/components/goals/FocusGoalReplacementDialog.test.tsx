import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal } from "@/types/entities";
import { FocusGoalReplacementDialog } from "./FocusGoalReplacementDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (
        key === "focusGoalReplacementDialog.replaceGoal" &&
        params?.goalName
      ) {
        return `Replace ${params.goalName}`;
      }
      return key;
    },
  }),
}));

const createMockGoal = (id: string, name: string): Goal => ({
  id,
  name,
  description: "",
  status: "in_progress",
  cover_hash: "",
  sort_order: 0,
  is_deleted: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  revision: 1,
  needsSync: false,
});

function renderDialog(
  props: Partial<{
    isOpen: boolean;
    goalToAdd: Goal;
    focusedGoals: Goal[];
    onReplace: (oldGoalId: string) => Promise<void>;
    onClose: () => void;
  }> = {},
) {
  const defaultGoalToAdd = createMockGoal("goal-3", "New Goal");
  const defaultFocusedGoals = [
    createMockGoal("goal-1", "Focused Goal 1"),
    createMockGoal("goal-2", "Focused Goal 2"),
  ];

  return render(
    <FocusGoalReplacementDialog
      isOpen={props.isOpen ?? true}
      goalToAdd={props.goalToAdd ?? defaultGoalToAdd}
      focusedGoals={props.focusedGoals ?? defaultFocusedGoals}
      onReplace={props.onReplace ?? vi.fn().mockResolvedValue(undefined)}
      onClose={props.onClose ?? vi.fn()}
    />,
  );
}

describe("FocusGoalReplacementDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    renderDialog({ isOpen: false });
    expect(
      screen.queryByTestId("focus-goal-replacement-dialog"),
    ).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    renderDialog({ isOpen: true });
    expect(
      screen.getByTestId("focus-goal-replacement-dialog"),
    ).toBeInTheDocument();
  });

  it("should show title", () => {
    renderDialog();
    expect(
      screen.getByTestId("focus-goal-replacement-dialog-title"),
    ).toHaveTextContent("focusGoalReplacementDialog.title");
  });

  it("should show message", () => {
    renderDialog();
    expect(
      screen.getByTestId("focus-goal-replacement-dialog-message"),
    ).toHaveTextContent("focusGoalReplacementDialog.message");
  });

  it("should show replace button for first focused goal", () => {
    renderDialog();
    expect(
      screen.getByTestId("replace-goal-button-goal-1"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("replace-goal-button-goal-1")).toHaveTextContent(
      "Replace Focused Goal 1",
    );
  });

  it("should show replace button for second focused goal", () => {
    renderDialog();
    expect(
      screen.getByTestId("replace-goal-button-goal-2"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("replace-goal-button-goal-2")).toHaveTextContent(
      "Replace Focused Goal 2",
    );
  });

  it("should show cancel button", () => {
    renderDialog();
    expect(
      screen.getByTestId("focus-goal-replacement-cancel-btn"),
    ).toBeInTheDocument();
  });

  it("should call onReplace with first goal id when first replace button is clicked", async () => {
    const onReplace = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onReplace });

    fireEvent.click(screen.getByTestId("replace-goal-button-goal-1"));

    expect(onReplace).toHaveBeenCalledTimes(1);
    expect(onReplace).toHaveBeenCalledWith("goal-1");
  });

  it("should call onReplace with second goal id when second replace button is clicked", async () => {
    const onReplace = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onReplace });

    fireEvent.click(screen.getByTestId("replace-goal-button-goal-2"));

    expect(onReplace).toHaveBeenCalledTimes(1);
    expect(onReplace).toHaveBeenCalledWith("goal-2");
  });

  it("should call onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByTestId("focus-goal-replacement-cancel-btn"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByTestId("focus-goal-replacement-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.keyDown(screen.getByTestId("focus-goal-replacement-dialog"), {
      key: "Escape",
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
