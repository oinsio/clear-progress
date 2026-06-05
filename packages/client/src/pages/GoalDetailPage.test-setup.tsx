import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useCoverPreview } from "@/hooks/useCoverPreview";
import { useCoverUrl } from "@/hooks/useCoverUrl";
import { useGoal } from "@/hooks/useGoal";
import { useGoals } from "@/hooks/useGoals";
import { useGoalTasks } from "@/hooks/useGoalTasks";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import {
  buildCategoriesHook,
  buildContextsHook,
  buildGoalHook,
  buildGoalsHook,
  buildGoalTasksHook,
} from "@/test/builders/hookBuilders";
import GoalDetailPage from "./GoalDetailPage";

export const mockUseGoal = vi.mocked(useGoal);
export const mockUseGoalTasks = vi.mocked(useGoalTasks);
export const mockUseGoals = vi.mocked(useGoals);
export const mockUseContexts = vi.mocked(useContexts);
export const mockUseCategories = vi.mocked(useCategories);
export const mockUsePanelSide = vi.mocked(usePanelSide);
export const mockUsePanelOpen = vi.mocked(usePanelOpen);
export const mockUseSidebarNavigation = vi.mocked(useSidebarNavigation);
export const mockUseIsDesktop = vi.mocked(useIsDesktop);
export const mockUsePanelSplit = vi.mocked(usePanelSplit);
export const mockUseCoverUrl = vi.mocked(useCoverUrl);
export const mockUseCoverPreview = vi.mocked(useCoverPreview);

export function setupDefaultMocks() {
  mockUseGoal.mockReturnValue(buildGoalHook());
  mockUseGoalTasks.mockReturnValue(buildGoalTasksHook());
  mockUseGoals.mockReturnValue(buildGoalsHook());
  mockUseContexts.mockReturnValue(buildContextsHook());
  mockUseCategories.mockReturnValue(buildCategoriesHook());
  mockUsePanelSide.mockReturnValue({
    panelSide: "right",
    setPanelSide: vi.fn(),
  });
  mockUsePanelOpen.mockReturnValue({
    isPanelOpen: false,
    togglePanelOpen: vi.fn(),
  });
  mockUseSidebarNavigation.mockReturnValue(vi.fn());
  mockUseIsDesktop.mockReturnValue(false);
  mockUsePanelSplit.mockReturnValue({
    ratio: 0.5,
    setRatio: vi.fn(),
    containerRef: { current: null },
    handleResizeMouseDown: vi.fn(),
  });
  mockUseCoverUrl.mockReturnValue({ url: null });
  mockUseCoverPreview.mockReturnValue(null);
}

export function renderPage() {
  render(
    <MemoryRouter initialEntries={["/goals/test-id"]}>
      <Routes>
        <Route path="/goals/:id" element={<GoalDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
