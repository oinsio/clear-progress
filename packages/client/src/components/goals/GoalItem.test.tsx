import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/test/factories/goalFactory";

vi.mock("@/hooks/useIsUnsynced", () => ({
  useIsUnsynced: vi.fn().mockReturnValue(false),
}));
vi.mock("@/hooks/useAttachmentCount", () => ({
  useAttachmentCount: vi.fn().mockReturnValue({
    attachmentCount: 0,
    hasUnsyncedAttachments: false,
    isLoading: false,
  }),
}));
vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: vi
    .fn()
    .mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() }),
}));
vi.mock("@/hooks/useFileUrl", () => ({
  useFileUrl: vi.fn().mockReturnValue({ url: null }),
}));

import { useAttachmentCount } from "@/hooks/useAttachmentCount";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";
import { GoalItem } from "./GoalItem";

const mockUseIsUnsynced = vi.mocked(useIsUnsynced);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseAttachmentCount = vi.mocked(useAttachmentCount);

function renderGoalItem(overrides = {}) {
  const goal = buildGoal();
  const props = {
    goal,
    taskCount: 0,
    onNavigate: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <GoalItem {...props} />
    </MemoryRouter>,
  );
  return props;
}

describe("GoalItem", () => {
  beforeEach(() => {
    mockUseIsUnsynced.mockReturnValue(false);
    mockUsePanelSide.mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
    mockUseAttachmentCount.mockReturnValue({
      attachmentCount: 0,
      hasUnsyncedAttachments: false,
      isLoading: false,
    });
  });

  it("should render goal name", () => {
    const goal = buildGoal({ name: "Learn guitar" });
    renderGoalItem({ goal });
    expect(screen.getByText("Learn guitar")).toBeInTheDocument();
  });

  it("should have data-test-id='goal-item'", () => {
    renderGoalItem();
    expect(screen.getByTestId("goal-item")).toBeInTheDocument();
  });

  it("should show task count when greater than zero", () => {
    renderGoalItem({ taskCount: 5 });
    expect(screen.getByTestId("goal-task-count")).toBeInTheDocument();
    expect(screen.getByTestId("goal-task-count").textContent).toContain("5");
  });

  it("should hide task count when zero", () => {
    renderGoalItem({ taskCount: 0 });
    expect(screen.queryByTestId("goal-task-count")).not.toBeInTheDocument();
  });

  it("should show goal status badge", () => {
    const goal = buildGoal({ status: "paused" });
    renderGoalItem({ goal });
    expect(screen.getByTestId("goal-status-badge")).toBeInTheDocument();
  });

  it("should call onNavigate with goal id on click", async () => {
    const goal = buildGoal();
    const onNavigate = vi.fn();
    renderGoalItem({ goal, onNavigate });
    await userEvent.click(screen.getByTestId("goal-navigate-button"));
    expect(onNavigate).toHaveBeenCalledWith(goal.id);
  });

  it("should show placeholder icon when no cover_hash", () => {
    const goal = buildGoal({ cover_hash: "" });
    renderGoalItem({ goal });
    expect(screen.getByTestId("goal-cover-placeholder")).toBeInTheDocument();
  });

  it("should render elements in correct order: name → status → count", () => {
    const goal = buildGoal({ name: "Test Goal", status: "in_progress" });
    renderGoalItem({ goal, taskCount: 5 });

    const container = screen.getByTestId("goal-item");
    const name = screen.getByText("Test Goal");
    const status = screen.getByTestId("goal-status-badge");
    const count = screen.getByTestId("goal-task-count");

    expect(container).toContainElement(name);
    expect(container).toContainElement(status);
    expect(container).toContainElement(count);

    const allElements = Array.from(container.querySelectorAll("*"));
    const nameIndex = allElements.indexOf(name);
    const statusIndex = allElements.indexOf(status);
    const countIndex = allElements.indexOf(count);

    expect(statusIndex).toBeGreaterThan(nameIndex);
    expect(countIndex).toBeGreaterThan(statusIndex);
  });

  /** Implements FR4 of fix-nonsync-indication-for-attachments */
  it("should show amber stripe when hasUnsyncedAttachments is true", () => {
    mockUseAttachmentCount.mockReturnValue({
      attachmentCount: 1,
      hasUnsyncedAttachments: true,
      isLoading: false,
    });
    const goal = buildGoal();
    renderGoalItem({ goal });

    const goalItem = screen.getByTestId("goal-item");
    expect(goalItem).toHaveClass("border-l-amber-400");
  });
});
