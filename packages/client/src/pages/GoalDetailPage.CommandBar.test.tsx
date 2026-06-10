import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoalTasksHook } from "@/test/builders/hookBuilders";
import {
  mockUseGoalTasks,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

beforeEach(() => {
  setupDefaultMocks();
});

describe("GoalDetailPage — CommandBar integration", () => {
  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    renderPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has filter toggle (5-box filter)
  it("should render CommandBar filter toggle", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-filter-toggle")).toBeInTheDocument();
  });

  // FR-20: CommandBar has eye toggle
  it("should render CommandBar eye toggle", () => {
    renderPage();
    expect(screen.getByTestId("command-bar-eye-toggle")).toBeInTheDocument();
  });

  // FR-20: creates task via CommandBar with default box
  it("should call createTask with name and default box when Enter is pressed", async () => {
    const createTask = vi.fn().mockResolvedValue(undefined);
    mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ createTask }));
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "Новая задача" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith("Новая задача", "today", "");
    });
  });

  // FR-20: no longer renders the old FAB add-task button
  it("should not render old add-task FAB button", () => {
    renderPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });
});
