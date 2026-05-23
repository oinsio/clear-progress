import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/test/factories/goalFactory";
import { GoalItem } from "./GoalItem";

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
});
