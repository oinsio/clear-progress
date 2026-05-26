// implements FR1, FR2, FR5, FR6 of adapter-loader-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";

import {
  mockGasAdapter,
  mockGetAccessToken,
  mockGetConnectionConfig,
  mockSupabaseAdapter,
  mockSupabaseClient,
} from "./adapterTestSetup";

const feature = await loadFeature("../adapter_creation.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let returnedAdapter: SyncAdapter;
    let thrownError: Error | null;

    f.BeforeEachScenario(() => {
      vi.resetModules();
      mockGetConnectionConfig.mockReset();
      thrownError = null;
    });

    // @adapter-loader-spec @FR1 @FR5
    f.Scenario(
      "GAS config creates GAS adapter",
      ({ Given, When, Then, And }) => {
        Given(
          'a connection config with type "gas" and url "https://script.google.com/test"',
          (_ctx: TestContext) => {
            mockGetConnectionConfig.mockReturnValue({
              type: "gas",
              url: "https://script.google.com/test",
            });
          },
        );

        When(
          "the default sync adapter is requested",
          async (_ctx: TestContext) => {
            const { getDefaultSyncAdapter } = await import(
              "@/services/defaultServices"
            );
            returnedAdapter = getDefaultSyncAdapter();
          },
        );

        Then(
          "the GAS adapter factory is called with the config url and getAccessToken",
          async (_ctx: TestContext) => {
            const { createGasAdapter } = await import(
              "@clear-progress/adapter-gas"
            );
            expect(createGasAdapter).toHaveBeenCalledWith(
              "https://script.google.com/test",
              mockGetAccessToken,
            );
          },
        );

        And(
          "the returned adapter is the GAS adapter instance",
          (_ctx: TestContext) => {
            expect(returnedAdapter).toBe(mockGasAdapter);
          },
        );
      },
    );

    // @adapter-loader-spec @FR1 @FR6
    f.Scenario(
      "Supabase config creates Supabase adapter",
      ({ Given, When, Then, And }) => {
        Given(
          'a connection config with type "supabase"',
          (_ctx: TestContext) => {
            mockGetConnectionConfig.mockReturnValue({
              type: "supabase",
              url: "https://abc.supabase.co",
              anonKey: "key",
            });
          },
        );

        When(
          "the default sync adapter is requested",
          async (_ctx: TestContext) => {
            const { getDefaultSyncAdapter } = await import(
              "@/services/defaultServices"
            );
            returnedAdapter = getDefaultSyncAdapter();
          },
        );

        Then(
          "the Supabase adapter factory is called with the Supabase client",
          async (_ctx: TestContext) => {
            const { createSupabaseAdapter } = await import(
              "@clear-progress/adapter-supabase"
            );
            expect(createSupabaseAdapter).toHaveBeenCalledWith(
              mockSupabaseClient,
            );
          },
        );

        And(
          "the returned adapter is the Supabase adapter instance",
          (_ctx: TestContext) => {
            expect(returnedAdapter).toBe(mockSupabaseAdapter);
          },
        );
      },
    );

    // @adapter-loader-spec @FR2
    f.Scenario("No config throws error", ({ Given, When, Then }) => {
      Given("no connection config exists", (_ctx: TestContext) => {
        mockGetConnectionConfig.mockReturnValue(null);
      });

      When(
        "the default sync adapter is requested",
        async (_ctx: TestContext) => {
          try {
            const { getDefaultSyncAdapter } = await import(
              "@/services/defaultServices"
            );
            getDefaultSyncAdapter();
          } catch (e) {
            thrownError = e as Error;
          }
        },
      );

      Then(
        'an error "No backend configured" is thrown',
        (_ctx: TestContext) => {
          expect(thrownError).not.toBeNull();
          expect(thrownError?.message).toBe("No backend configured");
        },
      );
    });
  },
);
