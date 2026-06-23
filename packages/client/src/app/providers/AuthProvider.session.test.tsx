import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAccessToken } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn().mockReturnValue(null),
}));

vi.mock("@/services/tokenManager", () => ({
  setAccessToken: vi.fn(),
  getAccessToken: () => mockGetAccessToken(),
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

import { AuthProvider } from "./AuthProvider";
import {
  resetAuthMocks,
  SUPABASE_CONNECTION_CONFIG,
  TestConsumer,
} from "./AuthProvider.test-helpers";

describe("AuthProvider — session & persistence", () => {
  beforeEach(() => {
    resetAuthMocks({ mockGetConnectionConfig, mockGetAccessToken });
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
    });

    it("should render neither auth mechanism when no config exists", () => {
      mockGetConnectionConfig.mockReturnValue(null);
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>,
      );
      expect(mockSupabaseClient.auth.onAuthStateChange).not.toHaveBeenCalled();
    });
  });
});
