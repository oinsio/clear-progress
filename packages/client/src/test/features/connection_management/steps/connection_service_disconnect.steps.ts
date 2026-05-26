// implements FR2 of connection-management-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { disconnect } from "@/services/connectionService";
import type { ConnectionConfig } from "@/types/connection";
import {
  type EventDispatchState,
  setupEventListeners,
} from "./eventListenerSetup";

const feature = await loadFeature("../connection_service_disconnect.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const eventState: EventDispatchState = {
      backendEventDispatched: false,
      googleClientIdEventDispatched: false,
    };

    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    setupEventListeners(f, eventState);

    // @connection-management-spec @FR2
    f.Scenario(
      "Disconnect sets isActive to false",
      ({ Given, When, Then, And }) => {
        Given(
          'an active GAS connection config with url "https://example.com" and clientId "client-123"',
          (_ctx: TestContext) => {
            const config: ConnectionConfig = {
              type: "gas",
              url: "https://example.com",
              clientId: "client-123",
              isActive: true,
            };
            localStorage.setItem(
              STORAGE_KEYS.CONNECTION_CONFIG,
              JSON.stringify(config),
            );
          },
        );

        When("disconnect is called", (_ctx: TestContext) => {
          disconnect();
        });

        Then("the saved config has isActive false", (_ctx: TestContext) => {
          const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
          const saved = JSON.parse(raw ?? "") as ConnectionConfig;
          expect(saved.isActive).toBe(false);
        });

        And(
          'the saved config has url "https://example.com"',
          (_ctx: TestContext) => {
            const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
            const saved = JSON.parse(raw ?? "") as ConnectionConfig;
            expect(saved.url).toBe("https://example.com");
          },
        );

        And(
          'the saved config has clientId "client-123"',
          (_ctx: TestContext) => {
            const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
            const saved = JSON.parse(raw ?? "") as ConnectionConfig;
            expect(saved.type === "gas" && saved.clientId).toBe("client-123");
          },
        );
      },
    );

    // @connection-management-spec @FR2
    f.Scenario(
      "Disconnect removes auth and sync keys",
      ({ Given, And, When, Then }) => {
        Given(
          'an active GAS connection config with url "https://example.com"',
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

        And("auth keys exist in localStorage", (_ctx: TestContext) => {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, "token-abc");
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, "999999");
          localStorage.setItem(STORAGE_KEYS.USER_PICTURE, "pic.jpg");
        });

        And("sync keys exist in localStorage", (_ctx: TestContext) => {
          localStorage.setItem(
            STORAGE_KEYS.LAST_SYNC,
            "2026-01-01T00:00:00.000Z",
          );
          localStorage.setItem(
            STORAGE_KEYS.SETTINGS_UPDATED_AT,
            "2026-01-01T00:00:00.000Z",
          );
        });

        When("disconnect is called", (_ctx: TestContext) => {
          disconnect();
        });

        Then("auth keys are removed from localStorage", (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
          expect(
            localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT),
          ).toBeNull();
          expect(localStorage.getItem(STORAGE_KEYS.USER_PICTURE)).toBeNull();
        });

        And("sync keys are removed from localStorage", (_ctx: TestContext) => {
          expect(localStorage.getItem(STORAGE_KEYS.LAST_SYNC)).toBeNull();
          expect(
            localStorage.getItem(STORAGE_KEYS.SETTINGS_UPDATED_AT),
          ).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR2
    f.Scenario(
      "Disconnect handles missing config gracefully",
      ({ Given, When, Then }) => {
        Given(
          "no connection config exists in localStorage",
          (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.CONNECTION_CONFIG);
          },
        );

        When("disconnect is called", (_ctx: TestContext) => {
          disconnect();
        });

        Then("no error is thrown", (_ctx: TestContext) => {
          expect(
            localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG),
          ).toBeNull();
        });
      },
    );

    // @connection-management-spec @FR2
    f.Scenario("Disconnect dispatches events", ({ Given, When, Then, And }) => {
      Given(
        'an active GAS connection config with url "https://example.com"',
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

      When("disconnect is called", (_ctx: TestContext) => {
        disconnect();
      });

      Then("a backend connection event was dispatched", (_ctx: TestContext) => {
        expect(eventState.backendEventDispatched).toBe(true);
      });

      And("a Google client ID event was dispatched", (_ctx: TestContext) => {
        expect(eventState.googleClientIdEventDispatched).toBe(true);
      });
    });
  },
);
