import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuOrderSection } from "./MenuOrderSection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (key === "settings.menuOrder") return "Menu Order";
      if (key === "settings.menuOrderHint") return "Drag to reorder";
      if (key === "settings.menuOrderDragHandle")
        return `Drag ${params?.label}`;
      if (key === "settings.menuOrderToggle") return `Toggle ${params?.label}`;
      if (key === "filter.inbox") return "Inbox";
      if (key === "filter.contexts") return "Contexts";
      if (key === "filter.categories") return "Categories";
      if (key === "filter.goals") return "Goals";
      if (key === "filter.focused_goals") return "Focused Goals";
      if (key === "filter.ideas") return "Ideas";
      if (key === "filter.tasks") return "Tasks";
      if (key === "filter.completed") return "Completed";
      if (key === "filter.deleted") return "Deleted";
      return key;
    },
  }),
}));

const mockSetMenuOrder = vi.fn();

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({
    menuOrder: [
      { mode: "inbox", visible: true },
      { mode: "contexts", visible: true },
      { mode: "categories", visible: true },
      { mode: "goals", visible: true },
      { mode: "focused_goals", visible: true },
      { mode: "ideas", visible: true },
      { mode: "tasks", visible: true },
      { mode: "completed", visible: true },
      { mode: "deleted", visible: false },
    ],
    setMenuOrder: mockSetMenuOrder,
  }),
}));

vi.mock("@/hooks/useDndSensors", () => ({
  useDndSensors: vi.fn(() => []),
}));

describe("MenuOrderSection", () => {
  it("should render focused_goals item with correct label and icon", () => {
    render(<MenuOrderSection />);

    expect(screen.getByText("Focused Goals")).toBeInTheDocument();
  });

  it("should render focused_goals as visible by default", () => {
    render(<MenuOrderSection />);

    const focusedGoalsRow = screen
      .getByText("Focused Goals")
      .closest("div") as HTMLElement;
    const toggle = focusedGoalsRow.querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;

    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("should allow toggling focused_goals visibility", async () => {
    const user = userEvent.setup();

    render(<MenuOrderSection />);

    const focusedGoalsRow = screen
      .getByText("Focused Goals")
      .closest("div") as HTMLElement;
    const toggle = focusedGoalsRow.querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;

    await user.click(toggle);

    expect(mockSetMenuOrder).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should render all menu items including focused_goals", () => {
    render(<MenuOrderSection />);

    // Verify that focused_goals is rendered among other items
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Focused Goals")).toBeInTheDocument();

    // Count total rendered items (should be 9 based on mock)
    const menuItems = screen.getAllByRole("switch");
    expect(menuItems).toHaveLength(9);
  });

  it("should render focused_goals with correct aria-label for toggle", () => {
    render(<MenuOrderSection />);

    const focusedGoalsRow = screen
      .getByText("Focused Goals")
      .closest("div") as HTMLElement;
    const toggle = focusedGoalsRow.querySelector(
      'button[role="switch"]',
    ) as HTMLButtonElement;

    expect(toggle).toHaveAttribute("aria-label", "Toggle Focused Goals");
  });

  it("should render focused_goals with correct aria-label for drag handle", () => {
    render(<MenuOrderSection />);

    const focusedGoalsRow = screen
      .getByText("Focused Goals")
      .closest("div") as HTMLElement;
    const dragHandle = focusedGoalsRow.querySelector(
      'button[aria-label*="Drag"]',
    ) as HTMLButtonElement;

    expect(dragHandle).toHaveAttribute("aria-label", "Drag Focused Goals");
  });
});
