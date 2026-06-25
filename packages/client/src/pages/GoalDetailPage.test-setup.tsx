import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

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

import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useFileUrl } from "@/hooks/useFileUrl";
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
export const mockUseFileUrl = vi.mocked(useFileUrl);
export const mockUseFilePreview = vi.mocked(useFilePreview);

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
    isTemporarilyOpen: false,
    effectiveIsOpen: false,
    togglePanelOpen: vi.fn(),
    openTemporarily: vi.fn(),
    closeTemporary: vi.fn(),
  });
  mockUseSidebarNavigation.mockReturnValue(vi.fn());
  mockUseIsDesktop.mockReturnValue(false);
  mockUsePanelSplit.mockReturnValue({
    ratio: 0.5,
    setRatio: vi.fn(),
    containerRef: { current: null },
    handleResizeMouseDown: vi.fn(),
  });
  mockUseFileUrl.mockReturnValue({ url: null });
  mockUseFilePreview.mockReturnValue(null);
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
