// implements FR6 of add-sidebar-specs
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/constants";
import type { FilterItem } from "./Sidebar";
import { SidebarFilterNav } from "./SidebarFilterNav";

vi.mock("./FocusedGoalsBlock", () => ({
  FocusedGoalsBlock: (props: Record<string, unknown>) => (
    <div
      data-testid="focused-goals-block"
      data-is-expanded={String(props.isExpanded)}
      data-active-goal-id={String(props.activeGoalId)}
    />
  ),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const MockIcon = (props: Record<string, unknown>) => (
  <span data-testid="mock-icon" {...props} />
);

const itemWithRoute: FilterItem = {
  mode: "contexts",
  labelKey: "filter.contexts",
  Icon: MockIcon,
  route: "/contexts",
};
const itemWithoutRoute: FilterItem = {
  mode: "inbox",
  labelKey: "filter.inbox",
  Icon: MockIcon,
};
const focusedGoalsItem: FilterItem = {
  mode: "focused_goals",
  labelKey: "filter.focused_goals",
  Icon: MockIcon,
};

function renderComponent(
  props: Partial<React.ComponentProps<typeof SidebarFilterNav>> = {},
) {
  const defaultProps: React.ComponentProps<typeof SidebarFilterNav> = {
    isExpanded: true,
    mode: null,
    visibleFilterItems: [itemWithoutRoute, itemWithRoute],
    onModeChange: vi.fn(),
    ...props,
  };
  return render(
    <MemoryRouter>
      <SidebarFilterNav {...defaultProps} />
    </MemoryRouter>,
  );
}

describe("SidebarFilterNav", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe("expanded rendering", () => {
    it("nav has non-empty aria-label attribute", () => {
      renderComponent({ isExpanded: true });
      const nav = screen.getByRole("navigation");
      const ariaLabel = nav.getAttribute("aria-label");
      expect(ariaLabel).not.toBe("");
      expect(ariaLabel).not.toBeNull();
    });

    it("search button has non-empty aria-label attribute", () => {
      renderComponent({ isExpanded: true });
      const searchButton = screen.getByTestId("sidebar-filter-search");
      const ariaLabel = searchButton.getAttribute("aria-label");
      expect(ariaLabel).not.toBe("");
      expect(ariaLabel).not.toBeNull();
    });

    it("renders filter item buttons with gap-3 px-3 py-3 classes", () => {
      renderComponent({ isExpanded: true });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("gap-3");
      expect(button.className).toContain("px-3");
      expect(button.className).toContain("py-3");
    });

    it("search button has text label", () => {
      renderComponent({ isExpanded: true });
      const searchButton = screen.getByTestId("sidebar-filter-search");
      expect(searchButton.textContent?.length).toBeGreaterThan(0);
    });

    it("search button has data-testid sidebar-filter-search", () => {
      renderComponent({ isExpanded: true });
      expect(screen.getByTestId("sidebar-filter-search")).toBeInTheDocument();
    });
  });

  describe("collapsed rendering", () => {
    it("nav has non-empty aria-label attribute", () => {
      renderComponent({ isExpanded: false });
      const nav = screen.getByRole("navigation");
      const ariaLabel = nav.getAttribute("aria-label");
      expect(ariaLabel).not.toBe("");
      expect(ariaLabel).not.toBeNull();
    });

    it("search button has non-empty aria-label attribute", () => {
      renderComponent({ isExpanded: false });
      const searchButton = screen.getByTestId("sidebar-filter-search");
      const ariaLabel = searchButton.getAttribute("aria-label");
      expect(ariaLabel).not.toBe("");
      expect(ariaLabel).not.toBeNull();
    });

    it("filter item buttons have w-10 h-10 classes", () => {
      renderComponent({ isExpanded: false });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("w-10");
      expect(button.className).toContain("h-10");
    });

    it("no text labels on filter items (only icon)", () => {
      renderComponent({ isExpanded: false });
      const button = screen.getByTestId("sidebar-filter-inbox");
      const spans = button.querySelectorAll("span");
      const textSpans = Array.from(spans).filter(
        (span) => !span.hasAttribute("data-testid"),
      );
      expect(textSpans).toHaveLength(0);
    });

    it("search button is icon-only (no text span inside)", () => {
      renderComponent({ isExpanded: false });
      const searchButton = screen.getByTestId("sidebar-filter-search");
      expect(searchButton.textContent).toBe("");
    });
  });

  describe("active/inactive item classes", () => {
    it("expanded active item has bg-white/20 text-white", () => {
      renderComponent({ isExpanded: true, mode: "inbox" });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("bg-white/20");
      expect(button.className).toContain("text-white");
    });

    it("expanded inactive item has text-white/80", () => {
      renderComponent({ isExpanded: true, mode: null });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("text-white/80");
    });

    it("collapsed active item has bg-white/20 text-white", () => {
      renderComponent({ isExpanded: false, mode: "inbox" });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("bg-white/20");
      expect(button.className).toContain("text-white");
    });

    it("collapsed inactive item has text-white/70", () => {
      renderComponent({ isExpanded: false, mode: null });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button.className).toContain("text-white/70");
    });
  });

  describe("focused_goals item", () => {
    it("expanded renders FocusedGoalsBlock with isExpanded=true", () => {
      renderComponent({
        isExpanded: true,
        visibleFilterItems: [focusedGoalsItem],
      });
      const block = screen.getByTestId("focused-goals-block");
      expect(block).toHaveAttribute("data-is-expanded", "true");
    });

    it("collapsed renders FocusedGoalsBlock with isExpanded=false", () => {
      renderComponent({
        isExpanded: false,
        visibleFilterItems: [focusedGoalsItem],
      });
      const block = screen.getByTestId("focused-goals-block");
      expect(block).toHaveAttribute("data-is-expanded", "false");
    });

    it("FocusedGoalsBlock receives correct activeGoalId prop", () => {
      const goalId = "goal-123";
      renderComponent({
        isExpanded: true,
        activeFocusedGoalId: goalId,
        visibleFilterItems: [focusedGoalsItem],
      });
      const block = screen.getByTestId("focused-goals-block");
      expect(block).toHaveAttribute("data-active-goal-id", goalId);
    });
  });

  describe("handleFilterClick", () => {
    it("click item with route calls navigate(route) and does not call onModeChange", async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      renderComponent({
        isExpanded: true,
        visibleFilterItems: [itemWithRoute],
        onModeChange,
      });
      await user.click(screen.getByTestId("sidebar-filter-contexts"));
      expect(mockNavigate).toHaveBeenCalledWith("/contexts");
      expect(onModeChange).not.toHaveBeenCalled();
    });

    it("click active item without route calls onModeChange(null)", async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      renderComponent({
        isExpanded: true,
        mode: "inbox",
        visibleFilterItems: [itemWithoutRoute],
        onModeChange,
      });
      await user.click(screen.getByTestId("sidebar-filter-inbox"));
      expect(onModeChange).toHaveBeenCalledWith(null);
    });

    it("click inactive item without route calls onModeChange(itemMode)", async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      renderComponent({
        isExpanded: true,
        mode: null,
        visibleFilterItems: [itemWithoutRoute],
        onModeChange,
      });
      await user.click(screen.getByTestId("sidebar-filter-inbox"));
      expect(onModeChange).toHaveBeenCalledWith("inbox");
    });
  });

  describe("handleSearchClick", () => {
    it("click search button calls navigate with ROUTES.SEARCH", async () => {
      const user = userEvent.setup();
      renderComponent({ isExpanded: true });
      await user.click(screen.getByTestId("sidebar-filter-search"));
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SEARCH);
    });
  });

  describe("aria-pressed", () => {
    it("active item has aria-pressed true", () => {
      renderComponent({ isExpanded: true, mode: "inbox" });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("inactive item has aria-pressed false", () => {
      renderComponent({ isExpanded: true, mode: null });
      const button = screen.getByTestId("sidebar-filter-inbox");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });
});
