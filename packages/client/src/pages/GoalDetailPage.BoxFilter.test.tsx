// Implements FR1 of fix-box-filter-and-move-sort
import { beforeEach, describe, it } from "vitest";
import { buildGoalTasksHook } from "@/test/builders/hookBuilders";
import {
  buildTasksInMultipleBoxes,
  expectAllBoxesWithSectionHeaders,
  expectOnlyFilteredBoxTasks,
} from "@/test/helpers/boxFilterTestHelpers";
import {
  mockUseGoalTasks,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

function setupTasksInMultipleBoxes_goal() {
  const tasks = buildTasksInMultipleBoxes();
  mockUseGoalTasks.mockReturnValue(buildGoalTasksHook({ tasks }));
}

beforeEach(() => {
  setupDefaultMocks();
});

describe("GoalDetailPage — box filtering", () => {
  // FR1: selecting a specific box shows only tasks from that box, no headers
  it("should show only today tasks without section headers when today filter is selected", () => {
    setupTasksInMultipleBoxes_goal();
    renderPage();

    expectOnlyFilteredBoxTasks();
  });

  // FR1: "All" filter shows all boxes grouped with section headers (regression)
  it("should show section headers and all tasks when all filter is active", () => {
    setupTasksInMultipleBoxes_goal();
    renderPage();
    expectAllBoxesWithSectionHeaders();
  });
});
