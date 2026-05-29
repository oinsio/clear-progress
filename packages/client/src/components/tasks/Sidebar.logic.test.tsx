import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FILTER_ITEMS } from "./Sidebar";

const { mockUsePanelAlwaysOpen, mockUseMenuOrder, mockUseConnectionStatus } =
  vi.hoisted(() => ({
    mockUsePanelAlwaysOpen: vi.fn(),
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

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: mockUsePanelAlwaysOpen,
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
  const defaultOnToggle = vi.fn();
  const props = {
    mode: null as Parameters<typeof Sidebar>[0]["mode"],
    isOpen: false,
    onToggle: defaultOnToggle,
    onModeChange: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <Sidebar {...props} />
    </MemoryRouter>,
  );
  return { onToggle: props.onToggle };
}

// implements FR6 of add-sidebar-specs
describe("Sidebar — conditional logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
    mockUseMenuOrder.mockReturnValue({ menuOrder: [] });
    mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
  });

  describe("effectiveIsOpen logic", () => {
    it("should render expanded when isPanelAlwaysOpen is true even if isOpen is false", () => {
      mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: true });
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle.className).toContain("w-52");
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should render collapsed when isPanelAlwaysOpen is false and isOpen is false", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle.className).toContain("w-14");
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "false",
      );
    });

    it("should render expanded when isPanelAlwaysOpen is false and isOpen is true", () => {
      renderSidebar({ isOpen: true });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle.className).toContain("w-52");
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "true",
      );
    });
  });

  describe("isPanelAlwaysOpen=true — expanded panel attributes", () => {
    beforeEach(() => {
      mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: true });
    });

    it("should not call onToggle when clicking the panel", () => {
      const { onToggle } = renderSidebar({ isOpen: false });
      fireEvent.click(screen.getByTestId("sidebar-toggle"));
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("should not have aria-label attribute on the panel", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).not.toHaveAttribute("aria-label");
    });

    it("should not have role attribute on the panel", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).not.toHaveAttribute("role");
    });

    it("should not have tabIndex attribute on the panel", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).not.toHaveAttribute("tabindex");
    });

    it("should not call onToggle when pressing Enter on the panel", () => {
      const { onToggle } = renderSidebar({ isOpen: false });
      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), {
        key: "Enter",
      });
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("isPanelAlwaysOpen=false — expanded panel attributes", () => {
    it("should have role button on the expanded panel", () => {
      renderSidebar({ isOpen: true });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).toHaveAttribute("role", "button");
    });

    it("should have tabIndex 0 on the expanded panel", () => {
      renderSidebar({ isOpen: true });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).toHaveAttribute("tabindex", "0");
    });

    it("should have aria-label with filter.close on the expanded panel", () => {
      renderSidebar({ isOpen: true });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle).toHaveAttribute("aria-label", "filter.close");
    });

    it("should call onToggle when clicking the expanded panel", () => {
      const { onToggle } = renderSidebar({ isOpen: true });
      fireEvent.click(screen.getByTestId("sidebar-toggle"));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should call onToggle when pressing Enter on the expanded panel", () => {
      const { onToggle } = renderSidebar({ isOpen: true });
      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), {
        key: "Enter",
      });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("isPanelAlwaysOpen=false — collapsed panel keyboard", () => {
    it("should call onToggle when pressing Enter on the collapsed panel", () => {
      const { onToggle } = renderSidebar({ isOpen: false });
      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), {
        key: "Enter",
      });
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("should not call onToggle when pressing a non-Enter key on the collapsed panel", () => {
      const { onToggle } = renderSidebar({ isOpen: false });
      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), {
        key: "a",
      });
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("isPanelAlwaysOpen=false — expanded panel non-Enter key", () => {
    it("should not call onToggle when pressing a non-Enter key on the expanded panel", () => {
      const { onToggle } = renderSidebar({ isOpen: true });
      fireEvent.keyDown(screen.getByTestId("sidebar-toggle"), {
        key: "Space",
      });
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("default side prop", () => {
    it("should render with border-l class when side prop is not provided (defaults to right)", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle.className).toContain("border-l");
    });
  });

  describe("collapsed panel aria-label", () => {
    it("should have non-empty aria-label on the collapsed panel", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      expect(toggle.getAttribute("aria-label")).toBe("filter.open");
    });
  });

  describe("outer wrapper classes", () => {
    it("should have flex class on the expanded outer wrapper", () => {
      renderSidebar({ isOpen: true });
      const toggle = screen.getByTestId("sidebar-toggle");
      const outerWrapper = toggle.parentElement;
      expect(outerWrapper?.className).toContain("flex");
      expect(outerWrapper?.className).toContain("flex-shrink-0");
    });

    it("should have flex class on the collapsed outer wrapper", () => {
      renderSidebar({ isOpen: false });
      const toggle = screen.getByTestId("sidebar-toggle");
      const outerWrapper = toggle.parentElement;
      expect(outerWrapper?.className).toContain("flex");
      expect(outerWrapper?.className).toContain("flex-shrink-0");
    });
  });

  describe("isExpanded prop passing to children", () => {
    it("should pass isExpanded=true to SidebarSyncBlock when expanded", () => {
      renderSidebar({ isOpen: true });
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should pass isExpanded=true to SidebarFilterNav when expanded", () => {
      renderSidebar({ isOpen: true });
      expect(screen.getByTestId("sidebar-filter-nav").dataset.isExpanded).toBe(
        "true",
      );
    });

    it("should pass isExpanded=false to SidebarSyncBlock when collapsed", () => {
      renderSidebar({ isOpen: false });
      expect(screen.getByTestId("sidebar-sync-block").dataset.isExpanded).toBe(
        "false",
      );
    });

    it("should pass isExpanded=false to SidebarFilterNav when collapsed", () => {
      renderSidebar({ isOpen: false });
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
      renderSidebar({ isOpen: true });
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
      renderSidebar({ isOpen: true });
      const filterNav = screen.getByTestId("sidebar-filter-nav");
      const visibleItems = JSON.parse(
        filterNav.dataset.visibleItems ?? "[]",
      ) as string[];
      expect(visibleItems).toEqual([]);
    });

    it("should pass empty array when menuOrder is empty", () => {
      mockUseMenuOrder.mockReturnValue({ menuOrder: [] });
      renderSidebar({ isOpen: true });
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
