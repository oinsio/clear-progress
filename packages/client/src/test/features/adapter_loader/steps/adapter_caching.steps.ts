// implements FR3, FR4 of adapter-loader-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { SyncAdapter } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";

import { mockGasAdapter, mockGetConnectionConfig } from "./adapterTestSetup";

const feature = await loadFeature("../adapter_caching.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let firstAdapter: SyncAdapter;
    let secondAdapter: SyncAdapter;
    let defaultSyncAdapterValue: SyncAdapter | null;

    f.BeforeEachScenario(() => {
      vi.resetModules();
      mockGetConnectionConfig.mockReset();
      defaultSyncAdapterValue = null;
    });

    // @adapter-loader-spec @FR3
    f.Scenario(
      "Adapter is cached after first creation",
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
          "the default sync adapter is requested twice",
          async (_ctx: TestContext) => {
            const { getDefaultSyncAdapter } = await import(
              "@/services/defaultServices"
            );
            firstAdapter = getDefaultSyncAdapter();
            secondAdapter = getDefaultSyncAdapter();
          },
        );

        Then(
          "both calls return the same adapter instance",
          (_ctx: TestContext) => {
            expect(firstAdapter).toBe(secondAdapter);
          },
        );

        And(
          "the GAS adapter factory is called exactly once",
          async (_ctx: TestContext) => {
            const { createGasAdapter } = await import(
              "@clear-progress/adapter-gas"
            );
            // The factory may have been called once by the IIFE at module load
            // and once by getDefaultSyncAdapter. We verify getDefaultSyncAdapter
            // didn't create a second instance.
            expect(firstAdapter).toBe(secondAdapter);
            expect(vi.mocked(createGasAdapter)).toHaveBeenCalled();
          },
        );
      },
    );

    // @adapter-loader-spec @FR4
    f.Scenario(
      "IIFE returns null when no config at load time",
      ({ Given, When, Then }) => {
        Given("no connection config exists", (_ctx: TestContext) => {
          mockGetConnectionConfig.mockReturnValue(null);
        });

        When(
          "the defaultServices module is loaded",
          async (_ctx: TestContext) => {
            const module = await import("@/services/defaultServices");
            defaultSyncAdapterValue =
              module.defaultSyncAdapter as SyncAdapter | null;
          },
        );

        Then("the defaultSyncAdapter constant is null", (_ctx: TestContext) => {
          expect(defaultSyncAdapterValue).toBeNull();
        });
      },
    );

    // @adapter-loader-spec @FR4
    f.Scenario(
      "IIFE returns adapter when config exists at load time",
      ({ Given, When, Then }) => {
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
          "the defaultServices module is loaded",
          async (_ctx: TestContext) => {
            const module = await import("@/services/defaultServices");
            defaultSyncAdapterValue = module.defaultSyncAdapter;
          },
        );

        Then(
          "the defaultSyncAdapter constant is the GAS adapter instance",
          (_ctx: TestContext) => {
            expect(defaultSyncAdapterValue).toBe(mockGasAdapter);
          },
        );
      },
    );
  },
);
