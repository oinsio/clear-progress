import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./SettingsPage";

vi.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    effectiveState: "collapsed",
    sidebarMode: "expanded",
    setSidebarMode: vi.fn(),
    isNarrow: true,
    hasHover: false,
  }),
}));
vi.mock("@/hooks/useSidebarNavigation");
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: vi.fn(),
}));
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/components/settings/SettingsAccordion", () => ({
  SettingsAccordion: ({
    sections,
    initialExpandedSection,
  }: {
    sections: { id: string }[];
    initialExpandedSection?: string | null;
  }) => (
    <div
      data-testid="settings-accordion"
      data-initial-expanded={initialExpandedSection ?? ""}
    >
      {sections.map((section) => (
        <div key={section.id} data-testid={`accordion-section-${section.id}`} />
      ))}
    </div>
  ),
}));
vi.mock("@/components/settings/LookAndFeelSection", () => ({
  LookAndFeelSection: () => <div data-testid="look-and-feel-section" />,
}));
vi.mock("@/components/settings/WorkspaceSection", () => ({
  WorkspaceSection: () => <div data-testid="workspace-section" />,
}));
vi.mock("@/components/settings/TasksSection", () => ({
  TasksSection: () => <div data-testid="tasks-section" />,
}));
vi.mock("@/components/settings/AccountSyncSection", () => ({
  AccountSyncSection: () => <div data-testid="account-sync-section" />,
}));
vi.mock("@/components/settings/ShareAppSection", () => ({
  ShareAppSection: () => <div data-testid="share-app-section" />,
}));
vi.mock("@/components/tasks/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));
vi.mock("@/services/supabaseClientManager", () => ({
  isOauthReturn: () => false,
  clearOauthReturnFlag: vi.fn(),
}));

import { useAuth } from "@/app/providers/AuthProvider";
import { SETTINGS_SECTION_IDS } from "@/constants";
import { useConnectionConfig } from "@/hooks/useConnectionConfig";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { localStorageMock } from "@/test/mocks/localStorageMock";

const mockUseAuth = vi.mocked(useAuth);
const mockUseConnectionConfig = vi.mocked(useConnectionConfig);

function renderPage() {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockUseAuth.mockReturnValue({
      accessToken: null,
      authProvider: null,
      userEmail: null,
      userPicture: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      silentRefresh: vi.fn(),
    });
    mockUseConnectionConfig.mockReturnValue(null);
    vi.mocked(useSidebarNavigation).mockReturnValue(vi.fn());
  });

  it("should render the settings page container", () => {
    renderPage();
    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
  });

  it("should render the page title", () => {
    renderPage();
    expect(screen.getByText("settings.name")).toBeInTheDocument();
  });

  it("should render the settings accordion", () => {
    renderPage();
    expect(screen.getByTestId("settings-accordion")).toBeInTheDocument();
  });

  it("should pass four sections to the accordion", () => {
    renderPage();
    expect(
      screen.getByTestId(
        `accordion-section-${SETTINGS_SECTION_IDS.LOOK_AND_FEEL}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`accordion-section-${SETTINGS_SECTION_IDS.WORKSPACE}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`accordion-section-${SETTINGS_SECTION_IDS.TASKS}`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `accordion-section-${SETTINGS_SECTION_IDS.ACCOUNT_SYNC}`,
      ),
    ).toBeInTheDocument();
  });

  it("should render ShareAppSection outside the accordion", () => {
    renderPage();
    expect(screen.getByTestId("share-app-section")).toBeInTheDocument();
  });

  it("should render sync legend", () => {
    renderPage();
    expect(screen.getByText("settings.syncLegend")).toBeInTheDocument();
  });

  it("should render the sidebar", () => {
    renderPage();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });
});
