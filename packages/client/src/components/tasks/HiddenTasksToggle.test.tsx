import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HiddenTasksToggle } from "./HiddenTasksToggle";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockToggleShowHidden = vi.fn();

vi.mock("@/hooks/useShowHidden", () => ({
  useShowHidden: vi.fn(),
}));

describe("HiddenTasksToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial state", () => {
    it("should render with EyeOff icon when showHidden is false", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: false,
        toggleShowHidden: mockToggleShowHidden,
      });

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("should render with Eye icon when showHidden is true", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: true,
        toggleShowHidden: mockToggleShowHidden,
      });

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("should have correct aria-label", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: false,
        toggleShowHidden: mockToggleShowHidden,
      });

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toHaveAttribute("aria-label", "filter.showHidden");
    });
  });

  describe("Toggle behavior", () => {
    it("should call toggleShowHidden on click", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: false,
        toggleShowHidden: mockToggleShowHidden,
      });

      const user = userEvent.setup();
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      await user.click(button);

      expect(mockToggleShowHidden).toHaveBeenCalledTimes(1);
    });
  });

  describe("CSS classes", () => {
    it("should apply accent styles when showHidden is true", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: true,
        toggleShowHidden: mockToggleShowHidden,
      });

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveClass("bg-accent/10", "text-accent");
    });

    it("should apply default styles when showHidden is false", async () => {
      const { useShowHidden } = await import("@/hooks/useShowHidden");
      vi.mocked(useShowHidden).mockReturnValue({
        showHidden: false,
        toggleShowHidden: mockToggleShowHidden,
      });

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveClass("text-gray-400", "hover:bg-gray-100");
    });
  });
});
