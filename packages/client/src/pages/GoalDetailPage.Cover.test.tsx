import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("@/hooks/useCoverUrl");
vi.mock("@/hooks/useCoverPreview");

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
  mockUseCoverUrl,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

beforeEach(() => {
  setupDefaultMocks();
});

// FR1: cover circle clickability
describe("GoalDetailPage — Cover circle", () => {
  // FR1: cover circle clickability
  it("should render cover circle as clickable button when real cover exists", () => {
    mockUseCoverUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("BUTTON");
  });

  // FR1: cover circle clickability
  it("should render cover circle as non-interactive div when no cover", () => {
    mockUseCoverUrl.mockReturnValue({ url: null });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.tagName).toBe("DIV");
  });

  // FR1: cover circle clickability
  it("should open lightbox when clicking cover with real cover", () => {
    mockUseCoverUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    fireEvent.click(coverCircle);

    expect(screen.getByTestId("cover-lightbox")).toBeInTheDocument();
  });

  // FR1: cover circle clickability
  it("should show hover scale class when real cover exists", () => {
    mockUseCoverUrl.mockReturnValue({ url: "https://example.com/cover.jpg" });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.className).toContain("hover:scale-110");
  });

  // FR1: cover circle clickability
  it("should not show hover scale class when no cover", () => {
    mockUseCoverUrl.mockReturnValue({ url: null });

    renderPage();

    const coverCircle = screen.getByTestId("cover-circle");
    expect(coverCircle.className).not.toContain("hover:scale-110");
  });
});
