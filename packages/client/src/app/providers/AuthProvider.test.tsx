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
  getAccessToken: vi.fn(() => null),
  setAccessToken: vi.fn(),
}));
vi.mock("./SupabaseAuthSync", () => ({
  SupabaseAuthSync: () => null,
}));

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("should expose authProvider as null when no backend configured", () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-provider").textContent).toBe("null");
  });
});
