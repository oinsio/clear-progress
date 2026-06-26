import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FILTER_ITEMS } from "./Sidebar";

const { mockUseMenuOrder, mockUseConnectionStatus } = vi.hoisted(() => ({
  mockUseMenuOrder: vi.fn(),
  mockUseConnectionStatus: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ userPicture: null, signIn: vi.fn() }),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ syncStatus: "idle", pull: vi.fn() }),
}));

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: mockUseMenuOrder,
}));

vi.mock("./SidebarSyncBlock", () => ({
  SidebarSyncBlock: (props: Record<string, unknown>) => (
    <div
      data-testid="sidebar-sync-block"
      data-is-expanded={String(props.isExpanded)}
      data-side={String(props.side)}
    />
  ),
}));

vi.mock("./SidebarFilterNav", () => ({
  SidebarFilterNav: (props: Record<string, unknown>) => (
    <div
      data-testid="sidebar-filter-nav"
      data-is-expanded={String(props.isExpanded)}
      data-visible-items={JSON.stringify(
        (props.visibleFilterItems as Array<{ mode: string }>)?.map(
          (filterItem) => filterItem.mode,
        ),
      )}
    />
  ),
}));

import { Sidebar } from "./Sidebar";

function renderSidebar(overrides?: Partial<Parameters<typeof Sidebar>[0]>) {
  const props = {
    mode: null as Parameters<typeof Sidebar>[0]["mode"],
    effectiveState: "collapsed" as const,
    isDrawerOpen: false,
    onModeChange: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <Sidebar {...props} />
    </MemoryRouter>,
  );
}

// implements FR4 of improve-sidebar-ux
describe("Sidebar — conditional logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
    mockUseMenuOrder.mockReturnValue({ menuOrder: [] });
  });

  describe("effectiveState logic", () => {
    it("should render collapsed when effectiveState is collapsed", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.className).toContain("w-14");
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "false",
      );
    });

    it("should render expanded when effectiveState is expanded", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.className).toContain("w-52");
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should render collapsed when effectiveState is hover-ready", () => {
      renderSidebar({ effectiveState: "hover-ready" });
      expect(screen.queryByTestId("sidebar-collapsed")).not.toBeNull();
      expect(screen.queryByTestId("sidebar-expanded")).toBeNull();
    });

    it("should render expanded when isDrawerOpen is true regardless of effectiveState", () => {
      renderSidebar({ effectiveState: "collapsed", isDrawerOpen: true });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.className).toContain("w-52");
    });
  });

  describe("expanded panel attributes", () => {
    it("should NOT have role attribute on the expanded panel", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.getAttribute("role")).toBeNull();
    });

    it("should NOT have tabIndex on the expanded panel", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.getAttribute("tabindex")).toBeNull();
    });

    it("should NOT have aria-label on the expanded panel", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.getAttribute("aria-label")).toBeNull();
    });
  });

  describe("collapsed panel is not interactive", () => {
    it("should NOT have role attribute on the collapsed panel", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.getAttribute("role")).toBeNull();
    });

    it("should NOT have tabIndex on the collapsed panel", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.getAttribute("tabindex")).toBeNull();
    });

    it("should NOT have cursor-pointer on the collapsed panel", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.className).not.toContain("cursor-pointer");
    });

    it("should NOT have onClick on the collapsed panel", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.getAttribute("onclick")).toBeNull();
    });
  });

  describe("expanded panel non-interactive", () => {
    it("should not have onClick on the expanded container", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      expect(container.getAttribute("onclick")).toBeNull();
    });
  });

  describe("no backdrop in expanded mode", () => {
    it("should NOT render backdrop overlay", () => {
      renderSidebar({ effectiveState: "expanded" });
      expect(screen.queryByTestId("sidebar-backdrop")).toBeNull();
    });
  });

  describe("default side prop", () => {
    it("should render with border-l class when side prop is not provided (defaults to right)", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      expect(collapsed.className).toContain("border-l");
    });
  });

  describe("outer wrapper classes", () => {
    it("should have flex class on the expanded outer wrapper", () => {
      renderSidebar({ effectiveState: "expanded" });
      const container = screen.getByTestId("sidebar-expanded");
      const outerWrapper = container.parentElement;
      expect(outerWrapper?.className).toContain("flex");
      expect(outerWrapper?.className).toContain("flex-shrink-0");
    });

    it("should have flex class on the collapsed outer wrapper", () => {
      renderSidebar({ effectiveState: "collapsed" });
      const collapsed = screen.getByTestId("sidebar-collapsed");
      const outerWrapper = collapsed.parentElement;
      expect(outerWrapper?.className).toContain("flex");
      expect(outerWrapper?.className).toContain("flex-shrink-0");
    });
  });

  describe("isExpanded prop passing to children", () => {
    it("should pass isExpanded=true to SidebarSyncBlock when expanded", () => {
      renderSidebar({ effectiveState: "expanded" });
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should pass isExpanded=true to SidebarFilterNav when expanded", () => {
      renderSidebar({ effectiveState: "expanded" });
      expect(screen.getByTestId("sidebar-filter-nav").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should pass isExpanded=false to SidebarSyncBlock when collapsed", () => {
      renderSidebar({ effectiveState: "collapsed" });
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "false",
      );
    });

    it("should pass isExpanded=false to SidebarFilterNav when collapsed", () => {
      renderSidebar({ effectiveState: "collapsed" });
      expect(screen.getByTestId("sidebar-filter-nav").dataset.isExpanded).toBe(
        "false",
      );
    });
  });

  describe("menuOrder filtering for visibleFilterItems", () => {
    it("should pass only visible items to SidebarFilterNav", () => {
      mockUseMenuOrder.mockReturnValue({
        menuOrder: [
          { mode: "inbox", visible: true },
          { mode: "goals", visible: true },
          { mode: "deleted", visible: false },
        ],
      });
      renderSidebar({ effectiveState: "expanded" });
      const filterNav = screen.getByTestId("sidebar-filter-nav");
      const visibleItems = JSON.parse(
        filterNav.dataset.visibleItems ?? "[]",
      ) as string[];
      expect(visibleItems).toEqual(["inbox", "goals"]);
    });

    it("should pass empty array when all items are hidden", () => {
      mockUseMenuOrder.mockReturnValue({
        menuOrder: [
          { mode: "inbox", visible: false },
          { mode: "goals", visible: false },
        ],
      });
      renderSidebar({ effectiveState: "expanded" });
      const filterNav = screen.getByTestId("sidebar-filter-nav");
      const visibleItems = JSON.parse(
        filterNav.dataset.visibleItems ?? "[]",
      ) as string[];
      expect(visibleItems).toEqual([]);
    });

    it("should pass empty array when menuOrder is empty", () => {
      mockUseMenuOrder.mockReturnValue({ menuOrder: [] });
      renderSidebar({ effectiveState: "expanded" });
      const filterNav = screen.getByTestId("sidebar-filter-nav");
      const visibleItems = JSON.parse(
        filterNav.dataset.visibleItems ?? "[]",
      ) as string[];
      expect(visibleItems).toEqual([]);
    });
  });
});

// implements FR6 of add-sidebar-specs
describe("FILTER_ITEMS constant", () => {
  it.each(
    FILTER_ITEMS.map((item) => [item.mode, item.labelKey]),
  )("should have non-empty labelKey for mode %s", (_mode, labelKey) => {
    expect(labelKey).not.toBe("");
    expect(labelKey).toContain("filter.");
  });
});
