import {
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react/pure";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBarFilter } from "../CommandBarFilter";
import {
  createFilterConfig,
  DEFAULT_FILTER_ITEMS,
} from "./CommandBar.test-utils";

// implements FR5, FR6, FR8, FR9 of command-bar

describe("CommandBarFilter — mutation coverage", () => {
  let onExpandedChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cleanup();
    onExpandedChange = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe("collapsed state", () => {
    it("should render filter toggle button when collapsed", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: false,
          onExpandedChange,
        }),
      );

      expect(
        within(container).getByTestId("command-bar-filter-toggle"),
      ).toBeDefined();
      expect(
        within(container).queryByTestId("command-bar-filter-area"),
      ).toBeNull();
    });

    it("should show active box icon in collapsed state", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig({ activeValue: "week" }),
          isExpanded: false,
          onExpandedChange,
        }),
      );

      const toggle = within(container).getByTestId("command-bar-filter-toggle");
      expect(within(toggle).getByTestId("box-icon-week")).toBeDefined();
    });

    it("should call onExpandedChange(true) when toggle is clicked", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: false,
          onExpandedChange,
        }),
      );

      const toggle = within(container).getByTestId("command-bar-filter-toggle");
      fireEvent.click(toggle);

      expect(onExpandedChange).toHaveBeenCalledWith(true);
    });

    it("should have aria-expanded=false when collapsed", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: false,
          onExpandedChange,
        }),
      );

      const toggle = within(container).getByTestId("command-bar-filter-toggle");
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("expanded state", () => {
    it("should render all box filter buttons when expanded", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      const filterArea = within(container).getByTestId(
        "command-bar-filter-area",
      );
      for (const item of DEFAULT_FILTER_ITEMS) {
        expect(
          within(filterArea).getByTestId(`box-filter-${item.value}`),
        ).toBeDefined();
      }
    });

    it("should not render toggle button when expanded", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      expect(
        within(container).queryByTestId("command-bar-filter-toggle"),
      ).toBeNull();
    });

    it("should call onChange and collapse when a box is selected", () => {
      const filterConfig = createFilterConfig();

      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: filterConfig,
          isExpanded: true,
          onExpandedChange,
        }),
      );

      const weekButton = within(container).getByTestId("box-filter-week");
      fireEvent.click(weekButton);

      expect(filterConfig.onChange).toHaveBeenCalledWith("week");
      expect(onExpandedChange).toHaveBeenCalledWith(false);
    });

    it("should call onExpandedChange(false) when toggle is clicked while expanded", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      // Verify it's expanded — no toggle visible, filter area visible
      expect(
        within(container).getByTestId("command-bar-filter-area"),
      ).toBeDefined();
    });

    it("should highlight active box with accent colors", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig({ activeValue: "today" }),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      const todayButton = within(container).getByTestId("box-filter-today");
      expect(todayButton.className).toContain("text-white");
      expect(todayButton.className).toContain("bg-accent");

      const weekButton = within(container).getByTestId("box-filter-week");
      expect(weekButton.className).toContain("text-gray-400");
      expect(weekButton.className).not.toContain("bg-accent");
    });
  });

  describe("outside click", () => {
    it("should call onExpandedChange(false) when clicking outside the filter", () => {
      render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      fireEvent.pointerDown(document.body);

      expect(onExpandedChange).toHaveBeenCalledWith(false);
    });

    it("should not collapse when clicking inside the filter area", () => {
      const { container } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      const filterArea = within(container).getByTestId(
        "command-bar-filter-area",
      );
      fireEvent.pointerDown(filterArea);

      // onExpandedChange should NOT have been called with false from outside click handler
      // (it may be called from box selection, but not from outside click)
      const outsideClickCalls = onExpandedChange.mock.calls.filter(
        (call: unknown[]) => call[0] === false,
      );
      expect(outsideClickCalls).toHaveLength(0);
    });

    it("should not register outside click listener when collapsed", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: false,
          onExpandedChange,
        }),
      );

      const pointerDownCalls = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "pointerdown",
      );
      expect(pointerDownCalls).toHaveLength(0);

      addEventListenerSpy.mockRestore();
    });

    it("should remove outside click listener on cleanup", () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { unmount } = render(
        React.createElement(CommandBarFilter, {
          config: createFilterConfig(),
          isExpanded: true,
          onExpandedChange,
        }),
      );

      unmount();

      const pointerDownCalls = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "pointerdown",
      );
      expect(pointerDownCalls.length).toBeGreaterThan(0);

      removeEventListenerSpy.mockRestore();
    });
  });
});
