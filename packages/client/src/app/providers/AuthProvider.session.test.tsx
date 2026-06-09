import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGoogleOAuthMock,
  getGoogleLoginOptions,
  mockGoogleLogin,
} from "@/test/mocks/googleOAuthMock";

vi.mock("@react-oauth/google", () => createGoogleOAuthMock());

const {
  mockGetAccessToken,
  mockConfigureTokenPersistence,
  mockLocalStoragePersistence,
} = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn().mockReturnValue(null),
  mockConfigureTokenPersistence: vi.fn(),
  mockLocalStoragePersistence: {
    save: vi.fn(),
    load: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("@/services/tokenManager", () => ({
  setAccessToken: vi.fn(),
  getAccessToken: () => mockGetAccessToken(),
  configureTokenPersistence: (...args: unknown[]) =>
    mockConfigureTokenPersistence(...args),
}));

vi.mock("@/services/tokenPersistence", () => ({
  localStoragePersistence: mockLocalStoragePersistence,
}));

const mockGetConnectionConfig = vi.fn();
vi.mock("@/services/connectionService", () => ({
  getConnectionConfig: () => mockGetConnectionConfig(),
}));

const mockSupabaseClient = {
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    refreshSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
  },
};

vi.mock("@/services/supabaseClientManager", () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

import { setAccessToken } from "@/services/tokenManager";
import { AuthProvider } from "./AuthProvider";
import {
  GAS_CONNECTION_CONFIG,
  resetAuthMocks,
  SUPABASE_CONNECTION_CONFIG,
  TestConsumer,
} from "./AuthProvider.test-helpers";

describe("AuthProvider — session & persistence", () => {
  beforeEach(() => {
    resetAuthMocks({ mockGetConnectionConfig, mockGetAccessToken });
  });

  it("should call silentGoogleLogin on mount to restore session", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    expect(mockGoogleLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should call the silent Google login function when silentRefresh is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    mockGoogleLogin.mockClear();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "silent-refresh" }));
    });

    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    expect(mockGoogleLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should update accessToken when silent login succeeds", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      getGoogleLoginOptions().onSuccess({
        access_token: "refreshed-token",
        expires_in: 3600,
      });
    });

    expect(screen.getByTestId("token").textContent).toBe("refreshed-token");
    expect(setAccessToken).toHaveBeenCalledWith("refreshed-token", 3600);
  });

  it("should NOT clear state when silent refresh error occurs", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });
    await act(async () => {
      getGoogleLoginOptions().onSuccess({
        access_token: "my-token",
        expires_in: 3600,
      });
    });
    expect(screen.getByTestId("token").textContent).toBe("my-token");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "silent-refresh" }));
    });
    await act(async () => {
      getGoogleLoginOptions().onError();
    });

    expect(screen.getByTestId("token").textContent).toBe("my-token");
  });

  it("should initialize accessToken from getAccessToken when token is restored", () => {
    mockGetAccessToken.mockReturnValueOnce("cached-token");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("token").textContent).toBe("cached-token");
  });

  it("should initialize accessToken as null when getAccessToken returns null", () => {
    mockGetAccessToken.mockReturnValueOnce(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("token").textContent).toBe("null");
  });

  it("should call configureTokenPersistence for GAS backend", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(mockConfigureTokenPersistence).toHaveBeenCalledWith(
      mockLocalStoragePersistence,
    );
  });

  it("should NOT call configureTokenPersistence for Supabase backend", () => {
    mockGetConnectionConfig.mockReturnValue(SUPABASE_CONNECTION_CONFIG);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(mockConfigureTokenPersistence).not.toHaveBeenCalled();
  });

  describe("backend type detection", () => {
    it("should subscribe to Supabase auth when connection type is supabase", () => {
      mockGetConnectionConfig.mockReturnValue(SUPABASE_CONNECTION_CONFIG);
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGoogleLogin).not.toHaveBeenCalled();
    });

    it("should not subscribe to Supabase auth when connection type is gas", () => {
      mockGetConnectionConfig.mockReturnValue(GAS_CONNECTION_CONFIG);
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      expect(mockSupabaseClient.auth.onAuthStateChange).not.toHaveBeenCalled();
      expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
    });

    it("should render neither auth mechanism when no config exists", () => {
      mockGetConnectionConfig.mockReturnValue(null);
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      expect(mockGoogleLogin).not.toHaveBeenCalled();
      expect(mockSupabaseClient.auth.onAuthStateChange).not.toHaveBeenCalled();
    });
  });
});
