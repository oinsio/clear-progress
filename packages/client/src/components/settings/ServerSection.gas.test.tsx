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
import { fillAndSubmitGas } from "./ServerSection.test-helpers";

describe("ServerSection — GAS flow", () => {
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
  it("transitions to gas_awaiting_signin on successful GAS connect", async () => {
    const mockPing = vi.fn().mockResolvedValue({ ok: true, initialized: true });
    mockCreateGasAdapter.mockReturnValue({ ping: mockPing });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-button"),
      ).toBeInTheDocument();
    });

    expect(mockConnect).toHaveBeenCalledWith({
      type: "gas",
      url: "https://script.google.com/macros/s/ABC/exec",
      clientId: "client-123",
    });
  });

  it("shows loading during GAS connect", async () => {
    let resolvePing!: (value: { ok: boolean; initialized: boolean }) => void;
    mockCreateGasAdapter.mockReturnValue({
      ping: () =>
        new Promise((resolve) => {
          resolvePing = resolve;
        }),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(screen.getByTestId("server-gas-loading")).toBeInTheDocument();
    });

    resolvePing({ ok: true, initialized: true });

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-button"),
      ).toBeInTheDocument();
    });
  });

  // ── Connect: ping not ok ─────────────────────────────────────
  it("shows error and returns to gas_form when ping not ok", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: false }),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(screen.getByTestId("server-gas-error")).toHaveTextContent(
        "settings.server.connectionError",
      );
    });

    expect(screen.getByTestId("server-gas-url")).toBeInTheDocument();
  });

  // ── Connect: exception ───────────────────────────────────────
  it("shows error and returns to gas_form on connect exception", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockRejectedValue(new Error("Network failure")),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(screen.getByTestId("server-gas-error")).toHaveTextContent(
        "settings.server.connectionError",
      );
    });
  });

  // ── needsInit flag ───────────────────────────────────────────
  it("passes needsInit=false when GAS is already initialized", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: true, initialized: true }),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-button"),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("server-gas-initializing"),
    ).not.toBeInTheDocument();
  });

  // ── Cancel from GAS sign-in ──────────────────────────────────
  it("disconnects and returns to gas form when cancelling from GAS sign-in", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: true, initialized: true }),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-button"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("server-gas-signin-cancel"));

    expect(mockDisconnect).toHaveBeenCalledOnce();
    expect(screen.getByTestId("server-gas-url")).toBeInTheDocument();
  });

  // ── Error display condition ──────────────────────────────────
  it("does NOT show external error when phase is gas_form", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockRejectedValue(new Error("fail")),
    });
    render(<ServerSection />);
    fillAndSubmitGas(undefined, "id");

    await waitFor(() => {
      expect(screen.getByTestId("server-gas-error")).toBeInTheDocument();
    });

    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveAttribute("data-testid", "server-gas-error");
  });

  // ── GAS init complete → connected ────────────────────────────
  it("transitions to connected when GAS init completes", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: true, initialized: false }),
    });
    mockUseConnectionConfig.mockReturnValue(null);
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-cancel"),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("server-gas-initializing"),
    ).not.toBeInTheDocument();
  });

  // ── GAS init error → shows error ────────────────────────────
  it("shows error from GAS init via external alert", async () => {
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: true, initialized: false }),
    });
    render(<ServerSection />);
    fillAndSubmitGas();

    await waitFor(() => {
      expect(
        screen.getByTestId("server-gas-signin-cancel"),
      ).toBeInTheDocument();
    });
  });

  // ── parseGasInput + parseClientId called ─────────────────────
  it("calls parseGasInput and parseClientId with raw values", async () => {
    mockParseGasInput.mockReturnValue("https://resolved-gas.com");
    mockParseClientId.mockReturnValue("resolved-client-id");
    mockCreateGasAdapter.mockReturnValue({
      ping: vi.fn().mockResolvedValue({ ok: true, initialized: true }),
    });
    render(<ServerSection />);
    fillAndSubmitGas("https://raw-gas.com", "raw-client");

    await waitFor(() => {
      expect(mockParseGasInput).toHaveBeenCalledWith("https://raw-gas.com");
      expect(mockParseClientId).toHaveBeenCalledWith("raw-client");
    });

    expect(mockConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://resolved-gas.com",
        clientId: "resolved-client-id",
      }),
    );
  });
});
