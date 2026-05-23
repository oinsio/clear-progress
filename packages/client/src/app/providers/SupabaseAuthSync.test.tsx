import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { act, render } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/tokenManager", () => ({
  setAccessToken: vi.fn(),
  shouldRefreshToken: vi.fn(),
}));

import { setAccessToken } from "@/services/tokenManager";
import { SupabaseAuthSync } from "./SupabaseAuthSync";

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;

function createMockSupabaseClient() {
  let authCallback: AuthCallback | null = null;
  const unsubscribe = vi.fn();

  const mockClient = {
    auth: {
      onAuthStateChange: vi.fn((callback: AuthCallback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
  };

  function fireAuthEvent(event: AuthChangeEvent, session: Session | null) {
    if (authCallback) {
      authCallback(event, session);
    }
  }

  return { mockClient, fireAuthEvent, unsubscribe };
}

function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: "user-123",
      aud: "authenticated",
      role: "authenticated",
      email: "test@example.com",
      app_metadata: {},
      user_metadata: {},
      created_at: "2025-01-01T00:00:00.000Z",
    },
    ...overrides,
  } as Session;
}

function makeRefs() {
  return {
    signInRef: { current: () => {} } as React.MutableRefObject<() => void>,
    signOutRef: { current: () => {} } as React.MutableRefObject<() => void>,
    silentRefreshRef: { current: () => {} } as React.MutableRefObject<
      () => void
    >,
  };
}

describe("SupabaseAuthSync", () => {
  let onTokenUpdate: ReturnType<typeof vi.fn>;
  let onUserEmailUpdate: ReturnType<typeof vi.fn>;
  let onUserPictureUpdate: ReturnType<typeof vi.fn>;
  let onClear: ReturnType<typeof vi.fn>;
  let refs: ReturnType<typeof makeRefs>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem("user_picture");
    onTokenUpdate = vi.fn();
    onUserEmailUpdate = vi.fn();
    onUserPictureUpdate = vi.fn();
    onClear = vi.fn();
    refs = makeRefs();
  });

  function renderSync(supabaseClient = createMockSupabaseClient().mockClient) {
    return render(
      <SupabaseAuthSync
        supabaseClient={supabaseClient as never}
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
    const { mockClient } = createMockSupabaseClient();
    const { container } = renderSync(mockClient);
    expect(container).toBeEmptyDOMElement();
  });

  it("should subscribe to onAuthStateChange on mount", () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);
    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("should unsubscribe from onAuthStateChange on unmount", () => {
    const { mockClient, unsubscribe } = createMockSupabaseClient();
    const { unmount } = renderSync(mockClient);
    act(() => {
      unmount();
    });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("should call onTokenUpdate when SIGNED_IN event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession();
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(onTokenUpdate).toHaveBeenCalledWith("test-access-token", 3600);
  });

  it("should call setAccessToken when SIGNED_IN event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession();
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(setAccessToken).toHaveBeenCalledWith("test-access-token", 3600);
  });

  // FR2: profile extraction on SIGNED_IN
  it("should call onUserEmailUpdate with session email on SIGNED_IN", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        id: "user-123",
        aud: "authenticated",
        role: "authenticated",
        email: "user@google.com",
        app_metadata: {},
        user_metadata: {},
        created_at: "2025-01-01T00:00:00.000Z",
      },
    });
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(onUserEmailUpdate).toHaveBeenCalledWith("user@google.com");
  });

  it("should call onUserPictureUpdate with avatar_url on SIGNED_IN", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        id: "user-123",
        aud: "authenticated",
        role: "authenticated",
        email: "test@example.com",
        app_metadata: {},
        user_metadata: { avatar_url: "https://example.com/avatar.jpg" },
        created_at: "2025-01-01T00:00:00.000Z",
      },
    });
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(onUserPictureUpdate).toHaveBeenCalledWith(
      "https://example.com/avatar.jpg",
    );
  });

  // FR2: fallback to user_metadata.picture
  it("should fallback to user_metadata.picture when avatar_url is absent", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        ...createMockSession().user,
        user_metadata: { picture: "https://example.com/fallback.jpg" },
      },
    } as Partial<Session>);
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(onUserPictureUpdate).toHaveBeenCalledWith(
      "https://example.com/fallback.jpg",
    );
  });

  // FR3: INITIAL_SESSION profile extraction
  it("should extract profile on INITIAL_SESSION when no cached picture", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        ...createMockSession().user,
        email: "initial@example.com",
        user_metadata: { avatar_url: "https://example.com/initial-avatar.jpg" },
      },
    } as Partial<Session>);
    act(() => {
      fireAuthEvent("INITIAL_SESSION", session);
    });

    expect(onUserEmailUpdate).toHaveBeenCalledWith("initial@example.com");
    expect(onUserPictureUpdate).toHaveBeenCalledWith(
      "https://example.com/initial-avatar.jpg",
    );
  });

  // FR3: INITIAL_SESSION with cached picture
  it("should not call onUserPictureUpdate on INITIAL_SESSION when picture is cached", () => {
    localStorage.setItem("user_picture", "https://cached.com/old.jpg");
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        ...createMockSession().user,
        email: "cached@example.com",
        user_metadata: { avatar_url: "https://example.com/new-avatar.jpg" },
      },
    } as Partial<Session>);
    act(() => {
      fireAuthEvent("INITIAL_SESSION", session);
    });

    expect(onUserEmailUpdate).toHaveBeenCalledWith("cached@example.com");
    expect(onUserPictureUpdate).not.toHaveBeenCalled();
  });

  // FR4: TOKEN_REFRESHED skips profile extraction
  it("should not call profile callbacks on TOKEN_REFRESHED", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      user: {
        ...createMockSession().user,
        email: "user@example.com",
        user_metadata: { avatar_url: "https://example.com/avatar.jpg" },
      },
    } as Partial<Session>);
    act(() => {
      fireAuthEvent("TOKEN_REFRESHED", session);
    });

    expect(onUserEmailUpdate).not.toHaveBeenCalled();
    expect(onUserPictureUpdate).not.toHaveBeenCalled();
    expect(onTokenUpdate).toHaveBeenCalled();
  });

  it("should call onClear when SIGNED_OUT event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      fireAuthEvent("SIGNED_OUT", null);
    });

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("should call setAccessToken(null) when SIGNED_OUT event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      fireAuthEvent("SIGNED_OUT", null);
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should call onTokenUpdate when TOKEN_REFRESHED event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession({
      access_token: "refreshed-token",
      expires_in: 7200,
    });
    act(() => {
      fireAuthEvent("TOKEN_REFRESHED", session);
    });

    expect(onTokenUpdate).toHaveBeenCalledWith("refreshed-token", 7200);
  });

  it("should not call onTokenUpdate when SIGNED_IN fires with null session", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      fireAuthEvent("SIGNED_IN", null);
    });

    expect(onTokenUpdate).not.toHaveBeenCalled();
  });

  it("should populate signInRef with OAuth sign-in function", () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      refs.signInRef.current();
    });

    expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
  });

  it("should populate signOutRef with sign-out function", async () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);

    await act(async () => {
      refs.signOutRef.current();
    });

    expect(mockClient.auth.signOut).toHaveBeenCalledTimes(1);
  });

  // FR5: signOut clears avatar cache
  it("should remove USER_PICTURE from localStorage on signOut", async () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);

    localStorage.setItem("user_picture", "https://example.com/avatar.jpg");

    await act(async () => {
      refs.signOutRef.current();
    });

    expect(localStorage.getItem("user_picture")).toBeNull();
  });

  it("should populate silentRefreshRef with refresh function", async () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);

    await act(async () => {
      refs.silentRefreshRef.current();
    });

    expect(mockClient.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("should call onClear on unmount", () => {
    const { mockClient } = createMockSupabaseClient();
    const { unmount } = renderSync(mockClient);

    act(() => {
      unmount();
    });

    expect(onClear).toHaveBeenCalled();
  });

  it("should call setAccessToken(null) on unmount", () => {
    const { mockClient } = createMockSupabaseClient();
    const { unmount } = renderSync(mockClient);

    act(() => {
      unmount();
    });

    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it("should not call onClear when SIGNED_IN event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    const session = createMockSession();
    act(() => {
      fireAuthEvent("SIGNED_IN", session);
    });

    expect(onClear).not.toHaveBeenCalled();
  });

  it("should not call onTokenUpdate when SIGNED_OUT event fires", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      fireAuthEvent("SIGNED_OUT", null);
    });

    expect(onTokenUpdate).not.toHaveBeenCalled();
  });

  it("should not call onTokenUpdate or onClear for unhandled events", () => {
    const { mockClient, fireAuthEvent } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      fireAuthEvent("USER_UPDATED" as never, createMockSession());
    });

    expect(onTokenUpdate).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it("should pass provider google and redirectTo to signInWithOAuth", () => {
    const { mockClient } = createMockSupabaseClient();
    renderSync(mockClient);

    act(() => {
      refs.signInRef.current();
    });

    expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: expect.stringContaining("/setup") },
    });
  });

  it("should re-subscribe when supabaseClient changes", () => {
    const { mockClient: firstClient, unsubscribe: firstUnsubscribe } =
      createMockSupabaseClient();
    const { mockClient: secondClient } = createMockSupabaseClient();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={firstClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={secondClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    expect(firstUnsubscribe).toHaveBeenCalledTimes(1);
    expect(secondClient.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("should re-subscribe when onTokenUpdate changes", () => {
    const { mockClient, unsubscribe } = createMockSupabaseClient();
    const newOnTokenUpdate = vi.fn();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={newOnTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledTimes(2);
  });

  it("should re-subscribe when onClear changes", () => {
    const { mockClient, unsubscribe } = createMockSupabaseClient();
    const newOnClear = vi.fn();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={newOnClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledTimes(2);
  });

  it("should use updated supabaseClient for signIn after rerender", () => {
    const { mockClient: firstClient } = createMockSupabaseClient();
    const { mockClient: secondClient } = createMockSupabaseClient();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={firstClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={secondClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    act(() => {
      refs.signInRef.current();
    });

    expect(secondClient.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(firstClient.auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("should use updated supabaseClient for signOut after rerender", async () => {
    const { mockClient: firstClient } = createMockSupabaseClient();
    const { mockClient: secondClient } = createMockSupabaseClient();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={firstClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={secondClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    await act(async () => {
      refs.signOutRef.current();
    });

    expect(secondClient.auth.signOut).toHaveBeenCalledTimes(1);
    expect(firstClient.auth.signOut).not.toHaveBeenCalled();
  });

  it("should use updated supabaseClient for silentRefresh after rerender", async () => {
    const { mockClient: firstClient } = createMockSupabaseClient();
    const { mockClient: secondClient } = createMockSupabaseClient();

    const { rerender } = render(
      <SupabaseAuthSync
        supabaseClient={firstClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    rerender(
      <SupabaseAuthSync
        supabaseClient={secondClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    await act(async () => {
      refs.silentRefreshRef.current();
    });

    expect(secondClient.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(firstClient.auth.refreshSession).not.toHaveBeenCalled();
  });

  it("should call updated onClear on unmount after prop change", () => {
    const { mockClient } = createMockSupabaseClient();
    const newOnClear = vi.fn();

    const { rerender, unmount } = render(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={onClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    // When onClear changes, the old cleanup runs (calling old onClear)
    // and then new effect is set up with new onClear
    onClear.mockClear();

    rerender(
      <SupabaseAuthSync
        supabaseClient={mockClient as never}
        onTokenUpdate={onTokenUpdate}
        onUserEmailUpdate={onUserEmailUpdate}
        onUserPictureUpdate={onUserPictureUpdate}
        onClear={newOnClear}
        signInRef={refs.signInRef}
        signOutRef={refs.signOutRef}
        silentRefreshRef={refs.silentRefreshRef}
      />,
    );

    // Old onClear was called during cleanup of previous effect
    expect(onClear).toHaveBeenCalledTimes(1);
    newOnClear.mockClear();

    act(() => {
      unmount();
    });

    // New onClear is called on final unmount
    expect(newOnClear).toHaveBeenCalled();
  });
});
