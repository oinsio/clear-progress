import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  mockUseGoal,
  renderPage,
  setupDefaultMocks,
} from "./GoalDetailPage.test-setup";

const originalScrollHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollHeight",
);
const originalClientHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight",
);

function simulateOverflow() {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    value: 100,
    configurable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    value: 40,
    configurable: true,
  });
}

beforeEach(() => {
  setupDefaultMocks();
  // Default: no overflow (scrollHeight <= clientHeight)
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    value: 20,
    configurable: true,
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    value: 40,
    configurable: true,
  });
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

afterEach(() => {
  if (originalScrollHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollHeight",
      originalScrollHeight,
    );
  }
  if (originalClientHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      "clientHeight",
      originalClientHeight,
    );
  }
});

function setupOverflowGoal(description: string) {
  simulateOverflow();
  mockUseGoal.mockReturnValue(
    buildGoalHook({
      goal: buildGoal({ name: "Моя цель", description }),
    }),
  );
}

// FR3, FR4: collapsible description
describe("GoalDetailPage — Collapsible description", () => {
  it("should not show toggle when description is short", () => {
    mockUseGoal.mockReturnValue(
      buildGoalHook({
        goal: buildGoal({
          name: "Моя цель",
          description: "Короткое описание",
        }),
      }),
    );

    renderPage();

    expect(screen.getByText("Короткое описание")).toBeInTheDocument();
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });

  it("should show toggle when description overflows", () => {
    setupOverflowGoal("Длинное описание, которое не помещается в две строки");

    renderPage();

    expect(screen.getByTestId("details-toggle")).toBeInTheDocument();
  });

  it("should expand and collapse description", () => {
    setupOverflowGoal("Длинное описание");

    renderPage();

    const toggleButton = screen.getByTestId("details-toggle");
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggleButton);

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("should not render description row when description is empty", () => {
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
    expect(screen.queryByTestId("details-toggle")).not.toBeInTheDocument();
  });
});
