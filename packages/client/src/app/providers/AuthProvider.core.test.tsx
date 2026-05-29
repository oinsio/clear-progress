import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGoogleOAuthMock,
  getGoogleLoginOptions,
  mockGoogleLogin,
} from "@/test/mocks/googleOAuthMock";

vi.mock("@react-oauth/google", () => createGoogleOAuthMock());

const { mockGetAccessToken } = vi.hoisted(() => ({
  mockGetAccessToken: vi.fn().mockReturnValue(null),
}));

vi.mock("@/services/tokenManager", () => ({
  setAccessToken: vi.fn(),
  getAccessToken: () => mockGetAccessToken(),
  configureTokenPersistence: vi.fn(),
}));

vi.mock("@/services/tokenPersistence", () => ({
  localStoragePersistence: { save: vi.fn(), load: vi.fn(), clear: vi.fn() },
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

import { setAccessToken } from "@/services/tokenManager";
import { AuthProvider, useAuth } from "./AuthProvider";
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

    await act(async () => {
      mockGetConnectionConfig.mockReturnValue({
        type: "gas",
        url: "https://script.google.com/macros/s/test/exec",
        clientId: "new-client-id",
      });
      window.dispatchEvent(new Event("google_client_id_changed"));
    });

    expect(mountCount).toBe(initialMountCount);
  });

  it("should provide null accessToken when no googleClientId is configured", () => {
    mockGetConnectionConfig.mockReturnValue(null);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(mockGoogleLogin).not.toHaveBeenCalled();
  });
});

describe("AuthProvider — login & sign-out", () => {
  beforeEach(() => {
    resetAuthMocks({ mockGetConnectionConfig, mockGetAccessToken });
  });

  it("should call the Google login function when signIn is invoked", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    mockGoogleLogin.mockClear();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });

    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
  });

  it("should update accessToken after successful Google login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      getGoogleLoginOptions().onSuccess({
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
      getGoogleLoginOptions().onSuccess({
        access_token: "my-token",
        expires_in: 3600,
      });
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

  it("should clear accessToken and userEmail when signOut is invoked", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      getGoogleLoginOptions().onSuccess({
        access_token: "my-token",
        expires_in: 3600,
      });
    });

    expect(screen.getByTestId("token").textContent).toBe("my-token");

    const user = userEvent.setup();
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(screen.getByTestId("email").textContent).toBe("null");
  });

  it("should call setAccessToken(null) and clear state when explicit login fails", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      getGoogleLoginOptions().onSuccess({
        access_token: "my-token",
        expires_in: 3600,
      });
    });
    expect(screen.getByTestId("token").textContent).toBe("my-token");

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "sign-in" }));
    });
    await act(async () => {
      getGoogleLoginOptions().onError();
    });

    expect(screen.getByTestId("token").textContent).toBe("null");
    expect(setAccessToken).toHaveBeenLastCalledWith(null);
  });
});
