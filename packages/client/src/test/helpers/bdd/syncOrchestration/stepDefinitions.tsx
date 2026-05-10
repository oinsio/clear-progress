// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";

export const cleanupRender = cleanup;

import type React from "react";
import { expect, vi } from "vitest";
import { AuthProvider, useAuth } from "@/app/providers/AuthProvider";
import { SyncProvider, useSync } from "@/app/providers/SyncProvider";
import type { SyncTestContext } from "./types";

const {
  mockPing,
  mockInit,
  mockPull,
  mockPush,
  mockResetAndPull,
  mockInitializeLocalCovers,
  mockCoverSync,
  mockEnsureServerCoversAreCached,
  mockReuploadLocalCovers,
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
    mockInitializeLocalCovers: vi.fn(),
    mockCoverSync: vi.fn(),
    mockEnsureServerCoversAreCached: vi.fn(),
    mockReuploadLocalCovers: vi.fn(),
    mockSignOut: signOut,
    mockSilentRefresh: silentRefresh,
    STABLE_CONNECTION_CONFIG: {
      type: "gas" as const,
      url: "https://test.example.com",
      isActive: true,
    },
    STABLE_AUTH_VALUE: {
      accessToken: "mock-token",
      userEmail: "test@example.com",
      userPicture: null,
      signIn: vi.fn(),
      signOut: signOut,
      silentRefresh: silentRefresh,
    },
  };
});

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => STABLE_AUTH_VALUE),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: vi.fn(() => STABLE_CONNECTION_CONFIG),
}));

vi.mock("@/services/SyncService", () => {
  return {
    SyncService: vi.fn().mockImplementation(() => ({
      pull: mockPull,
      push: mockPush,
      resetAndPull: mockResetAndPull,
    })),
  };
});

vi.mock("@/services/defaultServices", () => ({
  defaultSyncAdapter: {
    ping: mockPing,
    init: mockInit,
  },
  defaultCoverSyncService: {
    initializeLocalCovers: mockInitializeLocalCovers,
    sync: mockCoverSync,
    ensureServerCoversAreCached: mockEnsureServerCoversAreCached,
    reuploadLocalCovers: mockReuploadLocalCovers,
  },
}));

vi.mock("@/db/repositories/TaskRepository", () => ({
  TaskRepository: vi.fn(),
}));
vi.mock("@/db/repositories/GoalRepository", () => ({
  GoalRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ContextRepository", () => ({
  ContextRepository: vi.fn(),
}));
vi.mock("@/db/repositories/CategoryRepository", () => ({
  CategoryRepository: vi.fn(),
}));
vi.mock("@/db/repositories/ChecklistRepository", () => ({
  ChecklistRepository: vi.fn(),
}));
vi.mock("@/db/repositories/IdeaRepository", () => ({
  IdeaRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SettingsRepository", () => ({
  SettingsRepository: vi.fn(),
}));
vi.mock("@/db/repositories/SyncMetaRepository", () => ({
  SyncMetaRepository: vi.fn(),
}));

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

// Helper: render SyncProvider with test components
function renderSyncProvider() {
  return render(
    <AuthProvider>
      <SyncProvider>
        <SyncStatusDisplay />
        <SyncMethodTrigger />
      </SyncProvider>
    </AuthProvider>,
  );
}

// Helper: render SyncProvider for full sync with progress tracking
function renderSyncProviderForFullSync(
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
      <SyncProvider>
        <SyncStatusDisplay />
        <FullSyncTrigger />
      </SyncProvider>
    </AuthProvider>,
  );
}

// Helper: flush microtask cycles to let sync chain complete
async function flushSyncCycle() {
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
  await vi.advanceTimersByTimeAsync(0);
}

// Helper: assert sync cycle executed (push + pull)
function expectSyncCycleExecuted(context: SyncTestContext) {
  expect(context.mockPush).toHaveBeenCalled();
  expect(context.mockPull).toHaveBeenCalled();
}

// Helper: assert sync cycle executed N times
function expectSyncCycleExecutedTimes(context: SyncTestContext, count: number) {
  expect(context.mockPush).toHaveBeenCalledTimes(count);
  expect(context.mockPull).toHaveBeenCalledTimes(count);
}

// Helper: assert no sync cycle ran
function expectNoSyncCycle(context: SyncTestContext) {
  expect(context.mockPush).not.toHaveBeenCalled();
  expect(context.mockPull).not.toHaveBeenCalled();
}

export function setupScenarioHooks(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  f.BeforeEachScenario(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset and configure mocks
    f.context.mockPull.mockReset();
    f.context.mockPush.mockReset();
    f.context.mockPing.mockReset();
    f.context.mockInit.mockReset();
    f.context.mockCoverSync.mockReset();
    f.context.mockInitializeLocalCovers.mockReset();
    f.context.mockResetAndPull.mockReset();
    f.context.mockReuploadLocalCovers.mockReset();
    f.context.mockEnsureServerCoversAreCached.mockReset();

    f.context.mockPull.mockResolvedValue(undefined);
    f.context.mockPush.mockResolvedValue(undefined);
    f.context.mockPing.mockResolvedValue({
      ok: true,
      app: "Clear Progress",
      version: "1.0",
      initialized: true,
    });
    f.context.mockInit.mockResolvedValue(undefined);
    f.context.mockCoverSync.mockResolvedValue(undefined);
    f.context.mockInitializeLocalCovers.mockResolvedValue(undefined);
    f.context.mockResetAndPull.mockResolvedValue(undefined);
    f.context.mockReuploadLocalCovers.mockResolvedValue(undefined);
    f.context.mockEnsureServerCoversAreCached.mockResolvedValue(undefined);

    f.context.progressSteps = [];
    f.context.initialSyncVersion = 0;
  });

  f.AfterEachScenario(() => {
    cleanupRender();
    f.context.syncProviderUnmount = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });
}

export function createBackgroundSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  f.context.mockPull = mockPull;
  f.context.mockPush = mockPush;
  f.context.mockPing = mockPing;
  f.context.mockInit = mockInit;
  f.context.mockCoverSync = mockCoverSync;
  f.context.mockInitializeLocalCovers = mockInitializeLocalCovers;
  f.context.mockResetAndPull = mockResetAndPull;
  f.context.mockReuploadLocalCovers = mockReuploadLocalCovers;
  f.context.mockEnsureServerCoversAreCached = mockEnsureServerCoversAreCached;
  f.context.mockSignOut = mockSignOut;
  f.context.mockSilentRefresh = mockSilentRefresh;

  return {
    givenUserIsAuthenticated: (Given: StepTest["Given"]) => {
      Given("user is authenticated with a valid token", () => {
        // Restore useAuth mock after vi.clearAllMocks() — use stable reference
        vi.mocked(useAuth).mockReturnValue(STABLE_AUTH_VALUE);
      });
    },
    givenUserHasNoAccessToken: (Given: StepTest["Given"]) => {
      Given("user has no access token", () => {
        vi.mocked(useAuth).mockReturnValue({
          accessToken: null,
          userEmail: null,
          userPicture: null,
          signIn: vi.fn(),
          signOut: mockSignOut,
          silentRefresh: mockSilentRefresh,
        });
      });
    },
    givenConnectionConfigIsActive: (And: StepTest["Given"]) => {
      And("connection config is active", () => {
        localStorage.setItem(
          "connection_config",
          JSON.stringify(STABLE_CONNECTION_CONFIG),
        );
      });
    },
    givenNavigatorIsOnline: (And: StepTest["Given"]) => {
      And("navigator is online", () => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          configurable: true,
          value: true,
        });
      });
    },
  };
}

export function createGivenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    givenSyncProviderMountedAndInitialSyncCompleted: (
      Given: StepTest["Given"],
    ) => {
      Given("SyncProvider has mounted and initial sync completed", async () => {
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        f.context.initialSyncCallCount = f.context.mockPush.mock.calls.length;
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockCoverSync.mockClear();
      });
    },
    givenNavigatorIsOffline: (Given: StepTest["Given"]) => {
      Given("navigator is offline", () => {
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          configurable: true,
          value: false,
        });
      });
    },
    givenPingIntervalIsActive: (Given: StepTest["Given"]) => {
      Given("ping interval is active", async () => {
        // Set navigator offline to trigger ping interval
        Object.defineProperty(navigator, "onLine", {
          writable: true,
          configurable: true,
          value: false,
        });
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        // Clear mocks after setup
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockInit.mockClear();
      });
    },
  };
}

export function createWhenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    whenSyncProviderMounts: (When: StepTest["When"]) => {
      When("SyncProvider mounts", async () => {
        const { unmount } = renderSyncProvider();
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
      });
    },
    whenTimePassesMinutes: (When: StepTest["When"], minutes: number) => {
      When(`${minutes} minutes pass`, async () => {
        await vi.advanceTimersByTimeAsync(minutes * 60 * 1000);
      });
    },
    whenTimePassesSeconds: (When: StepTest["When"], seconds: number) => {
      When(`${seconds} seconds pass`, async () => {
        await vi.advanceTimersByTimeAsync(seconds * 1000);
      });
    },
    whenUserMutatesLocalData: (When: StepTest["When"]) => {
      When("user mutates local data", async () => {
        const scheduleBtn = screen.getByTestId("schedule-btn");
        scheduleBtn.click();
        await vi.advanceTimersByTimeAsync(0);
        f.context.debouncedSyncStartTime = Date.now();
      });
    },
    whenUserMutatesLocalDataAfterSeconds: (
      And: StepTest["When"],
      seconds: number,
    ) => {
      And(
        `user mutates local data again after ${seconds} seconds`,
        async () => {
          await vi.advanceTimersByTimeAsync(seconds * 1000);
          const scheduleBtn = screen.getByTestId("schedule-btn");
          scheduleBtn.click();
          await vi.advanceTimersByTimeAsync(0);
          f.context.debouncedSyncStartTime = Date.now();
        },
      );
    },
    whenBrowserFiresOnlineEvent: (When: StepTest["When"]) => {
      When('the browser fires the "online" event', async () => {
        window.dispatchEvent(new Event("online"));
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenUserClicksSyncIndicator: (When: StepTest["When"]) => {
      When("user clicks the sync indicator", async () => {
        const pullBtn = screen.getByTestId("pull-btn");
        pullBtn.click();
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenTabBecomesVisible: (When: StepTest["When"]) => {
      When("the tab becomes visible", async () => {
        Object.defineProperty(document, "visibilityState", {
          writable: true,
          configurable: true,
          value: "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenWindowReceivesFocus: (When: StepTest["When"]) => {
      When("the window receives focus", async () => {
        window.dispatchEvent(new Event("focus"));
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenPageshowFiresWithPersistedTrue: (When: StepTest["When"]) => {
      When("pageshow fires with persisted=true", async () => {
        const event = new PageTransitionEvent("pageshow", {
          persisted: true,
        });
        window.dispatchEvent(event);
        await vi.advanceTimersByTimeAsync(0);
      });
    },
    whenSyncFailsWithNetworkError: (And: StepTest["When"]) => {
      And("sync fails with a network error", async () => {
        // Wait for initial sync to complete, then fail
        await flushSyncCycle();
        // Now configure next sync to fail
        f.context.mockPush.mockRejectedValueOnce(new Error("Network error"));
        // Trigger another sync by advancing periodic interval
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
      });
    },
    whenPingSucceedsWithInitializedTrue: (When: StepTest["When"]) => {
      When("ping succeeds with initialized=true", async () => {
        f.context.mockPing.mockResolvedValueOnce({
          ok: true,
          app: "Clear Progress",
          version: "1.0",
          initialized: true,
        });
        // Reset push/pull for clean assertion
        f.context.mockPush.mockResolvedValueOnce(undefined);
        f.context.mockPull.mockResolvedValueOnce(undefined);
        await vi.advanceTimersByTimeAsync(30000);
        await flushSyncCycle();
      });
    },
    whenPingSucceedsWithInitializedFalse: (When: StepTest["When"]) => {
      When("ping succeeds with initialized=false", async () => {
        f.context.mockPing.mockResolvedValueOnce({
          ok: true,
          app: "Clear Progress",
          version: "1.0",
          initialized: false,
        });
        await vi.advanceTimersByTimeAsync(30000);
      });
    },
    whenPingFails: (When: StepTest["When"]) => {
      When("ping fails", async () => {
        f.context.mockPing.mockRejectedValueOnce(new Error("Ping failed"));
        await vi.advanceTimersByTimeAsync(30000);
      });
    },
    whenPingFailsMaxAttemptsTimes: (When: StepTest["When"]) => {
      When("ping fails MAX_PING_ATTEMPTS times consecutively", async () => {
        // MAX_PING_ATTEMPTS = 20
        for (let i = 0; i < 20; i++) {
          f.context.mockPing.mockRejectedValueOnce(new Error("Ping failed"));
          await vi.advanceTimersByTimeAsync(30000);
        }
      });
    },
  };
}

export function createThenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    thenSyncCycleIsExecuted: (Then: StepTest["Then"]) => {
      Then("a sync cycle is executed", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenSyncStatusBecomes: (And: StepTest["Then"], status: string) => {
      And(`sync status becomes "${status}"`, async () => {
        // Flush all pending microtasks and timers to let sync complete
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(0);
        const statusElement = screen.getByTestId("status");
        expect(statusElement.textContent).toBe(status);
      });
    },
    thenPeriodicSyncCyclesExecuted: (Then: StepTest["Then"], count: number) => {
      Then(`${count} periodic sync cycles have executed`, () => {
        expectSyncCycleExecutedTimes(f.context, count);
      });
    },
    thenNoSyncCycleRunsImmediately: (Then: StepTest["Then"]) => {
      Then("no sync cycle runs immediately", () => {
        expectNoSyncCycle(f.context);
      });
    },
    thenAfterSecondsFromLastMutationSyncCycleIsExecuted: (
      Then: StepTest["Then"],
      seconds: number,
    ) => {
      Then(
        `after ${seconds} seconds from the last mutation a sync cycle is executed`,
        async () => {
          await vi.advanceTimersByTimeAsync(seconds * 1000);
          expectSyncCycleExecuted(f.context);
        },
      );
    },
    thenOnlyDebouncedSyncCyclesRan: (And: StepTest["Then"], count: number) => {
      And(`only ${count} debounced sync cycle ran in total`, () => {
        expectSyncCycleExecutedTimes(f.context, count);
      });
    },
    thenPingRequestIsSent: (Then: StepTest["Then"]) => {
      Then("a ping request is sent", async () => {
        await vi.runOnlyPendingTimersAsync();
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenIfPingSucceedsSyncCycleFollows: (And: StepTest["Then"]) => {
      And("if ping succeeds a sync cycle follows", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenRegularSyncCycleIsExecuted: (Then: StepTest["Then"]) => {
      Then("a regular sync cycle is executed (push then pull)", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenThisIsNotFullSync: (And: StepTest["Then"]) => {
      And("this is not a full sync (no force push, no revision reset)", () => {
        expect(f.context.mockPush).toHaveBeenCalledWith();
      });
    },
    thenPingIntervalStarts: (And: StepTest["Then"]) => {
      And("ping interval starts (every 30 seconds)", async () => {
        // Wait for the effect that starts ping interval to run
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(0);
        // Verify ping interval is active by checking if ping fires after 30s
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenPingIntervalIsStopped: (And: StepTest["Then"]) => {
      And("ping interval is stopped", async () => {
        // Wait for performPing to complete and call stopPingInterval
        await vi.runOnlyPendingTimersAsync();
        // Clear ping mock and advance time to verify no more pings
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).not.toHaveBeenCalled();
      });
    },
    thenNoFurtherPingsFire: (And: StepTest["Then"]) => {
      And("no further pings fire", async () => {
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(60000);
        expect(f.context.mockPing).not.toHaveBeenCalled();
      });
    },
    thenInitIsCalled: (Then: StepTest["Then"]) => {
      Then("init() is called", async () => {
        await vi.runOnlyPendingTimersAsync();
        expect(f.context.mockInit).toHaveBeenCalled();
      });
    },
    thenSyncCycleFollows: (And: StepTest["Then"]) => {
      And("a sync cycle follows", async () => {
        await vi.runOnlyPendingTimersAsync();
        expectSyncCycleExecuted(f.context);
      });
    },
    thenPingIntervalContinues: (Then: StepTest["Then"]) => {
      Then("ping interval continues", async () => {
        // Verify another ping fires after 30s
        f.context.mockPing.mockClear();
        f.context.mockPing.mockRejectedValueOnce(new Error("Still failing"));
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
    thenNextPingFiresAfter30Seconds: (And: StepTest["Then"]) => {
      And("next ping fires after 30 seconds", async () => {
        f.context.mockPing.mockClear();
        await vi.advanceTimersByTimeAsync(30000);
        expect(f.context.mockPing).toHaveBeenCalled();
      });
    },
  };
}

// Full sync specific steps
export function createFullSyncGivenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    givenSyncVersionIsN: (Given: StepTest["Given"]) => {
      Given("syncVersion is N", () => {
        f.context.initialSyncVersion = 0;
      });
    },
    givenRegularSyncCycleIsInProgress: (Given: StepTest["Given"]) => {
      Given("a regular sync cycle is in progress", async () => {
        f.context.mockPush.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10000)),
        );
        const pullBtn = screen.getByTestId("pull-btn");
        pullBtn.click();
        await vi.advanceTimersByTimeAsync(0);
      });
    },
  };
}

export function createFullSyncWhenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  return {
    whenUserTriggersFullSync: (When: StepTest["When"]) => {
      When("user triggers full sync", async () => {
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
    whenUserTriggersFullSyncSuccessfully: (When: StepTest["When"]) => {
      When("user triggers full sync successfully", async () => {
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
    whenResetAndPullFails: (And: StepTest["When"]) => {
      And("resetAndPull fails", async () => {
        f.context.mockResetAndPull.mockRejectedValueOnce(
          new Error("Reset failed"),
        );
        const fullSyncBtn = screen.getByTestId("full-sync-btn");
        fullSyncBtn.click();
        await flushSyncCycle();
      });
    },
  };
}

export function createFullSyncThenSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  const baseThenSteps = createThenSteps(f);
  return {
    ...baseThenSteps,
    thenProgressReportsStepsInOrder: (Then: StepTest["Then"]) => {
      Then("progress reports steps in order:", () => {
        const expectedSteps: import("@/types/common").FullSyncStep[] = [
          "reupload_covers",
          "upload_covers",
          "push",
          "pull",
          "download_covers",
          "done",
        ];
        expect(f.context.progressSteps).toEqual(expectedSteps);
      });
    },
    thenPushForceIsCalled: (Then: StepTest["Then"]) => {
      Then("push(force=true) is called", () => {
        expect(f.context.mockPush).toHaveBeenCalledWith(true);
      });
    },
    thenResetAndPullIsCalled: (And: StepTest["Then"]) => {
      And("resetAndPull() is called", () => {
        expect(f.context.mockResetAndPull).toHaveBeenCalled();
      });
    },
    thenSyncVersionBecomesNPlus1: (Then: StepTest["Then"]) => {
      Then("syncVersion becomes N+1", () => {
        expect(f.context.mockResetAndPull).toHaveBeenCalled();
        expect(f.context.progressSteps).toContain("done");
      });
    },
    thenProgressReportsError: (Then: StepTest["Then"]) => {
      Then('progress reports "error"', () => {
        expect(f.context.progressSteps).toContain("error");
      });
    },
    thenFullSyncDoesNotStart: (Then: StepTest["Then"]) => {
      Then("full sync does not start", () => {
        expect(f.context.mockResetAndPull).not.toHaveBeenCalled();
        expect(f.context.mockReuploadLocalCovers).not.toHaveBeenCalled();
      });
    },
  };
}

export function createFullSyncBackgroundSteps(
  f: FeatureDescriibeCallbackParams<SyncTestContext>,
) {
  const baseSteps = createBackgroundSteps(f);
  return {
    ...baseSteps,
    givenSyncProviderMountedAndInitialSyncCompleted: (
      And: StepTest["Given"],
    ) => {
      And("SyncProvider has mounted and initial sync completed", async () => {
        vi.useFakeTimers();
        const onProgress = (step: import("@/types/common").FullSyncStep) => {
          f.context.progressSteps.push(step);
        };
        const { unmount } = renderSyncProviderForFullSync(onProgress);
        f.context.syncProviderUnmount = unmount;
        await flushSyncCycle();
        f.context.mockPull.mockClear();
        f.context.mockPush.mockClear();
        f.context.mockPing.mockClear();
        f.context.mockCoverSync.mockClear();
        f.context.progressSteps = [];
      });
    },
  };
}
