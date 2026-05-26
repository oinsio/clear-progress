// implements FR7 of connection-management-spec
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

const feature = await loadFeature("../connection_status_derivation.feature");
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

    // @connection-management-spec @FR7
    f.Scenario("No config returns not_configured", ({ Given, When, Then }) => {
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

    // @connection-management-spec @FR7
    f.Scenario(
      "GAS with clientId but no token returns no_auth",
      ({ Given, And, When, Then }) => {
        Given(
          'a GAS config with clientId "client-123" exists',
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

    // @connection-management-spec @FR7
    f.Scenario(
      "GAS without clientId and no token returns synced",
      ({ Given, And, When, Then }) => {
        Given("a GAS config without clientId exists", (_ctx: TestContext) => {
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

    // @connection-management-spec @FR7
    f.Scenario(
      "Sync status offline maps to offline",
      ({ Given, And, When, Then }) => {
        Given(
          "an authenticated backend connection exists",
          (_ctx: TestContext) => {
            // Default mock is already authenticated
          },
        );

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

    // @connection-management-spec @FR7
    f.Scenario(
      "Sync status error maps to error",
      ({ Given, And, When, Then }) => {
        Given(
          "an authenticated backend connection exists",
          (_ctx: TestContext) => {},
        );

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

    // @connection-management-spec @FR7
    f.Scenario(
      "Sync status unauthorized maps to unauthorized",
      ({ Given, And, When, Then }) => {
        Given(
          "an authenticated backend connection exists",
          (_ctx: TestContext) => {},
        );

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

    // @connection-management-spec @FR7
    f.Scenario(
      "Sync status syncing maps to syncing",
      ({ Given, And, When, Then }) => {
        Given(
          "an authenticated backend connection exists",
          (_ctx: TestContext) => {},
        );

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

    // @connection-management-spec @FR7
    f.Scenario(
      "Default sync status maps to synced",
      ({ Given, And, When, Then }) => {
        Given(
          "an authenticated backend connection exists",
          (_ctx: TestContext) => {},
        );

        And('sync status is "idle"', (_ctx: TestContext) => {
          mockUseSync.mockReturnValue({ syncStatus: "idle" });
        });

        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });

        Then('the connection status is "synced"', (_ctx: TestContext) => {
          expect(derivedStatus).toBe("synced");
        });
      },
    );

    // @connection-management-spec @FR7
    f.Scenario(
      "not_configured takes precedence over no_auth",
      ({ Given, And, When, Then }) => {
        Given("no backend connection config exists", (_ctx: TestContext) => {
          mockUseConnectionConfig.mockReturnValue(null);
        });

        And("no access token is present", (_ctx: TestContext) => {
          mockUseAuth.mockReturnValue({ accessToken: null });
        });

        When("connection status is derived", (_ctx: TestContext) => {
          derivedStatus = deriveStatus();
        });

        Then(
          'the connection status is "not_configured"',
          (_ctx: TestContext) => {
            expect(derivedStatus).toBe("not_configured");
          },
        );
      },
    );

    // @connection-management-spec @FR7
    f.Scenario(
      "no_auth takes precedence over sync error",
      ({ Given, And, When, Then }) => {
        Given(
          'a GAS config with clientId "client-123" exists',
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
