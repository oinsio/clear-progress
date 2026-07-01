// implements sync-orchestration of sync-update
import type {
  FeatureDescriibeCallbackParams,
  StepTest,
} from "@amiceli/vitest-cucumber";
import { vi } from "vitest";
import {
  cleanupRender,
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
  restoreUseAuthMock,
  STABLE_CONNECTION_CONFIG,
  setUseAuthNoToken,
} from "./testSetup";
import type { SyncTestContext } from "./types";

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
    f.context.mockFileSync.mockReset();
    f.context.mockInitializeLocalFiles.mockReset();
    f.context.mockResetAndPull.mockReset();
    f.context.mockReuploadLocalFiles.mockReset();
    f.context.mockEnsureServerFilesAreCached.mockReset();

    f.context.mockPull.mockResolvedValue(undefined);
    f.context.mockPush.mockResolvedValue(undefined);
    f.context.mockPing.mockResolvedValue({
      ok: true,
      app: "Clear Progress",
      version: "1.0",
      initialized: true,
    });
    f.context.mockInit.mockResolvedValue(undefined);
    f.context.mockFileSync.mockResolvedValue(undefined);
    f.context.mockInitializeLocalFiles.mockResolvedValue(undefined);
    f.context.mockResetAndPull.mockResolvedValue(undefined);
    f.context.mockReuploadLocalFiles.mockResolvedValue(undefined);
    f.context.mockEnsureServerFilesAreCached.mockResolvedValue(undefined);

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
  f.context.mockFileSync = mockFileSync;
  f.context.mockInitializeLocalFiles = mockInitializeLocalFiles;
  f.context.mockResetAndPull = mockResetAndPull;
  f.context.mockReuploadLocalFiles = mockReuploadLocalFiles;
  f.context.mockEnsureServerFilesAreCached = mockEnsureServerFilesAreCached;
  f.context.mockSignOut = mockSignOut;
  f.context.mockSilentRefresh = mockSilentRefresh;

  return {
    givenUserIsAuthenticated: (Given: StepTest["Given"]) => {
      Given("user is authenticated with a valid token", () => {
        restoreUseAuthMock();
      });
    },
    givenUserHasNoAccessToken: (Given: StepTest["Given"]) => {
      Given("user has no access token", () => {
        setUseAuthNoToken();
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
