// implements FR10 of localstorage-refactor
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { ConnectionStore } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { STORAGE_KEYS } from "@/constants";
import { connect, disconnect } from "@/services/connectionService";
import {
  type EventDispatchState,
  setupEventListeners,
} from "./eventListenerSetup";

const feature = await loadFeature("../connection_service_disconnect.feature");

type FeatureContext = Record<string, never>;

function readStore(): ConnectionStore | null {
  const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION_CONFIG);
  if (!raw) return null;
  return JSON.parse(raw) as ConnectionStore;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const eventState: EventDispatchState = {
      backendEventDispatched: false,
    };

    f.BeforeEachScenario(() => {
      localStorage.clear();
    });

    setupEventListeners(f, eventState);

    // @localstorage-refactor @FR10
    f.Scenario(
      "Disconnect sets activeType to null and preserves configs",
      ({ Given, When, Then, And }) => {
        Given(
          'an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"',
          (_ctx: TestContext) => {
            connect({
              type: "supabase",
              url: "https://example.supabase.co",
              anonKey: "test-key",
            });
          },
        );

        When("disconnect is called", (_ctx: TestContext) => {
          disconnect();
        });

        Then("the store has activeType null", (_ctx: TestContext) => {
          const store = readStore();
          expect(store?.activeType).toBeNull();
        });

        And(
          'the store has supabase config with url "https://example.supabase.co"',
          (_ctx: TestContext) => {
            const store = readStore();
            expect(store?.configs.supabase?.url).toBe(
              "https://example.supabase.co",
            );
          },
        );

        And(
          'the store has supabase config with anonKey "test-key"',
          (_ctx: TestContext) => {
            const store = readStore();
            expect(store?.configs.supabase?.anonKey).toBe("test-key");
          },
        );
      },
    );

    // @localstorage-refactor @FR10
    f.Scenario(
      "Disconnect removes auth and sync keys",
      ({ Given, And, When, Then }) => {
        Given(
          'an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"',
          (_ctx: TestContext) => {
            connect({
              type: "supabase",
              url: "https://example.supabase.co",
              anonKey: "test-key",
            });
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

    // @localstorage-refactor @FR10
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

    // @localstorage-refactor @FR10
    f.Scenario("Disconnect dispatches events", ({ Given, When, Then }) => {
      Given(
        'an active Supabase connection with url "https://example.supabase.co" and anonKey "test-key"',
        (_ctx: TestContext) => {
          connect({
            type: "supabase",
            url: "https://example.supabase.co",
            anonKey: "test-key",
          });
        },
      );

      When("disconnect is called", (_ctx: TestContext) => {
        disconnect();
      });

      Then("a backend connection event was dispatched", (_ctx: TestContext) => {
        expect(eventState.backendEventDispatched).toBe(true);
      });
    });
  },
);
