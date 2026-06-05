// implements FR1, FR2, UX3 of hide-tasks
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fakeClock } from "@/lib/temporal";
import { HideTaskPanel } from "./HideTaskPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const TEST_CLOCK = fakeClock("2026-06-05T10:00:00Z");

describe("HideTaskPanel", () => {
  // FR1: Non-hidden task shows date picker and hide button
  it("should render date picker for non-hidden task", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(screen.getByLabelText("task.selectDate")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "task.hide" }),
    ).toBeInTheDocument();
  });

  // UX3: Hide button disabled without valid date
  it("should disable Hide button when no date selected", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(screen.getByRole("button", { name: "task.hide" })).toBeDisabled();
  });

  // FR1: Hide button enabled with valid future date
  it("should enable Hide button when valid future date is selected", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    fireEvent.change(screen.getByLabelText("task.selectDate"), {
      target: { value: "2027-01-01" },
    });
    expect(screen.getByRole("button", { name: "task.hide" })).toBeEnabled();
  });

  // UX3: Hide button stays disabled when date is today
  it("should disable Hide button when selected date is today", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    fireEvent.change(screen.getByLabelText("task.selectDate"), {
      target: { value: "2026-06-05" },
    });
    expect(screen.getByRole("button", { name: "task.hide" })).toBeDisabled();
  });

  // UX3: Hide button enabled when date is tomorrow
  it("should enable Hide button when selected date is tomorrow", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    fireEvent.change(screen.getByLabelText("task.selectDate"), {
      target: { value: "2026-06-06" },
    });
    expect(screen.getByRole("button", { name: "task.hide" })).toBeEnabled();
  });

  // FR1: Clicking Hide calls onHide with selected date
  it("should call onHide with selected date when Hide is clicked", async () => {
    const onHide = vi.fn();
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={onHide}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    fireEvent.change(screen.getByLabelText("task.selectDate"), {
      target: { value: "2027-01-01" },
    });
    await userEvent.click(screen.getByRole("button", { name: "task.hide" }));
    expect(onHide).toHaveBeenCalledWith("2027-01-01");
  });

  // FR1: date picker has min attribute set to tomorrow
  it("should set min attribute to tomorrow on date picker", () => {
    render(
      <HideTaskPanel
        isHidden={false}
        appearDate=""
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(screen.getByLabelText("task.selectDate")).toHaveAttribute(
      "min",
      "2026-06-06",
    );
  });

  // FR2: Hidden task shows unhide button
  it("should render Unhide button for hidden task", () => {
    render(
      <HideTaskPanel
        isHidden={true}
        appearDate="2027-06-01"
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(
      screen.getByRole("button", { name: "task.unhide" }),
    ).toBeInTheDocument();
  });

  // FR2: Hidden task shows appear date
  it("should display appear date for hidden task", () => {
    render(
      <HideTaskPanel
        isHidden={true}
        appearDate="2027-06-01"
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(screen.getByText("2027-06-01")).toBeInTheDocument();
  });

  // FR2: Clicking Unhide calls onUnhide
  it("should call onUnhide when Unhide is clicked", async () => {
    const onUnhide = vi.fn();
    render(
      <HideTaskPanel
        isHidden={true}
        appearDate="2027-06-01"
        onHide={vi.fn()}
        onUnhide={onUnhide}
        clock={TEST_CLOCK}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "task.unhide" }));
    expect(onUnhide).toHaveBeenCalledOnce();
  });

  // FR2: Hidden mode does NOT show date picker
  it("should not render date picker for hidden task", () => {
    render(
      <HideTaskPanel
        isHidden={true}
        appearDate="2027-06-01"
        onHide={vi.fn()}
        onUnhide={vi.fn()}
        clock={TEST_CLOCK}
      />,
    );
    expect(screen.queryByLabelText("task.selectDate")).not.toBeInTheDocument();
  });
});
