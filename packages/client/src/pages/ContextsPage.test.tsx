/**
 * Tests for ContextsPage.
 * Implements FR20 of command-bar.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildContextsHook } from "@/test/builders/hookBuilders";
import { buildContext } from "@/test/factories/contextFactory";
import ContextsPage from "./ContextsPage";

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
vi.mock("@/hooks/useContexts");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getContextTaskCounts: vi.fn().mockResolvedValue({}),
  })),
}));
vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn().mockImplementation(() => ({})),
}));
vi.mock("@/db/repositories/ChecklistRepository", () => ({
  ChecklistRepository: vi.fn().mockImplementation(() => ({})),
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

import { useContexts } from "@/hooks/useContexts";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseContexts = vi.mocked(useContexts);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);

function renderContextsPage() {
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });
  mockUsePanelOpen.mockReturnValue({
    isPanelOpen: false,
    togglePanelOpen: vi.fn(),
  });

  render(
    <MemoryRouter>
      <ContextsPage />
    </MemoryRouter>,
  );
}

describe("ContextsPage", () => {
  it("should render page with test-id 'contexts-page'", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.getByTestId("contexts-page")).toBeInTheDocument();
  });

  it("should render context items for each active context", () => {
    const contexts = [
      buildContext({ name: "@Home" }),
      buildContext({ name: "@Office" }),
    ];
    mockUseContexts.mockReturnValue(buildContextsHook({ contexts }));
    renderContextsPage();
    expect(screen.getByText("@Home")).toBeInTheDocument();
    expect(screen.getByText("@Office")).toBeInTheDocument();
  });

  it("should not render deleted contexts", () => {
    const contexts = [
      buildContext({ name: "@Active" }),
      buildContext({ name: "@Deleted", is_deleted: true }),
    ];
    mockUseContexts.mockReturnValue(buildContextsHook({ contexts }));
    renderContextsPage();
    expect(screen.getByText("@Active")).toBeInTheDocument();
    expect(screen.queryByText("@Deleted")).not.toBeInTheDocument();
  });

  it("should show empty state when no contexts exist", () => {
    mockUseContexts.mockReturnValue(buildContextsHook({ contexts: [] }));
    renderContextsPage();
    expect(screen.getByTestId("empty-contexts-message")).toBeInTheDocument();
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has no filter
  it("should not render CommandBar filter toggle", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(
      screen.queryByTestId("command-bar-filter-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has no eye toggle
  it("should not render CommandBar eye toggle", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(
      screen.queryByTestId("command-bar-eye-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has entity icon
  it("should render CommandBar entity icon", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.getByTestId("command-bar-entity-icon")).toBeInTheDocument();
  });

  // FR-20: CommandBar has create button
  it("should render CommandBar create button", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.getByTestId("command-bar-create-button")).toBeInTheDocument();
  });

  // FR-20: creates context via CommandBar submit
  it("should call createContext when submitting via CommandBar", async () => {
    const createContext = vi.fn().mockResolvedValue(undefined);
    mockUseContexts.mockReturnValue(buildContextsHook({ createContext }));
    renderContextsPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "New Context" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createContext).toHaveBeenCalledWith("New Context");
    });
  });

  // FR-20: no old inline add buttons
  it("should not render old add-context-button", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.queryByTestId("add-context-button")).not.toBeInTheDocument();
  });

  it("should not render old add-task-button", () => {
    mockUseContexts.mockReturnValue(buildContextsHook());
    renderContextsPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });
});
