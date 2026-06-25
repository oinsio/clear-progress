import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceSection } from "./WorkspaceSection";

// implements FR3 of settings-page-reordering

const {
  mockSetPanelSide,
  mockSetDetailPanelPinned,
  mockSetHandedness,
  mockSetFilterBarPosition,
} = vi.hoisted(() => ({
  mockSetPanelSide: vi.fn(),
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

describe("WorkspaceSection — detail panel pinned toggle", () => {
  it("should render toggle with aria-pressed=false when off", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-detail-panel-pinned-toggle"),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("should set aria-label to pinDetailPanel when unpinned", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-detail-panel-pinned-toggle"),
    ).toHaveAttribute("aria-label", "settings.pinDetailPanel");
  });

  it("should render Pin icon with rotate-45 class when unpinned", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-detail-panel-pinned-toggle");
    const icon = toggle.querySelector("svg");
    expect(icon?.getAttribute("class")).toContain("rotate-45");
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
      screen.getByTestId("settings-panel-side-option-right").classList,
    ).toContain("text-accent");
  });

  it("should apply text-gray-400 to unselected panel side button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-panel-side-option-left").classList,
    ).toContain("text-gray-400");
  });

  it("should apply bg-accent to selected handedness button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right").classList,
    ).toContain("bg-accent");
  });

  it("should apply bg-white to unselected handedness button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-left").classList,
    ).toContain("bg-white");
  });

  it("should apply bg-accent to selected filter bar position button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom")
        .classList,
    ).toContain("bg-accent");
  });

  it("should apply bg-white to unselected filter bar position button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-top").classList,
    ).toContain("bg-white");
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

describe("WorkspaceSection — pin icon CSS detail-panel", () => {
  it("should apply text-gray-400 to pin button when unpinned", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-detail-panel-pinned-toggle").classList,
    ).toContain("text-gray-400");
  });

  it("should render svg icon inside pin button", () => {
    renderSection();
    const toggle = screen.getByTestId("settings-detail-panel-pinned-toggle");
    expect(toggle.querySelector("svg")).toBeInTheDocument();
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
      screen.getByTestId("settings-panel-side-option-right").classList,
    ).toContain("rounded-full");
  });

  it("should apply rounded-full to pin button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-detail-panel-pinned-toggle").classList,
    ).toContain("rounded-full");
  });

  it("should apply rounded-lg to handedness buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-handedness-option-right").classList,
    ).toContain("rounded-lg");
  });

  it("should apply rounded-lg to filter bar position buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-filter-bar-position-option-bottom")
        .classList,
    ).toContain("rounded-lg");
  });
});

describe("WorkspaceSection — sections order", () => {
  it("should render all sections in correct DOM order", () => {
    const { container } = renderSection();
    const ids = [
      "settings-panel-side",
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
