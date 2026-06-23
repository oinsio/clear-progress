import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock declarations (hoisted) ────────────────────────────────
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockUseConnectionConfig = vi.fn();
const mockTriggerFullSync = vi.fn();
const mockFetchSupabaseProviders = vi.fn();
const mockCreateSupabaseClient = vi.fn();
const mockGetSupabaseClient = vi.fn();
const mockGetAccessToken = vi.fn();
const mockParseSupabaseInput = vi.fn((url: string) => url);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ triggerFullSync: mockTriggerFullSync }),
}));
vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: () => mockUseConnectionConfig(),
}));
vi.mock("@/services/connectionService", () => ({
  connect: (...args: unknown[]) => mockConnect(...args),
  disconnect: (...args: unknown[]) => mockDisconnect(...args),
  getSavedConfigForType: () => null,
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  }),
}));
vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));
vi.mock("@/services/supabaseConnection", () => ({
  fetchSupabaseProviders: (...args: unknown[]) =>
    mockFetchSupabaseProviders(...args),
}));
vi.mock("@/services/defaultServices", () => ({
  getDefaultSyncAdapter: vi.fn(() => ({ init: vi.fn() })),
}));
vi.mock("@/services/supabaseClientManager", () => ({
  createSupabaseClient: (...args: unknown[]) =>
    mockCreateSupabaseClient(...args),
  getSupabaseClient: () => mockGetSupabaseClient(),
}));
vi.mock("@/services/tokenManager", () => ({
  getAccessToken: () => mockGetAccessToken(),
}));
vi.mock("@/utils/supabaseUrl", () => ({
  parseSupabaseInput: (url: string) => mockParseSupabaseInput(url),
}));
vi.mock("@/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/constants")>()),
  ROUTES: { SETTINGS: "/settings", TASKS: "/tasks" },
}));
vi.mock("@/shared/lib/cn", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import { ServerSection } from "./ServerSection";
import {
  fillAndSubmitSupabase,
  navigateToOtpPhase,
} from "./ServerSection.test-helpers";

describe("ServerSection — Supabase flow", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionConfig.mockReturnValue(null);
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
  });

  // ── Connect: success ─────────────────────────────────────────
  it("transitions to supabase_providers on successful connect", async () => {
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google", "github"],
      isEmailEnabled: false,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });

    expect(mockConnect).toHaveBeenCalledWith({
      type: "supabase",
      url: "https://test.supabase.co",
      anonKey: "test-key",
    });
    expect(mockCreateSupabaseClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-key",
    );
  });

  it("shows loading during supabase connect", async () => {
    let resolveAuthMethods!: (value: {
      oauthProviders: string[];
      isEmailEnabled: boolean;
    }) => void;
    mockFetchSupabaseProviders.mockReturnValue(
      new Promise<{ oauthProviders: string[]; isEmailEnabled: boolean }>(
        (resolve) => {
          resolveAuthMethods = resolve;
        },
      ),
    );
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-loading")).toBeInTheDocument();
    });

    resolveAuthMethods({ oauthProviders: ["google"], isEmailEnabled: false });

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });
  });

  // ── Connect: error ───────────────────────────────────────────
  it("shows error and returns to supabase_form on connect failure", async () => {
    mockFetchSupabaseProviders.mockRejectedValue(new Error("Network error"));
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-error")).toHaveTextContent(
        "settings.server.connectionError",
      );
    });

    expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
  });

  it("clears error on supabase form when re-selecting Supabase", async () => {
    mockFetchSupabaseProviders.mockRejectedValue(new Error("fail"));
    render(<ServerSection />);
    fillAndSubmitSupabase("https://test.supabase.co", "key");

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-error")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("server-supabase-cancel"));
    fireEvent.click(screen.getByTestId("server-connect-supabase"));

    expect(
      screen.queryByTestId("server-supabase-error"),
    ).not.toBeInTheDocument();
  });

  // ── Cancel from providers ────────────────────────────────────
  it("disconnects and returns to supabase form when cancelling from providers", async () => {
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("server-oauth-cancel"));

    expect(mockDisconnect).toHaveBeenCalledOnce();
    expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
  });

  // ── OAuth sign-in error ──────────────────────────────────────
  it("shows error when OAuth sign-in fails", async () => {
    mockGetSupabaseClient.mockReturnValue({
      auth: {
        signInWithOAuth: vi.fn().mockRejectedValue(new Error("OAuth failed")),
      },
    });
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("server-oauth-google"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "settings.server.connectionError",
      );
    });
  });

  // ── Error display condition ──────────────────────────────────
  it("does NOT show external error when phase is supabase_form", async () => {
    mockFetchSupabaseProviders.mockRejectedValue(new Error("fail"));
    render(<ServerSection />);
    fillAndSubmitSupabase("https://test.supabase.co", "key");

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-error")).toBeInTheDocument();
    });

    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveAttribute("data-testid", "server-supabase-error");
  });

  // ── parseSupabaseInput called ────────────────────────────────
  it("calls parseSupabaseInput with raw URL", async () => {
    mockParseSupabaseInput.mockReturnValue("https://resolved.supabase.co");
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase("https://raw.supabase.co", "key");

    await waitFor(() => {
      expect(mockParseSupabaseInput).toHaveBeenCalledWith(
        "https://raw.supabase.co",
      );
    });

    expect(mockFetchSupabaseProviders).toHaveBeenCalledWith(
      "https://resolved.supabase.co",
      "key",
    );
  });

  // ── Loading cleared after connect ──────────────────────────────
  it("clears loading state after successful connect", async () => {
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("server-supabase-loading"),
    ).not.toBeInTheDocument();
  });

  it("clears loading state after failed connect", async () => {
    mockFetchSupabaseProviders.mockRejectedValue(new Error("fail"));
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-error")).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("server-supabase-loading"),
    ).not.toBeInTheDocument();
  });

  it("clears previous error when starting a new connect attempt", async () => {
    mockFetchSupabaseProviders.mockRejectedValueOnce(new Error("fail"));
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-error")).toBeInTheDocument();
    });

    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
    // Already on supabase_form, just click connect again
    fireEvent.click(screen.getByTestId("server-supabase-connect"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("server-supabase-error"),
      ).not.toBeInTheDocument();
    });
  });

  // ── Email OTP: providers phase shows email form (FR1) ─────────
  it("shows email form when isEmailEnabled is true", async () => {
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: true,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
    });

    expect(screen.getByTestId("server-email-send")).toBeInTheDocument();
  });

  it("does not show email form when isEmailEnabled is false", async () => {
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("server-email-input")).not.toBeInTheDocument();
  });

  // ── Email OTP: send transitions to OTP phase (FR2, FR3) ──────
  it("transitions to supabase_email_otp phase after sending OTP", async () => {
    await navigateToOtpPhase({
      mockGetSupabaseClient,
      mockFetchSupabaseProviders,
    });

    await waitFor(() => {
      expect(screen.getByTestId("server-otp-title")).toBeInTheDocument();
    });

    expect(screen.getByTestId("server-otp-email")).toHaveTextContent(
      "settings.server.codeSentTo",
    );
  });

  // ── Email OTP: back returns to providers (FR9) ────────────────
  it("returns to providers phase when clicking back from OTP", async () => {
    await navigateToOtpPhase({
      mockGetSupabaseClient,
      mockFetchSupabaseProviders,
    });

    await waitFor(() => {
      expect(screen.getByTestId("server-otp-title")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("server-otp-back"));

    expect(screen.getByTestId("server-oauth-hint")).toBeInTheDocument();
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  // ── Email OTP: verify calls verifyOtp (FR4) ──────────────────
  it("calls verifyOtp when submitting OTP code", async () => {
    const mockVerifyOtp = vi.fn().mockResolvedValue({ error: null });
    await navigateToOtpPhase({
      mockGetSupabaseClient,
      mockFetchSupabaseProviders,
      extraAuthMethods: { verifyOtp: mockVerifyOtp },
    });

    await waitFor(() => {
      expect(screen.getByTestId("server-otp-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("server-otp-input"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByTestId("server-otp-verify"));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        token: "123456",
        type: "email",
      });
    });
  });
});
