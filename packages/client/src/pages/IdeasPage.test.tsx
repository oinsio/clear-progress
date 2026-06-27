/**
 * Tests for IdeasPage.
 * Implements FR20 of command-bar.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildIdeasHook } from "@/test/builders/hookBuilders";
import { buildIdea } from "@/test/factories/ideaFactory";
import IdeasPage from "./IdeasPage";

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
vi.mock("@/hooks/useIdeas");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    effectiveState: "collapsed",
    sidebarMode: "expanded",
    setSidebarMode: vi.fn(),
    isNarrow: true,
    hasHover: false,
  }),
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

vi.mock("@/hooks/useIsDesktop", () => ({
  useIsDesktop: () => false,
}));

import { useIdeas } from "@/hooks/useIdeas";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseIdeas = vi.mocked(useIdeas);
const mockUsePanelSide = vi.mocked(usePanelSide);

function renderIdeasPage() {
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });

  render(
    <MemoryRouter>
      <IdeasPage />
    </MemoryRouter>,
  );
}

describe("IdeasPage", () => {
  it("should render page with test-id 'ideas-page'", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.getByTestId("ideas-page")).toBeInTheDocument();
  });

  it("should render idea items for each active idea", () => {
    const ideas = [
      buildIdea({ name: "Idea A" }),
      buildIdea({ name: "Idea B" }),
    ];
    mockUseIdeas.mockReturnValue(buildIdeasHook({ ideas }));
    renderIdeasPage();
    expect(screen.getByText("Idea A")).toBeInTheDocument();
    expect(screen.getByText("Idea B")).toBeInTheDocument();
  });

  it("should not render deleted ideas", () => {
    const ideas = [
      buildIdea({ name: "Active Idea" }),
      buildIdea({ name: "Deleted Idea", is_deleted: true }),
    ];
    mockUseIdeas.mockReturnValue(buildIdeasHook({ ideas }));
    renderIdeasPage();
    expect(screen.getByText("Active Idea")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Idea")).not.toBeInTheDocument();
  });

  it("should show empty state when no ideas exist", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook({ ideas: [] }));
    renderIdeasPage();
    expect(screen.getByTestId("empty-ideas-message")).toBeInTheDocument();
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has no filter
  it("should not render CommandBar filter toggle", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(
      screen.queryByTestId("command-bar-filter-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has no eye toggle
  it("should not render CommandBar eye toggle", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(
      screen.queryByTestId("command-bar-eye-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has entity icon
  it("should render CommandBar entity icon", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.getByTestId("command-bar-entity-icon")).toBeInTheDocument();
  });

  // FR-20: CommandBar has to create button
  it("should render CommandBar create button", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.getByTestId("command-bar-create-button")).toBeInTheDocument();
  });

  // FR-20: creates idea via CommandBar submit
  it("should call createIdea when submitting via CommandBar", async () => {
    const createIdea = vi.fn().mockResolvedValue(undefined);
    mockUseIdeas.mockReturnValue(buildIdeasHook({ createIdea }));
    renderIdeasPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "New Idea" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createIdea).toHaveBeenCalledWith({ name: "New Idea" });
    });
  });

  // FR-20: no old inline add buttons
  it("should not render old add-idea-button", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.queryByTestId("add-idea-button")).not.toBeInTheDocument();
  });

  it("should not render old add-task-button", () => {
    mockUseIdeas.mockReturnValue(buildIdeasHook());
    renderIdeasPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });
});
