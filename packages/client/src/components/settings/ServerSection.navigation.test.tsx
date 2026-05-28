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
} from "@testing-library/react/pure";
import { ServerSection } from "./ServerSection";

describe("ServerSection — navigation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseConnectionConfig.mockReturnValue(null);
    mockFetchSupabaseProviders.mockResolvedValue(["google"]);
  });

  // ── Phase: selection (initial) ─────────────────────────────
  it("renders selection phase when no config", () => {
    render(<ServerSection />);
    expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
    expect(screen.getByTestId("server-connect-gas")).toBeInTheDocument();
  });

  it("renders title", () => {
    render(<ServerSection />);
    expect(screen.getByText("settings.server.title")).toBeInTheDocument();
  });

  // ── Phase: supabase_form ───────────────────────────────────
  it("shows supabase form after selecting Supabase", () => {
    render(<ServerSection />);
    fireEvent.click(screen.getByTestId("server-connect-supabase"));
    expect(screen.getByTestId("server-supabase-url")).toBeInTheDocument();
    expect(
      screen.queryByTestId("server-connect-supabase"),
    ).not.toBeInTheDocument();
  });

  // ── Phase: gas_form ────────────────────────────────────────
  it("shows gas form after selecting GAS", () => {
    render(<ServerSection />);
    fireEvent.click(screen.getByTestId("server-connect-gas"));
    expect(screen.getByTestId("server-gas-url")).toBeInTheDocument();
    expect(
      screen.queryByTestId("server-connect-supabase"),
    ).not.toBeInTheDocument();
  });

  // ── Cancel from forms ──────────────────────────────────────
  it("returns to selection when cancelling from supabase form", () => {
    render(<ServerSection />);
    fireEvent.click(screen.getByTestId("server-connect-supabase"));
    fireEvent.click(screen.getByTestId("server-supabase-cancel"));
    expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
  });

  it("returns to selection when cancelling from gas form", () => {
    render(<ServerSection />);
    fireEvent.click(screen.getByTestId("server-connect-gas"));
    fireEvent.click(screen.getByTestId("server-gas-cancel"));
    expect(screen.getByTestId("server-connect-supabase")).toBeInTheDocument();
  });

  // ── oauthError prop ────────────────────────────────────────
  it("shows external error when oauthError passed and phase is selection", () => {
    render(<ServerSection oauthError="OAuth callback error" />);
    expect(screen.getByRole("alert")).toHaveTextContent("OAuth callback error");
  });

  it("does not show external error when oauthError is empty", () => {
    render(<ServerSection />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
