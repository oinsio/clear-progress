import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HiddenTasksToggle } from "./HiddenTasksToggle";
import { STORAGE_KEYS } from "@/constants";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("HiddenTasksToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initial state", () => {
    it("should render with EyeOff icon when localStorage is empty", () => {
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-pressed", "false");
      // EyeOff icon should be rendered (showHidden = false)
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("should render with Eye icon when localStorage has 'true'", () => {
      localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, "true");
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("should render with EyeOff icon when localStorage has 'false'", () => {
      localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, "false");
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("should have correct aria-label", () => {
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");
      expect(button).toHaveAttribute("aria-label", "filter.showHidden");
    });
  });

  describe("Toggle behavior", () => {
    it("should toggle state from false to true on click", async () => {
      const user = userEvent.setup();
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveAttribute("aria-pressed", "false");

      await user.click(button);

      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("should toggle state from true to false on click", async () => {
      const user = userEvent.setup();
      localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, "true");
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveAttribute("aria-pressed", "true");

      await user.click(button);

      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("should persist state to localStorage on toggle", async () => {
      const user = userEvent.setup();
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      await user.click(button);

      expect(localStorage.getItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS)).toBe(
        "true",
      );

      await user.click(button);

      expect(localStorage.getItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS)).toBe(
        "false",
      );
    });
  });

  describe("Custom event dispatch", () => {
    async function testEventDispatch(
      initialValue: boolean,
      expectedDetail: boolean,
    ) {
      const user = userEvent.setup();
      if (initialValue) {
        localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, "true");
      }
      const eventListener = vi.fn();
      window.addEventListener("hidden_tasks_toggle", eventListener);

      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      await user.click(button);

      expect(eventListener).toHaveBeenCalledTimes(1);
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBe(expectedDetail);

      window.removeEventListener("hidden_tasks_toggle", eventListener);
    }

    it("should dispatch hidden_tasks_toggle event with detail=true when toggling to true", async () => {
      await testEventDispatch(false, true);
    });

    it("should dispatch hidden_tasks_toggle event with detail=false when toggling to false", async () => {
      await testEventDispatch(true, false);
    });
  });

  describe("CSS classes", () => {
    it("should apply accent styles when showHidden is true", () => {
      localStorage.setItem(STORAGE_KEYS.SHOW_HIDDEN_TASKS, "true");
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveClass("bg-accent/10", "text-accent");
    });

    it("should apply default styles when showHidden is false", () => {
      render(<HiddenTasksToggle />);
      const button = screen.getByTestId("hidden-tasks-toggle");

      expect(button).toHaveClass("text-gray-400", "hover:bg-gray-100");
    });
  });
});
