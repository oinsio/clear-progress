// implements FR3 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { InitResponse } from "@clear-progress/contract";
import { ApiValidationError } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { GasSyncAdapter } from "../../../../client";
import {
  createValidInitResponse,
  type FeatureContext,
  GAS_URL,
  VALID_TOKEN,
} from "./gas-adapter-test-utils";

const feature = await loadFeature("../gas_adapter_validation.feature");

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: GasSyncAdapter;
    let mockFetch: ReturnType<typeof vi.fn>;
    let caughtError: unknown;
    let initResult: InitResponse | undefined;

    f.BeforeEachScenario(() => {
      vi.restoreAllMocks();
      adapter = new GasSyncAdapter(GAS_URL, () => VALID_TOKEN);
      mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);
      caughtError = undefined;
      initResult = undefined;
    });

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "Valid response passes Zod validation",
      ({ Given, When, Then }) => {
        Given("the server responds with a valid init response", () => {
          mockFetch.mockResolvedValue(createValidInitResponse());
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          initResult = await adapter.init();
        });

        Then(
          "the response is returned successfully",
          async (_ctx: TestContext) => {
            expect(initResult).toEqual({ ok: true });
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "Invalid response shape throws ApiValidationError",
      ({ Given, When, Then }) => {
        Given("the server responds with an invalid shape", () => {
          mockFetch.mockResolvedValue(
            new Response(JSON.stringify({ invalid: "data" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          try {
            await adapter.init();
          } catch (error) {
            caughtError = error;
          }
        });

        Then(
          'ApiValidationError is thrown for action "init"',
          async (_ctx: TestContext) => {
            expect(caughtError).toBeInstanceOf(ApiValidationError);
            expect((caughtError as ApiValidationError).message).toContain(
              "init",
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "Ping with non-JSON response throws error",
      ({ Given, When, Then }) => {
        Given("the server responds with non-JSON content for ping", () => {
          mockFetch.mockResolvedValue(
            new Response("not json", {
              status: 200,
              headers: { "Content-Type": "text/html" },
            }),
          );
        });

        When("adapter pings the server", async (_ctx: TestContext) => {
          try {
            await adapter.ping();
          } catch (error) {
            caughtError = error;
          }
        });

        Then(
          'an error with message "Invalid response: expected JSON" is thrown',
          async (_ctx: TestContext) => {
            expect(caughtError).toBeInstanceOf(Error);
            expect((caughtError as Error).message).toBe(
              "Invalid response: expected JSON",
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "Ping with invalid schema throws ApiValidationError",
      ({ Given, When, Then }) => {
        Given("the server responds with invalid schema for ping", () => {
          mockFetch.mockResolvedValue(
            new Response(JSON.stringify({ wrong: "shape" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        });

        When("adapter pings the server", async (_ctx: TestContext) => {
          try {
            await adapter.ping();
          } catch (error) {
            caughtError = error;
          }
        });

        Then(
          'ApiValidationError is thrown for action "ping"',
          async (_ctx: TestContext) => {
            expect(caughtError).toBeInstanceOf(ApiValidationError);
            expect((caughtError as ApiValidationError).message).toContain(
              "ping",
            );
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR3
    f.Scenario(
      "HTTP 500 throws error with status code",
      ({ Given, When, Then }) => {
        Given("the server responds with HTTP status 500", () => {
          mockFetch.mockResolvedValue(
            new Response("Internal Server Error", { status: 500 }),
          );
        });

        When("adapter calls init", async (_ctx: TestContext) => {
          try {
            await adapter.init();
          } catch (error) {
            caughtError = error;
          }
        });

        Then(
          'an error with message "HTTP error: 500" is thrown',
          async (_ctx: TestContext) => {
            expect(caughtError).toBeInstanceOf(Error);
            expect((caughtError as Error).message).toBe("HTTP error: 500");
          },
        );
      },
    );
  },
);
