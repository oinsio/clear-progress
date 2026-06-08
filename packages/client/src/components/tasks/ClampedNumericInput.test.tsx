import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClampedNumericInput } from "./ClampedNumericInput";

// implements FR8 of repeating-task-rule-change

describe("ClampedNumericInput", () => {
  const mockOnChange = vi.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  const renderInput = (
    props: Partial<React.ComponentProps<typeof ClampedNumericInput>> = {},
  ) => {
    return render(
      <ClampedNumericInput
        value={3}
        min={1}
        max={365}
        onChange={mockOnChange}
        data-testid="numeric-input"
        {...props}
      />,
    );
  };

  const getInput = () =>
    screen.getByTestId("numeric-input") as HTMLInputElement;

  describe("clearing and retyping", () => {
    it("should allow clearing the field via backspace", async () => {
      renderInput();
      const input = getInput();

      await user.clear(input);

      expect(input.value).toBe("");
    });

    it("should allow typing a new value after clearing", async () => {
      renderInput();
      const input = getInput();

      await user.clear(input);
      await user.type(input, "4");

      expect(input.value).toBe("4");
      expect(mockOnChange).toHaveBeenCalledWith(4);
    });

    it("should allow replacing value by clearing and typing multi-digit number", async () => {
      renderInput();
      const input = getInput();

      await user.clear(input);
      await user.type(input, "14");

      expect(input.value).toBe("14");
      expect(mockOnChange).toHaveBeenCalledWith(14);
    });
  });

  describe("blur behavior", () => {
    it("should restore last valid value on blur when field is empty", async () => {
      renderInput();
      const input = getInput();

      await user.clear(input);
      expect(input.value).toBe("");

      await user.tab(); // blur

      expect(input.value).toBe("3");
    });

    it("should clamp to min on blur when value is below min", async () => {
      renderInput({ value: 5, min: 1, max: 365 });
      const input = getInput();

      await user.clear(input);
      await user.type(input, "0");
      await user.tab();

      expect(input.value).toBe("1");
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it("should clamp to max on blur when value exceeds max", async () => {
      renderInput({ value: 5, min: 1, max: 31 });
      const input = getInput();

      await user.clear(input);
      await user.type(input, "50");
      await user.tab();

      expect(input.value).toBe("31");
    });
  });

  describe("clamping on change", () => {
    it("should clamp value to max during typing", async () => {
      renderInput({ value: 1, min: 1, max: 365 });
      const input = getInput();

      await user.clear(input);
      await user.type(input, "500");

      expect(mockOnChange).toHaveBeenCalledWith(365);
    });

    it("should clamp value to min during typing", async () => {
      renderInput({ value: 5, min: 1, max: 365 });
      const input = getInput();

      await user.clear(input);
      await user.type(input, "0");

      expect(mockOnChange).toHaveBeenCalledWith(1);
    });
  });

  describe("external value sync", () => {
    it("should update display when external value prop changes", () => {
      const { rerender } = render(
        <ClampedNumericInput
          value={3}
          min={1}
          max={365}
          onChange={mockOnChange}
          data-testid="numeric-input"
        />,
      );

      expect(getInput().value).toBe("3");

      rerender(
        <ClampedNumericInput
          value={7}
          min={1}
          max={365}
          onChange={mockOnChange}
          data-testid="numeric-input"
        />,
      );

      expect(getInput().value).toBe("7");
    });
  });

  describe("HTML attributes", () => {
    it("should pass id, className, and placeholder to the input", () => {
      renderInput({
        id: "my-input",
        className: "custom-class",
        placeholder: "Enter number",
      });
      const input = getInput();

      expect(input.id).toBe("my-input");
      expect(input.className).toContain("custom-class");
      expect(input.placeholder).toBe("Enter number");
    });
  });
});
