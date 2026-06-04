import {
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react/pure";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBar } from "@/components/command-bar";
import {
  createEyeToggleConfig,
  createFilterConfig,
  mockUseFilterBarPosition,
  mockUseHandedness,
  PLACEHOLDER_TEXT,
  StubIcon,
} from "./CommandBar.test-utils";

// implements FR1, FR2, FR3, FR4, FR11, FR13, FR14, FR16, FR17, FR18, FR20, FR21 of command-bar

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => mockUseHandedness(),
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => mockUseFilterBarPosition(),
}));

describe("CommandBar — elements", () => {
  beforeEach(() => {
    cleanup();
    mockUseHandedness.mockReturnValue({
      handedness: "right",
      setHandedness: vi.fn(),
    });
    mockUseFilterBarPosition.mockReturnValue({
      filterBarPosition: "bottom",
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("actions container classes", () => {
    it("should have flex and shrink-0 base classes", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle: createEyeToggleConfig(),
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const actions = within(container).getByTestId("command-bar-actions");
      expect(actions.className).toContain("flex");
      expect(actions.className).toContain("shrink-0");
    });

    it("should have self-end and gap-1 when not wrapped", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const actions = within(container).getByTestId("command-bar-actions");
      expect(actions.className).toContain("self-end");
      expect(actions.className).toContain("gap-1");
    });
  });

  describe("eye toggle", () => {
    it("should render Eye icon with accent styling when visible", () => {
      const eyeToggle = createEyeToggleConfig({ isVisible: true });

      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle,
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const toggle = within(container).getByTestId("command-bar-eye-toggle");
      expect(toggle.className).toContain("bg-accent/10");
      expect(toggle.className).toContain("text-accent");
      expect(toggle.getAttribute("aria-pressed")).toBe("true");
    });

    it("should render EyeOff icon with gray styling when not visible", () => {
      const eyeToggle = createEyeToggleConfig({ isVisible: false });

      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle,
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const toggle = within(container).getByTestId("command-bar-eye-toggle");
      expect(toggle.className).toContain("text-gray-400");
      expect(toggle.className).toContain("hover:bg-gray-100");
      expect(toggle.getAttribute("aria-pressed")).toBe("false");
    });

    it("should have a non-empty aria-label from i18n on eye toggle", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle: createEyeToggleConfig(),
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const toggle = within(container).getByTestId("command-bar-eye-toggle");
      const ariaLabel = toggle.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    });

    it("should have correct base classes on eye toggle button", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle: createEyeToggleConfig(),
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const toggle = within(container).getByTestId("command-bar-eye-toggle");
      expect(toggle.className).toContain("w-10");
      expect(toggle.className).toContain("h-10");
      expect(toggle.className).toContain("rounded-xl");
      expect(toggle.className).toContain("transition-colors");
    });
  });

  describe("create button", () => {
    it("should have accent background and rounded-full styling", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const createButton = within(container).getByTestId(
        "command-bar-create-button",
      );
      expect(createButton.className).toContain("bg-accent");
      expect(createButton.className).toContain("text-white");
      expect(createButton.className).toContain("rounded-full");
      expect(createButton.className).toContain("shadow-md");
    });

    it("should have a non-empty aria-label from i18n", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const createButton = within(container).getByTestId(
        "command-bar-create-button",
      );
      const ariaLabel = createButton.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    });
  });

  describe("entity icon", () => {
    it("should have accent color and absolute positioning", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const iconWrapper = within(container).getByTestId(
        "command-bar-entity-icon",
      );
      expect(iconWrapper.className).toContain("text-accent");
      expect(iconWrapper.className).toContain("absolute");
      expect(iconWrapper.className).toContain("left-2.5");
      expect(iconWrapper.className).toContain("pointer-events-none");
    });
  });

  describe("textarea focus collapses filter", () => {
    it("should collapse filter when textarea receives focus", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          filter: createFilterConfig(),
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      // Expand filter
      const toggle = within(container).getByTestId("command-bar-filter-toggle");
      fireEvent.click(toggle);
      expect(
        within(container).queryByTestId("command-bar-filter-area"),
      ).not.toBeNull();

      // Focus textarea
      const textarea = within(container).getByTestId("command-bar-textarea");
      fireEvent.focus(textarea);

      // Filter should collapse
      expect(
        within(container).queryByTestId("command-bar-filter-area"),
      ).toBeNull();
    });
  });
});
