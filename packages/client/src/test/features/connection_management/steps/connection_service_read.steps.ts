// implements FR3, FR4, FR5 of connection-management-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import {
  getBackendType,
  getConnectionConfig,
  getSavedConnectionConfig,
} from "@/services/connectionService";
import type { BackendType, ConnectionConfig } from "@/types/connection";

const feature = await loadFeature("../connection_service_read.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let returnedConfig: ConnectionConfig | null;
    let returnedBackendType: BackendType | null;

    f.BeforeEachScenario(() => {
      localStorage.clear();
      returnedConfig = null;
      returnedBackendType = null;
    });

    // @connection-management-spec @FR3
    f.Scenario(
      "getConnectionConfig returns active config",
      ({ Given, When, Then }) => {
        Given(
          "a valid GAS config with isActive true exists in localStorage",
          (_ctx: TestContext) => {
            const config: ConnectionConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: true,
            };
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              JSON.stringify(config),
            );
          },
        );

        When("getConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getConnectionConfig();
        });

        Then('the returned config has type "gas"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("gas");
        });
      },
    );

    // @connection-management-spec @FR3
    f.Scenario(
      "getConnectionConfig returns null for inactive config",
      ({ Given, When, Then }) => {
        Given(
          "a valid GAS config with isActive false exists in localStorage",
          (_ctx: TestContext) => {
            const config: ConnectionConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: false,
            };
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              JSON.stringify(config),
            );
          },
        );

        When("getConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getConnectionConfig();
        });

        Then("the result is null", (_ctx: TestContext) => {
          expect(returnedConfig).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR3
    f.Scenario(
      "getConnectionConfig returns null for missing config",
      ({ Given, When, Then }) => {
        Given(
          "no connection config exists in localStorage",
          (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.CONNECTION_CONFIG);
          },
        );

        When("getConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getConnectionConfig();
        });

        Then("the result is null", (_ctx: TestContext) => {
          expect(returnedConfig).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR3
    f.Scenario(
      "getConnectionConfig returns null for invalid config",
      ({ Given, When, Then }) => {
        Given(
          "invalid JSON exists in the connection config storage key",
          (_ctx: TestContext) => {
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              "not-valid-json{{{",
            );
          },
        );

        When("getConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getConnectionConfig();
        });

        Then("the result is null", (_ctx: TestContext) => {
          expect(returnedConfig).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR4
    f.Scenario(
      "getSavedConnectionConfig returns inactive config",
      ({ Given, When, Then }) => {
        Given(
          "a valid GAS config with isActive false exists in localStorage",
          (_ctx: TestContext) => {
            const config: ConnectionConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: false,
            };
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              JSON.stringify(config),
            );
          },
        );

        When("getSavedConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getSavedConnectionConfig();
        });

        Then('the returned config has type "gas"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("gas");
        });
      },
    );

    // @connection-management-spec @FR4
    f.Scenario(
      "getSavedConnectionConfig returns active config",
      ({ Given, When, Then }) => {
        Given(
          "a valid GAS config with isActive true exists in localStorage",
          (_ctx: TestContext) => {
            const config: ConnectionConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: true,
            };
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              JSON.stringify(config),
            );
          },
        );

        When("getSavedConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getSavedConnectionConfig();
        });

        Then('the returned config has type "gas"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("gas");
        });
      },
    );

    // @connection-management-spec @FR4
    f.Scenario(
      "getSavedConnectionConfig returns null for missing config",
      ({ Given, When, Then }) => {
        Given(
          "no connection config exists in localStorage",
          (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.CONNECTION_CONFIG);
          },
        );

        When("getSavedConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getSavedConnectionConfig();
        });

        Then("the result is null", (_ctx: TestContext) => {
          expect(returnedConfig).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR5
    f.Scenario("getBackendType returns gas", ({ Given, When, Then }) => {
      Given(
        "a valid GAS config with isActive true exists in localStorage",
        (_ctx: TestContext) => {
          const config: ConnectionConfig = {
            type: "gas",
            url: "https://example.com",
            isActive: true,
          };
          localStorage.setItem(
            STORAGE_KEYS.CONNECTION_CONFIG,
            JSON.stringify(config),
          );
        },
      );

      When("getBackendType is called", (_ctx: TestContext) => {
        returnedBackendType = getBackendType();
      });

      Then('the backend type is "gas"', (_ctx: TestContext) => {
        expect(returnedBackendType).toBe("gas");
      });
    });

    // @connection-management-spec @FR5
    f.Scenario("getBackendType returns supabase", ({ Given, When, Then }) => {
      Given(
        "a valid Supabase config with isActive true exists in localStorage",
        (_ctx: TestContext) => {
          const config: ConnectionConfig = {
            type: "supabase",
            url: "https://example.supabase.co",
            anonKey: "anon-key-123",
            isActive: true,
          };
          localStorage.setItem(
            STORAGE_KEYS.CONNECTION_CONFIG,
            JSON.stringify(config),
          );
        },
      );

      When("getBackendType is called", (_ctx: TestContext) => {
        returnedBackendType = getBackendType();
      });

      Then('the backend type is "supabase"', (_ctx: TestContext) => {
        expect(returnedBackendType).toBe("supabase");
      });
    });

    // @connection-management-spec @FR5
    f.Scenario(
      "getBackendType returns null when no active config",
      ({ Given, When, Then }) => {
        Given(
          "no connection config exists in localStorage",
          (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.CONNECTION_CONFIG);
          },
        );

        When("getBackendType is called", (_ctx: TestContext) => {
          returnedBackendType = getBackendType();
        });

        Then("the backend type is null", (_ctx: TestContext) => {
          expect(returnedBackendType).toBeNull();
        });
      },
    );
  },
);
