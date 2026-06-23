// implements FR11, FR12 of localstorage-refactor
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { ConnectionStore } from "@clear-progress/contract";
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

function writeStore(store: ConnectionStore): void {
  localStorage.setItem(STORAGE_KEYS.CONNECTION_CONFIG, JSON.stringify(store));
}

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

    // @localstorage-refactor @FR12
    f.Scenario(
      "getConnectionConfig returns config when activeType is set",
      ({ Given, When, Then }) => {
        Given(
          'a connection store with activeType "supabase" and supabase config url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            writeStore({
              activeType: "supabase",
              configs: {
                supabase: {
                  url: "https://example.supabase.co",
                  anonKey: "test-key",
                },
              },
            });
          },
        );

        When("getConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getConnectionConfig();
        });

        Then('the returned config has type "supabase"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("supabase");
        });
      },
    );

    // @localstorage-refactor @FR12
    f.Scenario(
      "getConnectionConfig returns null when activeType is null",
      ({ Given, When, Then }) => {
        Given(
          'a connection store with activeType null and supabase config url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            writeStore({
              activeType: null,
              configs: {
                supabase: {
                  url: "https://example.supabase.co",
                  anonKey: "test-key",
                },
              },
            });
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

    // @localstorage-refactor @FR12
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

    // @localstorage-refactor @FR12
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

    // @localstorage-refactor @FR12
    f.Scenario(
      "getSavedConnectionConfig returns config when activeType is null",
      ({ Given, When, Then }) => {
        Given(
          'a connection store with activeType null and supabase config url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            writeStore({
              activeType: null,
              configs: {
                supabase: {
                  url: "https://example.supabase.co",
                  anonKey: "test-key",
                },
              },
            });
          },
        );

        When("getSavedConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getSavedConnectionConfig();
        });

        Then('the returned config has type "supabase"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("supabase");
        });
      },
    );

    // @localstorage-refactor @FR12
    f.Scenario(
      "getSavedConnectionConfig returns config when activeType is set",
      ({ Given, When, Then }) => {
        Given(
          'a connection store with activeType "supabase" and supabase config url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            writeStore({
              activeType: "supabase",
              configs: {
                supabase: {
                  url: "https://example.supabase.co",
                  anonKey: "test-key",
                },
              },
            });
          },
        );

        When("getSavedConnectionConfig is called", (_ctx: TestContext) => {
          returnedConfig = getSavedConnectionConfig();
        });

        Then('the returned config has type "supabase"', (_ctx: TestContext) => {
          expect(returnedConfig).not.toBeNull();
          expect(returnedConfig?.type).toBe("supabase");
        });
      },
    );

    // @localstorage-refactor @FR12
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

    // @localstorage-refactor @FR12
    f.Scenario("getBackendType returns supabase", ({ Given, When, Then }) => {
      Given(
        'a connection store with activeType "supabase" and supabase config url "https://example.supabase.co"',
        (_ctx: TestContext) => {
          writeStore({
            activeType: "supabase",
            configs: {
              supabase: {
                url: "https://example.supabase.co",
                anonKey: "anon-key-123",
              },
            },
          });
        },
      );

      When("getBackendType is called", (_ctx: TestContext) => {
        returnedBackendType = getBackendType();
      });

      Then('the backend type is "supabase"', (_ctx: TestContext) => {
        expect(returnedBackendType).toBe("supabase");
      });
    });

    // @localstorage-refactor @FR12
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
