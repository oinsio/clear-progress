import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpacityBars } from "./OpacityBars";
import { FOCUS_OPACITY_LEVELS } from "@/constants";

describe("OpacityBars", () => {
  it("should render 5 bars for default levels", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    FOCUS_OPACITY_LEVELS.forEach((level) => {
      expect(screen.getByTestId(`opacity-bar-${level}`)).toBeInTheDocument();
    });
  });

  it("should render custom number of bars when levels prop is provided", () => {
    const customLevels = [80, 60, 40, 20];
    const onChange = vi.fn();
    render(<OpacityBars value={60} onChange={onChange} levels={customLevels} />);

    customLevels.forEach((level) => {
      expect(screen.getByTestId(`opacity-bar-${level}`)).toBeInTheDocument();
    });
  });

  it("should apply bg-accent class to selected bar", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    const selectedBar = screen.getByTestId("opacity-bar-30");
    expect(selectedBar).toHaveClass("bg-accent");

    const unselectedBar = screen.getByTestId("opacity-bar-50");
    expect(unselectedBar).toHaveClass("bg-gray-900");
    expect(unselectedBar).not.toHaveClass("bg-accent");
  });

  it("should call onChange with correct value when bar is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    const bar50 = screen.getByTestId("opacity-bar-50");
    await user.click(bar50);

    expect(onChange).toHaveBeenCalledWith(50);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("should apply correct opacity style to each bar", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    FOCUS_OPACITY_LEVELS.forEach((level) => {
      const bar = screen.getByTestId(`opacity-bar-${level}`);
      expect(bar).toHaveStyle({ opacity: level / 100 });
    });
  });

  it("should have correct aria attributes", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    const selectedBar = screen.getByTestId("opacity-bar-30");
    expect(selectedBar).toHaveAttribute("aria-pressed", "true");
    expect(selectedBar).toHaveAttribute("aria-label", "30%");

    const unselectedBar = screen.getByTestId("opacity-bar-50");
    expect(unselectedBar).toHaveAttribute("aria-pressed", "false");
    expect(unselectedBar).toHaveAttribute("aria-label", "50%");
  });

  it("should have hover and active transition classes", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    const bar = screen.getByTestId("opacity-bar-30");
    expect(bar).toHaveClass("hover:scale-y-[1.3]");
    expect(bar).toHaveClass("active:scale-y-[0.8]");
    expect(bar).toHaveClass("transition-all");
  });

  it("should have correct data-opacity attribute", () => {
    const onChange = vi.fn();
    render(<OpacityBars value={30} onChange={onChange} />);

    FOCUS_OPACITY_LEVELS.forEach((level) => {
      const bar = screen.getByTestId(`opacity-bar-${level}`);
      expect(bar).toHaveAttribute("data-opacity", String(level));
    });
  });
});
