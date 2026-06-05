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

  it("should show current dayBoundary value in the input", () => {
    renderSection({ dayBoundary: "05:30" });
    const input = screen.getByTestId(
      "settings-day-boundary-input",
    ) as HTMLInputElement;
    expect(input.value).toBe("05:30");
  });

  it("should call onDayBoundaryChange with valid value", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ onDayBoundaryChange });

    const input = screen.getByTestId("settings-day-boundary-input");
    fireEvent.change(input, { target: { value: "06:00" } });

    expect(onDayBoundaryChange).toHaveBeenCalledWith("06:00");
  });

  it("should not call onDayBoundaryChange with invalid value", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ onDayBoundaryChange });

    const input = screen.getByTestId("settings-day-boundary-input");
    fireEvent.change(input, { target: { value: "25:00" } });

    expect(onDayBoundaryChange).not.toHaveBeenCalled();
  });

  it("should not call onDayBoundaryChange with empty value", () => {
    const onDayBoundaryChange = vi.fn();
    renderSection({ onDayBoundaryChange });

    const input = screen.getByTestId("settings-day-boundary-input");
    fireEvent.change(input, { target: { value: "" } });

    expect(onDayBoundaryChange).not.toHaveBeenCalled();
  });

  it("should have accessible label linked to input via htmlFor/id", () => {
    renderSection();
    const input = screen.getByTestId(
      "settings-day-boundary-input",
    ) as HTMLInputElement;
    const label = screen.getByText("settings.dayBoundary");

    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("should have aria-describedby linking input to description", () => {
    renderSection();
    const input = screen.getByTestId("settings-day-boundary-input");
    const descriptionId = input.getAttribute("aria-describedby");

    expect(descriptionId).toBeTruthy();
    const description = document.getElementById(descriptionId!);
    expect(description).toBeInTheDocument();
    expect(description).toHaveTextContent("settings.dayBoundaryDescription");
  });
});
