import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSection } from "./WorkspaceSection";

// implements FR3 of settings-page-reordering

const {
  mockSetPanelSide,
  mockSetPanelAlwaysOpen,
  mockSetDetailPanelPinned,
  mockSetHandedness,
  mockSetFilterBarPosition,
} = vi.hoisted(() => ({
  mockSetPanelSide: vi.fn(),
  mockSetPanelAlwaysOpen: vi.fn(),
  mockSetDetailPanelPinned: vi.fn(),
  mockSetHandedness: vi.fn(),
  mockSetFilterBarPosition: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/usePanelSide", () => ({
  usePanelSide: () => ({ panelSide: "right", setPanelSide: mockSetPanelSide }),
}));

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: () => ({
    isPanelAlwaysOpen: false,
    setPanelAlwaysOpen: mockSetPanelAlwaysOpen,
  }),
}));

vi.mock("@/hooks/useDetailPanelPinned", () => ({
  useDetailPanelPinned: () => ({
    isDetailPanelPinned: false,
    setDetailPanelPinned: mockSetDetailPanelPinned,
  }),
}));

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => ({
    handedness: "right",
    setHandedness: mockSetHandedness,
  }),
}));

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => ({
    filterBarPosition: "bottom",
    setFilterBarPosition: mockSetFilterBarPosition,
  }),
}));

vi.mock("@/components/settings/MenuOrderSection", () => ({
  MenuOrderSection: () => (
    <section data-testid="settings-menu-order">MenuOrderSection</section>
  ),
}));

function renderSection() {
  return render(<WorkspaceSection />);
}

describe("WorkspaceSection — i18n headings", () => {
  it.each([
    ["settings.panelSide"],
    ["settings.panelAlwaysOpen"],
    ["settings.detailPanelPinned"],
    ["settings.handedness"],
    ["settings.filterBarPosition"],
    ["settings.handednessRight"],
    ["settings.handednessLeft"],
    ["settings.filterBarBottom"],
    ["settings.filterBarTop"],
  ])("should render i18n key %s", (key) => {
    renderSection();
    expect(screen.getByText(key)).toBeInTheDocument();
  });
});

describe("WorkspaceSection — panel side aria attributes", () => {
  it("should set aria-label=settings.panelLeft on left button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-left"),
    ).toHaveAttribute("aria-label", "settings.panelLeft");
  });

  it("should set aria-label=settings.panelRight on right button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-right"),
    ).toHaveAttribute("aria-label", "settings.panelRight");
  });

  it("should set aria-pressed=true on selected side (right)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-right"),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should set aria-pressed=false on non-selected side (left)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-left"),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("WorkspaceSection — panel side click handlers", () => {
  it("should call setPanelSide with 'left' when left option is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-panel-side-option-left"));
    expect(mockSetPanelSide).toHaveBeenCalledWith("left");
  });

  it("should call setPanelSide with 'right' when right option is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-panel-side-option-right"));
    expect(mockSetPanelSide).toHaveBeenCalledWith("right");
  });
});

describe("WorkspaceSection — panel always open toggle", () => {
  it("should render toggle with aria-checked=false when off", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-always-open-toggle"),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("should call setPanelAlwaysOpen with true (negated false) when clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-panel-always-open-toggle"));
    expect(mockSetPanelAlwaysOpen).toHaveBeenCalledWith(true);
    expect(mockSetPanelAlwaysOpen).not.toHaveBeenCalledWith(false);
  });
});

describe("WorkspaceSection — detail panel pinned toggle", () => {
  it("should render toggle with aria-checked=false when off", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-detail-panel-pinned-toggle"),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("should call setDetailPanelPinned with true (negated false) when clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-detail-panel-pinned-toggle"));
    expect(mockSetDetailPanelPinned).toHaveBeenCalledWith(true);
    expect(mockSetDetailPanelPinned).not.toHaveBeenCalledWith(false);
  });
});

describe("WorkspaceSection — handedness buttons", () => {
  it("should set aria-pressed=true on selected handedness (right)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right"),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should set aria-pressed=false on non-selected handedness (left)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-left"),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("should call setHandedness with 'right' when right is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-handedness-option-right"));
    expect(mockSetHandedness).toHaveBeenCalledWith("right");
  });

  it("should call setHandedness with 'left' when left is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-handedness-option-left"));
    expect(mockSetHandedness).toHaveBeenCalledWith("left");
  });
});

describe("WorkspaceSection — filter bar position buttons", () => {
  it("should set aria-pressed=true on selected position (bottom)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom"),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should set aria-pressed=false on non-selected position (top)", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-top"),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("should call setFilterBarPosition with 'bottom' when bottom is clicked", () => {
    renderSection();
    fireEvent.click(
      screen.getByTestId("settings-filter-bar-position-option-bottom"),
    );
    expect(mockSetFilterBarPosition).toHaveBeenCalledWith("bottom");
  });

  it("should call setFilterBarPosition with 'top' when top is clicked", () => {
    renderSection();
    fireEvent.click(
      screen.getByTestId("settings-filter-bar-position-option-top"),
    );
    expect(mockSetFilterBarPosition).toHaveBeenCalledWith("top");
  });
});

describe("WorkspaceSection — CSS classes for selected/unselected", () => {
  it("should apply text-accent to selected panel side button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-right").className,
    ).toContain("text-accent");
  });

  it("should apply text-gray-400 to unselected panel side button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-left").className,
    ).toContain("text-gray-400");
  });

  it("should apply bg-accent to selected handedness button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right").className,
    ).toContain("bg-accent");
  });

  it("should apply bg-white to unselected handedness button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-left").className,
    ).toContain("bg-white");
  });

  it("should apply bg-accent to selected filter bar position button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom")
        .className,
    ).toContain("bg-accent");
  });

  it("should apply bg-white to unselected filter bar position button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-top").className,
    ).toContain("bg-white");
  });

  it("should apply bg-gray-200 class to panel-always-open toggle when off", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-panel-always-open-toggle");
    const track = toggle.querySelector("span");
    expect(track?.className).toContain("bg-gray-200");
  });

  it("should apply translate-x-0 to toggle knob when off", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-panel-always-open-toggle");
    const knob = toggle.querySelector("span span");
    expect(knob?.className).toContain("translate-x-0");
  });
});

describe("WorkspaceSection — handedness labels match option", () => {
  it("should show handednessRight label for right option", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right"),
    ).toHaveTextContent("settings.handednessRight");
  });

  it("should show handednessLeft label for left option", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-left"),
    ).toHaveTextContent("settings.handednessLeft");
  });
});

describe("WorkspaceSection — filter bar labels match position", () => {
  it("should show filterBarBottom label for bottom option", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom"),
    ).toHaveTextContent("settings.filterBarBottom");
  });

  it("should show filterBarTop label for top option", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-top"),
    ).toHaveTextContent("settings.filterBarTop");
  });
});

describe("WorkspaceSection — toggle track and knob CSS detail-panel", () => {
  it("should apply bg-gray-200 class to detail-panel-pinned toggle track when off", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-detail-panel-pinned-toggle");
    const track = toggle.querySelector("span");
    expect(track?.className).toContain("bg-gray-200");
  });

  it("should apply translate-x-0 to detail-panel-pinned toggle knob when off", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-detail-panel-pinned-toggle");
    const knob = toggle.querySelector("span span");
    expect(knob?.className).toContain("translate-x-0");
  });
});

describe("WorkspaceSection — icon rendering", () => {
  it("should render icon inside panel side buttons", () => {
    renderSection();
    const leftButton = screen.getByTestId("settings-panel-side-option-left");
    expect(leftButton.querySelector("svg")).toBeInTheDocument();
    const rightButton = screen.getByTestId("settings-panel-side-option-right");
    expect(rightButton.querySelector("svg")).toBeInTheDocument();
  });
});

describe("WorkspaceSection — base CSS classes", () => {
  it("should apply rounded-full to panel side buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-right").className,
    ).toContain("rounded-full");
  });

  it("should apply rounded-full to toggle tracks", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-panel-always-open-toggle");
    expect(toggle.querySelector("span")?.className).toContain("rounded-full");
  });

  it("should apply rounded-full to toggle knobs", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-panel-always-open-toggle");
    expect(toggle.querySelector("span span")?.className).toContain(
      "rounded-full",
    );
  });

  it("should apply rounded-lg to handedness buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right").className,
    ).toContain("rounded-lg");
  });

  it("should apply rounded-lg to filter bar position buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom")
        .className,
    ).toContain("rounded-lg");
  });
});

describe("WorkspaceSection — sections order", () => {
  it("should render all sections in correct DOM order", () => {
    const { container } = renderSection();
    const ids = [
      "settings-panel-side",
      "settings-panel-always-open",
      "settings-detail-panel-pinned",
      "settings-handedness",
      "settings-filter-bar-position",
      "settings-menu-order",
    ];
    const elements = ids.map(
      (id) => container.querySelector(`[data-testid="${id}"]`)!,
    );
    for (let i = 0; i < elements.length - 1; i++) {
      const position = elements[i].compareDocumentPosition(elements[i + 1]);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
