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
const mockCreateGasAdapter = vi.fn();
const mockParseSupabaseInput = vi.fn((url: string) => url);
const mockParseGasInput = vi.fn((url: string) => url);
const mockParseClientId = vi.fn((id: string) => id);

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
vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: (...args: unknown[]) => mockCreateGasAdapter(...args),
}));
vi.mock("@/utils/supabaseUrl", () => ({
  parseSupabaseInput: (url: string) => mockParseSupabaseInput(url),
}));
vi.mock("@/utils/gasUrl", () => ({
  parseGasInput: (url: string) => mockParseGasInput(url),
}));
vi.mock("@/utils/clientId", () => ({
  parseClientId: (id: string) => mockParseClientId(id),
}));
vi.mock("@/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/constants")>()),
  ROUTES: { SETTINGS: "/settings" },
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
import { fillAndSubmitSupabase } from "./ServerSection.test-helpers";

describe("ServerSection — Supabase flow", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionConfig.mockReturnValue(null);
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
  });

  // ── Connect: success ─────────────────────────────────────────
  it("transitions to supabase_providers on successful connect", async () => {
    mockFetchSupabaseProviders.mockResolvedValue(["google", "github"]);
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
    let resolveProviders!: (value: string[]) => void;
    mockFetchSupabaseProviders.mockReturnValue(
      new Promise<string[]>((resolve) => {
        resolveProviders = resolve;
      }),
    );
    render(<ServerSection />);
    fillAndSubmitSupabase();

    await waitFor(() => {
      expect(screen.getByTestId("server-supabase-loading")).toBeInTheDocument();
    });

    resolveProviders(["google"]);

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
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
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
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
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
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
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
});
