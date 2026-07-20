/**
 * RED tests: SearchPage idea mutation paths (update, softDelete) must
 * schedule a push after mutating.
 * implements FR2 of fix-search-page-sync-push (task 2.2)
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockSchedulePush } from "@/app/providers/__mocks__/SyncProvider";
import { buildIdea } from "@/test/factories/ideaFactory";
import type { Idea } from "@/types/entities";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock(
  "@/app/providers/SyncProvider",
  async () => import("@/app/providers/__mocks__/SyncProvider"),
);

vi.mock("@/hooks/useGoals", () => ({
  useGoals: () => ({ goals: [], isLoading: false }),
}));
vi.mock("@/hooks/useContexts", () => ({
  useContexts: () => ({ contexts: [], isLoading: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ categories: [], isLoading: false }),
}));
vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: () => ({ isFocusMode: false, focusOpacity: 1 }),
}));

vi.mock("@/components/layout/SidebarShell", () => ({
  SidebarShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-shell">{children}</div>
  ),
}));

vi.mock("@/components/ideas/IdeaItem", () => ({
  IdeaItem: ({ idea }: { idea: Idea }) => (
    <span data-testid={`idea-item-${idea.id}`}>{idea.name}</span>
  ),
}));

vi.mock("@/components/ideas/IdeaDetailPanel", () => ({
  IdeaDetailPanel: ({
    idea,
    onUpdate,
    onDelete,
  }: {
    idea: Idea;
    onUpdate: (id: string, changes: Partial<Idea>) => void;
    onDelete: (id: string) => void;
  }) => (
    <div data-testid="idea-detail-panel">
      <button
        data-testid={`update-idea-${idea.id}`}
        onClick={() => onUpdate(idea.id, { name: "Updated idea name" })}
      />
      <button
        data-testid={`delete-idea-${idea.id}`}
        onClick={() => onDelete(idea.id)}
      />
    </div>
  ),
}));

const foundIdea = buildIdea({ name: "Search Result Idea" });

const mockIdeaUpdate = vi.fn().mockResolvedValue(undefined);
const mockIdeaSoftDelete = vi.fn().mockResolvedValue(undefined);
const mockIdeaSearchByName = vi.fn().mockResolvedValue([foundIdea]);

vi.mock("@/services/defaultServices", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/defaultServices")>();
  return {
    ...actual,
    defaultTaskService: {
      searchByName: vi.fn().mockResolvedValue([]),
    },
    defaultGoalService: {
      searchByName: vi.fn().mockResolvedValue([]),
    },
    defaultIdeaService: {
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
      softDelete: (...args: unknown[]) => mockIdeaSoftDelete(...args),
      searchByName: (...args: unknown[]) => mockIdeaSearchByName(...args),
    },
  };
});

import SearchPage from "./SearchPage";

function renderSearchPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  );
}

async function typeSearchQueryAndOpenIdeaPanel(query: string) {
  const searchInput = screen.getByTestId("search-input");
  fireEvent.change(searchInput, { target: { value: query } });
  const ideaItem = await screen.findByTestId(`idea-item-${foundIdea.id}`);
  await vi.waitFor(() => {
    expect(mockIdeaSearchByName).toHaveBeenCalledWith(query);
  });
  fireEvent.click(ideaItem.closest("button") as HTMLButtonElement);
  return {
    updateButton: await screen.findByTestId(`update-idea-${foundIdea.id}`),
    deleteButton: screen.getByTestId(`delete-idea-${foundIdea.id}`),
  };
}

describe("SearchPage > schedulePush on idea mutations", () => {
  beforeEach(() => {
    mockSchedulePush.mockClear();
    mockIdeaUpdate.mockClear();
    mockIdeaSoftDelete.mockClear();
  });

  it("should call schedulePush exactly once after updating an idea", async () => {
    renderSearchPage();

    const { updateButton } = await typeSearchQueryAndOpenIdeaPanel("Search");
    fireEvent.click(updateButton);

    await vi.waitFor(() => {
      expect(mockIdeaUpdate).toHaveBeenCalledWith(foundIdea.id, {
        name: "Updated idea name",
      });
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });

  it("should call schedulePush exactly once after soft-deleting an idea", async () => {
    renderSearchPage();

    const { deleteButton } = await typeSearchQueryAndOpenIdeaPanel("Search");
    fireEvent.click(deleteButton);

    await vi.waitFor(() => {
      expect(mockIdeaSoftDelete).toHaveBeenCalledWith(foundIdea.id);
    });
    expect(mockSchedulePush).toHaveBeenCalledOnce();
  });
});
