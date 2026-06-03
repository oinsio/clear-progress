/**
 * Tests for CategoriesPage.
 * Implements FR20 of command-bar.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { buildCategoriesHook } from "@/test/builders/hookBuilders";
import { buildCategory } from "@/test/factories/categoryFactory";
import CategoriesPage from "./CategoriesPage";

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
vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/services/TaskService", () => ({
  TaskService: vi.fn().mockImplementation(() => ({
    getCategoryTaskCounts: vi.fn().mockResolvedValue({}),
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

import { useCategories } from "@/hooks/useCategories";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUseCategories = vi.mocked(useCategories);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUsePanelOpen = vi.mocked(usePanelOpen);

function renderCategoriesPage() {
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
      <CategoriesPage />
    </MemoryRouter>,
  );
}

describe("CategoriesPage", () => {
  it("should render page with test-id 'categories-page'", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.getByTestId("categories-page")).toBeInTheDocument();
  });

  it("should render category items for each active category", () => {
    const categories = [
      buildCategory({ name: "Cat A" }),
      buildCategory({ name: "Cat B" }),
    ];
    mockUseCategories.mockReturnValue(buildCategoriesHook({ categories }));
    renderCategoriesPage();
    expect(screen.getByText("Cat A")).toBeInTheDocument();
    expect(screen.getByText("Cat B")).toBeInTheDocument();
  });

  it("should not render deleted categories", () => {
    const categories = [
      buildCategory({ name: "Active Cat" }),
      buildCategory({ name: "Deleted Cat", is_deleted: true }),
    ];
    mockUseCategories.mockReturnValue(buildCategoriesHook({ categories }));
    renderCategoriesPage();
    expect(screen.getByText("Active Cat")).toBeInTheDocument();
    expect(screen.queryByText("Deleted Cat")).not.toBeInTheDocument();
  });

  it("should show empty state when no categories exist", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook({ categories: [] }));
    renderCategoriesPage();
    expect(screen.getByTestId("empty-categories-message")).toBeInTheDocument();
  });

  // FR-20: renders CommandBar
  it("should render CommandBar", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.getByTestId("command-bar")).toBeInTheDocument();
  });

  // FR-20: CommandBar has no filter
  it("should not render CommandBar filter toggle", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(
      screen.queryByTestId("command-bar-filter-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has no eye toggle
  it("should not render CommandBar eye toggle", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(
      screen.queryByTestId("command-bar-eye-toggle"),
    ).not.toBeInTheDocument();
  });

  // FR-20: CommandBar has entity icon
  it("should render CommandBar entity icon", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.getByTestId("command-bar-entity-icon")).toBeInTheDocument();
  });

  // FR-20: CommandBar has create button
  it("should render CommandBar create button", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.getByTestId("command-bar-create-button")).toBeInTheDocument();
  });

  // FR-20: creates category via CommandBar submit
  it("should call createCategory when submitting via CommandBar", async () => {
    const createCategory = vi.fn().mockResolvedValue(undefined);
    mockUseCategories.mockReturnValue(buildCategoriesHook({ createCategory }));
    renderCategoriesPage();
    const textarea = screen.getByTestId("command-bar-textarea");
    fireEvent.input(textarea, { target: { value: "New Category" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith("New Category");
    });
  });

  // FR-20: no old inline add buttons
  it("should not render old add-category-button", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.queryByTestId("add-category-button")).not.toBeInTheDocument();
  });

  it("should not render old add-task-button", () => {
    mockUseCategories.mockReturnValue(buildCategoriesHook());
    renderCategoriesPage();
    expect(screen.queryByTestId("add-task-button")).not.toBeInTheDocument();
  });
});
