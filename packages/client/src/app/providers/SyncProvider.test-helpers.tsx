import { render } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "@/app/providers/AuthProvider";
import type { FullSyncStep } from "@/types/common";
import { SyncProvider, useSync } from "./SyncProvider";
import {
  mockFileEnsureServerFiles,
  mockFileReuploadLocalFiles,
  mockFileSync,
  mockInit,
  mockInitializeLocalFiles,
  mockPing,
  mockPull,
  mockPush,
  mockResetAndPull,
  mockSignOut,
  mockSilentRefresh,
} from "./SyncProvider.test-mocks";

export const VALID_PING_INITIALIZED = {
  ok: true,
  app: "Clear Progress",
  version: "1.0",
  initialized: true,
};

export const VALID_PING_NOT_INITIALIZED = {
  ok: true,
  app: "Clear Progress",
  version: "1.0",
  initialized: false,
};

export function setupBeforeEach() {
  vi.clearAllMocks();
  vi.useFakeTimers();

  localStorage.setItem(
    "connection_config",
    JSON.stringify({
      type: "gas",
      url: "https://test.example.com",
      isActive: true,
    }),
  );

  mockPull.mockResolvedValue(undefined);
  mockPush.mockResolvedValue(undefined);
  mockResetAndPull.mockResolvedValue(undefined);
  mockPing.mockResolvedValue(VALID_PING_INITIALIZED);
  mockInit.mockResolvedValue({ ok: true });
  mockInitializeLocalFiles.mockResolvedValue(undefined);
  mockFileSync.mockResolvedValue(undefined);
  mockFileReuploadLocalFiles.mockResolvedValue(undefined);
  mockFileEnsureServerFiles.mockResolvedValue(undefined);

  vi.mocked(useAuth).mockReturnValue({
    accessToken: "mock-token",
    authProvider: null,
    userEmail: "test@example.com",
    userPicture: null,
    signIn: vi.fn(),
    signOut: mockSignOut,
    silentRefresh: mockSilentRefresh,
  });

  setNavigatorOnline();
}

export function SyncStatusDisplay() {
  const { syncStatus } = useSync();
  return <div data-testid="status">{syncStatus}</div>;
}

export function SyncVersionDisplay() {
  const { syncVersion } = useSync();
  return <div data-testid="version">{syncVersion}</div>;
}

export function SyncMethodTrigger({ method }: { method: "pull" | "push" }) {
  const syncCtx = useSync();
  return (
    <button
      data-testid={`${method}-btn`}
      onClick={() => void syncCtx[method]()}
    >
      {method}
    </button>
  );
}

export function SchedulePushTrigger() {
  const { schedulePush } = useSync();
  return (
    <button data-testid="schedule-btn" onClick={schedulePush}>
      schedule
    </button>
  );
}

export function FullSyncTrigger({
  onProgress,
  testId = "full-sync-btn",
}: {
  onProgress: (step: FullSyncStep) => void;
  testId?: string;
}) {
  const { triggerFullSync } = useSync();
  return (
    <button
      data-testid={testId}
      onClick={() => void triggerFullSync(onProgress)}
    >
      full sync
    </button>
  );
}

export function setNavigatorOffline() {
  Object.defineProperty(navigator, "onLine", {
    value: false,
    writable: true,
    configurable: true,
  });
}

export function setNavigatorOnline() {
  Object.defineProperty(navigator, "onLine", {
    value: true,
    writable: true,
    configurable: true,
  });
}

export function renderProvider() {
  return render(
    <SyncProvider>
      <SyncStatusDisplay />
    </SyncProvider>,
  );
}

export function renderProviderWithVersion() {
  return render(
    <SyncProvider>
      <SyncVersionDisplay />
    </SyncProvider>,
  );
}

export function renderProviderWithMethod(method: "pull" | "push") {
  return render(
    <SyncProvider>
      <SyncMethodTrigger method={method} />
    </SyncProvider>,
  );
}

export function renderProviderWithScheduler() {
  return render(
    <SyncProvider>
      <SchedulePushTrigger />
    </SyncProvider>,
  );
}
