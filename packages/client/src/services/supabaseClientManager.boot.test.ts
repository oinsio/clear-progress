import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// implements FR11, D2 of add-supabase-ui

const SDK_STORAGE_KEY_PREFIX = "sb";
const SDK_STORAGE_KEY_SUFFIX = "auth-token";
const MS_PER_SECOND = 1000;
const DEFAULT_TOKEN_EXPIRY_S = 3600;

const mockCreateClient = vi.fn(() => ({ auth: {}, functions: {} }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

const mockGetConnectionConfig = vi.fn();

vi.mock("./connectionService", () => ({
  getConnectionConfig: mockGetConnectionConfig,
}));

describe("supabaseClientManager boot initialization", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.resetModules();
    mockCreateClient.mockClear();
    mockGetConnectionConfig.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  function setLocationHash(hash: string) {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        hash,
        pathname: "/setup",
        search: "",
      },
      writable: true,
    });
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  }

  it("should not create client when no boot config exists", async () => {
    mockGetConnectionConfig.mockReturnValue(null);

    const { getSupabaseClient } = await import("./supabaseClientManager");

    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(() => getSupabaseClient()).toThrow(
      "Supabase client not initialized",
    );
  });

  it("should not create client when boot config is gas type", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "gas",
      url: "https://script.google.com/test",
    });

    const { getSupabaseClient } = await import("./supabaseClientManager");

    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(() => getSupabaseClient()).toThrow(
      "Supabase client not initialized",
    );
  });

  it("should create client when boot config is supabase type without hash", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://abc.supabase.co",
      anonKey: "anon-key-123",
    });
    setLocationHash("");

    const { getSupabaseClient } = await import("./supabaseClientManager");

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://abc.supabase.co",
      "anon-key-123",
      { auth: { flowType: "implicit", detectSessionInUrl: false } },
    );
    expect(getSupabaseClient()).toBeDefined();
  });

  it("should store session in localStorage when hash contains access_token", async () => {
    const supabaseUrl = "https://myproject.supabase.co";
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: supabaseUrl,
      anonKey: "anon-key",
    });

    const accessToken = "test-access-token";
    const refreshToken = "test-refresh-token";
    const expiresIn = "7200";
    const hash = `#access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&token_type=bearer`;
    setLocationHash(hash);

    const nowMs = 1700000000000;
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    await import("./supabaseClientManager");

    const hostname = "myproject";
    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-${hostname}-${SDK_STORAGE_KEY_SUFFIX}`;
    const storedSession = JSON.parse(localStorage.getItem(storageKey)!);

    expect(storedSession.access_token).toBe(accessToken);
    expect(storedSession.refresh_token).toBe(refreshToken);
    expect(storedSession.expires_in).toBe(Number(expiresIn));
    expect(storedSession.expires_at).toBe(
      Math.round(nowMs / MS_PER_SECOND) + Number(expiresIn),
    );
    expect(storedSession.token_type).toBe("bearer");
  });

  it("should use default expiry when expires_in is missing from hash", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#access_token=tok123");

    const nowMs = 1700000000000;
    vi.spyOn(Date, "now").mockReturnValue(nowMs);

    await import("./supabaseClientManager");

    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-proj-${SDK_STORAGE_KEY_SUFFIX}`;
    const storedSession = JSON.parse(localStorage.getItem(storageKey)!);

    expect(storedSession.expires_in).toBe(DEFAULT_TOKEN_EXPIRY_S);
    expect(storedSession.expires_at).toBe(
      Math.round(nowMs / MS_PER_SECOND) + DEFAULT_TOKEN_EXPIRY_S,
    );
  });

  it("should use empty string for refresh_token when missing from hash", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#access_token=tok123");

    await import("./supabaseClientManager");

    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-proj-${SDK_STORAGE_KEY_SUFFIX}`;
    const storedSession = JSON.parse(localStorage.getItem(storageKey)!);

    expect(storedSession.refresh_token).toBe("");
  });

  it("should default token_type to bearer when missing from hash", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#access_token=tok123");

    await import("./supabaseClientManager");

    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-proj-${SDK_STORAGE_KEY_SUFFIX}`;
    const storedSession = JSON.parse(localStorage.getItem(storageKey)!);

    expect(storedSession.token_type).toBe("bearer");
  });

  it("should clear the URL hash after storing session", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#access_token=tok123");

    await import("./supabaseClientManager");

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/setup",
    );
  });

  it("should read token_type from hash when explicitly provided", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#access_token=tok123&token_type=custom_type");

    await import("./supabaseClientManager");

    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-proj-${SDK_STORAGE_KEY_SUFFIX}`;
    const storedSession = JSON.parse(localStorage.getItem(storageKey)!);

    expect(storedSession.token_type).toBe("custom_type");
  });

  it("should not store session when hash has no access_token", async () => {
    mockGetConnectionConfig.mockReturnValue({
      type: "supabase",
      url: "https://proj.supabase.co",
      anonKey: "key",
    });

    setLocationHash("#some_param=value");

    await import("./supabaseClientManager");

    const storageKey = `${SDK_STORAGE_KEY_PREFIX}-proj-${SDK_STORAGE_KEY_SUFFIX}`;
    expect(localStorage.getItem(storageKey)).toBeNull();
    // Client should still be created even without hash tokens
    expect(mockCreateClient).toHaveBeenCalled();
  });
});
