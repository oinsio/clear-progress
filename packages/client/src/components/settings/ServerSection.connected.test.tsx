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

import { cleanup, fireEvent, screen } from "@testing-library/react/pure";
import { renderWithConnection } from "./ServerSection.test-helpers";

describe("ServerSection — connected state", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSupabaseProviders.mockResolvedValue({
      oauthProviders: ["google"],
      isEmailEnabled: false,
    });
  });

  it("renders connected status when config exists", () => {
    renderWithConnection(mockUseConnectionConfig);
    expect(screen.getByTestId("server-connected-type")).toBeInTheDocument();
  });

  // ── Disconnect dialog ────────────────────────────────────────
  it("opens and confirms disconnect dialog", () => {
    renderWithConnection(mockUseConnectionConfig);
    fireEvent.click(screen.getByTestId("server-disconnect"));

    expect(screen.getByTestId("disconnect-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("disconnect-confirm-btn"));

    expect(mockDisconnect).toHaveBeenCalledOnce();
    expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
  });

  it("closes disconnect dialog without disconnecting", () => {
    renderWithConnection(mockUseConnectionConfig);
    fireEvent.click(screen.getByTestId("server-disconnect"));

    expect(screen.getByTestId("disconnect-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("disconnect-cancel-btn"));

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(screen.queryByTestId("disconnect-dialog")).not.toBeInTheDocument();
  });

  // ── Full sync dialog ─────────────────────────────────────────
  it("opens full sync dialog", () => {
    renderWithConnection(mockUseConnectionConfig);
    fireEvent.click(screen.getByTestId("server-full-sync"));

    expect(screen.getByTestId("full-sync-dialog")).toBeInTheDocument();
  });

  it("closes full sync dialog", () => {
    renderWithConnection(mockUseConnectionConfig);
    fireEvent.click(screen.getByTestId("server-full-sync"));

    expect(screen.getByTestId("full-sync-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("full-sync-cancel-btn"));

    expect(screen.queryByTestId("full-sync-dialog")).not.toBeInTheDocument();
  });
});
