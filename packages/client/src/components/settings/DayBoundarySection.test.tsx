import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayBoundarySection } from "./DayBoundarySection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderSection(
  props: Partial<{
    dayBoundary: string;
    onDayBoundaryChange: (value: string) => void;
  }> = {},
) {
  const onDayBoundaryChange = props.onDayBoundaryChange ?? vi.fn();
  return {
    onDayBoundaryChange,
    ...render(
      <DayBoundarySection
        dayBoundary={props.dayBoundary ?? "04:00"}
        onDayBoundaryChange={onDayBoundaryChange}
      />,
    ),
  };
}

function getHoursInput(): HTMLInputElement {
  return screen.getByTestId("day-boundary-hours-input") as HTMLInputElement;
}

function getMinutesInput(): HTMLInputElement {
  return screen.getByTestId("day-boundary-minutes-input") as HTMLInputElement;
}

describe("DayBoundarySection", () => {
  it("should render the section container", () => {
    renderSection();
    expect(screen.getByTestId("settings-day-boundary")).toBeInTheDocument();
  });

  it("should render label with i18n key", () => {
    renderSection();
    expect(screen.getByText("settings.dayBoundary")).toBeInTheDocument();
  });

  it("should render description with i18n key", () => {
    renderSection();
    expect(
      screen.getByText("settings.dayBoundaryDescription"),
    ).toBeInTheDocument();
  });

  it("should show current hours and minutes in separate inputs", () => {
    renderSection({ dayBoundary: "05:30" });
    expect(getHoursInput().value).toBe("05");
    expect(getMinutesInput().value).toBe("30");
  });

  it("should commit valid time on hours blur", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "06" } });
    fireEvent.blur(hoursInput);

    expect(onDayBoundaryChange).toHaveBeenCalledWith("06:00");
  });

  it("should commit valid time on minutes blur", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const minutesInput = getMinutesInput();
    fireEvent.change(minutesInput, { target: { value: "30" } });
    fireEvent.blur(minutesInput);

    expect(onDayBoundaryChange).toHaveBeenCalledWith("04:30");
  });

  it("should auto-commit when two valid minute digits are entered", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const minutesInput = getMinutesInput();
    fireEvent.change(minutesInput, { target: { value: "15" } });

    expect(onDayBoundaryChange).toHaveBeenCalledWith("04:15");
  });

  it("should auto-focus minutes after entering two valid hour digits", () => {
    renderSection();

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "05" } });

    expect(document.activeElement).toBe(getMinutesInput());
  });

  it("should not auto-focus minutes when hours value is invalid", () => {
    renderSection();

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "25" } });

    expect(document.activeElement).not.toBe(getMinutesInput());
  });

  it("should pad single digit with leading zero on blur", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "5" } });
    fireEvent.blur(hoursInput);

    expect(onDayBoundaryChange).toHaveBeenCalledWith("05:00");
  });

  it("should revert to current value on blur with invalid input", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "25" } });
    fireEvent.blur(hoursInput);

    expect(onDayBoundaryChange).not.toHaveBeenCalled();
    expect(getHoursInput().value).toBe("04");
  });

  it("should strip non-digit characters from input", () => {
    renderSection();

    const hoursInput = getHoursInput();
    fireEvent.change(hoursInput, { target: { value: "a3b" } });

    expect(hoursInput.value).toBe("3");
  });

  it("should commit on Enter key", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const minutesInput = getMinutesInput();
    fireEvent.change(minutesInput, { target: { value: "45" } });
    // Reset mock since auto-commit already fired
    onDayBoundaryChange.mockClear();

    fireEvent.change(minutesInput, { target: { value: "3" } });
    fireEvent.keyDown(minutesInput, { key: "Enter" });

    expect(onDayBoundaryChange).toHaveBeenCalledWith("04:03");
  });

  it("should not call onDayBoundaryChange when value hasn't changed", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ dayBoundary: "04:00", onDayBoundaryChange });

    const hoursInput = getHoursInput();
    fireEvent.blur(hoursInput);

    expect(onDayBoundaryChange).not.toHaveBeenCalled();
  });

  it("should have accessible labels on both inputs", () => {
    renderSection();
    expect(
      screen.getByLabelText("settings.dayBoundaryHours"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("settings.dayBoundaryMinutes"),
    ).toBeInTheDocument();
  });

  it("should have aria-describedby linking inputs to description", () => {
    renderSection();
    const hoursInput = getHoursInput();
    const minutesInput = getMinutesInput();
    const descriptionId = "day-boundary-description";

    expect(hoursInput).toHaveAttribute("aria-describedby", descriptionId);
    expect(minutesInput).toHaveAttribute("aria-describedby", descriptionId);

    const description = document.getElementById(descriptionId);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent("settings.dayBoundaryDescription");
  });

  it("should have htmlFor on label pointing to hours input", () => {
    renderSection();
    const label = screen.getByText("settings.dayBoundary");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "day-boundary-hours");
  });
});
