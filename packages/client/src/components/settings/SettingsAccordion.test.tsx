import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_SECTION_IDS, STORAGE_KEYS } from "@/constants";
import type { SettingsAccordionSection } from "./SettingsAccordion";
import { SettingsAccordion } from "./SettingsAccordion";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const STORAGE_KEY = `${STORAGE_KEYS.SECTION_COLLAPSE}:settings-accordion-expanded`;

const TEST_SECTIONS: SettingsAccordionSection[] = [
  {
    id: SETTINGS_SECTION_IDS.LOOK_AND_FEEL,
    titleKey: "settings.sections.lookAndFeel",
    icon: <span data-testid="icon-look-and-feel">icon1</span>,
    children: <div data-testid="content-look-and-feel">Look content</div>,
  },
  {
    id: SETTINGS_SECTION_IDS.WORKSPACE,
    titleKey: "settings.sections.workspace",
    icon: <span data-testid="icon-workspace">icon2</span>,
    children: <div data-testid="content-workspace">Workspace content</div>,
  },
  {
    id: SETTINGS_SECTION_IDS.TASKS,
    titleKey: "settings.sections.tasks",
    icon: <span data-testid="icon-tasks">icon3</span>,
    children: <div data-testid="content-tasks">Tasks content</div>,
  },
];

function renderAccordion(
  overrides: {
    sections?: SettingsAccordionSection[];
    storageKeyPrefix?: string;
    initialExpandedSection?: string | null;
  } = {},
) {
  return render(
    <SettingsAccordion
      sections={overrides.sections ?? TEST_SECTIONS}
      storageKeyPrefix={overrides.storageKeyPrefix}
      initialExpandedSection={overrides.initialExpandedSection}
    />,
  );
}

afterEach(() => {
  localStorage.clear();
});

// FR11: Single-expand mode
describe("SettingsAccordion single-expand mode", () => {
  it("should render all section headers with translated titles", () => {
    renderAccordion();
    expect(
      screen.getByText("settings.sections.lookAndFeel"),
    ).toBeInTheDocument();
    expect(screen.getByText("settings.sections.workspace")).toBeInTheDocument();
    expect(screen.getByText("settings.sections.tasks")).toBeInTheDocument();
  });

  it("should render icons for all sections", () => {
    renderAccordion();
    expect(screen.getByTestId("icon-look-and-feel")).toBeInTheDocument();
    expect(screen.getByTestId("icon-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("icon-tasks")).toBeInTheDocument();
  });

  it("should have all sections collapsed by default when no persisted state", () => {
    renderAccordion();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should expand clicked section when all are collapsed", () => {
    renderAccordion();
    const workspaceHeader = screen.getByText("settings.sections.workspace");
    fireEvent.click(workspaceHeader);

    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();
  });

  it("should collapse current section and expand clicked section", () => {
    renderAccordion();
    // Open workspace first
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();

    // Click tasks — should switch to tasks
    fireEvent.click(screen.getByText("settings.sections.tasks"));
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.getByTestId("content-tasks")).toBeInTheDocument();
  });

  it("should collapse to all-collapsed when clicking the currently expanded section", () => {
    renderAccordion();
    // Open workspace
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();

    // Click workspace again to collapse it
    fireEvent.click(screen.getByText("settings.sections.workspace"));

    // All should be collapsed
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });
});

// FR12: Default expanded — all collapsed
describe("SettingsAccordion default expanded", () => {
  it("should have all sections collapsed when no localStorage value exists", () => {
    renderAccordion();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should have all sections collapsed when persisted value is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "non-existent-id");
    renderAccordion();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });
});

// FR7: Persistence
describe("SettingsAccordion persistence", () => {
  it("should persist expanded section ID to localStorage", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.workspace"));

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).toBe(SETTINGS_SECTION_IDS.WORKSPACE);
  });

  it("should remove localStorage key when collapsing to all-collapsed", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(
      SETTINGS_SECTION_IDS.WORKSPACE,
    );

    // Click again to collapse
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("should restore expanded section from localStorage on mount", () => {
    localStorage.setItem(STORAGE_KEY, SETTINGS_SECTION_IDS.TASKS);
    renderAccordion();

    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("content-tasks")).toBeInTheDocument();
  });

  it("should use custom storageKeyPrefix when provided", () => {
    const customPrefix = "custom-prefix";
    const customKey = `${STORAGE_KEYS.SECTION_COLLAPSE}:${customPrefix}-expanded`;

    render(
      <SettingsAccordion
        sections={TEST_SECTIONS}
        storageKeyPrefix={customPrefix}
      />,
    );
    fireEvent.click(screen.getByText("settings.sections.workspace"));

    expect(localStorage.getItem(customKey)).toBe(
      SETTINGS_SECTION_IDS.WORKSPACE,
    );
  });
});

// NFR-A1, NFR-A3: ARIA attributes
describe("SettingsAccordion ARIA", () => {
  it("should have role=button on section headers", () => {
    renderAccordion();
    const headers = screen.getAllByRole("button");
    expect(headers.length).toBe(TEST_SECTIONS.length);
  });

  it("should set aria-expanded=false for all sections when all collapsed", () => {
    renderAccordion();
    const headers = screen.getAllByRole("button");
    expect(headers[0]).toHaveAttribute("aria-expanded", "false");
    expect(headers[1]).toHaveAttribute("aria-expanded", "false");
    expect(headers[2]).toHaveAttribute("aria-expanded", "false");
  });

  it("should set aria-expanded=true for expanded section header", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    const headers = screen.getAllByRole("button");
    expect(headers[0]).toHaveAttribute("aria-expanded", "false");
    expect(headers[1]).toHaveAttribute("aria-expanded", "true");
    expect(headers[2]).toHaveAttribute("aria-expanded", "false");
  });

  it("should set aria-controls referencing the panel ID", () => {
    renderAccordion();
    const headers = screen.getAllByRole("button");
    expect(headers[0]).toHaveAttribute(
      "aria-controls",
      `${SETTINGS_SECTION_IDS.LOOK_AND_FEEL}-panel`,
    );
    expect(headers[1]).toHaveAttribute(
      "aria-controls",
      `${SETTINGS_SECTION_IDS.WORKSPACE}-panel`,
    );
  });

  it("should have matching panel ID on the content region", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.lookAndFeel"));
    const panel = document.getElementById(
      `${SETTINGS_SECTION_IDS.LOOK_AND_FEEL}-panel`,
    );
    expect(panel).toBeInTheDocument();
  });

  it("should toggle section with Enter key", () => {
    renderAccordion();
    const workspaceHeader = screen.getAllByRole("button")[1];
    fireEvent.keyDown(workspaceHeader, { key: "Enter" });

    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
  });

  it("should toggle section with Space key", () => {
    renderAccordion();
    const workspaceHeader = screen.getAllByRole("button")[1];
    fireEvent.keyDown(workspaceHeader, { key: " " });

    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
  });

  it("should not toggle section with other keys", () => {
    renderAccordion();
    const workspaceHeader = screen.getAllByRole("button")[1];
    fireEvent.keyDown(workspaceHeader, { key: "Tab" });

    // All sections should remain collapsed
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
  });
});

// UX2: Chevron icons
describe("SettingsAccordion chevron icons", () => {
  it("should show chevron-down for expanded section", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.lookAndFeel"));
    const expandedHeader = screen.getAllByRole("button")[0];
    expect(
      expandedHeader.querySelector("[data-testid='chevron-down']"),
    ).toBeInTheDocument();
  });

  it("should show chevron-right for collapsed sections", () => {
    renderAccordion();
    const collapsedHeader = screen.getAllByRole("button")[0];
    expect(
      collapsedHeader.querySelector("[data-testid='chevron-right']"),
    ).toBeInTheDocument();
  });
});

// Collapsed section content not rendered
describe("SettingsAccordion content visibility", () => {
  it("should not render any section content when all collapsed", () => {
    renderAccordion();
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should render expanded section content in DOM", () => {
    renderAccordion();
    fireEvent.click(screen.getByText("settings.sections.lookAndFeel"));
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
  });
});

// FR13: Deep-link via initialExpandedSection
describe("SettingsAccordion deep-link", () => {
  it("should open specific section when initialExpandedSection is provided", () => {
    renderAccordion({
      initialExpandedSection: SETTINGS_SECTION_IDS.TASKS,
    });
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.getByTestId("content-tasks")).toBeInTheDocument();
  });

  it("should override persisted state when initialExpandedSection is provided", () => {
    localStorage.setItem(STORAGE_KEY, SETTINGS_SECTION_IDS.WORKSPACE);
    renderAccordion({
      initialExpandedSection: SETTINGS_SECTION_IDS.TASKS,
    });
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.getByTestId("content-tasks")).toBeInTheDocument();
  });

  it("should keep all collapsed when initialExpandedSection is null", () => {
    localStorage.setItem(STORAGE_KEY, SETTINGS_SECTION_IDS.WORKSPACE);
    renderAccordion({
      initialExpandedSection: null,
    });
    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should use persisted state when initialExpandedSection is undefined", () => {
    localStorage.setItem(STORAGE_KEY, SETTINGS_SECTION_IDS.WORKSPACE);
    renderAccordion();
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();
  });
});
