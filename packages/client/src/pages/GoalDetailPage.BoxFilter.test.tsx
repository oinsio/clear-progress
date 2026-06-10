// Implements FR1 of fix-box-filter-and-move-sort
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { buildGoalTasksHook } from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";
import {
  mockUseGoalTasks,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

const TODAY_TASK_NAME = "Buy groceries";
const WEEK_TASK_NAME = "Plan vacation";
const INBOX_TASK_NAME = "Random thought";

const SECTION_HEADER_INBOX = "Входящие (1)";
const SECTION_HEADER_TODAY = "Сегодня (1)";
const SECTION_HEADER_WEEK = "Неделя (1)";

function setupTasksInMultipleBoxes() {
  const todayTask = buildTask({ box: "today", name: TODAY_TASK_NAME });
  const weekTask = buildTask({ box: "week", name: WEEK_TASK_NAME });
  const inboxTask = buildTask({ box: "inbox", name: INBOX_TASK_NAME });
  mockUseGoalTasks.mockReturnValue(
    buildGoalTasksHook({ tasks: [todayTask, weekTask, inboxTask] }),
  );
}

function openFilterBarAndSelectBox(boxTestId: string) {
  const filterToggle = screen.getByTestId("command-bar-filter-toggle");
  fireEvent.click(filterToggle);
  const boxButton = screen.getByTestId(boxTestId);
  fireEvent.click(boxButton);
}

beforeEach(() => {
  setupDefaultMocks();
});

describe("GoalDetailPage — box filtering", () => {
  // FR1: selecting a specific box shows only tasks from that box, no headers
  it("should show only today tasks without section headers when today filter is selected", () => {
    setupTasksInMultipleBoxes();
    renderPage();

    openFilterBarAndSelectBox("box-filter-today");

    expect(screen.getByText(TODAY_TASK_NAME)).toBeInTheDocument();
    expect(screen.queryByText(WEEK_TASK_NAME)).not.toBeInTheDocument();
    expect(screen.queryByText(INBOX_TASK_NAME)).not.toBeInTheDocument();

    expect(screen.queryByText(SECTION_HEADER_INBOX)).not.toBeInTheDocument();
    expect(screen.queryByText(SECTION_HEADER_TODAY)).not.toBeInTheDocument();
    expect(screen.queryByText(SECTION_HEADER_WEEK)).not.toBeInTheDocument();
  });

  // FR1: "All" filter shows all boxes grouped with section headers (regression)
  it("should show section headers and all tasks when all filter is active", () => {
    setupTasksInMultipleBoxes();
    renderPage();

    expect(screen.getByText(SECTION_HEADER_INBOX)).toBeInTheDocument();
    expect(screen.getByText(SECTION_HEADER_TODAY)).toBeInTheDocument();
    expect(screen.getByText(SECTION_HEADER_WEEK)).toBeInTheDocument();

    expect(screen.getByText(TODAY_TASK_NAME)).toBeInTheDocument();
    expect(screen.getByText(WEEK_TASK_NAME)).toBeInTheDocument();
    expect(screen.getByText(INBOX_TASK_NAME)).toBeInTheDocument();
  });
});
