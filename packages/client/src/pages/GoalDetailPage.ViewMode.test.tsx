import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { buildGoalHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";
import {
  mockUseFileUrl,
  mockUseGoal,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

beforeEach(() => {
  setupDefaultMocks();
});

// FR5: view mode three-row layout
describe("GoalDetailPage — View mode layout", () => {
  it("should render three-row layout with cover, status badge, actions, name, and description", () => {
    mockUseGoal.mockReturnValue(
      buildGoalHook({
        goal: buildGoal({
          name: "Моя цель",
          description: "Описание цели",
          status: "in_progress",
        }),
      }),
    );
    mockUseFileUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("https://example.com/cover.jpg"),
    );
    expect(screen.getByText("Моя цель")).toBeInTheDocument();
    expect(screen.getByText("Описание цели")).toBeInTheDocument();
    expect(screen.getByTestId("focus-icon")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-completed-button")).toBeInTheDocument();
    expect(screen.getByTestId("edit-goal-button")).toBeInTheDocument();
  });

  it("should render two-row layout when description is empty", () => {
    mockUseGoal.mockReturnValue(
      buildGoalHook({
        goal: buildGoal({
          name: "Моя цель",
          description: "",
        }),
      }),
    );

    renderPage();

    expect(screen.getByText("Моя цель")).toBeInTheDocument();
    expect(screen.queryByText("Описание")).toBeNull();
  });

  it("should render edit form when editing", async () => {
    renderPage();

    fireEvent.click(screen.getByTestId("edit-goal-button"));

    await waitFor(() => {
      expect(screen.getByTestId("goal-name-input")).toBeInTheDocument();
    });
  });
});
