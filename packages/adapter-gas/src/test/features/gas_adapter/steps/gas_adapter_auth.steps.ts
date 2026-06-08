// implements FR1, FR3 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { ApiAuthError } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { GasSyncAdapter } from "../../../../client";
import {
  createValidInitResponse,
  extractRequestBody,
  type FeatureContext,
  GAS_URL,
  VALID_TOKEN,
} from "./gas-adapter-test-utils";

const feature = await loadFeature("../gas_adapter_auth.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: GasSyncAdapter;
    let mockFetch: ReturnType<typeof vi.fn>;
    let caughtError: unknown;

    f.BeforeEachScenario(() => {
      vi.restoreAllMocks();
      mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
      caughtError = undefined;
    });

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "Null token throws ApiAuthError without HTTP request",
      ({ Given, When, Then, And }) => {
        Given("the access token is null", () => {
          adapter = new GasSyncAdapter(GAS_URL, () => null);
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          try {
            await adapter.init();
          } catch (error) {
            caughtError = error;
          }
        });

        Then("ApiAuthError is thrown", async (_ctx: TestContext) => {
          expect(caughtError).toBeInstanceOf(ApiAuthError);
        });

        And("no HTTP request is made", async (_ctx: TestContext) => {
          expect(mockFetch).not.toHaveBeenCalled();
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "UNAUTHORIZED in response body throws ApiAuthError",
      ({ Given, When, Then, And }) => {
        Given("the access token is valid", () => {
          adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
        });

        And("the server responds with UNAUTHORIZED error", () => {
          mockFetch.mockResolvedValue(
            new Response(
              JSON.stringify({
                ok: false,
                error: "UNAUTHORIZED",
                message: "Not authorized",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          );
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          try {
            await adapter.init();
          } catch (error) {
            caughtError = error;
          }
        });

        Then("ApiAuthError is thrown", async (_ctx: TestContext) => {
          expect(caughtError).toBeInstanceOf(ApiAuthError);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR1
    f.Scenario(
      "Valid token is included in request body",
      ({ Given, When, Then }) => {
        Given("the access token is valid", () => {
          adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          mockFetch.mockResolvedValue(createValidInitResponse());
          await adapter.init();
        });

        Then(
          "the request body contains the valid token",
          async (_ctx: TestContext) => {
            expect(extractRequestBody(mockFetch).access_token).toBe(
              VALID_TOKEN,
            );
          },
        );
      },
    );
  },
);
