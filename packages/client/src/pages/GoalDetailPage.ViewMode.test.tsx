import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoalHook } from "@/test/builders/hookBuilders";
import { buildGoal } from "@/test/factories/goalFactory";

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));
vi.mock("@/hooks/useGoal");
vi.mock("@/hooks/useGoalTasks");
vi.mock("@/hooks/useGoals");
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/hooks/useSidebarNavigation");
vi.mock("@/hooks/useIsDesktop");
vi.mock("@/hooks/usePanelSplit");
vi.mock("@/hooks/useFileUrl");
vi.mock("@/hooks/useFilePreview");
vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({ attachments: [], isLoading: false }),
}));

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: () => ({
    showHidden: false,
    toggleShowHidden: vi.fn(),
  }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    defaultBox: "today",
    accentColor: "green",
    isLoading: false,
    setDefaultBox: vi.fn(),
    setAccentColor: vi.fn(),
  }),
  getCachedDayBoundary: () => "00:00",
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: vi.fn(),
  }),
}));

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
