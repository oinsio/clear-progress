import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSignIn = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockFetchSupabaseProviders = vi.fn();
const mockUseAuth = vi.fn();
const mockUseConnectionStatus = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));
vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => mockUseConnectionStatus(),
}));
vi.mock("@/services/supabaseClientManager", () => ({
  createSupabaseClient: vi.fn(),
  getSupabaseClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  })),
}));
vi.mock("@/services/supabaseConnection", () => ({
  fetchSupabaseProviders: (...args: unknown[]) =>
    mockFetchSupabaseProviders(...args),
}));
vi.mock("@/shared/lib/cn", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));
vi.mock("@/constants", () => ({
  ROUTES: { SETTINGS: "/settings" },
}));

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import type { ConnectionConfig } from "@/types/connection";
import { ServerConnectedStatus } from "./ServerConnectedStatus";

function setupAuth(accessToken: string | null, userEmail: string | null) {
  mockUseAuth.mockReturnValue({
    accessToken,
    userEmail,
    userPicture: null,
    signIn: mockSignIn,
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  });
}

function renderConnected(
  config: ConnectionConfig,
  overrides: Partial<{
    onFullSync: () => void;
    onDisconnect: () => void;
  }> = {},
) {
  const defaultProps = {
    onFullSync: vi.fn(),
    onDisconnect: vi.fn(),
    ...overrides,
  };
  return {
    ...render(<ServerConnectedStatus config={config} {...defaultProps} />),
    props: defaultProps,
  };
}

const supabaseConfig: ConnectionConfig = {
  type: "supabase",
  url: "https://myproject.supabase.co",
  anonKey: "test-anon-key",
  isActive: true,
};

const gasConfig: ConnectionConfig = {
  type: "gas",
  url: "https://script.google.com/macros/s/ABC/exec",
  clientId: "123456789",
  isActive: true,
};

describe("ServerConnectedStatus", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionStatus.mockReturnValue("synced");
    setupAuth("test-token", "user@example.com");
    mockFetchSupabaseProviders.mockResolvedValue([]);
  });

  it("renders Supabase type label", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-connected-type")).toHaveTextContent(
      "settings.server.typeSupabase",
    );
  });

  it("renders GAS type label", () => {
    renderConnected(gasConfig);
    expect(screen.getByTestId("server-connected-type")).toHaveTextContent(
      "settings.server.typeGas",
    );
  });

  it("renders URL", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-connected-url")).toHaveTextContent(
      "https://myproject.supabase.co",
    );
  });

  it("renders user email when present", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-connected-account")).toHaveTextContent(
      "user@example.com",
    );
  });

  it("hides account when no email", () => {
    setupAuth("test-token", null);
    renderConnected(supabaseConfig);
    expect(
      screen.queryByTestId("server-connected-account"),
    ).not.toBeInTheDocument();
  });

  it("calls onFullSync when full sync button clicked", () => {
    const onFullSync = vi.fn();
    renderConnected(supabaseConfig, { onFullSync });
    fireEvent.click(screen.getByTestId("server-full-sync"));
    expect(onFullSync).toHaveBeenCalledOnce();
  });

  it("calls onDisconnect when disconnect button clicked", () => {
    const onDisconnect = vi.fn();
    renderConnected(supabaseConfig, { onDisconnect });
    fireEvent.click(screen.getByTestId("server-disconnect"));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it("renders full sync button text", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-full-sync")).toHaveTextContent(
      "settings.server.fullSync",
    );
  });

  it("renders disconnect button text", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-disconnect")).toHaveTextContent(
      "settings.server.disconnect",
    );
  });

  it("shows sign-in required for GAS when no accessToken", () => {
    setupAuth(null, null);
    renderConnected(gasConfig);
    expect(screen.getByTestId("server-signin-required")).toBeInTheDocument();
    expect(screen.getByTestId("server-signin-button")).toHaveTextContent(
      "settings.server.signInWithGoogle",
    );
  });

  it("calls signIn when GAS sign-in button clicked", () => {
    setupAuth(null, null);
    renderConnected(gasConfig);
    fireEvent.click(screen.getByTestId("server-signin-button"));
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it("hides sign-in when GAS has accessToken", () => {
    renderConnected(gasConfig);
    expect(
      screen.queryByTestId("server-signin-required"),
    ).not.toBeInTheDocument();
  });

  it("shows sign-in for Supabase when session expired", () => {
    mockUseConnectionStatus.mockReturnValue("no_auth");
    setupAuth(null, null);
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-signin-required")).toBeInTheDocument();
  });

  it("loads providers for Supabase re-auth", async () => {
    mockUseConnectionStatus.mockReturnValue("no_auth");
    setupAuth(null, null);
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
    renderConnected(supabaseConfig);
    await waitFor(() => {
      expect(mockFetchSupabaseProviders).toHaveBeenCalledWith(
        "https://myproject.supabase.co",
        "test-anon-key",
      );
    });
  });

  it("handles provider loading error gracefully", async () => {
    mockUseConnectionStatus.mockReturnValue("no_auth");
    setupAuth(null, null);
    mockFetchSupabaseProviders.mockRejectedValue(new Error("Network error"));
    renderConnected(supabaseConfig);
    await waitFor(() => {
      expect(mockFetchSupabaseProviders).toHaveBeenCalled();
    });
    expect(screen.getByTestId("server-signin-required")).toBeInTheDocument();
  });

  it("renders account label i18n key", () => {
    renderConnected(supabaseConfig);
    expect(screen.getByText(/settings\.server\.account/)).toBeInTheDocument();
  });

  it("renders signInRequired i18n key for Supabase no_auth", () => {
    mockUseConnectionStatus.mockReturnValue("no_auth");
    setupAuth(null, null);
    renderConnected(supabaseConfig);
    expect(
      screen.getByText("settings.server.signInRequired"),
    ).toBeInTheDocument();
  });

  it("renders signInRequired i18n key for GAS no token", () => {
    setupAuth(null, null);
    renderConnected(gasConfig);
    expect(
      screen.getByText("settings.server.signInRequired"),
    ).toBeInTheDocument();
  });

  it("shows sign-in for Supabase unauthorized status", () => {
    mockUseConnectionStatus.mockReturnValue("unauthorized");
    setupAuth(null, null);
    renderConnected(supabaseConfig);
    expect(screen.getByTestId("server-signin-required")).toBeInTheDocument();
  });

  it("hides sign-in for Supabase when authenticated", () => {
    mockUseConnectionStatus.mockReturnValue("synced");
    renderConnected(supabaseConfig);
    expect(
      screen.queryByTestId("server-signin-required"),
    ).not.toBeInTheDocument();
  });
});
