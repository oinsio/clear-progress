import { beforeEach, describe, expect, it, vi } from "vitest";

// implements FR9, D3 of add-supabase-ui

const mockGasAdapter = { ping: vi.fn(), init: vi.fn() };
const mockSupabaseAdapter = { ping: vi.fn(), init: vi.fn() };
const mockSupabaseClient = { auth: {}, functions: {} };

vi.mock("@clear-progress/adapter-gas", () => ({
  createGasAdapter: vi.fn(() => mockGasAdapter),
}));

vi.mock("@clear-progress/adapter-supabase", () => ({
  createSupabaseAdapter: vi.fn(() => mockSupabaseAdapter),
}));

const mockGetConnectionConfig = vi.fn();

vi.mock("./connectionService", () => ({
  getConnectionConfig: mockGetConnectionConfig,
}));

vi.mock("./supabaseClientManager", () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

const mockGetAccessToken = vi.fn();

vi.mock("./tokenManager", () => ({
  getAccessToken: mockGetAccessToken,
}));

vi.mock("@/db/repositories/TaskRepository");
vi.mock("@/db/repositories/ChecklistRepository");
vi.mock("@/db/repositories/GoalRepository");
vi.mock("@/db/repositories/IdeaRepository");
vi.mock("@/db/repositories/ContextRepository");
vi.mock("@/db/repositories/CategoryRepository");
vi.mock("@/db/repositories/CoverRepository");
vi.mock("@/db/repositories/PendingCoverRepository");
vi.mock("@/db/repositories/SettingsRepository");
vi.mock("@/db/repositories/SyncMetaRepository");
vi.mock("./CoverService");
vi.mock("./CoverSyncService");
vi.mock("./GoalService");
vi.mock("./IdeaService");
vi.mock("./SyncService");
vi.mock("./TaskService");

describe("defaultServices — createSyncAdapter", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetConnectionConfig.mockReset();
  });

  it("should create GAS adapter when config type is gas", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "gas",
      url: "https://script.google.com/test",
    });

    const { getDefaultSyncAdapter } = await import("./defaultServices");
    const { createGasAdapter } = await import("@clear-progress/adapter-gas");

    const adapter = getDefaultSyncAdapter();

    expect(createGasAdapter).toHaveBeenCalledWith(
      "https://script.google.com/test",
      mockGetAccessToken,
    );
    expect(adapter).toBe(mockGasAdapter);
  });

  it("should create Supabase adapter when config type is supabase", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://abc.supabase.co",
      anonKey: "key",
    });

    const { getDefaultSyncAdapter } = await import("./defaultServices");
    const { createSupabaseAdapter } = await import(
      "@clear-progress/adapter-supabase"
    );

    const adapter = getDefaultSyncAdapter();

    expect(createSupabaseAdapter).toHaveBeenCalledWith(mockSupabaseClient);
    expect(adapter).toBe(mockSupabaseAdapter);
  });

  it("should throw when no backend is configured", async () => {
    mockGetConnectionConfig.mockReturnValue(null);

    const { getDefaultSyncAdapter } = await import("./defaultServices");

    expect(() => getDefaultSyncAdapter()).toThrow("No backend configured");
  });

  it("should cache the adapter on subsequent calls", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "gas",
      url: "https://script.google.com/test",
    });

    const { getDefaultSyncAdapter } = await import("./defaultServices");
    const { createGasAdapter } = await import("@clear-progress/adapter-gas");

    const callsBefore = vi.mocked(createGasAdapter).mock.calls.length;
    const firstCall = getDefaultSyncAdapter();
    const secondCall = getDefaultSyncAdapter();

    expect(firstCall).toBe(secondCall);
    // Only one additional call despite two getDefaultSyncAdapter() calls
    expect(vi.mocked(createGasAdapter).mock.calls.length - callsBefore).toBe(1);
  });

  it("should return null placeholder from defaultSyncAdapter when no config", async () => {
    mockGetConnectionConfig.mockReturnValue(null);

    const { defaultSyncAdapter } = await import("./defaultServices");

    expect(defaultSyncAdapter).toBeNull();
  });

  it("should return adapter from defaultSyncAdapter IIFE when config exists", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "gas",
      url: "https://script.google.com/test",
    });

    const { defaultSyncAdapter } = await import("./defaultServices");

    expect(defaultSyncAdapter).toBe(mockGasAdapter);
  });
});
