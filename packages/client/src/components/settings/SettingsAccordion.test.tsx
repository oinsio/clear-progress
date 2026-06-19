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
  } = {},
) {
  return render(
    <SettingsAccordion
      sections={overrides.sections ?? TEST_SECTIONS}
      storageKeyPrefix={overrides.storageKeyPrefix}
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

  it("should expand first section by default when no persisted state", () => {
    renderAccordion();
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should collapse current section and expand clicked section", () => {
    renderAccordion();
    const workspaceHeader = screen.getByText("settings.sections.workspace");
    fireEvent.click(workspaceHeader);

    expect(
      screen.queryByTestId("content-look-and-feel"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();
  });

  it("should fall back to first section when clicking the currently expanded section", () => {
    renderAccordion();
    // First section is expanded by default
    const firstHeader = screen.getByText("settings.sections.lookAndFeel");
    fireEvent.click(firstHeader);

    // Should fall back to first section (which IS the first section, so it stays expanded)
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
  });

  it("should fall back to first section when clicking a non-first expanded section", () => {
    renderAccordion();
    // Open workspace
    fireEvent.click(screen.getByText("settings.sections.workspace"));
    expect(screen.getByTestId("content-workspace")).toBeInTheDocument();

    // Click workspace again to collapse it
    fireEvent.click(screen.getByText("settings.sections.workspace"));

    // Should fall back to first section
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
  });
});

// FR6: Default expanded — first section
describe("SettingsAccordion default expanded", () => {
  it("should expand first section when no localStorage value exists", () => {
    renderAccordion();
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
  });

  it("should expand first section when persisted value is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "non-existent-id");
    renderAccordion();
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
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

  it("should set aria-expanded=true for expanded section header", () => {
    renderAccordion();
    const headers = screen.getAllByRole("button");
    expect(headers[0]).toHaveAttribute("aria-expanded", "true");
    expect(headers[1]).toHaveAttribute("aria-expanded", "false");
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

    // First section should remain expanded
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
  });
});

// UX2: Chevron icons
describe("SettingsAccordion chevron icons", () => {
  it("should show chevron-down for expanded section", () => {
    renderAccordion();
    const expandedHeader = screen.getAllByRole("button")[0];
    expect(
      expandedHeader.querySelector("[data-testid='chevron-down']"),
    ).toBeInTheDocument();
  });

  it("should show chevron-right for collapsed sections", () => {
    renderAccordion();
    const collapsedHeader = screen.getAllByRole("button")[1];
    expect(
      collapsedHeader.querySelector("[data-testid='chevron-right']"),
    ).toBeInTheDocument();
  });
});

// Collapsed section content not rendered
describe("SettingsAccordion content visibility", () => {
  it("should not render collapsed section content in DOM", () => {
    renderAccordion();
    expect(screen.queryByTestId("content-workspace")).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-tasks")).not.toBeInTheDocument();
  });

  it("should render expanded section content in DOM", () => {
    renderAccordion();
    expect(screen.getByTestId("content-look-and-feel")).toBeInTheDocument();
  });
});
