// implements sync-orchestration of sync-update
import { cleanup, render } from "@testing-library/react/pure";
import type React from "react";
import { expect, vi } from "vitest";
import { AlertProvider } from "@/app/providers/AlertProvider";
import { AuthProvider, useAuth } from "@/app/providers/AuthProvider";
import { SyncProvider, useSync } from "@/app/providers/SyncProvider";
import type { SyncTestContext } from "./types";

const {
  mockPing,
  mockInit,
  mockPull,
  mockPush,
  mockResetAndPull,
  mockInitializeLocalFiles,
  mockFileSync,
  mockEnsureServerFilesAreCached,
  mockReuploadLocalFiles,
  mockSignOut,
  mockSilentRefresh,
  STABLE_CONNECTION_CONFIG,
  STABLE_AUTH_VALUE,
} = vi.hoisted(() => {
  const signOut = vi.fn();
  const silentRefresh = vi.fn();
  return {
    mockPing: vi.fn(),
    mockInit: vi.fn(),
    mockPull: vi.fn(),
    mockPush: vi.fn(),
    mockResetAndPull: vi.fn(),
    mockInitializeLocalFiles: vi.fn().mockResolvedValue(undefined),
    mockFileSync: vi.fn().mockResolvedValue(undefined),
    mockEnsureServerFilesAreCached: vi.fn().mockResolvedValue(undefined),
    mockReuploadLocalFiles: vi.fn().mockResolvedValue(undefined),
    mockSignOut: signOut,
    mockSilentRefresh: silentRefresh,
    STABLE_CONNECTION_CONFIG: {
      type: "supabase" as const,
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
    },
    STABLE_AUTH_VALUE: {
      accessToken: "mock-token",
      authProvider: null,
      userEmail: "test@example.com",
      userPicture: null,
      signIn: vi.fn(),
      signOut: signOut,
      silentRefresh: silentRefresh,
    },
  };
});

export {
  mockEnsureServerFilesAreCached,
  mockFileSync,
  mockInit,
  mockInitializeLocalFiles,
  mockPing,
  mockPull,
  mockPush,
  mockResetAndPull,
  mockReuploadLocalFiles,
  mockSignOut,
  mockSilentRefresh,
  STABLE_AUTH_VALUE,
  STABLE_CONNECTION_CONFIG,
};

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => STABLE_AUTH_VALUE),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: vi.fn(() => STABLE_CONNECTION_CONFIG),
}));

vi.mock("@/services/SyncService", () => {
  class MockSyncService {
    pull = mockPull;
    push = mockPush;
    resetAndPull = mockResetAndPull;
    lastSyncAlerts: unknown[] = [];
    lastPulledTasks: unknown[] = [];
  }
  return { SyncService: MockSyncService };
});

vi.mock("@/services/defaultServices", () => ({
  defaultSyncAdapter: {
    ping: mockPing,
    init: mockInit,
  },
  defaultFileSyncService: {
    initializeLocalFiles: mockInitializeLocalFiles,
    sync: mockFileSync,
    ensureServerFilesAreCached: mockEnsureServerFilesAreCached,
    reuploadLocalFiles: mockReuploadLocalFiles,
  },
}));

import "@/test/helpers/mockRepositories";

export const cleanupRender = cleanup;

function SyncStatusDisplay() {
  const { syncStatus } = useSync();
  return <div data-testid="status">{syncStatus}</div>;
}

function SyncMethodTrigger() {
  const { pull, schedulePush, triggerFullSync } = useSync();
  return (
    <>
      <button data-testid="pull-btn" onClick={() => void pull()}>
        pull
      </button>
      <button data-testid="schedule-btn" onClick={schedulePush}>
        schedule
      </button>
      <button
        data-testid="full-sync-btn"
        onClick={() => void triggerFullSync(() => {})}
      >
        full sync
      </button>
    </>
  );
}

export function renderSyncProvider() {
  return render(
    <AuthProvider>
      <AlertProvider>
        <SyncProvider>
          <SyncStatusDisplay />
          <SyncMethodTrigger />
        </SyncProvider>
      </AlertProvider>
    </AuthProvider>,
  );
}

export function renderSyncProviderForFullSync(
  onProgress: (step: import("@/types/common").FullSyncStep) => void,
) {
  function FullSyncTrigger() {
    const { triggerFullSync, pull } = useSync();
    return (
      <>
        <button
          data-testid="full-sync-btn"
          onClick={() => void triggerFullSync(onProgress)}
        >
          full sync
        </button>
        <button data-testid="pull-btn" onClick={() => void pull()}>
          pull
        </button>
      </>
    );
  }

  return render(
    <AuthProvider>
      <AlertProvider>
        <SyncProvider>
          <SyncStatusDisplay />
          <FullSyncTrigger />
        </SyncProvider>
      </AlertProvider>
    </AuthProvider>,
  );
}

export async function flushSyncCycle() {
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
}

export function expectSyncCycleExecuted(context: SyncTestContext) {
  expect(context.mockPush).toHaveBeenCalled();
  expect(context.mockPull).toHaveBeenCalled();
}

export function expectSyncCycleExecutedTimes(
  context: SyncTestContext,
  count: number,
) {
  expect(context.mockPush).toHaveBeenCalledTimes(count);
  expect(context.mockPull).toHaveBeenCalledTimes(count);
}

export function expectNoSyncCycle(context: SyncTestContext) {
  expect(context.mockPush).not.toHaveBeenCalled();
  expect(context.mockPull).not.toHaveBeenCalled();
}

export function restoreUseAuthMock() {
  vi.mocked(useAuth).mockReturnValue(STABLE_AUTH_VALUE);
}

export function setUseAuthNoToken() {
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
