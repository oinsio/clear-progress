vi.mock("@/services/connectionService", () => ({
  getConnectionConfig: vi.fn(() => null),
}));
vi.mock("@/services/supabaseClientManager", () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    },
  })),
}));
vi.mock("@/services/tokenManager", () => ({
  configureTokenPersistence: vi.fn(),
  getAccessToken: vi.fn(() => null),
  setAccessToken: vi.fn(),
}));
vi.mock("@/services/tokenPersistence", () => ({
  localStoragePersistence: {},
}));
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));
vi.mock("./GoogleAuthSync", () => ({
  GoogleAuthSync: () => null,
}));
vi.mock("./SupabaseAuthSync", () => ({
  SupabaseAuthSync: () => null,
}));

import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { getConnectionConfig } from "@/services/connectionService";
import { AuthProvider, useAuth } from "./AuthProvider";

function AuthConsumer() {
  const auth = useAuth();
  return <div data-testid="auth-provider">{auth.authProvider ?? "null"}</div>;
}

describe("AuthProvider — authProvider context field", () => {
  it("should expose authProvider as null by default", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-provider").textContent).toBe("null");
  });

  it("should expose authProvider as null for GAS backend", () => {
    vi.mocked(getConnectionConfig).mockReturnValue({
      type: "gas",
      url: "https://example.com",
      clientId: "123",
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-provider").textContent).toBe("null");
  });

  it("should expose authProvider as null when no backend configured", () => {
    vi.mocked(getConnectionConfig).mockReturnValue(null);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-provider").textContent).toBe("null");
  });
});
