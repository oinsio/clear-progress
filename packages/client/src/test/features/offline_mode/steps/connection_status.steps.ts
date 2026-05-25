// implements FR4 of add-offline-mode-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";

const { mockUseAuth, mockUseSync, mockUseConnectionConfig } = vi.hoisted(
  () => ({
    mockUseAuth: vi.fn(),
    mockUseSync: vi.fn(),
    mockUseConnectionConfig: vi.fn(),
  }),
);

vi.mock("@/app/providers/AuthProvider", () => ({ useAuth: mockUseAuth }));
vi.mock("@/app/providers/SyncProvider", () => ({ useSync: mockUseSync }));
vi.mock("@/hooks/useConnectionConfig", () => ({
  useConnectionConfig: mockUseConnectionConfig,
}));

import type { ConnectionStatus } from "@/hooks/useConnectionStatus";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

const feature = await loadFeature("../connection_status.feature");
type FeatureContext = Record<string, never>;

function deriveStatus(): ConnectionStatus {
  const { result } = renderHook(() => useConnectionStatus());
  return result.current;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let derivedStatus: ConnectionStatus;

    f.BeforeEachScenario(() => {
      mockUseConnectionConfig.mockReturnValue({
        type: "gas",
        clientId: "default-client",
      });
      mockUseAuth.mockReturnValue({ accessToken: "valid-token" });
      mockUseSync.mockReturnValue({ syncStatus: "idle" });
      derivedStatus = undefined as unknown as ConnectionStatus;
    });

    // @add-offline-mode-specs @FR4
    f.Scenario("No backend configured", ({ Given, When, Then }) => {
      Given("no backend connection config exists", (_ctx: TestContext) => {
        mockUseConnectionConfig.mockReturnValue(null);
      });
      When("connection status is derived", (_ctx: TestContext) => {
        derivedStatus = deriveStatus();
      });
      Then('the connection status is "not_configured"', (_ctx: TestContext) => {
        expect(derivedStatus).toBe("not_configured");
      });
    });

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Backend configured with clientId but no access token",
      ({ Given, And, When, Then }) => {
        Given(
          'a backend config with clientId "client-123"',
          (_ctx: TestContext) => {
            mockUseConnectionConfig.mockReturnValue({
              type: "gas",
              clientId: "client-123",
            });
          },
        );
        And("no access token is present", (_ctx: TestContext) => {
          mockUseAuth.mockReturnValue({ accessToken: null });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "no_auth"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("no_auth");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Backend configured without clientId and no access token",
      ({ Given, And, When, Then }) => {
        Given("a backend config without clientId", (_ctx: TestContext) => {
          mockUseConnectionConfig.mockReturnValue({ type: "gas" });
        });
        And("no access token is present", (_ctx: TestContext) => {
          mockUseAuth.mockReturnValue({ accessToken: null });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "synced"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("synced");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Sync status offline produces offline connection",
      ({ Given, And, When, Then }) => {
        Given("an authenticated backend connection", (_ctx: TestContext) => {});
        And('sync status is "offline"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "offline" });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "offline"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("offline");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Sync status error produces error connection",
      ({ Given, And, When, Then }) => {
        Given("an authenticated backend connection", (_ctx: TestContext) => {});
        And('sync status is "error"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "error" });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "error"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("error");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Sync status unauthorized produces unauthorized connection",
      ({ Given, And, When, Then }) => {
        Given("an authenticated backend connection", (_ctx: TestContext) => {});
        And('sync status is "unauthorized"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "unauthorized" });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "unauthorized"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("unauthorized");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Sync status syncing produces syncing connection",
      ({ Given, And, When, Then }) => {
        Given("an authenticated backend connection", (_ctx: TestContext) => {});
        And('sync status is "syncing"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "syncing" });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "syncing"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("syncing");
        });
      },
    );

    // @add-offline-mode-specs @FR4
    f.Scenario(
      "Priority — no_auth takes precedence over sync error",
      ({ Given, And, When, Then }) => {
        Given(
          'a backend config with clientId "client-123"',
          (_ctx: TestContext) => {
            mockUseConnectionConfig.mockReturnValue({
              type: "gas",
              clientId: "client-123",
            });
          },
        );
        And("no access token is present", (_ctx: TestContext) => {
          mockUseAuth.mockReturnValue({ accessToken: null });
        });
        And('sync status is "error"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "error" });
        });
        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });
        Then('the connection status is "no_auth"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("no_auth");
        });
      },
    );
  },
);
