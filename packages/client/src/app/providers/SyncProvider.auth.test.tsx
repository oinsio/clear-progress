import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_REQUIRED_EVENT,
  MAX_SILENT_REFRESH_ATTEMPTS,
  SYNC_INTERVAL_MS,
} from "@/constants";

vi.mock("@/app/providers/AuthProvider");
vi.mock("@/services/SyncService");
vi.mock("@/services/defaultServices");
import "@/test/helpers/mockRepositories";

import { useAuth } from "@/app/providers/AuthProvider";
import { renderProvider, setupBeforeEach } from "./SyncProvider.test-helpers";
import {
  mockPull,
  mockPush,
  mockSignOut,
  mockSilentRefresh,
} from "./SyncProvider.test-mocks";

class MockApiAuthError extends Error {
  constructor() {
    super("ApiAuthError");
    this.name = "ApiAuthError";
  }
}

beforeEach(() => setupBeforeEach());
afterEach(() => vi.useRealTimers());

function mockUnauthenticated() {
  vi.mocked(useAuth).mockReturnValue({
    accessToken: null,
    authProvider: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: mockSignOut,
    silentRefresh: mockSilentRefresh,
  });
}

describe("SyncProvider — auth gate", () => {
  it("should not call push or pull when accessToken is null", async () => {
    mockUnauthenticated();
    renderProvider();
    await act(async () => {});
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPull).not.toHaveBeenCalled();
  });

  it("should not start periodic sync interval when accessToken is null", async () => {
    mockUnauthenticated();
    renderProvider();
    await act(async () => {});
    vi.clearAllMocks();
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should call silentRefresh (not signOut) when sync throws ApiAuthError", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    renderProvider();
    await act(async () => {});
    expect(mockSilentRefresh).toHaveBeenCalledTimes(1);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("should not set error status when sync throws ApiAuthError", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    renderProvider();
    await act(async () => {});
    expect(screen.getByTestId("status").textContent).not.toBe("error");
  });

  it("should call signOut (not silentRefresh) after MAX_SILENT_REFRESH_ATTEMPTS consecutive auth errors", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    renderProvider();
    await act(async () => {});
    for (let i = 1; i < MAX_SILENT_REFRESH_ATTEMPTS; i++) {
      await act(async () => {
        vi.advanceTimersByTime(SYNC_INTERVAL_MS);
      });
    }
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSilentRefresh).toHaveBeenCalledTimes(
      MAX_SILENT_REFRESH_ATTEMPTS - 1,
    );
  });

  it("should reset attempt counter after successful sync and not call signOut on next auth error", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    renderProvider();
    await act(async () => {});

    mockPull.mockResolvedValue(undefined);
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });

    mockPull.mockRejectedValue(new MockApiAuthError());
    await act(async () => {
      vi.advanceTimersByTime(SYNC_INTERVAL_MS);
    });

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockSilentRefresh).toHaveBeenCalledTimes(2);
  });
});

describe("SyncProvider — AUTH_REQUIRED_EVENT", () => {
  it("should dispatch AUTH_REQUIRED_EVENT after max silent refresh attempts exhausted", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    const authRequiredEvents: string[] = [];
    const handler = () => {
      authRequiredEvents.push(AUTH_REQUIRED_EVENT);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, handler);

    renderProvider();
    await act(async () => {});
    for (let i = 1; i < MAX_SILENT_REFRESH_ATTEMPTS; i++) {
      await act(async () => {
        vi.advanceTimersByTime(SYNC_INTERVAL_MS);
      });
    }

    expect(authRequiredEvents).toContain(AUTH_REQUIRED_EVENT);
    window.removeEventListener(AUTH_REQUIRED_EVENT, handler);
  });

  it("should NOT dispatch AUTH_REQUIRED_EVENT on the first auth error", async () => {
    mockPull.mockRejectedValue(new MockApiAuthError());
    const authRequiredEvents: string[] = [];
    const handler = () => {
      authRequiredEvents.push(AUTH_REQUIRED_EVENT);
    };
    window.addEventListener(AUTH_REQUIRED_EVENT, handler);

    renderProvider();
    await act(async () => {});

    expect(authRequiredEvents).toHaveLength(0);
    window.removeEventListener(AUTH_REQUIRED_EVENT, handler);
  });
});
