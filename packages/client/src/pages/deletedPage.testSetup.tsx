/**
 * Shared test setup for DeletedPage tests.
 * Implements FR18, FR21, UX1 of swipeable-item.
 */
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { DeletedEntities } from "@/hooks/useDeletedEntities";
import { useDeletedEntities } from "@/hooks/useDeletedEntities";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePurge } from "@/hooks/usePurge";
import { useRestoreEntity } from "@/hooks/useRestoreEntity";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import DeletedPage from "./DeletedPage";

export const mockUseDeletedEntities = vi.mocked(useDeletedEntities);
export const mockUseRestoreEntity = vi.mocked(useRestoreEntity);
export const mockUsePanelSide = vi.mocked(usePanelSide);
export const mockUsePanelOpen = vi.mocked(usePanelOpen);
export const mockUsePurge = vi.mocked(usePurge);
export const mockUseSidebarNavigation = vi.mocked(useSidebarNavigation);

export const EMPTY_DELETED_ENTITIES: DeletedEntities = {
  tasks: [],
  goals: [],
  ideas: [],
  contexts: [],
  categories: [],
  checklistItems: [],
  taskNameMap: new Map<string, string>(),
  isLoading: false,
  reload: vi.fn(),
};

export const MOCK_RESTORE_ENTITY = {
  restoreTask: vi.fn().mockResolvedValue(undefined),
  restoreGoal: vi.fn().mockResolvedValue(undefined),
  restoreIdea: vi.fn().mockResolvedValue(undefined),
  restoreContext: vi.fn().mockResolvedValue(undefined),
  restoreCategory: vi.fn().mockResolvedValue(undefined),
  restoreChecklistItem: vi.fn().mockResolvedValue(undefined),
};

interface PurgeOverrides {
  purge?: ReturnType<typeof vi.fn>;
  isPurging?: boolean;
}

export function renderDeletedPage(
  entityOverrides: Partial<DeletedEntities> = {},
  purgeOverrides: PurgeOverrides = {},
) {
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });
  mockUsePanelOpen.mockReturnValue({
    isPanelOpen: false,
    togglePanelOpen: vi.fn(),
  });
  mockUsePurge.mockReturnValue({
    purge: purgeOverrides.purge ?? vi.fn(),
    isPurging: purgeOverrides.isPurging ?? false,
  });
  mockUseSidebarNavigation.mockReturnValue(vi.fn());
  mockUseRestoreEntity.mockReturnValue(MOCK_RESTORE_ENTITY);
  mockUseDeletedEntities.mockReturnValue({
    ...EMPTY_DELETED_ENTITIES,
    ...entityOverrides,
  });

  return render(
    <MemoryRouter>
      <DeletedPage />
    </MemoryRouter>,
  );
}
