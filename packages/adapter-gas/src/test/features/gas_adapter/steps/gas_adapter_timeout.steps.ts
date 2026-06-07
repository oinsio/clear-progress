// implements FR4 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { InitResponse } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { GasSyncAdapter } from "../../../../client";
import {
  createValidInitResponse,
  extractFetchOptions,
  type FeatureContext,
  GAS_URL,
  VALID_TOKEN,
} from "./gas-adapter-test-utils";

const feature = await loadFeature("../gas_adapter_timeout.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: GasSyncAdapter;
    let mockFetch: ReturnType<typeof vi.fn>;
    let initResult: InitResponse | undefined;
    let clearTimeoutSpy: ReturnType<typeof vi.spyOn>;

    f.BeforeEachScenario(() => {
      vi.restoreAllMocks();
      adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
      mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
      clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      initResult = undefined;
    });

    // @gas-adapter-specs-and-bdd @FR4
    f.Scenario(
      "Request completes within timeout normally",
      ({ Given, When, Then, And }) => {
        Given("the server responds quickly with a valid init response", () => {
          mockFetch.mockResolvedValue(createValidInitResponse());
        });

        When(
          "adapter calls init with timeout tracking",
          async (_ctx: TestContext) => {
            initResult = await adapter.init();
          },
        );

        Then(
          "the response is returned successfully",
          async (_ctx: TestContext) => {
            expect(initResult).toEqual({ ok: true });
          },
        );

        And("the timeout timer is cleared", async (_ctx: TestContext) => {
          expect(clearTimeoutSpy).toHaveBeenCalled();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR4
    f.Scenario("Abort signal is passed to fetch", ({ When, Then }) => {
      When(
        "adapter calls init with timeout tracking",
        async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidInitResponse());
          await adapter.init();
        },
      );

      Then(
        "the fetch request includes an AbortSignal",
        async (_ctx: TestContext) => {
          expect(extractFetchOptions(mockFetch).signal).toBeInstanceOf(
            AbortSignal,
          );
        },
      );
    });
  },
);
