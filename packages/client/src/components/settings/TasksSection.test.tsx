// implements FR4 of settings-page-reordering
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TasksSection } from "./TasksSection";

const {
  mockSetDefaultBox,
  mockSetDayBoundary,
  mockSetFocusMode,
  mockSetFocusOpacity,
  mockUseFocusMode,
} = vi.hoisted(() => ({
  mockSetDefaultBox: vi.fn(),
  mockSetDayBoundary: vi.fn(),
  mockSetFocusMode: vi.fn(),
  mockSetFocusOpacity: vi.fn(),
  mockUseFocusMode: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    defaultBox: "inbox",
    setDefaultBox: mockSetDefaultBox,
    dayBoundary: "04:00",
    setDayBoundary: mockSetDayBoundary,
  }),
}));

vi.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: mockUseFocusMode,
}));

vi.mock("@/components/settings/SyncIndicator", () => ({
  SyncIndicator: ({ settingKey }: { settingKey: string }) => (
    <span data-testid={`sync-indicator-${settingKey}`}>sync</span>
  ),
}));

let capturedOnDayBoundaryChange: ((value: string) => void) | undefined;
vi.mock("@/components/settings/DayBoundarySection", () => ({
  DayBoundarySection: (props: {
    onDayBoundaryChange: (value: string) => void;
    syncIndicator?: React.ReactNode;
  }) => {
    capturedOnDayBoundaryChange = props.onDayBoundaryChange;
    return (
      <section data-testid="settings-day-boundary">
        DayBoundary
        {props.syncIndicator}
      </section>
    );
  },
}));

vi.mock("@/components/ui/OpacityBars", () => ({
  OpacityBars: () => <div data-testid="opacity-bars">OpacityBars</div>,
}));

function setupFocusMock(isFocusMode = false) {
  mockUseFocusMode.mockReturnValue({
    isFocusMode,
    setFocusMode: mockSetFocusMode,
    focusOpacity: 0.3,
    setFocusOpacity: mockSetFocusOpacity,
  });
}

function renderSection() {
  return render(<TasksSection />);
}

afterEach(() => {
  vi.clearAllMocks();
  capturedOnDayBoundaryChange = undefined;
});

describe("TasksSection — sections presence and order", () => {
  it("should render all three sections in correct order", () => {
    setupFocusMock();
    const { container } = renderSection();
    const ids = [
      "settings-default-box",
      "settings-day-boundary",
      "settings-focus-mode",
    ];
    const elements = ids.map(
      (id) => container.querySelector(`[data-testid="${id}"]`)!,
    );
    for (let i = 0; i < elements.length - 1; i++) {
      expect(
        elements[i].compareDocumentPosition(elements[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});

describe("TasksSection — default box buttons", () => {
  const boxes = ["inbox", "today", "week", "later"];

  it.each(boxes)("should render button for box %s", (box) => {
    setupFocusMock();
    renderSection();
    expect(
      screen.getByTestId(`settings-box-option-${box}`),
    ).toBeInTheDocument();
  });

  it("should set aria-pressed=true on selected box (inbox)", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId("settings-box-option-inbox")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it.each([
    "today",
    "week",
    "later",
  ])("should set aria-pressed=false on unselected box %s", (box) => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId(`settings-box-option-${box}`)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it.each(boxes)("should set aria-label to t(box.%s)", (box) => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId(`settings-box-option-${box}`)).toHaveAttribute(
      "aria-label",
      `box.${box}`,
    );
  });

  it.each(boxes)("should call setDefaultBox with '%s' when clicked", (box) => {
    setupFocusMock();
    renderSection();
    fireEvent.click(screen.getByTestId(`settings-box-option-${box}`));
    expect(mockSetDefaultBox).toHaveBeenCalledWith(box);
  });

  it("should apply text-accent class to selected box", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId("settings-box-option-inbox").className).toContain(
      "text-accent",
    );
  });

  it("should apply text-gray-400 class to unselected box", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId("settings-box-option-today").className).toContain(
      "text-gray-400",
    );
  });

  it("should apply rounded-full class to box buttons", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByTestId("settings-box-option-inbox").className).toContain(
      "rounded-full",
    );
  });

  it("should render svg icon inside box buttons", () => {
    setupFocusMock();
    renderSection();
    expect(
      screen.getByTestId("settings-box-option-inbox").querySelector("svg"),
    ).toBeInTheDocument();
  });
});

describe("TasksSection — i18n keys", () => {
  it("should render heading with key settings.defaultBox", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByText("settings.defaultBox")).toBeInTheDocument();
  });

  it("should render focus mode label with key settings.focusMode", () => {
    setupFocusMock();
    renderSection();
    expect(screen.getByText("settings.focusMode")).toBeInTheDocument();
  });
});

describe("TasksSection — sync indicators", () => {
  it("should render SyncIndicator for default_box", () => {
    setupFocusMock();
    renderSection();
    expect(
      screen.getByTestId("sync-indicator-default_box"),
    ).toBeInTheDocument();
  });

  it("should render SyncIndicator for day_boundary via DayBoundarySection", () => {
    setupFocusMock();
    renderSection();
    expect(
      screen.getByTestId("sync-indicator-day_boundary"),
    ).toBeInTheDocument();
  });
});

describe("TasksSection — DayBoundarySection callback", () => {
  it("should pass onDayBoundaryChange that calls setDayBoundary", () => {
    setupFocusMock();
    renderSection();
    capturedOnDayBoundaryChange?.("06:00");
    expect(mockSetDayBoundary).toHaveBeenCalledWith("06:00");
  });
});

describe("TasksSection — focus mode toggle off", () => {
  it("should render toggle with aria-checked=false when off", () => {
    setupFocusMock(false);
    renderSection();
    expect(screen.getByTestId("settings-focus-mode-toggle")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("should call setFocusMode with true when toggled from off", () => {
    setupFocusMock(false);
    renderSection();
    fireEvent.click(screen.getByTestId("settings-focus-mode-toggle"));
    expect(mockSetFocusMode).toHaveBeenCalledWith(true);
  });

  it("should not show opacity bars when focus mode is off", () => {
    setupFocusMock(false);
    renderSection();
    expect(
      screen.queryByTestId("settings-focus-opacity"),
    ).not.toBeInTheDocument();
  });

  it("should apply bg-gray-200 class to toggle track when off", () => {
    setupFocusMock(false);
    renderSection();
    const toggle = screen.getByTestId("settings-focus-mode-toggle");
    expect(toggle.querySelector("span")?.className).toContain("bg-gray-200");
  });

  it("should apply translate-x-0 to toggle knob when off", () => {
    setupFocusMock(false);
    renderSection();
    const toggle = screen.getByTestId("settings-focus-mode-toggle");
    expect(toggle.querySelector("span span")?.className).toContain(
      "translate-x-0",
    );
  });
});

describe("TasksSection — focus mode toggle on", () => {
  it("should show opacity bars when focus mode is on", () => {
    setupFocusMock(true);
    renderSection();
    expect(screen.getByTestId("settings-focus-opacity")).toBeInTheDocument();
    expect(screen.getByTestId("opacity-bars")).toBeInTheDocument();
  });

  it("should apply bg-accent class to toggle track when on", () => {
    setupFocusMock(true);
    renderSection();
    const toggle = screen.getByTestId("settings-focus-mode-toggle");
    expect(toggle.querySelector("span")?.className).toContain("bg-accent");
  });

  it("should apply translate-x-5 to toggle knob when on", () => {
    setupFocusMock(true);
    renderSection();
    const toggle = screen.getByTestId("settings-focus-mode-toggle");
    expect(toggle.querySelector("span span")?.className).toContain(
      "translate-x-5",
    );
  });
});
