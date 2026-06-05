import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderPage, resetDefaultMocks } from "./activeTasksPage.testSetup";

describe("ActiveTasksPage — rendering", () => {
  beforeEach(() => {
    resetDefaultMocks();
  });

  // FR-2: renders root container with correct data-testid
  it("should render the page container", () => {
    renderPage();
    expect(screen.getByTestId("active-tasks-page")).toBeInTheDocument();
  });

  // FR-2: shows TaskPageLayout with sidebarMode="tasks"
  it("should render TaskPageLayout", () => {
    renderPage();
    expect(screen.getByTestId("task-page-layout")).toBeInTheDocument();
  });

  // FR-20: CommandBar renders with all expected elements
  it.each([
    { testId: "command-bar", label: "CommandBar" },
    { testId: "command-bar-filter-toggle", label: "filter toggle" },
    { testId: "command-bar-eye-toggle", label: "eye toggle" },
    { testId: "command-bar-create-button", label: "create button" },
    { testId: "command-bar-entity-icon", label: "entity icon" },
  ])("should render $label", ({ testId }) => {
    renderPage();
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
});
