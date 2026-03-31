import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthProvider, useAuth } from "./AuthProvider";

const mockLogin = vi.fn();

// Mock GoogleOAuthProvider (just passes children through)
// Mock useGoogleLogin to capture callbacks — called inside GoogleAuthSync
vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGoogleLogin: vi.fn((options: { onSuccess: (response: unknown) => void; onError: () => void }) => {
    (globalThis as Record<string, unknown>).__googleLoginOptions = options;
    return mockLogin;
  }),
}));

vi.mock("@/services/ApiClient", () => ({
  setAccessToken: vi.fn(),
}));

import { setAccessToken } from "@/services/ApiClient";

function TestConsumer() {
  const { accessToken, userEmail, signIn, signOut, silentRefresh } = useAuth();
  return (
    <div>
      <span data-testid="token">{accessToken ?? "null"}</span>
      <span data-testid="email">{userEmail ?? "null"}</span>
      <button onClick={signIn}>sign-in</button>
      <button onClick={signOut}>sign-out</button>
      <button onClick={silentRefresh}>silent-refresh</button>
    </div>
  );
}

function ThrowingConsumer() {
  useAuth();
  return <div />;
}

import { STORAGE_KEYS } from "@/constants";

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("google_client_id", "test-client-id");
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT);
    delete (globalThis as Record<string, unknown>).__googleLoginOptions;
  });

  it("should throw when useAuth is used outside AuthProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<ThrowingConsumer />)).toThrow("useAuth must be used within AuthProvider");
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

  it("should call the Google login function when signIn is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Clear the silent login call that happens on mount
    mockLogin.mockClear();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it("should update accessToken after successful Google login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({
        access_token: "test-access-token",
        expires_in: 3600,
      });
    });

    expect(screen.getByTestId("token").textContent).toBe("test-access-token");
  });

  it("should call setAccessToken with token and expiresIn after successful login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });

    expect(setAccessToken).toHaveBeenCalledWith("my-token", 3600);
  });

  it("should call setAccessToken(null) when signOut is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should expose silentRefresh in context", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByRole("button", { name: "silent-refresh" })).toBeInTheDocument();
  });

  it("should call silentGoogleLogin on mount to restore session", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should call the silent Google login function when silentRefresh is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Clear the mount-time silent login call
    mockLogin.mockClear();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "silent-refresh" }));
    });

    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should update accessToken when silent login succeeds", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // On mount, isSilentRef.current = true inside GoogleAuthSync
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "refreshed-token", expires_in: 3600 });
    });

    expect(screen.getByTestId("token").textContent).toBe("refreshed-token");
    expect(setAccessToken).toHaveBeenCalledWith("refreshed-token", 3600);
  });

  it("should call setAccessToken(null) and clear state when explicit login fails", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // First set a token via silent refresh
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });
    expect(screen.getByTestId("token").textContent).toBe("my-token");

    // Switch to explicit login mode, then trigger error
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onError: () => void;
      };
      options.onError();
    });

    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
  });

  it("should NOT clear state when silent refresh error occurs", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Sign in explicitly to get a token (isSilentRef.current = false)
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });
    expect(screen.getByTestId("token").textContent).toBe("my-token");

    // Trigger silent refresh (sets isSilentRef.current = true), then error
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "silent-refresh" }));
    });
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onError: () => void;
      };
      options.onError();
    });

    // Token should remain — silent refresh error must not wipe state
    expect(screen.getByTestId("token").textContent).toBe("my-token");
  });

  it("should initialize accessToken from localStorage when stored token is valid", () => {
    const expiresAt = Date.now() + 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "cached-token");
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, String(expiresAt));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("token").textContent).toBe("cached-token");
  });

  it("should initialize accessToken as null when stored token is expired", () => {
    const expiredAt = Date.now() - 1000;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "expired-token");
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, String(expiredAt));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("token").textContent).toBe("null");
  });

  it("should clear accessToken and userEmail when signOut is invoked", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Sign in first
    await act(async () => {
      const options = (globalThis as Record<string, unknown>).__googleLoginOptions as {
        onSuccess: (response: unknown) => void;
      };
      options.onSuccess({ access_token: "my-token", expires_in: 3600 });
    });

    expect(screen.getByTestId("token").textContent).toBe("my-token");

    // Then sign out
    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });

  it("should not remount children when googleClientId changes", async () => {
    let mountCount = 0;
    function CountingChild() {
      mountCount++;
      const { accessToken } = useAuth();
      return <span data-testid="child-token">{accessToken ?? "null"}</span>;
    }

    render(
      <AuthProvider>
        <CountingChild />
      </AuthProvider>,
    );

    const initialMountCount = mountCount;

    // Simulate clientId change (e.g., user sets a new client ID)
    await act(async () => {
      localStorage.setItem("google_client_id", "new-client-id");
      window.dispatchEvent(new Event("google_client_id_changed"));
    });

    // Children should NOT have remounted
    expect(mountCount).toBe(initialMountCount);
  });

  it("should provide null accessToken when no googleClientId is configured", () => {
    localStorage.removeItem("google_client_id");
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("token").textContent).toBe("null");
    // No Google login should be attempted
    expect(mockLogin).not.toHaveBeenCalled();
  });
});
