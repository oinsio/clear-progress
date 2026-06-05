// implements NFR-A2, NFR-R1 of hide-tasks
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatePickerInput } from "./DatePickerInput";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("DatePickerInput", () => {
  it("should render a date input", () => {
    render(<DatePickerInput value="" onChange={vi.fn()} />);
    const input = screen.getByLabelText("task.selectDate");
    expect(input).toHaveAttribute("type", "date");
  });

  it("should display the provided value", () => {
    render(<DatePickerInput value="2027-06-01" onChange={vi.fn()} />);
    expect(screen.getByLabelText("task.selectDate")).toHaveValue("2027-06-01");
  });

  it("should call onChange when date changes", () => {
    const onChange = vi.fn();
    render(<DatePickerInput value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("task.selectDate"), {
      target: { value: "2027-06-15" },
    });
    expect(onChange).toHaveBeenCalledWith("2027-06-15");
  });

  it("should set min attribute when provided", () => {
    render(<DatePickerInput value="" onChange={vi.fn()} min="2026-06-06" />);
    expect(screen.getByLabelText("task.selectDate")).toHaveAttribute(
      "min",
      "2026-06-06",
    );
  });

  it("should use custom aria-label when provided", () => {
    render(
      <DatePickerInput value="" onChange={vi.fn()} label="Custom label" />,
    );
    expect(screen.getByLabelText("Custom label")).toBeInTheDocument();
  });

  it("should use default i18n label when no label provided", () => {
    render(<DatePickerInput value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText("task.selectDate")).toBeInTheDocument();
  });
});
