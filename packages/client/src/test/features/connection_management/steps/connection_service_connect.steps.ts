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
          'a Supabase config with url "https://example.supabase.co" and anonKey "test-key"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "supabase",
              url: "https://example.supabase.co",
              anonKey: "test-key",
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then('the store has activeType "supabase"', (_ctx: TestContext) => {
          expect(readStore().activeType).toBe("supabase");
        });

        And(
          'the store has supabase config with url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            expect(readStore().configs.supabase?.url).toBe(
              "https://example.supabase.co",
            );
          },
        );

        And(
          'the store has supabase config with anonKey "test-key"',
          (_ctx: TestContext) => {
            expect(readStore().configs.supabase?.anonKey).toBe("test-key");
          },
        );
      },
    );

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect sets activeType to the config type",
      ({ Given, When, Then }) => {
        Given(
          'a Supabase config with url "https://example.supabase.co" and anonKey "anon-key"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "supabase",
              url: "https://example.supabase.co",
              anonKey: "anon-key",
            };
          },
        );

        When("connect is called with the config", (_ctx: TestContext) => {
          connect(inputConfig);
        });

        Then('the store has activeType "supabase"', (_ctx: TestContext) => {
          expect(readStore().activeType).toBe("supabase");
        });
      },
    );

    // @localstorage-refactor @FR9
    f.Scenario(
      "Connect dispatches backend connection event",
      ({ Given, When, Then }) => {
        Given(
          'a Supabase config with url "https://example.supabase.co" and anonKey "anon-key"',
          (_ctx: TestContext) => {
            inputConfig = {
              type: "supabase",
              url: "https://example.supabase.co",
              anonKey: "anon-key",
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
  },
);
