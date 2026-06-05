import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTasksHook,
  mockUseTasks,
  pageConfig,
  renderPage,
  resetDefaultMocks,
  selectBoxFilter,
} from "./activeTasksPage.testSetup";

describe("ActiveTasksPage — task creation", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // FR-20: creates task via CommandBar submit in all-box view using default box
  it("should create task via CommandBar in all-box view", async () => {
    const createTodayTask = vi.fn().mockResolvedValue(undefined);
    const createWeekTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks.mockImplementation((box) => {
      if (box === "today")
        return buildTasksHook({ createTask: createTodayTask });
      if (box === "week") return buildTasksHook({ createTask: createWeekTask });
      return buildTasksHook();
    });
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "All box task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createTodayTask).toHaveBeenCalledWith("All box task");
    });
    expect(createWeekTask).not.toHaveBeenCalled();
  });

  // FR-20: creates task in selected box via CommandBar
  it("should create task in week box when week filter is active", async () => {
    const createWeekTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks.mockImplementation((box) => {
      if (box === "week") return buildTasksHook({ createTask: createWeekTask });
      return buildTasksHook();
    });
    renderPage();
    selectBoxFilter("week");
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "Week task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createWeekTask).toHaveBeenCalledWith("Week task");
    });
  });

  // FR-20: creates task when defaultBox is "inbox" (regression: createFns had no inbox key)
  it("should create task in today box when defaultBox is inbox and filter is all", async () => {
    pageConfig.defaultBox = "inbox";
    const createTodayTask = vi.fn().mockResolvedValue(undefined);
    mockUseTasks.mockImplementation((box) => {
      if (box === "today")
        return buildTasksHook({ createTask: createTodayTask });
      return buildTasksHook();
    });
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "Inbox task" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createTodayTask).toHaveBeenCalledWith("Inbox task");
    });
  });

  // FR-20: placeholder shows "today" text when defaultBox is "inbox" (regression)
  it("should show today placeholder when defaultBox is inbox and filter is all", () => {
    pageConfig.defaultBox = "inbox";
    renderPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    expect(textarea).toHaveAttribute("placeholder", "На сегодня...");
  });
});
