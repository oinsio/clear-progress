// implements FR9 of localstorage-refactor
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { ConnectionStore } from "@clear-progress/contract";
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

function readStore(): ConnectionStore {
  const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
  return JSON.parse(raw ?? "null") as ConnectionStore;
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

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect saves config with activeType set",
      ({ Given, When, Then, And }) => {
        Given(
          'a GAS config with url "https://example.com" and clientId "client-123"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
              clientId: "client-123",
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then('the store has activeType "gas"', (_ctx: TestContext) => {
          expect(readStore().activeType).toBe("gas");
        });

        And(
          'the store has gas config with url "https://example.com"',
          (_ctx: TestContext) => {
            expect(readStore().configs.gas?.url).toBe("https://example.com");
          },
        );

        And(
          'the store has gas config with clientId "client-123"',
          (_ctx: TestContext) => {
            expect(readStore().configs.gas?.clientId).toBe("client-123");
          },
        );
      },
    );

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect sets activeType to the config type",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then('the store has activeType "gas"', (_ctx: TestContext) => {
          expect(readStore().activeType).toBe("gas");
        });
      },
    );

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect dispatches backend connection event",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
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

    // @localstorage-refactor @FR9
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

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect does not dispatch Google client ID event for GAS without clientId",
      ({ Given, When, Then }) => {
        Given(
          'a GAS config with url "https://example.com" and no clientId',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "gas",
              url: "https://example.com",
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
