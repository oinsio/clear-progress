import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { AlertProvider } from "@/app/providers/AlertProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import { mockSettingsGetValue } from "@/test/helpers/mockRepositories";
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
      activeType: "supabase",
      configs: {
        supabase: {
          url: "https://test.supabase.co",
          anonKey: "test-anon-key",
        },
      },
    }),
  );

  mockSettingsGetValue.mockReset();
  mockSettingsGetValue.mockResolvedValue(undefined);
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

export function LastSyncDisplay() {
  const { lastSyncedAt } = useSync();
  return <div data-testid="last-sync">{lastSyncedAt ?? ""}</div>;
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

/**
 * Clears all mock call history and re-applies the default resolved values
 * for mockPush/mockPull — the reset step every propagation test repeats
 * between "prime the initial state" and "assert the new timing takes effect".
 */
export function resetSyncMocks(): void {
  vi.clearAllMocks();
  mockPush.mockResolvedValue(undefined);
  mockPull.mockResolvedValue(undefined);
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
    <AlertProvider>
      <SyncProvider>
        <SyncStatusDisplay />
      </SyncProvider>
    </AlertProvider>,
  );
}

export function renderProviderWithVersion() {
  return render(
    <AlertProvider>
      <SyncProvider>
        <SyncVersionDisplay />
      </SyncProvider>
    </AlertProvider>,
  );
}

export function renderProviderWithMethod(method: "pull" | "push") {
  return render(
    <AlertProvider>
      <SyncProvider>
        <SyncMethodTrigger method={method} />
      </SyncProvider>
    </AlertProvider>,
  );
}

export function renderProviderWithScheduler() {
  return render(
    <AlertProvider>
      <SyncProvider>
        <SchedulePushTrigger />
      </SyncProvider>
    </AlertProvider>,
  );
}

/**
 * Renders the scheduler provider and lets its initial async setup (settings
 * read, auth check) settle — the render+flush step every schedulePush test
 * repeats before it can safely inspect or trigger scheduling behavior.
 */
export async function renderSchedulerSettled(): Promise<
  ReturnType<typeof renderProviderWithScheduler>
> {
  const utils = renderProviderWithScheduler();
  await act(async () => {});
  return utils;
}

/**
 * Same as {@link renderSchedulerSettled}, but also clears mock call history
 * and re-applies default resolved values — the full setup every schedulePush
 * test repeats before triggering and asserting on a new scheduling call.
 */
export async function renderSchedulerReady(): Promise<
  ReturnType<typeof renderProviderWithScheduler>
> {
  const utils = await renderSchedulerSettled();
  resetSyncMocks();
  return utils;
}
