import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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

import { Sidebar } from "./Sidebar";

function renderPanel(overrides?: Partial<Parameters<typeof Sidebar>[0]>) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        isOpen={true}
        onToggle={vi.fn()}
        onModeChange={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

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
