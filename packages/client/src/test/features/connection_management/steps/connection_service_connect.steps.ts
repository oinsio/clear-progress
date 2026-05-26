// implements FR1 of connection-management-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { connect } from "@/services/connectionService";
import type { ConnectionConfig } from "@/types/connection";
import {
  type EventDispatchState,
  setupEventListeners,
} from "./eventListenerSetup";

const feature = await loadFeature("../connection_service_connect.feature");

type FeatureContext = Record<string, never>;

function readSavedConfig(): ConnectionConfig {
  const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
  return JSON.parse(raw ?? "") as ConnectionConfig;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let inputConfig: ConnectionConfig;
    const eventState: EventDispatchState = {
      backendEventDispatched: false,
      googleClientIdEventDispatched: false,
    };

    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    setupEventListeners(f, eventState);

    // @connection-management-spec @FR1
    f.Scenario(
      "Connect saves config with isActive true",
      ({ Given, When, Then, And }) => {
        Given(
          'a GAS config with url "https://example.com" and clientId "client-123"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
              clientId: "client-123",
              isActive: false,
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then("the saved config has isActive true", (_ctx: TestContext) => {
          expect(readSavedConfig().isActive).toBe(true);
        });

        And(
          'the saved config has url "https://example.com"',
          (_ctx: TestContext) => {
            expect(readSavedConfig().url).toBe("https://example.com");
          },
        );

        And(
          'the saved config has clientId "client-123"',
          (_ctx: TestContext) => {
            const saved = readSavedConfig();
            expect(saved.type === "gas" && saved.clientId).toBe("client-123");
          },
        );
      },
    );

    // @connection-management-spec @FR1
    f.Scenario(
      "Connect overwrites isActive false to true",
      ({ Given, When, Then }) => {
        Given("a GAS config with isActive false", (_ctx: TestContext) => {
          inputConfig = {
            type: "gas",
            url: "https://example.com",
            isActive: false,
          };
        });

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then("the saved config has isActive true", (_ctx: TestContext) => {
          expect(readSavedConfig().isActive).toBe(true);
        });
      },
    );

    // @connection-management-spec @FR1
    f.Scenario(
      "Connect dispatches backend connection event",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: false,
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then(
          "a backend connection event was dispatched",
          (_ctx: TestContext) => {
            expect(eventState.backendEventDispatched).toBe(true);
          },
        );
      },
    );

    // @connection-management-spec @FR1
    f.Scenario(
      "Connect dispatches Google client ID event for GAS with clientId",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com" and clientId "client-123"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
              clientId: "client-123",
              isActive: false,
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then("a Google client ID event was dispatched", (_ctx: TestContext) => {
          expect(eventState.googleClientIdEventDispatched).toBe(true);
        });
      },
    );

    // @connection-management-spec @FR1
    f.Scenario(
      "Connect does not dispatch Google client ID event for GAS without clientId",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com" and no clientId',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
              isActive: false,
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then(
          "a Google client ID event was not dispatched",
          (_ctx: TestContext) => {
            expect(eventState.googleClientIdEventDispatched).toBe(false);
          },
        );
      },
    );
  },
);
