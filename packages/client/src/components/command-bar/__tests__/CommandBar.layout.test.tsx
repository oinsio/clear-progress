import { cleanup, render, within } from "@testing-library/react/pure";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandBar } from "@/components/command-bar";
import {
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

describe("CommandBar — layout", () => {
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

  describe("position classes", () => {
    it("should apply bottom position classes when position is bottom", () => {
      mockUseFilterBarPosition.mockReturnValue({
        filterBarPosition: "bottom",
      });

      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const commandBar = within(container).getByTestId("command-bar");
      expect(commandBar.className).toContain("order-last");
      expect(commandBar.className).toContain("border-t");
      expect(commandBar.className).toContain("border-gray-200");
      expect(commandBar.className).toContain(
        "pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
      );
    });

    it("should apply top position classes when position is top", () => {
      mockUseFilterBarPosition.mockReturnValue({
        filterBarPosition: "top",
      });

      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const commandBar = within(container).getByTestId("command-bar");
      expect(commandBar.className).toContain("border-b");
      expect(commandBar.className).toContain("border-gray-200");
      expect(commandBar.className).not.toContain("order-last");
      expect(commandBar.className).not.toContain("border-t");
    });
  });

  describe("handedness classes", () => {
    it("should apply flex-row-reverse on bar when left-handed", () => {
      mockUseHandedness.mockReturnValue({
        handedness: "left",
        setHandedness: vi.fn(),
      });

      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const commandBar = within(container).getByTestId("command-bar");
      expect(commandBar.className).toContain("flex-row-reverse");
    });

    it("should not apply flex-row-reverse on bar when right-handed", () => {
      mockUseHandedness.mockReturnValue({
        handedness: "right",
        setHandedness: vi.fn(),
      });

      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const commandBar = within(container).getByTestId("command-bar");
      expect(commandBar.className).not.toContain("flex-row-reverse");
    });

    it("should apply flex-row-reverse on actions when left-handed and not wrapped", () => {
      mockUseHandedness.mockReturnValue({
        handedness: "left",
        setHandedness: vi.fn(),
      });

      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle: { isVisible: true, onToggle: vi.fn() },
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const actions = within(container).getByTestId("command-bar-actions");
      expect(actions.className).toContain("flex-row-reverse");
    });

    it("should not apply flex-row-reverse on actions when right-handed", () => {
      mockUseHandedness.mockReturnValue({
        handedness: "right",
        setHandedness: vi.fn(),
      });

      const { container } = render(
        React.createElement(CommandBar, {
          eyeToggle: { isVisible: true, onToggle: vi.fn() },
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const actions = within(container).getByTestId("command-bar-actions");
      expect(actions.className).not.toContain("flex-row-reverse");
    });
  });

  describe("base layout classes", () => {
    it("should have bg-white and flex layout on command bar", () => {
      const { container } = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder: PLACEHOLDER_TEXT,
          onSubmit: vi.fn(),
        }),
      );

      const commandBar = within(container).getByTestId("command-bar");
      expect(commandBar.className).toContain("bg-white");
      expect(commandBar.className).toContain("flex");
      expect(commandBar.className).toContain("items-start");
      expect(commandBar.className).toContain("px-3");
      expect(commandBar.className).toContain("py-2");
      expect(commandBar.className).toContain("gap-1.5");
    });
  });
});
