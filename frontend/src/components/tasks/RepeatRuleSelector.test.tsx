import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RepeatRuleSelector } from "./RepeatRuleSelector";
import type { RepeatRule } from "@/types/common";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "repeat.afterCompletion" && params?.days) {
        return `After ${params.days} days`;
      }
      return key;
    },
  }),
}));

describe("RepeatRuleSelector", () => {
  const mockOnChange = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Step 1: Type selection", () => {
    it("should render type selection step initially", () => {
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId("repeat-type-step")).toBeInTheDocument();
      expect(screen.getByTestId("repeat-type-fixed")).toBeInTheDocument();
      expect(
        screen.getByTestId("repeat-type-after-completion"),
      ).toBeInTheDocument();
    });

    it("should not show remove button when value is null", () => {
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      expect(screen.queryByTestId("repeat-remove")).not.toBeInTheDocument();
    });

    it("should show remove button when value is provided", () => {
      const value: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      };

      render(
        <RepeatRuleSelector
          value={value}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId("repeat-remove")).toBeInTheDocument();
    });

    it("should call onBack when back button is clicked on type step", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-back"));

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it("should call onChange(null) and onBack when remove button is clicked", async () => {
      const user = userEvent.setup();
      const value: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      };

      render(
        <RepeatRuleSelector
          value={value}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-remove"));

      expect(mockOnChange).toHaveBeenCalledWith(null);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it("should navigate to fixed_params step when fixed type is selected", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));

      expect(
        screen.getByTestId("repeat-fixed-params-step"),
      ).toBeInTheDocument();
    });

    it("should navigate to after_completion_params step when after_completion type is selected", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));

      expect(
        screen.getByTestId("repeat-after-completion-params-step"),
      ).toBeInTheDocument();
    });
  });

  describe("Step 2a: Fixed params", () => {
    it("should render frequency buttons", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));

      expect(screen.getByTestId("repeat-frequency-daily")).toBeInTheDocument();
      expect(screen.getByTestId("repeat-frequency-weekly")).toBeInTheDocument();
      expect(
        screen.getByTestId("repeat-frequency-monthly"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("repeat-frequency-yearly")).toBeInTheDocument();
    });

    it("should render interval input", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));

      expect(screen.getByTestId("repeat-interval-input")).toBeInTheDocument();
    });

    it("should show weekday buttons when weekly frequency is selected", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-weekly"));

      for (let day = 1; day <= 7; day++) {
        expect(screen.getByTestId(`repeat-weekday-${day}`)).toBeInTheDocument();
      }
    });

    it("should toggle weekday selection", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-weekly"));

      const mondayButton = screen.getByTestId("repeat-weekday-1");
      expect(mondayButton).toHaveAttribute("aria-pressed", "false");

      await user.click(mondayButton);
      expect(mondayButton).toHaveAttribute("aria-pressed", "true");

      await user.click(mondayButton);
      expect(mondayButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should show day_of_month input when monthly frequency is selected", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-monthly"));

      expect(
        screen.getByTestId("repeat-day-of-month-input"),
      ).toBeInTheDocument();
    });

    it("should show month and day inputs when yearly frequency is selected", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-yearly"));

      expect(screen.getByTestId("repeat-month-input")).toBeInTheDocument();
      expect(screen.getByTestId("repeat-day-input")).toBeInTheDocument();
    });

    it("should disable next button when weekly frequency is selected but no weekdays are chosen", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-weekly"));

      const nextButton = screen.getByTestId("repeat-fixed-next");
      expect(nextButton).toBeDisabled();
    });

    it("should enable next button when weekly frequency is selected and at least one weekday is chosen", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-weekly"));
      await user.click(screen.getByTestId("repeat-weekday-1"));

      const nextButton = screen.getByTestId("repeat-fixed-next");
      expect(nextButton).not.toBeDisabled();
    });

    it("should navigate to placement step when next button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));

      expect(screen.getByTestId("repeat-placement-step")).toBeInTheDocument();
    });

    it("should navigate back to type step when back button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-back"));

      expect(screen.getByTestId("repeat-type-step")).toBeInTheDocument();
    });

    it("should clamp interval value to min/max range", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));

      const intervalInput = screen.getByTestId(
        "repeat-interval-input",
      ) as HTMLInputElement;

      // Test max clamp
      await user.clear(intervalInput);
      await user.type(intervalInput, "500");
      expect(intervalInput.value).toBe("365"); // MAX_INTERVAL

      // Test min clamp - type "0" which should be clamped to 1
      await user.clear(intervalInput);
      await user.type(intervalInput, "0");
      // After typing "0", the value should still be clamped to min (1)
      // But userEvent.type adds to existing value, so we need to check the actual behavior
      expect(parseInt(intervalInput.value, 10)).toBeGreaterThanOrEqual(1);
    });

    it("should clamp day_of_month value to 1-31 range", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-monthly"));

      const dayInput = screen.getByTestId(
        "repeat-day-of-month-input",
      ) as HTMLInputElement;

      // Test max clamp
      await user.clear(dayInput);
      await user.type(dayInput, "50");
      expect(dayInput.value).toBe("31");

      // Test min clamp
      await user.clear(dayInput);
      await user.type(dayInput, "0");
      expect(parseInt(dayInput.value, 10)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Step 2b: After completion params", () => {
    it("should render delay_days input", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));

      expect(screen.getByTestId("repeat-delay-days-input")).toBeInTheDocument();
    });

    it("should navigate to placement step when next button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));
      await user.click(screen.getByTestId("repeat-after-completion-next"));

      expect(screen.getByTestId("repeat-placement-step")).toBeInTheDocument();
    });

    it("should navigate back to type step when back button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));
      await user.click(screen.getByTestId("repeat-back"));

      expect(screen.getByTestId("repeat-type-step")).toBeInTheDocument();
    });

    it("should clamp delay_days value to 1-365 range", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));

      const delayInput = screen.getByTestId(
        "repeat-delay-days-input",
      ) as HTMLInputElement;

      // Test max clamp
      await user.clear(delayInput);
      await user.type(delayInput, "500");
      expect(delayInput.value).toBe("365");

      // Test min clamp
      await user.clear(delayInput);
      await user.type(delayInput, "0");
      expect(parseInt(delayInput.value, 10)).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Step 3: Placement", () => {
    it("should render target_box buttons", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));

      expect(screen.getByTestId("repeat-target-box-today")).toBeInTheDocument();
      expect(screen.getByTestId("repeat-target-box-week")).toBeInTheDocument();
      expect(screen.getByTestId("repeat-target-box-later")).toBeInTheDocument();
    });

    it("should render advance_days input", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));

      expect(
        screen.getByTestId("repeat-advance-days-input"),
      ).toBeInTheDocument();
    });

    it("should navigate back to fixed_params step when back button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));
      await user.click(screen.getByTestId("repeat-back"));

      expect(
        screen.getByTestId("repeat-fixed-params-step"),
      ).toBeInTheDocument();
    });

    it("should navigate back to after_completion_params step when back button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));
      await user.click(screen.getByTestId("repeat-after-completion-next"));
      await user.click(screen.getByTestId("repeat-back"));

      expect(
        screen.getByTestId("repeat-after-completion-params-step"),
      ).toBeInTheDocument();
    });

    it("should clamp advance_days value to 0-90 range", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));

      const advanceInput = screen.getByTestId(
        "repeat-advance-days-input",
      ) as HTMLInputElement;

      // Test max clamp
      await user.clear(advanceInput);
      await user.type(advanceInput, "100");
      expect(advanceInput.value).toBe("90");

      // Test min clamp (0 is valid for advance_days)
      await user.clear(advanceInput);
      await user.type(advanceInput, "-1");
      // Negative values should be clamped to 0
      expect(parseInt(advanceInput.value, 10)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Apply and create RepeatRule", () => {
    it("should create fixed daily rule and call onChange", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-daily"));
      await user.click(screen.getByTestId("repeat-fixed-next"));
      await user.click(screen.getByTestId("repeat-apply"));

      expect(mockOnChange).toHaveBeenCalledWith({
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      });
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it("should create fixed weekly rule with weekdays", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-weekly"));
      await user.click(screen.getByTestId("repeat-weekday-1")); // Monday
      await user.click(screen.getByTestId("repeat-weekday-3")); // Wednesday
      await user.click(screen.getByTestId("repeat-fixed-next"));
      await user.click(screen.getByTestId("repeat-apply"));

      expect(mockOnChange).toHaveBeenCalledWith({
        type: "fixed",
        frequency: "weekly",
        interval: 1,
        weekdays: [1, 3],
        target_box: "today",
        advance_days: 0,
      });
    });

    it("should create fixed monthly rule with day_of_month", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-monthly"));

      await user.click(screen.getByTestId("repeat-fixed-next"));
      await user.click(screen.getByTestId("repeat-apply"));

      // Should use default day_of_month = 1
      expect(mockOnChange).toHaveBeenCalledWith({
        type: "fixed",
        frequency: "monthly",
        interval: 1,
        day_of_month: 1,
        target_box: "today",
        advance_days: 0,
      });
    });

    it("should create fixed yearly rule with month_and_day", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-fixed"));
      await user.click(screen.getByTestId("repeat-frequency-yearly"));

      await user.click(screen.getByTestId("repeat-fixed-next"));
      await user.click(screen.getByTestId("repeat-apply"));

      // Should use default month_and_day = { month: 1, day: 1 }
      expect(mockOnChange).toHaveBeenCalledWith({
        type: "fixed",
        frequency: "yearly",
        interval: 1,
        month_and_day: { month: 1, day: 1 },
        target_box: "today",
        advance_days: 0,
      });
    });

    it("should create after_completion rule", async () => {
      const user = userEvent.setup();
      render(
        <RepeatRuleSelector
          value={null}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      await user.click(screen.getByTestId("repeat-type-after-completion"));

      await user.click(screen.getByTestId("repeat-after-completion-next"));

      await user.click(screen.getByTestId("repeat-target-box-week"));

      await user.click(screen.getByTestId("repeat-apply"));

      // Should use default delay_days = 1, advance_days = 0
      expect(mockOnChange).toHaveBeenCalledWith({
        type: "after_completion",
        delay_days: 1,
        target_box: "week",
        advance_days: 0,
      });
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("Initialization with existing value", () => {
    it("should initialize with fixed daily rule", () => {
      const value: RepeatRule = {
        type: "fixed",
        frequency: "daily",
        interval: 2,
        target_box: "week",
        advance_days: 5,
      };

      render(
        <RepeatRuleSelector
          value={value}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId("repeat-type-step")).toBeInTheDocument();
    });

    it("should initialize with after_completion rule", () => {
      const value: RepeatRule = {
        type: "after_completion",
        delay_days: 10,
        target_box: "later",
        advance_days: 3,
      };

      render(
        <RepeatRuleSelector
          value={value}
          onChange={mockOnChange}
          onBack={mockOnBack}
        />,
      );

      expect(screen.getByTestId("repeat-type-step")).toBeInTheDocument();
    });
  });
});
