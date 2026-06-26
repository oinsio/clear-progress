// implements FR2, NFR-A1, NFR-A2 of improve-sidebar-ux
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SIDEBAR_MODES } from "@/constants";
import type { SidebarMode } from "@/types/common";
import { SidebarControlPopover } from "./SidebarControlPopover";

function renderPopover(
  overrides: Partial<{
    currentMode: SidebarMode;
    onModeChange: (mode: SidebarMode) => void;
    isOpen: boolean;
    onClose: () => void;
  }> = {},
) {
  const defaultProps = {
    currentMode: "expanded" as SidebarMode,
    onModeChange: vi.fn(),
    isOpen: true,
    onClose: vi.fn(),
    ...overrides,
  };
  return {
    ...render(<SidebarControlPopover {...defaultProps} />),
    props: defaultProps,
  };
}

describe("SidebarControlPopover", () => {
  describe("rendering", () => {
    it("renders nothing when isOpen is false", () => {
      renderPopover({ isOpen: false });
      expect(
        screen.queryByTestId("sidebar-control-popover"),
      ).not.toBeInTheDocument();
    });

    it("renders popover when isOpen is true", () => {
      renderPopover({ isOpen: true });
      expect(screen.getByTestId("sidebar-control-popover")).toBeInTheDocument();
    });

    it("renders three mode options", () => {
      renderPopover();
      for (const mode of SIDEBAR_MODES) {
        expect(
          screen.getByTestId(`sidebar-mode-option-${mode}`),
        ).toBeInTheDocument();
      }
    });

    it("popover has role listbox", () => {
      renderPopover();
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("popover has aria-label", () => {
      renderPopover();
      const listbox = screen.getByRole("listbox");
      expect(listbox.getAttribute("aria-label")).not.toBe("");
      expect(listbox.getAttribute("aria-label")).not.toBeNull();
    });
  });

  describe("active state", () => {
    it("active mode option has aria-selected true", () => {
      renderPopover({ currentMode: "collapsed" });
      const collapsedOption = screen.getByTestId(
        "sidebar-mode-option-collapsed",
      );
      expect(collapsedOption).toHaveAttribute("aria-selected", "true");
    });

    it("inactive mode options have aria-selected false", () => {
      renderPopover({ currentMode: "collapsed" });
      const expandedOption = screen.getByTestId("sidebar-mode-option-expanded");
      const hoverOption = screen.getByTestId(
        "sidebar-mode-option-expand-on-hover",
      );
      expect(expandedOption).toHaveAttribute("aria-selected", "false");
      expect(hoverOption).toHaveAttribute("aria-selected", "false");
    });

    it("active option displays a check indicator", () => {
      renderPopover({ currentMode: "expanded" });
      const expandedOption = screen.getByTestId("sidebar-mode-option-expanded");
      const checkContainer = expandedOption.querySelector("span:first-child");
      expect(checkContainer?.className).not.toContain("invisible");
    });

    it("inactive option hides the check indicator", () => {
      renderPopover({ currentMode: "expanded" });
      const collapsedOption = screen.getByTestId(
        "sidebar-mode-option-collapsed",
      );
      const checkContainer = collapsedOption.querySelector("span:first-child");
      expect(checkContainer?.className).toContain("invisible");
    });
  });

  describe("click interaction", () => {
    it("clicking an option calls onModeChange with the correct mode", async () => {
      const user = userEvent.setup();
      const { props } = renderPopover({ currentMode: "expanded" });
      await user.click(screen.getByTestId("sidebar-mode-option-collapsed"));
      expect(props.onModeChange).toHaveBeenCalledWith("collapsed");
    });

    it("clicking an option closes the popover", async () => {
      const user = userEvent.setup();
      const { props } = renderPopover({ currentMode: "expanded" });
      await user.click(screen.getByTestId("sidebar-mode-option-collapsed"));
      expect(props.onClose).toHaveBeenCalled();
    });
  });

  describe("keyboard navigation (NFR-A1, NFR-A2)", () => {
    it("Escape key closes the popover", async () => {
      const user = userEvent.setup();
      const { props } = renderPopover();
      await user.keyboard("{Escape}");
      expect(props.onClose).toHaveBeenCalled();
    });

    it("ArrowDown moves focus to the next option", async () => {
      const user = userEvent.setup();
      renderPopover({ currentMode: "expanded" });
      // Focus should start on "expanded" (index 0)
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-collapsed"),
      );
    });

    it("ArrowUp moves focus to the previous option", async () => {
      const user = userEvent.setup();
      renderPopover({ currentMode: "collapsed" });
      // Focus should start on "collapsed" (index 1)
      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-expanded"),
      );
    });

    it("ArrowDown wraps around from last to first option", async () => {
      const user = userEvent.setup();
      renderPopover({ currentMode: "expand-on-hover" });
      // Focus on last option
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-expanded"),
      );
    });

    it("ArrowUp wraps around from first to last option", async () => {
      const user = userEvent.setup();
      renderPopover({ currentMode: "expanded" });
      // Focus on first option
      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-expand-on-hover"),
      );
    });

    it("Enter selects the focused option", async () => {
      const user = userEvent.setup();
      const { props } = renderPopover({ currentMode: "expanded" });
      // Focus is on "expanded", move to "collapsed"
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      expect(props.onModeChange).toHaveBeenCalledWith("collapsed");
    });
  });

  describe("i18n keys coverage", () => {
    it("each mode option displays a non-empty translated label", () => {
      renderPopover();
      for (const mode of SIDEBAR_MODES) {
        const option = screen.getByTestId(`sidebar-mode-option-${mode}`);
        // The second span in each button is the label text
        const labelSpan = option.querySelectorAll("span")[1];
        expect(labelSpan).toBeDefined();
        expect(labelSpan?.textContent).not.toBe("");
      }
    });
  });

  describe("check icon rendering", () => {
    it("active option contains a visible SVG check icon", () => {
      renderPopover({ currentMode: "collapsed" });
      const activeOption = screen.getByTestId("sidebar-mode-option-collapsed");
      const svgElement = activeOption.querySelector("svg");
      expect(svgElement).not.toBeNull();
    });

    it("inactive option does not contain an SVG check icon", () => {
      renderPopover({ currentMode: "collapsed" });
      const inactiveOption = screen.getByTestId("sidebar-mode-option-expanded");
      const svgElement = inactiveOption.querySelector("svg");
      expect(svgElement).toBeNull();
    });
  });

  describe("focus management", () => {
    it("focuses current mode option when popover opens", () => {
      renderPopover({ currentMode: "collapsed" });
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-collapsed"),
      );
    });

    it("focuses first option when currentMode index is valid", () => {
      renderPopover({ currentMode: "expanded" });
      expect(document.activeElement).toBe(
        screen.getByTestId("sidebar-mode-option-expanded"),
      );
    });
  });
});
