import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import type React from "react";
import { GoogleAuthSync } from "./GoogleAuthSync";

const mockLogin = vi.fn();

vi.mock("@react-oauth/google", () => ({
  useGoogleLogin: vi.fn(
    (options: { onSuccess: (r: unknown) => void; onError: () => void }) => {
      (globalThis as Record<string, unknown>).__googleLoginOptions = options;
      return mockLogin;
    },
  ),
}));

vi.mock("@/services/ApiClient", () => ({
  setAccessToken: vi.fn(),
}));

import { setAccessToken } from "@/services/ApiClient";

const TOKEN_RESPONSE = { access_token: "test-token", expires_in: 3600 };

function makeRefs() {
  return {
    signInRef: { current: () => {} } as React.MutableRefObject<() => void>,
    signOutRef: { current: () => {} } as React.MutableRefObject<() => void>,
    silentRefreshRef: { current: () => {} } as React.MutableRefObject<() => void>,
  };
}

function getLoginOptions() {
  return (globalThis as Record<string, unknown>).__googleLoginOptions as {
    onSuccess: (r: unknown) => void;
    onError: () => void;
  };
}

describe("GoogleAuthSync", () => {
  let onTokenUpdate: ReturnType<typeof vi.fn>;
  let onUserEmailUpdate: ReturnType<typeof vi.fn>;
  let onUserPictureUpdate: ReturnType<typeof vi.fn>;
  let onClear: ReturnType<typeof vi.fn>;
  let refs: ReturnType<typeof makeRefs>;

  beforeEach(() => {
    vi.clearAllMocks();
    onTokenUpdate = vi.fn();
    onUserEmailUpdate = vi.fn();
    onUserPictureUpdate = vi.fn();
    onClear = vi.fn();
    refs = makeRefs();
    delete (globalThis as Record<string, unknown>).__googleLoginOptions;
  });

  function renderSync() {
    return render(
      <GoogleAuthSync
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );
  }

  it("should render nothing (return null)", () => {
    const { container } = renderSync();
    expect(container).toBeEmptyDOMElement();
  });

  it("should attempt silent refresh on mount", () => {
    renderSync();
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should call onTokenUpdate and setAccessToken on successful login", async () => {
    renderSync();
    await act(async () => {
      getLoginOptions().onSuccess(TOKEN_RESPONSE);
    });
    expect(onTokenUpdate).toHaveBeenCalledWith("test-token", 3600);
    expect(setAccessToken).toHaveBeenCalledWith("test-token", 3600);
  });

  it("should NOT call onClear or setAccessToken(null) when silent refresh fails", async () => {
    renderSync();
    // On mount isSilentRef.current = true — silent mode
    await act(async () => {
      getLoginOptions().onError();
    });
    expect(onClear).not.toHaveBeenCalled();
    expect(setAccessToken).not.toHaveBeenCalledWith(null);
  });

  it("should call onClear and setAccessToken(null) when explicit login fails", async () => {
    renderSync();
    // Switch to explicit login mode
    act(() => {
      refs.signInRef.current();
    });
    await act(async () => {
      getLoginOptions().onError();
    });
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should populate signInRef with explicit (non-silent) login function", () => {
    renderSync();
    mockLogin.mockClear();
    act(() => {
      refs.signInRef.current();
    });
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).not.toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should populate signOutRef that clears auth state", () => {
    renderSync();
    act(() => {
      refs.signOutRef.current();
    });
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should populate silentRefreshRef that triggers silent login", () => {
    renderSync();
    mockLogin.mockClear();
    act(() => {
      refs.silentRefreshRef.current();
    });
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({ prompt: "none" });
  });

  it("should call onClear on unmount", () => {
    const { unmount } = renderSync();
    act(() => {
      unmount();
    });
    expect(onClear).toHaveBeenCalled();
  });

  it("should not fetch user info during silent login", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    renderSync();
    // On mount isSilentRef.current = true — silent mode
    await act(async () => {
      getLoginOptions().onSuccess(TOKEN_RESPONSE);
    });
    expect(onTokenUpdate).toHaveBeenCalledWith("test-token", 3600);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should fetch user picture during explicit login when not cached", async () => {
    localStorage.removeItem("user_picture");
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ picture: "https://example.com/pic.jpg" }),
    } as Response);

    renderSync();
    // Switch to explicit mode
    act(() => {
      refs.signInRef.current();
    });
    await act(async () => {
      getLoginOptions().onSuccess(TOKEN_RESPONSE);
    });
    expect(fetchSpy).toHaveBeenCalled();
    expect(onUserPictureUpdate).toHaveBeenCalledWith("https://example.com/pic.jpg");
  });

  it("should not fetch user picture if already cached in localStorage", async () => {
    localStorage.setItem("user_picture", "https://cached.com/pic.jpg");
    const fetchSpy = vi.spyOn(global, "fetch");

    renderSync();
    // Switch to explicit mode
    act(() => {
      refs.signInRef.current();
    });
    await act(async () => {
      getLoginOptions().onSuccess(TOKEN_RESPONSE);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onUserPictureUpdate).not.toHaveBeenCalled();
  });
});
