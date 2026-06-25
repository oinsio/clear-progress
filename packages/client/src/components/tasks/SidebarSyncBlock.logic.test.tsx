// implements FR6 of add-sidebar-specs
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES, SETTINGS_SECTION_IDS } from "@/constants";
import type { PanelSide } from "@/types/common";

interface SidebarSyncBlockProps {
  isExpanded: boolean;
  side: PanelSide;
  onToggle?: () => void;
}

const mockNavigate = vi.fn();
const { mockUseConnectionStatus, mockUseAuth, mockUseSync } = vi.hoisted(
  () => ({
    mockUseConnectionStatus: vi.fn(),
    mockUseAuth: vi.fn(),
    mockUseSync: vi.fn(),
  }),
);

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));
vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: mockUseSync,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const { SidebarSyncBlock } = await import("./SidebarSyncBlock");

function renderSyncBlock(props: Partial<SidebarSyncBlockProps> = {}) {
  return render(
    <MemoryRouter>
      <SidebarSyncBlock isExpanded={true} side="right" {...props} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseConnectionStatus.mockReturnValue("synced");
  mockUseAuth.mockReturnValue({ userPicture: null, signIn: vi.fn() });
  mockUseSync.mockReturnValue({ pull: vi.fn() });
  mockNavigate.mockClear();
});

describe("SidebarSyncBlock logic — collapsed conditional rendering", () => {
  it.each([
    ["unauthorized", "sidebar-sign-in"],
    ["no_auth", "sidebar-sign-in"],
    ["synced", "sidebar-sync"],
    ["syncing", "sidebar-sync"],
    ["not_configured", "sidebar-account"],
  ])("should show correct button when collapsed and %s", (status, expectedTestId) => {
    mockUseConnectionStatus.mockReturnValue(status);
    renderSyncBlock({ isExpanded: false });
    expect(screen.getByTestId(expectedTestId)).toBeTruthy();
  });

  it.each([
    ["unauthorized", ["sidebar-sync", "sidebar-account"]],
    ["not_configured", ["sidebar-sync", "sidebar-sign-in"]],
  ])("should not show other buttons when collapsed and %s", (status, absentTestIds) => {
    mockUseConnectionStatus.mockReturnValue(status);
    renderSyncBlock({ isExpanded: false });
    for (const testId of absentTestIds) {
      expect(screen.queryByTestId(testId)).toBeNull();
    }
  });
});

describe("SidebarSyncBlock logic — expanded conditional rendering", () => {
  it.each([
    ["unauthorized", "sidebar-sign-in", "auth.signInButton"],
    ["synced", "sidebar-sync", "sync.synced"],
    ["not_configured", "sidebar-login", undefined],
  ])("should show correct button when expanded and %s", (status, expectedTestId, expectedText) => {
    mockUseConnectionStatus.mockReturnValue(status);
    renderSyncBlock({ isExpanded: true });
    const button = screen.getByTestId(expectedTestId);
    expect(button).toBeTruthy();
    if (expectedText) {
      expect(button.textContent).toContain(expectedText);
    }
  });

  it("should not show sync or sign-in button when expanded and not_configured", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderSyncBlock({ isExpanded: true });
    expect(screen.queryByTestId("sidebar-sync")).toBeNull();
    expect(screen.queryByTestId("sidebar-sign-in")).toBeNull();
  });
});

describe("SidebarSyncBlock logic — syncLabel text", () => {
  it.each([
    ["syncing", "sync.syncing"],
    ["offline", "sync.noConnection"],
    ["error", "sync.serverError"],
    ["synced", "sync.synced"],
  ])("should display %s label on sync button", (status, expectedLabel) => {
    mockUseConnectionStatus.mockReturnValue(status);
    renderSyncBlock({ isExpanded: true });
    const syncButton = screen.getByTestId("sidebar-sync");
    expect(syncButton.textContent).toContain(expectedLabel);
  });
});

describe("SidebarSyncBlock logic — handler behavior", () => {
  it.each([
    false,
    true,
  ])("should call signIn when clicking sign-in button (isExpanded=%s)", async (isExpanded) => {
    const mockSignIn = vi.fn();
    mockUseConnectionStatus.mockReturnValue("unauthorized");
    mockUseAuth.mockReturnValue({ userPicture: null, signIn: mockSignIn });
    renderSyncBlock({ isExpanded });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("sidebar-sign-in"));
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it.each([
    false,
    true,
  ])("should call pull when clicking sync button (isExpanded=%s)", async (isExpanded) => {
    const mockPull = vi.fn();
    mockUseConnectionStatus.mockReturnValue("synced");
    mockUseSync.mockReturnValue({ pull: mockPull });
    renderSyncBlock({ isExpanded });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("sidebar-sync"));
    expect(mockPull).toHaveBeenCalledOnce();
  });

  it("should navigate to settings when clicking account button in collapsed mode", async () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderSyncBlock({ isExpanded: false });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("sidebar-account"));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SETTINGS);
  });

  it("should navigate to settings when clicking login button in expanded mode", async () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderSyncBlock({ isExpanded: true });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("sidebar-login"));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SETTINGS, {
      state: { expandSection: SETTINGS_SECTION_IDS.ACCOUNT_SYNC },
    });
  });

  it("should call onToggle when clicking the toggle button", async () => {
    const mockOnToggle = vi.fn();
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true, onToggle: mockOnToggle });

    const user = userEvent.setup();
    await user.click(screen.getByTestId("sidebar-toggle-button"));
    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it("should not render toggle button when onToggle is not provided", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: true });
    expect(screen.queryByTestId("sidebar-toggle-button")).toBeNull();
  });

  it("should not render toggle button when collapsed", () => {
    const mockOnToggle = vi.fn();
    mockUseConnectionStatus.mockReturnValue("synced");
    renderSyncBlock({ isExpanded: false, onToggle: mockOnToggle });
    expect(screen.queryByTestId("sidebar-toggle-button")).toBeNull();
  });
});

describe("SidebarSyncBlock logic — aria-labels and button text", () => {
  it.each([
    [false, "unauthorized", "sidebar-sign-in", "auth.signInButton"],
    [false, "synced", "sidebar-sync", "sync.ariaLabel"],
    [false, "not_configured", "sidebar-account", "settings.settingsAriaLabel"],
    [true, "unauthorized", "sidebar-sign-in", "auth.signInButton"],
    [true, "synced", "sidebar-account", "settings.settingsAriaLabel"],
    [true, "synced", "sidebar-sync", "sync.ariaLabel"],
    [true, "not_configured", "sidebar-login", "settings.loginAriaLabel"],
  ])("should have aria-label on button (isExpanded=%s, status=%s, testId=%s)", (isExpanded, status, testId, expectedAriaLabel) => {
    mockUseConnectionStatus.mockReturnValue(status);
    renderSyncBlock({ isExpanded: isExpanded as boolean });
    const button = screen.getByTestId(testId as string);
    expect(button.getAttribute("aria-label")).toBe(expectedAriaLabel);
  });

  it("should have non-empty alt on avatar img when userPicture is provided", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    mockUseAuth.mockReturnValue({
      userPicture: "https://example.com/avatar.png",
      signIn: vi.fn(),
    });
    renderSyncBlock({ isExpanded: true });
    const avatarImg = screen.getByRole("img");
    expect(avatarImg.getAttribute("alt")).toBe("settings.avatarAlt");
  });

  it("should have non-empty text on expanded login button", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderSyncBlock({ isExpanded: true });
    const loginButton = screen.getByTestId("sidebar-login");
    expect(loginButton.textContent).toBe("settings.login");
  });
});

describe("SidebarSyncBlock logic — isLeft layout", () => {
  it.each([
    ["left", "sidebar-account", "sidebar-sync"],
    ["right", "sidebar-sync", "sidebar-account"],
  ] as const)("should render buttons in correct order when side is %s", (side, firstButtonTestId, secondButtonTestId) => {
    mockUseConnectionStatus.mockReturnValue("synced");
    const { container } = renderSyncBlock({ isExpanded: true, side });
    const wrapper = container.firstElementChild;
    const buttons = wrapper?.querySelectorAll("button");
    expect(buttons?.[0]?.dataset.testid).toBe(firstButtonTestId);
    expect(buttons?.[1]?.dataset.testid).toBe(secondButtonTestId);
  });
});
