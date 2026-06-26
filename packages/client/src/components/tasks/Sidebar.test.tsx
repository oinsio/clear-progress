import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES, SETTINGS_SECTION_IDS } from "@/constants";

const mockNavigate = vi.fn();
const { mockSignIn, mockUseConnectionStatus } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockUseConnectionStatus: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ userPicture: null, signIn: mockSignIn }),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ syncStatus: "idle", pull: vi.fn() }),
}));

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { renderSidebar as renderPanel } from "./Sidebar.test-utils";

describe("Sidebar — connection status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
  });

  it("should show sync button when connectionStatus is synced", () => {
    renderPanel();
    expect(screen.getAllByTestId("sidebar-sync")[0]).toBeInTheDocument();
  });

  it("should show sync button when connectionStatus is syncing", () => {
    mockUseConnectionStatus.mockReturnValue("syncing");
    renderPanel();
    expect(screen.getAllByTestId("sidebar-sync")[0]).toBeInTheDocument();
  });

  // implements FR1 of split-error-offline-status
  it("should display 'No connection' text when connectionStatus is offline", () => {
    mockUseConnectionStatus.mockReturnValue("offline");
    renderPanel();
    expect(screen.getAllByText("Нет связи")[0]).toBeInTheDocument();
  });

  // implements FR2 of split-error-offline-status
  it("should display 'Server error' text when connectionStatus is error", () => {
    mockUseConnectionStatus.mockReturnValue("error");
    renderPanel();
    expect(screen.getAllByText("Ошибка сервера")[0]).toBeInTheDocument();
  });

  it("should show error badge when connectionStatus is offline", () => {
    mockUseConnectionStatus.mockReturnValue("offline");
    renderPanel();
    const syncBtn = screen.getAllByTestId("sidebar-sync")[0];
    expect(syncBtn).toBeInTheDocument();
    expect(syncBtn.querySelector(".bg-red-500")).toBeTruthy();
  });

  it("should show error badge when connectionStatus is error", () => {
    mockUseConnectionStatus.mockReturnValue("error");
    renderPanel();
    const syncBtn = screen.getAllByTestId("sidebar-sync")[0];
    expect(syncBtn.querySelector(".bg-red-500")).toBeTruthy();
  });

  it("should show connect button when connectionStatus is not_configured", () => {
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderPanel();
    expect(screen.getAllByTestId("sidebar-login")[0]).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-sync")).toBeNull();
  });

  it("should show sign-in button when connectionStatus is unauthorized", () => {
    mockUseConnectionStatus.mockReturnValue("unauthorized");
    renderPanel();
    expect(screen.getAllByTestId("sidebar-sign-in")[0]).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-sync")).toBeNull();
  });

  it("should show sign-in button when connectionStatus is no_auth", () => {
    mockUseConnectionStatus.mockReturnValue("no_auth");
    renderPanel();
    expect(screen.getAllByTestId("sidebar-sign-in")[0]).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-sync")).toBeNull();
  });

  it("should call signIn when sign-in button is clicked (unauthorized)", async () => {
    const user = userEvent.setup();
    mockUseConnectionStatus.mockReturnValue("unauthorized");
    renderPanel();
    await user.click(screen.getAllByTestId("sidebar-sign-in")[0]);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it("should call signIn when sign-in button is clicked (no_auth)", async () => {
    const user = userEvent.setup();
    mockUseConnectionStatus.mockReturnValue("no_auth");
    renderPanel();
    await user.click(screen.getAllByTestId("sidebar-sign-in")[0]);
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it("should navigate to settings when configure server button is clicked (not_configured)", async () => {
    const user = userEvent.setup();
    mockUseConnectionStatus.mockReturnValue("not_configured");
    renderPanel();
    await user.click(screen.getAllByTestId("sidebar-login")[0]);
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SETTINGS, {
      state: { expandSection: SETTINGS_SECTION_IDS.ACCOUNT_SYNC },
    });
  });
});

describe("Sidebar — layout states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
  });

  it("should render collapsed sidebar when effectiveState is collapsed", () => {
    renderPanel({ effectiveState: "collapsed" });
    expect(screen.getByTestId("sidebar-collapsed")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-expanded")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("sidebar-hover-expanded"),
    ).not.toBeInTheDocument();
  });

  it("should render expanded sidebar when effectiveState is expanded", () => {
    renderPanel({ effectiveState: "expanded" });
    expect(screen.getByTestId("sidebar-expanded")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-collapsed")).not.toBeInTheDocument();
  });

  it("should render expanded sidebar when drawer is open", () => {
    renderPanel({ effectiveState: "collapsed", isDrawerOpen: true });
    expect(screen.getByTestId("sidebar-expanded")).toBeInTheDocument();
  });

  it("should render hover-expanded overlay when hover-ready and isHoverExpanded", () => {
    renderPanel({
      effectiveState: "hover-ready",
      isHoverExpanded: true,
      hoverHandlers: { onMouseEnter: vi.fn(), onMouseLeave: vi.fn() },
    });
    expect(screen.getByTestId("sidebar-hover-expanded")).toBeInTheDocument();
  });

  it("should render collapsed sidebar when hover-ready but not hover-expanded", () => {
    renderPanel({
      effectiveState: "hover-ready",
      isHoverExpanded: false,
      hoverHandlers: { onMouseEnter: vi.fn(), onMouseLeave: vi.fn() },
    });
    expect(screen.getByTestId("sidebar-collapsed")).toBeInTheDocument();
    expect(
      screen.queryByTestId("sidebar-hover-expanded"),
    ).not.toBeInTheDocument();
  });

  it("should apply left side styles when side is left", () => {
    renderPanel({ side: "left", effectiveState: "collapsed" });
    const collapsed = screen.getByTestId("sidebar-collapsed");
    expect(collapsed.className).toContain("border-r");
  });

  it("should apply right side styles when side is right", () => {
    renderPanel({ side: "right", effectiveState: "collapsed" });
    const collapsed = screen.getByTestId("sidebar-collapsed");
    expect(collapsed.className).toContain("border-l");
  });

  it("should apply translateX style when sidebarTranslateX is non-zero", () => {
    renderPanel({ effectiveState: "expanded", sidebarTranslateX: 100 });
    const expanded = screen.getByTestId("sidebar-expanded");
    expect(expanded.style.transform).toBe("translateX(100px)");
  });

  it("should not apply transform style when sidebarTranslateX is zero", () => {
    renderPanel({ effectiveState: "expanded", sidebarTranslateX: 0 });
    const expanded = screen.getByTestId("sidebar-expanded");
    expect(expanded.style.transform).toBe("");
  });
});
