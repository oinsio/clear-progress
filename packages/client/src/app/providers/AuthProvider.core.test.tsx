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

vi.mock("@/services/supabaseClientManager", () => ({
  getSupabaseClient: () => ({
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}));

import { AuthProvider } from "./AuthProvider";
import {
  resetAuthMocks,
  TestConsumer,
  ThrowingConsumer,
} from "./AuthProvider.test-helpers";

describe("AuthProvider — core", () => {
  beforeEach(() => {
    resetAuthMocks({ mockGetConnectionConfig, mockGetAccessToken });
  });

  it("should throw when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => render(<ThrowingConsumer />)).toThrow(
      "useAuth must be used within AuthProvider",
    );
    consoleSpy.mockRestore();
  });

  it("should have null accessToken and userEmail initially", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });

  it("should expose silentRefresh in context", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(
      screen.getByRole("button", { name: "silent-refresh" }),
    ).toBeInTheDocument();
  });

  it("should provide null accessToken when no backend is configured", () => {
    mockGetConnectionConfig.mockReturnValue(null);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("token").textContent).toBe("null");
  });
});
